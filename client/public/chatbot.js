// Δημιουργούμε το container του chat widget
(function() {
  const widget = document.createElement('div');
  widget.id = 'chat-widget';
  widget.innerHTML = `
    <div id="chat-header">💬 Βοηθός</div>
    <div id="chat-content" style="display:none;">
      <div id="chat-messages" style="flex:1; overflow-y:auto; padding:10px; background:#f5f5f5;"></div>
      <div id="chat-input" style="display:flex; border-top:1px solid #ccc;">
        <input type="text" id="userInput" placeholder="Γράψε μήνυμα..." style="flex:1; padding:8px; border:none; outline:none;">
        <button id="sendBtn" style="padding:8px 12px; border:none; background:#007bff; color:white; cursor:pointer;">Αποστολή</button>
      </div>
      <div id="debug-panel" style="font-size:11px; color:#333; background:#f9f9f9; padding:4px; max-height:80px; overflow-y:auto;"></div>
    </div>
  `;
  
  // Βασικά CSS για το floating widget
  Object.assign(widget.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '300px',
    maxHeight: '400px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    zIndex: 9999
  });

  document.body.appendChild(widget);

  const header = document.getElementById('chat-header');
  const content = document.getElementById('chat-content');
  const messagesDiv = document.getElementById('chat-messages');
  const input = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const debugDiv = document.getElementById('debug-panel');

  // Toggle chat open/close
  header.addEventListener('click', () => {
    content.style.display = content.style.display === 'none' ? 'flex' : 'none';
  });

  function logDebug(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    debugDiv.appendChild(el);
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }

  function appendMessage(text, cls, typing=false) {
    const msgEl = document.createElement('div');
    msgEl.className = cls + (typing ? ' typing' : '');
    msgEl.textContent = text;
    msgEl.style.marginBottom = '8px';
    msgEl.style.padding = '6px 8px';
    msgEl.style.borderRadius = '6px';
    msgEl.style.alignSelf = cls==='user' ? 'flex-end' : 'flex-start';
    msgEl.style.background = cls==='user' ? '#007bff' : '#e0e0e0';
    msgEl.style.color = cls==='user' ? 'white' : 'black';
    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  async function sendMessage() {
    const msg = input.value.trim();
    if(!msg) return;

    appendMessage(msg, 'user');
    logDebug('User sent: ' + msg);
    input.value = '';
    appendMessage('...', 'bot', true);

    try {
      const res = await fetch('/api/ai/offline', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      const typingMsg = messagesDiv.querySelector('.typing');
      if(typingMsg) typingMsg.remove();

      appendMessage(data.reply, 'bot');
      logDebug('Bot replied: ' + data.reply);
    } catch(e) {
      const typingMsg = messagesDiv.querySelector('.typing');
      if(typingMsg) typingMsg.remove();
      appendMessage('Σφάλμα σύνδεσης!', 'bot');
      logDebug('Error: ' + e.message);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', e => {
    if(e.key === 'Enter') sendMessage();
  });
})();
