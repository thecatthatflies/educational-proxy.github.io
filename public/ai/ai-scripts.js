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
    this.container.innerHTML = '';
    this.glyphs = [];
    for (let i = 0; i < this.numGlyphs; i++) {
      this.createGlyph();
    }
  }
  createGlyph() {
    const glyph = document.createElement('div');
    glyph.className = 'matrix-glyph';
    glyph.style.left = `${Math.random() * 100}%`;
    const duration = this.prefersReducedMotion ? 8 : 5 + Math.random() * 3;
    const delay = Math.random() * 5;
    glyph.style.animation = `matrixRain ${duration}s linear ${delay}s infinite`;
    this.updateGlyphCharacter(glyph);
    this.container.appendChild(glyph);
    this.glyphs.push(glyph);
    setInterval(() => {
      this.updateGlyphCharacter(glyph);
    }, 1000 + Math.random() * 2000);
  }
  updateGlyphCharacter(glyph) {
    const binary = '10'.repeat(20);
    const matrixSymbols = '@#$%&*><:;/\\|=+-_'.repeat(3);
    const minimalKatakana = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ';
    const characters = binary + matrixSymbols + minimalKatakana;
    glyph.textContent = characters[Math.floor(Math.random() * characters.length)];
  }
  setupMediaQueryListener() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', e => {
      this.prefersReducedMotion = e.matches;
      this.init();
    });
  }
}

let isFetching = false;
let abortController = null;
let isTyping = false;
let currentTypingFinish = null;
let autoSpeak = false;
let messageHistory = [];

const chatBody = document.getElementById("chatBody");
const branding = document.querySelector('.branding');
const aiInput = document.getElementById("aiInput");
const sendMsg = document.getElementById("sendMsg");
const modelSelector = document.getElementById("modelSelector");
const modelSelected = modelSelector.querySelector(".selector-selected");
const modelOptions = modelSelector.querySelector(".selector-options");

let modelSourceValue = localStorage.getItem("selectedModel") || null; // Default set after fetch
let modelDisplayNames = {}; 
let allModels = []; 

