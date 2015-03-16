<?php
//SEER
//CARD PROPERTIES

$card['serie'] = "classic werewolf";
$card['name'] = "seer";
$card['initiative'] = 2;
$card['rules'] = "choose someone to see";
$card['max'] = 1;

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card['nightSelect'] = function($utils) {
    $selectId = $utils->requestValue("id");

    // RESOLVE TURN	
    $player = $utils->getPlayer(array("name", "card"), $selectId);
    $name = $player->name;
    $nameArray = split("_", $player->card);
    $cardName = $nameArray[count($nameArray) - 1];
    if (strpos($cardName, 'werewolf') !== false) {
        $utils->addPlayerRules("JS", "Game.temp[$selectId]='werewolf'");
        return "yes, $name is a Werewolf";
        //someone else
    } else {
        $utils->addPlayerRules("JS", "Game.temp[$selectId]='villager'");
        return "no, $name is not a Werewolf";
    }
};
?>

<script>

    Game.night.wakeUp = function() {
        for (var id in Game.players) {
            if (Game.temp[id]) {
                $("#" + id + " .extra").text(Game.temp[id]);
            }
        }
    };

    Game.night.select = function(selectedId) {
        Game.request.nightSelect({
            id: selectedId
        });
    };

</script>
