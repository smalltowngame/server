
function login(log) {
    if (typeof log == "object") {
        log = log.log; //server side
    }
    $("#smltown_login").remove(); //clean
    $("#smltown_html").append("<div class='smltown_dialog'><form id='smltown_login'>"
            + "<input type='text' class='smltown_name' placeholder='set your name'>"
            + "<input type='submit' value='Ok'>"
            + "<div class='smltown_button smltown_cancel'>Cancel</div>"
            + "<div class='smltown_log'></div>"
            + "</form><div>");
    if (log) {
        $("#smltown_login .smltown_log").html(log);
    }
    $("#smltown_login .smltown_name").focus();

    //LOGIN EVENTS
    $("#smltown_login").submit(function() { //submit 4 device buttons
        var name = $(this).find(".smltown_name").val();
        if (!name || !/\S/.test(name)) { //not only whitespaces
            $("#smltown_login .smltown_log").text("empty name!");
            return false;
        }

        for (var id in Game.players) {
            if (Game.players[id].name == name) {
                $("#smltown_login .smltown_log").text("name already exists!");
                return false;
            }
        }

        Game.request.setName(name);

        $(".smltown_dialog").remove();
        return false; //prevent submit
    });
    $("#smltown_login .smltown_cancel").on("tap", function() {
        console.log(123)
        if (typeof Game.user != "undefined") {
            Game.request.deletePlayer(Game.user.id, function() {
                gameBack();
            });
        } else {
            gameBack();
        }
        $(".smltown_dialog").remove();
    });
}


function setMessage(data) {
    notify(data, function() {
        if (Game.info.status == 2) {
            sleep();
        }
        endTurn();
        Game.request.messageReceived();
    }, false);
}

function notify(text, okCallback, cancelCallback) {
    $("#smltown_popupOk").off("tap");
    $("#smltown_popupCancel").off("tap");

    if (text == "") {
        $("#smltown_filter").removeClass("notification");
        return;
    }

    text = message(text); //LANG

    $("#smltown_popup .text").html(text);
    //show
    $("#filter").addClass("notification");
    $("#popupOk").hide();
    $("#popupCancel").hide();
    if (okCallback) { //!= false
        $("#smltown_popupOk").show();
        $("#smltown_popupOk").one("tap", function(e) {
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
        $("#smltown_popupCancel").show();
        $("#smltown_popupCancel").one("tap", function(e) {
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
