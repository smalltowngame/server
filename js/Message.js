
//MULTILANGIAGE DETECTION
(function ($) {
    $.fn.smltown_text = function (text) {
        this.text(check(text));
    };
    $.fn.smltown_append = function (text) {
        this.append(check(text));
    };
    $.fn.smltown_prepend = function (text) {
        this.prepend(check(text));
    };
    function check(text) {
        if (text && !isNumber(text)) {
            return SMLTOWN.Message.translate(text);
        }
        return text;
    }
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
})(jQuery);

SMLTOWN.Message = {
    login: function (log) {
        if (typeof log == "object") {
            log = log.log; //server side
        }
        $("#smltown_login").remove(); //clean
        $("#smltown_body").append("<div class='smltown_dialog'><form id='smltown_login'>"
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
        $("#smltown_login").submit(function () { //submit 4 device buttons
            var name = $(this).find(".smltown_name").val();
            if (!name || !/\S/.test(name)) { //not only whitespaces
                $("#smltown_login .smltown_log").smltown_text("empty name!");
                return false;
            }

            for (var id in SMLTOWN.players) {
                if (SMLTOWN.players[id].name == name) {
                    $("#smltown_login .smltown_log").smltown_text("duplicatedName");
                    return false;
                }
            }

            SMLTOWN.Server.request.setName(name);

            $(".smltown_dialog").remove();
            return false; //prevent submit
        });
        $("#smltown_login .smltown_cancel").on("tap", function () {
            console.log("login cancel");
            if (typeof SMLTOWN.user != "undefined") {
                SMLTOWN.Server.request.deletePlayer(SMLTOWN.user.id, function () {
                    SMLTOWN.Load.showPage("gameList");
                });
            } else {
                SMLTOWN.Load.showPage("gameList");
            }
            $(".smltown_dialog").remove();
        });
    }
    ,
    setMessage: function (data, dead) { //permanent messages

    }
    ,
    notify: function (text, okCallback, cancelCallback) {
        var $this = this;
        $("#smltown_popupOk").off("tap");
        $("#smltown_popupCancel").off("tap");

        if (text === "") { //===, not false
            console.log("empty text")
            $("#smltown_filter").removeClass("smltown_notification");
            return;
        } else if (false === text) {
            okCallback();
        }

        console.log("text = " + text)

        $("#smltown_popupText").html(text);
        //show
        $("#smltown_filter").addClass("smltown_notification");
        $("#smltown_popupOk, #smltown_popupCancel").hide();
        if (okCallback) { //!= false
            $("#smltown_popupOk").show();
            $("#smltown_popupOk").one("tap", function (e) {
                e.preventDefault(); //prevent player select
                //hide
                $this.removeNotification();
                if (typeof okCallback == "function") {
                    clearTimeout(SMLTOWN.temp.wakeUpInterval);
                    okCallback();
                }
            });
        }

        if (cancelCallback) { //!= false
            $("#smltown_popupCancel").show();
            $("#smltown_popupCancel").one("tap", function (e) {
                e.preventDefault(); //prevent player select
                //hide
                $this.removeNotification();
                if (typeof cancelCallback == "function") {
                    cancelCallback();
                }
            });
        }
    }
    ,
    removeNotification: function () {
        $("#smltown_filter").removeClass("smltown_notification");
    }
    ,
    setLog: function (text, type) {
        var log = $("#smltown_consoleText > div > div");
        var div = $("<div>");
        if (SMLTOWN.isNight) {
            div.addClass("smltown_night");
        }
        if (type) {
            div.addClass(type);
        }
        div.html(text);
        log.append(div);
        SMLTOWN.Server.loaded(); //end any loading screen
        //scroll
        //this.chatUpdate();
    }
//    ,
//    showNightLog: function(text, clean) {
//        if (clean) {
//            $("#smltown_console .text").html("");
//        }
//        $("#smltown_console .text").prepend("<div><span class='time'>" + new Date().toLocaleTimeString() + " </span>" + text + "</div>");
//    }
    ,
    flash: function (text) {
        $("#smltown_flash").remove();
        var div = $("<div id='smltown_flash'><span>" + this.translate(text) + "</span></div>");
        $("body").append(div);
        setTimeout(function () {
            div.remove();
        }, 1500);

        if (text == "adminRole") {
            SMLTOWN.Load.reloadGame();
        }
    }
    ,
    addChats: function () {
        var chatName = "chat" + SMLTOWN.Game.info.id;
        var chats = localStorage.getItem(chatName);
        if (!chats) {
            return;
        }

        var arrayChats = chats.split("·");
        var values;
        for (var i = 0; i < arrayChats.length; i++) {
            values = arrayChats[i].split("~");
            this.writeChat(values[0], values[1]);
        }
        this.chatUpdate();
        SMLTOWN.Add.userNamesByClass();
    }
    ,
    addChat: function (text, userId) { //from server
        if (typeof userId == "undefined") {
            userId = SMLTOWN.user.id;
        }

        var chatName = "chat" + SMLTOWN.Game.info.id;
        var chat = localStorage.getItem(chatName);
        if (!chat) {
            chat = "";
        }
        localStorage.setItem(chatName, chat + "·" + text + "~" + userId);

        this.writeChat(text, userId);
    }
    ,
    writeChat: function (text, userId) {
        var name = "";
        if (typeof SMLTOWN.players[userId] != "undefined") { //if player no longer exists
            name = SMLTOWN.players[userId].name + ": ";
        }
        $("#smltown_consoleText > div > div").append("<div><span class='id" + userId + "'>" + name + "</span>" + text + "</div>");
    }
    ,
    chatUpdate: function () {
        SMLTOWN.Transform.contentHeights.updateConsole();
        //if scroll
        $("#smltown_console").animate({
            scrollTop: $("#smltown_consoleText > div > div").height() + 50
        }, 500);
    }
    ,
    clearChat: function () {
        localStorage.removeItem("chat" + SMLTOWN.Game.info.id);
//        localStorage.clear();
    }
    ,
    translate: function (some, attr) {
        if (!lang[some]) {
//            if (attr) {
//                return attr + " " + some;
//            }
            console.log("not translation: " + some);
            return some;
        }
        return lang[some];
    }
};
