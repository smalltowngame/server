
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

        this.inputDialog("set your name", function (name) { //ok callback
            for (var id in SMLTOWN.players) {
                if (SMLTOWN.players[id].name == name) {
                    $("#smltown_login .smltown_log").smltown_text("duplicatedUserName");
                    SMLTOWN.Message.flash("_duplicatedUserName");
                    return false;
                }
            }
            SMLTOWN.Server.request.setName(name);

        }, function () {  //cancel callback
            SMLTOWN.Server.request.deletePlayer(SMLTOWN.user.id);
            SMLTOWN.Load.showPage("gameList");

        }, log);
    }
    ,
    inputDialog: function (placeholder, okCallback, cancelCallback, log) {
        if (typeof log == "object") {
            log = log.log; //server side
        }

        $("#smltown_dialog").remove(); //clean
        $("#smltown").append("<div id='smltown_dialog'><form id='smltown_dialogForm'>"
                + "<input type='text' class='smltown_dialogInput' placeholder='" + placeholder + "'>"
                + "<input type='submit' value='Ok'>"
                + "<div class='smltown_button smltown_cancel'>Cancel</div>"
                + "<div class='smltown_log'></div>"
                + "</form><div>");

        if (log) {
            $("#smltown_dialog .smltown_log").html(log);
        }

        $("#smltown_dialogForm .smltown_dialogInput").focus();

        //EVENTS
        $("#smltown_dialogForm").submit(function () { //submit 4 device buttons
            var value = $(this).find(".smltown_dialogInput").val();
            if (!value || !/\S/.test(value)) { //not only whitespaces
                $("#smltown_dialog .smltown_log").smltown_text("cannotEmpty");
                return false;
            }
            var done = okCallback(value);
            if (false != done) {
                $("#smltown_dialog").remove();
                return false; //prevent submit
            }
        });
        $("#smltown_dialogForm .smltown_cancel").on("tap", function () {
            if (cancelCallback) {
                cancelCallback();
            }
            $("#smltown_dialog").remove();
        });
    }
    ,
    bottomDialog: function (placeholder, okCallback, log) {
        $("#smltown_bottomDialog").remove(); /*clean*/
        $("#smltown_html").parent().append("<div id='smltown_bottomDialog'><form class='smltown_dialogForm'>"
                + "<table><tr>"
                + "<td><input type='text' class='smltown_dialogInput' placeholder='" + placeholder + "'>"
                + "<td><input type='submit' class='smltown_dialogSubmit' value='Ok'></td>"
                + "</tr></table>"
                + "</form>"
                + "<div class='smltown_log'></div>"
                + "<div>");

        setTimeout(function () {
            $("#smltown_bottomDialog").addClass("display");
        }, 1);
        setTimeout(function () {
            $("#smltown_bottomDialog .smltown_dialogInput").focus();
        }, 1000);

        if (log) {
            $("#smltown_bottomDialog .smltown_log").html(log);
        }

        /*EVENTS*/
        $("#smltown_bottomDialog form").submit(function () {
            if ($("#smltown_bottomDialog .smltown_dialogSend").length) {
                var val = $(this).find(".smltown_dialogInput").val().replace(/ /g, '');
                okCallback(val);
            } else {
                okCallback(false);
            }
            $("#smltown_bottomDialog").remove();
            return false; /*prevent submit*/
        });
    }
    ,
    setMessage: function (data) { //PERMANENT MESSAGES FROM engine DB
        var t = this.translate;
        var text, card;

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
            //like votations and kills?
            var res = t(action);
            if (typeof res == "string") {
                text = res;
            } else {
                text = res[0];
                card = res[1];
                text += card;
            }
        }

        clearTimeout(SMLTOWN.Action.wakeUpTimeout); //prevent asyncronic wakeup's after
        $("#smltown_filter").removeClass("smltown_sleep");
