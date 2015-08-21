
SMLTOWN.Update.gameStatus = function () {
    console.log("update game");
    //INPUTS
    SMLTOWN.Time.clearCountdowns();

    //hide        
    $("#smltown_game").attr("class", "");
    //$("#smltown_console .smltown_night").hide();
    $(".smltown_gameover").removeClass("smltown_selectable");
    $("#smltown_sun").hide();

    $("#smltown_startButton").hide();
    $("#smltown_endTurnButton").hide();

    $("#smltown_cardConsole").hide();

    //show &
    switch (SMLTOWN.Game.info.status) {

        case 1: //night time
            SMLTOWN.Server.ping = SMLTOWN.Server.fastPing;
            var message = false, instant = true;
            SMLTOWN.Action.wakeUp(message, instant); //prevent wake up on other night turn

            if ($("#smltown_body").attr("class") != "smltown_night") { // 1st time                    
                $("#smltown_body").attr("class", "smltown_night");
                $(".smltown_check").removeClass("smltown_check");
                $(".smltown_votes span").remove();

                SMLTOWN.Action.sleep(); //only if 1st time!
                $("#smltown_statusGame").smltown_text("nightTime");
                $("#smltown_console .smltown_night").show();
            }

            if (SMLTOWN.user.status > -1 && SMLTOWN.user.card == SMLTOWN.Game.info.night) {
                if (SMLTOWN.Action.night.extra) { //if extra
                    SMLTOWN.Server.request.nightExtra(); //1st call
                } else if (SMLTOWN.Action.night.select) { //or if select                        
                    SMLTOWN.Action.wakeUpCard();
                }
            }

            break;
        case 2:
            if ($("#smltown_body").attr("class") != "smltown_preDay") { // 1st time   
                $("#smltown_body").attr("class", "smltown_preDay");
                $("#smltown_statusGame").smltown_text("wakingUp");
                this.onStatusChange();
                SMLTOWN.Action.endNight();
            }
            break;
        case 3: //town discusing
            SMLTOWN.Server.ping = SMLTOWN.Server.fastPing;
            $("#smltown_sun").show(); //before countdown!

            SMLTOWN.Time.runCountdown();
            if ("1" == SMLTOWN.Game.info.endTurn) {
                $("#smltown_endTurnButton").show();
            }

            if ($("#smltown_body").attr("class") != "smltown_day") { // 1st time   
                $("#smltown_body").attr("class", "smltown_day");
                $("#smltown_statusGame").smltown_text("dayTime");

                var t = SMLTOWN.Message.translate;
                if (0 < parseInt(SMLTOWN.Game.info.time)) {
                    SMLTOWN.Action.wakeUp(t("GoodMorning")); //only if any server message
                }
            }
            break;
        case 4:
            if ($("#smltown_body").attr("class") != "smltown_postDay") { // 1st time   
                $("#smltown_body").attr("class", "smltown_postDay");
                $("#smltown_statusGame").smltown_text("ending day");
                this.onStatusChange();
            }
            break;
        case 5: //end game
            SMLTOWN.Server.ping = SMLTOWN.Server.slowPing;

            if ($("#smltown_body").attr("class") != "smltown_gameover") { // 1st time 
                console.log("end game")
                var t = SMLTOWN.Message.translate;
                SMLTOWN.Action.wakeUp(t("GameOver"), true);
                SMLTOWN.Action.cleanVotes();
                $("#smltown_statusGame").smltown_text("GameOver");
                $("#smltown_body").attr("class", "smltown_gameover");
            }

            for (var id in SMLTOWN.players) {
                var player = SMLTOWN.players[id];
                if (player.status > -1) {
                    console.log("hi")
                    $("#" + player.id + " .smltown_votes").smltown_text("Win");
                }
            }

            break;
        default: //waiting for new game (0) "new cards"
            SMLTOWN.Server.ping = SMLTOWN.Server.slowPing;
            $(".smltown_gameover").addClass("smltown_selectable");

            if ($("#smltown_body").attr("class") != "smltown_waiting") { // 1st time                    
                $("#smltown_body").attr("class", "smltown_waiting");
                var t = SMLTOWN.Message.translate;
                SMLTOWN.Action.wakeUp(t("gameRestarted"), true);
                SMLTOWN.Action.restartTurn();

                $("#smltown_statusGame").smltown_text("waitingNewGame");
                $(".smltown_playerStatus").smltown_text("waiting");
            }

            if ("1" == SMLTOWN.user.admin && SMLTOWN.user.card) {
                $("#smltown_startButton").show();
            }
    }

    if (SMLTOWN.Message.message) {
        SMLTOWN.Message.setMessage(SMLTOWN.Message.message);
        SMLTOWN.Message.message = null;
    }
};

SMLTOWN.Update.onStatusChange = function () {
    console.log("status change");
    if (SMLTOWN.user.status > -1 && SMLTOWN.user.card == SMLTOWN.Game.info.night) { //special card like hunter
        //SMLTOWN.Action.wakeUp(); //cose not sleep
        var name = SMLTOWN.cards[SMLTOWN.user.card].name;
        var t = SMLTOWN.Message.translate;
        //SMLTOWN.Message.notify(name.toUpperCase() + "... " + t("yourTurn"), true);
        SMLTOWN.Action.wakeUp(name.toUpperCase() + "... " + t("yourTurn"));
    }
//    else if (!$("#smltown_popup").is(":visible")) {
//        //if game reload and not server message shown
//        SMLTOWN.Message.notify("waiting night end decisions", true);
//    }

    SMLTOWN.Action.cleanVotes();
};

