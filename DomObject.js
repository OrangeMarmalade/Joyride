// create a dom object so it's easier to access dom elements
var Dom = {

    get: function(id) { return ((id instanceof HTMLElement) || (id === document)) ? id : document.getElementById(id); },
    set: function(id, html) {Dom.get(id).innerHTML = html;},
    on: function(ele, type, fn, capture) {Dom.get(ele).addEventListener(type, fn, capture);},

    toggleClassName: function(ele, name, on) {
      	ele = Dom.get(ele);
    	var classes = ele.className.split(' ');
    	var n = classes.indexOf(name);
    	on = (typeof on == 'undefined') ? (n < 0) : on;
    	if (on && (n < 0))
      		classes.push(name);
    	else if (!on && (n >= 0))
      		classes.splice(n, 1);
    	ele.className = classes.join(' ');
  	},

  	storage: window.localStorage || {}

}
