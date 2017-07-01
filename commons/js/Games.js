
SMLTOWN.Games = {
    array: []
    ,
    offset: 0
    ,
    over: false
    ,
    loadMore: function () {
        var $this = this;
        if (this.over) {
            return;
        }

        $("#smltown_loadingGames").addClass("smltown_loader");
        var offset = this.offset;
        console.log("loadMore: offset = " + offset);

        this.getGamesInfo({offset: offset}, function (games) {
            if (!games) {
                return;
            }
//            $("#smltown_loadingGames").removeClass("smltown_loader");
            var length = games.length;
            if (!length) {
                $("#smltown_loadingGames").append(SMLTOWN.Message.translate("noMoreGames"));
                //SMLTOWN.Message.flash("_noMoreGames");
                $this.over = true;
                return;
            }
            $this.offset += length;
            for (var i = 0; i < length; i++) {
                $this.addRow(games[i]);
            }

            SMLTOWN.Events.touchScroll($("#smltown_gamesWrapper > div"), "top");
        });
    }
    ,
    list: function (games) {
        console.log("games = ");
        console.log(games)
        this.array = games;
        $(".smltown_game").not(".smltown_local").remove();
        var length = games.length;
        this.offset = length;

        var searchGameInUse = false;
        var nameSearch = $("#smltown_nameGame input").val();
        for (var i = 0; i < length; i++) {
            if (games[i].id) { //not id could be informative game name in use
                this.addRow(games[i]);
            }
            if (nameSearch == games[i].name) {
                console.log("name in use");
                searchGameInUse = true;
            }
//            if (document.location.hostname == "localhost") {
//                break; //dont let multiple local device games
//            }
        }

        if (!searchGameInUse && nameSearch && nameSearch.length) {
            $("#smltown_newGame").removeClass("smltown_disable");
        }

        SMLTOWN.Events.touchScroll($("#smltown_gamesWrapper > div"), "top");
    }
    ,
    addRow: function (game) {
        var div = this.makeRow(game);
        $("#smltown_games").append(div);
    }
    ,
    makeRow: function (game) {
        var div = $("<div id='" + game.id + "' class='smltown_game smltown_fixedGame'>");

        var content = $("<div class='smltown_content'>");
        
        //ONLY ON :8080! (LET DEBUG)
//        if (document.location.hostname == "localhost" && !game.name) {
//            div.addClass("smltown_local");
//            game.name = "Local Game";
//        }

        var title = $("<div class='smltown_name'>");
        title.text(game.name);
        if (game.password) {
            title.append("<symbol class='smltown_password'>x</symbol>");
        }

        var icons = $("<div class='smltown_icons'>");
        SMLTOWN.Add.icons(game, icons);
        title.append(icons);

        content.append(title);

        content.append("<span class='smltown_playersCount'><small>players: </small> " + game.players + "</span>");
        if (game.admin) {
            content.append("<span class='smltown_admin'><small>admin: </small> " + game.admin + "</span>");
        }

        var playing = parseInt(game.playing);
        var gameInfo = $("<span class='smltown_gameInfo'>");
        if (game.message) {
            var message = SMLTOWN.Message.translate(game.message);
            gameInfo.text('"' + message + '"');
            div.addClass("smltown_playingMessage");
        } else if (playing) {
            var playingHere = SMLTOWN.Message.translate("playingHere");
            gameInfo.html("<small>" + playingHere + "<small>");
            div.addClass("smltown_playing");
        } else if ("0" != game.status) {
            gameInfo.html("<small>game started<small>");
            div.addClass("smltown_playingStarted");
        }
        content.append(gameInfo);

        div.append(content);

        //remove game kind
        var back = $("<div class='smltown_backGame'>");
        var bold = $("<span style='font-weight: bold;'>");
        var own = parseInt(game.own);
        if (own) {
            back.css("color", "red");
            bold.smltown_text("removeGameSwipe");
        } else if (playing) {
            back.css("color", "orange");
            bold.smltown_text("exitGameSwipe");
        } else {
            bold.smltown_text("hideGameSwipe");
        }
        back.append(bold);
        div.append(back);

        this.setGameEvents(div, game);
        return div;
    }
    ,
    exitGame: function (id) {
        if (!SMLTOWN.user.userId) {
            return;
        }
//        SMLTOWN.Server.ajax({
//            action: "exitGame",
//            game_id: id,
//            user_id: SMLTOWN.user.userId
//        });
        SMLTOWN.Server.request.exitGame(id);
    }
    ,
    removeGame: function (div) {
        var id = div.attr("id");
        SMLTOWN.Server.ajax({
            action: "removeGame",
            id: id
        });
    }
//    ,
//    addLocalGamesRow: function (href, ip, name) {
//        var div = $("<div class='smltown_game smltown_content smltown_local'>");
//        div.append("<span class='name'>Local Game</span>");
//        if (!name) {
//            name = "ip: " + ip;
//        }
//        div.append("<span class='smltown_admin'><small>" + name + "</small></span>");
//
//        $("#smltown_games").prepend(div);
//        div.on("tap", function () {
//            SMLTOWN.Local.stopRequests();
//            SMLTOWN.Load.showPage("game?1");
//        });
//    }
    ,
    create: function () {
        SMLTOWN.Local.stopRequests();
        var name = $("#smltown_nameGame input").val();
        if (name.length < 3) {
            SMLTOWN.Message.flash("_nameMustLength");
            return;
        }
        if ($("#smltown_newGame").hasClass("smltown_disable")) {
            SMLTOWN.Message.flash(name + ", _gameNameExists");
            return;
        }
        for (var i = 0; i < this.array; i++) {
            if (name.toLowerCase() == this.array[i].name.toLowerCase()) {
                SMLTOWN.Message.flash(name + ", _gameNameExists");
                return;
            }
        }

        //start loading
        SMLTOWN.Server.loading();
        SMLTOWN.Server.ajax({
            action: "createGame",
            name: name,
            ISO: document.documentElement.lang

        }, function (id) {
            SMLTOWN.Server.loaded();

            if (-1 == id) {
                SMLTOWN.Message.flash("_gameNameAlreadyExists");
                return false;
            }

            if (!isNaN(id)) {
                SMLTOWN.Game.info.id = id;
                SMLTOWN.Load.showPage("game?" + SMLTOWN.Game.info.id);
            } else {
                smltown_error("error on id = " + id);
            }
        });
    }
    ,
    gamelistEvents: function () {
        var $this = this;
        //LIST EVENTS
        //search utility
        $("#smltown_nameGame input").off(".gameListEvent");
        $("#smltown_nameGame input").on("keyup.gameListEvent", function (e) {

            var input = $(this);
            //SUBMIT
            if (e.keyCode == '13') {
                $this.create();
                return false;
            }

            //on change only fires when blur
            var newNameLength = $("#smltown_nameGame input").val().length;
            if ($this.oldSearchLength != newNameLength) {
                $("#smltown_newGame").addClass("smltown_disable");
            }
            $this.oldSearchLength = newNameLength;

            clearTimeout($this.typing);
            $this.typing = setTimeout(function () {

                //SEARCH
                var val = input.val();
                if (val == $this.gameSearchValue) {
                    return;
                }
                $this.gameSearchValue = val;

                if (val.length > 2) {
                    $this.nameGameSearched = true;
                    $this.getGamesInfo({name: val.toLowerCase()});

                } else {
                    if (!val.length) { //if remove search name reload again       
                        if ($this.nameGameSearched) {
                            $this.reloadList();
                        }
                        $this.nameGameSearched = false;
                    }
                }

            }, 650);
        });

        //CREATE GAME
        $("#smltown_newGame").off(".gameListEvent");
        $("#smltown_newGame").on("tap.gameListEvent", function () {
            clearTimeout($this.typing);
            $this.create();
        });
    }
    ,
    getGamesInfo: function (obj, callback) {
        var $this = this;
        if (!SMLTOWN.user.userId) {
            console.log("not user id yet");
            setTimeout(function () {
                $this.getGamesInfo(obj, callback);
            }, 1000);
            return;
        }

        SMLTOWN.Load.start(null, "lookingGames");
        if (!obj) {
            obj = {};
        }
        obj.action = "getGamesInfo";
        obj.userId = SMLTOWN.user.userId;

        SMLTOWN.Server.ajax(obj, function (games) {
            console.log(games);
            if (callback) {
                callback(games);
            } else {
                $this.list(games);
            }
            SMLTOWN.Load.end();
        });
    }
    ,
    reloadList: function () {
        //load games
        $(".smltown_game").remove();
        this.getGamesInfo();
        if ("localhost" != location.hostname && SMLTOWN.config.local_servers) {
            SMLTOWN.Local.pingGames();
        }
    }
    ,
    movedGame: [false]
    ,
    setGameEvents: function (div, game) {
        var _this = this;

        var content = div.find(".smltown_content");
        content.on("tap", function () {
            _this.clickGameEvent(div);
        });

        SMLTOWN.UI.swipeDiv(content, function () {
            div.removeClass("smltown_fixedGame");
            //reset all the rest
            $(".smltown_game smltown_content").css("transform", "translateX(0)");
            
            _this.swipeGameStart();

        }, function (removed) {            
            _this.swipeGameEnd();
            
            if(!removed){
                return;
            }
            
            if (parseInt(game.own)) {
                _this.removeGame(div);

            } else if (parseInt(game.playing)) {
                _this.exitGame(game.id);
                game.playing = 0;
                game.players = parseInt(game.players) - 1;

                var newDiv = _this.makeRow(game);
                newDiv.removeClass("smltown_fixedGame");
                var newContent = newDiv.find(".smltown_content");
                newContent.addClass("smltown_removeGame");

                //change div
                setTimeout(function () {
                    div.replaceWith(newDiv);
                }, 500);

                //return div to original position
                setTimeout(function () {
                    newDiv.addClass("smltown_fixedGame");
                    this.movedGame[0] = false;
                }, 1000);

                //reset class
                setTimeout(function () {
                    newContent.removeClass("smltown_removeGame");
                }, 1500);

                //return;
            }

            setTimeout(function () {
                div.remove();
            }, 500);
                        
        }, this.movedGame);
    }
    ,
    swipeGameStart: function(){
        console.log("not overwrited swipeGameStart");
        //device control
    }
    ,
    swipeGameEnd: function(){
        console.log("not overwrited swipeGameEnd");
        //device control
    }
    ,
    clickGameEvent: function (div) {
        console.log("clickGameEvent!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        if (this.movedGame[0]) {
            return;
        }
        var id = div.attr("id");
        console.log(id);
        this.access(id); //full path for bind on click 
    }
    ,
    access: function (id) {
        console.log("access!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        if ($("#smltown_game").length) {
            return;
        }

        SMLTOWN.Local.stopRequests();
        SMLTOWN.Load.start();
        SMLTOWN.Game.info.id = id;
        SMLTOWN.Load.showPage("game?" + id);
    }
};