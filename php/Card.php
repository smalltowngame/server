<?php

include_once 'CardUtils.php';

class Card extends CardUtils {

    //external methods and 'this' implementation
    public function __call($closure, $args) {
        return call_user_func_array($this->{$closure}->bindTo($this), $args);
    }

//    public function __toString() {
//        return call_user_func($this->{"__toString"}->bindTo($this));
//    }

    public function getText() {
        $playId = $this->playId;
        
        $lang = "en";
        $players = petition("SELECT lang FROM smltown_players WHERE id = (SELECT userId FROM smltown_plays WHERE smltown_plays.id = $playId LIMIT 1)");
        if(count($players) > 0){
            $lang = $players[0]->lang;
        }
        
        $text = $this->text;
        if (!isset($text[$lang])) {
            $lang = "en";
        }
        return $text[$lang];
    }
    
    public $text = array();

}
