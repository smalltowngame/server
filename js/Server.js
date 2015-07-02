//JS_connection

SMLTOWN.Server = {
    fastPing: 1000
    ,
    slowPing: 3000
    ,
    websocketConnection: function(callback) {
        var $this = this;
        callback(false);
        return;
        // WEBSOCKET

        var domain = window.location.host.split(":")[0];
        var wsUri = "ws://" + domain + ":9000/smalltown/assets/server_websocket.php";
        console.log("connecting to: " + wsUri);
        var websocket = new WebSocket(wsUri);
        websocket.onopen = function(ev) {
//SMLTOWN.Message.setLog("websocket connected");
            callback(true);
        };
        websocket.onmessage = function(ev) {
            console.log(JSON.stringify(ev)); //debug
            if (ev.data) {
                try {
                    var res = JSON.parse(ev.data);
                    $this.onmessage(res);
                } catch (e) {
                    console.log("error onmessage");
                    console.log(e);
                }
            } else {
                console.log("null socket data");
            }
        };
        websocket.onerror = function(ev) {
            console.log("websocket error:");
            websocket.close();
        };
        websocket.onclose = function(ev) {
            console.log("websocket close:");
            console.log(ev);
            //SMLTOWN.Message.setLog("websocket connection closed");
            callback(false);
        };

        this.request ? null : this.request = {};
        this.request.send = function(data) {
            websocket.send(data);
        };

//            function stop() {
//                websocket.send("stop");
//            }
    }
    ,
    url: ""
    ,
    HttpRequest: new XMLHttpRequest()
    ,
    startPing: function() {
        var $this = this;
        var HttpRequest = this.HttpRequest;
        if(!SMLTOWN.Game.id){
            smltown_error("wrong game id, leaving...");
            setTimeout(function(){
                SMLTOWN.Load.showPage("gameList");
            },1500);
            return;
        }
        this.url = SMLTOWN.path + "server_ajax.php?id=" + SMLTOWN.Game.id;

        //PING
        HttpRequest.onreadystatechange = function() {
            /////////DEBUG
            //if (HttpRequest.responseText) {
            //    console.log(HttpRequest.readyState);
            //    console.log(HttpRequest.responseText);
            //}
            if (HttpRequest.readyState != 4) { //!important
                return;
            }

            if (HttpRequest.responseText) { //catch errors and code
                //console.log(HttpRequest.responseText)
                var string = HttpRequest.responseText;
                string = unescape(encodeURIComponent(string)); //decode backslashes special chars

                var array = string.split("|");
                for (var i = 0; i < array.length; i++) {
                    if (array[i]) {
//                    console.log(array[i])
                        var json;
                        try {
                            json = JSON.parse(array[i]);
                        } catch (e) {
                            try {
                                eval(array[i]);
                            } catch (e) {
                                console.log("error on parse request: " + array[i]); //not setLog
                            }

                            continue;
                        }
                        $this.onmessage(json);
                    }
                }
                $this.loaded();
            }
            //next interval
            setTimeout(function() {
                $this.pingRequest();
            }, $this.ping);
//        }, SMLTOWN.server.ping += 10);
        };

        this.pingRequest();
    }
    ,
    pingRequest: function() {
        this.HttpRequest.open("POST", this.url, true);
        this.HttpRequest.send();
    }
    ,
    ajaxConnection: function() {
        var $this = this;
        // AJAX
        this.url = SMLTOWN.path + "server_ajax.php";

        //ajax request function
        this.request.send = function(obj, over, callback) {
            console.log(obj);
            if (SMLTOWN.Game.id) {
                obj.gameId = SMLTOWN.Game.id;
            }

            var sendXmlHttpRequest = new XMLHttpRequest();
            sendXmlHttpRequest.open("POST", $this.url, true);
            sendXmlHttpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            sendXmlHttpRequest.send(JSON.stringify(obj));
            sendXmlHttpRequest.onreadystatechange = function() {
                if (sendXmlHttpRequest.readyState == 4) {
                    if (sendXmlHttpRequest.responseText) {
                        $this.loaded();
                        console.log(sendXmlHttpRequest.responseText);
                        try {
                            eval(sendXmlHttpRequest.responseText); //prevent ghost games petitions from server
                        } catch (e) {
                            smltown_error("Send request error: " + sendXmlHttpRequest.responseText);
                        }
                    }
                }
                if (callback) {
                    callback();
                }
            };
            if (!over) {
                $this.loading();
            }
        };
    }
    ,
    // LOADING SCREEN
    loading: function() {
        if (!$("#smltown_loading").length) {
            this.storedPing = this.ping;
            this.ping = 300;
            SMLTOWN.Load.start();
        }
    }
    ,
    loaded: function() {
        this.ping = this.storedPing;
        SMLTOWN.Load.end();
    }
    ,
// JSON HANDLE
    onmessage: function(res) {
//    console.log(JSON.stringify(res));
        switch (res.type) {
            case "flash":
                SMLTOWN.Message.flash(res.data);
                break;
            case "notify":
                SMLTOWN.Message.notify(res.data);
                break;
            case "chat":
                console.log(res)
                SMLTOWN.Message.addChat(res.text, res.userId);
                //chatUpdate();
                break;
            case "extra":
                setTimeout(function() {
                    SMLTOWN.Action.night.extra(res.data);
                }, SMLTOWN.Game.wakeUpTime);
                break;
            case "update":
                SMLTOWN.Update.all(res);
                break;
            default: //other functions
                try {
                    eval(res.type)(res);
                } catch (e) {
                    SMLTOWN.Message.setLog(res);
                }
        }
    }
    ,
    ajaxReq: new XMLHttpRequest()
    ,
    ajax: function(request, callback) {
        var req = this.ajaxReq;
        req.open("POST", "server_ajax.php", true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.send(JSON.stringify(request));
        req.onreadystatechange = function() { //DEBUG
            if (req.readyState == 4 && req.responseText) {
                //console.log(req.responseText)
                if (callback) {
                    var parse;
                    try {
                        parse = JSON.parse(req.responseText);
                    } catch (e) {
                        console.log("ajax error");
                        console.log(req.responseText);
                        smltown_error(req.responseText);
                        return;
                    }
                    callback(parse);
                }
            }
        };
    }
};
