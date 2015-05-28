<?php
include_once 'DB.php';

if (!isset($_GET["id"])) { //if not id
    $games = petition("SELECT id FROM games");
    if (0 == count($games)) {
        include_once 'DB_request.php';
        $gameId = createGame();
    } else {
        $gameId = $games[0]->id;
    }
    if (!$gameId) {
        echo "creating id game error";
        die();
    }
//    header("Location: game.php?id=$gameId"); //reload (.PHP if server htaccess not work)
} else {
    $gameId = $_GET["id"];
}

session_start();
$_SESSION['gameId'] = $gameId;

//echo "<script>console.log(" . $_SESSION['gameId'] . ")"</script>";
//$countGame = petition("SELECT count(*) as count FROM games WHERE id = $gameId")[0]->count;
//if ($countGame == 0) {
//    header("Location: ./#deleted_game");
//}
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>  
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta http-equiv="X-UA-Compatible" content="IE=Edge"/>
        <script>
            jQuery.fx.interval = 1000;

            (function($) { //translate every text() jquery function
                var old = $.fn.text;
                $.fn.text = function(text) {
                    if (text && !isNumber(text)) {
                        text = message(text);
                    }
                    return old.apply(this, arguments);
                };
            })(jQuery);</script>    
    </head>

    <body>

        <div id="button"></div>

        <div id="smltown_header">
            <div id="smltown_menuIcon"></div>            
            <div class="smltown_content"></div>
            <div id="smltown_consoleTitle">
                <span id="smltown_statusGame"></span>
                <!--<span class="gameName"></span>-->
            </div>
            <div id="smltown_cardIcon"></div>
        </div>

        <div id="smltown_menu" class="smltown_swipe">
            <div id="smltown_menuContent">
                <div>
                    <div class="smltown_selector smltown_admin">					
                        <div>
                            <symbol class="icon">R</symbol>
                            <span>Admin</span>
                            <small>adminHelp</small>
                        </div>

                        <div id="smltown_restartButton" class="smltown_button">
                            <span>NewCards</span> <symbol>R</symbol>
                            <small>newCardsHelp</small>
                        </div>

                        <div id="smltown_startButton" class="smltown_button">
                            <span>StartGame</span> <symbol>R</symbol>
                            <small>startGameHelp</small>
                        </div>

                        <div id="smltown_endTurnButton" class="smltown_button">
                            <span>EndTurn</span> <symbol>R</symbol>
                            <small>endTurnHelp</small>
                        </div>
                    </div>

                    <div class="smltown_selector smltown_admin">
                        <div>
                            <symbol class="icon">S</symbol>
                            <span>Game</span>
                            <small>gameHelp</small>
                        </div>

                        <div id="smltown_password" class="input smltown_admin">
                            <span>Password</span> <symbol>R</symbol>
                            <form>
                                <input type="text"/>
                            </form>					
                        </div>

                        <div id="smltown_dayTime" class="input smltown_admin smltown_gameOver">
                            <span>DayTime</span> <symbol>R</symbol>
                            <form>
                                <span>sec/p</span>
                                <input type="text" placeholder="60"/>
                            </form>					
                        </div>

                        <div id="smltown_openVoting" class="input smltown_admin smltown_gameOver">
                            <span>OpenVoting</span> <symbol>R</symbol>
                            <input class="" type="checkbox"/>
                        </div>

                        <div id="smltown_endTurn" class="input smltown_admin smltown_gameOver">
                            <span>AdminEndTurn</span> <symbol>R</symbol>
                            <input class="" type="checkbox"/>
                        </div>
                    </div>

                    <div class="smltown_selector">
                        <div class="smltown_falseSelector">
                            <symbol class="icon">U</symbol>
                            <span>PlayingCards</span>
                            <small>card list</small>
                        </div>
                        <p id='smltown_playingCards'></p>
                    </div>

                    <div class="smltown_selector">
                        <div>
                            <symbol class="icon">U</symbol>
                            <span>UserSettings</span>
                            <small>personal options</small>
                        </div>
                        <div id="smltown_updateName" class="input smltown_gameOver">                    
                            <span>Name</span>
                            <form>
                                <input type="text"/>
                            </form>					
                        </div>
                        <div id="smltown_cleanErrors" class="smltown_single button">
                            <span>CleanErrors</span>
                            <small>reload game</small>
                        </div>
                    </div>

                    <div class="smltown_selector">
                        <div>
                            <div class="icon">i</div>
                            <span>Info</span>
                            <small>help and game manual</small>
                        </div>
                        <div id="smltown_currentUrl" class="text">
                        </div>

                        <div id="smltown_disclaimer" class="text">
                        </div>
                    </div>

                </div>

                <div id="smltown_backButton" class="smltown_selector">
                    <div>
                        <span>Back</span>
                        <small>back to game list</small>
                    </div>
                </div>

            </div>
        </div>

        <div id="smltown_body">
            <div id="smltown_list">
                <div>
                    <div id="smltown_user"></div>
                    <div id="smltown_listAlive"></div>
                    <div id="smltown_listDead"></div>
                </div>
            </div>

            <div id="smltown_filter" class="absolute">
                <div id="smltown_log" class="absolute">
                    <div class="text"></div>
                    <div id="smltown_logOk" class="smltown_button">OK</button>
                    <div id="smltown_logCancel" class="smltown_button">Cancel</div>
                    <!--                    <div class="smltown_cloud x1"></div>
                                        <div class="smltown_cloud x2"></div>-->
                </div>
                <div class="smltown_countdown"></div>
            </div>
        </div>        

        <div id="smltown_console">
            <!--            <div id="consoleTitle">
                            <span id="statusGame"></span>
                            <span class="gameName"></span>
                        </div>-->
            <div class="text"><br/></div>
            <form id="smltown_chatForm">
                <input id="smltown_chat"></input>
            </form>
        </div>

        <div id="smltown_card" class="smltown_swipe">
            <div id="smltown_cardBack" class="smltown_cardImage"></div>
            <div id="smltown_cardFront">
                <div class="smltown_cardImage"></div>
                <div class="text"><div></div></div>
            </div>
        </div>

        <!--visuals card-->
        <div id='smltown_phpCard'></div>

        <script>

            function reload() {
                if (!navigator.onLine) {
                    $("#smltown_log").text("Connection lost. Try again");
                }
//                window.location.reload(true);
                $("#smltown_html").load(Game.path + "game.php");
            }

            //let Game js injection
            Game.id = <?php echo $gameId ?>;
            Game.info = {};
            Game.players = {};
            Game.sleep = true;
            Game.temp = {};
            Game.domain = window.location.host.split(":")[0];
            Game.connection = "ajax";
            Game.wakeUpTime = 2000;
            Game.cardLoading = false;
            Game.ping = 300;
            //check connection type

            var loadGame = function() {
                //externalFunctions();
                documentResize();
                resizeCard(); //card position

                websocketConnection(function(done) {
                    if (!done) {
                        ajaxConnection();
                    } else {
                        console.log("WEBSOCKET CONNECTION");
                    }
                    Game.request.addUser(); //add this user to game
                    events();
                });
                $("#smltown_disclaimer").load(Game.path + "./game_disclaimer.html");
                $("#smltown_currentUrl").append("<b>Current URL:</b> <br/><br/> <small>" + window.location.href + "</small>");
            }

            //TIME COUNTDOWN, day end
            var countdownDiv = $(".countdown")[0];
            function runCountdown() {
                if (Game.countdownInterval) {
                    return;
                }

                //countdown
                Game.countdownInterval = setInterval(function() {
                    //stop
                    if (!Game.info || !Game.time || Game.info.status != 1) {
                        clearCountdown();
                        return;
                    }
//                    Game.countdown--;
                    Game.countdown = (Game.time - (Date.now() / 1000)) | 0; // |0 to remove decimals

                    if (Game.countdown < 10) {
                        $("#smltown_countdown").addClass("lastSeconds");
                    }
                    if (Game.countdown < 1) {
                        countdownDiv.innerHTML = "";
                        clearCountdown();
                        if (Game.user.status && Game.user.status > 0) {
                            wakeUp("vote time!");
                        }
                        if (Game.info.openVoting) {
                            console.log("dayEND")
                            Game.request.dayEnd();
                        } else {
                            $("#smltown_statusGame").text("waitPlayersVotes");
                        }
//                        Game.countdown = 0;
                        Game.time = null;
                    } else {
                        countdownDiv.innerHTML = parseTime(Game.countdown);
                    }
                }, 1000); //every second
            }

            var secs;
            function parseTime(time) {
                secs = time % 60;
                return ~~(time / 60) + ":" + (secs < 10 ? "0" : "") + secs;
            }

            function clearCountdown() {
                clearInterval(Game.countdownInterval);
                clearInterval(Game.countdownCorrector);
                Game.countdownInterval = false;
            }

            function update(res) { //response
                console.log(res);
                if (res.user) {
                    if (typeof res.user.userId != "undefined") {
                        Game.userId = res.user.userId;
                    }
                    if (typeof res.user.rulesJS != "undefined") {
                        Game.rules = res.user.rulesJS;
                    }
                    if (typeof res.user.message != "undefined" && res.user.message) {
                        setMessage(res.user.message);
                    }
                }

                if (res.players) { // PLAYERSs
                    if (!Game.userId) {
                        console.log("!NOT USER ERROR, re-loading...");
                        setLog("!NOT USER ERROR, re-loading...");
                        Game.request.getAll();
                        return;
                    }

                    //remove old players
                    if (Game.players) {
                        for (var id in Game.players) {
                            if (false == getById(res.players, id)) {
                                console.log("delete Player = " + id)
                                delete Game.players[id];
                            }
                        }
                    } else {
                        Game.players = {};
                    }

                    //Get new players
                    for (var i = 0; i < res.players.length; i++) {
                        var player = res.players[i];
                        var id = player.id;
                        if (Game.players[id]) {
                            for (var key in player) {
                                Game.players[id][key] = player[key];
                            }
                        } else {
                            Game.players[id] = player;
                        }
                    }

                    setPlayers();
                    setQuitPlayerButtons();
                    if (Game.rules && Game.user.status > -1) {
                        eval(Game.rules);
                    }
                }

                if (res.user && res.user.card) { //if is really now updated (card)
                    Game.card = res.user.card;
                    var arrayName = res.user.card.split("_");
                    Game.cardName = arrayName[arrayName.length - 1];
                    Game.night = {}; //restart functions
                    Game.temp = {}; //restart variables

                    Game.cardLoading = true;
                    $("#smltown_phpCard").load("cards/" + Game.card + ".php", function(response) { //card could be changed
                        Game.cardLoading = false;
                        console.log("card loaded");
                        if (response.indexOf("Fatal error") > -1) {
                            setLog(response);
                        }
                        setUserCard();
                        if (Game.info) {
                            setGame();
                        }
                    });
                }

                if (res.cards) { // RULES
                    setGameCards(res.cards); //utils.js
                }

                if (res.game) { // GAME
                    if (res.game.chat) {
                        addChats(res.game.chat);
                    }
                    if (!Game.info.cards) {
                        Game.info.cards = {};
                    }
                    if (res.game.cards) {
                        try { //only game cards
                            res.game.cards = JSON.parse(res.game.cards);
                        } catch (e) {
                            console.log("Game.info.cards couldn't parse: " + e);
                        }
                        setPlayingCards(res.game.cards);
                    }
                    for (var key in res.game) {
                        Game.info[key] = res.game[key];
                    }
                    $(".smltown_gameName").text(Game.info.name);
                    Game.info.status = parseInt(Game.info.status);
                    Game.time = (Date.now() + Game.info.time) / 1000;
                    if (!Game.cardLoading) { //not w8 load php card
                        setGame();
                    }
                    setQuitPlayerButtons();
                }
                clearTimeout(Game.temp.wakeUpInterval);
            }

            function setGame() {
                console.log("setGame");
                //INPUTS
                $("#smltown_header .smltown_content").html("");
                //password
                if (Game.info.password) {
                    $("#smltown_password input").attr("placeholder", Game.info.password);
                    var div = $("<div id='smltown_passwordIcon'>");
                    $("#smltown_header .smltown_content").append(div);
                    div.click(function() {
                        flash("game with password");
                    });
                }
                //day Time by player
                var div = $("<div>");
                div.append("<div id='smltown_clockIcon'></div>");
                if (Game.info.dayTime) {
                    $("#smltown_dayTime input").attr("placeholder", Game.info.dayTime);
                    div.append(Game.info.dayTime);
                } else {
                    div.append($("#smltown_dayTime input").attr("placeholder"));
                }
                $("#smltown_header .smltown_content").append(div);
                div.click(function() {
                    flash("seconds of day time by player");
                });
                //open voting
                if (Game.info.openVoting == 1) {
                    $("#smltown_openVoting input").attr('checked', true);
                    var div = $("<div><div id='smltown_openVoting'>");
                    $("#smltown_header .smltown_content").append(div);
                    div.click(function() {
                        flash("let players vote during the day");
                    });
                }
                //admin end Turn power
                if (Game.info.endTurn == 1) {
                    $("#smltown_endTurn input").attr('checked', true);
                    var div = $("<div><div id='smltown_endTurnIcon'>");
                    $("#smltown_header .smltown_content").append(div);
                    div.click(function() {
                        flash("admin can end turn immediately");
                    });
                }

                //hide
                if (Game.user && Game.user.admin) { // == 1
                    $(".smltown_admin").addClass("smltown_selectable");
                }
                $("#smltown_console .smltown_night").hide();
                $(".smltown_gameOver").removeClass("smltown_selectable");
                $("#smltown_startButton").hide();
                $("#smltown_endTurnButton").hide();
                $(".smltown_countdown").hide();
                //show &
                switch (Game.info.status) {

                    case 1: //town discusing
                        Game.ping = 300;
                        console.log("town discussion...");
                        runCountdown();
                        $(".smltown_gameOver").addClass("selectable");
                        $("#smltown_endTurnButton").show();
                        $(".smltown_countdown").show();
                        if ($("#smltown_body").attr("class") == "night") {
                            $("#smltown_body").attr("class", "day");
                            wakeUp("Good morning!");
                        }

                        break;
                    case 2: //night time
                        console.log("night");
                        Game.ping = 300;
                        wakeUp(false); //prevent wake up on other night turn
                        Game.time = null;
                        if ($("#smltown_body").attr("class") != "night") { // 1st time
                            $("#smltown_body").attr("class", "night");
                            $(".smltown_userCheck").removeClass("userCheck");
                            $(".smltown_votes span").remove();
                            sleep();
                            $("#smltown_statusGame").text("nightTime");
                            $("#smltown_console .night").show();
                        }
                        if (Game.user.status > -1 && Game.card == Game.info.night) {
                            if (Game.night.select) {
                                wakeUp("wake up " + Game.cardName.toUpperCase() + "... it's your turn");
                            }
                            Game.request.nightExtra();
                            //if (Game.night.extra) {
                            //    Game.request.nightExtra();
                            //}
                        }

                        break;
                    case 3: //end game

                        Game.ping = 1000;
                        if ($("#smltown_body").attr("class") != "gameover") {
                            wakeUp("GAME OVER", true);
                            endTurn();
                            $("#smltown_statusGame").text("GAME OVER");
                            $("#smltown_body").attr("class", "gameover");
                        }

                        for (var id in Game.players) {
                            var player = Game.players[id];
                            if (player.status > 0) {
                                $("#" + player.id + " .votes").html("(WIN)");
                            }
                        }

                        break;
                    default: //waiting for new game (0)
                        Game.ping = 1000;
                        $(".smltown_gameOver").addClass("selectable");
                        if ($("#smltown_body").attr("class") != "wait") {
                            wakeUp("gameRestarted", true);

                            $(".smltown_extra").empty();
                            $(".smltown_extra").css("background-image", "none");
                            for (var id in Game.players) {
                                Game.players[id].card = "";
                            }

                            endTurn();
                            $("#smltown_statusGame").text("waitingNewGame");
                            $(".smltown_playerStatus").text("waiting");
                            $("#smltown_body").attr("class", "wait");
                        }

                        if (Game.user.admin) {
                            if (Game.card) {
                                $("#smltown_startButton").show();
                            }
                        }
                }
            }

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
            function setPlayers() {
                var players = Game.players;
                $(".smltown_player").remove();
                var id;
                //GET USER PLAYER
                for (var id in players) {
                    var player = players[id];
                    if (player.id == Game.userId) {
                        Game.user = player;
                        Game.user.admin = parseInt(Game.user.admin);
                        if (!Game.user.name) {
                            login("noName");
                        } else {
                            $("#smltown_updateName input").attr("placeholder", Game.user.name);
                        }
                    }
                }

                // ADD ALL PLAYERS
                var iColor = 0;
                for (id in players) {
                    var player = players[id];
                    var div = $("<div>");
                    var up = $("<div class='smltown_up'>");
                    var down = $("<div class='smltown_down'>");
                    div.append("<symbol class='smltown_playerSymbol'>U</symbol>");
                    div.append(up);
                    div.append(down);
                    up.append($("<span class='smltown_name'>" + player.name + "<span>"));
                    down.append($("<span class='smltown_playerStatus'>"));
                    down.append($("<span class='smltown_votes'>"));
                    div.append($("<div class='smltown_extra'>"));
                    div.attr("id", player.id);
                    div.addClass("smltown_player");
                    player.div = div;
                    selectEvents(player);
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
                        addBackgroundCard(div.find(".smltown_extra"), player.card);
                    }

                    // SORT divs players
                    player.status = parseInt(player.status);
                    if (!player.status) { //if not playing
                        $("#smltown_listDead").append(div);
                        div.addClass("smltown_spectator");
                        div.find(".smltown_playerStatus").text("spectator");
                    } else if (player.status < 1) {
                        $("#smltown_listDead").append(div);
                        div.addClass("dead");
                        div.find(".smltown_playerStatus").prepend("dead ");
                        div.find(".smltown_extra").text("☠");
                    } else {
                        $("#smltown_listAlive").append(div);
                        div.find(".smltown_playerStatus").text("alive");
                    }

                    $('<style>.id' + player.id + ' {color:' + colors[iColor++] + '}</style>').appendTo('head');
                    div.find(".smltown_name").addClass("id" + player.id);
                    if (player.admin == 1) {
                        div.find(".smltown_name").append("<symbol>R</symbol>");
                    }
                    if (Game.userId == player.sel) {
                        div.find(".smltown_name").addClass("smltown_enemy");
                    }
                }

                $("#smltown_user").append(Game.players[Game.userId].div);
                // ADD INTERACTION PLAYERS
                for (id in players) {
                    var player = players[id];
                    if (player.sel) {
                        addVote($("#" + player.sel + " .smltown_votes"));
                        player.div.find(".smltown_playerStatus").append(" voting to <span class='id" + player.sel + "'></span>");
                    }
                }

                // OWN PROPERTIES
                $(".smltown_player").removeClass("smltown_userCheck");
                if (Game.user.sel) {
                    $("#" + Game.user.sel).addClass("smltown_userCheck");
                }
            }

            function setQuitPlayerButtons() {
                if ($.isEmptyObject(Game.info)) {
                    return;
                }
                if (!Game.info.status) {
                    $(".smltown_extra").html("");
                    if (Game.user.admin) {
                        for (id in Game.players) {
                            if (id != Game.userId) {
                                $("#" + id + " .smltown_extra").html(
                                        "<div class='smltown_gameOver smltown_quit smltown_button'>quit</div>");
                            }
                        }
                    }
                }
                $(".smltown_player .smltown_quit").click(function() {
                    var id = $(this).closest(".smltown_player").attr("id");
                    $("#" + id).remove();
                    Game.request.deletePlayer(id);
                });
            }

            function setUserCard() {
                $("#smltown_card").removeClass("rotate");
                if (!$("#smltown_cardFront").hasClass(Game.card)) { //only new card
                    $("#smltown_cardFront").attr("class", Game.card);
//                    var filename = Game.card.split("_")[1];
                    var card = Game.cards[Game.card];
                    addBackgroundCard($("#smltown_cardFront .smltown_cardImage"), Game.card);
                    var name, desc;
                    if (card) {
                        name = card.name;
                        desc = card.desc;
                    } else {
                        name = Game.card;
                        desc = "no special habilities";
                    }

                    $("#smltown_cardFront .text > div").text(name.toUpperCase());
                    var p = $("<p>" + desc + "</p>");
                    $("#smltown_cardFront .text > div").html(p);
                    $("#smltown_card").addClass("smltown_visible");
                    setTimeout(function() {
                        $("#smltown_card").removeClass("smltown_visible");
                    }, 400);
                }
            }

            // SET SELECT EVENTS TO 1 PLAYER
            function selectEvents(player) {
                //set CHECKABLES players
                var id = player.id;
                player.div.on("tap", function() {
                    console.log("tap select");
                    var player = Game.players[id];

                    if (!Game.info.status && Game.info.status > 2) { //out of game
                        return;
                    } else if (!Game.user.status) {
                        flash("you are a espectator");
                        return;
                    } else if (Game.user.status < 1) {
                        flash("hey!, you are dead");
                        return;
                    } else if (!player.status) {
                        flash("player is a espectator");
                        return;
                    } else if (player.status < 1) {
                        flash("player is dead");
                        return;
                    }

                    //alive
                    var div = $("#" + player.id);
                    Game.selectFunction;
                    Game.unselectFunction;
                    //set day/night functions 
                    if (Game.info.status == 1 && !Game.info.night) {
                        if (1 != Game.info.openVoting && Game.time) {
                            return;
                        }
                        Game.selectFunction = Game.request.selectPlayer;
                        Game.unselectFunction = Game.request.unSelectPlayer;
                    } else if (Game.info.night && Game.info.night == Game.card) {
                        Game.selectFunction = Game.night.select;
                        Game.unselectFunction = Game.night.unselect;
                    } else if (Game.info.night) {
                        var array = Game.info.night.split("_");
                        var cardName = array[array.length - 1];
                        flash("Wait!, " + cardName + " is plotting something!");
                    } else {
                        console.log("nothing to select");
                        return;
                    }

                    //select work
                    if (div.hasClass("smltown_userCheck")) { //UNSELECT
                        if (Game.unselectFunction && Game.unselectFunction(player.id) != false) {
                            removeVote(div.find(".smltown_votes"));
                            div.removeClass("smltown_userCheck");
                        }

                    } else if (Game.selectFunction && Game.selectFunction(player.id) != false) { //SELECT
                        if (Game.user.sel) {
                            removeVote($("#" + Game.user.sel + " .votes"));
                        }
                        Game.user.sel = player.id;
                        addVote(div.find(".smltown_votes"));
                        $(".smltown_player").removeClass("smltown_userCheck");
                        div.addClass("smltown_userCheck");
                    } else {
                        console.log("not select function")
                    }
                });
            }

            function addVote(span) {
                span.append("<span>&#x2718; </span>");
                var count = span.find("span").length;
                span.closest(".smltown_player").find(".extra").text(count);
            }
            function removeVote(span) {
                span.find("span").first().remove();
                var count = span.find("span").length;
                var extra = span.closest(".smltown_player").find(".extra");
                if (count) {
                    extra.text(count);
                } else {
                    extra.text("");
                }
            }

            function wakeUp(message, instantlyWakeUp) {
                if (!message) {
                    notify("");
                    return false; //false
                }
                if (!Game.sleep && !instantlyWakeUp) {
                    return false; //false
                }

                var wait = Game.wakeUpTime;
                if (instantlyWakeUp) { //override: restarted game, ..
                    wait = 0;
                }

                setTimeout(function() { // WAIT 2 SECONDS TO ALLOW PLAYERS CLOSE EYES
                    notify(message, function() {
                        if (Game.info.status == 2) { //is night
                            addBackgroundCard($("#smltown_user .smltown_extra"), Game.cardName);
                        }
                        $("#smltown_filter").removeClass("sleep");
                        Game.sleep = false;
                    }, false);
                }, wait);
            }

            function sleep() {
                flash("close your eyes");
                $("#smltown_filter").addClass("sleep");
                Game.sleep = true;
            }

            function endTurn() {
                Game.info.night = null;
                $(".smltown_votes").html("");
                $(".smltown_userCheck").removeClass("smltown_userCheck");
                $("#smltown_user .smltown_extra").css("background-image", "");
                $(".smltown_player").each(function() {
                    if (!$(this).hasClass("dead")) {
                        $(this).find(".extra").empty();
                    }
                });
            }

            //last position since loads
            $(document).ready(function() {
                if (typeof Device !== "undefined") {
                    Device.onGameLoaded();
                } else {
                    loadGame();
                }
            });
        </script>

    </body>
</html>
