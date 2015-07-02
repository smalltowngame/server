<?php
//GIRL
//lang
$card['text'] = array(
    "en" => array(
        "name" => "girl",
        "rules" => "can be converted by werewolfs"
    ),
    "es" => array(
        "name" => "niña",
        "rules" => "si los hombres-lobo te atacan durante la noche, te convertirás en otro hombre-lobo en vez de morir"
    )
);

//CARD PROPERTIES
$card['initiative'] = 2;
$card['max'] = 1;

$card['extra'] = function($utils) {
    $userId = $utils->getUserId();
    $playerStatus = $utils->getPlayer("status");
    if ($playerStatus == 0) {
        $utils->setMessage("You have been attacked by the werewolfs, but you only have hurt. You become a werewolf!", $userId);
        $utils->setPlayer(['card' => "werewolf_classic_werewolf", 'status' => 1]);
    } else {
        return false;
    }
};
