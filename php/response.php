<?php

trait Response {

// RESPONSE PETITIONS
    protected function updateAll($playId) {
        $user = $this->getUserInfo($playId);
        $players = $this->getInfoPlayers();
        $game = $this->getGameInfo();

        $res = array(
            'type' => "update",
            'user' => $user,
            'players' => $players,
            'game' => $game,
            'cards' => $this->getRules()
        );
        //echo json_encode($res);
        $this->send_response(json_encode($res), $playId);
    }

    protected function updateUsers($playId = null, $select = null) { //way to update sensitive data for every playerç
        $gameId = $this->gameId;

        $res = array(
            'type' => "update"
        );

        if (!$playId) { //update all users
            $plays = petition("SELECT id FROM smltown_plays WHERE gameId = $gameId"); //get all players
            for ($i = 0; $i < count($plays); $i++) {
                $uniqueRes = $res;
                $playId = $plays[$i]->id;
                $uniqueRes['user'] = $this->getUserInfo($playId, $select);
                $this->send_response(json_encode($uniqueRes), $playId);
            }
            return;
        }

        $res['user'] = $this->getUserInfo($playId, $select);
        $this->send_response(json_encode($res), $playId);
    }

    protected function updatePlayers($playId = null, $selects = null) {
        $res = array(
            'type' => "update",
            'players' => $this->getInfoPlayers($selects, $playId)
        );
        $this->send_response(json_encode($res), $playId);
    }

    protected function updatePlayer($playId, $selects = null) {
        $res = array(
            'type' => "update",
            'player' => $this->getInfoPlayer($selects, $playId)
        );
        $this->send_response(json_encode($res)); //to all
    }

    protected function updateGame($playId = null, $array = null) {
        $game = $this->getGameInfo($playId, $array);
        $res = array(
            'type' => "update",
            'game' => $game
        );
        $this->send_response(json_encode($res), $playId);
    }

    protected function updateRules($playId = null) {
        $res = array(
            'type' => "update",
            'cards' => $this->getRules($playId)
        );
        $this->send_response(json_encode($res), $playId);
    }

// SQL
    protected function getUserInfo($playId, $select = null) {
        $sql = "SELECT ";
        if ($select) {
            $sql .= selectArray($select);
        } else {
            $sql .= "smltown_plays.id, userId, admin, card, sel, rulesJS, message";
        }
        $user = petition("$sql FROM smltown_plays WHERE id = $playId");
        if (count($user) > 0) {
            return $user[0];
        }
    }

    protected function getInfoPlayers($select = null, $playId = null) { //of all
        $gameId = $this->gameId;

        $sql = "SELECT smltown_plays.id, ";

        if ($select) { //array values function
            if ($select == "card") {
                $sql .= "CASE WHEN status < 0 THEN card END AS card";
            } else if ($select == "message") {
                //not tell if message when is night player turn
                $sql .= $this->getMessageCase($gameId);
            } else {
                $sql .= selectArray($select);
            }
            //
            //full request
        } else {
            $sql .= " name, admin"
                    //plays.sel when openVoting
                    . ", CASE WHEN 1 = (SELECT openVoting FROM smltown_games WHERE id = $gameId) THEN sel END AS sel"
                    //status 1 when is 0
                    . ", CASE WHEN status > -1 AND 'end' <> (SELECT night FROM smltown_games WHERE id = $gameId) THEN 1 ELSE status END AS status"
                    //message if not playing night (else null)
                    . "," . $this->getMessageCase($gameId)
                    //CARD if DEAD
                    . ", CASE WHEN status = -1";

            //CARD if game is ENDED
            if (isset($this->TURNS)) {
                $sql .= " OR (SELECT status FROM smltown_games WHERE id = $gameId) = " . count($this->TURNS);
            }

            if (null != $playId && !is_array($playId)) { //same user cards
                //CARD if is night same player
                $sql .= " OR (card = (SELECT night FROM smltown_games WHERE id = $gameId)"
                        . "AND smltown_plays.id = $playId) ";
            }
            $sql .= " THEN card ELSE NULL END as card";
        }
        $sql .= " FROM smltown_plays"
                //add players name table
                . " LEFT OUTER JOIN smltown_players"
                . " ON smltown_plays.userId = smltown_players.id"
                //
                . " WHERE gameId = $gameId ";
        $values = array();
        if (is_array($playId)) { //not userId but wheres
            $wheres = $playId;
            foreach ($wheres as $name => $value) {
                $sql .= " AND $name = :$name";
                $values[$name] = $value;
            }
        }

        return petition($sql, $values);
    }

