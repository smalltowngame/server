
function smltown_debug(text) {
    if (SMLTOWN.config.debug) {
        smltown_error(text);
    } else {
        console.log("smltown_debug:" + text);
    }
}

function smltown_error(text) {
    console.log(text);
    var log = document.getElementsByClassName('smltown_errorLog');

    var error = document.createElement("div");
    error.innerHTML = text;

    var show = false;
    for (var i = 0; i < log.length; i++) { //for all log errors possible
        log[i].appendChild(error);
        smltown_errorEvents(error);
        if (log[i].offsetWidth > 0 && log[i].offsetHeight > 0) { //if div is shown
            show = true;
//            return;
        }
    }

    //if nothing happend: DEBUG
    if (!show) {
        var body = document.getElementById('smltown_html');
        body.insertBefore(error, body.firstChild);
        smltown_errorEvents(error);
    }
}

function smltown_errorEvents(div) {
    div.onclick = function (e) {
        e.preventDefault();
        div.style.setProperty("display", "none");
    };
}

window.onerror = function (msg, url, line, col, error) {
    var extra = !col ? '' : '\ncolumn: ' + col;
    extra += !error ? '' : '\nerror: ' + error;
    smltown_error("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);
};
