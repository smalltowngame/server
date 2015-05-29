
var req = new XMLHttpRequest();
function ajax(request, callback) {
    req.open("POST", "server_ajax.php", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(request);
    req.onreadystatechange = function () { //DEBUG
        if (req.readyState == 4 && req.responseText) {
            console.log(req.responseText)
            if (callback) {
                callback(req.responseText);
            }
        }
    };
}
