//JS_connection

SMLTOWN.Server = {
    ping: 1000
    ,
    fastPing: 1000
    ,
    slowPing: 3000
    ,
    handleConnection: function () {
        var $this = this;
        SMLTOWN.Server.websocketConnection(function (done) {
            if (!done) {
                SMLTOWN.Server.ajaxConnection();
                $(".smltown_allowWebsocket").text("NOT");
            } else {
                SMLTOWN.Server.websocket = true;
                console.log("WEBSOCKET CONNECTION");
            }
            SMLTOWN.Server.request.addUser(SMLTOWN.user.name);
            $this.connected();
        });
    }
    ,
    websocketConnection: function (callback) {
        var $this = this;

        console.log("websocket server config: " + SMLTOWN.websocketServer);
        if (!SMLTOWN.websocketServer) {
            callback(false);
            return;
        }
//        callback(false);
//        return;
        // WEBSOCKET

        var domain = location.host.split(":")[0];
        var path = location.pathname;
        var wsUri = "ws://" + domain + ":9000" + path + "smltown_websocket.php";
        console.log("connecting to: " + wsUri);

        try {
            var websocket = new WebSocket(wsUri);
            websocket.onopen = function (ev) {
                console.log("websocket open");
                //SMLTOWN.Message.setLog("websocket connected");
                $this.request ? null : this.request = {};
                $this.request.send = function (obj, over, callback) {
                    if (!over) {
                        $this.loading();
                    }
                    console.log(obj);
                    obj = $this.addGameInfo(obj);

                    //only 4 websockets (not valid cookies or session)
                    if (SMLTOWN.user.id) {
                        obj.playId = SMLTOWN.user.id;
                    }

                    websocket.send(JSON.stringify(obj));
                };

                callback(true);
            };
            websocket.onmessage = function (ev) {
                $this.loaded();
//                console.log("MESSAGE");
                //console.log(JSON.stringify(ev)); //debug
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
            websocket.onerror = function (ev) {
                console.log("websocket error:");
                websocket.close();
            };
            websocket.onclose = function (ev) {
                console.log("websocket close:");
                console.log(ev);

                //if 2nd time
                if ($this.websocketReconnection) {
                    console.log(123)
                    callback(false);
                    return;
                }

                $this.ajax("", function (connected) {
                    console.log("websocket reconnection?: " + connected);
                    if (parseInt(connected) > 0) {
                        //try again
                        $this.websocketReconnection = true;
                        $this.handleConnection();

                    } else {
                        callback(false);
                    }
                }, "websocketServerStart.php");

                //SMLTOWN.Message.setLog("websocket connection closed");                
            };

            SMLTOWN.websocket = websocket;

        } catch (e) {
            console.log("websocket error catch");
            callback(false);
        }

//            function stop() {
//                websocket.send("stop");
//            }
    }
    ,
    connected: function () {
        console.log("connected");
        SMLTOWN.Transform.windowResize();
        //DEFINE WAY TO NAVIGATE
        if ($("body").attr("id") == "smltown") { //as MAIN webpage game
            if (!window.location.hash) {
                console.log("hash = 'gameList'")
                window.location.hash = "gameList"
            }
            window.onhashchange = function () {
                SMLTOWN.Load.end();
                SMLTOWN.Load.divLoad(window.location.hash.split("#")[1] || "");
            };
            window.onhashchange();
        } else { //as PLUGIN
            if (typeof SMLTOWN.Game.info.id != "undefined") {
                SMLTOWN.Load.showPage("game?" + SMLTOWN.Game.info.id);
            } else {
                SMLTOWN.Load.showPage("gameList");
            }
        }
    }
    ,
    url: ""
    ,
    HttpRequest: new XMLHttpRequest()
    ,
    startPing: function () { //only ajax
        console.log("start ping");
        var $this = this;
        var HttpRequest = this.HttpRequest;
        if (!SMLTOWN.Game.info.id) {
            smltown_error("wrong game id: " + SMLTOWN.Game.info.id + ", leaving...");
            console.log("wrong");
            setTimeout(function () {
                SMLTOWN.Load.showPage("gameList");
            }, 1500);
            return;
        }
        this.url = SMLTOWN.path + "smltown_ajax.php?id=" + SMLTOWN.Game.info.id;

        //PING
        HttpRequest.onreadystatechange = function () {
            /////////DEBUG
//            if (HttpRequest.responseText) {
//            console.log(HttpRequest.readyState);
//                console.log(HttpRequest.responseText);
//            }
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
            setTimeout(function () {
                $this.pingRequest();
            }, $this.ping);
//        }, SMLTOWN.server.ping += 10);
        };

        this.pingRequest();
    }
    ,
    pingRequest: function () {
        this.HttpRequest.open("POST", this.url, true);
        this.HttpRequest.send();
    }
    ,
    ajaxConnection: function () {
        console.log("ajax connection")
        var $this = this;
        // AJAX
        this.url = SMLTOWN.path + "smltown_ajax.php";

        //ajax request function
        this.request.send = function (obj, over, callback) {
            if (!over) {
                $this.loading();
            }
            console.log(obj);
            obj = $this.addGameInfo(obj);

            var sendXmlHttpRequest = new XMLHttpRequest();
            sendXmlHttpRequest.open("POST", $this.url, true);
            sendXmlHttpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            sendXmlHttpRequest.send(JSON.stringify(obj));
            sendXmlHttpRequest.onreadystatechange = function () {
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
        };
    }
    ,
    // LOADING SCREEN
    loading: function () {
        if (!$("#smltown_loading").length) {
            this.storedPing = this.ping;
            this.ping = 300;
            SMLTOWN.Load.start();
        }
    }
    ,
    loaded: function () {
        if (this.storedPing) {
            this.ping = this.storedPing;
        }
        SMLTOWN.Load.end();
    }
    ,
// JSON HANDLE
    onmessage: function (res) {
//    console.log(JSON.stringify(res));
        switch (res.type) {
            case "flash":
                SMLTOWN.Message.flash(res.data);
                break;
            case "notify":
                SMLTOWN.Message.setMessage(res.data);
                break;
            case "chat":
                console.log(res)
                SMLTOWN.Message.addChat(res.text, res.userId);
                //chatUpdate();
                break;
            case "extra":
                SMLTOWN.Action.wakeUpCard(function () {
                    SMLTOWN.Action.night.extra(res.data); //like witch
                });
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
    addGameInfo: function (obj) {
        if (SMLTOWN.Game.info.id) {
            obj.gameId = SMLTOWN.Game.info.id;
        }
        if (SMLTOWN.Game.info.type) {
            obj.gameType = SMLTOWN.Game.info.type;
        }
        return obj;
    }
    ,
    ajaxReq: new XMLHttpRequest()
    ,
    ajax: function (request, callback, url) {
        console.log(request);
        var file = "ajax.php";
        if (url) {
            console.log("url: " + url);
            file = url;
        }

        var req = this.ajaxReq;
        req.open("POST", file, true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.send(JSON.stringify(request));
        req.onreadystatechange = function () { //DEBUG
            if (req.readyState == 4 && req.responseText) {
//                console.log(req.responseText)
                if (callback) {
                    var parse;
                    try {
                        parse = JSON.parse(req.responseText);
                    } catch (e) {
                        console.log("ajax error: ");
                        console.log(req.responseText);
                        smltown_error("ajax error = " + req.responseText);
                        return;
                    }
                    callback(parse);
                }
            }
        };
    }
};
