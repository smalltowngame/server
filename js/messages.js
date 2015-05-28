
function login(log) {
    if (typeof log == "object") {
        log = log.log; //server side
    }
    $("#smltown_login").remove(); //clean
    $("body").append("<div class='dialog'><form id='login'>"
            + "<input type='text' class='name' placeholder='set your name'>"
            + "<input type='submit' value='Ok'>"
            + "<input type='button' value='Cancel' class='cancel'>"
            + "<div class='log'></div>"
            + "</form><div>");
    if (log) {
        $("#smltown_login .log").html(log);
    }
    $("#smltown_login .name").focus();

    //LOGIN EVENTS
    $("#smltown_login").submit(function() {
        var name = $(this).find(".name").val();
        if (!name || !/\S/.test(name)) { //not only whitespaces
            $("#smltown_login .log").text("empty name!");
            return false;
        }

        for (var id in Game.players) {
            if (Game.players[id].name == name) {
                $("#smltown_login .log").text("name already exists!");
                return false;
            }
        }

        Game.request.setName(name);

        $(".dialog").remove();
        return false; //prevent submit
    });
    $("#smltown_login .cancel").on("tap", function() {
        Game.request.deletePlayer(Game.user.id, function() {
            gameBack();
        });
    });
}


function setMessage(data) {
    notify(data, function() {
		if(Game.info.status == 2){
        	sleep();
		}
        endTurn();
        Game.request.messageReceived();
    }, false);
}

function notify(text, okCallback, cancelCallback) {
    $("#smltown_logOk").off("tap");
    $("#smltown_logCancel").off("tap");

    if (text == "") {
        $("#smltown_filter").removeClass("notification");
        return;
    }

    text = message(text); //LANG

    $("#smltown_log .text").html(text);
    //show
    $("#filter").addClass("notification");
    $("#logOk").hide();
    $("#logCancel").hide();
    if (okCallback) { //!= false
        $("#smltown_logOk").show();
        $("#smltown_logOk").one("tap", function(e) {
            e.preventDefault(); //prevent player select
            //hide
            $("#smltown_filter").removeClass("notification");
            if (typeof okCallback == "function") {
                clearTimeout(Game.temp.wakeUpInterval);
                okCallback();
            }
        });
    }

    if (cancelCallback) { //!= false
        $("#smltown_logCancel").show();
        $("#smltown_logCancel").one("tap", function(e) {
            e.preventDefault(); //prevent player select
            //hide
            $("#smltown_filter").removeClass("notification");
            if (typeof cancelCallback == "function") {
                cancelCallback();
            }
        });
    }
}

function setLog(text, type) {
    var log = $("#smltown_console .text");
    var div = $("<div>");
    if (Game.isNight) {
        div.addClass("night");
    }
    if (type) {
        div.addClass(type);
    }
    div.html(text);
    log.append(div);
    Game.load.loaded(); //end any loading screen
    //scroll
    //chatUpdate();
}

function showNightLog(text, clean) {
    if (clean) {
        $("#smltown_console .text").html("");
    }
    $("#smltown_console .text").prepend("<div><span class='time'>" + new Date().toLocaleTimeString() + " </span>" + text + "</div>");
}

function flash(text) {
    $("#smltown_flash").remove();
    var div = $("<div id='smltown_flash'><span class='text'>" + text + "</span></div>");
    $("body").append(div);
    setTimeout(function() {
        div.remove();
    }, 1000);
}
