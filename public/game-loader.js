async function loadGames() {
    const gameContainer = document.querySelector('.button-container');
    const gamesPath = 'games/';

    try {
        // Get list of game directories
        const games = [
            { path: 'blockblast', title: 'Block Blast' },
            { path: 'eaglercraft', title: 'Minecraft', file: 'eaglercraft.1.8.8.html' },
            { path: 'slope', title: 'Slope' },
            { path: 'subway', title: 'Subway Surfers' },
            { path: 'getawayshoot', title: 'Getaway Shootout' },
            { path: 'bitlife', title: 'BitLife' },
            { path: 'polytrack', title: 'Polytrack' },
            { path: 'bbr', title: 'Basketball Random' },
            { path: 'dmad', title: 'Drive Mad' },
            { path: 'slowroad', title: 'Slow Roads' },
            { path: 'drifthunt', title: 'Drift Hunters' },
            { path: '1v1', title: '1v1 lol' },
            { path: 'hackertype', title: 'Hacker Typer' },
            { path: '2048', title: '2048' },
            { path: 'ducklife3', title: 'Duck Life 3' },
            { path: 'ducklife4', title: 'Duck Life 4' },
            { path: 'srandom', title: 'Soccer Random' },
            { path: 'wordle', title: 'Wordle' },
            { path: 'dboss', title: 'Drift Boss' },
            { path: 'fruitninja', title: 'Kill Computer' },
            { path: 'crossyroad', title: 'Crossy Road' },
            { path: 'learntofly', title: 'Learn To Fly' },
            { path: 'learntofly2', title: 'Learn To Fly 2' },
            { path: 'cookie', title: 'Cookie Clicker' },
            { path: 'dogeminer', title: 'Doge Miner' },
            { path: 'doodjump', title: 'Doodle Jump' },
            { path: 'flappybird', title: 'Flappy Bird' },
            { path: 'awesometankstwo', title: 'Awesome Tanks 2' },
            { path: 'run3', title: 'Run 3' },
            { path: 'amongus', title: 'Among Us' },
            { path: 'motox3mwinter', title: 'Moto X3M Winter' },
            { path: 'supermariobros', title: 'Super Mario Bros' },
            { path: 'idle-breakout', title: 'Idle Breakout' }
        ];

        // Clear existing buttons
        gameContainer.innerHTML = '';

        // Add game request button at the top
        const requestButton = document.createElement('button');
        requestButton.textContent = 'REQUEST GAME';
        requestButton.className = 'request-button';
        requestButton.style.border = '1px solid #00aa00';
        requestButton.onclick = () => {
            window.open('https://forms.gle/yFJFUKovwR6idX8j6', '_blank');
        };
        gameContainer.appendChild(requestButton);

        // Create game buttons
        games.forEach(game => {
            const button = document.createElement('button');
            button.textContent = game.title;
            
            // When clicked, load the game in game-frame.html
            button.onclick = () => {
                const gamePath = `games/${game.path}/${game.file || 'index.html'}`;
                window.location.href = `game-frame.html?game=${encodeURIComponent(gamePath)}&title=${encodeURIComponent(game.title)}`;
            };

            gameContainer.appendChild(button);
        });
    } catch (error) {
        console.error('Error loading games:', error);
        gameContainer.innerHTML = '<p class="error">Error loading games. Please try again later.</p>';
    }
}

// Load games when the page loads
window.addEventListener('load', loadGames);