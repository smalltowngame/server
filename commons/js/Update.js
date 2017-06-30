
SMLTOWN.Update = {
    all: function (res) {

        if (res.user) {
            this.user(res.user);
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

            this.players();
        }

        if (res.player) {
            var player = res.player;
            if (!SMLTOWN.players[player.id]) {
                return;
            }
            for (var key in player) {
                SMLTOWN.players[player.id][key] = player[key];
            }
            this.players();
        }

//        if (res.user && res.user.card) { //if is really now updated (card)
//            if (SMLTOWN.user.id) { //check user updated
//                SMLTOWN.Action.night = {}; //restart functions
//                SMLTOWN.temp = {}; //restart variables
//                $this.userCard();
//            }
//        }

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
                this.gameLoad();
            }

        }
        clearTimeout(SMLTOWN.temp.wakeUpInterval);
    }
    ,
    user: function (user) {
        if (user.userId) {
            //only here smltown_userId cookie
            SMLTOWN.Util.setPersistentCookie("smltown_userId", user.userId);
        }

        for (var key in user) {
            SMLTOWN.user[key] = user[key];
        }
        console.log("SMLTOWN.user.admin:")
        console.log(SMLTOWN.user.admin)
        if (SMLTOWN.user.admin) {
            SMLTOWN.user.admin = parseInt(SMLTOWN.user.admin);
        } else {
            SMLTOWN.user.admin = -1;
        }
        console.log(SMLTOWN.user.admin)

        //prevent old updates
        if (!SMLTOWN.user.id) {
            console.log("prevent old updates");
            return;
        }

        if (user.rulesJS) {
            console.log("rules = " + user.rulesJS);
            if (!SMLTOWN.players.length) {
                SMLTOWN.rules = user.rulesJS;
            } else {
                eval(user.rulesJS); //like a cupid lover
            }
        }
        if (user.message) {
            if (jQuery.isEmptyObject(SMLTOWN.players)) {
                SMLTOWN.Message.message = user.message;
            } else {
                SMLTOWN.Message.setMessage(user.message);
            }
        }

        if (user.card) { //if is really now updated (card)
            if (SMLTOWN.user.id) { //check user updated
                SMLTOWN.Action.night = {}; //restart functions
                SMLTOWN.temp = {}; //restart variables
                this.userCard();
            }
        }
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
        $("#smltown_sun").css("z-index", 1); // back to list
        if ("1" == game.openVoting) {
            $("#smltown_openVoting input").attr('checked', true);
            $("#smltown_sun").css("z-index", 0); // back to list
        }

        //admin end Turn power
        $("#smltown_endTurn input").attr('checked', false);
        if ("1" == game.endTurn) {
            var input = $("#smltown_endTurn input")[0];
            if (input) {
                input.checked = true;
            }
        }

        if (game.time) {
            if (parseInt(game.time)) {
                SMLTOWN.Time.end = Date.now() / 1000 + game.time;
            } else {
                SMLTOWN.Time.end = 0;
            }
        }

        SMLTOWN.Add.icons(game, $("#smltown_header .smltown_content"));

        //on Players names Load -> if not yet
        if (!$("#smltown_console").hasClass('smltown_loaded')) {
            SMLTOWN.Message.addChats();
            $("#smltown_console").addClass('smltown_loaded');
        }
    }
    ,
    gameLoad: function () {
        this.gameStatus();

        //after game status
        if (SMLTOWN.rules && SMLTOWN.user.status > -1) {
            eval(SMLTOWN.rules); //like a cupid lover
            SMLTOWN.rules = null;
        }
    }
    ,
    gameStatus: function () {
        //to OVERRIDE
        console.log("EMPTY gameStatus");
    }
    ,
    players: function () {
        var players = SMLTOWN.players;
        var playersCount = 0;
        var newPlayers = 0;

        //1st GET USER PLAYER VALUES
        for (var id in players) {
            var player = players[id];
            if (player.id == SMLTOWN.user.id) {

                if (player.name && SMLTOWN.user.name != player.name) {
                    localStorage.setItem("smltown_userName", player.name);
                    SMLTOWN.user.name = player.name;
                }

                //only not null values
                for (var key in player) {
                    if (player[key] != null && "message" != key) {
                        SMLTOWN.user[key] = player[key];
                    }
                }
                //

                if (!SMLTOWN.user.name) {
                    var localName = localStorage.getItem("smltown_userName");
                    if (localName) {
                        console.log("SET NAME REQUEST");
                        SMLTOWN.Server.request.setName(localName);
                    } else {
                        SMLTOWN.Message.login("noName");
                    }
                } else {
                    $("#smltown_updateName input").attr("placeholder", SMLTOWN.user.name);
                }

                if (1 == SMLTOWN.user.admin) { // == 1
                    //$(".smltown_admin").addClass("smltown_selectable");
                    $("#smltown_becomeAdmin").hide();
                }
            }
            playersCount++;
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
        $(".smltown_waitingPlayer").hide();
        $(".smltown_userSpectator").removeClass("smltown_userSpectator");

        // ADD ALL PLAYERS
        var iColor = 0;
        for (var id in players) {
            var player = players[id];

            //PARSE VALUES
            player.admin = parseInt(player.admin);
            player.status = parseInt(player.status);

            var div;
            if ($("#" + id).length) {
                div = player.div = $("#" + id);
                div.removeClass("smltown_spectator smltown_dead");

            } else {
                var url = this.getPicture(player);
                var isPlaying = player.admin > -1;
                div = player.div = this.addPlayerHTML(url, isPlaying);

                //by user properties
                div.attr("id", player.id);
                div.attr("preselect-content", SMLTOWN.Message.translate("PRESELECT"));

                //player.div = div;
                SMLTOWN.Events.playerEvents(player);

                newPlayers++;
            }

            if (player.name) {
                div.find(".smltown_name").text(player.name);
            } else if (player.admin < -1) {
                div.find(".smltown_name").text("bot_" + player.id);
            }

            if (!player.name) {
                var nameSpan = $(div).find(".name");
                var refer = "unnamed";
                if (player.admin == -2) {
                    refer = "bot";
                }
                $(nameSpan).html(refer + " <small>(.." + player.id.slice(-2) + ")</small>");
            }

            if (player.card) {
                if (player.status == -1 || SMLTOWN.Game.info.status > 4) {
                    SMLTOWN.Add.backgroundCard(div.find(".smltown_extra"), player.card);
                }
            }

            // SORT divs players
            if (player.status < 1) {
                $("#smltown_listDead").append(div);
                div.addClass("smltown_dead");
                div.find(".smltown_playerStatus").smltown_text("dead");

            } else if (player.status) {
                $("#smltown_listAlive").append(div);
                div.find(".smltown_playerStatus").smltown_text("alive");
                div.find(".smltown_extra").text("");
            } else {
                $("#smltown_listSpectator").append(div);
            }
            //else nothing

            //only user player values width div relation
            if (player.id != SMLTOWN.user.id) {
                $('<style>.id' + player.id + ' {color: ' + this.userColors[iColor++] + '}</style>').appendTo('head');

                //if MYSELF:
            } else {
                iColor++;

                $('<style>.id' + player.id + ' {font-weight: bold}</style>').appendTo('head');

                div.append("<div class='smltown_spectatorText'>" + SMLTOWN.Message.translate("spectatorMode") + "</div>");
                //play game event
                div.off(".spectator");//disable event
                div.on("tap.spectator", function (e) {
                    if ($(this).parents(".smltown_spectatorJoinable").length) {
                        e.preventDefault();

                        SMLTOWN.Message.notify("_playGameQuestion", function () {
                            $(this).off(".spectator");
                            $("#" + SMLTOWN.user.id + " .smltown_spectatorText").remove();
                            SMLTOWN.Server.request.playGame();
                        }, true);
                    } else {
                        console.log("unknown error");
                    }
                });
            }

            div.find(".smltown_name").addClass("id" + player.id);

            if (player.admin == -1) {
                //add to spectator list
                $("#smltown_listSpectator").append(div);
                div.addClass("smltown_spectator");
                if (player.id == SMLTOWN.user.id) {
                    $("#smltown_list").addClass("smltown_userSpectator");
                }
                div.find(".smltown_playerStatus").text("");
                //remove card etc
                $("#" + player.id + " .smltown_extra").css("background-image", "none");

            } else {
                if (player.admin == 1) {
                    div.find(".smltown_name").append("<symbol>R</symbol>");
                }
            }

            if (player.message !== null && player.status > -1 && player.admin > -1) {
                div.find(".smltown_waitingPlayer").show();
            }

            if (SMLTOWN.user.id == player.sel) {
                div.find(".smltown_name").addClass("smltown_enemy");
            }
        }

        //ADD QUIT PLAYERS BUTTONS AFTER LIST ALL PLAYERS!
        if (1 == SMLTOWN.user.admin) {
            $("#smltown_html").addClass("smltown_isAdmin");
            SMLTOWN.Add.quitPlayerButtons();
        }

        //check user was removed or never played
        if (!SMLTOWN.players[SMLTOWN.user.id]) {
            SMLTOWN.Load.reloadGame();
            return;
        }
        $("#smltown_user").append(SMLTOWN.players[SMLTOWN.user.id].div);
        // ADD INTERACTION PLAYERS        
        for (id in players) {
            var player = players[id];
            if (player.sel && SMLTOWN.user.id != player.id) { //set on user check
                SMLTOWN.Action.addVote(player.sel);
                //if ("undefined" != typeof SMLTOWN.players[player.sel].name) {
                //    player.div.find(".smltown_playerStatus").append(" voting to " + SMLTOWN.players[player.sel].name);
                //}
            } else if ("" === player.sel && player.admin > -1) {
//                player.div.find(".smltown_waitingPlayer").text("⌛");
                div.find(".smltown_waitingPlayer").show();
            }
        }

        // OWN PROPERTIES
        $(".smltown_player").removeClass("smltown_check");
        if (SMLTOWN.user.sel) {
            $("#" + SMLTOWN.user.sel).addClass("smltown_check");
            SMLTOWN.Action.addVote(SMLTOWN.user.sel);
        }

        if (playersCount < 4) {
            this.insertPlayerAdd();
        }
        return newPlayers;
    }
    ,
    addPlayerHTML: function (playerCustomPicture, isPlaying) {
        var div = $("<div>");
        var up = $("<div class='smltown_up'>");
        var down = $("<div class='smltown_down'>");
        div.append("<symbol class='smltown_playerSymbol'>U</symbol>");
        div.append(up);
        div.append(down);
        up.append("<span class='smltown_name'>");
        up.append($("<span class='smltown_playerStatus'>"));
        div.append($("<span class='smltown_votes'>"));
        div.append("<div class='smltown_extra'>");
        div.append($("<div class='smltown_waitingPlayer smltown_icon64 smltown_hourglass'>"));
        div.addClass("smltown_player");

        var picture = $("<div class='smltown_picture smltown_iconUser'>");
        div.append(picture);

        if (playerCustomPicture) {
            picture.append("<img src='" + playerCustomPicture + "'></img>");
        }

        if (isPlaying) {
            div.find(".smltown_extra").css("background-image", this.innocentBackground);
        }

        return div;
    }
    ,
    getPicture: function (player) {
        if (player.picture) {
            return player.picture;
        } else if (player.type == "facebook" && player.socialId) {
            return "https://graph.facebook.com/" + player.socialId + "/picture";
        }
    }
    ,
    insertPlayerAdd: function () {
        console.log("add")
        $("#playerAdd").remove();
        var playerAdd = $("<div id='playerAdd' class='smltown_player'>");
        playerAdd.smltown_text("morePlayers");
        var helper = $("<small>");
        helper.smltown_text("morePlayersHelp");
        playerAdd.append(helper);
        playerAdd.append("<div class='smltown_extra'>");
        playerAdd.on("tap", function () {
            console.log(111);
            SMLTOWN.Social.showFriends();
        });
        $("#smltown_list > div").append(playerAdd);
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
                name = card.lang.name;
                desc = card.lang.rules;
                if (card.lang.quote) {
                    quote = card.lang.quote;
                }
            } else {
                name = SMLTOWN.user.card;
                desc = "any special habilities";
            }

            var htmlText = this.userTextCard(name, desc, quote);
            $("#smltown_cardFront .smltown_cardText > div").html(htmlText);

            $("#smltown_card").addClass("smltown_visible");
            SMLTOWN.Transform.cardRotateSwipe();
        }

        //load card
        var gamePath = SMLTOWN.path + "games/" + SMLTOWN.Game.info.type;
        $("#smltown_phpCard").load(gamePath + "/cards/" + SMLTOWN.user.card + ".php", function (response) { //card could be changed
            SMLTOWN.cardLoading = false;
            if (response.indexOf("Fatal error") > -1) { //catch error
                smltown_error(response);
            }
            if (SMLTOWN.Game.info) {
                $this.gameLoad(); //important
            }
        });
    }
    ,
    userTextCard: function (name, desc, quote) {
        var div = $("<div>");
        var descDiv = $("<p class='smltown_desc'>");
        descDiv.text(desc);

        if (40 < descDiv.height() && 50 > descDiv.height()) { //2 lines text                
            var middle = desc.length / 2;
            var pos = desc.indexOf(' ', middle);
            var result = desc.slice(0, pos) + "</br>" + desc.slice(pos);
            descDiv.html(result);
        }

        if (name) {
            name = name.toUpperCase();
        }
        div.html(name);

        descDiv.append('<p class="smltown_quote">"' + quote + '"</p>');
        div.append(descDiv);

        return div;
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

            //lang           
            var simpleCardName = splitName[splitName.length - 1];
            for (var word in card.lang) {
                var start = word.substr(0, simpleCardName.length);
                if (start == simpleCardName) {
                    lang[word] = card.lang[word];
                }
            }
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
    ,
    //http://stackoverflow.com/questions/309149/generate-distinctly-different-rgb-colors-in-graphs
    userColors: ['#0000FF', '#DA0000', '#009C9C', '#006401', '#95003A', '#A937A5', '#774D00', '#00CC5C', '#0076FF', '#FF937E', '#6A826C', '#FF029D', '#7E2DD2', '#85A900', '#00B917', '#C28C9F', '#FF74A3', '#01D0FF', '#004754', '#788231', '#0E4CA1', '#BE9970', '#968AE8', '#BB8800', '#FFE500', '#620E00', '#008F9C', '#7544B1', '#B500FF', '#FF6E41', '#005F39', '#5FAD4E', '#A75740', '#009BFF', '#E85EBE', '#010067', '#E400E2', '#FF4300', '#7A4782', "#FE8900", '#00AE7E', '#683D3B']
    ,
    innocentBackground: "url(" + SMLTOWN.path + "games/mafia-werewolf/cards/game_innocent.jpg)"
};
