
//auto-init
window.fbAsyncInit = function () {

    FB.init({
        appId: '1572792739668689',
//        cookie: true, // enable cookies to allow the server to access the session
        xfbml: true, // parse social plugins on this page
        version: 'v2.4'
    });

    FB.login(function (response) {
        console.log(response);
    }, {scope: 'email,user_friends'});

    FB.getLoginStatus(function (response) {
        SMLTOWN.Social.facebook.statusChangeCallback(response);
    });
};

// Load the SDK asynchronously
(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id))
        return;
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

if (typeof SMLTOWN == "undefined") {
    SMLTOWN = {};
}

SMLTOWN.Social = {
    facebook: {
        // Login button action
        checkLoginState: function () {
            FB.getLoginStatus(function (response) {
                statusChangeCallback(response);
            });
        }
        ,
        // This is called with the results from from FB.getLoginStatus().
        statusChangeCallback: function (response) {
            console.log('statusChangeCallback');
            if (response.status === 'connected') {
                console.log("connected in facebook");
                this.onConnect();
            } else if (response.status === 'not_authorized') {
                console.log('not_authorized in facebook')
                $("#smltown_footer").append(
                        "<fb:login-button scope='public_profile,email' onlogin='SMLTOWN.Social.facebook.checkLoginState();'></fb:login-button>");
            } else {
                console.log("not in facebook");
            }
            this.reload();
        }
        ,
        friendsButton: $("#smltown_showFriends")[0]
        ,
        // Here we run a very simple test of the Graph API after login is successful.
        onConnect: function () {
            var $this = this;
            // Your like button code //not .show() because !important
            $(".fb-like").addClass("smltown_show");

            //friends
            $("#smltown_html").addClass("smltown_facebook");
            SMLTOWN.Social.invite = function () {
                $this.invite();
            };

            FB.api('/me?fields=name,third_party_id', function (user) {
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
        reload: function () {
            try {
                FB.XFBML.parse();
            } catch (ex) {
            }
        }
        ,
        invite: function () {
            var $this = this;
            $("#smltown_friendSelector").show();

            FB.api('/me/friends', {fields: 'name,picture'}, function (response) {
//                console.log(response);
                $("#smltown_friendsContent").html("");

                var friends = response.data;
                for (var i = 0; i < friends.length; i++) {
                    console.log(friends[i]);
                    $this.invitableFriend(friends[i]);
                }
            });

            $("#smltown_friendSelector .smltown_submit").click(function () {

                // Get the list of selected friends
                var sendUIDs = '';
                var divFriends = $(".smltown_invitableFriend.active");
                for (var i = 0; i < divFriends.length; i++) {
                    sendUIDs += divFriends.attr("socialId") + ',';
                }

                // Use FB.ui to send the Request(s)
                FB.ui({
                    method: 'apprequests',
                    to: sendUIDs,
                    title: 'My Great Invite',
                    message: 'Check out this Awesome App!',
                    data: SMLTOWN.Game.info.id
                }, function (response) {
                    console.log(response);
                });
            });
        }
        ,
        invitableFriend: function (f) {
            var friendSelector = $("#smltown_friendsContent");
            var div = $("<div class='smltown_invitableFriend'>");
            div.attr("socialId", f['id']);

            div.append("<img src='" + f.picture.data.url + "'>");

            var name = $("<p>");
            name.text(f.name);
            div.append(name);

            friendSelector.append(div);

            div.click(function () {
                $(this).toggleClass("active");
            });
        }
    }
};
