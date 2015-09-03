<?php

trait Engine {

// DAY ACTIONS
    protected function gameStatusChange() {
        $gameId = $this->gameId;

        $plays = petition("SELECT id, card FROM smltown_plays WHERE gameId = $gameId");

        for ($i = 0; $i < count($plays); $i++) {
            $cardName = $plays[$i]->card;

            $card = $this->getCardFileByName($cardName, $plays[$i]->id);

            if (!$card || !property_exists($card, "statusGameChange")) {
                continue;
            }

            $overrideStatus = $card->statusGameChange();

            if (isset($overrideStatus)) {

                if (is_numeric($overrideStatus)) {
//                    sql("UPDATE smltown_games SET status = $overrideStatus WHERE id = $gameId");
//                    $this->updateGame(null, "status");
                    //
                } else if (false != $overrideStatus) { //string
                    sql("UPDATE smltown_games SET night = '$cardName' WHERE id = $gameId");
                    //update night turn to this players make stop
                    $message = "statusGameChange:$overrideStatus";
                    $plays = petition("SELECT id, status, card FROM smltown_plays WHERE gameId = $gameId");
                    for ($i = 0; $i < count($plays); $i++) {
                        $playId = $plays[$i]->id;
                        if ($cardName == $plays[$i]->card && -1 < $plays[$i]->status) {
                            $this->updateGame($playId, "night");
                            $this->saveMessage($message, $playId);
                        } else {
                            $this->setNotifications("somethingHappend", array("id" => $playId));
                        }
                    }
                }
                return true;
            }
        }
        return false;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // NIGHT ACTIONS

    protected function runTurn($cardName) { //plays of same cards
        $gameId = $this->gameId;

        $plays = petition("SELECT smltown_plays.id FROM smltown_plays "
                //add players name table
                . " LEFT OUTER JOIN smltown_players"
                . " ON smltown_plays.userId = smltown_players.id"
                //
                . " WHERE card = '$cardName' AND status > -1 AND smltown_plays.gameId = $gameId");

        if (count($plays) < 1) {
            echo "ERROR: card file not found. Ending turn..";
            $this->setNextStatus();
            return;
        }

        for ($i = 0; $i < count($plays); $i++) {
            $playId = $plays[$i]->id;
            //every card player: distinct languages
            $card = $this->getCardFileByName($cardName, $playId);

            //if night-Turn function (like girl)
            if (property_exists($card, "nightBefore")) {
                $res = $card->nightBefore();
                if (false !== $res) {
                    //endNightTurn($gameId, $card->initiative);
                    $this->setNextTurn($card->initiative);
                }
            }
            if (property_exists($card, "nightSelect")) {
                $this->updatePlayers($playId, array("card" => $cardName));
                $this->updateGame($playId, array("status", "night"));
            }
        }
    }

    protected function checkMessages() {
        $gameId = $this->gameId;

        $outstandMessages = petition("SELECT count(*) as count FROM smltown_plays WHERE message <> '' AND gameId = $gameId")[0]->count;
        if ($outstandMessages > 0) { //wait for messages
            return false;
        }
        //updateGame($gameId, null, "status");
        return true;
    }

    ////////////////////////////////////////////////////////////////////////////////
    //AUTOMATIC REQUESTS
    public function messageReceived() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        $stop = false;
        if (isset($this->stop)) {
            $stop = $this->stop;
        }

        $sth = sql("UPDATE smltown_plays SET message = '' WHERE message <> '' AND id = $playId");
        if ($sth->rowCount() == 0) {
            //DEBUG
            //$this->setError("error: no message to recieve.");
            return; //any message to recibe, prevent posible hack
        }

        //only on last message
        $this->updatePlayer($playId, "message");
        if (!$this->checkMessages()) {
            return;
        }

        $status = $this->getTurn();
        if (count($this->TURNS) == $status) { //if game over
            echo "GAME OVER";
            return;
        }

        if (!$stop) {
            $night = petition("SELECT night FROM smltown_games WHERE id = $gameId")[0]->night;
            if (isset($night) && !empty($night)) {
                $this->setNextTurn();
            } else { //night == null            
                $this->setNextStatus();
            }
        }
    }

    ////////////////////////////////////////////////////////////////////////////////
    //DAY SELECTS
    public function selectPlayer() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        $id = $this->requestValue['id'];

