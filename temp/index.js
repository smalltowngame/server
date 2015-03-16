
var game = Device.getPreference("gameRedirection");
if (game) {
    $("#log").text("loading game id = " + game);
    $("#content").hide();
    accessGame(game);
}
$("#changeServer").click(function () {
    Device.savePreference("serverRedirection", "0");
    Device.loadUrl("file:///android_asset/index.html");
});

//update functions

intercept("accessGame", function (id) {
    Device.savePreference("gameRedirection", id);
});

intercept("indexLoad", function (args) {
    var url = window.location.href;
    var message = url.split("#")[1];
    if (message) {
        Device.savePreference("gameRedirection", "");
    }
});

$("#footer").append("<a id='changeServer'>Change server</a>");
