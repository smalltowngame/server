<?php
//SEER
//global $card;
//lang
$card['text'] = array(
    "en" => array(
        "name" => "seer",
        "rules" => "choose someone to see if is a werewolf",
        //specific
        "isWerewolf" => "is a Werewolf",
        "isntWerewolf" => "is not a Werewolf"
    ),
    "es" => array(
        "name" => "adivino",
        "rules" => "mira si un jugador es hombre-lobo",
        //specific
        "isWerewolf" => "es un Hombre-lobo",
        "isntWerewolf" => "no es un Hombre-lobo"
    )
);

//CARD PROPERTIES
$card['serie'] = "classic werewolf";
$card['initiative'] = 3;
$card['max'] = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card['nightSelect'] = function($utils) {
//    global $card;
    $selectId = $utils->requestValue("id");

    // RESOLVE TURN	
    $player = $utils->getPlayer(array("name", "card"), $selectId);
    $name = $player->name;
    $nameArray = split("_", $player->card);
    $cardName = $nameArray[count($nameArray) - 1];
    if (strpos($cardName, 'werewolf') !== false) {
        $utils->addPlayerRules("JS", "SMLTOWN.temp[$selectId]='werewolf'");
        return $name . $this->text["isWerewolf"];
        //someone else
    } else {
        $utils->addPlayerRules("JS", "SMLTOWN.temp[$selectId]='villager'");
        return $name . $this->text["isntWerewolf"];
    }
};
?>

<script>

    SMLTOWN.Action.night.wakeUp = function () {
        for (var id in SMLTOWN.players) {
            if (SMLTOWN.temp[id]) {
                $("#" + id + " .extra").text(SMLTOWN.temp[id]);
            }
        }
    };

    SMLTOWN.Action.night.select = function (selectedId) {
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

</script>
