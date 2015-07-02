
SMLTOWN.Load = {
    //LOAD CALL    
    showPage: function(url) {
        if ($("body").attr("id") == "smltown") { //game as MAIN app
            window.location.hash = url; //get hash and divLoad
        } else {
            this.divLoad(url);
        }
    }
    ,
    //LOAD FUNCTION
    divLoad: function(url) {
        var $this = this;
        var urlArray = url.split("?");
        var urlPage = urlArray[0];
        if (urlPage == "game") {
            SMLTOWN.Local.stopRequests();
            if (typeof urlArray[1] != "undefined") {
                SMLTOWN.Game.id = urlArray[1];
            }
            $("#smltown_game").load(SMLTOWN.path + "game.php");

        } else if (urlPage == "gameList") {
            $("#smltown_game").load(SMLTOWN.path + "gameList.html", function() {
                $this.gameList();
            });
        }
    }
    ,
    //GAME LIST
    gameList: function() {
        if ($("#smltown_connectionCheck").length) {
            smltown_error("return")
            return;
        }
        //ONCE
        var $this = this;
        if (document.location.hostname != "localhost") {
            //let crate games
            $("#smltown_title").html("<table class='smltown_createGame'>"
                    + "<td id='smltown_nameGame'><input type='text' placeholder='&#128269; game name'></td>"
                    + "<td id='smltown_newGame' class='smltown_button'><div>create game</div></td>"
                    + "</table>");

            //LIST EVENTS
            //search utility
            $("#smltown_nameGame input").keyup(function() { //CREATE GAME                
                var val = $(this).val();
                if(val == $this.gameSearchValue){
                    return;
                }
                $this.gameSearchValue = val;
                
                if (val.length > 2) {
                    SMLTOWN.Server.ajax({
                        action: "getGamesInfo",
                        name: val
                    }, function(games) {
                        SMLTOWN.Games.list(games);
                    });

                } else if (!val.length) { //if remove search name reload again
                    $this.reloadList();
                }
            });

            $("#smltown_newGame").click(function() { //CREATE GAME
                SMLTOWN.Games.create();
            });
        }

        //show kind of connection        
        $("#smltown_footer").html("<i id='smltown_connectionCheck'>This server <span class='allowWebsocket'></span> allows websocket connection.</i>");
        SMLTOWN.Server.websocketConnection(function(done) {
            if (!done) {
                $(".smltown_allowWebsocket").text("NOT");
            }
            $("#smltown_connectionCheck").show();
            SMLTOWN.Games.update();
        });
    }
    ,
    //GAME
    reloadGame: function() {        
        this.showPage("game");
    }
    ,
    reloadList: function() {
        //load games
        SMLTOWN.Games.update();
        SMLTOWN.Local.pingGames();
    }
    ,
    timeout: null
    ,
    start: function() {
        var $this = this;
        if (!$("#smltown_loading").length) {
            $("#smltown_html").append("<div id='smltown_loading'><div class='smltown_loader'></div></div>");
            //loading timeout
            this.timeout = setTimeout(function() {
                $this.end();
                SMLTOWN.Message.notify("warn: server doesn't seems to respond", true);
            }, 5000);
        }
    }
    ,
    end: function() {
        $("#smltown_loading").remove();
        clearTimeout(this.timeout);
    }
};
