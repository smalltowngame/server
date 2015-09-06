
SMLTOWN.Add = {
    backgroundCard: function (div, filename) {     
        console.log(444)
        var nameArray = filename.split("_");
        var nameCard = nameArray[nameArray.length - 1];
        var gamePath = "games/" + SMLTOWN.Game.info.type;
        var url = SMLTOWN.path + gamePath + "/cards/card_" + nameCard + ".jpg";

        $('<img/>').attr('src', url).load(function () {
            $(this).remove(); // prevent memory leaks as @benweet suggested
            div.css('background-image', "url('" + url + "')");
            div.find("name").remove();
        }).error(function () {
            var name = nameCard;
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
    }
    ,
    icons: function (game, content) {
        content.find(".smltown_passwordIcon").remove();
        content.find(".smltown_clockIcon").remove();
        content.find(".smltown_openVotingIcon").remove();
        content.find(".smltown_endTurnIcon").remove();

        if (game.password) {
            var icon = $("<div class='smltown_passwordIcon'>");
            icon.click(function () {
                SMLTOWN.Message.flash("game with password");
            });
            content.append(icon);
        }

        //day Time by player
        if ("1" == game.dayTime) {
            var div = $("<div>");
            div.append("<div class='smltown_clockIcon'>");
            div.append(game.dayTime);
            div.click(function () {
                SMLTOWN.Message.flash("seconds of day time by player");
            });
            content.append(div);
        }

        //open voting
        if ("1" == game.openVoting) {
            var div = $("<div class='smltown_openVotingIcon'>");
            div.click(function () {
                SMLTOWN.Message.flash("let players vote during the day");
            });
            content.append(div);
        }

        //admin end Turn power
        if ("1" == game.endTurn) {
            var div = $("<div class='smltown_endTurnIcon'>");
            div.click(function () {
                SMLTOWN.Message.flash("admin can end turn immediately");
            });
            content.append(div);
        }
    }
    ,
    quitPlayerButtons: function () {
//        if ($.isEmptyObject(SMLTOWN.Game.info)) {
//            return;
//        }
        //console.log("add quits");
        $(".smltown_quit").remove();
        if (SMLTOWN.user.admin) {
            for (var id in SMLTOWN.players) {
                if (id && id != SMLTOWN.user.id) {
                    $("#" + id).append(
                            "<div class='smltown_waiting smltown_quit smltown_button'>quit</div>");
                }
            }
        }
        $(".smltown_player .smltown_quit").click(function () {
            var id = $(this).closest(".smltown_player").attr("id");
            $("#" + id).remove();
            SMLTOWN.Server.request.deletePlayer(id);
        });
    }
    ,
    userNamesByClass: function () {
        for (var id in SMLTOWN.players) {
            var name = SMLTOWN.players[id].name;
            $(".id" + id + ":empty").append(name + ": "); //not .text() translate
        }
    }
    ,
    help: function () {
        var status = SMLTOWN.Game.info.status;
        if (!status) {
            status = 0;
        }

        var t = SMLTOWN.Message.translate;
        var text = t("help_status" + status);

        text += "</br>"; /////////////////////////////////

        var waitPlayers = [];
        for (var id in SMLTOWN.players) {
            var player = SMLTOWN.players[id];
            if (player.message) {
                waitPlayers.push(player.name);
            }
        }
        if (waitPlayers.length) {
            text += t("help_waiting");
            for (var i = 0; i < waitPlayers.length; i++) {
                text += waitPlayers[i];
                if (waitPlayers.length + 1 != i) {
                    text += ", ";
                } else {
                    text += ". ";
                }
            }
        }

        text += "</br>"; /////////////////////////////////

        text += t("help_cardsPlaying");
        var cards = SMLTOWN.Game.info.cards;
        for (var card in cards) {
            var cardName = SMLTOWN.cards[card].name;
            text += cardName;
            text += ", ";
        }

        $("#smltown_helpMessage .smltown_text").html(text);
    }
    ,
    helpList: [
        ["#smltown_menuIcon", "help_menuIcon", "#smltown_menuIcon"]
                ,
        ["#smltown_cardIcon", "help_cardIcon", "#smltown_card, #smltown_cardIcon"]
                ,
        ["#smltown_console", "help_console"]
                ,
        ["#smltown_popup", "help_popup"]
    ]
    ,
    nextHelp: function (next) {
        $(".smltown_helpDiv").remove();
        var help = this.helpList[next];
        if (!help) {
            return;
        }
        var target = null;
        if (help.length > 2) {
            target = help[2];
        }
        var action = null;
        if (help.length > 3) {
            action = help[3];
        }
        this.locateHelper(help[0], help[1], target, action, next);
    }
    ,
    locateHelper: function (div, value, target, action, next) {
        var $this = this;
        var help = $("<div class='smltown_helpDiv'>");

        var pos = $(div).offset();
        var x = pos.left, y = pos.top;
        var height = $("#smltown_html").height();
        var width = $("#smltown_html").width();
        var divWidth = $(div).width();
        var divHeight = $(div).height();

        if (x + divWidth / 2 <= width / 2) {
            help.css("left", x + 5);
        } else {
            /*if(!divWidth){
             divWidth = 35;
             }*/
            help.css("right", width - x - divWidth - 5);
        }

        if (y + divHeight / 2 <= height / 2) {
            if (!divHeight) {
                divHeight = 20;
            }
            help.css("top", y + divHeight + 10);
        } else {
            help.css("bottom", height - y + 10);
        }

        var text = SMLTOWN.Message.translate(value);
        help.html(text + "</br>");

        if (!target) {
            var button = $("<button>");
            button.text("ok");
            button.click(function () {
                $this.nextHelp(next+1);
            });
            help.append(button);
            //
        } else {
            var event = "click";
            if (action) {
                event = action;
            }
            $(target).on(event + ".help", function () {
                console.log("help event");
                $(this).off(".help");
                $this.nextHelp(next+1);
            });
        }

        $("#smltown_game").append(help);
    }
};
