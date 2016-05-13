console.log("images.js");

var smltown_css = "";
var smltown_cssPre = "{background-image:url(" + SMLTOWN.path_static;
var smltown_cssFin = ")}";

function css(nombre, url) {
    smltown_css += nombre + smltown_cssPre + url + smltown_cssFin;
}

//BASE
css("#smltown_html", "img/background4.jpg");
css("#androidAd", "img/android_smalltownad.jpg");
css("#smltown_forumLink", "img/forum.png");

css(".smltown_loader", "img/loader.gif");
css(".smltown_night #smltown_sun > div", "img/moon.png");
css("#smltown_sun > div", "img/sun.png");
css("#smltown_cardBack", "img/unflipped.jpg");
css(".smltown_sleep", "img/zzz.png");
css(".smltown_dead", "img/player_night.gif");

css("#smltown_user .smltown_player", "img/player_green.gif");
css(".smltown_night #smltown_user .smltown_player", "img/player_night.gif");
css("#smltown_listAlive", "img/player_blue.gif");
css(".smltown_waiting .smltown_player, .smltown_waiting #smltown_user .smltown_player", "img/player_night.gif");

var smltown_style = document.createElement('style');
smltown_style.type = 'text/css';
smltown_style.innerHTML = smltown_css;
document.getElementsByTagName('html')[0].appendChild(smltown_style);

console.log("!!!!!!!!!!!!!!!!!!!!")
