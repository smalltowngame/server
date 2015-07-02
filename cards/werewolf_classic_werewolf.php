<?php
//WEREWOLF
//lang
$card['text'] = array(
    "en" => array(
        "name" => "werewolf",
        "rules" => "select your victim",
        "wasKilled" => " was killed"
    ),
    "es" => array(
        "name" => "hombre-lobo",
        "rules" => "selecciona una víctima durante la noche",
        "wasKilled" => " ha sido devorado"
    )
);

//CARD PROPERTIES
$card['version'] = 1.0;
$card['serie'] = "classic werewolf";
$card['initiative'] = 1;
// card count
$card['min'] = 1;
$card['max'] = function($playerCount) {
    return floor(($playerCount - 1) / 3);
};

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card['nightSelect'] = function($utils) {
//    global $card;
    
    $selectId = $utils->requestValue("id");
    $utils->setPlayer(array('sel' => $selectId)); // SELECT
    // CHECK OTHER WEREWOLVES    
    $werewolves = $utils->getPlayersCard("werewolf", true);
    for ($i = 0; $i < count($werewolves); $i++) {
        if ($werewolves[$i]->sel == null) {
            return false; //not end turn
        }
    }

    $deadId = votations($werewolves);
    if (null == $deadId) {
        return false; //not end turn
    }

    //RESOLVE TURN
    $utils->kill($deadId); //witch or girl can interact
    $name = $utils->getPlayerName($deadId);
    
    $text = $utils->getText();
    return $name . $text['wasKilled'];
};

$card['nightUnselect'] = function($utils) {
    $utils->setPlayer(array('sel' => 'null'));
};

$card['statusGameChange'] = function($utils) { //checkWolfsEndGame
    $villagers = count($utils->getPlayers(array('status' => "1")));
    $werewolves = count($utils->getPlayersCard("werewolf", true));
    $other = $werewolves - $villagers;

    //if game is over
    if ($werewolves == 0 || $other == 0) {
        return 3; //override status, end game
    }
};
?>

<script>

    SMLTOWN.Action.night.select = function(selectedId) {
        if (selectedId == SMLTOWN.user.id) {
            return false;
        }
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

    SMLTOWN.Action.night.unselect = function() {
        return false;
    };

</script>
