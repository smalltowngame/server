<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Expose-Headers: smalltown");
header('smalltown: 2');

//set cookie lifetime for 10 days (60sec * 60mins * 24hours * 100days)
ini_set('session.cookie_lifetime', 864000);
ini_set('session.gc_maxlifetime', 864000);
//maybe you want to precise the save path as well
//ini_set('session.save_path', "smalltown");

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
    header("Location: game.php?id=$gameId"); //reload (.PHP if server htaccess not work)
}

$gameId = $_GET["id"];
$countGame = petition("SELECT count(*) as count FROM games WHERE id = $gameId")[0]->count;
if ($countGame == 0) {
    header("Location: ./#deleted_game");
}

$lang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
if (!file_exists("lang/$lang.js")) {
    $lang = "en";
}


session_start();
$smalltownURL = "";
if(isset($_SESSION['smalltownURL'])){
   $smalltownURL = $_SESSION['smalltownURL'];
}

?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>  
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta http-equiv="X-UA-Compatible" content="IE=Edge"/>
        <link rel="shortcut icon" href="<?php echo $smalltownURL ?>favicon.ico" type="image/x-icon"/>
        <title>Small Town</title>
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/common.css'>
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/game.css'>
        <!--<link rel='stylesheet' href='css/animations.css'>-->
        <link rel='stylesheet' href='<?php echo $smalltownURL ?>css/icons.css'>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/errorLog.js"></script>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/jquery-1.11.0.min.js"></script>
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

        <div id="header">
            <div id="menuIcon"></div>            
            <div class="content"></div>
            <div id="consoleTitle">
                <span id="statusGame"></span>
                <!--<span class="gameName"></span>-->
            </div>
            <div id="cardIcon"></div>
        </div>

        <div id="menu" class="swipe">
            <div id="menuContent">
                <div>
                    <div class="selector admin">					
                        <div>
                            <symbol class="icon">R</symbol>
                            <span>Admin</span>
                            <small>adminHelp</small>
                        </div>

                        <div id="restartButton" class="button">
                            <span>NewCards</span> <symbol>R</symbol>
                            <small>newCardsHelp</small>
                        </div>

                        <div id="startButton" class="button">
                            <span>StartGame</span> <symbol>R</symbol>
                            <small>startGameHelp</small>
                        </div>

                        <div id="endTurnButton" class="button">
                            <span>EndTurn</span> <symbol>R</symbol>
                            <small>endTurnHelp</small>
                        </div>
                    </div>

                    <div class="selector admin">
                        <div>
                            <symbol class="icon">S</symbol>
                            <span>Game</span>
                            <small>gameHelp</small>
                        </div>

                        <div id="password" class="input admin">
                            <span>Password</span> <symbol>R</symbol>
                            <form>
                                <input type="text"/>
                            </form>					
                        </div>

                        <div id="dayTime" class="input admin gameOver">
                            <span>DayTime</span> <symbol>R</symbol>
                            <form>
                                <span>sec/p</span>
                                <input type="text" placeholder="60"/>
                            </form>					
                        </div>

                        <div id="openVoting" class="input admin gameOver">
                            <span>OpenVoting</span> <symbol>R</symbol>
                            <input class="" type="checkbox"/>
                        </div>

                        <div id="endTurn" class="input admin gameOver">
                            <span>AdminEndTurn</span> <symbol>R</symbol>
                            <input class="" type="checkbox"/>
                        </div>
                    </div>

                    <div class="selector">
                        <div class="falseSelector">
                            <symbol class="icon">U</symbol>
                            <span>PlayingCards</span>
                            <small>card list</small>
                        </div>
                        <p id='playingCards'></p>
                    </div>

                    <div class="selector">
                        <div>
                            <symbol class="icon">U</symbol>
                            <span>UserSettings</span>
                            <small>personal options</small>
                        </div>
                        <div id="updateName" class="input gameOver">                    
                            <span>Name</span>
                            <form>
                                <input type="text"/>
                            </form>					
                        </div>
                        <div id="cleanErrors" class="single button">
                            <span>CleanErrors</span>
                            <small>reload game</small>
                        </div>
                    </div>

                    <div class="selector">
                        <div>
                            <div class="icon">i</div>
                            <span>Info</span>
                            <small>help and game manual</small>
                        </div>
                        <div id="currentUrl" class="text">
                        </div>

                        <div id="disclaimer" class="text">
                        </div>
                    </div>

                </div>

                <div id="backButton" class="selector">
                    <div>
                        <span>Back</span>
                        <small>back to game list</small>
                    </div>
                </div>

            </div>
        </div>

        <div id="body">
            <div id="list">
                <div>
                    <div id="user"></div>
                    <div id="listAlive"></div>
                    <div id="listDead"></div>
                </div>
            </div>

            <div id="filter" class="absolute">
                <div id="log" class="absolute">
                    <div class="text"></div>
                    <button id="logOk">OK</button>
                    <button id="logCancel">Cancel</button>
                    <div class="cloud x1"></div>
                    <div class="cloud x2"></div>
                </div>
                <div class="countdown"></div>
            </div>
        </div>        

        <div id="console">
            <!--            <div id="consoleTitle">
                            <span id="statusGame"></span>
                            <span class="gameName"></span>
                        </div>-->
            <div class="text"><br/></div>
            <form id="chatForm">
                <input id="chat"></input>
            </form>
        </div>

        <div id="card" class="swipe">
            <div id="cardBack" class="cardImage"></div>
            <div id="cardFront">
                <div class="cardImage"></div>
                <div class="text"><div></div></div>
            </div>
        </div>

        <!--visuals card-->
        <div id='phpCard'></div>

        <script>

            function reload() {
                if (!navigator.onLine) {
                    $("#log").text("Connection lost. Try again");
                }
                window.location.reload(true);
            }

            //let Game js injection
            var Game = {};
            Game.id = <?php echo $gameId ?>;
            Game.lang = '<?php echo $lang ?>';
            Game.info = {};
            Game.players = {};
            Game.sleep = true;
            Game.temp = {};
            Game.url = window.location.host;
            Game.connection = "ajax";
            Game.wakeUpTime = 2000;
            Game.cardLoading = false;
            Game.ping = 300;
            //check connection type
            $(document).ready(function() {
                if (typeof Device !== "undefined") {
                    Device.onGameLoaded();
                } else {
                    loadGame();
                }
            });
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
                $("#disclaimer").load("./game_disclaimer.html");
                $("#currentUrl").append("<b>Current URL:</b> <br/><br/> <small>" + window.location.href + "</small>");
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
                        $("#countdown").addClass("lastSeconds");
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
                            $("#statusGame").text("waitPlayersVotes");
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

                if (res.players) { // PLAYERS
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
                    $("#phpCard").load("cards/" + Game.card + ".php", function(response) { //card could be changed
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
                    $(".gameName").text(Game.info.name);
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
                $("#header .content").html("");
                //password
                if (Game.info.password) {
                    $("#password input").attr("placeholder", Game.info.password);
                    var div = $("<div id='passwordIcon'>");
                    $("#header .content").append(div);
                    div.click(function() {
                        flash("game with password");
                    });
                }
                //day Time by player
                var div = $("<div>");
                div.append("<div id='clockIcon'></div>");
                if (Game.info.dayTime) {
                    $("#dayTime input").attr("placeholder", Game.info.dayTime);
                    div.append(Game.info.dayTime);
                } else {
                    div.append($("#dayTime input").attr("placeholder"));
                }
                $("#header .content").append(div);
                div.click(function() {
                    flash("seconds of day time by player");
                });
                //open voting
                if (Game.info.openVoting == 1) {
                    $("#openVoting input").attr('checked', true);
                    var div = $("<div><div id='openVoting'>");
                    $("#header .content").append(div);
                    div.click(function() {
                        flash("let players vote during the day");
                    });
                }
                //admin end Turn power
                if (Game.info.endTurn == 1) {
                    $("#endTurn input").attr('checked', true);
                    var div = $("<div><div id='endTurnIcon'>");
                    $("#header .content").append(div);
                    div.click(function() {
                        flash("admin can end turn immediately");
                    });
                }

                //hide
                if (Game.user && Game.user.admin) { // == 1
                    $(".admin").addClass("selectable");
                }
                $("#console .night").hide();
                $(".gameOver").removeClass("selectable");
                $("#startButton").hide();
                $("#endTurnButton").hide();
                $(".countdown").hide();
                //show &
                switch (Game.info.status) {

                    case 1: //town discusing
                        Game.ping = 300;
                        console.log("town discussion...");
                        runCountdown();
                        $(".gameOver").addClass("selectable");
                        $("#endTurnButton").show();
                        $(".countdown").show();
                        if ($("body").attr("class") == "night") {
                            $("body").attr("class", "day");
                            wakeUp("Good morning!");
                        }

                        break;
                    case 2: //night time
                        console.log("night");
                        Game.ping = 300;
                        wakeUp(false); //prevent wake up on other night turn
                        Game.time = null;
                        if ($("body").attr("class") != "night") { // 1st time
                            $("body").attr("class", "night");
                            $(".userCheck").removeClass("userCheck");
                            $(".votes span").remove();
                            sleep();
                            $("#statusGame").text("nightTime");
                            $("#console .night").show();
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
                        if ($("body").attr("class") != "gameover") {
                            wakeUp("GAME OVER", true);
                            endTurn();
                            $("#statusGame").text("GAME OVER");
                            $("body").attr("class", "gameover");
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
                        $(".gameOver").addClass("selectable");
                        if ($("body").attr("class") != "wait") {
                            wakeUp("gameRestarted", true);

                            $(".extra").empty();
                            $(".extra").css("background-image", "none");
                            for (var id in Game.players) {
                                Game.players[id].card = "";
                            }

                            endTurn();
                            $("#statusGame").text("waitingNewGame");
                            $(".playerStatus").text("waiting");
                            $("body").attr("class", "wait");
                        }

                        if (Game.user.admin) {
                            if (Game.card) {
                                $("#startButton").show();
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
                $(".player").remove();
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
                            $("#updateName input").attr("placeholder", Game.user.name);
                        }
                    }
                }

                // ADD ALL PLAYERS
                var iColor = 0;
                for (id in players) {
                    var player = players[id];
                    var div = $("<div>");
                    var up = $("<div class='up'>");
                    var down = $("<div class='down'>");
                    div.append("<symbol class='playerSymbol'>U</symbol>");
                    div.append(up);
                    div.append(down);
                    up.append($("<span class='name'>" + player.name + "<span>"));
                    down.append($("<span class='playerStatus'>"));
                    down.append($("<span class='votes'>"));
                    div.append($("<div class='extra'>"));
                    div.attr("id", player.id);
                    div.addClass("player");
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
                        div.find(".playerStatus").text(cardName);
                        addBackgroundCard(div.find(".extra"), player.card);
                    }

                    // SORT divs players
                    player.status = parseInt(player.status);
                    if (!player.status) { //if not playing
                        $("#listDead").append(div);
                        div.addClass("spectator");
                        div.find(".playerStatus").text("spectator");
                    } else if (player.status < 1) {
                        $("#listDead").append(div);
                        div.addClass("dead");
                        div.find(".playerStatus").prepend("dead ");
                        div.find(".extra").text("☠");
                    } else {
                        $("#listAlive").append(div);
                        div.find(".playerStatus").text("alive");
                    }

                    $('<style>.id' + player.id + ' {color:' + colors[iColor++] + '}</style>').appendTo('head');
                    div.find(".name").addClass("id" + player.id);
                    if (player.admin == 1) {
                        div.find(".name").append("<symbol>R</symbol>");
                    }
                    if (Game.userId == player.sel) {
                        div.find(".name").addClass("enemy");
                    }
                }

                $("#user").append(Game.players[Game.userId].div);
                // ADD INTERACTION PLAYERS
                for (id in players) {
                    var player = players[id];
                    if (player.sel) {
                        addVote($("#" + player.sel + " .votes"));
                        player.div.find(".playerStatus").append(" voting to <span class='id" + player.sel + "'></span>");
                    }
                }

                // OWN PROPERTIES
                $(".player").removeClass("userCheck");
                if (Game.user.sel) {
                    $("#" + Game.user.sel).addClass("userCheck");
                }
            }

            function setQuitPlayerButtons() {
                if ($.isEmptyObject(Game.info)) {
                    return;
                }
                if (!Game.info.status) {
                    $(".extra").html("");
                    if (Game.user.admin) {
                        for (id in Game.players) {
                            if (id != Game.userId) {
                                $("#" + id + " .extra").html(
                                        "<button class='gameOver quit'>quit</button>");
                            }
                        }
                    }
                }
                $(".player .quit").click(function() {
                    var id = $(this).closest(".player").attr("id");
                    $("#" + id).remove();
                    Game.request.deletePlayer(id);
                });
            }

            function setUserCard() {
                $("#card").removeClass("rotate");
                if (!$("#cardFront").hasClass(Game.card)) { //only new card
                    $("#cardFront").attr("class", Game.card);
//                    var filename = Game.card.split("_")[1];
                    var card = Game.cards[Game.card];
                    addBackgroundCard($("#cardFront .cardImage"), Game.card);
                    var name, desc;
                    if (card) {
                        name = card.name;
                        desc = card.desc;
                    } else {
                        name = Game.card;
                        desc = "no special habilities";
                    }

                    $("#cardFront .text > div").text(name.toUpperCase());
                    var p = $("<p>" + desc + "</p>");
                    $("#cardFront .text > div").html(p);
                    $("#card").addClass("visible");
                    setTimeout(function() {
                        $("#card").removeClass("visible");
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
                    if (div.hasClass("userCheck")) { //UNSELECT
                        if (Game.unselectFunction && Game.unselectFunction(player.id) != false) {
                            removeVote(div.find(".votes"));
                            div.removeClass("userCheck");
                        }

                    } else if (Game.selectFunction && Game.selectFunction(player.id) != false) { //SELECT
                        if (Game.user.sel) {
                            removeVote($("#" + Game.user.sel + " .votes"));
                        }
                        Game.user.sel = player.id;
                        addVote(div.find(".votes"));
                        $(".player").removeClass("userCheck");
                        div.addClass("userCheck");
                    } else {
                        console.log("not select function")
                    }
                });
            }

            function addVote(span) {
                span.append("<span>&#x2718; </span>");
                var count = span.find("span").length;
                span.closest(".player").find(".extra").text(count);
            }
            function removeVote(span) {
                span.find("span").first().remove();
                var count = span.find("span").length;
                var extra = span.closest(".player").find(".extra");
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
                            addBackgroundCard($("#user .extra"), Game.cardName);
                        }
                        $("#filter").removeClass("sleep");
                        Game.sleep = false;
                    }, false);
                }, wait);
            }

            function sleep() {
                flash("close your eyes");
                $("#filter").addClass("sleep");
                Game.sleep = true;
            }

            function endTurn() {
                Game.info.night = null;
                $(".votes").html("");
                $(".userCheck").removeClass("userCheck");
                $("#user .extra").css("background-image", "");
                $(".player").each(function() {
                    if (!$(this).hasClass("dead")) {
                        $(this).find(".extra").empty();
                    }
                });
            }

            var url = "<?php echo $smalltownURL ?>";
        </script>

        <script type="text/javascript" src="<?php echo $smalltownURL ?>lang/<?php echo $lang ?>.js"></script>       
        <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/jquery.mobile.events.min.js"></script>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/modernizr.custom.36644.js"></script>        
        <script type="text/javascript" src="<?php echo $smalltownURL ?>js/events.js"></script>		 
        <script type="text/javascript" src="<?php echo $smalltownURL ?>js/util.js"></script>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>libs/json2.js"></script>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>js/connection.js"></script>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>js/requests.js"></script>
        <script type="text/javascript" src="<?php echo $smalltownURL ?>js/messages.js"></script>  
    </body>
</html>
