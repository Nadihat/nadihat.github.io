<?php
include 'log.php';

$intention = htmlspecialchars($_POST['intention']);
$burstRepeats = (int)($_POST['burstRepeats'] ?? 0);

if ($burstRepeats > 0) {
    // Command to execute the burst script in the background
    $command = "php /home/reden/sc/burst_intention.php " . escapeshellarg($intention) . " " . $burstRepeats . " > /dev/null 2>&1 & echo $!";
    
    // Execute the command and get the process ID
    $pid = shell_exec($command);

    // Save the PID to a file so we can stop it later
    file_put_contents('/home/reden/sc/burst_pid.txt', $pid);

    logAction("Intention burst started with PID $pid for $burstRepeats repeats.");
    echo "Your intention has been sent to the Servitor for amplification with $burstRepeats burst repeats per hour.";
} else {
    // Original behavior if burst repeats is 0 or not set
    logAction("Intention started: user started an intention.");
    // Symbolically connect to the Servitor and pass the intention
    logAction("Servitor amplifying intention (intention not logged).");
    echo "Your intention has been sent to the Servitor for amplification.";
}
?>