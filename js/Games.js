
SMLTOWN.Games = {
    update: function() {
        var $this = this;
        SMLTOWN.Server.ajax({
            action: "getGamesInfo"
        }, function(games) {
            $this.list(games);
        });
    }
    ,
    list: function(games) {
        console.log(games)
        $(".smltown_game").not(".smltown_local").remove();
        for (var i = 0; i < games.length; i++) {
            this.addRow(games[i]);
            if (document.location.hostname == "localhost") {
                break;
            }
        }
    }
    ,
    addRow: function(game) {
        
        var div = $("<div id='" + game.id + "' class='smltown_game'>");
        if (document.location.hostname == "localhost") {
            div.addClass("smltown_local");
            game.name = "Local Game"
        }
        var name = $("<span class='smltown_name'>" + game.name + "</span>");
        div.append(name);
        if (game.password) {
            name.append("<symbol class='smltown_password'>x</symbol>");
        }

        div.append("<span class='smltown_playersCount'><small>players: </small> " + game.players + "</span>");
        div.append("<span class='smltown_admin'><small>admin: </small> " + game.admin + "</span>");
        if (parseInt(game.playing)) {
            div.append("<span class='smltown_gameInfo'><small>you are playing here</small></span>");
        }

        $("#smltown_games").append(div);
        this.setEvents(game.id);
    }
    ,
    addLocalGamesRow: function(href, ip, name) {
        var div = $("<div class='smltown_game smltown_local'>");
        div.append("<span class='name'>Local Game</span>");
        div.append("<span class='smltown_admin'><small>ip: " + ip + "</small>" + name + "</span>");

        $("#smltown_games").prepend(div);
        div.click(function() {
            SMLTOWN.Local.stopRequests();
            SMLTOWN.Load.showPage("game?1");
        });
    }
    ,
    create: function() {
        SMLTOWN.Local.stopRequests();
        var name = $("#smltown_nameGame input").val();
        if (name.length < 3) {
            SMLTOWN.Message.flash("name must contain 3 letters");
            return;
        }

        $("#smltown_log").text("!wait...");

        SMLTOWN.Server.ajax({
            action: "createGame",
            name: name
        }, function(id) {
            if (!isNaN(id)) {
                SMLTOWN.Game.id = id;
                SMLTOWN.Load.showPage("game?" + SMLTOWN.Game.id);
            } else {
                smltown_error("id = " + id);
            }
        });
    }
    ,
    setEvents: function(id) {
        var $this = this;
        $("#" + id).click(function() {
            var id = $(this).attr("id");
            $this.access(id);
        });
    }
    ,
    access: function(id) {
        SMLTOWN.Local.stopRequests();
        SMLTOWN.Game.id = id;
        SMLTOWN.Load.showPage("game?" + id);
    }
};
    