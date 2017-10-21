function listen(evnt, elem, func) {
    if (elem.addEventListener)  // W3C DOM
        elem.addEventListener(evnt,func,false);
    else if (elem.attachEvent) { // IE DOM
         var r = elem.attachEvent("on"+evnt, func);
         return r;
    }
}

function LandingAdmin() {

	var edit_link = document.getElementsByClassName("js-landing-edit");
	for (var i=0; i<edit_link.length; i++) {
		/*edit_link[i].addEventListener('click', function(e) {
		    e.target.classList.toggle('hide');
		});*/
		listen("click", edit_link[i], function(e) {
		    e.target.classList.add('js-landing-hide');
		    e.target.parentElement.querySelector('span.js-landing-span').classList.add('js-landing-hide');
		    e.target.parentElement.querySelector('textarea.js-landing-area').classList.remove('js-landing-hide');
		    e.target.parentElement.querySelector('a.js-landing-save').classList.remove('js-landing-hide');
		});
	}

	var save_link = document.getElementsByClassName("js-landing-save");
	for (var i=0; i<edit_link.length; i++) {
		listen("click", save_link[i], function(e) {
			var html = e.target.parentElement.querySelector('textarea.js-landing-area').value;
			var file = e.target.parentElement.querySelector('span.js-landing-span').dataset.file;

			var data = {};
			data[file] = html;
			// construct an HTTP request
			var xhr = new XMLHttpRequest();
			xhr.open('POST', 'admin/save', true);
			xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

			// send the collected data as JSON
			xhr.send(JSON.stringify(data));

			xhr.onloadend = function () {
			  //alert("saved!")
			};


		    e.target.parentElement.querySelector('span.js-landing-span').innerHTML = html;

		    e.target.classList.add('js-landing-hide');
		    e.target.parentElement.querySelector('textarea.js-landing-area').classList.add('js-landing-hide');
		    e.target.parentElement.querySelector('span.js-landing-span').classList.remove('js-landing-hide');
		    e.target.parentElement.querySelector('a.js-landing-edit').classList.remove('js-landing-hide');
		});
	}

}

listen("load", window, LandingAdmin());
