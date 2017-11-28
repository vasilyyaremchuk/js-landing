function listen(evnt, elem, func) {
  if (elem.addEventListener) {
    elem.addEventListener(evnt, func, false);
  } else if (elem.attachEvent) {
    elem.attachEvent(`on${evnt}`, func);
  }
}

function installValidate() {
  const submitButton = document.getElementById('submit');
  listen('click', submitButton, (e) => {
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    if (password !== password2) {
      messages.innerHTML = '<div class="alert alert-warning" role="alert">Passwords should match to each other!</div>';
      e.preventDefault();
      return false;
    }
    return true;
  });
}

listen('load', window, installValidate());
