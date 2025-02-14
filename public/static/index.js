"use strict";

// Loader animation
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.loader');
    const lines = document.querySelectorAll('.loader-line');
    
    if (!loader) {
        console.error('Loader element not found');
        return;
    }

    // Check if loader has been shown before
    if (localStorage.getItem('loaderShown')) {
        console.log('Loader already shown - skipping animation');
        loader.style.display = 'none';
        document.body.classList.add('loaded'); // Add loaded class
        return;
    }

    console.log('Initializing loader animation');
    
    // Show loader immediately
    loader.style.display = 'flex';
    
    // Trigger line animations
    lines.forEach((line, index) => {
        console.log(`Starting animation for line ${index + 1}`);
        setTimeout(() => {
            line.style.width = '100%';
        }, 500 + (1500 * index));
    });

    // After all animations complete, fade out loader
    const longestAnimation = 4500; // Matches last line animation delay + duration
    setTimeout(() => {
        console.log('Starting fade out animation');
        loader.classList.add('fade-out');
        setTimeout(() => {
            loader.style.display = 'none';
            console.log('Loader hidden');
            localStorage.setItem('loaderShown', 'true');
        }, 500);
    }, longestAnimation);
});

// Initialize UV
const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await registerSW();
  } catch (err) {
    error.textContent = "Failed to register service worker.";
    errorCode.textContent = err.toString();
    throw err;
  }

  let url = address.value.trim();
  if (!url) {
    url = "https://www.google.com/";
  } else {
    url = search(address.value, searchEngine.value);
  }
  
  window.location.href = `static/frame.html?url=${encodeURIComponent(url)}`;
});