SMLTOWN.Action.playerSelect = function (id) {

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

    //DEFINE day/night functions

    if (SMLTOWN.Game.info.status == 3 && null != SMLTOWN.Time.end) { //day. time.end is null when day is over
        if (1 != SMLTOWN.Game.info.openVoting && SMLTOWN.Time.countdownInterval) {
            console.log("time is not ended");
            return;
        }
        this.selectFunction = SMLTOWN.Server.request.selectPlayer;
        this.unselectFunction = SMLTOWN.Server.request.unSelectPlayer;
    } else if (SMLTOWN.Game.info.night && SMLTOWN.Game.info.night == SMLTOWN.user.card) { //night
        this.selectFunction = this.night.select;
        this.unselectFunction = this.night.unselect;
    } else {
        if (SMLTOWN.Game.info.night) {
            //not night name (like preday..)
            SMLTOWN.Message.flash(SMLTOWN.Message.translate("awakening"));
        } else {
            console.log("nothing to select");
        }
        return;
    }

    //PRESELECT
    if (SMLTOWN.Game.status != 1 || !SMLTOWN.Game.openVoting) { // except day free votes
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
    }

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
};

SMLTOWN.Game.playing = function () {
    var status = SMLTOWN.Game.info.status;
    if (status > 0 && status < 5) {
        return true;
    }
    return false;
};

///////////////////////////////////////////////////////////////////////////////
//MESAGES
SMLTOWN.Message.setMessage = function (data) { //permanent messages
    var $this = this;
    var stop = false, callback = true;
    var t = this.translate;
    var time = 0;
    var text;

    var textArray = data.split(":");
    var action = data;
    if (textArray.length > 1) {
        action = textArray.shift();
        if (this[action]) {
            text = this[action](textArray.join(":"));
        } else {
            text = textArray.join(":");
        }
    } else {
        text = t(action);
    }

    // STOP functions
    if ("statusGameChange" == action) {
        SMLTOWN.Game.info.night = SMLTOWN.user.card;
//        stop = true;
        callback = false;
    } else if ("lynch" == action) {
        callback = false;
    }

    clearTimeout(SMLTOWN.Action.wakeUpTimeout); //prevent asyncronic wakeup's after
    $("#smltown_filter").removeClass("smltown_sleep");

    setTimeout(function () {
        $this.notify(text, function () {
            if (SMLTOWN.user.status > -1
                    && SMLTOWN.Game.info.status == 1 //night
                    ) {
                SMLTOWN.Action.sleep();
            }
            if (callback) {
                SMLTOWN.Action.cleanVotes();
                SMLTOWN.Server.request.messageReceived(stop);
            }
        }, false);
    }, time);

    //SMLTOWN.Action.endTurn(); //why?
};

//from setMessage
SMLTOWN.Message.votations = function (json) {
    return killsMessage(json, false)
            + SMLTOWN.Message.translate("GettingDark");
};

//from setMessage
SMLTOWN.Message.kills = function (json) {
    return killsMessage(json, true);
};

function killsMessage(json, night) {
    var t = SMLTOWN.Message.translate;
    var sleepText = "";

    var plays = false;
    try {
        plays = JSON.parse(json);
    } catch (e) {
        console.log("error parsing kills message = " + json);
        return false;
    }
    console.log(json)

    var selections = false;
    sleepText += "<table>"
    for (var i = 0; i < plays.length; i++) {
        var sel = plays[i].sel;
        if (sel) {
            sleepText += "<tr>"
            var id = plays[i].id;
            //console.log(SMLTOWN.players[id].name)
            var nameSel = SMLTOWN.players[sel].name;
            sleepText += "<td class='id" + id + "'>" + SMLTOWN.players[id].name + "</td>"
                    + " <td> ⚔ </td> "
                    + "<td class='id" + sel + "'>" + nameSel + "</td>";
            sleepText += "</tr>";
            selections = true;
        }
    }
    sleepText += "</table>"

    if (selections) {
        sleepText += "<br/>";
    }

    var linched = false;
    for (var i = 0; i < plays.length; i++) {
        if (plays[i].card) {            
            linched = true;
            var play = plays[i];
            var id = play.id;
            
            SMLTOWN.players[id].status = 0;
            
            var name = SMLTOWN.players[id].name;
            var cardName = SMLTOWN.cards[play.card].name;
            sleepText += " <span class='id" + id + "'>" + name + "</span>, "
                    + t("a") + " " + cardName + ", ";

            if (night) {
                sleepText += t("wasKilledTonight");
            } else {
                sleepText += t("wasKilled");
            }
            sleepText += ". ";
        }
    }

    if (!linched) {
        if (night) {
            sleepText += t("NoKillsTonight") + ". ";
        } else {
            sleepText += t("NoKills") + ". ";
        }
    }
    return sleepText;
}
