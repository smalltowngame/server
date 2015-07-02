<?php
//WITCH
//lang
$card['text'] = array(
    "en" => array(
        "name" => "witch",
        "rules" => "2 potions.."
    )
);

//CARD PROPERTIES
$card['serie'] = "classic werewolf";
$card['initiative'] = 4;
$card['max'] = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card['nightSelect'] = function($utils) {

    $saveId = $utils->requestValue("save");
    $killId = $utils->requestValue("kill");

    $res = "";

    if (isset($saveId)) {
        $utils->setPlayer(array('status' => 1), $saveId);
        $utils->addPlayerRules("JS", 'SMLTOWN.temp.witchUsedSave=true');
        $savedName = $utils->getPlayerName($saveId);
        $res = $res . "$savedName was saved. ";
    }
    if (isset($killId)) {
        $utils->kill($killId);
        $utils->addPlayerRules("JS", 'SMLTOWN.temp.witchUsedKill=true');
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
    <div class="smltown_button" onclick="SMLTOWN.temp.witchAccept()">Accept</div>
</div>

<script>
    
    SMLTOWN.temp.text = [
        "en":[
            "healUsed": "heal potion already been used",
            "poisonUsed": "poison potion already been used"
        ],
        "es":[
            "healUsed": "la poción de curar ya se ha usado",
            "poisonUsed": "la poción de veneno ya se ha usado"
        ]
    ];

    SMLTOWN.temp.witchAccept = function() {
        var save = $(".witchSave").attr("id");
        var kill = $(".witchKill").attr("id");
        SMLTOWN.Server.request.nightSelect({
            save: save ? save : null,
            kill: kill ? kill : null
        });

        $("#witchButton").hide();
        $(".dying").removeClass("dying");
    };

    SMLTOWN.Action.night.extra = function(dying) {
        $("#console").append($("#witchButton"));
        $("#witchButton").show();

        for (var i = 0; i < dying.length; i++) {
            var id = dying[i].userId;
            $("#" + id).addClass("dying");
            $("#" + id + " .playerStatus").text("dying...");
        }
    };

    SMLTOWN.Action.night.select = function(selectedId) {
        var div = $("#" + selectedId);

        if (div.hasClass("dying")) { //if dying
            if (!SMLTOWN.temp.witchUsedSave) { //have this potion yet
                if (div.hasClass("witchSave")) {
                    div.removeClass("witchSave");
                } else {
                    $(".witchSave").removeClass("witchSave");
                    div.addClass("witchSave");
                }
            } else {
                var message = SMLTOWN.temp.text[SMLTOWN.lang]["healUsed"];
                SMLTOWN.Message.flash(message);
            }

        } else {
            if (!SMLTOWN.temp.witchUsedKill) { //have this potion yet
                if (div.hasClass("witchKill")) {
                    div.removeClass("witchKill");
                } else {
                    $(".witchKill").removeClass("witchKill");
                    div.addClass("witchKill");
                }
            } else {
                var message = SMLTOWN.temp.text[SMLTOWN.lang]["poisonUsed"];
                SMLTOWN.Message.flash(message);
            }
        }
        return false;
    };

</script>