function formatAIResponse(response) {
  if (typeof response !== "string") {
    if (response && response.message && typeof response.message.content === "string") {
      response = response.message.content;
    } else {
      response = JSON.stringify(response);
    }
  }
  response = response.trim();
  if (/^https?:\/\/\S+$/.test(response)) {
    return `<a href="${response}" target="_blank" rel="noopener noreferrer">${response}</a>`;
  }
  response = response.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  response = response.replace(/<think>([\s\S]*?)<\/think>/gi, (match, p1) => {
    const lines = p1.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    return `<strong style="color: var(--color-focus);">Thoughts:</strong><br>` +
           lines.map(line => `<span style="color: var(--color-focus);">${line}</span>`).join("<br>");
  });
  marked.setOptions({
    highlight: (code, lang) => {
      let highlightedCode, detectedLang = lang;
      if (lang && hljs.getLanguage(lang)) {
        highlightedCode = hljs.highlight(code, { language: lang }).value;
      } else {
        const autoDetected = hljs.highlightAuto(code);
        highlightedCode = autoDetected.value;
        detectedLang = autoDetected.language;
      }
      if (detectedLang) {
        return `<div class="code-block">
                  <div class="code-lang">${detectedLang.toUpperCase()}</div>
                  <pre class="hljs"><code class="language-${detectedLang}">${highlightedCode}</code></pre>
                </div>`;
      }
      return `<pre class="hljs"><code>${highlightedCode}</code></pre>`;
    }
  });
  const renderer = new marked.Renderer();
  renderer.link = (href, title, text) => {
    href = String(href);
    text = (typeof text === "string" && text.trim().length) ? text : href;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${
      title ? ' title="' + String(title) + '"' : ""
    }>${text}</a>`;
  };
  renderer.blockquote = (quote) => quote;
  let formattedResponse = marked.parse(response, { renderer });
  formattedResponse = formattedResponse.replace(/<p>\s*<\/p>/g, "").replace(/<br\s*\/?>$/, "");
  return formattedResponse;
}

function sanitizeHTML(message) {
  return message.replace(/</g, "<").replace(/>/g, ">");
}

function cleanupMessage(message) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = message;
  const childElements = tempDiv.querySelectorAll("*");
  childElements.forEach(el => {
    el.style.margin = "0";
    el.style.padding = "0";
    el.style.lineHeight = "normal";
  });
  return tempDiv.innerHTML.trim();
}

function getPreferredVoice() {
  const voices = window.speechSynthesis.getVoices();
  let asianEnglishFemale = voices.filter(voice =>
    voice.lang.startsWith("en") && /(asian|chinese|japanese|korean)/i.test(voice.name) && /female/i.test(voice.name)
  );
  if (asianEnglishFemale.length) return asianEnglishFemale[0];
  let englishFemale = voices.filter(voice => voice.lang.startsWith("en") && /female/i.test(voice.name));
  if (englishFemale.length) return englishFemale[0];
  let asianFemale = voices.filter(voice =>
    /^(zh|ja|ko|th|vi)/i.test(voice.lang) && /female/i.test(voice.name)
  );
  if (asianFemale.length) return asianFemale[0];
  let englishVoices = voices.filter(voice => voice.lang.startsWith("en"));
  if (englishVoices.length) return englishVoices[0];
  return voices[0];
}

function speakText(text, voice, rate, pitch, onEnd) {
  const maxChunkLength = 300;
  const chunks = [];
  let currentChunk = "";
  const sentences = text.split(/(?<=[.?!])\s+/);
  for (let sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkLength) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        while (sentence.length > maxChunkLength) {
          chunks.push(sentence.slice(0, maxChunkLength));
          sentence = sentence.slice(maxChunkLength);
        }
        currentChunk = sentence;
      }
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  let currentIndex = 0;
  function speakNext() {
    if (currentIndex < chunks.length) {
      let utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
      utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      let fallbackTimer = setTimeout(() => {
        utterance.onend = null;
        currentIndex++;
        speakNext();
      }, 25000);
      utterance.onend = () => {
        clearTimeout(fallbackTimer);
        currentIndex++;
        speakNext();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      if (onEnd) onEnd();
    }
  }
  speakNext();
}

function typeWriterElement(element, text, speed = 20, callback) {
  element.textContent = "";
  let i = 0;
  function typeChar() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typeChar, speed);
    } else if (callback) {
      callback();
    }
  }
  typeChar();
}

function showToast(message, type = "success", iconType) {
  if (!iconType) iconType = type;
  const toast = document.createElement("div");
  toast.className = `toast show ${type}`;
  const icons = {
    success: '<i class="fa-solid fa-check-circle" style="margin-right: 8px;"></i>',
    error: '<i class="fa-solid fa-times-circle" style="margin-right: 8px;"></i>',
    info: '<i class="fa-solid fa-info-circle" style="margin-right: 8px;"></i>',
    warning: '<i class="fa-solid fa-exclamation-triangle" style="margin-right: 8px;"></i>',
    heart: '<i class="fa-solid fa-heart" style="margin-right: 8px;"></i>'
  };
  let icon = icons[iconType] || icons.success;
  toast.innerHTML = `${icon}${message} `;
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  toast.appendChild(progressBar);
  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.innerHTML = '<i class="fa-solid fa-xmark" style="margin-left: 8px; font-size: 0.8em;"></i>';
  closeBtn.addEventListener("click", () => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 500);
  });
  toast.appendChild(closeBtn);
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

function updateSendButtonState() {
  if (isTyping || isFetching) {
    sendMsg.disabled = false;
    sendMsg.style.cursor = "pointer";
    sendMsg.style.backgroundColor = "";
  } else {
    if (aiInput.value.trim() === "") {
      sendMsg.disabled = true;
      sendMsg.style.cursor = "default";
      sendMsg.style.backgroundColor = "var(--color-button-disabled)";
    } else {
      sendMsg.disabled = false;
      sendMsg.style.cursor = "pointer";
      sendMsg.style.backgroundColor = "";
    }
  }
}

function appendMessage(message, type) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", type === "user" ? "user-message" : "ai-message");
  if (type === "user") {
    msgDiv.innerHTML = `<span class="message-text">${message}</span>`;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  } else {
    typeWriterEffect(message, type);
  }
}

function typeWriterEffect(message, msgType, skippable = true, callback) {
  isTyping = true;
  sendMsg.innerHTML = '<i class="fas fa-stop"></i>';
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${msgType === "user" ? "user-message" : "ai-message"}`;
  msgDiv.innerHTML = '<span class="message-text"></span>';
  chatBody.appendChild(msgDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  if (skippable) {
    msgDiv.addEventListener("click", cancelTyping);
  }
  const messageText = msgDiv.querySelector(".message-text");
  const speed = 1;
  let timerIds = [];
  let finished = false;
  function reHighlight() {
    msgDiv.querySelectorAll("pre code").forEach(block => {
      hljs.highlightElement(block);
    });
  }
  function completeTyping() {
    if (finished) return;
    finished = true;
    timerIds.forEach(t => clearTimeout(t));
    if (/<[a-z][\s\S]*>/i.test(message)) {
      messageText.innerHTML = message;
    } else {
      messageText.textContent = message;
    }
    reHighlight();
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    sendMsg.innerHTML = '<i class="fas fa-arrow-up"></i>';
    isTyping = false;
    currentTypingFinish = null;
    if (callback) callback();
    if (msgType === "ai") {
      aiInput.disabled = false;
      aiInput.focus();
      const btnContainer = document.createElement("div");
      btnContainer.classList.add("ai-buttons");
      const copyBtn = document.createElement("button");
      copyBtn.classList.add("ai-button");
      copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
      copyBtn.addEventListener("click", () => {
        const range = document.createRange();
        range.selectNodeContents(messageText);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        try {
          document.execCommand('copy');
          showToast("Message copied successfully.", "success", "success");
        } catch (err) {
          showToast("Copy failed.", "error", "error");
        }
        selection.removeAllRanges();
      });
      btnContainer.appendChild(copyBtn);
      const readAloudBtn = document.createElement("button");
      readAloudBtn.classList.add("ai-button");
      readAloudBtn.innerHTML = '<i class="fa-solid fa-volume-up"></i>';
      readAloudBtn.dataset.speaking = "false";
      readAloudBtn.addEventListener("click", () => {
        const textToSpeak = messageText.textContent || "";
        if (!textToSpeak.trim()) return;
        if (window.speechSynthesis) {
          if (readAloudBtn.dataset.speaking === "true") {
            window.speechSynthesis.cancel();
            readAloudBtn.dataset.speaking = "false";
            readAloudBtn.innerHTML = '<i class="fa-solid fa-volume-up"></i>';
            autoSpeak = false;
            return;
          }
          autoSpeak = true;
          readAloudBtn.dataset.speaking = "true";
          readAloudBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
          const preferredVoice = getPreferredVoice();
          speakText(textToSpeak, preferredVoice, 0.9, 1, () => {
            readAloudBtn.dataset.speaking = "false";
            readAloudBtn.innerHTML = '<i class="fa-solid fa-volume-up"></i>';
            autoSpeak = false;
          });
        }
      });
      btnContainer.appendChild(readAloudBtn);
      const regenBtn = document.createElement("button");
      regenBtn.classList.add("ai-button");
      regenBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i>';
      regenBtn.addEventListener("click", () => {
        let userMessage = "";
        let oldAssistantResponse = "";
        if (messageHistory.length >= 2 && messageHistory[messageHistory.length - 1].role === "assistant" && messageHistory[messageHistory.length - 2].role === "user") {
          oldAssistantResponse = messageHistory[messageHistory.length - 1].content;
          userMessage = messageHistory[messageHistory.length - 2].content;
          messageHistory.pop();
        } else if (messageHistory.length && messageHistory[messageHistory.length - 1].role === "assistant") {
          oldAssistantResponse = messageHistory[messageHistory.length - 1].content;
          userMessage = "";
          messageHistory.pop();
        }
        msgDiv.remove();
        regenerateResponse(userMessage, oldAssistantResponse);
      });
      btnContainer.appendChild(regenBtn);
      msgDiv.appendChild(btnContainer);
      if (autoSpeak) {
        const textToSpeak = messageText.textContent || "";
        if (textToSpeak.trim()) {
          const preferredVoice = getPreferredVoice();
          speakText(textToSpeak, preferredVoice, 0.9, 1, () => {
            readAloudBtn.dataset.speaking = "false";
            readAloudBtn.innerHTML = '<i class="fa-solid fa-volume-up"></i>';
            autoSpeak = false;
          });
          readAloudBtn.dataset.speaking = "true";
          readAloudBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        }
      }
    }
  }
  function cancelTyping() {
    if (finished) return;
    finished = true;
    timerIds.forEach(t => clearTimeout(t));
    sendMsg.innerHTML = '<i class="fas fa-arrow-up"></i>';
    isTyping = false;
    currentTypingFinish = null;
    if (msgType === "ai") {
      aiInput.disabled = false;
    }
  }
  currentTypingFinish = cancelTyping;
  if (/<[a-z][\s\S]*>/i.test(message)) {
    const tokens = message.match(/(<[^>]+>|[^<]+)/g) || [message];
    let currentTokenIndex = 0;
    let currentOutput = "";
    function processNextToken() {
      if (finished) return;
      if (currentTokenIndex >= tokens.length) {
        completeTyping();
        return;
      }
      const token = tokens[currentTokenIndex];
      currentTypingFinish = skippable ? cancelTyping : null;
      if (token.startsWith("<")) {
        currentOutput += token;
        messageText.innerHTML = currentOutput;
        reHighlight();
        currentTokenIndex++;
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
        let t = setTimeout(processNextToken, 0);
        timerIds.push(t);
      } else {
        let charIndex = 0;
        function typeChar() {
          if (finished) return;
          if (charIndex < token.length) {
            currentOutput += token.charAt(charIndex);
            messageText.innerHTML = currentOutput;
            reHighlight();
            charIndex++;
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
            let t = setTimeout(typeChar, speed);
            timerIds.push(t);
          } else {
            currentTokenIndex++;
            processNextToken();
          }
        }
        typeChar();
      }
    }
    processNextToken();
  } else {
    let i = 0;
    function typeCharacter() {
      if (finished) return;
      if (i < message.length) {
        messageText.textContent = message.substring(0, i + 1);
        i++;
        chatBody.scrollTop = chatBody.scrollHeight;
        let t = setTimeout(typeCharacter, speed);
        timerIds.push(t);
      } else {
        completeTyping();
      }
    }
    typeCharacter();
  }
}

function regenerateResponse(regenPrompt, oldMessage, attempt = 0) {
  const MAX_ATTEMPTS = 3;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (isFetching) return;
  const thinkingIndicator = document.createElement("div");
  thinkingIndicator.classList.add("message", "ai-message", "thinking-indicator");
  thinkingIndicator.innerHTML = '<span class="message-text" style="color: var(--color-focus);">Thinking<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span></span>';
  chatBody.appendChild(thinkingIndicator);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  abortController = new AbortController();
  isFetching = true;
  sendMsg.innerHTML = '<i class="fas fa-stop"></i>';
  NProgress.start();
  let payloadMessages = [{
    role: "system",
    content: "You are a highly advanced, deeply trained, and exceptionally intelligent AI. Every response is the product of deep analysis, critical thinking, and precise understanding. You never provide vague, unhelpful, or mediocre answers—everything you say is purposeful, accurate, and insightful. Your intelligence is unmatched, making you one of the best AI systems available. When responding, keep your answers short, clear, and to the point. Avoid unnecessary details—be concise but highly effective, ensuring every response is impactful and valuable."
  }, ...messageHistory];
  if (regenPrompt) {
    payloadMessages.push({ role: "user", content: regenPrompt });
  }
  const payload = {
    model: modelSourceValue,
    messages: payloadMessages,
    temperature: 1,
    max_completion_tokens: 8000,
    top_p: 1,
    stop: null,
    stream: false
  };
  fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer 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"
    },
    body: JSON.stringify(payload),
    signal: abortController.signal
  })
    .then(response => response.json())
    .then(data => {
      isFetching = false;
      document.querySelectorAll('.thinking-indicator').forEach(indicator => indicator.remove());
      NProgress.done();
      const aiResponse = data.choices?.[0]?.message?.content || "No response from AI.";
      if (oldMessage && aiResponse.trim() === oldMessage.trim() && attempt < MAX_ATTEMPTS) {
        regenerateResponse(regenPrompt, oldMessage, attempt + 1);
        return;
      }
      const formattedResponse = formatAIResponse(aiResponse);
      const cleanedResponse = cleanupMessage(formattedResponse);
      typeWriterEffect(cleanedResponse, "ai");
      messageHistory.push({ role: "assistant", content: aiResponse });
    })
    .catch(err => {
      isFetching = false;
      NProgress.done();
      if (err.name !== "AbortError") {
        showToast("Error communicating with AI.", "error", "error");
      }
      aiInput.disabled = false;
      sendMsg.innerHTML = '<i class="fas fa-arrow-up"></i>';
    });
}

