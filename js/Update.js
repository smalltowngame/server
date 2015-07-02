
SMLTOWN.Update = {
    all: function(res) {
        var $this = this;
        console.log(res);
        var rules;
        if (res.user) {
            if (typeof res.user.userId != "undefined" && res.user.userId) {
                SMLTOWN.user.id = res.user.userId;
            }
            if (typeof res.user.rulesJS != "undefined") {
                rules = res.user.rulesJS;
            }
            if (typeof res.user.message != "undefined" && res.user.message) {
                if (jQuery.isEmptyObject(SMLTOWN.players)) {
                    SMLTOWN.Message.message = res.user.message;
                } else {
                    SMLTOWN.Message.setMessage(res.user.message);
                }
            }
            if (res.user.admin) { // == 1
                $(".smltown_admin").addClass("smltown_selectable");
            }
        }

        if (res.players) { // PLAYERSS
            if (!SMLTOWN.user.id) {
                smltown_error("NOT USER ERROR, re-loading...");
                SMLTOWN.Server.request.getAll();
                return;
            }

            //remove old players
            if (SMLTOWN.players) {
                for (var id in SMLTOWN.players) {
                    if (false == SMLTOWN.Util.getById(res.players, id)) {
                        console.log("delete Player = " + id)
                        delete SMLTOWN.players[id];
                    }
                }
            } else {
                SMLTOWN.players = {};
            }

            //Get new players
            for (var i = 0; i < res.players.length; i++) {
                var player = res.players[i];
                var id = player.id;
                if (SMLTOWN.players[id]) {
                    for (var key in player) {
                        SMLTOWN.players[id][key] = player[key];
                    }
                } else {
                    SMLTOWN.players[id] = player;
                }
            }

            this.players();
            SMLTOWN.Add.quitPlayerButtons();
            if (rules && SMLTOWN.user.status > -1) {
                eval(rules);
            }

            if (SMLTOWN.Message.message) {
                SMLTOWN.Message.setMessage(SMLTOWN.Message.message);
                SMLTOWN.Message.message = null;
            }
        }

        if (res.user && res.user.card) { //if is really now updated (card)
            SMLTOWN.card = res.user.card;
            var arrayName = res.user.card.split("_");
            SMLTOWN.cardName = arrayName[arrayName.length - 1];
            SMLTOWN.Action.night = {}; //restart functions
            SMLTOWN.temp = {}; //restart variables

            SMLTOWN.cardLoading = true;
            $("#smltown_phpCard").load("cards/" + SMLTOWN.card + ".php", function(response) { //card could be changed
                SMLTOWN.cardLoading = false;
                console.log("card loaded");
                if (response.indexOf("Fatal error") > -1) {
                    setLog(response);
                }
                $this.userCard();
                if (SMLTOWN.Game.info) {
                    $this.gameStatus();
                }
            });
        }

        if (res.cards) { // RULES
            this.allCards(res.cards); //all cards
        }

        if (res.game) { // GAME
//            if (!SMLTOWN.Game.info.cards) {
//                SMLTOWN.Game.info.cards = {};
//            }
            if (res.game.cards) {
                try { //only game cards
                    res.game.cards = JSON.parse(res.game.cards);
                } catch (e) {
                    console.log("SMLTOWN.Game.info.cards couldn't parse: " + e);
                }
                this.playingCards(res.game.cards); //playing game cards
            }

            this.game(res.game);

            //UPDATE ALL KEYS
            for (var key in res.game) {
                SMLTOWN.Game.info[key] = res.game[key];
            }

            if (res.game.status) {
                SMLTOWN.Game.info.status = parseInt(SMLTOWN.Game.info.status);
            }

            if (!SMLTOWN.cardLoading) { //not w8 load php card
                this.gameStatus();
            }
        }
        clearTimeout(SMLTOWN.temp.wakeUpInterval);
    }
    ,
    game: function(game) {
        if (game.name) {
            $("#smltown_gameName").text(game.name);
        }
        //password
        if (game.password) {
            var icon = $("<div id='smltown_passwordIcon'>");
            //options
            $("#smltown_password input").val(game.password);
            $("#smltown_header .smltown_content").append(icon);
            icon.click(function() {
                SMLTOWN.Message.flash("game with password");
            });
        }

        //day Time by player
        if (game.dayTime) {
            $("#smltown_dayTimeIcon").remove();
            if ("1" == game.dayTime) {
                var div = $("<div>");
                div.append("<div id='smltown_clockIcon'>");
                $("#smltown_dayTime input").attr("placeholder", game.dayTime);
                div.append(game.dayTime);
                $("#smltown_header .smltown_content").append(div);
                div.click(function() {
                    SMLTOWN.Message.flash("seconds of day time by player");
                });
            }
        }

        //open voting
        if (game.openVoting) {
            $("#smltown_openVotingIcon").remove();
            if ("1" == game.openVoting) {
                $("#smltown_openVoting input").attr('checked', true);
                var div = $("<div id='smltown_openVotingIcon'>");
                $("#smltown_header .smltown_content").append(div);
                div.click(function() {
                    SMLTOWN.Message.flash("let players vote during the day");
                });

                $("#smltown_sun").css("z-index", 0); // back to list
            }
        }

        //admin end Turn power
        if (game.endTurn) {
            $("#smltown_endTurnIcon").remove();
            if ("1" == game.endTurn) {
                $("#smltown_endTurn input").attr('checked', true);
                var div = $("<div id='smltown_endTurnIcon'>");
                $("#smltown_header .smltown_content").append(div);
                div.click(function() {
                    SMLTOWN.Message.flash("admin can end turn immediately");
                });
            }
        }

        if (game.time) {
            if (parseInt(game.time)) {
                SMLTOWN.Time.end = Date.now() / 1000 + game.time;
            } else {
                SMLTOWN.Time.end = 0;
            }
        }
    }
    ,
    gameStatus: function() {
        console.log("update game");
        //INPUTS
        SMLTOWN.Time.clearCountdown();

        //hide        
        $("#smltown_game").attr("class", "");
        //$("#smltown_console .smltown_night").hide();
        $(".smltown_gameOver").removeClass("smltown_selectable");
        $("#smltown_sun").hide();

        $("#smltown_startButton").hide();
        $("#smltown_endTurnButton").hide();

        //show &
        switch (SMLTOWN.Game.info.status) {

            case 1: //town discusing
                SMLTOWN.Server.ping = SMLTOWN.Server.fastPing;
                SMLTOWN.Add.quitPlayerButtons();

                SMLTOWN.Time.runCountdown();
                $(".smltown_gameOver").addClass("smltown_selectable");
                if ("1" == SMLTOWN.Game.info.endTurn) {
                    $("#smltown_endTurnButton").show();
                }

                $("#smltown_sun").show();
                if ($("#smltown_game").attr("class") != "smltown_day") { // 1st time   
                    $("#smltown_game").attr("class", "smltown_day");
                    $("#smltown_statusGame").smltown_text("dayTime");
                    SMLTOWN.Action.wakeUp("Good morning!");
                }

                break;
            case 2: //night time
                SMLTOWN.Server.ping = SMLTOWN.Server.fastPing;
                SMLTOWN.Action.wakeUp(false); //prevent wake up on other night turn

                if ($("#smltown_game").attr("class") != "smltown_night") { // 1st time                    
                    $("#smltown_game").attr("class", "smltown_night");
                    $(".smltown_userCheck").removeClass("userCheck");
                    $(".smltown_votes span").remove();

                    SMLTOWN.Action.sleep();
                    $("#smltown_statusGame").smltown_text("nightTime");
                    $("#smltown_console .smltown_night").show();
                }

                if (SMLTOWN.user.status > -1 && SMLTOWN.card == SMLTOWN.Game.info.night) {
                    if (SMLTOWN.Action.night.select) {
                        var t = SMLTOWN.Message.translate;
                        SMLTOWN.Action.wakeUp(t("wakeUp") + " " + SMLTOWN.cardName.toUpperCase() 
                                + "... " + t("yourTurn"));
                    }
                    if (SMLTOWN.Action.night.extra) {
                        SMLTOWN.Server.request.nightExtra();
                    }
                }

                break;
            case 3: //end game
                SMLTOWN.Server.ping = SMLTOWN.Server.slowPing;

                //on change
                if ($("#smltown_body").attr("class") != "smltown_gameover") {
                    console.log("end game")
                    SMLTOWN.Action.wakeUp("GAME OVER", true);
                    SMLTOWN.Action.endTurn();
                    $("#smltown_statusGame").smltown_text("GAME OVER");
                    $("#smltown_body").attr("class", "smltown_gameover");
                }

                for (var id in SMLTOWN.players) {
                    var player = SMLTOWN.players[id];
                    if (player.status > 0) {
                        $("#" + player.id + " .smltown_votes").html("(WIN)");
                    }
                }

                break;
            default: //waiting for new game (0)
                SMLTOWN.Server.ping = SMLTOWN.Server.slowPing;

                $(".smltown_gameOver").addClass("smltown_selectable");
                if ($("#smltown_body").attr("class") != "wait") { // 1st time  
                    $("#smltown_body").attr("class", "wait");
                    SMLTOWN.Action.wakeUp("gameRestarted", true);
                    $(".smltown_extra").empty();
                    $(".smltown_extra").css("background-image", "none");
                    for (var id in SMLTOWN.players) {
                        SMLTOWN.players[id].card = "";
                    }

                    SMLTOWN.Action.endTurn();
                    $("#smltown_statusGame").smltown_text("waitingNewGame");
                    $(".smltown_playerStatus").smltown_text("waiting");
                }

                if (SMLTOWN.user.admin && SMLTOWN.card) {
                    $("#smltown_startButton").show();
                }
        }
    }
    ,
    players: function() {
        var players = SMLTOWN.players;


        //1st GET USER PLAYER
        for (var id in players) {
            var player = players[id];
            if (player.id == SMLTOWN.user.id) {
                SMLTOWN.user = player;
                SMLTOWN.user.admin = parseInt(SMLTOWN.user.admin);
                if (!SMLTOWN.user.name) {
                    SMLTOWN.Message.login("noName");
                } else {
                    $("#smltown_updateName input").attr("placeholder", SMLTOWN.user.name);
                }
            }
        }

        //REMOVE UNUSED PLAYERS
        for (var i = 0; i < $(".smltown_player").length; i++) {
            var id = $(".smltown_player").eq(i).attr("id");
            if (!players[id]) {
                $(".smltown_player").eq(i).remove();
            }
        }

        //REMOVE VOTATIONS
        $(".smltown_votes, .smltown_extra").html("");

        // ADD ALL PLAYERS
        var iColor = 0;
        for (var id in players) {
            var player = players[id];

            var div;
            if ($("#" + id).length) {
                div = $("#" + id);
            } else {
                div = $("<div>");
                var up = $("<div class='smltown_up'>");
                var down = $("<div class='smltown_down'>");
                div.append("<symbol class='smltown_playerSymbol'>U</symbol>");
                div.append(up);
                div.append(down);
                up.append("<span class='smltown_name'>");
                down.append($("<span class='smltown_playerStatus'>"));
                down.append($("<span class='smltown_votes'>"));
                div.append($("<div class='smltown_extra'>"));
                div.attr("id", player.id);
                div.addClass("smltown_player");
                player.div = div;
                SMLTOWN.Events.playerEvents(player);
            }

            div.find(".smltown_name").text(player.name);

            if (!player.name) {
                var nameSpan = $(div).find(".name");
                var refer = "unnamed";
                if (player.admin < 0) {
                    refer = "bot";
                }
                $(nameSpan).html(refer + " <small>(.." + player.id.slice(-2) + ")</small>");
            }

            if (player.card) {
                var cardName = player.card.split("_")[1];
                player.cardName = cardName;
                div.find(".smltown_playerStatus").text(cardName);
                SMLTOWN.Add.backgroundCard(div.find(".smltown_extra"), player.card);
            }

            // SORT divs players
            player.status = parseInt(player.status);
            if (!player.status) { //if not playing
                $("#smltown_listSpectator").append(div);
                div.addClass("smltown_spectator");
                div.find(".smltown_playerStatus").smltown_text("spectator");
            } else if (player.status < 1) {
                $("#smltown_listDead").append(div);
                div.addClass("dead");
                div.find(".smltown_playerStatus").smltown_text("dead");
                div.find(".smltown_extra").text("☠");
            } else {
                $("#smltown_listAlive").append(div);
                div.find(".smltown_playerStatus").smltown_text("alive");
            }

            $('<style>.id' + player.id + ' {color:' + colors[iColor++] + '}</style>').appendTo('head');
            div.find(".smltown_name").addClass("id" + player.id);
            if (player.admin == 1) {
                div.find(".smltown_name").append("<symbol>R</symbol>");
            }
            if (SMLTOWN.user.id == player.sel) {
                div.find(".smltown_name").addClass("smltown_enemy");
            }
        }

        $("#smltown_user").append(SMLTOWN.players[SMLTOWN.user.id].div);
        // ADD INTERACTION PLAYERS
        for (id in players) {
            var player = players[id];
            if (player.sel) {
                SMLTOWN.Action.addVote(player.sel);
                if (SMLTOWN.players[player.sel].name) {
                    player.div.find(".smltown_playerStatus").append(" voting to " + SMLTOWN.players[player.sel].name);
                }
            }
        }
//        if(SMLTOWN.Action.preselect){
//            $("#" + SMLTOWN.Action.preselect).addClass("smltown_preselect");
//        }

        // OWN PROPERTIES
        $(".smltown_player").removeClass("smltown_userCheck");
        if (SMLTOWN.user.sel) {
            $("#" + SMLTOWN.user.sel).addClass("smltown_userCheck");
        }

        //on Players names Load -> if not yet
        if (!$("#smltown_console").hasClass('smltown_loaded')) {
            SMLTOWN.Message.addChats();
            $("#smltown_console").addClass('smltown_loaded');
        }
    }
    ,
    userCard: function() {
        $("#smltown_card").removeClass("rotate");
        if (!$("#smltown_cardFront").hasClass(SMLTOWN.card)) { //only new card
            $("#smltown_cardFront").attr("class", SMLTOWN.card);
                        
            var card = SMLTOWN.cards[SMLTOWN.card];
            SMLTOWN.Add.backgroundCard($("#smltown_cardFront .smltown_cardImage"), SMLTOWN.card);
            var name, desc;
            if (card) {
                name = card.name;
                desc = card.rules;
            } else {
                name = SMLTOWN.card;
                desc = "any special habilities";
            }
            
            $("#smltown_cardFront .smltown_cardText > div").text(name.toUpperCase());
            var p = $("<p>" + desc + "</p>");
            $("#smltown_cardFront .smltown_cardText > div").html(p);
            $("#smltown_card").addClass("smltown_visible");
            setTimeout(function() {
                $("#smltown_card").removeClass("smltown_visible");
            }, 400);
        }
    }
    ,
    allCards: function(cards) {
        SMLTOWN.cards = cards; //all cards

        $("#smltown_playingCards").html("");
        for (var cardName in SMLTOWN.cards) {
            var card = SMLTOWN.cards[cardName];

            var splitName = cardName.split("_");
            var gameMode = splitName[0];
            var group = splitName[1];

            //mode
            var divGameMode = $("#smltown_playingCards ." + gameMode);
            if (!divGameMode.length) { //not exists yet
                divGameMode = $("<table align='right' class='" + gameMode + "'>");
                $("#smltown_playingCards").append(divGameMode);
            }

            //group
            var divGroup = $("#smltown_playingCards ." + gameMode + " ." + group);
            if (!divGroup.length) { //not exists yet
                divGroup = $("<tr class='" + group + "'>");
                divGameMode.append(divGroup);
                if (group == "classic") {
                    divGameMode.prepend(divGroup);
                }
                divGroup.append("<p class='cardGroupName'>" + group + "</p>");
            }

            //sort on name containing
            var groupsDiv = divGameMode.find("> p");
            for (var i = 0; i < groupsDiv.length; i++) {
                var groupName = groupsDiv[i].className;
                if (groupName != group && groupName.indexOf(group) > -1) {
                    $(groupsDiv[i]).before(divGroup);
                }
            }

            //card
            var div = $("<p class = 'smltown_rulesCard smltown_cardOut' smltown_card = '" + cardName + "'>");

            var numberCards = card.min + " - " + card.max;
            if (card.min == card.max) {
                numberCards = card.min;
            }

            SMLTOWN.Add.backgroundCard(div, cardName);
            div.append("<span>" + numberCards + "</span>");
            div.append("<form class='smltown_admin'><input></form>");
            divGroup.append(div);
        }

        SMLTOWN.Events.cards();
    }
    ,
    playingCards: function(cards) { //active game cards
        $(".smltown_rulesCard").addClass("smltown_cardOut");
        for (var cardName in cards) {
            var cardNumber = cards[cardName];
            var div = $(".smltown_rulesCard[smltown_card='" + cardName + "']");
            div.removeClass("smltown_cardOut");
            if (cardNumber && "number" == typeof cardNumber) { //isNaN bug on [object Object]
                div.find("input").val(cardNumber).show();
                div.find("span").hide();
            }
        }
    }
};

var colors = [
    "red",
    "blue",
    "green",
    "orange",
    "purple",
    "lime",
    "pink",
    "brown",
    "yellow",
    "yellowgreen",
    "coral"
];
