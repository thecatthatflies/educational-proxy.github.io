// Auto-refresh functionality for failed page loads
(() => {
    const maxRetries = 3;
    let retryCount = 0;
    let retryDelay = 2000; // Start with 2 seconds

    // Create and add loading indicator
    function showLoading() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'uv-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 20, 0, 0.95);
            color: #00ff00;
            padding: 20px 40px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            z-index: 9999;
            border: 1px solid #004400;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
        `;
        
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Loading';
        loadingDiv.appendChild(loadingText);

        // Animate the dots
        let dots = 0;
        setInterval(() => {
            dots = (dots + 1) % 4;
            loadingText.textContent = 'Loading' + '.'.repeat(dots);
        }, 500);

        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }

    function checkPageLoad() {
        // Check if the page has proper content
        const mainContent = document.querySelector('main, #content, .container');
        const hasProperContent = mainContent && mainContent.children.length > 0;
        
        // If page appears to be unstyled/incomplete
        if (!hasProperContent && document.body) {
            if (retryCount < maxRetries) {
                retryCount++;
                retryDelay *= 1.5; // Increase delay with each retry
                
                console.log(`Page load incomplete, retrying in ${retryDelay/1000} seconds... (Attempt ${retryCount}/${maxRetries})`);
                
                // Show loading indicator
                const loadingDiv = showLoading();
                
                setTimeout(() => {
                    // Remove loading indicator before reload
                    if (loadingDiv && loadingDiv.parentNode) {
                        loadingDiv.parentNode.removeChild(loadingDiv);
                    }
                    window.location.reload();
                }, retryDelay);
            } else {
                // If all retries failed, redirect to 404
                window.location.href = '/404.html';
            }
        }
    }

    // Check after initial page load
    window.addEventListener('load', () => {
        setTimeout(checkPageLoad, 1000); // Wait 1 second after load to check
    });

    // Also check if load event doesn't fire
    setTimeout(checkPageLoad, 5000); // Fallback check after 5 seconds
})();