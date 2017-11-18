function listen(evnt, elem, func) {
  if (elem.addEventListener) {
    elem.addEventListener(evnt, func, false);
  } else if (elem.attachEvent) {
    elem.attachEvent(`on${evnt}`, func);
  }
}

function saveLinkClick(saveLink) {
  listen('click', saveLink, (e) => {
    let data = {};
    let html = e.target.parentElement.querySelector('span.js-landing-span').innerHTML;
    // construct an HTTP request
    const xhr = new XMLHttpRequest();
    const fileName = e.target.parentElement.querySelector('span.js-landing-span').dataset.file;
    if (e.target.parentElement.querySelector('.js-landing-area').classList.contains('js-landing-text')) {
      html = e.target.parentElement.querySelector('.js-landing-area').value;
      data[fileName] = html;
      xhr.open('POST', 'admin/update', true);
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      // send the collected data as JSON
      xhr.send(JSON.stringify(data));
    } else {
      const myFormData = new FormData();
      const fileInput = e.target.parentElement.querySelector('input.js-landing-file');
      myFormData.append(fileName, fileInput.files[0]);
      if (fileInput.files[0] !== undefined) {
        const newFileName = fileInput.files[0].name;
        e.target.parentElement.querySelector('span.js-landing-span').dataset.file = newFileName;
        e.target.parentElement.querySelector('.js-landing-span img').src = `content/${newFileName}`;
        e.target.parentElement.querySelector('.js-landing-area form').name = newFileName;
        e.target.parentElement.querySelector('.js-landing-area img').src = `content/${newFileName}`;
        html = e.target.parentElement.querySelector('span.js-landing-span').innerHTML;
      }
      data = myFormData;
      // const boundary = generateBoundary();
      xhr.open('POST', 'admin/upload', true);
      // xhr.setRequestHeader('Content-Type', `multipart/form-data; boundary=${boundary}`);
      xhr.send(data);
    }

    xhr.onloadend = function onLoadEnd(message) {
      if (message.target.status === 200 && message.target.responseText.indexOf('Error') === -1) {
        e.target.parentElement.querySelector('span.js-landing-span').innerHTML = `<div class="alert alert-success">${message.target.responseText}</div>`;
        setTimeout(() => {
          e.target.parentElement.querySelector('span.js-landing-span').innerHTML = html;
        }, 2000);
      }
    };
    e.target.classList.add('js-landing-hide');
    e.target.parentElement.querySelector('.js-landing-area').classList.add('js-landing-hide');
    e.target.parentElement.querySelector('span.js-landing-span').classList.remove('js-landing-hide');
    e.target.parentElement.querySelector('a.js-landing-edit').classList.remove('js-landing-hide');
  });
}

function editLinkClick(editLink) {
  listen('click', editLink, (e) => {
    const fileName = e.target.parentElement.querySelector('span.js-landing-span').dataset.file;
    const dateTimestamp = new Date().getTime().toString();
    e.target.classList.add('js-landing-hide');
    e.target.parentElement.querySelector('span.js-landing-span').classList.add('js-landing-hide');
    e.target.parentElement.querySelector('.js-landing-area').classList.remove('js-landing-hide');
    e.target.parentElement.querySelector('a.js-landing-save').classList.remove('js-landing-hide');
    e.target.parentElement.querySelector('div.js-landing-area img').src = `content/${fileName}?${dateTimestamp}`;
  });
}

function LandingAdmin() {
  const editLink = document.getElementsByClassName('js-landing-edit');
  for (let i = 0; i < editLink.length; i += 1) {
    editLinkClick(editLink[i]);
  }

  const saveLink = document.getElementsByClassName('js-landing-save');
  for (let i = 0; i < saveLink.length; i += 1) {
    saveLinkClick(saveLink[i]);
  }
}

listen('load', window, LandingAdmin());
