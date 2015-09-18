
// Load the SDK asynchronously
(function(d, s, id) {
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
window.fbAsyncInit = function() {
    console.log("facebook async");
    FB.init({
        appId: '1572792739668689',
//        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true, // parse social plugins on this page
        version: 'v2.4'
    });

    FB.getLoginStatus(function(response) {
        SMLTOWN.Social.facebook.statusChangeCallback(response);
    });
};

SMLTOWN.Social.facebook = {
    // Login button action
    checkLoginState: function() {
        var $this = this;
        FB.getLoginStatus(function(response) {
            $this.statusChangeCallback(response);
        });
    }
    ,
    // This is called with the results from from FB.getLoginStatus().
    statusChangeCallback: function(response) {
        var $this = this;
        console.log('statusChangeCallback');
        $("#smltown_facebookButton").remove();
        
        if (response.status === 'connected') {
            console.log("connected in facebook");
            this.onConnect();
        } else if (response.status === 'not_authorized') {
            console.log('not_authorized in facebook');
//            $("#smltown_footer").append(
//                    "<fb:login-button scope='public_profile,user_friends' onlogin='SMLTOWN.Social.facebook.checkLoginState();'></fb:login-button>");
            $("#smltown_footer").append("<div id='smltown_facebookButton'><div>login via facebook</div></div>");

            $("#smltown_facebookButton div").click(function() {
                FB.login(function(response) {
                    console.log(response);
                    $this.statusChangeCallback(response);
                }, {scope: 'email,user_friends'});
            });

        } else {
            console.log("not in facebook");
        }
        this.reload();
    }
    ,
    // Here we run a very simple test of the Graph API after login is successful.
    onConnect: function() {
        var $this = this;
        // Your like button code //not .show() because !important
        $(".fb-like").addClass("smltown_show");

        //friends
        $("#smltown_html").addClass("smltown_facebook");
        SMLTOWN.Social.invite = function() {

            FB.ui({
                method: "apprequests",
                title: "Werewolf invitation",
                message: "Let's play a game",
                data: SMLTOWN.Game.info.id
            });
        };
        SMLTOWN.Social.winFeed = function() {
            if ("feeded" == SMLTOWN.user.social) {
                console.log("game was already feeded");
                return;
            }

            var url = document.location.href + SMLTOWN.Add.getCardUrl(SMLTOWN.user.card);
            console.log(url)
            var winnerText = SMLTOWN.Message.translate("winner");
            var shareText = SMLTOWN.Message.translate("Share");

            $("#smltown_filter").addClass("smltown_hide");
            $("#smltown_win").remove();
            $("#smltown_game").append("<div id='smltown_win'><div>"
                    + "<div class='smltown_image' style='background-image:url(" + url + ")'></div>"
                    + "<div class='smltown_text'>" + winnerText + "</div>"
                    + "<div class='smltown_footer'>"
                    + "<div class='smltown_feed'>" + shareText + "</div>"
                    + "<div>Ok</div>"
                    + "</div>"
                    + "</div></div>");

            $("#smltown_win .smltown_footer > div").click(function() {
                $("#smltown_win").remove();
                $("#smltown_filter").removeClass("smltown_hide");
            });
            $("#smltown_win .smltown_footer .smltown_feed").click(function() {
                $this.winFeed(url);
            });
        };

        FB.api("/me/apprequests", function(response) {
            if (!response.data) {
                return;
            }
            console.log(response)
            var data = $this.getRequestData(response);
            console.log(data);
            if (data) {
                SMLTOWN.Games.access(data.data);
            }
        });

        FB.api('/me?fields=name,third_party_id', function(user) {
            console.log('Successful login for: ' + user.name);
//                document.getElementById('status').innerHTML = "<image src='https://graph.facebook.com/" + response.id + "/picture'>";

            SMLTOWN.Util.setPersistentCookie("smltown_userId", user["third_party_id"]);
            localStorage.setItem("smltown_userName", user.name);

            SMLTOWN.user.name = user.name;
            SMLTOWN.Server.request.addUser("facebook", user.id);
            //TODO remove credentials when not logued ?
        });
    }
    ,
    getRequestData: function(response) {
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
    reload: function() {
        try {
            FB.XFBML.parse();
        } catch (ex) {
        }
    }
    ,
    winFeed: function(url) {
        console.log("win feed: ");
        var cardName = SMLTOWN.user.card.split("_").pop();

        FB.ui({
            method: 'feed',
            name: SMLTOWN.user.name + " won the Werewolf game!",
            link: 'https://apps.facebook.com/smltown/',
            picture: url,
            caption: 'Small Town',
            description: SMLTOWN.user.name + " wins the game as a " + cardName + "."

        }, function(response) {  // callback
            SMLTOWN.user.social = "feeded";
            SMLTOWN.Server.request.setSocialStatus("feeded");
            console.log(response);
        });
    }
    ,
    events: function() {
        $("#smltown_facebookButton").click(function() {
            if ($(this).is(":hover")) {
                SMLTOWN.Social.facebook.checkLoginState();
            }
        });
    }
};