//        $("#smltown_filter").addClass("smltown_message");

        this.showMessage(text, action);
        SMLTOWN.user.message = null;
    }
    ,
    showMessage: function (text, action) { //overrided
//        var $this = this;
//        var time = 0;
//        var stop = false;
//
//        clearTimeout(SMLTOWN.Action.wakeUpTimeout); //prevent asyncronic wakeup's after
//        $("#smltown_filter").removeClass("smltown_sleep");
//
//        setTimeout(function () {
//            $this.notify(text, function () {
//                if (SMLTOWN.user.status > -1 && SMLTOWN.Game.info.status == 1) {
//                    SMLTOWN.Action.sleep();
//                }
//                SMLTOWN.Action.cleanVotes();
//                SMLTOWN.Server.request.messageReceived(stop);
//            }, false);
//        }, time);
    }
    ,
    notify: function (text, okCallback, cancelCallback, gameId, important) { //important from engine game

        //prevent override important messages!
        if (!important && $("#smltown_notification").hasClass("important")) {
            console.log('$("#smltown_notification").hasClass("important")');
            return;
        }
        if (important) {
            $("#smltown_notification").addClass("important");
        }

        //console.log("notify");
        if (gameId && SMLTOWN.Game.info.id != gameId) {
            this.external(text, gameId);
            return;
        }

        var $this = this;

        if (text === "") { //===, not false
            this.removeNotification();
            console.log("empty text");
            return;
        }

        if (false === text) {
            okCallback();
        }

        if ("_" == text[0]) {
            text = this.translate(text.substr(1));
        }

        if ($("#smltown_notification").length) {
            $("#smltown_notification").show();
        } else {
            var notification = this.notificationHTML(text, okCallback, cancelCallback);
            //smltown_html resets on change page
            $("#smltown_html").append(notification);
        }

        //remove lost popup events
        $("#smltown_popup > div").off(".popup");
        if (false !== okCallback) { //!= false
            $("#smltown_popupOk").one("tap.popup", function (e) {
                e.preventDefault(); //prevent player select
                //hide
                $this.removeNotification(true);
                if ("function" == typeof okCallback) { //COULD BE 'true'
                    clearTimeout(SMLTOWN.temp.wakeUpInterval);
                    okCallback();
                }
            });
        }

        if (cancelCallback) { //!= false
            $("#smltown_popupCancel").one("tap.popup", function (e) {
                e.preventDefault(); //prevent player select
                //hide
                $this.removeNotification(true);
                if (typeof cancelCallback == "function") {
                    cancelCallback();
                }
            });
        }
    }
    ,
    notificationHTML: function (text, ok, cancel) {
        var div = $("<div id='smltown_notification'>"
                + "<div id='smltown_popup'>"
                + "<div id='smltown_popupText'>" + text + "</div>"
                + "<div id='smltown_popupOk' class='smltown_button'>OK</div>"
                + "<div id='smltown_popupCancel' class='smltown_close'></div>"
                + "</div>"
                + "</div>");
        if(false === ok){
            div.find("#smltown_popupOk").hide();
        }
        if(!cancel){
            div.find("#smltown_popupCancel").hide();
        }
        return div;
    }
    ,
    removeNotification: function () {
        $("#smltown_notification").remove();
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
    flash: function (text, gameId) {
        if (!text) {
            //smltown_debug(text + " flash text");
            return;
        }

        if (gameId && SMLTOWN.Game.info.id != gameId) {
            this.external(text, gameId);
            return;
        }

        if ("_" == text[0]) {
            text = this.translate(text.substr(1));
        }

        $("#smltown_flash").remove();
        var div = $("<div id='smltown_flash'><div>" + text + "</div></div>");
        $("#smltown_html").parent().append(div);
        setTimeout(function () {
            div.remove();
        }, 500 + text.length * 50);

        if (text == "adminRole") {
            SMLTOWN.Load.reloadGame();
        }
    }
    ,
    addChats: function () {
        var chatName, chats, arrayChats, values, i;

        //day
        chatName = "chat" + SMLTOWN.Game.info.id;
        chats = localStorage.getItem(chatName);
        if (chats) {
            arrayChats = chats.split("·");
            values;
            for (i = 0; i < arrayChats.length; i++) {
                values = arrayChats[i].split("~");
                this.writeChat(values[0], values[1]);
            }
        }

        //night
        chatName = "nightChat" + SMLTOWN.Game.info.id;
        chats = localStorage.getItem(chatName);
        if (chats) {
            arrayChats = chats.split("·");
            values;
            for (i = 0; i < arrayChats.length; i++) {
                values = arrayChats[i].split("~");
                this.writeChat(values[0], values[1], true);
            }
        }

//        if (!chats) {
//            return;
//        }

        SMLTOWN.Transform.chatUpdate();
        SMLTOWN.Add.userNamesByClass();
    }
    ,
    addChat: function (text, playId, gameId, name) { //from server
        if (typeof playId == "undefined") {
            playId = null;
        }

        if (gameId && SMLTOWN.Game.info.id != gameId) {
            this.external(text, gameId, name);
            return;
        }

        //if night chat
        var chatName;
        var night = SMLTOWN.Game.info.night;
        if (SMLTOWN.players[playId] && SMLTOWN.Game.info.night &&
                (night == SMLTOWN.players[playId].card || (night == SMLTOWN.user.card && SMLTOWN.user.id == playId))) {
            this.writeChat(text, playId, true);
            chatName = "nightChat" + SMLTOWN.Game.info.id;
        } else {
            this.writeChat(text, playId);
            chatName = "chat" + SMLTOWN.Game.info.id;
        }

        var chat = localStorage.getItem(chatName);
        if (!chat) {
            chat = "";
        }
        localStorage.setItem(chatName, chat + "·" + text + "~" + playId);
    }
    ,
    writeChat: function (text, playId, night) {
        var name = "";
        if (typeof SMLTOWN.players[playId] != "undefined") { //if player no longer exists
            name = SMLTOWN.players[playId].name + ": ";
        }

        var regex = /(?:\:)\b(\w*)\b(\:)/g;
        text = text.replace(regex, function myFunction(key) {
            for (var i = 0; i < $.emojiarea.icons.length; i++) {
                var group = $.emojiarea.icons[i];
                if (group.icons[key]) {
                    return window.emoji.EmojiArea.createIcon(i, key);
                    break;
                }
            }
            return "";
        });

        var chat = $("<div><span class='id" + playId + "'>" + name + "</span>" + text + "</div>");

        if ("undefined" != typeof SMLTOWN.players[playId]) {
            console.log(playId + " , " + SMLTOWN.players[playId].card)
        }

        if (night) {
            $("#smltown_consoleLog > .smltown_night").append(chat);
        } else {
            $("#smltown_consoleLog > div:not(.smltown_night)").append(chat);
            //todo: remove for simplification - add chat on info user
            //$("#" + playId + " .smltown_down").html('- "' + text + '"');
        }
    }
    ,
    clearChat: function () {
        localStorage.removeItem("chat" + SMLTOWN.Game.info.id);
//        localStorage.clear();
    }
    ,
    translate: function (text) {

        var wordArray = text.split(" ");

        var res = "";
        for (var i = 0; i < wordArray.length; i++) {
            var some = wordArray[i];

            //check first "_" on multiple words case
            if (wordArray.length > 1 && some.indexOf("_") !== 0) {
                res += some + " ";
                continue;
            }

            //remove first "_"
            if (some[0] === "_") {
                some = some.substring(1);
            }

            if (!lang) {
                console.log("lang file not found!");
                res += some + " ";
                continue;
            }

            //send error and add string
            if (!lang[some]) {
                console.log("not translation: " + some);
                smltown_stack();

                if (null !== lang[some]) {
                    var kindFile = null;
                    var someArray = some.split("_");
                    if (someArray.length > 1) {
                        kindFile = someArray.shift();
                    }
                    SMLTOWN.Server.request.checkTranslation(SMLTOWN.lang, kindFile, some);
                }

                res += some + " ";
                continue;
            }

            res += lang[some] + " ";
        }

        return res;
    }
    ,
    external: function (text, gameId, name) {

        text = "<small>" + name + ": </small> " + this.translate(text);

        $("#smltown_external").remove();
        var div = $("<div id='smltown_external'>" + text + "</div>");
        div.on("tap", function () {
            window.location.hash = "game?" + gameId;
        });
        $("#smltown_html").parent().append(div);

        setTimeout(function () {
            $("#smltown_external").addClass("smltown_visible");
        }, 100);

        setTimeout(function () {
            $("#smltown_external").removeClass("smltown_visible");
        }, 4000);
    }
};
