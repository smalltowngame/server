//JS_connection

function websocketConnection(callback) {
    callback(false);
    return;
    // WEBSOCKET

    var domain = Game.url.split(":")[0];
    var wsUri = "ws://" + domain + ":9000/smalltown/assets/server_websocket.php";
    console.log("connecting to: " + wsUri);
    Game.websocket = new WebSocket(wsUri);
    Game.websocket.onopen = function(ev) {
//        setLog("websocket connected");
        callback(true);
    };
    Game.websocket.onmessage = function(ev) {
        console.log(JSON.stringify(ev)); //debug
        if (ev.data) {
            try {
                var res = JSON.parse(ev.data);
                Game.onmessage(res);
            } catch (e) {
                console.log("error onmessage");
                console.log(e);
            }
        } else {
            console.log("null socket data");
        }
    };
    Game.websocket.onerror = function(ev) {
        console.log("websocket error:");
        Game.websocket.close();
    };
    Game.websocket.onclose = function(ev) {
        console.log("websocket close:");
        console.log(ev);
//                setLog("websocket connection closed");
        callback(false);
    };

    Game.request ? null : Game.request = {};
    Game.request.send = function(data) {
        Game.websocket.send(data);
    };

//            function stop() {
//                Game.websocket.send("stop");
//            }
}

function ajaxConnection() {
    console.log("ajaxConnection");
    // AJAX
    Game.serverUrl = url + "/server_ajax.php";

    //ajax request function

    Game.request.send = function(obj, over, callback) {
        console.log(obj);

        var sendXmlHttpRequest = new XMLHttpRequest();
        sendXmlHttpRequest.open("POST", Game.serverUrl, true);
        sendXmlHttpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        sendXmlHttpRequest.send(JSON.stringify(obj));
        sendXmlHttpRequest.onreadystatechange = function() {
            if (sendXmlHttpRequest.readyState == 4) {
                if (sendXmlHttpRequest.responseText) {
                    console.log(sendXmlHttpRequest.responseText);
                    try {
                        eval(sendXmlHttpRequest.responseText); //prevent ghost games petitions from server
                    } catch (e) {
                        setLog("Send request error: " + sendXmlHttpRequest.responseText);
                    }
                }
            }
            if (callback) {
                callback();
            }
        };
        if (!over) {
            Game.load.loading();
        }
    };

    //PING
    Game.HttpRequest = new XMLHttpRequest();
    Game.pingRequest = function() {
        Game.HttpRequest.open("POST", Game.serverUrl, true);
        Game.HttpRequest.send();
    };
    Game.HttpRequest.onreadystatechange = function() {
        /////////DEBUG
//    if (Game.HttpRequest.responseText) {
//        console.log(Game.HttpRequest.readyState);
//        console.log(Game.HttpRequest.responseText);
//    }
        if (Game.HttpRequest.readyState != 4) { //!important
            return;
        }
        
        if (Game.HttpRequest.responseText) { //catch errors and code
            var string = Game.HttpRequest.responseText;
            string = unescape(encodeURIComponent(string)); //decode backslashes special chars

            var array = string.split("|");
            for (var i = 0; i < array.length; i++) {
                if (array[i]) {
//                    console.log(array[i])
                    var json;
                    try {
                        json = JSON.parse(array[i]);
                    } catch (e) {
                        console.log("error on parse request: " + array[i]); //not setLog
                        continue;
                    }
                    Game.onmessage(json);
                }
            }
            Game.load.loaded();
        }
        //next interval
        setTimeout(function() {
            Game.pingRequest();
        }, Game.ping);
//        }, Game.ping += 10);
    };

    //SOCKET imitation
    Game.pingRequest();
}

// LOADING SCREEN
if (typeof Game == "undefined") {
    Game = {};
}

Game.load = {};
Game.load.loading = function() {
    if (!$("#loading").length) {
        $("body").append("<div id='loading'><div class='ajax-loader' style='margin-top:50%'></div></div>")
    }
};
Game.load.loaded = function() {
    $("#loading").remove();
};

// JSON HANDLE
Game.onmessage = function(res) {
//    console.log(JSON.stringify(res));
    switch (res.type) {
        case "flash":
            flash(res.data);
            break;
        case "notify":
            //Game.info.time = null;
            notify(res.data);
            break;
        case "message":
            console.log(res.data)
            setMessage(res.data);
            break;
        case "chat":
            addChat(res.text, res.userId);
            chatUpdate();
            setUserNamesByClass();
            break;
        case "extra":
            setTimeout(function() {
                Game.night.extra(res.data);
            }, Game.wakeUpTime);
            break;
        default: //default "update", etc
            try {
                eval(res.type)(res);
            } catch (e) {
                setLog(res);
            }
    }
};

