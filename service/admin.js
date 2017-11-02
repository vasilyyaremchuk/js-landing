function listen(evnt, elem, func) {
  if (elem.addEventListener) {
    elem.addEventListener(evnt, func, false);
  } else if (elem.attachEvent) {
    elem.attachEvent(`on${evnt}`, func);
  }
}

function LandingAdmin() {
  const editLink = document.getElementsByClassName('js-landing-edit');
  for (let i = 0; i < editLink.length; i += 1) {
    listen('click', editLink[i], (e) => {
      e.target.classList.add('js-landing-hide');
      e.target.parentElement.querySelector('span.js-landing-span').classList.add('js-landing-hide');
      e.target.parentElement.querySelector('textarea.js-landing-area').classList.remove('js-landing-hide');
      e.target.parentElement.querySelector('a.js-landing-save').classList.remove('js-landing-hide');
    });
  }

  const saveLink = document.getElementsByClassName('js-landing-save');
  for (let i = 0; i < editLink.length; i += 1) {
    listen('click', saveLink[i], (e) => {
      const html = e.target.parentElement.querySelector('textarea.js-landing-area').value;
      const fileName = e.target.parentElement.querySelector('span.js-landing-span').dataset.file;

      const data = {};
      data[fileName] = html;

      // construct an HTTP request
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'admin/update', true);
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

      // send the collected data as JSON
      xhr.send(JSON.stringify(data));

      xhr.onloadend = function onLoadEnd(message) {
        // console.log(message.target);
        if (message.target.status === 200 && message.target.responseText.indexOf('Error') === -1) {
          e.target.parentElement.querySelector('span.js-landing-span').innerHTML = `<div class="alert alert-success">${message.target.responseText}</div>`;
          setTimeout(() => {
            e.target.parentElement.querySelector('span.js-landing-span').innerHTML = html;
          }, 2000);
        }
      };

      e.target.classList.add('js-landing-hide');
      e.target.parentElement.querySelector('textarea.js-landing-area').classList.add('js-landing-hide');
      e.target.parentElement.querySelector('span.js-landing-span').classList.remove('js-landing-hide');
      e.target.parentElement.querySelector('a.js-landing-edit').classList.remove('js-landing-hide');
    });
  }
}

listen('load', window, LandingAdmin());
