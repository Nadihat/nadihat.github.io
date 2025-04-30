<?php
function generateRandomYouTubeLink() {
    $apiKey = 'AIzaSyBJO2g3m82RHWoxnp3qDVK0VPSuEmbsYLs'; // Replace with your YouTube Data API v3 key
    $randomOrgApiKey = '896e6560-7d92-441f-85a0-d3c635a4290c'; // Replace with your RANDOM.ORG API key
    
    $videoIds = [];
    
    // Keep generating random search queries until we find at least one video
    while (empty($videoIds)) {
        // Generate random search query
        $searchQuery = generateRandomSearchQuery($randomOrgApiKey);

        // Search for videos matching the random query
        $videoIds = searchYouTubeVideos($apiKey, $searchQuery);
    }

    // Pick a random one from the found videos
    $randomIndex = getRandomIndex($randomOrgApiKey, count($videoIds));
    $videoId = $videoIds[$randomIndex];
    
    return $videoId;
}

function getRandomWords($randomOrgApiKey, $numWords) {
    // Read the wordlist from the file into an array
    $wordlist = file("wordlist.txt", FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    $totalWords = count($wordlist); // Get the total number of words in the wordlist
    $randomWords = [];

    // Use random.org for selecting a random index within the wordlist size
    for ($i = 0; $i < $numWords; $i++) {
        // Generate a random number between 0 and the total number of words - 1
        $randomIndex = getRandomNumberFromRandomOrg($randomOrgApiKey, 0, $totalWords - 1); // Ideally this is where random.org's API would be used
        // Select the word at the random index and add it to the result array
        $randomWords[] = $wordlist[$randomIndex];
    }

    return $randomWords;
}

function generateRandomSearchQuery($randomOrgApiKey) {
    // Get a random number of words (1-8) from RANDOM.ORG
    $numWords = getRandomNumberFromRandomOrg($randomOrgApiKey, 1, 7);

    // Select a random number of words from the wordlist
    $randomWords = getRandomWords($randomOrgApiKey, $numWords);

    // Create the search query by joining the words with spaces
    return implode(' ', $randomWords);
}

function getRandomNumberFromRandomOrg($randomOrgApiKey, $min, $max) {
    // Prepare JSON-RPC request for RANDOM.ORG to get a single random number
    $request = [
        'jsonrpc' => '2.0',
        'method' => 'generateIntegers',
        'params' => [
            'apiKey' => $randomOrgApiKey,
            'n' => 1,
            'min' => $min,
            'max' => $max,
            'replacement' => true,
        ],
        'id' => 1,
    ];

    // Get the response from RANDOM.ORG API
    $response = getRandomOrgResponse($request);
    $data = json_decode($response, true);

    if ($data && isset($data['result'])) {
        return $data['result']['random']['data'][0];
    } else {
        throw new Exception('Failed to get random number from RANDOM.ORG.');
    }
}

function searchYouTubeVideos($apiKey, $searchQuery, $maxResults = 10) {
    $apiUrl = 'https://www.googleapis.com/youtube/v3/search';
    $params = [
        'key' => $apiKey,
        'q' => $searchQuery,
        'type' => 'video',
        'part' => 'id',
        'maxResults' => $maxResults,
        'safeSearch' => 'none',
    ];
    $urlWithParams = $apiUrl . '?' . http_build_query($params);

    $response = getApiResponse($urlWithParams);
    $data = json_decode($response, true);

    if (isset($data['items']) && count($data['items']) > 0) {
        $videoIds = [];
        foreach ($data['items'] as $item) {
            $videoIds[] = $item['id']['videoId'];
        }
        return $videoIds;
    } else {
        // No videos found for this query
        return [];
    }
}

function getRandomIndex($apiKey, $maxValue) {
    if ($maxValue <= 0) {
        throw new Exception("Invalid range for random index generation. maxValue must be greater than 0.");
    }

    // Prepare JSON-RPC request for RANDOM.ORG
    $request = [
        'jsonrpc' => '2.0',
        'method' => 'generateIntegers',
        'params' => [
            'apiKey' => $apiKey,
            'n' => 1,
            'min' => 0,
            'max' => $maxValue - 1, // Ensure this is positive
            'replacement' => true,
        ],
        'id' => 42,
    ];

    // Get the response from RANDOM.ORG API
    $response = getRandomOrgResponse($request);
    $data = json_decode($response, true);

    if ($data && isset($data['result'])) {
        return $data['result']['random']['data'][0];
    } else {
        $errorMsg = isset($data['error']['message']) ? $data['error']['message'] : 'Failed to retrieve random numbers from RANDOM.ORG API';
        throw new Exception($errorMsg);
    }
}


function getRandomOrgResponse($request) {
    $ch = curl_init('https://api.random.org/json-rpc/4/invoke');

    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($request));

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        throw new Exception('cURL Error: ' . curl_error($ch));
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($httpCode != 200) {
        $responseBody = json_decode($response, true);
        $errorMessage = isset($responseBody['error']['message']) ? $responseBody['error']['message'] : 'Unknown error';
        throw new Exception('RANDOM.ORG API request failed with HTTP Code ' . $httpCode . ': ' . $errorMessage);
    }

    curl_close($ch);

    return $response;
}

