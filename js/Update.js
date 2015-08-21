
SMLTOWN.Update = {
    all: function (res) {
        var $this = this;
        console.log(res);

        if (res.user) {
            if (res.user.userId) {
                //only here smltown_userId cookie
                SMLTOWN.Util.setPersistentCookie("smltown_userId", res.user.userId);
            }

            for (var key in res.user) {
                SMLTOWN.user[key] = res.user[key];
            }

            if (res.user.rulesJS) {
                console.log("rules = " + res.user.rulesJS);
                if (!SMLTOWN.players) {
                    SMLTOWN.rules = res.user.rulesJS;
                } else {
                    eval(res.user.rulesJS); //like a cupid lover
                }
            }
            if (typeof res.user.message != "undefined" && res.user.message) {
                if (jQuery.isEmptyObject(SMLTOWN.players)) {
                    SMLTOWN.Message.message = res.user.message;
                } else {
                    SMLTOWN.Message.setMessage(res.user.message);
                }
            }
            if ("1" == res.user.admin) { // == 1
                $(".smltown_admin").addClass("smltown_selectable");
                $("#smltown_becomeAdmin").hide();
            }
        }

        if (res.players) { // PLAYERS
            if (!SMLTOWN.user.id) {
                console.log("NOT USER LOADED, re-loading...");
                SMLTOWN.Server.request.getAll();
                return;
            }

            //remove old players
            if (SMLTOWN.players) {
                for (var id in SMLTOWN.players) {
                    if (false == SMLTOWN.Util.getById(res.players, id)) {
                        console.log("delete Player = " + id);
                        delete SMLTOWN.players[id];
                        $(".smltown_player#" + id).remove();
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

            var newPlayers = this.players();
            SMLTOWN.Add.quitPlayerButtons();

            if (SMLTOWN.rules && SMLTOWN.user.status > -1) {
                eval(SMLTOWN.rules); //like a cupid lover
            }
        }

        if (res.player) {
            this.player(res.player);
        }

        if (res.user && res.user.card) { //if is really now updated (card)
            SMLTOWN.Action.night = {}; //restart functions
            SMLTOWN.temp = {}; //restart variables
            $this.userCard();
        }

        if (res.cards) { // store RULES
            SMLTOWN.cards = res.cards;
            this.updateCards(); //once
        }

        if (res.game) { // GAME
            //PERFORM KEYS
            if (res.game.status) {
                res.game.status = parseInt(res.game.status);
            }
            if (res.game.cards) {
                try { //only game cards
                    res.game.cards = JSON.parse(res.game.cards);
                } catch (e) {
                    console.log("SMLTOWN.Game.info.cards couldn't parse: " + e);
                }
            }

            //UPDATE ALL KEYS
            for (var key in res.game) {
                SMLTOWN.Game.info[key] = res.game[key];
            }

            if (res.game.cards) {
                this.playingCards(res.game.cards); //playing game cards
            }

            this.game(res.game);

            //not w8 load php card
            if (!SMLTOWN.cardLoading) {
                this.gameStatus();
            }

        }
        clearTimeout(SMLTOWN.temp.wakeUpInterval);
    }
    ,
    game: function (game) {

        if (game.name) {
            $("#smltown_gameName").text(game.name);
        }

        //password
        $("#smltown_password input").val("");
        if (game.password) {
            $("#smltown_password input").val(game.password);
        }

        //day Time by player
        if ("1" == game.dayTime) {
            $("#smltown_dayTime input").attr("placeholder", game.dayTime);
        }

        //open voting
        $("#smltown_openVoting input").attr('checked', false);
        $("#smltown_sun").css("z-index", "initial"); // back to list
        if ("1" == game.openVoting) {
            $("#smltown_openVoting input").attr('checked', true);
            $("#smltown_sun").css("z-index", 0); // back to list
        }

        //admin end Turn power
        $("#smltown_endTurn input").attr('checked', false);
        if ("1" == game.endTurn) {
            $("#smltown_endTurn input")[0].checked = true;
        }

        if (game.time) {
            if (parseInt(game.time)) {
                SMLTOWN.Time.end = Date.now() / 1000 + game.time;
            } else {
                SMLTOWN.Time.end = 0;
            }
        }

        SMLTOWN.Add.icons(game, $("#smltown_header .smltown_content"));
    }
    ,
    gameStatus: function () {
        console.log("EMPTY gameStatus");
    }
    ,
    players: function () {
        var players = SMLTOWN.players;
        var newPlayers = 0;

        //1st GET USER PLAYER
        for (var id in players) {
            var player = players[id];
            if (player.id == SMLTOWN.user.id) {

                if (player.name && SMLTOWN.user.name != player.name) {
//                    SMLTOWN.Util.setPersistentCookie("smltown_userName", player.name);
                    localStorage.setItem("smltown_userName", player.name);
                }

                //only not null values
                for (var key in player) {
                    if (player[key] != null) {
                        SMLTOWN.user[key] = player[key];
                    }
                }

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
        $(".smltown_votes").html("");
        $(".smltown_waitingPlayer").html("");

        // ADD ALL PLAYERS
        var iColor = 0;
        for (var id in players) {
            var player = players[id];

            var div;
            if ($("#" + id).length) {
                div = $("#" + id);
                div.removeClass("smltown_spectator smltown_dead");
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
                div.append($("<div class='smltown_waitingPlayer'>"));
                div.attr("id", player.id);
                div.addClass("smltown_player");
                div.attr("preselect-content", SMLTOWN.Message.translate("PRESELECT"));
                player.div = div;
                SMLTOWN.Events.playerEvents(player);

                newPlayers++;
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
                if (player.status == -1 || SMLTOWN.Game.info.status > 4) {
                    console.log(player.card);
                    SMLTOWN.Add.backgroundCard(div.find(".smltown_extra"), player.card);
                }
            }

            // SORT divs players
            player.status = parseInt(player.status);
            if ("undefined" == typeof player.status || null == player.status) { //if not playing
                $("#smltown_listSpectator").append(div);
                div.addClass("smltown_spectator");
                div.find(".smltown_playerStatus").smltown_text("spectator");
            } else if (player.status < 1) {
                $("#smltown_listDead").append(div);
                div.addClass("smltown_dead");
                div.find(".smltown_playerStatus").smltown_text("dead");
//                div.find(".smltown_extra").text("☠");
                div.find(".smltown_extra").text("✘");
            } else {
                $("#smltown_listAlive").append(div);
                div.find(".smltown_playerStatus").smltown_text("alive");
                div.find(".smltown_extra").text("");
            }

            $('<style>.id' + player.id + ' {color:' + colors[iColor++] + '}</style>').appendTo('head');
            div.find(".smltown_name").addClass("id" + player.id);
            if (player.admin == 1) {
                div.find(".smltown_name").append("<symbol>R</symbol>");
            }

            if (player.message) {
                div.find(".smltown_waitingPlayer").text("⌛");
            }

            if (SMLTOWN.user.id == player.sel) {
                div.find(".smltown_name").addClass("smltown_enemy");
            }
        }

        $("#smltown_user").append(SMLTOWN.players[SMLTOWN.user.id].div);
        // ADD INTERACTION PLAYERS        
        for (id in players) {
            var player = players[id];
            if (player.sel
                    && SMLTOWN.user.id != player.id) { //set on user check
                SMLTOWN.Action.addVote(player.sel);
                //if ("undefined" != typeof SMLTOWN.players[player.sel].name) {
                //    player.div.find(".smltown_playerStatus").append(" voting to " + SMLTOWN.players[player.sel].name);
                //}
            } else if ("" == player.sel) {
                player.div.find(".smltown_waitingPlayer").text("⌛");
            }
        }

        // OWN PROPERTIES
        $(".smltown_player").removeClass("smltown_check");
        if (SMLTOWN.user.sel) {
            $("#" + SMLTOWN.user.sel).addClass("smltown_check");
            SMLTOWN.Action.addVote(SMLTOWN.user.sel);
        }

        //on Players names Load -> if not yet
        if (!$("#smltown_console").hasClass('smltown_loaded')) {
            SMLTOWN.Message.addChats();
            $("#smltown_console").addClass('smltown_loaded');
        }

        return newPlayers;
    }
    ,
    player: function (player) {
        for (var key in player) {
            SMLTOWN.players[player.id][key] = player[key];
        }
        this.players();
    }
    ,
    userCard: function () {
        console.log("user-Card update");
        var $this = this;
        SMLTOWN.cardLoading = true;

        if (!$("#smltown_cardFront").hasClass(SMLTOWN.user.card)) { //only new card
            $("#smltown_cardFront").attr("class", SMLTOWN.user.card);

            var card = SMLTOWN.cards[SMLTOWN.user.card];
            SMLTOWN.Add.backgroundCard($("#smltown_cardFront .smltown_cardImage"), SMLTOWN.user.card);
            var name, desc, quote = "";
            if (card) {
                name = card.name;
                desc = card.rules;
                if (card.quote) {
                    quote = card.quote;
                }
            } else {
                name = SMLTOWN.user.card;
                desc = "any special habilities";
            }

            $("#smltown_cardFront .smltown_cardText > div")
                    .html(name.toUpperCase()
                            + "<p class='smltown_desc'>" + desc + "</p>"
                            + '<p class="smltown_quote">"' + quote + '"</p>');

            $("#smltown_card").addClass("smltown_visible");
            SMLTOWN.Transform.cardRotateSwipe();
        }

        //load card
        var gamePath = "games/" + SMLTOWN.Game.info.type;
        $("#smltown_phpCard").load(gamePath + "/cards/" + SMLTOWN.user.card + ".php", function (response) { //card could be changed
            SMLTOWN.cardLoading = false;
            if (response.indexOf("Fatal error") > -1) { //catch error
                smltown_error(response);
            }
            if (SMLTOWN.Game.info) {
                $this.gameStatus(); //important
            }
        });
    }
    ,
    updateCards: function () {
        console.log("update Cards");

        $("#smltown_playingCards").html("");
        for (var cardName in SMLTOWN.cards) {
            var card = SMLTOWN.cards[cardName];

            var splitName = cardName.split("_");
            var gameMode = splitName[0];
            var group = splitName[1];

            if (!gameMode) { //like villager
                continue;
            }

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

        //load cards
        if (SMLTOWN.user.card) {
            this.userCard();
        }

        for (var id in SMLTOWN.players) {
            var card = SMLTOWN.players[id].card;
            if (card) {
                SMLTOWN.Add.backgroundCard(div.find(".smltown_extra"), card);
            }
        }
    }
    ,
    playingCards: function (cards) { //active game cards
        $(".smltown_rulesCard").addClass("smltown_cardOut");
        for (var cardName in cards) {
            var cardNumber = cards[cardName];
            var div = $(".smltown_rulesCard[smltown_card='" + cardName + "']");
            div.removeClass("smltown_cardOut");
            if (cardNumber && !isNaN(cardNumber)) { //isNaN bug on [object Object]??
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
