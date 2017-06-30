
(function () {

    window.smltown_debug = function (text) {
        if (window.SMLTOWN && SMLTOWN.config.debug) {
            smltown_error(text);
        } else {
            console.log("smltown_debug:" + text);
            sendError("(only debug) " + text);
        }

        smltown_stack();
    };

    window.smltown_error = function (text) {
        console.log(text);
        var log = document.getElementsByClassName('smltown_errorLog');

        var error = document.createElement("div");
        error.innerHTML = text + ". ";
        if (window.SMLTOWN && SMLTOWN.Message) {
            error.innerHTML += SMLTOWN.Message.translate("shareThisError");
        }

        var show = false;
        for (var i = 0; i < log.length; i++) { //for all log errors possible
            log[i].appendChild(error);
            smltown_errorEvents(error);
            if (log[i].offsetWidth > 0 && log[i].offsetHeight > 0) { //if div is shown
                show = true;
            }
        }

        //if nothing happend: DEBUG
        if (!show) {
            var body = document.getElementById('smltown_html');
            if (body) {
                body.insertBefore(error, body.firstChild);
            }
            smltown_errorEvents(error);
        }

        sendError(text);
    };

    window.smltown_stack = function () {
        console.log(new Error().stack);
    };

    function sendError(text, f) {

        if (!window.SMLTOWN || !SMLTOWN.path) {
            return;
        }

        //add stack to Log
        text += ":: ";
        while (f) {
            text += f.name + "; ";
            f = f.caller;
        }

        //server send
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", SMLTOWN.path + "utils/store_error.php", true);
        xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        //debug
        xhttp.onreadystatechange = function () {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                if (xhttp.responseText) {
                    console.log("response: " + xhttp.responseText);
                }
            }
        };

        xhttp.send("error=" + text);
    }

    function smltown_errorEvents(div) {
        div.onclick = function (e) {
            e.preventDefault();
            div.style.setProperty("display", "none");
        };
    }

    window.defaultError = window.onerror;
    window.onerror = function (msg, url, line, col, error) {
        var extra = !col ? '' : '\ncolumn: ' + col;
        extra += !error ? '' : '\nerror: ' + error;
        var errorMmessage = "; Error: " + msg + "\nurl: " + url + "\nline: " + line + extra + "; "

        //this workd for android
        console.log(errorMmessage, "from", error.stack);

        smltown_error(errorMmessage, arguments.callee.caller);
        if (window.defaultError) {
            defaultError(msg, url, line, col, error);
        }
    };

    // Only Chrome & Opera have an error attribute on the event.
    window.addEventListener("error", function (e) {
        console.log(e.error.message, "from", e.error.stack);
    });

})();
