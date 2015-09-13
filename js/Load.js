
SMLTOWN.Load = {
    //LOAD CALL    
    showPage: function (url, why) {
        if (why) {
            console.log("show Page: " + url + " for " + why);
        }
        if ($("body").attr("id") == "smltown") { //game as MAIN app
            window.location.hash = url; //get hash and divLoad
        } else {
            this.divLoad(url);
        }
    }
    ,
    //LOAD FUNCTION
    divLoad: function (url) {
        console.log("divload");
        var $this = this;
        var urlArray = url.split("?");
        var urlPage = urlArray[0];

        if (urlPage == "game") {
            SMLTOWN.Local.stopRequests();
            if (typeof urlArray[1] != "undefined") {
                SMLTOWN.Game.info.id = urlArray[1];
            }
            this.loadGame();

        } else if (urlPage == "gameList") {
            $("#smltown_html").load(SMLTOWN.path + "gameList.php", null, function () {
                $this.end();
            });
        } else {
            //like facebook mobile request on heroku with url data
            $("#smltown_html").load(SMLTOWN.path + "gameList.php", null, function () {
                $this.end();
            });
        }
    }
    ,
    //GAME LIST
    gameList: function () {
        if ($("#smltown_connectionCheck").length) {
            smltown_error("return");
            return;
        }
        //ONCE
        var $this = this;
        if ("localhost" != document.location.hostname) {
            //let crate games
            $("#smltown_createGame").css("display", "inherit");

            //LIST EVENTS
            //search utility
            $("#smltown_nameGame input").keyup(function (e) {
                //SUBMIT
                if (e.keyCode == '13') {
                    SMLTOWN.Games.create();
                    return false;
                }

                //SEARCH
                var val = $(this).val();
                if (val == $this.gameSearchValue) {
                    return;
                }
                $this.gameSearchValue = val;

                if (val.length > 2) {
                    $this.start();
                    SMLTOWN.Server.ajax({
                        action: "getGamesInfo",
                        userId: SMLTOWN.user.userId,
                        name: val.toLowerCase()
                    }, function (games) {
                        SMLTOWN.Games.list(games);
                        $this.end();
                    });

                } else if (!val.length) { //if remove search name reload again
                    $this.reloadList();
                }
            });

            //CREATE GAME
            $("#smltown_newGame").click(function () {
                SMLTOWN.Games.create();
            });
        } else {
            $("#smltown_title").html("<p>" + SMLTOWN.Message.translate("GameList") + "</p>");
        }

        //show kind of connection
        $("#smltown_connectionCheck").show();
        this.reloadList();
    }
    ,
    //GAME
    loadGame: function () {
        var hashArray = location.hash.split("?");
        if (hashArray.length > 1) {
            SMLTOWN.Game.info.id = hashArray[1];
        }
        $("#smltown_html").load(SMLTOWN.path + "game.php", {
            gameId: SMLTOWN.Game.info.id,
            lang: SMLTOWN.lang
        }, function () {
            console.log("loaded game");
            //not end() at this point
        });
    }
    ,
    reloadGame: function () {
        this.showPage("game");
    }
    ,
    reloadList: function () {
        //load games
        $(".smltown_game").remove();
        SMLTOWN.Games.update();
        if ("localhost" != location.hostname && SMLTOWN.config.local_servers) {
            SMLTOWN.Local.pingGames();
        }
    }
    ,
    cleanGameErrors: function () {
        console.log("clean errors");
        SMLTOWN.Message.clearChat();
        this.start();
        this.loadGame(); //reload all
    }
    ,
    timeout: null
    ,
    start: function () {
        var $this = this;
        if (!$("#smltown_loading").length) {
            $("#smltown_html").append("<div id='smltown_loading'><div class='smltown_loader'></div></div>");
        }

        //RESET loading timeout
        clearTimeout(this.timeout);
        this.timeout = setTimeout(function () {
            $this.end();
            SMLTOWN.Message.notify(SMLTOWN.Message.translate("warnServer"), true);
        }, 5000);
    }
    ,
    end: function () {
        clearTimeout(this.timeout);
        $("#smltown_loading").remove();
    }
    ,
    back: function () {
        console.log("back");
        if ($("#smltown_game").length) {
            this.start();
            this.showPage("gameList");
            return true;
        }
        return false;
    }
};
