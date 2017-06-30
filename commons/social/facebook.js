
// Load the SDK asynchronously
(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id))
        return;
    js = d.createElement(s);
    js.id = id;
    js.async = true;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

//auto-init
window.fbAsyncInit = function () {
    console.log("facebook async");
    FB.init({
        appId: '1572792739668689',
//        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true, // parse social plugins on this page
        version: 'v2.4'
    });

    SMLTOWN.Social.facebook.checkLoginState();
};

SMLTOWN.Social.facebook = {
    // Login button action
    checkLoginState: function () {
        var $this = this;
        FB.getLoginStatus(function (response) {
            $this.statusChangeCallback(response);
        });
    }
    ,
    // This is called with the results from from FB.getLoginStatus().
    statusChangeCallback: function (response) {
        var $this = this;
        console.log('statusChangeCallback');
        $("#smltown_facebookButton").remove();

        SMLTOWN.facebook = false;
        if (response.status === 'connected') {
            SMLTOWN.facebook = true;
            console.log("connected in facebook");
            this.onConnect();
        } else if (response.status === 'not_authorized') {
            console.log('not_authorized in facebook');
            $("#smltown_footer").append("<div id='smltown_facebookButton'><div>login via facebook</div></div>");

            $("#smltown_facebookButton div").on("tap", function () {
                $this.login();
            });

        } else {
            console.log("not in facebook");
        }
        this.reload();
    }
    ,
    login: function (callback) {
        var $this = this;
        FB.login(function (response) {
            console.log(response);
            $this.statusChangeCallback(response);
            if (callback) {
                callback();
            }
        }, {scope: 'user_friends'});
    }
    ,
    // Here we run a very simple test of the Graph API after login is successful.
    onConnect: function () {
        var $this = this;

        //friends
        $("#smltown_html").addClass("smltown_facebook");

        SMLTOWN.Social.winFeed = function () {
            $this.winFeed();
        };

        FB.api('/me?fields=name,third_party_id', function (user) {
            console.log('Successful login for: ' + user.name);

            SMLTOWN.Util.setPersistentCookie("smltown_userId", user["third_party_id"]);
            localStorage.setItem("smltown_userName", user.name);

            SMLTOWN.user.name = user.name;
            SMLTOWN.Server.request.addFacebookUser(user.id);
            //TODO remove credentials when not logued ?
        });
    }
    ,
    getRequestData: function (response) {
        var requestUrl = window.location.href.split("request_ids=");
        if (requestUrl.length < 2) {
            return;
        }
        var requestIds = requestUrl[1].split("&")[0].replace(/%2C/g, ",");
        var arrayId = requestIds.split(",");
        for (var j = 0; j < arrayId.length; j++) {
            var requestId = arrayId[j];
            for (var i = 0; i < response.data.length; i++) {
                var request = response.data[i].id.split("_")[0];
                if (requestId == request) {
                    return response.data[i];
                }
            }
        }
    }
    ,
    reload: function () {
        try {
            FB.XFBML.parse();
        } catch (ex) {
        }
    }
    ,
    //Overrided
    showFriends: function () {
        var $this = this;
        FB.ui({
            method: "apprequests",
            title: "Werewolf invitation",
            message: "Let's play a game",
            data: SMLTOWN.Game.info.id
        }, function (response) {
            if (!response) {
                return;
            }
            var error = response.error_message;
            if (!error) {
                return;
            }

            console.log("facebook apprequests error: " + error);
            if (-1 == error.indexOf("User+canceled")) {
                var clearedError = error.split(":").pop().split("+").join(" ");
                smltown_error("facebook error:" + clearedError);
            }

            //revert
            $(".fb_hidden").removeClass("fb_hidden");
            if (-1 < error.indexOf("user+logged+out")) {
                $this.login();
            }
        });
    }
    ,
    //Overrided
    winFeed: function () {
        var $this = this;

        if ("feeded" == SMLTOWN.user.social) {
            console.log("game was already feeded");
            return;
        }

        var cardUrl = SMLTOWN.Add.getCardUrl(SMLTOWN.user.card);
        if (!cardUrl) {
            return;
        }
        var url = document.location.origin + document.location.pathname + cardUrl;

        var winnerText = SMLTOWN.Message.translate("winner");
        var shareText = SMLTOWN.Message.translate("Share");

        $("#smltown_filter").addClass("smltown_hide");
        $("#smltown_win").remove();
        $("#smltown_game").append(winHTML(url, winnerText, shareText));

        $("#smltown_win .smltown_footer > div").on("tap", function () {
            $("#smltown_win").remove();
            $("#smltown_filter").removeClass("smltown_hide");
        });
        $("#smltown_win .smltown_footer .smltown_feed").on("tap", function () {
            $this.feedGameWin(url);
        });
    }
    ,
    winHTML: function (url, winnerText, shareText) {        
        var html = "<div id='smltown_win'><div>"
                + "<div class='smltown_image' style='background-image:url(" + url + ")'></div>"
                + "<div class='smltown_text'>" + winnerText + "</div>"
                + "<div class='smltown_footer'>"
                + "<div class='smltown_feed'>" + shareText + "</div>"
                + "<div>Ok</div>"
                + "</div>"
                + "</div></div>";
        return html;
    }
    ,
    feedGameWin: function (url) {
        console.log("win feed: ");
        var cardName = SMLTOWN.user.card.split("_").pop();

        FB.ui({
            method: 'feed',
            name: SMLTOWN.user.name + " won the Werewolf game!",
            link: 'https://apps.facebook.com/smltown/',
            picture: url,
            caption: 'Small Town',
            description: SMLTOWN.user.name + " wins the game as a " + cardName + "."

        }, function (response) {  // callback
            SMLTOWN.user.social = "feeded";
            SMLTOWN.Server.request.setSocialStatus("feeded");
            console.log(response);
        });
    }
    ,
    events: function () {
        $("#smltown_facebookButton").on("tap", function () {
            if ($(this).is(":hover")) {
                SMLTOWN.Social.facebook.checkLoginState();
            }
        });
    }
};