<?php
//WITCH
//lang
$card->text = array(
    "en" => array(
        "name" => "witch",
        "rules" => "use a health and death potions once per game",
        "quote" => "do you want to play?"
    ),
    "es" => array(
        "name" => "bruja",
        "rules" => "2 pociones.."
    )
);

//CARD PROPERTIES
$card->initiative = 4;
$card->max = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card->nightSelect = function() {
    $saveId = $this->requestValue["save"];
    $killId = $this->requestValue["kill"];

    $res = "";

    if (isset($saveId)) {
        $this->setPlayer(array('status' => 1), $saveId);
        $this->addPlayerRulesJS('SMLTOWN.temp.witchUsedSave=true');
        $savedName = $this->getPlayerName($saveId);
        $res = $res . "$savedName was saved. ";
    }
    if (isset($killId)) {
        $this->kill($killId);
        $this->addPlayerRulesJS('SMLTOWN.temp.witchUsedKill=true');
        $savedName = $this->getPlayerName($killId);
        $res = $res . "$savedName was killed. ";
    }

    return $res . "Witch goes to sleep. ";
};

$card->extra = function() {
    $res = $this->getPlayers(array('status' => 0), 'id');
    return $res;
};
?>

<style>	
    .smltown_dying{
        background-color: rgba(100,0,0,0.3) !important;
    }

    #smltown_witchSave {
        color: green;
    }
</style>

<!--Accept button-->
<div id="smltown_witchButton">
    <span>End your turn?</span>
    <div class="smltown_button">Accept</div>
</div>

<script>

    SMLTOWN.temp.text = {
        en: {
            "healUsed": "heal potion already been used",
            "poisonUsed": "poison potion already been used"
        },
        es: {
            "healUsed": "la poción de curar ya se ha usado",
            "poisonUsed": "la poción de veneno ya se ha usado"
        }
    };

    $("#smltown_witchButton .smltown_button").click(function() {
        $(".smltown_dying").removeClass("smltown_dying");
        
        var save = $("#smltown_witchSave").closest(".smltown_player").attr("id");
        var kill = $("#smltown_witchKill").closest(".smltown_player").attr("id");
        SMLTOWN.Server.request.nightSelect({
            save: save ? save : null,
            kill: kill ? kill : null
        });
     });

    SMLTOWN.Action.night.extra = function(dying) {
        console.log(dying)
        $("#smltown_cardConsole").show();
        $("#smltown_cardConsole").html($("#smltown_witchButton"));

        for (var i = 0; i < dying.length; i++) {
            var id = dying[i].id;
            $("#" + id).addClass("smltown_dying");
            $("#" + id + " .smltown_playerStatus").text("dying...");
        }
    };

    SMLTOWN.Action.night.select = function(selectedId) {
        var div = $("#" + selectedId);
        var votes = div.find(".smltown_votes");

        if (div.hasClass("smltown_dying")) { //if dying
            if (!SMLTOWN.temp.witchUsedSave) { //have this potion yet
                var isCheck = votes.find("#smltown_witchSave").length;
                $("#smltown_witchSave").remove();
                if(!isCheck){
                    votes.html("<span id='smltown_witchSave'>✔</span>");
                }
            } else {
                var message = SMLTOWN.temp.text[SMLTOWN.lang]["healUsed"];
                SMLTOWN.Message.flash(message);
            }

        } else {
            if (!SMLTOWN.temp.witchUsedKill) { //have this potion yet
                var isCheck = votes.find("#smltown_witchKill").length;
                $("#smltown_witchKill").remove();
                if(!isCheck){
                    votes.html("<span id='smltown_witchKill'>✘</span>");
                }
            } else {
                var message = SMLTOWN.temp.text[SMLTOWN.lang]["poisonUsed"];
                SMLTOWN.Message.flash(message);
            }
        }
        return false;
    };

</script>
