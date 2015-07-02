
SMLTOWN.Add = {
    backgroundCard: function(div, filename) {
        var nameArray = filename.split("_");
        var nameCard = nameArray[nameArray.length - 1];

        var url = SMLTOWN.path + "cards/" + nameCard + ".png";

        $('<img/>').attr('src', url).load(function() {
            $(this).remove(); // prevent memory leaks as @benweet suggested
            div.css('background-image', "url('" + url + "')");
            div.find("name").remove();
        }).error(function() {
            var name = nameCard;
            var card = SMLTOWN.cards[filename];
            if (card) {
                name = card.name;
            }
            var nameContent = $("<name>" + name + "</name>");
            div.prepend(nameContent);
            //fill text size
            var fontSize = parseInt(div.css("font-size"));
            var divWidth = div.width();
            while (nameContent.width() > divWidth) {
                div.css("font-size", fontSize-- + "px");
                if (!fontSize) {
                    return;
                }
            }
            div.addClass("smltown_textCard");
        });
    }
    ,
    quitPlayerButtons: function() {
        if ($.isEmptyObject(SMLTOWN.Game.info)) {
            return;
        }
        if (!SMLTOWN.Game.info.status) {
            $(".smltown_extra").html("");
            if (SMLTOWN.user.admin) {
                for (id in SMLTOWN.players) {
                    if (id != SMLTOWN.user.id) {
                        $("#" + id + " .smltown_extra").html(
                                "<div class='smltown_gameOver smltown_quit smltown_button'>quit</div>");
                    }
                }
            }
        }
        $(".smltown_player .smltown_quit").click(function() {
            var id = $(this).closest(".smltown_player").attr("id");
            $("#" + id).remove();
            SMLTOWN.Server.request.deletePlayer(id);
        });
    }
    ,
    userNamesByClass: function() {
        for (var id in SMLTOWN.players) {
            var name = SMLTOWN.players[id].name;
            $(".id" + id + ":empty").append(name + ": "); //not .text() translate
        }
    }
};
