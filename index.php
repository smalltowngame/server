<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Expose-Headers: smalltown, name");
header('smalltown: 1');
header('name:4');

session_start();
include_once 'DB.php';
include_once 'DB_response.php';

$games = getGamesInfo();
echo "<script>var games = JSON.parse('$games');</script>";
?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon"/>
        <script type="text/javascript" src="libs/errorLog.js"></script>
        <script type="text/javascript" src="libs/jquery-1.11.0.min.js"></script>
    </head>

    <body>
        <div id="body"></div>
    </body>

    <script>

        $(window).load(function () { //load to wait images
            $("#body").load("gameList.html", function () {
                indexLoad();
            });
        });

        function indexLoad() {
            if (document.location.hostname != "localhost") {
                $("#games").before("<div class='createGame'> <input id='nameGame' type='text' placeholder='game name'> <button id='newGame'>create game</button> </div>");
            }

            $("#newGame").click(function () { //CREATE GAME
                createGame();
            });
            $("#footer").prepend("<i id='connectionCheck'>This server <span class='allowWebsocket'></span> allows websocket connection.</i>");
            var url = window.location.href;
            var message = url.split("#")[1];
            if (message) {
                $("#log").text(message.split("_").join(" "));
            }

            if (typeof Device !== "undefined") {
                //if("function" == typeof Device.onIndexLoaded)
                //Device.onIndexLoaded();

            }

            websocketConnection(function (done) {
                if (!done) {
                    $(".allowWebsocket").text("NOT");
                }
                $("#connectionCheck").show();
                listGames(games);
            });
        }

        function updateGames(){
            var json = JSON.stringify({
                action: "getGamesInfo"
            });
            ajax(json, function (res) {
                var games;
                try{
                    games = JSON.parse(res);
                }catch(e){
                    console.log("error");
                    return;
                }
                listGames(games);
            });
        }

        function listGames(games) {
            $(".game").remove();
            for (var i = 0; i < games.length; i++) {
                addGamesRow(games[i]);
                if (document.location.hostname == "localhost") {
                    break;
                }
            }
        }

        function addGamesRow(game) {

            var classNames = "game";
            if (document.location.hostname == "localhost") {
                classNames += " local";
                game.name = "Local Game"
            }
            var div = $("<div id='" + game.id + "' class='" + classNames + "'>");
            div.append("<span class='name'>" + game.name + "</span>");
            if (game.password) {
                div.append("<symbol class='password'>x</symbol>");
            }

            div.append("<span class='playersCount'><small>players: </small> " + game.players + "</span>");
            div.append("<span class='admin'><small>admin: </small> " + game.admin + "</span>");
            $("#games").append(div);
            gameEvents(game.id);
        }

        function createGame() {
            stopLocalGameRequests();
            var name = $("#nameGame").val();
            if (!name) {
                $("#log").text("empty name!");
                return;
            }

            $("#log").text("!wait...");
            var json = JSON.stringify({
                action: "createGame",
                name: name
            });
            ajax(json, function (id) {
                if (!isNaN(id)) {
                    window.location.href = "./game?id=" + id;
                } else {
                    $("#log").html(id);
                }
            });
        }

        function gameEvents(id) {
            $("#" + id).click(function () {
                var id = $(this).attr("id");
                if ($(this).closest("tr").hasClass("password")) {
                    askPassword(id);
                } else {
                    accessGame(id);
                }
            });
        }

        function askPassword(id) {
            $("body").append("<div class='dialog'><form id='passwordForm'>"
                    + "<input type='text' id='password' gameId='" + id + "' placeholder='password'>"
                    + "<input type='submit' value='Ok'>"
                    + "<input type='button' value='Cancel' onclick='$(\".dialog\").remove();'>"
                    + "<div class='log'></div>"
                    + "</form><div>");
            $("#password").focus();
            $("#passwordForm").submit(function () {
                $("#passwordForm .error").text("");
                var gameId = $("#password").attr("gameId");
                var password = $("#password").val();
                var json = JSON.stringify({
                    action: "checkPassword",
                    gameId: gameId,
                    password: password
                });
                ajax(json, function (res) {
                    if (res > 0) {
                        $("#passwordForm .log").html("loading game...");
                        accessGame(gameId);
                    } else {
                        $("#passwordForm .log").html("<div class='error'>wrong password</div>");
                    }
                });
                return false;
            });
        }

        function accessGame(id) {
            stopLocalGameRequests();
            window.location.href = "./game?id=" + id;
        }

        window.onbeforeunload = function () {
            stopLocalGameRequests();
            return null;
        };
    </script>
    <script type="text/javascript" src="js/ajax.js"></script>
    <!--check websocket connection-->
    <script type="text/javascript" src="js/connection.js"></script>
</html>