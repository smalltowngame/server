
function onBackPressed() {
}

function externalFunctions() {

    if (typeof Device == "undefined") {
        return;
    }

    $(".device").show();
    Device.savePreference("gameId", Game.id);

    $("#vibrationStrength").submit(function () {
        var input = $(this).find("input");
        input.blur();
        var val = input.val();
        if (!val) {
            val = 1;
        }
        Device.setVibrationStrength(val);
        flash("vibration strength saved");
        return false;
    });

    //update functions    

    //GAME
//    if (typeof Game !== "undefined" && typeof Game.request !== "undefined" && typeof Game.request.setName !== "undefined") {
//        Intercepted.setName = Game.request.setName;
//        Game.request.setName = function (name) {
//            Device.savePreference("userName", name);
//            return Intercepted.setName(name);
//        };
//    }
    intercept("Game.request.setName", function (name) {
        Device.savePreference("userName", name);
    });

    intercept("wakeUp", function (done) {
        clearTimeout(Game.temp.wakeUpInterval); //prevent multple intervals
        if (false != done) {
            Game.temp.wakeUpInterval = setInterval(function () {
                Device.vibrate(); //app regulation
            }, 1500);
        }
    }, true); //intercepted function before

    intercept("update", function (res) {
        if (res.user && res.user.id) {
            Device.savePreference("userId", res.user.userId);
        }
    });

    intercept("notify", function (text) {
        Device.setNotification(text);
    });

    //called functions by Device
    onBackPressed = function () {
        if ($("#console").hasClass("extended")) {
            $("#console").removeClass("extended");
        } else {
            window.history.back();
        }
        return true;
    };

}
