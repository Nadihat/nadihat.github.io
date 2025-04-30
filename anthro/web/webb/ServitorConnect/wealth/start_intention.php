<?php
// Define the file name where the visitor count is stored
$filename = 'visitor_count.txt';

// Check if the file exists
if (!file_exists($filename)) {
    // If the file does not exist, create it and initialize the count to 1
    $count = 1;
    file_put_contents($filename, $count);
} else {
    // Open the file in read/write mode
    $file = fopen($filename, 'c+');
    if (flock($file, LOCK_EX)) {
        // Lock the file for writing
        $count = (int) fread($file, filesize($filename));
        $count++;
        // Move the file pointer back to the beginning before writing
        ftruncate($file, 0);
        rewind($file);
        fwrite($file, $count);
        fflush($file);
        flock($file, LOCK_UN); // Release the lock
    }
    fclose($file);
}

$intention = htmlspecialchars($_POST['intention']); // Capture the intention from the POST request

// Symbolically connect to the Servitor and pass the intention
// Log or process the intention as needed
// logAction("Servitor amplifying intention: $intention");

echo "Your intention has been sent to the Servitor for amplification.";
?>
