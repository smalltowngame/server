var s = "";
var pre = "{background-image:url(" + SMLTOWN.path;
var fin = ")}";

function css(nombre, url) {
    s += nombre + pre + url + fin;
}

//BASE

css(".smltown_loader", "img/loader.gif");

var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = s;
document.getElementsByTagName('head')[0].appendChild(style);

