<?php
// Define the file path
$file_path = 'counter.txt';

// Check if the file exists
if (file_exists($file_path)) {
    // Read the current counter value from the file
    $counter = (int) file_get_contents($file_path);
} else {
    // If the file does not exist, initialize the counter to 0
    $counter = 0;
}

// Increment the counter by one
$counter++;

// Write the updated counter value back to the file
file_put_contents($file_path, $counter);
?>

<!DOCTYPE html>
<html lang="en">
<head>
<title>Intention Repeater Home</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
<link rel="stylesheet" href="./css/styles.css">
<style>
body,h1,h2,h3,h4,h5,h6 {font-family: "Lato", sans-serif}
.w3-bar,h1,button {font-family: "Montserrat", sans-serif}
.justified-text {
  text-align: justify;
}
.player-container {
      max-width: 400px;
      margin: 0 auto;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 15px;
      padding: 20px;
      box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.7);
    }

    .player-title {
      font-size: 1.8em;
      margin-bottom: 15px;
    }

    .player-title a {
      color: #ffa500;
      text-decoration: none;
    }

    .player-title a:hover {
      text-decoration: underline;
    }

    .controls {
      display: flex;
      justify-content: space-around;
      margin-bottom: 10px;
    }

    .controls button {
      background: #ffa500;
      border: none;
      color: #fff;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1em;
      transition: background 0.3s;
    }

    .controls button:hover {
      background: #ff7f00;
    }

    .time-display {
      font-size: 0.9em;
      margin: 10px 0;
    }

    .volume-control {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .volume-control input[type="range"] {
      width: 100px;
    }

    #status {
      margin-top: 10px;
      font-size: 0.9em;
    }
</style>

</head>
<body>

<!-- Navbar -->
<div class="w3-top">
  <div class="w3-bar w3-red w3-card w3-left-align w3-large">
    <!--<a class="w3-bar-item w3-button w3-right w3-padding-large w3-hover-white w3-large w3-red" href="javascript:void(0);" onclick="myFunction()" title="Toggle Navigation Menu"><i class="fa fa-bars"></i></a>-->
    <a href="index.html" class="w3-bar-item w3-button w3-padding-small w3-white">Home</a>
    <a href="repeater_max.html" class="w3-bar-item w3-button w3-padding-small w3-hover-white">MAX</a>
    <a href="repeater_android.html" class="w3-bar-item w3-button w3-padding-small w3-hover-white">Android</a>
    <a href="healing.html" class="w3-bar-item w3-button w3-padding-small w3-hover-white">Healing</a>
	<a href="https://paypal.me/intentionrepeater?locale.x=en_US" target="_blank" class="w3-bar-item w3-button w3-padding-small w3-hover-white">Donate</a>
  </div>

  <!-- Navbar on small screens -->
  <div id="navDemo" class="w3-bar-block w3-white w3-hide w3-large">
    <a href="index.html" class="w3-bar-item w3-button w3-padding-small">Home</a>
    <a href="repeater_max.html" class="w3-bar-item w3-button w3-padding-small">MAX</a>
    <a href="repeater_android.html" class="w3-bar-item w3-button w3-padding-small">Android</a>
	<a href="healing.html" class="w3-bar-item w3-button w3-padding-small">Healing</a>
	<a href="https://paypal.me/intentionrepeater?locale.x=en_US" target="_blank" class="w3-bar-item w3-button w3-padding-large">Donate</a>
  </div>
</div>

<!-- Header -->
<header class="w3-container w3-red w3-center" style="padding:128px 16px">
  <h1 class="w3-margin w3-jumbo">Intention Repeater</h1>
  <p class="w3-xlarge">A Manifesting Tool</p>
  <center>
  <table>
    <tr>
      <td style="text-align: center;"><a href="https://intentionrepeater.boards.net/" target="_blank"><button class="w3-button w3-black w3-padding-large w3-large w3-margin-top">Forum</button></a></td>
      <td style="text-align: center;"><a href="https://www.youtube.com/watch?v=HRmeP5J8E1M" target="_blank"><button class="w3-button w3-black w3-padding-large w3-large w3-margin-top">2,160 QR Code Kit</button></a></td>
      <td style="text-align: center;"><a href="https://servitorconnect.intentionrepeater.com/" target="_blank"><button class="w3-button w3-black w3-padding-large w3-large w3-margin-top">ServitorConnect</button></a></td>
    </tr>
    <tr>
      <td style="text-align: center;"><a href="https://oracle.intentionrepeater.com/" target="_blank"><button class="w3-button w3-black w3-padding-large w3-large w3-margin-top">Oracle</button></a></td>
      <td style="text-align: center;"><a href="https://tarot.intentionrepeater.com/" target="_blank"><button class="w3-button w3-black w3-padding-large w3-large w3-margin-top">Tarot</button></a></td>
      <td style="text-align: center;"><a href="https://www.intentionrepeater.com/Chakras/Chakras.html" target="_blank"><button class="w3-button w3-black w3-padding-large w3-large w3-margin-top">Chakra Info</button></a></td>
    </tr>
    <tr>
    <td style="text-align: center;" colspan="2"><a href="https://www.intentionrepeater.com/IntentionOptimizer/" target="_blank"><button class="w3-button w3-black w3-padding-large w3-large w3-margin-top">Intention Optimizer</button></a></td>
      <td style="text-align: center;" colspan="1"><a href="https://spiritualchat.intentionrepeater.com/" target="_blank"><button class="w3-button w3-black w3-padding-large w3-large w3-margin-top">Spiritual Chat</button></a></td>

  </table>
  </center>
