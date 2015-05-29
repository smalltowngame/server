
function setLog(log) {
    var div = document.getElementById('smltown_errorLog');
    div.innerHTML = div.innerHTML + log + "\n";
}

window.onerror = function(msg, url, line, col, error) {
    var extra = !col ? '' : '\ncolumn: ' + col;
    extra += !error ? '' : '\nerror: ' + error;
    setLog("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);
};

