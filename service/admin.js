function listen(evnt, elem, func) {
    if (elem.addEventListener)  // W3C DOM
        elem.addEventListener(evnt,func,false);
    else if (elem.attachEvent) { // IE DOM
         var r = elem.attachEvent("on"+evnt, func);
         return r;
    }
}

function LandingAdmin() {
	/*var edit_link = document.getElementsByClassName("js-landing-edit");
	for (var i=0; i<edit_link.length; i++) {
		edit_link[i].addEventListener('click', function(e) {
		    alert(e.currentTarget);
		});
		//listen("click", edit_link[i], LandingAdminClick());
	}*/
	$("a.js-landing-edit").click(function() {
	  var parent = $(this).parent();
	  parent.find("span.js-landing-span").hide();
	  parent.find("textarea.js-landing-area").show();
	  parent.find("a.js-landing-edit").hide();
	  parent.find("a.js-landing-save").show();
	});
	$("a.js-landing-save").click(function() {
	  var parent = $(this).parent();
	  var html = parent.find("textarea.js-landing-area").val();
	  var file = parent.find("span.js-landing-span").data("file");

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

	  parent.find("textarea.js-landing-area").hide();
	  parent.find("span.js-landing-span").html(html).show();
	  parent.find("a.js-landing-save").hide();
	  parent.find("a.js-landing-edit").show();
	});
}

/*function LandingAdminClick() {
	alert("Click");
}*/

listen("load", window, LandingAdmin());