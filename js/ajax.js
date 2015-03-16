
var req = new XMLHttpRequest();
function ajax(request, callback) {
    console.log(request);
    req.open("POST", "server_ajax.php", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send(request);
    req.onreadystatechange = function() { //DEBUG
        if (req.readyState == 4 && req.responseText) {
            if (callback) {
                callback(req.responseText);
            }
        }
    };
}
