
SMLTOWN.Social = {
    showFriends: function() {
        $("#smltown_friendsContent").html("");
        var shareMenu = $("#smltown_shareMenu");
//        shareMenu.html("");

        //PERSONAL FRIENDS
        var players = [];
        for (var i = 0; i < SMLTOWN.players.length; i++) {
            var player = SMLTOWN.players[i];
            if ("android" == player.type) {
                players.push(player.socialId);
            }
        }

        var invitableFriends = 0;
        var personalFriends = SMLTOWN.user.friends;
        if (null != personalFriends && personalFriends.length) {
            for (var i = 0; i < personalFriends.length; i++) {
                /*if playing*/
                var friend = personalFriends[i];
                if ($.inArray(friend.socialId, players) > -1) {
                    console.log("friend in game: " + friend.socialId);
                    console.log(players);
                    continue;
                }

                this.invitableFriend(personalFriends[i]);
                invitableFriends++;
            }
        }

        //ADD MENU OPTION
        if (invitableFriends && !shareMenu.find(".smltown_phoneContacts").length) {
            var phoneContactsMenu = $("<div class='smltown_phoneContacts'>");
            phoneContactsMenu.append("<div class='smltown_img smltown_phoneIcon'>");
            var text = $("<span>");
            text.smltown_text("phoneContacts");
            phoneContactsMenu.append(text);

            shareMenu.append(phoneContactsMenu);
            phoneContactsMenu.on("tap", function() {
                $("#smltown_friendSelector").show();
            });
        }

        //FACEBOOK
        if (!shareMenu.find(".smltown_facebook").length) {
            var facebook = $("<div class='smltown_facebook'>");
            facebook.append("<img src='img/icon_facebook.png'>");
            facebook.append("<span>Facebook contacts</span>");
            shareMenu.append(facebook);

            facebook.on("tap", function() {
                if (!SMLTOWN.facebook) {
                    SMLTOWN.Social.facebook.login(function() {
                        SMLTOWN.Social.facebook.showFriends();
                    });
                } else {
                    SMLTOWN.Social.facebook.showFriends();
                }
            });
        }

        //IF NOT
//        if (!invitableFriends) {
        shareMenu.addClass("smltown_swipe");
        setTimeout(function() {
            $(document).one("tap", function() {
                $("#smltown_shareMenu").removeClass("smltown_swipe");
            });
        }, 300);
        return;
//        }
    }
    ,
    invitableFriend: function(f) {
        var friendContent = $("#smltown_friendsContent");
        var div = $("<div class='smltown_invitableFriend'>");
        div.attr("socialId", f.socialId);

        var img = $("<img class='smltown_iconUser'>");
        if (f.picture) {
            img.attr("src", f.picture);
        }
        div.append(img);

        var name = $("<p>");
        name.text(f.name);
        div.append(name);

        friendContent.append(div);

        div.on("tap", function() {
            $(this).toggleClass("active");
        });
    }
    ,
    setPicture: function(data) {
        var image = data.split("base64").pop();
        $("#smltown_user .smltown_picture img").remove();
        $("#smltown_user .smltown_picture").append(
                "<img src='data:image/png;base64," + image + "'>"
                );
        SMLTOWN.Server.request.setPicture(image);
    }
};