    protected function getInfoPlayer($select = null, $playId) {
        $gameId = $this->gameId;

        $sql = "SELECT smltown_plays.id, ";

        if ($select) { //array values function
            if ($select == "card") {
                $sql .= "CASE WHEN status < 0 THEN card END AS card";
            } else if ($select == "message") {
                $sql .= $this->getMessageCase($gameId);
            } else {
                $sql .= selectArray($select);
            }
            //
            //full request
        } else {
            $sql .= " name, admin"
                    //plays.sel when openVoting
                    . ", CASE WHEN 1 = (SELECT openVoting FROM smltown_games WHERE id = $gameId) THEN sel END AS sel"
                    //status 1 when is 0
                    . ", CASE WHEN status > -1 AND 'end' <> (SELECT night FROM smltown_games WHERE id = $gameId) THEN 1 ELSE status END AS status"
                    //message if not playing night
                    . "," . $this->getMessageCase($gameId)
                    //CARD if DEAD
                    . ", CASE WHEN status = -1";

            //CARD if game is ENDED
            $sql .= " OR (SELECT status FROM smltown_games WHERE id = $gameId) = " . count($this->trns);

            //CARD if is night same player
            $sql .= " OR (card = (SELECT night FROM smltown_games WHERE id = $gameId)"
                    . "AND smltown_plays.id = '$playId') ";

            $sql .= " THEN card ELSE NULL END as card";
        }
        $sql .= " FROM smltown_plays"
                //add players name table
                . " LEFT OUTER JOIN smltown_players"
                . " ON smltown_plays.userId = smltown_players.id"
                //
                . " WHERE smltown_plays.id = '$playId' AND gameId = $gameId ";

        $plays = petition($sql);
        if (count($plays) > 0) {
            return $plays[0];
        }
        echo " error: playId = $playId ";
    }

    protected function getGameInfo($playId = null, $array = null) {
        $gameId = $this->gameId;

        $sql = "SELECT ";
        if ($array) { //array values function
            $sql .= selectArray($array);
            //full request
        } else {
            $sql .= " id,name,password,type,status,timeStart,time,dayTime,openVoting,endTurn,cards";
            if ($playId) {
                $sql .= ","
                        . " CASE WHEN" //is night
                        . " (SELECT card FROM smltown_plays WHERE id = $playId AND gameId = $gameId) = night"
                        . " AND 0 = (SELECT count(*) FROM smltown_plays WHERE message > '') "
                        . " THEN night END AS night";
            }
        }

        $games = petition("$sql FROM smltown_games WHERE id = $gameId");

        if (count($games) > 0) { //exists
            $game = $games[0];
            if (isset($game->time) && !empty($game->time)) { //let 0 time
                $game->time -= microtime(true); //unify time users
            }
            return (object) array_filter((array) $game, "nullFilter"); //remove nulls but not 0
        }
        return false;
    }

    // CASE VALUES
    protected function getMessageCase($gameId) {
        //not tell if message when is night player turn
        return " CASE WHEN (card IS NULL OR (SELECT night FROM smltown_games WHERE id = $gameId) IS NULL OR card != (SELECT night FROM smltown_games WHERE id = $gameId)) "
                . "AND message > '' THEN 1 END AS message ";
    }

}
