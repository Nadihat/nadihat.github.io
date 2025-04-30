<?php
// Start the session at the very beginning
session_start();

// Define the file name where the visitor count is stored
$filename = 'visitor_count.txt';

// Check if the file exists
if (!file_exists($filename)) {
    // If the file does not exist, create it and initialize the count to 1
    $count = 1;
    file_put_contents($filename, $count);
} else {
    // If the file exists, read the current count
    $count = (int) file_get_contents($filename);
    // Increment the count
    $count++;
    // Write the updated count back to the file
    file_put_contents($filename, $count);
}

// Enable error reporting to help with debugging (you can disable this in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Function to load the .env file manually
function loadEnvFile($filePath) {
    if (!file_exists($filePath)) {
        throw new Exception('.env file not found');
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;  // Ignore comments
        }

        // Ensure that the line contains an '=' character
        if (strpos($line, '=') === false) {
            continue;
        }

        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
        }
    }
}

try {
    // Load the .env file
    loadEnvFile(__DIR__ . '/.envhBf5ReFdS');
    if (!isset($_ENV['OPENAI_API_KEY'])) {
        throw new Exception('OPENAI_API_KEY not set in .env file');
    }
    $apiKey = $_ENV['OPENAI_API_KEY'];  // Get the API key from the .env file
} catch (Exception $e) {
    die('Error: ' . $e->getMessage());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get the user's input from the form
    $userInput = isset($_POST['intention']) ? trim($_POST['intention']) : '';

    if (empty($userInput)) {
        echo json_encode(['intention' => 'Error: No input provided.']);
        exit();
    }

    // Current timestamp in seconds
    $currentTime = time();

    // Retrieve last request time and cached response from the session
    $lastRequestTime = isset($_SESSION['last_request_time']) ? $_SESSION['last_request_time'] : 0;
    $cachedIntention = isset($_SESSION['cached_intention']) ? $_SESSION['cached_intention'] : '';

    // Check if the last request was made within the last 5 seconds
    if (($currentTime - $lastRequestTime) < 5 && !empty($cachedIntention)) {
        // Return the cached response
        echo json_encode(['intention' => $cachedIntention]);
        exit();
    }

    // Proceed to make the API call since the rate limit has not been exceeded
    $apiUrl = "https://api.openai.com/v1/chat/completions";
    
    $data = [
        'model' => 'gpt-4o-mini',  // Specify the gpt-4o-mini model
        'messages' => [
            ['role' => 'system', 'content' => 'You are an expert at writing intentions.'],
            ['role' => 'user', 'content' => "Based on the following input: \"$userInput\", write an optimized intention that is a couple of sentences long in the same language."]
        ],
        'max_tokens' => 200,
        'temperature' => 0.7,  // Optional parameter to control randomness
    ];

    // Use cURL to make the API request
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ]);
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        // Return cURL error
        $errorMessage = 'Error: ' . curl_error($ch);
        echo json_encode(['intention' => $errorMessage]);
    } else {
        if ($httpCode == 200) {
            $responseDecoded = json_decode($response, true);

            if (isset($responseDecoded['error'])) {
                // Return API error
                $apiError = 'API Error: ' . $responseDecoded['error']['message'];
                echo json_encode(['intention' => $apiError]);
            } else {
                // Extract the optimized intention from the assistant's response
                $optimizedIntention = isset($responseDecoded['choices'][0]['message']['content']) ? trim($responseDecoded['choices'][0]['message']['content']) : 'Error in generating intention';
                // Update the session with the new response and timestamp
                $_SESSION['last_request_time'] = $currentTime;
                $_SESSION['cached_intention'] = $optimizedIntention;
                echo json_encode(['intention' => $optimizedIntention]);
            }
        } else {
            // Return an error response if the API call was not successful
            $httpError = 'Error: Received HTTP status code ' . $httpCode;
            echo json_encode(['intention' => $httpError]);
        }
    }

    curl_close($ch);
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intention Optimizer</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        input, textarea, button { width: 100%; padding: 10px; margin: 10px 0; }
        textarea { resize: none; }
        .button {
            display: inline-block;
            text-align: center;
            vertical-align: middle;
            padding: 12px 24px;
            border: 1px solid #258f8f;
            border-radius: 8px;
            background: #3ce9e9;
            background: -webkit-gradient(linear, left top, left bottom, from(#3ce9e9), to(#258f8f));
            background: -moz-linear-gradient(top, #3ce9e9, #258f8f);
            background: linear-gradient(to bottom, #3ce9e9, #258f8f);
            -webkit-box-shadow: #37d7d7 0px 0px 40px 0px;
            -moz-box-shadow: #37d7d7 0px 0px 40px 0px;
            box-shadow: #37d7d7 0px 0px 40px 0px;
            text-shadow: #175a5a 1px 1px 1px;
            font: normal normal bold 20px times new roman;
            color: #ffffff;
            text-decoration: none;
            cursor: pointer;
        }
        .button:hover,
        .button:focus {
            border: 1px solid #2eb3b3;
            background: #48ffff;
            background: -webkit-gradient(linear, left top, left bottom, from(#48ffff), to(#2cacac));
            background: -moz-linear-gradient(top, #48ffff, #2cacac);
            background: linear-gradient(to bottom, #48ffff, #2cacac);
            color: #ffffff;
            text-decoration: none;
        }
        .button:active {
            background: #258f8f;
            background: -webkit-gradient(linear, left top, left bottom, from(#258f8f), to(#258f8f));
            background: -moz-linear-gradient(top, #258f8f, #258f8f);
            background: linear-gradient(to bottom, #258f8f, #258f8f);
        }
        .button:before{
            content:  "\0000a0";
            display: inline-block;
            height: 24px;
            width: 24px;
            line-height: 24px;
            margin: 0 4px -6px -4px;
            position: relative;
            top: 0px;
            left: 0px;
            background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAC70lEQVRIibWWTUwTQRiGn91uoZTSQtVWBLQqESUx2oixGD35b0j0IAeinvTmhasmHIwHbv4kxpse1BhjvBj/MUYNmqCCEUQ0HgytEVoCamt/lm7b8VC6LbIlivImk51v3uz7zjf7zc5IALR32YC9wEZgKbAYcAGVgA0oARRAJovUVFOBOBABvgFjQAB4gRB3OLcrLtHe5QJeAh7+L4aATTKwfx7EARqBFhnwzoN4Ds0KsKQYu2VFJWurK2aMpzIZBkaivAqEEWJWA48CLCzGduxcwc6GBYacEHCzP8TBq+/Q0kVdnDJgN2JKFZkNtXkqoaUJqylULQOAJEHrejeHNlTPloFdBqxGTIPLyoJysx7vu9iP88RTPKe6+TyR0MfX185cwgLYZMBixDR7KvW+qmXoDUTICEHoZ5JgZFLnRsNJ9jYupMZRaiRjlcluohnY7HHo/ffBKD9UDbNJ4qivBt8Up6UFtwbHOLDOzeEmw1opUf4kgzWLyxnu2EqpIuOuyM/nzDM/sWSa1nVuzj//8ucGi2wl1C/Kfxqr2cTSKpMeR9QUnY+HOd8d4PZRL7ZSE2+//jQysCjGs3cgFcRHrg8RTmgIYDym0fclwmpXOU+ONdFUZ8f/XeXW4JiRFAqQnHoWGOSXJxiZ5ErvCMe3L6fMbKKqTOH0vlV4ayuQJYmJuEbb5QG9fH9DMmcwrVSbCz5wjz+Mx1nGyd0rmYhppDMCAXwMxXn0aYLTT/0EvquGswfUnIGOMrMJb02+tnv8YXzLHMSSaTynuolOpouJFc0gXjiSymTwnX2lx1/Dk3S21DM4Gv1bcT2DaQZaWvAhFEOWJC61NeK0mvEtc3DtTfBvxQHiCtnTaAbsFhN1lRZkSeJ9MMb9D+NzMYgogOGbPxIptl3om4toIcZlYORfVWbBZxl4PY8GT2SEuAH0zoN4F0Lcy/4R2h+WgNQC7AHqyZ5ydrIbMHdlyTXI7p0k+auLSv7q8gm4C9IDzu5I/QLI+fuoeSkJUQAAAABJRU5ErkJggg==") no-repeat left center transparent;
            background-size: 100% 100%;
        }
    </style>
</head>
<body>

<h1>Enter Your Intention</h1>
<form id="intentionForm">
    <label for="intention">Your Intention or Keywords:</label>
    <input type="text" id="intention" name="intention" required>
    <button type="submit">Submit</button>
</form>

<h2>Optimized Intention</h2>
<textarea id="output" readonly rows="3" style="overflow:hidden;"></textarea>

<script>
    document.getElementById('intentionForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const userInput = document.getElementById('intention').value.trim();

        if (userInput === "") {
            alert("Please enter your intention or keywords.");
            return;
        }

        // Make an AJAX request to the PHP backend
        fetch('', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ intention: userInput })
        })
        .then(response => response.json())
        .then(data => {
            const outputElement = document.getElementById('output');
            outputElement.value = data.intention; // Display the optimized intention
            resizeTextarea(outputElement); // Resize the textarea to fit content
        })
        .catch(error => {
            document.getElementById('output').value = 'Error: ' + error;
        });
    });

    // Function to resize the textarea based on its content
    function resizeTextarea(textarea) {
        textarea.style.height = 'auto'; // Reset height to auto
        textarea.style.height = (textarea.scrollHeight) + 'px'; // Set new height based on scroll height
    }
</script>
<br><center><a class="button" href="https://www.paypal.com/paypalme/intentionrepeater">Donate</a></center>
</body>
</html>
