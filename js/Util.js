
SMLTOWN.Util = {
    getById: function (array, id) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].id == id) {
                return array[i];
            }
        }
        return false;
    }
    ,
    getViewport: function () {
        var e = window, a = 'inner';
        if (!('innerWidth' in window)) {
            a = 'client';
            e = document.documentElement || document.body;
        }
        return {width: e[a + 'Width'], height: e[a + 'Height']};
    }
    ,
    parseTime: function (time) {
        var secs = time % 60;
        return ~~(time / 60) + ":" + (secs < 10 ? "0" : "") + secs;
    }
    ,
    setPersistentCookie: function (key, value) { // 1 year
        console.log(key + " cookie = " + value);
        // Build the expiration date string:
        var expiration_date = new Date();
        expiration_date.setFullYear(expiration_date.getFullYear() + 1);
        // Build the set-cookie string:
        document.cookie = key + "=" + value + "; path=/; expires=" + expiration_date.toGMTString();
    }
    ,
    getCookie: function (name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length > 1) // not == 2; (if duplicate cookie bug) get last.
            return parts.pop().split(";").shift();
    }
    ,
    setLocalStorage: function (key, value) {
        localStorage.setItem(key, value);
    }
    ,
    getLocalStorage: function (key) {
        var item = localStorage.getItem(key);
        if (!item) {
            item = this.getCookie(key);
            if (item) {
                localStorage.setItem(key, item);
            }
        }
        return item;
    }
    ,
    translateHTML: function () {
        var textNodes = $("#smltown_game *:not(script)").contents().filter(function () {
            return(this.nodeType === 3 && $.trim(this.textContent).length > 1);
        });
        for (var i = 0; i < textNodes.length; i++) {
            var node = textNodes[i];
            node.textContent = SMLTOWN.Message.translate(node.textContent);
        }
    }
};

SMLTOWN.Game.back = function () {
    console.log("back");
    if ($("body").attr("id") == "smltown") {
        window.history.back();
    } else {
        SMLTOWN.Load.showPage("gameList");
    }
};

SMLTOWN.Game.askPassword = function (log) {
    if (!log) {
        log = "";
    }
    $("#smltown_body").append("<div class='smltown_dialog'>"
            + "<form id='smltown_passwordForm'>"
            + "<input type='text' id='smltown_password' placeholder='password'>"
            + "<input type='submit' value='Ok'>"
            + "<div id='smltown_cancel' class='smltown_button'>Cancel</div>"
            + "<div class='smltown_log'>" + log + "</div>"
            + "</form>"
            + "<div>");
    $("#smltown_password").focus();
    $("#smltown_passwordForm").submit(function () {
        var password = $("#smltown_password").val();
        SMLTOWN.Server.request.addUserInGame(SMLTOWN.Game.info.id, password);
        $(".smltown_dialog").remove();
        return false;
    });
    $(".smltown_dialog #smltown_cancel").click(function () {
        console.log("cancel password");
        $(".smltown_dialog").remove();
        SMLTOWN.Load.showPage("gameList");
    });
};
