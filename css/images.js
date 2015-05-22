var s = "";
var pre = "{background-image:url(" + Game.path;
var fin = ")}";

function css(nombre, url) {
    s += nombre + pre + url + fin;
}

//BASE

css(".ajax-loader", "img/load.gif");

var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = s;
document.getElementsByTagName('head')[0].appendChild(style);

