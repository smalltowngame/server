<?php

trait Utils {

    //$cards = array(); //stored ???
    //CARD WORKS

    protected function getCard() { //only night
        $gameId = $this->gameId;
        $playId = $this->playId;

        $cards = petition("SELECT card FROM smltown_plays "
                //add players name table
                . " LEFT OUTER JOIN smltown_players"
                . " ON smltown_plays.userId = smltown_players.id"
                //
                . " WHERE smltown_plays.id = $playId AND status > -1" //alive
                . " AND card = (SELECT night FROM smltown_games WHERE id = $gameId)" //only own turn
                . " AND 0 = (SELECT count(*) FROM smltown_plays WHERE message > '' AND id != $playId AND smltown_plays.gameId = $gameId)");
        if (count($cards) == 0) {
            return false;
        }
        return $cards[0];
    }

    //////////////////////////////////////////////////////////////////////////////////
    //MESSAGES WORK
    //flash
    protected function setFlash($message, $wheres = null) {
        $players = $this->getPlayers($wheres);
        for ($i = 0; $i < count($players); $i++) {
            $playId = $players[$i]->id;
            $this->send_response(array('type' => 'flash', 'data' => $message), $playId);
        }
    }

    //notification
    protected function setNotifications($message, $wheres = null) {
        $players = $this->getPlayers($wheres);
        for ($i = 0; $i < count($players); $i++) {
            $playId = $players[$i]->id;
            $this->send_response(array('type' => 'notify', 'data' => $message), $playId);
        }
    }

    protected function setError($log) {
        $this->send_response(array('type' => 'smltown_error(\'' . $log . '\')'));
    }

    //////////////////////////////////////////////////////////////////////////////////
    //DB RQUESTS

    protected function getPlayers($wheres) {
        $gameId = $this->gameId;

        $values = array();
        $sql = "SELECT id FROM smltown_plays WHERE gameId = $gameId " . whereArray($wheres, $values);
        return petition($sql, $values);
    }

    protected function playersAlive($onlyRealPlayers = false) {
        $gameId = $this->gameId;

        $sql = "SELECT count(*) as count FROM smltown_plays WHERE gameId = $gameId AND status > 0";
        //    if ($onlyRealPlayers) {
        //        $sql = "$sql AND admin != -2";
        //    }
        return petition($sql)[0]->count;
    }

    protected function checkGameOver() {
        $gameId = $this->gameId;

        if ($this->playersAlive() < 2) {
            $this->endGame($gameId);
            return true;
        }
        return false;
    }

    protected function endGame() {
        $gameId = $this->gameId;

        $endStatus = count($this->TURNS);
        sql("UPDATE smltown_games SET night = end, status = $endStatus WHERE id = $gameId");
        //sql("UPDATE smltown_plays SET status = -1 WHERE gameId = $gameId AND status < 1");
        sql("UPDATE smltown_plays SET sel = NULL WHERE gameId = $gameId");
        $this->updatePlayers(null, array("status", "card", "sel"));
        $this->updateGame(null, "status");
    }

    protected function getDiscusTime($now) {
        $gameId = $this->gameId;

        $dayTime = petition("SELECT dayTime FROM smltown_games WHERE id = $gameId")[0]->dayTime;
        if (!$dayTime) {
            $dayTime = 60;
        }
        $onlyRealPlayers = true;
        $total = $this->playersAlive($onlyRealPlayers);
        $playersCount = intval($total);
        return $now + $playersCount * $dayTime; //players * dayTime
    }

    protected function getInitiative() {
        $gameId = $this->gameId;

        $nightTurn = petition("SELECT night FROM smltown_games WHERE id = $gameId")[0]->night;
        if (!$nightTurn) {
            return -1;
        } else if (is_numeric($nightTurn)) {
            return $nightTurn;
        }

        $card = $this->getCardFileByName($nightTurn);
        if (isset($card->initiative)) {
            return $card->initiative;
        }
        return -1; //start night
    }

