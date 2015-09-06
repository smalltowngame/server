
SMLTOWN.Games = {
    array: []
    ,
    offset: 0
    ,
    over: false
    ,
    update: function () {
        var $this = this;
        SMLTOWN.Server.ajax({action: "getGamesInfo", userId: SMLTOWN.user.userId}, function (games) {
            $this.list(games);
        });
    }
    ,
    loadMore: function () {
        var $this = this;
        if (this.over) {
            return;
        }

        $("#smltown_loadingDiv").addClass("smltown_loader");
        var offset = this.offset;
        console.log("loadMore: offset = " + offset);

        SMLTOWN.Server.ajax({action: "getGamesInfo", userId: SMLTOWN.user.userId, offset: offset}, function (games) {
            console.log(games);
            $("#smltown_loadingDiv").removeClass("smltown_loader");
            var length = games.length;
            if (!length) {
                $("#smltown_loadingDiv").append(SMLTOWN.Message.translate("noMoreGames"));
                //SMLTOWN.Message.flash("noMoreGames");
                $this.over = true;
                return;
            }
            $this.offset += length;
            for (var i = 0; i < length; i++) {
                $this.addRow(games[i]);
            }

            $("#smltown_games").append($("#smltown_footer"));
            SMLTOWN.Events.touchScroll($("#smltown_gamesWrapper"), "top");
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
        for (var i = 0; i < length; i++) {
            this.addRow(games[i]);
//            if (document.location.hostname == "localhost") {
//                break; //dont let multiple local device games
//            }
        }
        $("#smltown_games").append($("#smltown_footer"));
        SMLTOWN.Events.touchScroll($("#smltown_gamesWrapper"), "top");
    }
    ,
    addRow: function (game) {
        var div = $("<div id='" + game.id + "' class='smltown_game smltown_fixedGame'>");

        var content = $("<div class='smltown_content'>");

        if (document.location.hostname == "localhost" && !game.name) {
            div.addClass("smltown_local");
            game.name = "Local Game";
        }

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
        content.append("<span class='smltown_admin'><small>admin: </small> " + game.admin + "</span>");

        var gameInfo = $("<span class='smltown_gameInfo'>");
        if (game.message) {
            var message = SMLTOWN.Message.translate(game.message);
            gameInfo.text('"' + message + '"');
            div.addClass("smltown_playingMessage");
        } else if (parseInt(game.playing)) {
            var playingHere = SMLTOWN.Message.translate("playingHere");
            gameInfo.html("<small>" + playingHere + "<small>");
            div.addClass("smltown_playing");
        } else if ("0" != game.status) {
            gameInfo.html("<small>game started<small>");
            div.addClass("smltown_playingStarted");
        }
        content.append(gameInfo);

        div.append(content);

        var back = $("<div class='smltown_backGame'>");
        var bold = $("<span style='font-weight: bold;'>");
//        var light = $("<small>");
        //quit button for own admin games
        var own = parseInt(game.own);
        if (own) {
            back.css("color", "red");
            bold.smltown_text("removeGameSwipe");
//            light.smltown_text("removeGameSwipeInfo");
        } else {
            bold.smltown_text("hideGameSwipe");
//            light.smltown_text("hideGameSwipeInfo");
        }
        back.append(bold);
//                .append(light);
        div.append(back);

        $("#smltown_games").append(div);
        this.setGameEvents(div, own);
    }
    ,
    removeGame: function (div) {
        var id = div.attr("id");
        SMLTOWN.Server.ajax({
            action: "removeGame",
            id: id
        });
    }
    ,
    addLocalGamesRow: function (href, ip, name) {
        var div = $("<div class='smltown_game smltown_local'>");
        div.append("<span class='name'>Local Game</span>");
        if (!name) {
            name = "ip: " + ip;
        }
        div.append("<span class='smltown_admin'><small>" + name + "</small></span>");

        $("#smltown_games").prepend(div);
        div.click(function () {
            SMLTOWN.Local.stopRequests();
            SMLTOWN.Load.showPage("game?1");
        });
    }
    ,
    create: function () {
        SMLTOWN.Local.stopRequests();
        var name = $("#smltown_nameGame input").val();
        if (name.length < 3) {
            SMLTOWN.Message.flash("name must contain 3 letters");
            return;
        }
        for (var i = 0; i < this.array; i++) {
            if (name.toLowerCase() == this.array[i].name.toLowerCase()) {
                SMLTOWN.Message.flash("game name exists");
                return;
            }
        }

        //start loading
        SMLTOWN.Server.loading();
        SMLTOWN.Server.ajax({
            action: "createGame",
            name: name
        }, function (id) {
            SMLTOWN.Server.loaded();
            if (!isNaN(id)) {
                SMLTOWN.Game.info.id = id;
                SMLTOWN.Load.showPage("game?" + SMLTOWN.Game.info.id);
            } else {
                smltown_error("error on id = " + id);
            }
        });
    }
    ,
    movedGame: false
    ,
    setGameEvents: function (div, own) {
        var $this = this;
        var xOrigin, x, dif, opacity;

        var content = div.find(".smltown_content");
        content.on("click", function () {
            $this.clickGameEvent(div)
        });

        content.on(touchstart, function (e) {
            if (e.originalEvent.touches) {
                e = e.originalEvent.touches[0];
            }
            xOrigin = e.pageX;
            dif = 0;
            content.on(touchmove, function (e) {
                $this.movedGame = true;
                if (e.originalEvent.touches) {
                    e = e.originalEvent.touches[0];
                }
                x = e.pageX;
                dif = x - xOrigin;
                if (dif < 0) {
                    dif = 0;
                }
                content.css("transform", "translateX(" + dif + "px)");
                opacity = 1 - dif / $(this).width();
                content.css("opacity", opacity);

                div.removeClass("smltown_fixedGame");

                if (dif > 50) {
                    content.off("click");
                }

            });

            $(document).one(touchend, function () {
                content.off(touchmove);

                if (dif > content.width() / 2) {
                    content.addClass("smltown_removeGame");
                    setTimeout(function () {
                        div.remove();
                    }, 500);

                    if (own) {
                        $this.removeGame(div);
                    }

                } else {
                    div.addClass("smltown_fixedGame");
                    $this.movedGame = false;
                }
            });
        });
    }
    ,
    clickGameEvent: function (div) {
        if (this.movedGame) {
            return;
        }
        var id = div.attr("id");
        console.log(id);
        SMLTOWN.Games.access(id); //full path for bind on click 
    }
    ,
    access: function (id) {
        if (id == SMLTOWN.Game.info.id) {
            return;
        }
        SMLTOWN.Load.start();
        SMLTOWN.Local.stopRequests();
        SMLTOWN.Game.info.id = id;
        SMLTOWN.Load.showPage("game?" + id);
    }
};
    