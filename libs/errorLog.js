
function smltown_error(text) {
    var div = document.getElementById('smltown_html').children;
    
    for (var i = 0; i < div.length; i++) {
        if (div[i].offsetWidth > 0 && div[i].offsetHeight > 0) {
            var log = div[i].getElementsByClassName("smltown_errorLog")[0];
            log.innerHTML = log.innerHTML + text + "\n";
            return;
        }
    }
}

window.onerror = function(msg, url, line, col, error) {
    var extra = !col ? '' : '\ncolumn: ' + col;
    extra += !error ? '' : '\nerror: ' + error;
    smltown_error("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);
};