    //////////////////////////////////////////////////////////////////////////////////
    //GAME INTERACTION

    protected function hurtPlayer($playId) {
        sql("UPDATE smltown_plays SET status = 0 WHERE status < 2 AND id = $playId");
    }

    protected function killPlayer($playId) {
        $gameId = $this->gameId;

        sql("UPDATE smltown_plays SET status = -1, rulesJS = '' WHERE id = $playId");
        $this->updateUsers($playId, "rulesJS"); // necessary?
        $this->updatePlayers($playId, "status");
        $this->updatePlayers($playId, "card"); //card special rule
        return $this->checkGameOver($gameId);
    }

    //////////////////////////////////////////////////////////////////////////////////
    //DB REQUESTS UTILS
    protected function checkGameErrors() {
        $gameId = $this->gameId;

        //night stuck
        //    $count = petition("SELECT count(*) as count FROM smltown_games "
        //                    . "WHERE status = 3 AND night IS NULL "
        //                    . "AND (SELECT count(*) as count FROM smltown_plays WHERE message > '') = 0 "
        //                    . "AND id = $gameId")[0]->count;
        //    if (1 == $count) {
        //        setError($gameId, "error: night turn was lost");
        //        //setGameStatus(1); //wake up
        //    }
        //bots error
        $sth = sql("DELETE FROM smltown_plays WHERE gameId = $gameId AND userId = '' and admin != -2");
        if ($sth->rowCount() > 0) {
            setError("warn: fixed bot error");
        }
    }

    //function setCookieValue($key, $value) {
    //    setcookie($key, $value, time() + 864000, "/"); //10 days
    //}
    //
    ////////////////////////////////////////////////////////////////////////////////
    // RESPONSE UTILS

    protected function getRules($playId = null) {
        $gameId = $this->gameId;

        $lang = "en";
        if ($playId) {
            $plays = petition("SELECT lang FROM smltown_players WHERE id = (SELECT userId FROM smltown_plays WHERE id = $playId)");
            if (count($plays) > 0) {
                $lang = $plays[0]->lang;
            }
        }

        $playerCount = petition("SELECT count(*) as count FROM smltown_plays WHERE gameId = $gameId")[0]->count;

        //include_once "php/utils.php";
        $cards = $this->loadCards(true); //all
        $returnCards = array();
        foreach ($cards as $cardName => $card) { //important
            $returnCard = array();

            //min
            $min = 0;
            if (isset($card->min)) {
                $min = $card->min;
                if (is_callable($card->min)) {
                    $min = $card->min($playerCount);
                }
            }
            $returnCard['min'] = $min;

            //max
            //        $max = $card->max;
            //        echo "; " . json_encode($card);
            if (isset($card->max)) {
                if (is_object($card->max)) {
                    $max = $card->max($playerCount);
                } else {
                    $max = $card->max;
                }
                if ($max < $min) {
                    $max = $min;
                }
                $returnCard['max'] = $max;
            }

            //texts
            $text = $card->text;
            if (isset($text[$lang])) {
                $trans = $text[$lang];
            } else {
                $key = key($text);
                $trans = $text[$key];
            }
            $returnCard['name'] = $trans['name'];
            $returnCard['rules'] = $trans['rules'];
            if (isset($trans['quote'])) {
                $returnCard['quote'] = $trans['quote'];
            }

            $returnCards[$cardName] = $returnCard;
        }
        return $returnCards;
    }

//    protected function reloadClientGame() {
//        $playId = $this->playId;
//
//        $res = array(
//            'type' => "SMLTOWN.Load.reloadGame"
//        );
//        $this->send_response($res, $playId);
//    }

    //CARD WORKS

