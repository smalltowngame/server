<?php
//WEREWOLF 

$card['version'] = 1.0;
$card['serie'] = "classic werewolf";
$card['initiative'] = 0;

$card['name'] = array(
    'en' => "werewolf",
    'es' => "hombre lobo",
);
$card['rules'] = array(
    'en' => "select your victim",
    'es' => "selecciona una víctima durante la noche",
);
// card count
$card['min'] = 1;
$card['max'] = function($playerCount) {
    return floor(($playerCount - 1) / 3);
};

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
$card['nightSelect'] = function($utils) {
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
    return "player $name was killed";
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

    Game.night.select = function (selectedId) {
        if (selectedId == Game.user.id) {
            return false;
        }
        Game.request.nightSelect({
            id: selectedId
        });
    };

    Game.night.unselect = function () {
        return false;
    };

</script>
