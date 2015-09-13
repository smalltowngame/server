//JS_connection

SMLTOWN.Server = {
    ping: 1000
    ,
    fastPing: 1000
    ,
    slowPing: 3000
    ,
    handleConnection: function () {
        console.log("handle connection");
        var $this = this;

        if (!SMLTOWN.config.websocket_server) {
            SMLTOWN.Server.ajaxConnection();
            $(".smltown_allowWebsocket").text("NOT");
            SMLTOWN.Server.request.addUser();
            $this.connected();
            return;
        }

        SMLTOWN.Server.websocketConnection(function (done) {
            if (!done) {
                SMLTOWN.Server.ajaxConnection();
                $(".smltown_allowWebsocket").text("NOT");
            } else {
                SMLTOWN.Server.websocket = true;
            }
            SMLTOWN.Server.request.addUser();
            $this.connected();
        });
    }
    ,
    websocketConnection: function (callback) {
        var $this = this;
//        console.log("websocket server config: " + SMLTOWN.config.websocket_server);
//        if (!SMLTOWN.config.websocket_server) {
//            callback(false);
//            return;
//        }
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
                smltown_debug("WEBSOCKET open");
                $this.startTime = new Date().getTime();
                $this.websocketReconnection = false;
                //SMLTOWN.Message.setLog("websocket connected");
                $this.request ? null : this.request = {};
                $this.request.send = function (obj, over, callback) {
                    if (!over) {
                        $this.loading();
                    }
                    console.log(JSON.stringify(obj));
                    obj = $this.addGameInfo(obj);
                    try {
                        websocket.send(JSON.stringify(obj));
                    } catch (e) {
                        smltown_debug("send error");
                        $this.handleConnection();
                    }
                };
                callback(true);
            };
            websocket.onmessage = function (ev) {
                $this.loaded();
                $this.parseResponse(ev.data);
            };
            websocket.onerror = function (ev) {
                smltown_error("websocket error:");
                console.log(ev);
                websocket.close();
            };
            websocket.onclose = function (ev) {
                console.log(ev);
                var endTime = new Date().getTime();
                var time = (endTime - $this.startTime) / 1000;
                smltown_debug("websocket close: " + time + " seconds.");
                //if 2nd time
                if ($this.websocketReconnection) { // true
                    smltown_debug("return to ajax mode");
                    callback(false);
                    return;
                }

                if (!SMLTOWN.config.websocket_autoload) {
                    smltown_debug("not websocket_autoload");
                    callback(false);
                    return;
                }

                $this.ajax("", function (connected) {
                    console.log("websocket reconnection?: " + connected);
                    connected = parseInt(connected);
                    $this.websocketReconnection = true;
                    if (0 < connected) {
                        //try again all connection
                        $this.handleConnection();
                    } else if (-1 == connected && !$this.websocketError) {
                        //still connected? reconnect to websocket?
                        $this.websocketConnection(callback);
                        $this.websocketError = true;
                        smltown_debug("websocket code error on server");
                    } else {
                        callback(false);
                    }
                }, SMLTOWN.path + "websocketStart.php");
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

        var facebook = window.name.indexOf('iframe_canvas_fb') != -1;
        console.log("is facebook = " + facebook);

        if ($("body").attr("id") == "smltown" || facebook) { //as MAIN webpage game
            if (!window.location.hash) {
                console.log("hash = 'gameList'");
                window.location.hash = "gameList";
            }
            window.onhashchange = function () {
                SMLTOWN.Load.end();
                SMLTOWN.Load.divLoad(window.location.hash.split("#")[1] || "");
            };
            window.onhashchange();
        } else { //as PLUGIN
            console.log("plugin");
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

        //stop
        this.stopPing();

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
            if (HttpRequest.readyState != 4) {
                return;
            }

            if (HttpRequest.responseText) { //catch errors and code
                $this.parseResponse(HttpRequest.responseText)
            }

            //next interval
            $this.pingTimeout = setTimeout(function () {
                $this.pingRequest();
            }, $this.ping);
//        }, SMLTOWN.server.ping += 10);

            $this.checkNetworkError(HttpRequest);

        };
        this.pingRequest();
    }
    ,
    stopPing: function () {
        this.HttpRequest.abort();
        clearTimeout(this.pingTimeout);
        this.ping = this.fastPing;
    }
    ,
    pingRequest: function () {
        this.HttpRequest.open("POST", this.url, true);
        this.HttpRequest.send();
    }
    ,
    ajaxConnection: function () {
        console.log("ajax connection");
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

                if (sendXmlHttpRequest.readyState != 4) {
                    return;
                }

                if (sendXmlHttpRequest.responseText) {
                    //$this.loaded();
                    //console.log(sendXmlHttpRequest.responseText);
//                        try {
//                            eval(sendXmlHttpRequest.responseText); //prevent ghost games petitions from server
//                        } catch (e) {
//                            smltown_error("Send request error: " + sendXmlHttpRequest.responseText);
//                        }
                    $this.parseResponse(sendXmlHttpRequest.responseText);
                }
                if (callback) {
                    callback();
                }

                //if con't connect ajax => network error
                $this.checkNetworkError(this);
            };
        };
        //ajax ping if websocket fails
        if ($("#smltown_game").length) {
            this.startPing();
        }
    }
    ,
    parseResponse: function (string) {
        //console.log(string)
        string = unescape(encodeURIComponent(string)); //decode backslashes special chars

        var array = string.split("|");
        for (var i = 0; i < array.length; i++) {
            if (array[i]) {
                //console.log(array[i])
                var json;
                try {
                    json = JSON.parse(array[i]);
                } catch (e) {
//                    console.log(e);
                    console.log(array[i]);
                    try {
                        eval(array[i]);
                    } catch (e) {
                        smltown_debug("error on parse request: " + array[i]); //not setLog
                    }

                    continue;
                }
                this.onmessage(json);
            }
        }
        this.loaded();
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
        console.log(res);
        if ("flash" == res.type) {
            SMLTOWN.Message.flash(res.data, res.gameId);
            return;
        }
        if ("notify" == res.type) {
            SMLTOWN.Message.setMessage(res.data, null, null, res.gameId);
            return;
        }
        if ("chat" == res.type) {
            SMLTOWN.Message.addChat(res.text, res.playId, res.gameId, res.name);
            return;
        }

        //from here
        if (res.gameId && res.gameId != SMLTOWN.Game.info.id) {
            console.log("message received from other game");
            return;
        }
        if (!SMLTOWN.Game.info.id) { //prevent bad requests errors
            console.log("not in game:");
            console.log(res);
            return;
        }

        if ("extra" == res.type) {
            SMLTOWN.Action.wakeUpCard(function () {
                SMLTOWN.Action.night.extra(res.data); //like witch
            });
            return;
        }
        if ("update" == res.type) {
            SMLTOWN.Update.all(res);
            return;
        }

        try {
            eval(res.type)(res);
        } catch (e) {
            SMLTOWN.Message.setLog(res);
        }
    }
    ,
    addGameInfo: function (obj) {
        if (SMLTOWN.Game.info.id) {
            obj.gameId = SMLTOWN.Game.info.id;
        }
        if (SMLTOWN.user.id) {
            obj.playId = SMLTOWN.user.id;
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
        var $this = this;
        var file = SMLTOWN.path + "ajax.php";
        if (url) {
            console.log("url: " + url);
            file = url;
        }

        var req = this.ajaxReq;
        req.open("POST", file, true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        var json = JSON.stringify(request);
//        try {
        req.send(json);
//        } catch (e) {
//            smltown_debug("catch send request error");
//            return false;
//        }
        req.onreadystatechange = function () { //DEBUG
            if (req.readyState != 4) {
                return;
            }

            if (req.responseText) {
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
            //if con't connect ajax => network error
            $this.checkNetworkError(this);
        };
    }
    ,
    checkNetworkError: function (XMLHttpRequest) {
        if ("" == XMLHttpRequest.response && XMLHttpRequest.status == 0) {
            var $this = this;
            this.stopPing();
            console.log("The computer appears to be offline.");
            smltown_debug("trying reconnection every 2 min.");

            setTimeout(function () {
                $this.handleConnection();
            }, 120000); //try reconnect every 2 min
        }
    }
};
