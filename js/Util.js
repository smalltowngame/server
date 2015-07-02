
SMLTOWN.Util = {
    getById: function(array, id) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].id == id) {
                return array[i];
            }
        }
        return false;
    }
    ,
    getViewport: function() {
        var e = window, a = 'inner';
        if (!('innerWidth' in window)) {
            a = 'client';
            e = document.documentElement || document.body;
        }
        return {width: e[a + 'Width'], height: e[a + 'Height']};
    }
    ,
    parseTime: function(time) {
        var secs = time % 60;
        return ~~(time / 60) + ":" + (secs < 10 ? "0" : "") + secs;
    }
};

SMLTOWN.Game.playing = function() {
    var status = SMLTOWN.Game.info.status;
    if (status == 1 || status == 2) {
        return true;
    }
    return false;
};

SMLTOWN.Game.back = function() {
    if ($("body").attr("id") == "smltown") {
        window.history.back();
    } else {
        SMLTOWN.Load.showPage("gameList");
    }
};

SMLTOWN.Game.askPassword = function(log) {
    if(!log){
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
    $("#smltown_passwordForm").submit(function() {
        var password = $("#smltown_password").val();
        SMLTOWN.Server.request.addUserInGame(password);
        $(".smltown_dialog").remove();
        return false;
    });
    $(".smltown_dialog #smltown_cancel").click(function() {
        $(".smltown_dialog").remove();
        SMLTOWN.Load.showPage("gameList");
    });
};
