// content.js
window.addEventListener('load', function() {
  let pageTitleSelector, contentSelector, utilDivSelector;

  if (window.location.hostname === 'quasarzone.com') {
    pageTitleSelector = 'h1.title.pr-0';
    contentSelector = '#new_contents, .__se_tbl td';
    utilDivSelector = '#content > div > div.sub-content-wrap > div.view-content-wrap > div.view-content-area > div.view-title-wrap > div.util';
  } else if (window.location.hostname === 'quasarplay.com') {
    pageTitleSelector = '#full_content > div.post > div.title_wrapper > h2';
    contentSelector = '#new_contents, .__se_tbl td';
    utilDivSelector = '#full_content > div.post > div.meta_wrapper > div.meta > p';
  } else {
    return;
  }

  const utilDiv = document.querySelector(utilDivSelector);

  if (utilDiv && !utilDiv.querySelector('.summary-button-container')) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'summary-button-container';
    buttonContainer.style.float = 'right';

    const button = document.createElement('button');
    button.className = 'summary-button';
    button.title = '본문 요약'; // 설명 추가
    button.style.cssText = `
      margin-left: 10px;
      width: 20px;
      height: 20px;
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      top: 2px;
    `;

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icon.svg');
    img.style.width = '20px';
    img.style.height = '20px';

    button.appendChild(img);
    buttonContainer.appendChild(button);

    button.addEventListener('click', function() {
      showPopup(pageTitleSelector, contentSelector);
    });

    utilDiv.appendChild(buttonContainer);
  }

  let popupOverlay = null;  // 팝업 중복 방지용 변수

  function showPopup(pageTitleSelector, contentSelector) {
    const pageTitleElement = document.querySelector(pageTitleSelector);
    const pageTitle = pageTitleElement ? pageTitleElement.innerText : '제목을 찾을 수 없습니다';

    const contentElements = document.querySelectorAll(contentSelector);
    const contentText = Array.from(contentElements)
      .map(element => {
        const paragraphs = element.querySelectorAll('p');
        return Array.from(paragraphs).map(p => p.textContent.trim()).join('\n');
      })
      .join('\n');

    // Create popup with loading animation
    if (popupOverlay) {
      document.body.removeChild(popupOverlay);
      popupOverlay = null;
    }
    popupOverlay = createPopup(pageTitle, '로딩 중...', true);

    fetch('https://apis.uiharu.dev/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: contentText, num_sentences: 3 })
    })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Text must have more than 5 sentences.') {
        document.body.removeChild(popupOverlay);
        popupOverlay = createPopup(pageTitle, '원문이 너무 짧아 요약하지 않았습니다.');
      } else if (data.message === 'No text provided') {
        document.body.removeChild(popupOverlay);
        popupOverlay = createPopup(pageTitle, '원문 텍스트가 없습니다. 이미지나 영상으로 된 원문인 것 같습니다.');
      } else {
        const summary1 = data.data.result;
        const summary2 = data.data.result2;
        document.body.removeChild(popupOverlay);
        popupOverlay = createPopup(pageTitle, [summary1, summary2]);
      }
    })
    .catch(error => {
      if (error.message.includes('503')) {
        document.body.removeChild(popupOverlay);
        popupOverlay = createPopup(pageTitle, '서버에 문제가 있습니다. <a href="https://https://www.gaon.xyz/notice/category/4659" class="notice-link">공지사항</a>을 확인해 주세요!');
      } else {
        console.error('Error:', error);
        document.body.removeChild(popupOverlay);
        popupOverlay = createPopup(pageTitle, '요약하는 중 오류가 발생했습니다.', true);
      }
    });
  }

  function createPopup(titleText, messages, isLoading = false, isRetry = false) {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'popup-container';

    const header = document.createElement('div');
    header.className = 'popup-header';

    const iconImg = document.createElement('img');
    iconImg.src = chrome.runtime.getURL('icon.svg');
    iconImg.style.width = '20px';
    iconImg.style.height = '20px';
    iconImg.style.marginRight = '10px';

    const title = document.createElement('h2');
    title.innerText = '감귤 요약봇';

    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.appendChild(iconImg);
    titleContainer.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.className = 'close-btn';
    closeButton.innerHTML = '&times;';

    const infoText = document.createElement('p');
    infoText.className = 'info-text';
    infoText.innerHTML = 'AI를 통해 본문을 요약했습니다. 정확한 내용을 확인하기 위해 본문을 읽으시는 것을 권장합니다';

    const questionIcon = document.createElement('img');
    questionIcon.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23000%22%3E%3Cpath%20d%3D%22M12%202C6.48%202%202%206.48%202%2012s4.48%2010%2010%2010%2010-4.48%2010-10S17.52%202%2012%202zm0%2018c-4.41%200-8-3.59-8-8s3.59-8%208-8%208%203.59%208%208-3.59%208-8%208zm-1-7h2v2h-2zm0-2h2v6h-2zm0-8h2v2h-2z%22/%3E%3C/svg%3E';
    questionIcon.style.width = '16px';
    questionIcon.style.height = '16px';
    questionIcon.style.cursor = 'pointer';
    questionIcon.style.marginLeft = '5px';

    const content = document.createElement('div');
    content.className = 'popup-content';

    if (isLoading) {
      content.innerHTML = `
        <div class="loader"></div>
        <p>로딩 중...</p>
      `;
    } else if (typeof messages === 'string') {
      content.innerHTML = `
        <h3 class="popup-title">${titleText}</h3>
        <p>${messages}</p>
      `;
    } else {
      content.innerHTML = `
        <div class="tabs">
          <button class="tab-button active" data-tab="tab1">요약 1</button>
          <button class="tab-button" data-tab="tab2">요약 2</button>
        </div>
        <div class="tab-content">
          <div id="tab1" class="tab active">
            <h3 class="popup-title">${titleText}</h3>
            <p>${messages[0]}</p>
          </div>
          <div id="tab2" class="tab">
            <h3 class="popup-title">${titleText}</h3>
            <p>${messages[1]}</p>
          </div>
        </div>
      `;
    }

    const infoContainer = document.createElement('div');
    infoContainer.style.display = 'flex';
    infoContainer.style.alignItems = 'center';
    infoContainer.style.marginTop = '10px';
    infoContainer.appendChild(infoText);
    infoContainer.appendChild(questionIcon);

    header.appendChild(titleContainer);
    header.appendChild(closeButton);
    popup.appendChild(header);
    popup.appendChild(infoContainer);
    popup.appendChild(content);
    overlay.appendChild(popup);

    if (isRetry) {
      const retryButton = document.createElement('button');
      retryButton.className = 'retry-btn';
      retryButton.innerText = '재시도';
      retryButton.style.marginLeft = '10px';
      infoContainer.appendChild(retryButton);

      retryButton.addEventListener('click', function() {
        showPopup(pageTitleSelector, contentSelector);
      });
    }

    closeButton.addEventListener('click', function() {
      document.body.removeChild(overlay);
      popupOverlay = null;
    });

    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) {
        document.body.removeChild(overlay);
        popupOverlay = null;
      }
    });

    questionIcon.addEventListener('click', function() {
      window.open('https://www.gaon.xyz/notice/4660', '_blank');
    });

    document.body.appendChild(overlay);

    // Add tab functionality
    if (!isLoading && !isRetry && Array.isArray(messages)) {
      const tabButtons = popup.querySelectorAll('.tab-button');
      const tabs = popup.querySelectorAll('.tab');

      tabButtons.forEach(button => {
        button.addEventListener('click', function() {
          tabButtons.forEach(btn => btn.classList.remove('active'));
          tabs.forEach(tab => tab.classList.remove('active'));

          button.classList.add('active');
          popup.querySelector(`#${button.getAttribute('data-tab')}`).classList.add('active');
        });
      });
    }

    return overlay;  // 팝업 오버레이 반환
  }

  const style = document.createElement('style');
  style.innerHTML = `
    .popup-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .popup-container {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      max-width: 90%;
      width: 600px;
      max-height: 80%;
      overflow-y: auto;
      position: relative;
    }

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      margin-bottom: 15px;
      padding-bottom: 10px;
    }

    .popup-header h2 {
      margin: 0;
      font-size: 1.2em;
      font-weight: bold;
      color: #000;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5em;
      cursor: pointer;
    }

    .info-text {
      margin: 0;
      font-size: 0.9em;
      color: #666;
    }

    .popup-content {
      margin-top: 10px;
    }

    .popup-content p {
      margin: 10px 0;
      color: #000;
      line-height: 1.8;
    }

    .popup-content h3.popup-title {
      margin: 20px 0 10px;
      font-size: 1.3em;
      font-weight: bold;
      color: #000;
    }

    .tabs {
      display: flex;
      margin-bottom: 10px;
    }

    .tab-button {
      padding: 10px 20px;
      cursor: pointer;
      background: #f1f1f1;
      border: 1px solid #ddd;
      margin-right: 5px;
      transition: background 0.3s;
      width: 50%;  /* 고정 너비 설정 */
      text-align: center;
    }

    .tab-button.active {
      background: #ddd;
    }

    .tab {
      display: none;
    }

    .tab.active {
      display: block;
    }

    .loader {
      border: 4px solid #f3f3f3;
      border-radius: 50%;
      border-top: 4px solid #3498db;
      width: 40px;
      height: 40px;
      animation: spin 2s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .retry-btn {
      margin-left: 10px;
      padding: 5px 10px;
      font-size: 0.9em;
      cursor: pointer;
    }

    .notice-link {
      color: blue;
      text-decoration: underline;
    }

    .summary-button:hover::after {
      content: '요약 보기';
      position: absolute;
      top: -25px;
      left: -10px;
      background: #000;
      color: #fff;
      padding: 5px;
      border-radius: 5px;
      font-size: 0.8em;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
});