        $values = array('selectedId' => $id);
        sql("UPDATE smltown_plays SET sel = :selectedId WHERE id = $playId", $values);
        $this->selectPlayerResponse();
    }

    public function unSelectPlayer() {
        $gameId = $this->gameId;
        $playId = $this->playId;
        sql("UPDATE smltown_plays SET sel = null WHERE id = $playId");
        $this->selectPlayerResponse();
    }

    protected function selectPlayerResponse() {
        $gameId = $this->gameId;

        //players out of vote rules
        $plays = petition("SELECT openVoting FROM smltown_plays "
                //add players name table
                . "LEFT OUTER JOIN smltown_games "
                . "ON smltown_plays.gameId = smltown_games.id "
                //
                //cout if some alive is not selecting
                . "WHERE smltown_plays.gameId = $gameId AND "
                . "smltown_plays.status > 0 AND sel IS NULL AND smltown_plays.admin > -1 "
                //count if games.time is NOT over (null || 0)
                . "OR smltown_games.time > " . microtime(true));

        //indiferent to openVoting
        if (count($plays) == 0) { //day ends
            $this->townVotations();
        } else {
            //only in case openVoting update
            if (1 == $plays[0]->openVoting) {
                $this->updatePlayers(null, "sel");
            } else {
                $this->pendingVotes();
            }
        }
    }

    //NIGHT SELECTS
    public function nightSelect() {
        $gameId = $this->gameId;

        $play = $this->getCard(); //own night turn
        if (!$play) {
            echo "bad select card request";
            return;
        }

        $cardName = $play->card;
        $card = $this->getCardFileByName($cardName);

        $data = $card->nightSelect();

        if ($data === false) { //not ended turn, update "sel"
            $plays = petition("SELECT id FROM smltown_plays WHERE gameId = $gameId AND card = '$cardName' AND status > -1");
            for ($i = 0; $i < count($plays); $i++) {
                $this->updatePlayers($plays[$i]->id, "sel");
            }
            return;
        }

        sql("UPDATE smltown_plays SET sel = NULL WHERE gameId = $gameId");

        if ($data) { //end turn 4 all players with card
            $plays = petition("SELECT id FROM smltown_plays WHERE gameId = $gameId AND card = '$cardName' AND status > -1");
            for ($i = 0; $i < count($plays); $i++) {
                $this->saveMessage($data, $plays[$i]->id);
            }
            return;
        }

        $ini = null;
        if (isset($card->initiative)) {
            $ini = $card->initiative;
        }
        $this->setNextTurn($ini); //night
    }

    public function nightUnselect() {
        $gameId = $this->gameId;
        $playId = $this->playId;

        $play = $this->getCard();
        if (!$play) {
            echo "bad unselect card request";
            return;
        }

        $card = $this->getCardFileByName($play->card);
        $data = $card->nightUnselect();

        if ($data) {
            $this->send_response(array('type' => 'night', 'data' => $data), $playId);
        }
    }

    protected function getTurn() {
        $gameId = $this->gameId;

        $res = petition("SELECT status FROM smltown_games WHERE id = $gameId")[0];
        if (isset($res->status)) {
            $status = intval($res->status);
        } else {
            $status = 0;
        }
        return $status;
    }

    protected function setNextTurn($ini = null) {
        if (!$this->checkMessages()) {
            //DEBUG
            //echo "bad next-turn request";
            return;
        }
        $status = $this->getTurn();
        $func = $this->TURNS[$status];
        $this->$func($ini);
    }

    protected function setNextStatus($ini = null) {
        $gameId = $this->gameId;

        $status = $this->getTurn() + 1;
        $statusCount = count($this->TURNS);
        if ($statusCount == $status) { //equals, not lower
            $status = 1;
        } else if ($statusCount < $status) {
            //game is over
            return;
        }

        sql("UPDATE smltown_games SET status = $status, night = null WHERE id = $gameId");
        $this->updateGame(null, "status");

        if ($this->checkMessages()) { //set setNextStatus in pre-day, after night
            $func = $this->TURNS[$status];
            $this->$func($ini);
        }
    }

////////////////////////////////////////////////////////////////////////////////
//UTILS
    protected function setGameStatus($status) {
        $gameId = $this->gameId;
        $sth = sql("UPDATE smltown_games SET status = $status WHERE status <> $status AND id = $gameId");
        if ($sth->rowCount() == 0) { //nothing changes
            return false;
        }
        $this->updateGame(null, "status");
    }

    protected function getDying() { //kill dying players
        $gameId = $this->gameId;
        $kills = petition("SELECT id, sel, "
                . " CASE WHEN status = 0 THEN card ELSE NULL END AS card"
                . " FROM smltown_plays WHERE gameId = $gameId");
        return $kills;
    }

    protected function killDying() { //kill dying players
        $gameId = $this->gameId;
        $sth = sql("UPDATE smltown_plays SET sel = null, "
                . "status = (CASE status WHEN 0 THEN -1 WHEN 2 THEN 1 ELSE status END)"
                . "WHERE gameId = $gameId");
        if ($sth->rowCount() > 0) { //nothing changes
            $this->updatePlayers();
        }
    }

}
