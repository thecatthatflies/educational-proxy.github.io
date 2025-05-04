class MatrixRain {
  constructor(container, numGlyphs = 60) {
    this.container = container;
    this.numGlyphs = numGlyphs;
    this.glyphs = [];
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    this.init();
    this.setupMediaQueryListener();
  }

  init() {
    // Clear any existing glyphs
    this.container.innerHTML = '';
    this.glyphs = [];

    // Create glyphs
    for (let i = 0; i < this.numGlyphs; i++) {
      this.createGlyph();
    }
  }

  createGlyph() {
    const glyph = document.createElement('div');
    glyph.className = 'matrix-glyph';
    
    // Set random position
    glyph.style.left = `${Math.random() * 100}%`;
    
    // Set random animation duration and delay
    const duration = this.prefersReducedMotion ? 
      8 : // Slower, fixed duration for reduced motion
      5 + Math.random() * 3; // 5-8 seconds normally
    
    const delay = Math.random() * 5; // 0-5 second delay
    
    glyph.style.animation = `matrixRain ${duration}s linear ${delay}s infinite`;
    
    // Set random character
    this.updateGlyphCharacter(glyph);
    
    // Add to container and store reference
    this.container.appendChild(glyph);
    this.glyphs.push(glyph);
    
    // Periodically update the character
    setInterval(() => {
      this.updateGlyphCharacter(glyph);
    }, 1000 + Math.random() * 2000);
  }

  updateGlyphCharacter(glyph) {
    // Mostly binary and matrix symbols with minimal katakana
    const binary = '10'.repeat(20); // Even more 1s and 0s
    const matrixSymbols = '@#$%&*><:;/\\|=+-_'.repeat(3); // More matrix-like symbols
    const minimalKatakana = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
    const characters = binary + matrixSymbols + minimalKatakana;
    glyph.textContent = characters[Math.floor(Math.random() * characters.length)];
  }

  setupMediaQueryListener() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', e => {
      this.prefersReducedMotion = e.matches;
      this.init(); // Reinitialize with new settings
    });
  }
}

// Create container and initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.className = 'matrix-background';
  container.setAttribute('translate', 'no');
  container.style.opacity = '0';
  document.body.appendChild(container);
  
  // No need to check for loader on subpages, start immediately.
  // const loaderShown = localStorage.getItem('loaderShown');
  // const delay = loaderShown ? 0 : 5500; // Removed delay logic

  // Initialize immediately
  new MatrixRain(container);
  // Fade in the matrix background
  container.style.transition = 'opacity 0.5s ease'; // Faster fade-in
  container.style.opacity = '1';
});
