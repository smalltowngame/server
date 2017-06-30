
SMLTOWN.Add = {
    backgroundCard: function(div, filename) {

        if (SMLTOWN.Load.loading) {
            setTimeout(function() {
                SMLTOWN.Add.backgroundCard(div, filename);
            }, 2000);
            return;
        }

        var url = this.getCardUrl(filename);
        if(!url){
            return;
        }

        $('<img/>').attr('src', url).load(function() {
            $(this).remove(); // prevent memory leaks as @benweet suggested
            div.css('background-image', "url('" + url + "')");
            div.find("name").remove();

        }).error(function() {
            var nameArray = filename.split("_");
            var name = nameArray[nameArray.length - 1];

            var card = SMLTOWN.cards[filename];
            if (card) {
                name = card.name;
            }
            var nameContent = $("<name>" + name + "</name>");
            div.prepend(nameContent);
            //fill text size
            var fontSize = parseInt(div.css("font-size"));
            var divWidth = div.width();
            while (nameContent.width() > divWidth) {
                div.css("font-size", fontSize-- + "px");
                if (!fontSize) {
                    return;
                }
            }
            div.addClass("smltown_textCard");
        });

        //
//        var url = this.getCardUrl(filename);
//
//        var img = new Image();
//        img.onload = function () {
//            div.css('background-image', "url('" + url + "')");
//            div.find("name").remove();
//        };
//        img.onerror = function () {
//            var name = nameArray[nameArray.length - 1];
//            var card = SMLTOWN.cards[filename];
//            if (card) {
//                name = card.name;
//            }
//            var nameContent = $("<name>" + name + "</name>");
//            div.prepend(nameContent);
//            //fill text size
//            var fontSize = parseInt(div.css("font-size"));
//            var divWidth = div.width();
//            while (nameContent.width() > divWidth) {
//                div.css("font-size", fontSize-- + "px");
//                if (!fontSize) {
//                    return;
//                }
//            }
//            div.addClass("smltown_textCard");
//        };
//        img.src = url;
    }
    ,
    getCardUrl: function(filename) {
        if (!filename) {
            return false;
        }
        var nameArray = filename.split("_");
        var nameCard = nameArray[nameArray.length - 1];
        if(!SMLTOWN.Game.info.type){
            SMLTOWN.Load.gameList();
            return false;
        }
        var gamePath = "games/" + SMLTOWN.Game.info.type;
        return SMLTOWN.path + gamePath + "/cards/card_" + nameCard + ".jpg";
    }
    ,
    icons: function(game, content) {
        content.find(".smltown_passwordIcon").remove();
        content.find(".smltown_clockIcon").remove();
        content.find(".smltown_openVotingIcon").remove();
        content.find(".smltown_endTurnIcon").remove();

        if (game.password) {
            var icon = $("<div class='smltown_passwordIcon'>");
            icon.on("tap", function() {
                SMLTOWN.Message.flash("_gameWithPassword");
            });
            content.append(icon);
        }

        //public game
        if ("1" == game.public) {
            var time = Date.parse(game.lastConnection + " GMT+0000"); //prevent user timezone
            if (time > (new Date()).getTime() - 86400000) {
                var div = $("<div class='smltown_FontAwesome smltown_publicIcon'>");
                div.on("tap", function() {
                    //TODO flash?
                });
                content.find(".smltown_publicIcon").remove();
                content.append(div);
            }
        }

        //day Time by player
        if ("1" == game.dayTime) {
            var div = $("<div>");
            div.append("<div class='smltown_clockIcon'>");
            div.append(game.dayTime);
            div.on("tap", function() {
                SMLTOWN.Message.flash("_timeByPlayer");
            });
            content.append(div);
        }

        //open voting
        if ("1" == game.openVoting) {
            var div = $("<div class='smltown_openVotingIcon'>");
            div.on("tap", function() {
                SMLTOWN.Message.flash("_letVoteDay");
            });
            content.append(div);
        }

        //admin end Turn power
        if ("1" == game.endTurn) {
            var div = $("<div class='smltown_endTurnIcon'>");
            div.on("tap", function() {
                SMLTOWN.Message.flash("_adminCanEndTurn");
            });
            content.append(div);
        }
    }
    ,
    quitPlayerButtons: function() {
        $(".smltown_quit").remove();
        if (SMLTOWN.user.admin) {
            for (var id in SMLTOWN.players) {
                if (id && id != SMLTOWN.user.id) {
                    $("#" + id).append(
                            "<div class='smltown_waiting smltown_quit'>quit</div>");
                }
            }
        }
        $(".smltown_player .smltown_quit").on("tap", function() {
            var id = $(this).closest(".smltown_player").attr("id");
            $("#" + id).remove();
            SMLTOWN.Server.request.deletePlayer(id);
            delete SMLTOWN.players[id];
        });
    }
    ,
    userNamesByClass: function() {
        for (var id in SMLTOWN.players) {
            var name = SMLTOWN.players[id].name;
            $(".id" + id + ":empty").append(name + ": "); //not .text() translate
        }
    }
};
