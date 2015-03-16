
window.onerror = function(msg, url, line, col, error) {
    var extra = !col ? '' : '\ncolumn: ' + col;
    extra += !error ? '' : '\nerror: ' + error;
    setLog("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);
};

function setLog(log){
    document.getElementsByTagName("body")[0].innerHTML = log;
}
