//USER GAME ACTIONS

SMLTOWN.Action = {
    wakeUp: function (message, instantlyWakeUp, callback) {
        var $this = this;
        if (undefined == typeof message) {
            $("#smltown_filter").removeClass("smltown_sleep");
            SMLTOWN.user.sleeping = false;
        }
        if (!message) { //allways remove last message
            SMLTOWN.Message.removeNotification();
            return false; //false
        }
        if (!instantlyWakeUp && !SMLTOWN.user.sleeping) {
            return false; //false
        }

        var wait = SMLTOWN.Game.wakeUpTime;
        if (instantlyWakeUp) { //override: restarted game, ..
            wait = 0;
        }

        SMLTOWN.user.sleeping = false; // warns players will be awake
        this.wakeUpTimeout = setTimeout(function () { // WAIT 2 SECONDS TO ALLOW PLAYERS CLOSE EYES
            SMLTOWN.Message.notify(message, function () {
                $("#smltown_filter").removeClass("smltown_sleep");
            }, false);
            if (callback) {
                callback();
            }

            $this.startTurn();
        }, wait);
    }
    ,
    wakeUpCard: function (callback) {
        if (this.night.wakeUp) { //like seer salected id's wakeup
            this.night.wakeUp();
        }

        var t = SMLTOWN.Message.translate;
        var name = SMLTOWN.cards[SMLTOWN.user.card].name;

        this.wakeUp(t("wakeUp") + " " + name.toUpperCase()
                + "... " + t("yourTurn"), null, function () {
            if (callback) {
                callback();
            }
        });

        //if (this.night.wakeUp) { //like seer salected id's wakeup
        //    this.night.wakeUp();
        //}
    }
    ,
    sleep: function () {
        if (isNaN(SMLTOWN.user.status) || -1 == SMLTOWN.user.status) {
            return;
        }
        this.endTurn();

        SMLTOWN.Message.flash("closeEyes");
        $("#smltown_cardConsole").hide();

        $("#smltown_filter").addClass("smltown_sleep");
        SMLTOWN.user.sleeping = true;
    }
    ,
    selectFunction: function () {
        return false;
    }
    ,
    unselectFunction: function () {
        return false;
    }
    ,
    playerSelect: function (id) {

        var player = SMLTOWN.players[id];
        if (!SMLTOWN.Game.info.status && SMLTOWN.Game.info.status > 4) { //out of game
            return;
        } else if ("undefined" == typeof SMLTOWN.user.status || null == SMLTOWN.user.status) {
            SMLTOWN.Message.flash("youEspectator");
            return;
        } else if (SMLTOWN.user.status < 0) {
            SMLTOWN.Message.flash("youDead");
            return;
        } else if (!player.status) {
            //SMLTOWN.Message.flash("player is a espectator");
            return;
        } else if (player.status < 1) {
            //SMLTOWN.Message.flash("player is dead");
            return;
        }

        //DEFINE day/night functions //override from game rules
        if(false == this.defineSelectFunctions()){
            return;
        }

        //PRESELECT
        var div = $("#" + player.id);
        if (!div.hasClass("smltown_preselect") && !div.hasClass("smltown_check")) {
            $(".smltown_preselect").removeClass("smltown_preselect");
            div.addClass("smltown_preselect");
            if ($(".smltown_check").length) { //UNSELECT
                this.unselect();
            }
            return;
        }
        $(".smltown_preselect").removeClass("smltown_preselect");

        //SELECT / UNSELECT WORK
        if (div.hasClass("smltown_check")) { //UNSELECT        
            this.unselect();

        } else if (this.selectFunction) { //SELECT
            SMLTOWN.user.sel = player.id;
            if (this.selectFunction(player.id) != false) { //if night select let
                this.removeVote(); //if user.sel
                this.addVote(player.id);
                $(".smltown_player").removeClass("smltown_check");
                div.addClass("smltown_check");
            }

        } else {
            console.log("not select function");
        }
    }
    ,
    defineSelectFunctions: function () {
        //override from game rules
        this.selectFunction = SMLTOWN.Server.request.selectPlayer;
        this.unselectFunction = SMLTOWN.Server.request.unSelectPlayer;
    }
    ,
    unselect: function () {
        var id = SMLTOWN.user.sel;
        if (this.unselectFunction && this.unselectFunction(id) != false) {
            $("#" + id).removeClass("smltown_check");
//            var vote = $("#" + id + " .smltown_votes span")[0];
//            $(vote).remove();
            this.removeVote(id);
            SMLTOWN.user.sel = null;
        }
    }
    ,
    addVote: function (id) {
        var span = $("#" + id + " .smltown_votes");
        span.append("<span> &#x2718; </span>");
        //TODO: conflict with cleanVotes and killed players
        //var count = span.find("span").length;
        //$("#" + id + " .smltown_extra").text(count);
    }
    ,
    removeVote: function (id) {
        if (!id) {
            id = SMLTOWN.user.sel;
            if (!id) {
                return;
            }
        }
        var playerDiv = $("#" + id);
        var spanVotes = playerDiv.find(".smltown_votes span");
        var count = spanVotes.length - 1;
        spanVotes.first().remove();
        var extra = playerDiv.find(".smltown_extra");
        if (count) {
            extra.text(count);
        } else {
            extra.text("");
        }
    }
    ,
    //turn actions
    startTurn: function () { //wakeUp
        console.log("start turn");
        for (var id in SMLTOWN.players) {
            var player = SMLTOWN.players[id];
            if (player.card) {
                //patch
                SMLTOWN.Add.backgroundCard(player.div.find(".smltown_extra"), player.card);
            }
        }
    }
    ,
    endTurn: function () { //sleep
        console.log("end turn (sleep)");
        this.cleanVotes();
        //not remove Game.info.night -> let status change roles to play!        
        this.clearCards();
    }
    ,
    endNight: function () {
        console.log("end night");
        for (var id in SMLTOWN.players) {
            var player = SMLTOWN.players[id];
            if (player.status > -1) {
                player.card = null;
            }
            //evict night killers message
            player.sel = null;
        }
        this.cleanVotes();
        this.clearCards();
    }
    ,
    resetGame: function () {
        SMLTOWN.user.rulesJS = "";
        $("*").unbind(".smltown_rules");
    }
    ,
    removeCards: function () {
        console.log("removeCards");
        for (var id in SMLTOWN.players) {
            SMLTOWN.players[id].card = null;
        }
        $(".smltown_extra").html("");
        $(".smltown_extra").css("background-image", "");
    }
    ,
    cleanVotes: function () {
        console.log("clean votes");

        SMLTOWN.user.sel = null;
        for (var id in SMLTOWN.players) {
            var player = SMLTOWN.players[id];
            player.sel = null;
            if (player.status > 0) { //like no killed symbol
                player.div.find(".smltown_extra").html("");
            }
        }

        $(".smltown_votes").html("");
        $(".smltown_check").removeClass("smltown_check");
        $(".smltown_preselect").removeClass("smltown_preselect");
    }
    ,
    clearCards: function () {
        for (var id in SMLTOWN.players) {
            var player = SMLTOWN.players[id];
            if (player.status > -1) {
                player.card = null;
                var div = player.div;
                div.find(".smltown_extra").html("");
                div.find(".smltown_extra").css("background-image", "");
            }
        }
    }
    ,
    night: {}
};
