<?php
include 'log.php';

$pid_file = '/home/reden/sc/burst_pid.txt';

if (file_exists($pid_file)) {
    $pid = file_get_contents($pid_file);
    if ($pid) {
        // Kill the process
        shell_exec("kill " . (int)$pid);
        logAction("Intention burst process with PID $pid stopped.");
    }
    // Delete the PID file
    unlink($pid_file);
}

// Original stop logic
$intention = htmlspecialchars($_POST['intention'] ?? '');

if (empty($intention)) {
    logAction("Intention stopped by the user.");
    logAction("Servitor has stopped amplifying the intention.");
} else {
    logAction("Received non-empty intention at stopping, which is unexpected.");
}

echo "The Servitor has stopped focusing on your intention.";
?>