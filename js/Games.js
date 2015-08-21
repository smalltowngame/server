
SMLTOWN.Games = {
    offset: 0
    ,
    over: false
    ,
    update: function () {
        var $this = this;
        SMLTOWN.Server.ajax({action: "getGamesInfo", userId: SMLTOWN.user.userId}, function (games) {
            $this.list(games);
        });
    }
    ,
    loadMore: function () {
        var $this = this;
        if (this.over) {
            return;
        }
        
        $("#smltown_loadingDiv").addClass("smltown_loader");
        var offset = this.offset;
        console.log("loadMore: offset = " + offset);
        
        SMLTOWN.Server.ajax({action: "getGamesInfo", userId: SMLTOWN.user.userId, offset: offset}, function (games) {
            console.log(games);
            var length = games.length;
            if (!length) {
                console.log("no more games");
                $this.over = true;
                return;
            }
            $this.offset += length;
            for (var i = 0; i < length; i++) {
                $this.addRow(games[i]);
            }
            
            $("#smltown_loadingDiv").removeClass("smltown_loader");
            $("#smltown_games").append($("#smltown_footer"));
            SMLTOWN.Events.touchScroll($("#smltown_gamesWrapper"), "top");
        });
    }
    ,
    list: function (games) {
        console.log("games = ");
        console.log(games)
        $(".smltown_game").not(".smltown_local").remove();
        var length = games.length;
        this.offset = length;
        for (var i = 0; i < length; i++) {
            this.addRow(games[i]);
            if (document.location.hostname == "localhost") {
                break;
            }
        }
        $("#smltown_games").append($("#smltown_footer"));
        SMLTOWN.Events.touchScroll($("#smltown_gamesWrapper"), "top");
    }
    ,
    addRow: function (game) {
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


        var icons = $("<div class='smltown_icons'>");
        SMLTOWN.Add.icons(game, icons);
        div.append(icons);

        div.append("<span class='smltown_playersCount'><small>players: </small> " + game.players + "</span>");
        div.append("<span class='smltown_admin'><small>admin: </small> " + game.admin + "</span>");
        if (parseInt(game.playing)) {
            var playingHere = SMLTOWN.Message.translate("playingHere");
            div.append("<span class='smltown_gameInfo'><small>" + playingHere + "</small></span>");
            div.addClass("smltown_playing");
        }

        $("#smltown_games").append(div);
        this.setEvents(game.id);
    }
    ,
    addLocalGamesRow: function (href, ip, name) {
        var div = $("<div class='smltown_game smltown_local'>");
        div.append("<span class='name'>Local Game</span>");
        if (!name) {
            name = "ip: " + ip;
        }
        div.append("<span class='smltown_admin'><small>" + name + "</small></span>");

        $("#smltown_games").prepend(div);
        div.click(function () {
            SMLTOWN.Local.stopRequests();
            SMLTOWN.Load.showPage("game?1");
        });
    }
    ,
    create: function () {
        SMLTOWN.Server.loading();
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
        }, function (id) {
            SMLTOWN.Server.loaded();
            if (!isNaN(id)) {
                SMLTOWN.Game.info.id = id;
                SMLTOWN.Load.showPage("game?" + SMLTOWN.Game.info.id);
            } else {
                smltown_error("id = " + id);
            }
        });
    }
    ,
    setEvents: function (id) {
        var $this = this;
        $("#" + id).click(function () {
            var id = $(this).attr("id");
            $this.access(id);
        });
    }
    ,
    access: function (id) {
        SMLTOWN.Local.stopRequests();
        SMLTOWN.Game.info.id = id;
        SMLTOWN.Load.showPage("game?" + id);
    }
};
    