<?php
//SEER
//lang
$card->text = array(
    "en" => array(
        "name" => "seer",
        "rules" => "choose someone to see if is a werewolf",
        //specific
        "isWerewolf" => " is a Werewolf",
        "isntWerewolf" => " is not a Werewolf"
    ),
    "es" => array(
        "name" => "adivino",
        "rules" => "mira si un jugador es hombre-lobo",
        //specific
        "isWerewolf" => " es un Hombre-lobo",
        "isntWerewolf" => " no es un Hombre-lobo"
    )
);

//CARD PROPERTIES
$card->initiative = 3;
$card->max = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card->nightSelect = function() {
    $selectId = $this->requestValue["id"];

    // RESOLVE TURN	
    $player = $this->getPlayer(array("name", "card"), $selectId);
    $name = $player->name;
    $nameArray = split("_", $player->card);
    $cardName = $nameArray[count($nameArray) - 1];
    if (strpos($cardName, 'werewolf') !== false) {
        $this->addPlayerRulesJS("SMLTOWN.temp['$selectId']='werewolf'");
        return $name . $this->getText()["isWerewolf"];
        //someone else
    } else {
        $this->addPlayerRulesJS("SMLTOWN.temp['$selectId']='villager'");
        return $name . $this->getText()["isntWerewolf"];
    }
};
?>

<script>

    SMLTOWN.Action.night.wakeUp = function () {
        for (var id in SMLTOWN.players) {
            var player = SMLTOWN.players[id]; 
            if (!player.card && SMLTOWN.temp[id]) { //not necessary show if know card
                $("#" + id + " .smltown_votes").text(SMLTOWN.temp[id]);
            }
        }
    };

    SMLTOWN.Action.night.select = function (selectedId) {
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

</script>
