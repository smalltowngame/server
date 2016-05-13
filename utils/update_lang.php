<?php

include_once dirname(__FILE__) . '/error.php';

function updateFile($langFileName, $text = null) {
    if (strstr($text, "\n")) {
        echo "new lines \n on for lang text: '$text'";
        return;
    }
    $langFile = file($langFileName);

    $folder = dirname($langFileName);
    $enFileName = $folder . "/en.js";
    $enFile = file($enFileName);

    //check exists what u want (in EN file)
    if (isset($text)) {
        if (strpos(file_get_contents($enFileName), " $text:") === false) {
            error("warn: Key '$text' hasn't translation on english lang file.");
            if (strpos($text, "'") !== false || strpos($text, '"') !== false) {
                error("can't save quotes string on lang file");
                return;
            }

            //add TODO translation
            //always between ' ' to prevent any posible error
            $newEnLine = ", \n '$text': null //TODO \n }";
            $str = file_get_contents($enFileName);
            $str = str_replace("}", "$newEnLine", $str);
            $length = file_put_contents($enFileName, $str);
            if (0 == $length) {
                error("warn: EN LANG file NOT WRITABLE");
            }
        }
    }
    //

    if ($langFileName == $enFileName) {
        return;
    }

    //OTHER LANGUAGES NOT ENGLISH

    $tempFilename = "$folder/temp.js";
    $tempFile = fopen($tempFilename, "w");
    copy($enFileName, $tempFilename);
    foreach ($enFile as $line) {

        $posPart = strpos($line, '"');
        $valuePart = substr($line, 0, $posPart);
        $equalsPosition = strrpos($valuePart, ":");
        if (!$equalsPosition) {
            fwrite($tempFile, $line);
            continue;
        }

        $key = substr($line, 0, $equalsPosition);

        //GET ORIGINAL LINE
        $completeLine = null;
        foreach ($langFile as $actualLine) {
            //find value in LANG file for key found on EN   
            if (preg_match("/$key\s*:/", $actualLine)) {
                $completeLine = $actualLine;
                break;
            }
        }

        if (!isset($completeLine)) {

            $text = "$key: null";
            //not in english yet
            if (!strpos($line, "null")) {
                //not translated yet
                $value = substr($line, $equalsPosition + 1);
                preg_match('~\"(.*?)\"~', $value, $result);
                $text = "$key: \"$result[1]\" //TRANSLATE FROM ENGLISH//////////////";
            }
            //echo $text;
            $text .= "\n"; // important: \n prevents double comma bug

            fwrite($tempFile, $text);
            continue;
        }

        fwrite($tempFile, $completeLine);
    }

    fclose($tempFile);
    rename($tempFilename, $langFileName);
}
