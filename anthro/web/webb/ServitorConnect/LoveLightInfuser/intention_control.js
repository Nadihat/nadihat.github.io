document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('intentionForm');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const hawkinsLevel = document.getElementById('hawkinsLevel');
    const intentionStatus = document.getElementById('intentionStatus');
    const statusText = document.getElementById('statusText');

    form.addEventListener('submit', function (e) {
        e.preventDefault(); // Prevent form submission to refresh the page

        // Disable the slider and start button
        hawkinsLevel.disabled = true;
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline';
        
        // Show status
        intentionStatus.classList.remove('hidden');
        statusText.textContent = "Infusing Love/Light to You";

        // Send the intention to the server
        const hawkinsValue = hawkinsLevel.value;
        const intention = `A private, personal, energy bubble of ${hawkinsValue} Hawkins Level holds the intention 'I am filled with Love/Light of Creator to the optimal level for me.' and automatically reposts to the servitor at an optimal time interval.`;

        fetch('start_intention.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `intention=${encodeURIComponent(intention)}`
        })
        .then(response => response.text())
        .then(data => {
            console.log(data); // Handle success response
        })
        .catch(error => {
            console.error('Error:', error); // Handle error response
        });
    });

    stopBtn.addEventListener('click', function () {
        // Enable the slider and switch buttons
        hawkinsLevel.disabled = false;
        startBtn.style.display = 'inline';
        stopBtn.style.display = 'none';
        
        // Hide the status
        intentionStatus.classList.add('hidden');

        // Stop the intention on the server
        fetch('stop_intention.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'intention='
        })
        .then(response => response.text())
        .then(data => {
            console.log(data); // Handle stop success
        })
        .catch(error => {
            console.error('Error:', error); // Handle stop error
        });
    });
});
