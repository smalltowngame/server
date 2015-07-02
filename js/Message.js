
//MULTILANGIAGE DETECTION
(function($) {
    $.fn.smltown_text = function(text) {
        this.text(check(text));
    };
    $.fn.smltown_append = function(text) {
        this.text(this.text() + check(text));
    };
    $.fn.smltown_prepend = function(text) {
        this.text(check(text) + this.text());
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
    login: function(log) {
        if (typeof log == "object") {
            log = log.log; //server side
        }
        $("#smltown_login").remove(); //clean
        $("#smltown_game").append("<div class='smltown_dialog'><form id='smltown_login'>"
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
                $("#smltown_login .smltown_log").smltown_text("empty name!");
                return false;
            }

            for (var id in SMLTOWN.players) {
                if (SMLTOWN.players[id].name == name) {
                    $("#smltown_login .smltown_log").smltown_text("name already exists!");
                    return false;
                }
            }

            SMLTOWN.Server.request.setName(name);

            $(".smltown_dialog").remove();
            return false; //prevent submit
        });
        $("#smltown_login .smltown_cancel").on("tap", function() {
            if (typeof SMLTOWN.user != "undefined") {
                SMLTOWN.Server.request.deletePlayer(SMLTOWN.user.id, function() {
                    SMLTOWN.Load.showPage("gameList");
                });
            } else {
                SMLTOWN.Load.showPage("gameList");
            }
            $(".smltown_dialog").remove();
        });
    }
    ,
    setMessage: function(data) {

        var message = data.split(":");
        var action, text = "";
        if (message.length > 1) {
            action = message[0];
        } else {
            console.log("ERROR: UPDATE MESSAGE CALL");
            text = data;
        }

        if ("votations" == action) {
            text = this.messageVotations(message[1]);
        }

        clearTimeout(SMLTOWN.Action.wakeUpTimeout); //prevent asyncronic wakeup's after
        $("#smltown_filter").removeClass("smltown_sleep");

        this.notify(text, function() {
            if (SMLTOWN.Game.info.status == 2) {
                SMLTOWN.Action.sleep();
            }
            SMLTOWN.Action.endTurn();
            SMLTOWN.Server.request.messageReceived();
        }, false);
    }
    ,
    messageVotations: function(deadId) {
        console.log(deadId)
        var sleepText = $("<span>");

        if (deadId) {
            for (var id in SMLTOWN.players) {
                sleepText += SMLTOWN.players[id].name + " -> " + SMLTOWN.players[id].sel + "\n";
            }

            var card = SMLTOWN.players[deadId].card;
            var name = SMLTOWN.players[deadId].name;
            var arrayName = card.split("_");
            var cardName = arrayName[arrayName.length - 1];
            sleepText = name + ", " + this.translate("a") + " " + cardName + ", " 
                    + this.translate("wasKilled") + ". " + sleepText;

        } else {
            sleepText = this.translate("NoKills");
        }
        return sleepText += ". " + this.translate("GettingDark") + "!";
    }
    ,
    notify: function(text, okCallback, cancelCallback) {
        console.log(text);
        var $this = this;
        $("#smltown_popupOk").off("tap");
        $("#smltown_popupCancel").off("tap");

        if (text == "") {
            $("#smltown_filter").removeClass("smltown_notification");
            return;
        }

        //text = this.translate(text); //LANG

        $("#smltown_popupText").html(text);
        //show
        $("#smltown_filter").addClass("smltown_notification");
        $("#smltown_popupOk, #smltown_popupCancel").hide();
        if (okCallback) { //!= false
            $("#smltown_popupOk").show();
            $("#smltown_popupOk").one("tap", function(e) {
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
            $("#smltown_popupCancel").one("tap", function(e) {
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
    removeNotification: function() {
        $("#smltown_filter").removeClass("smltown_notification");
    }
    ,
    setLog: function(text, type) {
        var log = $("#smltown_consoleText > div > div");
        var div = $("<div>");
        if (SMLTOWN.isNight) {
            div.addClass("night");
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
    flash: function(text) {
        $("#smltown_flash").remove();
        var div = $("<div id='smltown_flash'><span>" + this.translate(text) + "</span></div>");
        $("body").append(div);
        setTimeout(function() {
            div.remove();
        }, 1500);
    }
    ,
    addChats: function() { //from coockie	
//        var chats = this.getCookie("chat" + SMLTOWN.Game.id);
        var chatName = "chat" + SMLTOWN.Game.id;
        var chats = localStorage.getItem(chatName);
        if (!chats) {
            return;
        }

        var arrayChats = chats.split("·");
        var values;
        for (var i = 0; i < arrayChats.length; i++) {
            values = arrayChats[i].split("~");
            if (values[0]) {
                this.writeChat(values[1], values[0]);
            }
        }
        this.chatUpdate();
        SMLTOWN.Add.userNamesByClass();
    }
    ,
    clearChat: function() { //coockie
        document.cookie = "chat" + SMLTOWN.Game.id + "=;domain=." + document.domain + ";path=/;";
    }
    ,
    addChat: function(text, userId) { //from server
        if (typeof userId == "undefined") {
            userId = SMLTOWN.user.id;
        }

        var chatName = "chat" + SMLTOWN.Game.id;
        localStorage.setItem(chatName, localStorage.getItem(chatName) + "·" + userId + "~" + text);

        this.writeChat(text, userId);
    }
    ,
    writeChat: function(text, userId) {
        var name = "";
        if (typeof SMLTOWN.players[userId] != "undefined") { //if player no longer exists
            name = SMLTOWN.players[userId].name + ": ";
        }
        $("#smltown_consoleText > div > div").append("<div><span class='id" + userId + "'>" + name + "</span>" + text + "</div>");
    }
    ,
    chatUpdate: function() {
        SMLTOWN.Transform.contentHeights.updateConsole();
        //if scroll
        $("#smltown_console").animate({
            scrollTop: $("#smltown_consoleText > div > div").height() + 50
        }, 500);
    }
    ,
    translate: function(some, attr) {
        if (typeof some == "function") {
            if (!lang[some]) {
                var funcName = some.toString();
                funcName = funcName.substr('function '.length);
                funcName = funcName.substr(0, ret.indexOf('('));
                if (attr) {
                    funcName = attr + " " + funcName;
                }
                return funcName;
            }
            return lang[some];
        }

        if (!lang[some]) {
            if (attr) {
                return attr + " " + some;
            }
            console.log("not translation: " + some);
            return some;
        }
        return lang[some];
    }
};
