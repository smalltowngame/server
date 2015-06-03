
function size(obj) {
    var totalSize = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key))
            totalSize++;
    }
    return totalSize;
}

function animateAuto(div, callback) {
    var elem = div.clone().css({"height": "auto"}).appendTo(div.parent());
    var height = elem.css("height");
    elem.remove();
    div.css("height", height);
    if (callback) {
        callback(parseInt(height));
    }
}

function animateButtons(div) {
    var childs = div.find(" > div:visible").length;
    div.css("height", childs * 50);
}

function getById(array, id) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].id == id) {
            return array[i];
        }
    }
    return false;
}

function message(some, attr) {
    if (typeof some == "function") {
        if (!lang[some]) {
            var funcName = some.toString();
            funcName = funcName.substr('function '.length);
            funcName = funcName.substr(0, ret.indexOf('('));
            if (attr) {
                funcName = attr + " " + funcName;
            }
            return funcName;
        }
        return lang[some];
    }

    if (!lang[some]) {
        if (attr) {
            return attr + " " + some;
        }
        return some;
    }
    return lang[some];
}

function setGameCards(cards) {
    Game.cards = cards; //all cards

    $("#smltown_playingCards").html("");
    for (var cardName in Game.cards) {
        var card = Game.cards[cardName];

        var name = card.name;
        if (name[Game.lang]) { //if name is languages common
            name = name[Game.lang];
        } else if (name["en"]) {
            name = name["en"];
        }
        card.name = name;

        var desc = card.rules;
        if (desc) {
            if (desc[Game.lang]) { //if name is languages common
                desc = desc[Game.lang];
            } else if (desc["en"]) {
                desc = desc["en"];
            }
        }
        card.desc = desc;

        var splitName = cardName.split("_");
        var gameMode = splitName[0];
        var group = splitName[1];
        var name = splitName[2];

        //mode
        var divGameMode = $("#smltown_playingCards ." + gameMode);
        if (!divGameMode.length) { //not exists yet
            divGameMode = $("<table align='right' class='" + gameMode + "'>");
            $("#smltown_playingCards").append(divGameMode);
        }

        //group
        var divGroup = $("#smltown_playingCards ." + gameMode + " ." + group);
        if (!divGroup.length) { //not exists yet
            divGroup = $("<tr class='" + group + "'>");
            divGameMode.append(divGroup);
            if (group == "classic") {
                divGameMode.prepend(divGroup);
            }
            divGroup.append("<p class='cardGroupName'>" + group + "</p>");
        }

        //sort on name containing
        var groupsDiv = divGameMode.find("> p");
        for (var i = 0; i < groupsDiv.length; i++) {
            var groupName = groupsDiv[i].className;
            if (groupName != group && groupName.indexOf(group) > -1) {
                $(groupsDiv[i]).before(divGroup);
            }
        }

        //card
        var div = $("<p class = 'smltown_rulesCard smltown_cardOut' card = '" + cardName + "'>");

        var numberCards = card.min + " - " + card.max;
        if (card.min == card.max) {
            numberCards = card.min;
        }

        addBackgroundCard(div, cardName);
        div.append("<span>" + numberCards + "</span>");
        div.append("<form class='smltown_admin'><input></form>");
        divGroup.append(div);
    }
    rulesEvents();
}

function setPlayingCards(cards) { //active game cards
    $(".smltown_rulesCard").addClass("smltown_cardOut");
    for (var cardName in cards) {
        var cardNumber = cards[cardName];
        var div = $(".smltown_rulesCard[card='" + cardName + "']");
        div.removeClass("smltown_cardOut");
        if (cardNumber) { //not set
            div.find("input").val(cardNumber).show();
            div.find("span").hide();
        }
    }
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function resizeCard() {
    var height = $("#smltown_body").height();
    var width = $("#smltown_body").width();
    if (width > height) {
        width = height * 0.8;
        $("#smltown_card > div").width(width);
    }
    $("#smltown_cardFront .text").height(height - width);
}

function addBackgroundCard(div, filename) {
    var nameArray = filename.split("_");
    var nameCard = nameArray[nameArray.length - 1];

    var url = Game.path + "cards/" + nameCard + ".png";

    $('<img/>').attr('src', url).load(function() {
        $(this).remove(); // prevent memory leaks as @benweet suggested
        div.css('background-image', "url('" + url + "')");
        div.find("name").remove();
    }).error(function() {
        var name = nameCard;
        var card = Game.cards[filename];
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

function setUserNamesByClass() {
    for (var id in Game.players) {
        var name = playingCards;
        $(".id" + id + ":empty").append(name + ": "); //not .text() translate
    }
}

function gameBack() {
    load("gameList");
}

function viewport() {
    var e = window, a = 'inner';
    if (!('innerWidth' in window)) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return {width: e[a + 'Width'], height: e[a + 'Height']};
}
