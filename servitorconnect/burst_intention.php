<?php
// burst_intention.php

if ($argc < 3) {
    echo "Usage: php burst_intention.php <intention> <repeats>\n";
    exit(1);
}

$intention = $argv[1];
$repeats = (int)$argv[2];

for ($i = 0; $i < $repeats; $i++) {
    // Use curl to send the intention to send_intention.php
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://localhost/send_intention.php");
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['intention' => $intention]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
}
?>