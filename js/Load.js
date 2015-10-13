
SMLTOWN.Load = {
    //LOAD CALL    
    showPage: function(url, why) {
        if (why) {
            console.log("show Page: " + url + " for " + why);
            if (url.indexOf("?") == -1) {
                url + "?" + why;
            }
        }

        if (!SMLTOWN.Server.isPlugin()) { //game as MAIN app
            window.location.hash = url; //get hash and divLoad            
        } else {
            this.divLoad(url);
        }
    }
    ,
    //LOAD FUNCTION
    divLoad: function(url, callback) {
        console.log("divload");
        var $this = this;
        var urlArray = url.split("?");
        var urlPage = urlArray[0];

        if (urlPage == "game") {
            SMLTOWN.Local.stopRequests();
            if (typeof urlArray[1] != "undefined") {
                SMLTOWN.Game.info.id = urlArray[1];
            }
            this.loadGame(function() {
                if (callback) {
                    callback();
                }
            });

        } else if (urlPage == "gameList") {
            $("#smltown_html").load(SMLTOWN.path + "gameList.php", null, function() {
                $this.end();
                if (callback) {
                    callback();
                }
            });
        } else {
            //like facebook mobile request on heroku with url data
            $("#smltown_html").load(SMLTOWN.path + "gameList.php", null, function() {
                $this.end();
                if (callback) {
                    callback();
                }
            });
        }
    }
    ,
    //GAME LIST
    gameList: function() {
        if ($("#smltown_connectionCheck").length) {
            smltown_error("return");
            return;
        }
        //ONCE        
        if ("localhost" != document.location.hostname) {
            //let crate games
            $("#smltown_createGame").css("display", "inherit");
            SMLTOWN.Games.gamelistEvents();
        } else {
            $("#smltown_title").html("<p>" + SMLTOWN.Message.translate("GameList") + "</p>");
        }

        //show kind of connection
        $("#smltown_connectionCheck").show();
        SMLTOWN.Games.reloadList();
    }
    ,
    //GAME
    loadGame: function(callback) {
        var hashArray = window.location.hash.split("?");
        if (hashArray.length > 1) {
            SMLTOWN.Game.info.id = hashArray[1];
        }
        $("#smltown_html").load(SMLTOWN.path + "game.php", {
            gameId: SMLTOWN.Game.info.id,
            lang: SMLTOWN.lang
        }, function() {
            console.log("loaded game");
            if (callback) {
                callback();
            }
            //not end() at this point
        });
    }
    ,
    reloadGame: function() {
        this.showPage("game");
    }
    ,
    cleanGameErrors: function() {
        console.log("clean errors");
        SMLTOWN.Message.clearChat();
        this.start();
        this.loadGame(); //reload all
    }
    ,
    timeout: null
    ,
    start: function(time) {
        var $this = this;
        this.loading = true;
        $("#smltown_loader").addClass("smltown_loading");

        if ("undefined" == typeof time) {
            time = 5000;
        }

        //RESET loading timeout
        clearTimeout(this.timeout);
        this.timeout = setTimeout(function() {
            $this.end();
            SMLTOWN.Message.flash("warnServer");
            //last call
            if("object" == typeof $this.lastCall){
                $this.lastCall = JSON.stringify($this.lastCall);
            }
            smltown_error("waiting for: " + $this.lastCall);
        }, time);
    }
    ,
    end: function() {
        this.loading = false;
        clearTimeout(this.timeout);
        $("#smltown_loader").removeClass("smltown_loading");
    }
    ,
    back: function() {
        console.log("back");
        if ($("#smltown_game").length) {
            this.start();
            SMLTOWN.Message.notify("");
            this.showPage("gameList");
            return true;
        }
        SMLTOWN.Help.stop();
        return false;
    }
};
