<?php

include_once 'php/PingRequest.php';

//extends PingReq to rewrite methods
trait BackEnd {

    public $TURNS = array(
        "start",
        "night",
        "preDay",
        "day",
        "postDay"
    );

//
//    public function nightSelect() {
//        $gameId = $this->gameId;
//
//        $games = petition("SELECT status FROM smltown_games WHERE id = $gameId");
//        if (count($games) > 0) {
//            $gameStatus = $games[0];
//        }
//
//        if($gameStatus) {
//            
//        }
//
//        parent::nightSelect();
//    }
//    
//TURNS
    protected function start() {
        
    }

    protected function night($initiative = null) { //1 (every night turn)
        $gameId = $this->gameId;

//EVERY NIGHT TURN
        if (!$initiative) {
//if comes from statuschange card action 
            $initiative = $this->getInitiative(); //utils
        }

        $cardName = $this->getNextNightTurn($initiative);

        if (!$cardName) {
            if ($initiative < -1) { //prevent dayEnd bucles if no night cards error
                $this->setGameStatus(0);
                echo "error: no night cards?";
                die();
            }

//start pre-Day before getDying
            sql("UPDATE smltown_games SET status = 2, night = 'preDay' WHERE id = $gameId");
            sql("UPDATE smltown_plays SET sel = NULL WHERE gameId = $gameId");
            $this->updateGame(null, array("night", "status"));
//updatePlayers(null, "sel");
            $kills = $this->getDying();
            $this->saveMessage("kills:" . json_encode($kills));
//$this->updatePlayers(null, array("status")); //status like 4 hunter
//
        } else {
            sql("UPDATE smltown_games SET night = '$cardName' WHERE id = $gameId");
            $this->runTurn($cardName);
        }
    }

    protected function preDay($initiative = null) { //2
        if ($this->gameStatusChange()) {
            return;
        }
        $this->killDying(); //no message

        $this->setNextStatus(-1);
    }

    protected function day($initiative = null) { //3
        $gameId = $this->gameId;

        $time = petition("SELECT time FROM smltown_games WHERE id = $gameId")[0]->time;
        if ($time > 0) {
            return;
        }

        if ($this->checkGameOver($gameId)) { //first (status = 5)
            return;
        }

        if ($this->playersAlive() == 2) { // if 2 players
//$kills = $this->getDying();
//$this->killDying();
//$message = "alive2:" . json_encode($kills);
            $message = "alive2";
            $this->saveMessage($message); //alive users
            sql("UPDATE smltown_games SET night = null WHERE id = $gameId"); //set night        
            return;
        }

//START DAY
        $now = round(microtime(true));
        $newTime = $this->getDiscusTime($now); //seconds
        sql("UPDATE smltown_games SET night = null, timeStart = $now, time = $newTime WHERE id = $gameId");
        $this->updateGame(null, array("timeStart", "time")); //updates game
    }

    protected function postDay($initiative = null) { //4
        if ($this->gameStatusChange()) {
            return;
        }
        $this->killDying(); //no message
//    endStatusTurn($gameId);
        $this->setNextStatus(-1);

//saveMessage("dayEnd", $gameId); //alive users
    }

///////////////////////////////////////////////////////////////////////////////
// DAY ACTIONS

    protected function townVotations() { //day end
        $gameId = $this->gameId;

//update time
        $sth = sql("UPDATE smltown_games SET timeStart = null, time = null, night = null WHERE id = $gameId"
                . " AND (time < " . microtime(true)
//or endTurn is enabled
                . " OR time = 0)");

        if ($sth->rowCount() == 0) {
            return; //prevent multiple dayEnd requests
        }

        $players = petition("SELECT sel FROM smltown_plays WHERE gameId = $gameId AND status > 0 AND admin > -1");
        $deadId = votations($players);

//hurt
        if ($deadId != null) {
            $this->hurtPlayer($deadId);
        }
//end day
        $kills = $this->getDying();
        $this->saveMessage("votations:" . json_encode($kills));
//        $this->updatePlayers(null, array("status"));
    }

////////////////////////////////////////////////////////////////////////////////
// NIGHT ACTIONS

    protected function getNextNightTurn($turn) {
        $gameId = $this->gameId;

//alive only. distinct: not duplicated
        $plays = petition("SELECT DISTINCT card FROM smltown_plays WHERE gameId = $gameId AND status > -1 AND card > ''");

        $lowestInitiative = 100;
        $next = null;
        for ($i = 0; $i < count($plays); $i++) {
            $cardName = $plays[$i]->card;
            $card = $this->getCardFileByName($cardName);

            if (!isset($card->initiative)) { //like hunter
                continue;
            }
            $initiative = $card->initiative;

            if ($initiative > $turn && $initiative < $lowestInitiative) {
                $lowestInitiative = $initiative;
                $next = $cardName;
            }
        }

        if (null == $next) {
            return false;
        }
        return $next;
    }

}