</header>
<center>
    <h5>Intention:
        <textarea id='intention' cols="50" rows="5"></textarea>
      </h5>
      <div>Frequency: 
        <input type="radio" id="3Hz" name="frequency" value="3Hz" checked>
        <label for="3Hz">3Hz - Optimal</label>
        <input type="radio" id="10MHz" name="frequency" value="10MHz">
        <label for="10MHz">10MHz - Fast</label>
        &nbsp;&nbsp;<input type="button" name="btn" id='btn' value="Start" onclick="to_start()">
      </div>
      <div>Note: 3Hz is stronger because it rests in between iterations<br>and allows for expansion. 10MHz is original.</div>
      <div id="n1" class="w3-padding-32"></div>

  </center>
<script type="text/javascript" src="./js/newRepeater.js"></script>
<div class="w3-row-padding w3-light-grey w3-padding-64 w3-container">
  <div class="w3-content">
    <div class="w3-third w3-center">
      <img src="./images/Intention_Repeater_Icon.png">
    </div>

    <div class="w3-twothird">
      <h1>Intention Repeating</h1>
      <h5 class="w3-padding-32 justified-text">The Intention Repeater is a free and open-source application designed to amplify the power of your intentions by repeating them millions of times per second in computer memory. By focusing your thoughts on a specific goal or desire and using the Intention Repeater, you can leverage the principle of repetition to help manifest your desires. This innovative tool aims to support users in achieving their goals and enhancing their personal growth. Try the Intention Repeater today and experience the potential of focused intentions.</h5>

      <p class="w3-text-grey justified-text">The Intention Repeater caters to users with different preferences by offering three distinct versions: a GUI, command-line, and Android version. The command-line program, written in C++, provides a lightweight and efficient solution for users who prefer a text-based interface. It can be easily integrated into scripts or combined with other command-line tools for a customized experience.<BR><BR>
		The GUI provides a graphical interface to the main Intention Repeater MAX program. The Intention Repeater Android app offers a flexible interface, making it accessible to a broader audience. With just a few taps, users can input their intentions and let the app work its magic. All versions of the Intention Repeater are designed to help users focus their intentions and manifest their desires, harnessing the power of repetition to support personal growth and goal achievement.</p>
    <p class="w3-text-grey justified-text">Check out the <a href="repeater_max.html">Intention Repeater MAX Bundle</a> for more powerful free and open-source manifestation software.</p>
    </div>
    </div>
  </div>
</div>
<center>
<div class="player-container">
    <div class="player-title">
      <a href="https://intentionrepeater.boards.net/thread/1077/saguna-brahman-moksha" target="_blank">
        Devotion to Divine Anthro
      </a>
    </div>
    <audio id="audioPlayer" preload="none" src="DivineHeartbeatExtended.mp3"></audio>
    <div class="controls">
      <button id="playBtn">Play</button>
      <button id="pauseBtn">Pause</button>
      <button id="stopBtn">Stop</button>
    </div>
    <div class="time-display" id="timeDisplay">0:00 / 0:00</div>
    <div class="volume-control">
      <label for="volume">Volume:</label>
      <input type="range" id="volume" min="0" max="1" step="0.01" value="1">
    </div>
    <div id="status"></div>
  </div>

  <script>
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const timeDisplay = document.getElementById('timeDisplay');
    const volumeControl = document.getElementById('volume');
    const statusDiv = document.getElementById('status');

    let isFileLoaded = false;

    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function resetPlayer() {
      audio.pause();
      audio.currentTime = 0;
      timeDisplay.textContent = `0:00 / ${formatTime(audio.duration)}`;
      statusDiv.textContent = 'Stopped';
    }

    playBtn.addEventListener('click', () => {
      if (!isFileLoaded) {
        audio.load();
        isFileLoaded = true;
      }
      audio.play();
      statusDiv.textContent = 'Playing';
    });

    pauseBtn.addEventListener('click', () => {
      audio.pause();
      statusDiv.textContent = 'Paused';
    });

    stopBtn.addEventListener('click', () => {
      resetPlayer();
    });

    volumeControl.addEventListener('input', () => {
      audio.volume = volumeControl.value;
    });

    audio.addEventListener('timeupdate', () => {
      timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    });

    audio.addEventListener('loadedmetadata', () => {
      timeDisplay.textContent = `0:00 / ${formatTime(audio.duration)}`;
    });

    audio.addEventListener('ended', () => {
      resetPlayer();
      statusDiv.textContent = 'Playback ended';
    });
  </script>
<BR>

<iframe width="560" height="315" src="https://www.youtube.com/embed/3lfnR7OhZY8?si=rfSlo0R-XDrCcxHg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</center>

<div class="w3-container w3-black w3-center w3-opacity w3-padding-64">
    <h1 class="w3-margin w3-medium">"The starting point of all achievement is desire. Keep this constantly in mind.<BR> Weak desires bring weak results, just as a small amount of fire makes a small amount of heat." - Napoleon Hill</h1>
</div>

<!-- Footer -->
<footer class="w3-container w3-padding-64 w3-center w3-opacity">  
  <div class="w3-xlarge w3-padding-32">
    <a href="https://www.facebook.com/IntentionRepeater"><i class="fa fa-facebook-official w3-hover-opacity"></i></a>&nbsp;
	<a href="https://www.youtube.com/channel/UCqRaWtbzpxwNAsgirUI7hCw"><i class="fa fa-youtube w3-hover-opacity"></i>
 </div>
 <p>Powered by <a href="https://www.w3schools.com/w3css/default.asp" target="_blank">w3.css</a></p>
</footer>

<script>
// Used to toggle the menu on small screens when clicking on the menu button
function myFunction() {
  var x = document.getElementById("navDemo");
  if (x.className.indexOf("w3-show") == -1) {
    x.className += " w3-show";
  } else { 
    x.className = x.className.replace(" w3-show", "");
  }
}
</script>

</body>
</html>
