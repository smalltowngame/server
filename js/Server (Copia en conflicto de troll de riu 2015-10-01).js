//JS_connection

SMLTOWN.Server = {
    ping: -1
    ,
    fastPing: 300
    ,
    normalPing: 1500
    ,
    slowPing: 3000
    ,
    handleConnection: function() {
        console.log("handle connection");
        var $this = this;

        //ajax only
        if (!SMLTOWN.config.websocket_server) {
            SMLTOWN.Server.startAjaxConnection();
            $(".smltown_allowWebsocket").text("NOT");
            $this.connected();
            return;
        }

        SMLTOWN.Server.websocketConnection(function(done) {
            if (!done) {
                SMLTOWN.Server.startAjaxConnection();
                $(".smltown_allowWebsocket").text("NOT");
            } else {
                console.log("websocket connected");
                SMLTOWN.Server.websocket = true;
            }
            $this.connected();
        });
    }
    ,
    websocketConnection: function(callback) {
        var $this = this;
//        console.log("websocket server config: " + SMLTOWN.config.websocket_server);
//        if (!SMLTOWN.config.websocket_server) {
//            callback(false);
//            return;
//        }
//        callback(false);
//        return;
        // WEBSOCKET

        var onlyAjax = localStorage.getItem("onlyAjax");
        if (onlyAjax) {
            if (onlyAjax > (new Date()).getTime()) {
                callback(false);
                return;
            } else {
                localStorage.removeItem("onlyAjax");
            }
        }

        var domain = location.host.split(":")[0];
        var path = location.pathname;
        var wsUri = "ws://" + domain + ":9000" + path + "smltown_websocket.php";
        console.log("connecting to: " + wsUri);
        try {
            var websocket = new WebSocket(wsUri);
            websocket.onopen = function(ev) {
                console.log("WEBSOCKET open");
                $this.startTime = new Date().getTime();

                //w8 10 secs. to check if connection persist. prevent infinite looping
                setTimeout(function() {
                    $this.reconnection = false;
                }, 10000); //10 secs.

                //SMLTOWN.Message.setLog("websocket connected");
                $this.request ? null : this.request = {};
                $this.request.send = function(obj, over, callback) {
                    if (!over) {
                        $this.loading();
                    }
                    console.log(obj);
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
            websocket.onmessage = function(ev) {
                $this.loaded();
                $this.parseResponse(ev.data);
            };
            websocket.onerror = function(ev) {
                smltown_error("websocket error:");
                console.log(ev);
                websocket.close();
            };
            websocket.onclose = function(ev) {
                console.log(ev);

                var endTime = new Date().getTime();
                var time = (endTime - $this.startTime) / 1000;
                smltown_debug("websocket close: " + time + " seconds.");

                //if 2nd time
                if ($this.reconnection == "websocket") { // true
                    smltown_debug("websocket error: check websocket logs.");
                    callback(false);
                    return;
                }

                if (!SMLTOWN.config.websocket_autoload) {
                    smltown_debug("not websocket_autoload");
                    callback(false);
                    return;
                }

                $this.ajax("", function(connected) {
                    console.log("websocket reconnection?: " + connected);
                    connected = parseInt(connected);
                    $this.reconnection = "websocket";

                    if (0 < connected || -1 == connected) {
                        $this.handleConnection();
                        if (-1 == connected) {
                            smltown_debug("websocket code error on server");
                        }
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
    connected: function() {
        console.log("connected");
        SMLTOWN.Transform.windowResize();
        //DEFINE WAY TO NAVIGATE

        if (!this.isPlugin()) { //as MAIN webpage game

            window.onhashchange = function() {
                SMLTOWN.Load.end();
                SMLTOWN.Load.divLoad(window.location.hash.split("#")[1] || "");
            };

            if (location.hash == "#preventLoad") {
                console.log("load prevented by url hash");
                return;
            }

            //SMLTOWN.Server.request.addUser();
            SMLTOWN.Server.ajax({
                action: "addUser",
                userId: SMLTOWN.user.userId,
                name: SMLTOWN.user.name,
                lang: SMLTOWN.lang
            }, function(user) {
                for (var key in user) {
                    if ("friends" == key && user[key]) {
                        try {
//                            user[key] = user[key].split("|");
                            user.friends = JSON.parse(user.friends);
                        } catch (e) {
                            console.log("error on parse friends: " + user.friends);
                            user.friends = null;
                        }
                    }
                    if (user[key]) {
                        SMLTOWN.user[key] = user[key];
                    }
                }
            });

            if (!window.location.hash) {
                console.log("hash = 'gameList'");
//                window.location.hash = "gameList";
            }
            window.onhashchange();

        } else { //as PLUGIN
            console.log("plugin");
            SMLTOWN.Server.request.addUser();

            var gameId = SMLTOWN.Util.getCookie("smltown_gameId");
            if (gameId) {
                SMLTOWN.Load.divLoad("game?" + gameId);
            } else {
                SMLTOWN.Load.divLoad("gameList");
            }
        }
    }
    ,
    url: ""
    ,
    HttpRequest: new XMLHttpRequest()
    ,
    startPing: function() { //only ajax
        console.log("start ping");
        var $this = this;

        var HttpRequest = this.HttpRequest;
        this.pinging = true;
        this.ping = 300;

        if (!SMLTOWN.Game.info.id) {
            smltown_error("wrong game id: " + SMLTOWN.Game.info.id + ", leaving...");
            setTimeout(function() {
                SMLTOWN.Load.showPage("gameList");
            }, 1500);
            return;
        }
        this.url = SMLTOWN.path + "smltown_ajax.php?id=" + SMLTOWN.Game.info.id;
        //PING
        HttpRequest.onreadystatechange = function() {
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
            $this.pingTimeout = setTimeout(function() {
                $this.pingRequest();
            }, $this.ping);

            $this.checkAjaxError(HttpRequest);

        };
        this.pingRequest();
    }
    ,
    stopPing: function() {
        clearTimeout(this.pingTimeout);
        this.ping = -1;
        this.pinging = false;
        console.log("ping = " + this.ping);
    }
    ,
    pingRequest: function() {
        this.HttpRequest.open("POST", this.url, true);
        this.HttpRequest.send();
    }
    ,
    startAjaxConnection: function() { //1st connection
        var $this = this;
        console.log("start ajax connection");
        localStorage.setItem("onlyAjax", (new Date()).getTime() + 36000000); //10 hours        
        this.url = SMLTOWN.path + "smltown_ajax.php";

        //w8 10 secs. to check if connection persist. prevent infinite looping
        setTimeout(function() {
            $this.reconnection = false;
        }, 10000); //10 secs.

        //ajax request function
        this.request.send = function(obj, over, callback) {
            if (!over) {
                $this.loading();
            }
            console.log(obj);
            obj = $this.addGameInfo(obj);
            var sendXmlHttpRequest = new XMLHttpRequest();
            sendXmlHttpRequest.open("POST", $this.url, true);
            sendXmlHttpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            sendXmlHttpRequest.send(JSON.stringify(obj));
            sendXmlHttpRequest.onreadystatechange = function() {

                if (sendXmlHttpRequest.readyState != 4) {
                    return;
                }

                if (sendXmlHttpRequest.responseText) {
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

                if ($("#smltown_game").length && !$this.pinging) {
                    $this.startPing();
                }

                //if con't connect ajax => network error
                $this.checkAjaxError(this);
            };
        };
    }
    ,
    parseResponse: function(string) {
        //console.log(string)
        string = unescape(encodeURIComponent(string)); //decode backslashes special chars

        var array = string.split("|");
        for (var i = 0; i < array.length; i++) {
            if (array[i]) {
//                console.log(array[i]);
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
    loading: function() {
        SMLTOWN.Load.start();
        this.storedPing = this.ping;
        this.ping = this.fastPing;
    }
    ,
    loaded: function() {
        SMLTOWN.Load.end();
        this.ping = Math.max(this.normalPing, this.storedPing);
    }
    ,
// JSON HANDLE
    onmessage: function(res) {
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
            console.log(res);
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
            SMLTOWN.Action.wakeUpCard(function() {
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
    addGameInfo: function(obj) {
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
    ajax: function(request, callback, url) {
        console.log(request);
        var $this = this;
        SMLTOWN.Load.loading = true;

        var file = SMLTOWN.path + "ajax.php";
        if (url) {
            console.log("url: " + url);
            file = url;
        }

        var req = this.ajaxReq;
        req.open("POST", file, true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        var json = JSON.stringify(request);

        req.send(json);

        req.onreadystatechange = function() {
            if (req.readyState != 4) {
                return;
            }
            SMLTOWN.Load.loading = false;

            if (req.responseText) {
                //console.log(req.responseText)
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
            $this.checkAjaxError(this);
        };
    }
    ,
    checkAjaxError: function(XMLHttpRequest) {
        if ("" == XMLHttpRequest.response && XMLHttpRequest.status == 0) {
            var $this = this;
            this.stopPing();
            console.log("The device appears to be offline." + XMLHttpRequest.responseText);
            smltown_debug("trying reconnection every 2 min.");

            clearTimeout(this.ajaxReconnect);
            this.ajaxReconnect = setTimeout(function() {
                $this.reconnection = "ajax";
                $this.handleConnection();
            }, 120000); //try reconnect every 2 min
        }
    }
    ,
    isPlugin: function() {
        //is iframe
        var iframe = true;
        try {
            iframe = window.self !== window.top;
        } catch (e) {
            //
        }

        return ($("body").attr("id") != "smltown" || iframe);
    }
};
