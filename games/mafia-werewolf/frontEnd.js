
//SMLTOWN.mafia_werewolf = {};

SMLTOWN.Update.gameStatus = function() {
    console.log("update game");
    //INPUTS
    SMLTOWN.Time.clearCountdowns();

    //hide        
    $("#smltown_game").attr("class", "");
    $(".smltown_gameover").removeClass("smltown_selectable");
    $("#smltown_sun").hide();
    $("#smltown_startButton").hide();
    $("#smltown_endTurnButton").hide();
    $("#smltown_cardConsole").hide();

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

            if (SMLTOWN.Game.info.night && SMLTOWN.user.status > -1 && SMLTOWN.user.card == SMLTOWN.Game.info.night) {
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
                $("*").unbind(".smltown_rules");
            }

            for (var id in SMLTOWN.players) {
                var player = SMLTOWN.players[id];
                if (player.status > -1) {
                    console.log("hi")
                    $("#" + player.id + " .smltown_votes").smltown_text("Win");
                }
            }

            if (SMLTOWN.Action.night.endGame) {
                SMLTOWN.Action.night.endGame();
            }

            break;
        default: //waiting for new game (0) "new cards"
            SMLTOWN.Server.ping = SMLTOWN.Server.slowPing;
            $(".smltown_gameover").addClass("smltown_selectable");

            if ($("#smltown_body").attr("class") != "smltown_waiting") { // 1st time  

                if ($("#smltown_body").attr("class")) { //only if not on enter game
                    var t = SMLTOWN.Message.translate;
                    SMLTOWN.Action.wakeUp(t("gameRestarted"), true);
                }

                $("#smltown_body").attr("class", "smltown_waiting");
                $("#smltown_statusGame").smltown_text("waitingNewGame");
                $(".smltown_playerStatus").smltown_text("waiting");
                SMLTOWN.Action.restartTurn();
                $("*").unbind(".smltown_rules");
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

//mafia-werewolf only function
SMLTOWN.Update.onStatusChange = function() {
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

SMLTOWN.Action.defineSelectFunctions = function() {
    if (SMLTOWN.Game.info.status == 3 && null != SMLTOWN.Time.end) { //day. time.end is null when day is over
        if (1 != SMLTOWN.Game.info.openVoting && SMLTOWN.Time.countdownInterval) {
            console.log("time is not ended");
            return false;
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
        return false;
    }
}

SMLTOWN.Game.playing = function() {
    var status = SMLTOWN.Game.info.status;
    if (status > 0 && status < 5) {
        return true;
    }
    return false;
};

///////////////////////////////////////////////////////////////////////////////
//MESAGES
//Override
SMLTOWN.Message.showMessage = function(text, action) {
    var $this = this;
    var time = 0;
    var stop = false;
    var doCallback = true;

    // STOP functions
    if ("statusGameChange" == action) {
        SMLTOWN.Game.info.night = SMLTOWN.user.card;
        doCallback = false;
    } else if ("lynch" == action) {
        doCallback = false;
    }

    setTimeout(function() {
        $this.notify(text, function() {
            if (SMLTOWN.user.status > -1
                    && SMLTOWN.Game.info.status == 1 //night
                    ) {
                SMLTOWN.Action.sleep();
            }
            if (doCallback) {
                SMLTOWN.Action.cleanVotes();
                SMLTOWN.Server.request.messageReceived(stop);
            }
        }, false);
    }, time);
}

//FROM SET-MESSAGE (custom message functions)
SMLTOWN.Message.votations = function(json) {
    return killsMessage(json, false) + SMLTOWN.Message.translate("GettingDark");
};

SMLTOWN.Message.kills = function(json) {
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
                    + cardName + ", ";

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
