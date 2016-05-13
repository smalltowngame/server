<?php
//WEREWOLF
//lang

//recomended
if (isset($card)) {

    $card->text = array(
        "en" => array(
            "name" => "werewolf",
            "rules" => "select one victim at night",
            "quote" => "ARF! ARF!",
            "werewolf_wasKilled" => " was killed"
        ),
        "es" => array(
            "name" => "hombre-lobo",
            "rules" => "selecciona una víctima durante la noche",
            "quote" => "me gustan los aldeanos.. pero porque yo soy uno!",
            "werewolf_wasKilled" => " ha sido devorado"
        )
    );

//CARD PROPERTIES
    $card->version = 1.0;
    $card->initiative = 1;
// card count
    $card->min = 1;
    $card->max = function($playerCount) {
        return floor(($playerCount - 1) / 3);
    };

//////////////////////////////////////////////////////////////////////////////////
////SELECT ACTION
    $card->nightSelect = function() {
        $selectId = $this->requestValue['id'];

        $this->setPlayer(array('sel' => $selectId)); // SELECT
        // CHECK OTHER WEREWOLVES    
        $werewolves = $this->getPlayersCard("werewolf", true);
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
        $this->kill($deadId); //witch or girl can interact
        $name = $this->getPlayerName($deadId);

//        $text = $this->getText();
//        return $name . $text['wasKilled'];
        return $name . ' _werewolf_wasKilled';
    };

    $card->nightUnselect = function() {
        $this->setPlayer(array('sel' => 'null'));
    };

    $card->statusGameChange = function() { //checkWolfsEndGame
        $alive = count($this->getPlayers(array('status' => "1")));
        $protected = count($this->getPlayers(array('status' => "2")));
        $villagers = $alive + $protected;

        $like = true;
        $dead = false;
        $werewolves = count($this->getPlayersCard("werewolf", $like, $dead));
        $other = $villagers - $werewolves;

        //if game is over
        if ($werewolves == 0 || $other == 0) {
            $this->setPlayers(array("status = -1"), array("status = 0"));
            if ($werewolves == 0) {
                $this->setPlayers(array("status = 0"), array("card NOT LIKE '%_werewolf'", "status < 0"));
            } else {
                $this->setPlayers(array("status = 0"), array("card LIKE '%_werewolf'", "status < 0"));
            }

            $this->endGame();
            return false;
        }
    };
    
}
?>

<script>

    SMLTOWN.Action.night.select = function (selectedId) {
        if (selectedId == SMLTOWN.user.id) {
            return false;
        }
        SMLTOWN.Server.request.nightSelect({
            id: selectedId
        });
    };

    SMLTOWN.Action.night.unselect = function () {
        return false;
    };

</script>
