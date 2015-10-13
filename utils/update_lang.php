<?php

//updateFile("../lang/es.js");

function updateFile($langFileName, $text = null) {
    $langFile = file($langFileName);

    $folder = dirname($langFileName);
    $enFileName = $folder . "/en.js";
    $enFile = file($enFileName);

    //check exists what u want (in EN file)
    if (isset($text)) {
        if (strpos(file_get_contents($enFileName), " $text:") === false) {
            file_put_contents("utils/smltown.log",
                    //
                    date('[d-m-Y H:i:s]') . " warn: Key '$text' hasn't translation on english lang file. \n",
                    //
                    FILE_APPEND | LOCK_EX);

            //add TODO translation
            if (preg_match('/\s/', $text)) {
                $text = "'$text'";
            }
            $newEnLine = ", \n $text: null //TODO \n }";
            $str = file_get_contents($enFileName);
            $str = str_replace("}", "$newEnLine", $str);
            file_put_contents($enFileName, $str);
        }
    }
    //

    if ($langFileName == $enFileName) {
        return;
    }

    //OTHER LANGUAGES THAN ENGLISH

    $newFilename = "$folder/temp.js";
    $newFile = fopen($newFilename, "w");
    copy($enFileName, $newFilename);

    foreach ($enFile as $line) {

        $equals = strpos($line, ":");
        if (!$equals) {
            fwrite($newFile, $line);
            continue;
        }

        $key = substr($line, 0, $equals);

        //GET ORIGINAL LINE
        $completeLine = null;
        foreach ($langFile as $actualLine) {
            //find value in LANG file for key found on EN           
            if(preg_match("/$key\s*:/", $actualLine)){
                $completeLine = $actualLine;
                break;
            }
        }

        if (!isset($completeLine)) {

            $text = "$key: null";
            //not in english yet
            if (!strpos($line, "null")) {
                //not translated yet
                $value = substr($line, $equals + 1);
                preg_match('~\"(.*?)\"~', $value, $result);
                $text = "$key: \"$result[1]\" //TRANSLATE FROM ENGLISH//////////////";
            }
            echo $text;
            $text .= "\n"; // important: \n prevents double comma bug

            fwrite($newFile, $text);
            continue;
        }

        fwrite($newFile, $completeLine);
    }

    fclose($newFile);
    rename($newFilename, $langFileName);
}