    protected function loadCards($all = false) { //GAME ID FUTURE ERRORS
        $gameId = $this->gameId;
        $cards = array();

        if (!$all) { // if specific game
            $string = petition("SELECT cards FROM smltown_games WHERE id = $gameId")[0]->cards;

            //IF CARDS EMPTY OR CURRUPTED
            if (empty($string)) {
                setGameStatus(0); //if user try restart
                echo "SMLTOWN.Message.flash('noCardsSelected')";
                return false;
            }
            try {
                $playingCards = json_decode($string);
            } catch (Exception $e) {
                echo "selected game cards are corrupted, please change some card";
                return false;
            }

            // GET CARDS NUMBER
            foreach ($playingCards as $filename => $number) {
                $card = $this->getCardFileByName($filename);
                if (empty($card)) { //DB error;
                    continue;
                }
                if ($number > 0) {
                    $card->min = $number;
                    $card->max = $number;
                }
                $cards[$filename] = $card;
            }
            return $cards;
        }

        $type = petition("SELECT type FROM smltown_games WHERE id = $gameId")[0]->type;

        foreach (glob("games/" . $type . "/cards/*.php") as $filename) {
            $name = basename($filename, '.php');
            $cards[$name] = $this->getCardFile($filename);
        }
        return $cards;
    }

    protected function getCardFileByName($name, $playId = null) {
        $gameId = $this->gameId;
        $type = petition("SELECT type FROM smltown_games WHERE id = $gameId")[0]->type;
        
        $filename = "games/$type/cards/$name.php";
        return $this->getCardFile($filename, $playId);
    }

    protected function getCardFile($filename, $playId = null) {

        if (!file_exists($filename)) {
            echo "file not exists = " . $filename;
            return false;
        }

        if (null == $playId) {
            $playId = $this->playId;
        }

        global $card;
        $card = new Card($this->gameId, $playId, $this->requestValue);

        //prevent cards content return
        ob_start();
        $echo = ob_get_contents(); //store all previous echo
        include $filename; //not once!!
        ob_end_clean(); //stop prevent cards content return
        echo $echo; //acho all previous echo
        //////////////////////////////

        return $card;
    }

    protected function getCards($cards, $playerCount) {
        $minCards = array();
        $maxCards = array();

        foreach ($cards as $cardName => $card) { //important
            $min = 0;
            if (isset($card->min)) {
                $min = $card->min;
                if (is_callable($min)) {
                    $min = $card->min($playerCount);
                }
            }
            for ($i = 0; $i < $min; $i++) {
                array_push($minCards, $cardName);
            }

            if (!isset($card->max)) {
                continue;
            }
            $max = $card->max;
            if (is_callable($max)) {
                $max = $card->max($playerCount);
            }
            $rest = intval($max - $min);
            for ($i = 0; $i < $rest; $i++) {
                array_push($maxCards, $cardName);
            }
        }

        return array($minCards, $maxCards);
    }

    //static message (updates from ping)
    protected function saveMessage($message, $playId = null) {
        $gameId = $this->gameId;

        $values = array('message' => $message);
        $sql = "UPDATE smltown_plays SET message = :message WHERE status > -1 AND admin != -2";


        if (null != $playId) {
            $sql .= " AND id = $playId";
        } else {
            $sql .= " AND gameId = $gameId";

            //dead users NOTIFICATION
            $this->setNotifications($message, array('status' => -1));
        }

        sql($sql, $values);

        if (null != $playId) {
            $this->updateUsers($playId, "message");
        } else {
            //to all
            $this->updateUsers(null, "message");
            //update messages
            $this->updatePlayers(null, "message");
        }
    }

    protected function pendingVotes() {
//        $gameId = $this->gameId;
        $playId = $this->playId;

        //set selection case as pending message 
        $plays = petition("SELECT id, CASE WHEN sel IS NULL AND status > -1 THEN '1' END AS message FROM smltown_plays WHERE id = $playId")[0];
        $res = array(
            'type' => "update",
            'player' => $plays
        );
        $this->send_response($res);
    }

}
