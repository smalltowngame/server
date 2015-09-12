
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

//auto-init
window.fbAsyncInit = function () {

    FB.init({
        appId: '1572792739668689',
        cookie: true, // enable cookies to allow the server to access 
        // the session
        xfbml: true, // parse social plugins on this page
        version: 'v2.4'
    });
    
    FB.login(function (response) {
        
    }, {scope: 'email,user_friends'});

    FB.getLoginStatus(function (response) {
        SMLTOWN.Social.facebook.statusChangeCallback(response);
    });
};

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
        // Here we run a very simple test of the Graph API after login is successful.
        onConnect: function () {
            var $this = this;
            // Your like button code //not .show() because !important
            $(".fb-like").addClass("smltown_show");
//            $(".fb-like").css('width', $(".fb-like").width());

            FB.api('/me?fields=name,third_party_id', function (user) {
                console.log('Successful login for: ' + user.name);
//                document.getElementById('status').innerHTML = "<image src='http://graph.facebook.com/" + response.id + "/picture'>";

                SMLTOWN.Util.setPersistentCookie("smltown_userId", user["third_party_id"]);
                localStorage.setItem("smltown_userName", user.name);

                SMLTOWN.user.name = user.name;
                SMLTOWN.Server.request.addUser("facebook", user.id);
                //TODO remove credentials when not logued ?

                console.log(user)
                //friends
                $("#friendsMenu").show();
//                $("#smltown_friends").on("tap", function () {
//                    $this.invite(user['taggable_friends']);
//                });

//                FB.api('/me/friends', function (response) {
////                FB.api('me/friends', {fields: 'id, first_name', limit: 6}, function (response) {
//                    console.log(123);
//                    console.log(response);
//                });
            });

            FB.api('/me/invitable_friends', {fields: 'name,id'}, function (response) {
                console.log(123);
                console.log(response);
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
        invite: function (friends) {
            var friendSelector = $("<div id=friendSelector>");
            $("#smltown_game").append(friendSelector);
            FB.api('/me/friends?fields=id, first_name', function (response) {
//            FB.api('me/friends', {fields: 'id, first_name,picture', limit: 6}, function (response) {
                console.log(123);
                console.log(response);
            });
            console.log(friends);
        }
    }
};
