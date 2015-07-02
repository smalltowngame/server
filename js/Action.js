
//USER GAME ACTIONS

SMLTOWN.Action = {
    wakeUp: function(message, instantlyWakeUp) {
        if (!message) {
            SMLTOWN.Message.notify("");
            return false; //false
        }
        if (!instantlyWakeUp && !SMLTOWN.user.sleeping) {
            return false; //false
        }

        var wait = SMLTOWN.Game.wakeUpTime;
        if (instantlyWakeUp) { //override: restarted game, ..
            wait = 0;
        }

        this.wakeUpTimeout = setTimeout(function() { // WAIT 2 SECONDS TO ALLOW PLAYERS CLOSE EYES
            SMLTOWN.Message.notify(message, function() {
                if (SMLTOWN.Game.info.status == 2) { //if is night
                    SMLTOWN.Add.backgroundCard($("#smltown_user .smltown_extra"), SMLTOWN.cardName);
                }
                $("#smltown_filter").removeClass("smltown_sleep");
                SMLTOWN.user.sleeping = false;
            }, false);
        }, wait);
    }
    ,
    sleep: function() {
        if (isNaN(SMLTOWN.user.status) || -1 == SMLTOWN.user.status) {
            return;
        }
        SMLTOWN.Message.flash("closeEyes");
        $("#smltown_filter").addClass("smltown_sleep");
        SMLTOWN.user.sleeping = true;
    }
    ,
    selectFunction: function() {
        return false;
    }
    ,
    unselectFunction: function() {
        return false;
    }
    ,
    playerSelect: function(id) {
        var player = SMLTOWN.players[id];
        if (!SMLTOWN.Game.info.status && SMLTOWN.Game.info.status > 2) { //out of game
            return;
        } else if (!SMLTOWN.user.status) {
            SMLTOWN.Message.flash("you are a espectator");
            return;
        } else if (SMLTOWN.user.status < 1) {
            SMLTOWN.Message.flash("hey!, you are dead");
            return;
        } else if (!player.status) {
            //SMLTOWN.Message.flash("player is a espectator");
            return;
        } else if (player.status < 1) {
            //SMLTOWN.Message.flash("player is dead");
            return;
        }

        //DEFINE day/night functions         
        if (SMLTOWN.Game.info.status == 1 && !SMLTOWN.Game.info.night) {
            if (1 != SMLTOWN.Game.info.openVoting && SMLTOWN.Time.countdownInterval) {
                console.log("time is not ended");
                return;
            }
            this.selectFunction = SMLTOWN.Server.request.selectPlayer;
            this.unselectFunction = SMLTOWN.Server.request.unSelectPlayer;
        } else if (SMLTOWN.Game.info.night && SMLTOWN.Game.info.night == SMLTOWN.card) {
            this.selectFunction = this.night.select;
            this.unselectFunction = this.night.unselect;
        } else if (SMLTOWN.Game.info.night) {
            var array = SMLTOWN.Game.info.night.split("_");
            var cardName = array[array.length - 1];
            SMLTOWN.Message.flash("Wait!, " + cardName + " is plotting something!");
        } else {
            console.log("nothing to select");
            return;
        }

        //PRESELECT
        var div = $("#" + player.id);
        if (!div.hasClass("smltown_preselect") && !div.hasClass("smltown_userCheck")) {
            if ($(".smltown_userCheck").length) { //UNSELECT
                this.unselect();
            }
            $(".smltown_preselect").removeClass("smltown_preselect");            
            div.addClass("smltown_preselect");
            this.preselect = player.id;
            return;
        }
        $(".smltown_preselect").removeClass("smltown_preselect");

        //SELECT / UNSELECT WORK        

        if (div.hasClass("smltown_userCheck")) { //UNSELECT
            this.unselect();

        } else if (this.selectFunction(player.id) != false) { //SELECT
            this.removeVote(); //if user.sel
            SMLTOWN.user.sel = player.id;
            this.addVote(player.id);
            $(".smltown_player").removeClass("smltown_userCheck");
            div.addClass("smltown_userCheck");
        } else {
            console.log("not select function");
        }
    }
    ,
    unselect: function() {
        var id = SMLTOWN.user.sel;
        if (false != this.unselectFunction(id)) {
            $("#" + id).removeClass("smltown_userCheck");
            $("#" + id + " .smltown_votes span").get(0).remove();
            this.removeVote(id);            
        }
    }
    ,
    addVote: function(id) {
        var span = $("#" + id + " .smltown_votes");
        span.append("<span> &#x2718; </span>");
        var count = span.find("span").length;
        span.closest(".smltown_player").find(".smltown_extra").text(count);
    }
    ,
    removeVote: function(id) {
        if (!id) {
            id = SMLTOWN.user.sel;
            if (!id) {
                return;
            }
        }
        var playerDiv = $("#" + id);
        var spanVotes = playerDiv.find(".smltown_votes span");
        spanVotes.first().remove();
        var count = spanVotes.length;
        var extra = playerDiv.find(".extra");
        if (count) {
            extra.text(count);
        } else {
            extra.text("");
        }
    }
    ,
    endTurn: function() {
        SMLTOWN.Game.info.night = null;
        $(".smltown_votes").html("");
        $(".smltown_userCheck").removeClass("smltown_userCheck");
        $("#smltown_user .smltown_extra").css("background-image", "");
        $(".smltown_player").each(function() {
            if (!$(this).hasClass("dead")) {
                $(this).find(".extra").empty();
            }
        });
    }
    ,
    night: {}
};
