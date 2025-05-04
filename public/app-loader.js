async function loadApps() {
    const appContainer = document.querySelector('.button-container');
    const errorContainer = document.getElementById('uv-error');
    const errorCode = document.getElementById('uv-error-code');

    // List of applications with their URLs
    const apps = [
        { url: 'https://puter.com', title: 'Puter' },
        { url: 'https://discord.com/app', title: 'Discord' },
        { url: 'https://youtube.com', title: 'YouTube' },
        { url: 'https://reddit.com', title: 'Reddit' },
        { url: 'https://google.com', title: 'Google' },
        { url: 'https://spotify.com', title: 'Spotify' },
        { url: 'https://chess.com', title: 'Chess.com' },
        { url: 'https://scratch.mit.edu', title: 'Scratch' },
        { url: 'https://grantkot.com', title: 'Grantkot' },
        { url: 'https://evoworld.io', title: 'EvoWorld' },
        { url: 'https://hole-io.com', title: 'Hole.io' },
        { url: 'http://slither.com/io', title: 'Slither.io' },
        { url: 'https://selfstudybrain.com', title: 'Roblox' },
        { url: 'https://poki.com', title: 'Poki' },
        { url: 'https://krunker.io', title: 'Krunker' },
        { url: 'https://crazygames.com', title: 'Crazy Games' },
        { url: 'https://www.addictinggames.com/', title: 'Addicting Games' },
        { url: 'https://www.tiktok.com', title: 'TikTok' },
        { url: 'https://www.netflix.com', title: 'Netflix' },
        { url: 'https://blooket.com', title: 'Blooket' },
        { url: 'https://character.ai', title: 'Character.ai' },
        { url: 'https://novafork.com', title: 'Free Movies' },
        { url: 'https://www.amazon.com', title: 'Amazon' },
        { url: 'https://www.coolmathgames.com', title: 'Cool Math Games' },
        { url: 'https://play.geforcenow.com/mall/#/loginwall', title: 'GeForce Now' },
        { url: 'https://www.miniplay.com/embed/brawl-stars', title: 'Brawl Stars' },
        { url: 'https://deadshot.io/', title: 'Deadshot.io' },
        { url: 'https://suroi.io/', title: 'Suroi.io' },
        { url: 'https://store.steampowered.com/', title: 'Steam' },
    ];

    try {
        // Clear existing buttons and errors
        appContainer.innerHTML = '';
        if (errorContainer) errorContainer.textContent = '';
        if (errorCode) errorCode.textContent = '';

        // Add app request button at the top
        const requestButton = document.createElement('button');
        requestButton.textContent = 'REQUEST APP';
        requestButton.className = 'request-button';
        requestButton.style.border = '1px solid #00aa00';
        requestButton.onclick = () => {
            window.open('https://forms.gle/UdCazmZMD4dcd7uz7', '_blank');
        };
        appContainer.appendChild(requestButton);

        // Create app buttons
        apps.forEach(app => {
            const button = document.createElement('button');
            button.textContent = app.title;
            button.className = 'button';
            
            button.onclick = () => {
                try {
                    const url = app.url;
                    const frameUrl = `static/frame.html?url=${encodeURIComponent(url)}`;
                    window.location.href = frameUrl;
                } catch (err) {
                    if (errorContainer) errorContainer.textContent = `Failed to load ${app.title}: ${err.message}`;
                    if (errorCode) errorCode.textContent = 'Error Code: UV_LOAD_FAILED';
                    console.error('App loading error:', err);
                }
            };

            appContainer.appendChild(button);
        });
    } catch (error) {
        console.error('Error loading apps:', error);
        appContainer.innerHTML = '<p class="error">Error loading applications. Please try again later.</p>';
    }
}

// Load apps when the page loads
window.addEventListener('load', loadApps);
