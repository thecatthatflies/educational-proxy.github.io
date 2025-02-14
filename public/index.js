// Handle form submission
document.getElementById('uv-form').addEventListener('submit', async event => {
    event.preventDefault();
    const address = document.getElementById('uv-address');
    const searchEngine = document.getElementById('uv-search-engine');

    let url = address.value.trim();
    if (!url) {
        url = 'https://google.com';
    } else if (!(url.startsWith('https://') || url.startsWith('http://'))) {
        url = searchEngine.value.replace('%s', encodeURIComponent(url));
    }

    try {
        await registerSW();
    } catch (err) {
        document.getElementById('uv-error').textContent = 'Failed to register service worker.';
        document.getElementById('uv-error-code').textContent = err.toString();
        throw err;
    }

    // Navigate through frame.html
    window.location.href = `static/frame.html?url=${encodeURIComponent(url)}`;
});