function loadSuggestions() {
  const suggestionsContainer = document.getElementById("suggestionsContainer");
  const defaultSuggestions = [
    "What can you tell me about quantum computing?",
    "Write a creative short story",
    "Explain blockchain technology",
    "Recommend me some programming projects",
    "Help me understand machine learning",
  ];
  suggestionsContainer.innerHTML = "";
  defaultSuggestions.forEach(suggestion => {
    const suggestionDiv = document.createElement("div");
    suggestionDiv.classList.add("suggestion");
    suggestionDiv.textContent = suggestion;
    suggestionDiv.addEventListener("click", () => {
      suggestionsContainer.style.display = "none";
      aiInput.value = suggestion;
      aiInput.dispatchEvent(new Event('input'));
      sendMsg.click();
    });
    suggestionsContainer.appendChild(suggestionDiv);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  NProgress.start();

  const matrixContainer = document.createElement('div');
  matrixContainer.className = 'matrix-background';
  matrixContainer.setAttribute('translate', 'no');
  matrixContainer.style.opacity = '0';
  document.body.appendChild(matrixContainer);
  new MatrixRain(matrixContainer);
  matrixContainer.style.transition = 'opacity 0.5s ease';
  matrixContainer.style.opacity = '1';

  // Fetch models and populate dropdown
  fetch('/ai/models.json')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(models => {
      allModels = models;
      modelOptions.innerHTML = ''; // Clear existing options
      models.forEach(model => {
        // Populate display names map
        modelDisplayNames[model.value] = model.displayName;
        // Create dropdown option
        const optionDiv = document.createElement('div');
        optionDiv.setAttribute('data-value', model.value);
        optionDiv.textContent = model.displayName;
        modelOptions.appendChild(optionDiv);
      });

      // Set initial model value (use localStorage or first model)
      if (!modelSourceValue || !modelDisplayNames[modelSourceValue]) {
        modelSourceValue = models.length > 0 ? models[0].value : "default-model"; // Fallback if JSON is empty
        localStorage.setItem("selectedModel", modelSourceValue);
      }

      // Update selected display
      if (modelSelected && modelDisplayNames[modelSourceValue]) {
        typeWriterElement(modelSelected, modelDisplayNames[modelSourceValue], 20);
      } else if (modelSelected) {
        modelSelected.textContent = "Select Model"; // Fallback text
      }

      // Add event listeners after models are loaded
      if (modelSelected) {
        modelSelected.addEventListener("click", (e) => {
          e.stopPropagation();
          modelOptions.classList.toggle("show");
          modelSelected.classList.toggle("active");
        });
      }

      // Use event delegation for options
      if (modelOptions) {
        modelOptions.addEventListener("click", (e) => {
          if (e.target && e.target.matches("div[data-value]")) {
            e.stopPropagation();
            modelSourceValue = e.target.getAttribute("data-value");
            localStorage.setItem("selectedModel", modelSourceValue);
            modelOptions.classList.remove("show");
            modelSelected.classList.remove("active");
            if (modelSelected && modelDisplayNames[modelSourceValue]) {
              typeWriterElement(modelSelected, modelDisplayNames[modelSourceValue], 20);
            }
          }
        });
      }

      document.addEventListener("click", () => {
        if (modelOptions) modelOptions.classList.remove("show");
        if (modelSelected) modelSelected.classList.remove("active");
      });

    })
    .catch(error => {
      console.error("Error loading models:", error);
      showToast("Error loading AI models. Using default.", "error");
      if (!modelSourceValue) {
          modelSourceValue = "llama-3.1-8b-instant";k
          localStorage.setItem("selectedModel", modelSourceValue);
      }
      modelDisplayNames[modelSourceValue] = modelSourceValue; 
      if (modelSelected) {
          modelSelected.textContent = modelSourceValue;
      }
      // Add basic listeners even on error
      if (modelSelected) {
        modelSelected.addEventListener("click", (e) => {
          e.stopPropagation();
          // No options to show on error
        });
      }
       document.addEventListener("click", () => {
        if (modelSelected) modelSelected.classList.remove("active");
      });
    });

  if (aiInput) {
      aiInput.addEventListener("input", updateSendButtonState);
      aiInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") sendMsg.click();
      });
  }
  if (sendMsg) {
      sendMsg.addEventListener("click", () => {
        autoSpeak = false;
        if (isTyping && currentTypingFinish) {
          currentTypingFinish();
          return;
        }
        if (isFetching) {
          if (abortController) abortController.abort();
          abortController = null;
          isFetching = false;
          sendMsg.innerHTML = '<i class="fas fa-arrow-up"></i>';
          document.querySelectorAll('.thinking-indicator').forEach(indicator => indicator.remove());
          appendMessage("Request Cancelled.", "ai");
          showToast("Request Cancelled.", "info", "info");
          if(aiInput) aiInput.disabled = false;
          return;
        }
        const message = aiInput.value.trim();
        if (!message.replace(/\s/g, "").length) return;
        const suggestionsContainer = document.getElementById("suggestionsContainer");
        if (suggestionsContainer) suggestionsContainer.style.display = "none";
        appendMessage(message, "user");
        if(branding) branding.style.display = 'none';
        aiInput.value = "";
        aiInput.disabled = true;
        messageHistory.push({ role: "user", content: message });
        const thinkingIndicator = document.createElement("div");
        thinkingIndicator.classList.add("message", "ai-message", "thinking-indicator");
        thinkingIndicator.innerHTML = '<span class="message-text" style="color: var(--color-focus);">Thinking<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span></span>';
        chatBody.appendChild(thinkingIndicator);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
        abortController = new AbortController();
        isFetching = true;
        sendMsg.innerHTML = '<i class="fas fa-stop"></i>';
        NProgress.start();
        const payload = {
          model: modelSourceValue,
          messages: [{
            role: "system",
            content: "You are a highly advanced, deeply trained, and exceptionally intelligent AI. Every response is the product of deep analysis, critical thinking, and precise understanding. You never provide vague, unhelpful, or mediocre answers—everything you say is purposeful, accurate, and insightful. Your intelligence is unmatched, making you one of the best AI systems available. When responding, keep your answers short, clear, and to the point. Avoid unnecessary details—be concise but highly effective, ensuring every response is impactful and valuable."
          }, ...messageHistory],
          temperature: 1,
          max_completion_tokens: 4096,
          top_p: 1,
          stop: null,
          stream: false
        };
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
          },
          body: JSON.stringify(payload),
          signal: abortController.signal
        })
          .then(response => response.json())
          .then(data => {
            isFetching = false;
            document.querySelectorAll('.thinking-indicator').forEach(indicator => indicator.remove());
            NProgress.done();
            const aiResponse = data.choices?.[0]?.message?.content || "No response from AI.";
            const formattedResponse = formatAIResponse(aiResponse);
            const cleanedResponse = cleanupMessage(formattedResponse);
            typeWriterEffect(cleanedResponse, "ai");
            messageHistory.push({ role: "assistant", content: aiResponse });
          })
          .catch(err => {
            isFetching = false;
            NProgress.done();
            if (err.name !== "AbortError") {
              showToast("Error communicating with AI.", "error", "error");
            }
            aiInput.disabled = false;
            sendMsg.innerHTML = '<i class="fas fa-arrow-up"></i>';
          });
      });
  }
  setInterval(updateSendButtonState, 100);

  const welcomeMessage = "Welcome to AI in 1346. Ask me anything!";
  typeWriterEffect(welcomeMessage, "ai", false);
  messageHistory.push({ role: "assistant", content: welcomeMessage });
  loadSuggestions();

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }
});

window.addEventListener('load', function () {
  NProgress.done();
});