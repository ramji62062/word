// ==========================================
// SECTION 1: VOICE TYPING (DICTATE)
// ==========================================
(function() {
  let recognition = null;
  let interimSpan = null;
  let lastFinalIndex = -1;
  let lastFinalTranscript = '';

  window.toggleDictation = function() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      alert('Voice typing is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (recognition) {
      // Cleanly stop existing instance
      recognition.stop();
      return;
    }

    const lang = prompt('Dictation language (e.g., en-US, en-IN, hi-IN):', 'en-IN');
    if (!lang) return;

    recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    // UI Updates
    document.querySelectorAll('.dictate-btn').forEach(btn => {
      btn.style.color = '#d13438'; // Red mic
      btn.classList.add('fa-beat-fade');
    });

    recognition.onstart = () => {
      lastFinalIndex = -1;
      lastFinalTranscript = '';
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          // Guard against duplicate final results (especially from auto-restarts or weird firing)
          const t = event.results[i][0].transcript.trim();
          if (i === lastFinalIndex && t === lastFinalTranscript) {
            continue;
          }
          finalTranscript += t + ' ';
          lastFinalIndex = i;
          lastFinalTranscript = t;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.length > 0) {
        removeInterimSpan();
        // Insert final text as ONE undoable command.
        document.execCommand('insertText', false, finalTranscript);
        if (window.updateStats) window.updateStats();
      }

      if (interimTranscript.length > 0) {
        updateInterimSpan(interimTranscript);
      } else {
        removeInterimSpan();
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone permission denied.');
      } else if (event.error === 'no-speech') {
        // Just silent timeout, ignore
      } else {
        // Show brief error overlay?
        console.warn('Dictation error:', event.error);
      }
      stopDictation();
    };

    recognition.onend = () => {
      // Auto-stop when it reaches the end.
      stopDictation();
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(err);
      stopDictation();
    }
  };

  function stopDictation() {
    if (recognition) {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      try { recognition.stop(); } catch(e){}
      recognition = null;
    }
    removeInterimSpan();
    document.querySelectorAll('.dictate-btn').forEach(btn => {
      btn.style.color = '';
      btn.classList.remove('fa-beat-fade');
    });
  }

  function removeInterimSpan() {
    if (interimSpan) {
      if (interimSpan.parentNode) {
        interimSpan.parentNode.removeChild(interimSpan);
      }
      interimSpan = null;
    }
  }

  function updateInterimSpan(text) {
    if (!interimSpan) {
      interimSpan = document.createElement('span');
      interimSpan.className = 'dictation-interim';
      interimSpan.style.cssText = 'color: #999; background: #eee; border-bottom: 1px dotted #999; pointer-events: none; padding: 0 2px; border-radius: 2px;';
      interimSpan.contentEditable = 'false';
      
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.insertNode(interimSpan);
        // Move caret after the interim span
        range.setStartAfter(interimSpan);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    interimSpan.textContent = text;
  }
})();
