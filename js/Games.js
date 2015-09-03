
SMLTOWN.Games = {
    array: []
    ,
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
            $("#smltown_loadingDiv").removeClass("smltown_loader");
            var length = games.length;
            if (!length) {
                SMLTOWN.Message.flash("noMoreGames");
                $this.over = true;
                return;
            }
            $this.offset += length;
            for (var i = 0; i < length; i++) {
                $this.addRow(games[i]);
            }

            $("#smltown_games").append($("#smltown_footer"));
            SMLTOWN.Events.touchScroll($("#smltown_gamesWrapper"), "top");
        });
    }
    ,
    list: function (games) {        
        console.log("games = ");
        console.log(games)
        this.array = games;
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
        
        var gameInfo = $("<span class='smltown_gameInfo'>");
        if (game.message) {
            var message = SMLTOWN.Message.translate(game.message);
            gameInfo.text('"' + message + '"');
            div.addClass("smltown_playingMessage");
        } else if (parseInt(game.playing)) {
            var playingHere = SMLTOWN.Message.translate("playingHere");
            gameInfo.html("<small>" + playingHere + "<small>");
            div.addClass("smltown_playing");
        }else if("0" != game.status){
            gameInfo.html("<small>game started<small>");
            div.addClass("smltown_playingStarted");
        }
        div.append(gameInfo);

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
        SMLTOWN.Local.stopRequests();
        var name = $("#smltown_nameGame input").val();
        if (name.length < 3) {
            SMLTOWN.Message.flash("name must contain 3 letters");
            return;
        }
        for(var i = 0; i < this.array; i++){
            if(name.toLowerCase() == this.array[i].name.toLowerCase()){
                SMLTOWN.Message.flash("game name exists");
                return;
            }
        }
        
        //start loading
        SMLTOWN.Server.loading();
        SMLTOWN.Server.ajax({
            action: "createGame",
            name: name
        }, function (id) {
            SMLTOWN.Server.loaded();
            if (!isNaN(id)) {
                SMLTOWN.Game.info.id = id;
                SMLTOWN.Load.showPage("game?" + SMLTOWN.Game.info.id);
            } else {
                smltown_error("error on id = " + id);
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
        if(id == SMLTOWN.Game.info.id){
            return;
        }
        SMLTOWN.Load.start();
        SMLTOWN.Local.stopRequests();         
        SMLTOWN.Game.info.id = id;
        SMLTOWN.Load.showPage("game?" + id);
    }
};
    