function getApiResponse($url) {
    $ch = curl_init($url);

    // Set cURL options
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        throw new Exception('cURL Error: ' . curl_error($ch));
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($httpCode != 200) {
        $responseBody = json_decode($response, true);
        $errorMessage = isset($responseBody['error']['message']) ? $responseBody['error']['message'] : 'Unknown error';
        throw new Exception('API request failed with HTTP Code ' . $httpCode . ': ' . $errorMessage);
    }

    curl_close($ch);

    return $response;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Truly Random YouTube Video Generator</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f2f5;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 90%;
            max-width: 800px;
            margin: 50px auto;
            text-align: center;
        }
        h1 {
            color: #ff0000;
            margin-bottom: 20px;
        }
        p {
            font-size: 1.1em;
            margin-bottom: 30px;
        }
        form {
            margin-bottom: 40px;
        }
        input[type="submit"] {
            background-color: #ff0000;
            color: #fff;
            border: none;
            padding: 15px 30px;
            font-size: 1em;
            cursor: pointer;
            border-radius: 5px;
            transition: background-color 0.3s ease;
        }
        input[type="submit"]:hover {
            background-color: #cc0000;
        }
        .video-container {
            margin-bottom: 40px;
        }
        iframe {
            width: 100%;
            max-width: 100%;
            height: 450px;
            border: none;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .video-container h2 {
            margin-top: 0;
        }
        .video-container a {
            text-decoration: none;
            color: #ff0000;
            font-weight: bold;
        }
        .video-container a:hover {
            text-decoration: underline;
        }
        .info {
            background-color: #fff;
            padding: 20px;
            border-top: 3px solid #ff0000;
            border-radius: 0 0 10px 10px;
        }
        .info p {
            margin: 0;
            line-height: 1.6;
        }
        .error-message {
            color: #ff0000;
            font-weight: bold;
            margin-bottom: 20px;
        }
        /* Responsive Styles */
        @media (max-width: 600px) {
            input[type="submit"] {
                width: 100%;
                padding: 15px;
            }
            iframe {
                height: 250px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Truly Random YouTube Video Generator</h1>
        <p>Click the button below to generate a truly random YouTube video!</p>
        <form method="post">
            <input type="submit" name="generate" value="Generate Truly Random YouTube Video">
        </form>

        <?php
        if (isset($_POST['generate'])) {
            try {
                $videoId = generateRandomYouTubeLink();
                if ($videoId === null) {
                    echo '<p class="error-message">No videos found. Please try again.</p>';
                } else {
                    $videoUrl = 'https://www.youtube.com/watch?v=' . $videoId;

                    echo '<div class="video-container">';
                    echo '<h2>Truly Random YouTube Video</h2>';
                    echo '<iframe src="https://www.youtube.com/embed/' . htmlspecialchars($videoId) . '" frameborder="0" allowfullscreen></iframe>';
                    echo '<p><a href="' . htmlspecialchars($videoUrl) . '" target="_blank">Watch on YouTube</a></p>';
                    echo '</div>';
                }
            } catch (Exception $e) {
                echo '<p class="error-message">Error: ' . htmlspecialchars($e->getMessage()) . '</p>';
                echo '<p class="error-message">No videos found. Please try again.</p>';
            }
        }
        ?>

        <div class="info">
            <p><strong>About This Project:</strong><br><br>
            RANDOM.ORG generates true random numbers by capturing atmospheric noise, ensuring that each search query or video selection is completely unpredictable.
            This randomness is superior to algorithm-based methods, as it provides genuine entropy.
            By using RANDOM.ORG's random numbers to generate search terms or select videos,
            the application guarantees that the video choices are not influenced by any patterns or algorithms,
            making the selection process as random and unbiased as possible.
            This creates a YouTube Search term of up to 7 words from a list of 6,314 words, and selects them randomly using RANDOM.ORG.
        </p>
        </div>
    </div>
</body>
</html>
