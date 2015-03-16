<?php
//WITCH
//CARD PROPERTIES

$card['serie'] = "classic werewolf";
$card['name'] = "witch";
$card['initiative'] = 3;
$card['rules'] = "2 potions..";
$card['max'] = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card['nightSelect'] = function($utils) {

    $saveId = $utils->requestValue("save");
    $killId = $utils->requestValue("kill");

    $res = "";

    if (isset($saveId)) {
        $utils->setPlayer(array('status' => 1), $saveId);
        $utils->addPlayerRules("JS", 'Game.temp.witchUsedSave=true');
        $savedName = $utils->getPlayerName($saveId);
        $res = $res . "$savedName was saved. ";
    }
    if (isset($killId)) {
        $utils->kill($killId);
        $utils->addPlayerRules("JS", 'Game.temp.witchUsedKill=true');
        $savedName = $utils->getPlayerName($killId);
        $res = $res . "$savedName was killed. ";
    }

    return $res . "Witch goes to sleep. ";
};

$card['extra'] = function($utils) {
    return $utils->getPlayers(array('status' => 0), array('userId'));
};
?>

<style>	
    .dying{
        background-color: rgba(100,0,0,0.3) !important;
    }	
    .witchSave .votes:after{
        content: "✔";
        color: green;
    }
    .witchKill .votes:after{
        content: "✘";
    }
    #witchButton{
        display: none;
        position: absolute;
        width: 100%;
        text-align: center;
        margin-top: 15px;
        z-index: 9;
    }
    #witchButton button{
        width: auto;
        margin-left: 20px;
    }	
</style>

<!--Accept button-->
<div id="witchButton">
    <span>End your turn?</span>
    <button onclick="Game.temp.witchAccept()">Accept</button>
</div>

<script>

    Game.temp.witchAccept = function() {
        var save = $(".witchSave").attr("id");
        var kill = $(".witchKill").attr("id");
        Game.request.nightSelect({
            save: save ? save : null,
            kill: kill ? kill : null
        });

        $("#witchButton").hide();
        $(".dying").removeClass("dying");
    };

    Game.night.extra = function(dying) {
        for (var i = 0; i < dying.length; i++) {
            var id = dying[i].userId;
            $("#" + id).addClass("dying");
            $("#" + id + " .playerStatus").text("dying...");
        }
    };

    Game.night.wakeUp = function() {
        $("#console").append($("#witchButton"));
        $("#witchButton").show();
    };

    Game.night.select = function(selectedId) {
        var div = $("#" + selectedId);

        if (div.hasClass("dying")) { //if dying
            if (!Game.temp.witchUsedSave) { //have this potion yet
                if (div.hasClass("witchSave")) {
                    div.removeClass("witchSave");
                } else {
                    $(".witchSave").removeClass("witchSave");
                    div.addClass("witchSave");
                }
            } else {
                flash("heal potion already been used");
            }

        } else {
            if (!Game.temp.witchUsedKill) { //have this potion yet
                if (div.hasClass("witchKill")) {
                    div.removeClass("witchKill");
                } else {
                    $(".witchKill").removeClass("witchKill");
                    div.addClass("witchKill");
                }
            } else {
                flash("poison potion already been used");
            }
        }
        return false;
    };

</script>
