<?php
//GIRL
//lang
$card->text = array(
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
$card->initiative = 2;
$card->max = 1;

$card->nightBefore = function() {
    $playId = $this->getPlayId();
    $playerStatus = $this->getPlayer("status");
    if ($playerStatus == 0) {
        $cardName = "werewolf_classic_werewolf";
        $this->setPlayer(['card' => $cardName, 'status' => 1]); //first for future checks
        $this->setMessage("You have been attacked by the werewolfs, but you only have hurt. You become a werewolf!", $playId);
        
        $this->response("SMLTOWN.user.card = '$cardName'");
    }
};
