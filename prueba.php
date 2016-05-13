<?php

$myfile = fopen("prueba.html", "w");
fwrite($myfile, "este es una prueba");
fclose($myfile);
