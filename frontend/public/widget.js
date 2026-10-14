(function() {
    // ── Configuration from the embed snippet ────────────────────────────────
    const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
    const chatbotId = scriptTag ? scriptTag.getAttribute('data-chatbot-id') : null;
    const legacyCompanyId = scriptTag ? scriptTag.getAttribute('data-company-id') : null;
    const apiUrl = (scriptTag && scriptTag.getAttribute('data-api-url')) || 'http://localhost:8000/api';
    const theme = (scriptTag && scriptTag.getAttribute('data-theme')) === 'dark' ? 'dark' : 'light';
    const position = (scriptTag && scriptTag.getAttribute('data-position')) === 'bottom-left' ? 'bottom-left' : 'bottom-right';
    const greetingDelaySec = Math.max(0, parseInt((scriptTag && scriptTag.getAttribute('data-greeting-delay')) || '0', 10) || 0);
    // Scripted demo mode: fully self-contained sample chat, no backend calls.
    const demoMode = (scriptTag && scriptTag.getAttribute('data-demo')) === 'scripted';
    const PUBLIC_CONFIG_URL = chatbotId ? `${apiUrl}/chatbot/public/${encodeURIComponent(chatbotId)}` : null;
    const CHAT_URL = `${apiUrl}/chat/widget/stream`;
    const storageKey = 'bizos_conversation_' + (chatbotId || legacyCompanyId || 'default');

    // Branding defaults (overridden by the public config endpoint, or by
    // explicit attributes in scripted demo mode)
    const branding = {
        name: 'Support Assistant',
        welcome: "Hi! I'm here to help. How can I assist you today?",
        color: '#2563eb',
    };
    if (demoMode) {
        branding.name = (scriptTag && scriptTag.getAttribute('data-bot-name')) || 'BizOS Assistant';
        branding.welcome = (scriptTag && scriptTag.getAttribute('data-welcome-message')) || branding.welcome;
        branding.color = (scriptTag && scriptTag.getAttribute('data-color')) || branding.color;
    }

    // Inject marked.js for markdown rendering
    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(markedScript);

    // Inject DOMPurify to sanitize rendered markdown (untrusted model/KB output)
    const purifyScript = document.createElement('script');
    purifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js';
    document.head.appendChild(purifyScript);

    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #bizos-widget-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #bizos-chat-button {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: ${branding.color};
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        #bizos-chat-button:hover {
            transform: scale(1.08);
            box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4), 0 10px 10px -5px rgba(37, 99, 235, 0.2);
        }
        #bizos-widget-container.bizos-left {
            right: auto;
            left: 24px;
        }
        #bizos-widget-container.bizos-left #bizos-chat-window {
            right: auto;
            left: 0;
            transform-origin: bottom left;
        }
        #bizos-widget-container.bizos-left #bizos-greeting {
            right: auto;
            left: 0;
            border-bottom-right-radius: 14px;
            border-bottom-left-radius: 4px;
        }
        /* ── Dark theme ─────────────────────────────────────────────── */
        #bizos-widget-container.bizos-dark #bizos-chat-window {
            background: rgba(17, 24, 39, 0.97);
            border-color: rgba(255, 255, 255, 0.1);
        }
        #bizos-widget-container.bizos-dark #bizos-chat-messages {
            background-color: #0b1220;
        }
        #bizos-widget-container.bizos-dark .bizos-ai {
            background-color: #1e293b;
            color: #f1f5f9;
            border-color: #334155;
        }
        #bizos-widget-container.bizos-dark .bizos-message a {
            color: #93c5fd;
        }
        #bizos-widget-container.bizos-dark .bizos-message code {
            background: rgba(255, 255, 255, 0.1);
        }
        #bizos-widget-container.bizos-dark .bizos-sources {
            border-top-color: #334155;
        }
        #bizos-widget-container.bizos-dark .bizos-source-chip {
            color: #94a3b8;
            background: #0f172a;
            border-color: #334155;
        }
        #bizos-widget-container.bizos-dark #bizos-chat-input-container {
            background: #111827;
            border-top-color: #1f2937;
        }
        #bizos-widget-container.bizos-dark #bizos-chat-input {
            background-color: #0b1220;
            border-color: #334155;
            color: #f1f5f9;
        }
        #bizos-widget-container.bizos-dark #bizos-chat-input:focus {
            background-color: #0f172a;
        }
        #bizos-widget-container.bizos-dark .bizos-typing-indicator {
            background: #1e293b;
            border-color: #334155;
        }
        #bizos-widget-container.bizos-dark .bizos-feedback button {
            border-color: #334155;
            color: #94a3b8;
        }
        #bizos-widget-container.bizos-dark .bizos-feedback button:hover:not(:disabled) {
            background: #0f172a;
        }
        #bizos-widget-container.bizos-dark #bizos-greeting {
            background: #1e293b;
            color: #f1f5f9;
            border-color: #334155;
        }
        /* ── Proactive greeting bubble ──────────────────────────────── */
        #bizos-greeting {
            display: none;
            position: absolute;
            bottom: 76px;
            right: 0;
            width: 240px;
            background: white;
            color: #1e293b;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            border-bottom-right-radius: 4px;
            padding: 12px 34px 12px 14px;
            font-size: 13px;
            line-height: 1.45;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
            cursor: pointer;
            animation: bizosMessageSlide 0.3s ease-out;
        }
        #bizos-greeting-close {
            position: absolute;
            top: 4px;
            right: 6px;
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            padding: 4px;
        }
        #bizos-greeting-close:hover {
            color: #475569;
        }
        /* ── Message feedback ───────────────────────────────────────── */
        .bizos-feedback {
            display: flex;
            gap: 6px;
            margin-top: 8px;
        }
        .bizos-feedback button {
            background: none;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            line-height: 1;
            padding: 4px 8px;
            color: #64748b;
            transition: background 0.2s;
        }
        .bizos-feedback button:hover:not(:disabled) {
            background: #f1f5f9;
        }
        .bizos-feedback button:disabled {
            opacity: 0.55;
            cursor: default;
        }
        .bizos-feedback button.bizos-active {
            background: #ecfdf5;
            border-color: #6ee7b7;
        }
        .bizos-feedback-thanks {
            font-size: 11px;
            color: #64748b;
            margin-top: 8px;
        }
        #bizos-chat-window {
            display: none;
            position: absolute;
            bottom: 84px;
            right: 0;
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(229, 231, 235, 0.5);
            transform-origin: bottom right;
            animation: bizosPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes bizosPopIn {
            0% { opacity: 0; transform: scale(0.9) translateY(20px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        #bizos-chat-header {
            background: linear-gradient(135deg, #1e3a8a, ${branding.color});
            color: white;
            padding: 18px 20px;
            font-weight: 600;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #bizos-chat-header .title {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #bizos-chat-header .status-dot {
            width: 8px;
            height: 8px;
            background-color: #34d399;
            border-radius: 50%;
            box-shadow: 0 0 8px #34d399;
        }
        #bizos-close-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            cursor: pointer;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: background 0.2s;
        }
        #bizos-close-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        #bizos-chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background-color: #f8fafc;
            scroll-behavior: smooth;
        }
        .bizos-message {
            max-width: 85%;
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.5;
            animation: bizosMessageSlide 0.3s ease-out;
            word-wrap: break-word;
        }
        .bizos-message p {
            margin: 0 0 8px 0;
        }
        .bizos-message p:last-child {
            margin: 0;
        }
        .bizos-message a {
            color: #2563eb;
            text-decoration: underline;
        }
        .bizos-message pre {
            background: #1e293b;
            color: #f8fafc;
            padding: 8px;
            border-radius: 8px;
            overflow-x: auto;
            font-family: monospace;
            font-size: 12px;
            margin: 8px 0;
        }
        .bizos-message code {
            font-family: monospace;
            background: rgba(0,0,0,0.05);
            padding: 2px 4px;
            border-radius: 4px;
        }
        @keyframes bizosMessageSlide {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .bizos-user {
            align-self: flex-end;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            color: white;
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
        }
        .bizos-user code {
            background: rgba(255,255,255,0.2);
        }
        .bizos-user a {
            color: #fff;
        }
        .bizos-ai {
            align-self: flex-start;
            background-color: white;
            color: #1e293b;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 4px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .bizos-sources {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
        }
        .bizos-source-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #64748b;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 2px 6px;
            max-width: 220px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        #bizos-chat-input-container {
            padding: 16px;
            background: white;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        #bizos-chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #cbd5e1;
            border-radius: 24px;
            outline: none;
            font-family: inherit;
            font-size: 14px;
            background-color: #f8fafc;
            color: #0f172a;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        #bizos-chat-input:focus {
            border-color: #3b82f6;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        #bizos-send-btn {
            background: ${branding.color};
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, background 0.2s;
            box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
        #bizos-send-btn:hover {
            transform: scale(1.05);
        }
        #bizos-send-btn:disabled {
            background: #94a3b8;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .bizos-typing-indicator {
            display: flex;
            gap: 4px;
            padding: 12px 16px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            border-bottom-left-radius: 4px;
            align-self: flex-start;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            animation: bizosMessageSlide 0.3s ease-out;
            width: fit-content;
        }
        .bizos-typing-dot {
            width: 6px;
            height: 6px;
            background-color: #94a3b8;
            border-radius: 50%;
            animation: bizosTypingBounce 1.4s infinite ease-in-out both;
        }
        .bizos-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .bizos-typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bizosTypingBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
        @media (max-width: 480px) {
            #bizos-chat-window {
                width: calc(100vw - 40px);
                height: calc(100vh - 120px);
                bottom: 80px;
                right: 20px;
            }
        }
    `;
    document.head.appendChild(style);

    // Add Inter font
    const font = document.createElement('link');
    font.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
    font.rel = 'stylesheet';
    document.head.appendChild(font);

    // Create Elements
    const container = document.createElement('div');
    container.id = 'bizos-widget-container';
    if (theme === 'dark') container.classList.add('bizos-dark');
    if (position === 'bottom-left') container.classList.add('bizos-left');

    const greetingEl = document.createElement('div');
    greetingEl.id = 'bizos-greeting';
    greetingEl.setAttribute('role', 'button');
    greetingEl.setAttribute('tabindex', '0');
    greetingEl.setAttribute('aria-label', 'Open chat');
    greetingEl.innerHTML = '<span id="bizos-greeting-text"></span><button id="bizos-greeting-close" aria-label="Dismiss greeting">&times;</button>';

    const button = document.createElement('button');
    button.id = 'bizos-chat-button';
    button.setAttribute('aria-label', 'Open chat');
    button.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

    const chatWindow = document.createElement('div');
    chatWindow.id = 'bizos-chat-window';
    chatWindow.innerHTML = `
        <div id="bizos-chat-header">
            <div class="title">
                <div class="status-dot"></div>
                <span id="bizos-chat-title">${branding.name}</span>
            </div>
            <button id="bizos-close-btn" aria-label="Close chat">&times;</button>
        </div>
        <div id="bizos-chat-messages">
            <div class="bizos-message bizos-ai" id="bizos-welcome-message">${branding.welcome}</div>
        </div>
        <div id="bizos-chat-input-container">
            <input type="text" id="bizos-chat-input" placeholder="Type a message..." autocomplete="off" />
            <button id="bizos-send-btn" aria-label="Send message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
        </div>
    `;

    container.appendChild(greetingEl);
    container.appendChild(chatWindow);
    container.appendChild(button);
    document.body.appendChild(container);

    let conversationId = sessionStorage.getItem(storageKey);

    const messagesContainer = document.getElementById('bizos-chat-messages');
    const inputField = document.getElementById('bizos-chat-input');
    const sendBtn = document.getElementById('bizos-send-btn');
    let isWaitingForResponse = false;

    // ── Load public branding (name, welcome message, color) ─────────────────
    if (PUBLIC_CONFIG_URL) {
        fetch(PUBLIC_CONFIG_URL)
            .then(function(res) { return res.ok ? res.json() : null; })
            .then(function(cfg) {
                if (!cfg) return;
                branding.name = cfg.name || branding.name;
                branding.welcome = cfg.welcome_message || branding.welcome;
                branding.color = cfg.widget_color || branding.color;

                document.getElementById('bizos-chat-title').textContent = branding.name;
                document.getElementById('bizos-welcome-message').textContent = branding.welcome;
                inputField.placeholder = 'Type a message...';
                button.style.background = branding.color;
                sendBtn.style.background = branding.color;
                document.getElementById('bizos-chat-header').style.background =
                    'linear-gradient(135deg, #1e3a8a, ' + branding.color + ')';
            })
            .catch(function() { /* keep defaults */ });
    }

    button.addEventListener('click', () => {
        dismissGreeting(false);
        const isHidden = chatWindow.style.display === '' || chatWindow.style.display === 'none';
        chatWindow.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
            inputField.focus();
        }
    });

    // ── Proactive greeting bubble ─────────────────────────────────────
    let greetingTimer = null;
    function safeSessionGet(k) {
        try { return sessionStorage.getItem(k); } catch { return null; }
    }
    function safeSessionSet(k, v) {
        try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ }
    }
    function dismissGreeting(record) {
        if (greetingTimer) clearTimeout(greetingTimer);
        greetingTimer = null;
        greetingEl.style.display = 'none';
        if (record) safeSessionSet(storageKey + '_greeted', '1');
    }
    function scheduleGreeting() {
        if (!greetingDelaySec) return;
        if (safeSessionGet(storageKey + '_greeted')) return;
        if (greetingTimer) clearTimeout(greetingTimer);
        greetingTimer = setTimeout(function() {
            if (chatWindow.style.display === 'flex') return;
            const textEl = document.getElementById('bizos-greeting-text');
            if (textEl) textEl.textContent = branding.welcome;
            greetingEl.style.display = 'block';
        }, greetingDelaySec * 1000);
    }
    greetingEl.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'bizos-greeting-close') return;
        dismissGreeting(true);
        chatWindow.style.display = 'flex';
        inputField.focus();
    });
    greetingEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dismissGreeting(true);
            chatWindow.style.display = 'flex';
            inputField.focus();
        }
    });
    document.getElementById('bizos-greeting-close').addEventListener('click', function(e) {
        e.stopPropagation();
        dismissGreeting(true);
    });
    scheduleGreeting();

    document.getElementById('bizos-close-btn').addEventListener('click', () => {
        chatWindow.style.display = 'none';
    });

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const indicator = document.createElement('div');
        indicator.id = id;
        indicator.className = 'bizos-typing-indicator';
        indicator.innerHTML = '<div class="bizos-typing-dot"></div><div class="bizos-typing-dot"></div><div class="bizos-typing-dot"></div>';
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // Basic markdown fallback if marked.js fails to load (HTML-escaped)
    function parseMarkdown(text) {
        const escaped = String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        let html;
        if (typeof marked !== 'undefined') {
            html = marked.parse(escaped);
        } else {
            html = escaped
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        }
        if (typeof DOMPurify !== 'undefined') {
            html = DOMPurify.sanitize(html);
        }
        return html;
    }

    function appendFeedback(messageEl) {
        if (!messageEl || messageEl.querySelector('.bizos-feedback, .bizos-feedback-thanks')) return;

        const row = document.createElement('div');
        row.className = 'bizos-feedback';
        const up = document.createElement('button');
        up.type = 'button';
        up.textContent = '👍';
        up.setAttribute('aria-label', 'This answer was helpful');
        const down = document.createElement('button');
        down.type = 'button';
        down.textContent = '👎';
        down.setAttribute('aria-label', 'This answer was not helpful');

        function vote(chosen) {
            up.disabled = true;
            down.disabled = true;
            chosen.classList.add('bizos-active');
            const thanks = document.createElement('div');
            thanks.className = 'bizos-feedback-thanks';
            thanks.textContent = 'Thanks for your feedback!';
            row.replaceWith(thanks);
        }
        up.addEventListener('click', function() { vote(up); });
        down.addEventListener('click', function() { vote(down); });
        row.appendChild(up);
        row.appendChild(down);
        messageEl.appendChild(row);
    }

    function appendSources(messageEl, sources) {        if (!messageEl || !sources || !sources.length) return;
        if (messageEl.querySelector('.bizos-sources')) return;

        const wrap = document.createElement('div');
        wrap.className = 'bizos-sources';
        sources.forEach(function(src) {
            const chip = document.createElement('span');
            chip.className = 'bizos-source-chip';
            chip.title = src.source || 'Source';
            chip.textContent = '📄 ' + (src.source || 'Source');
            wrap.appendChild(chip);
        });
        messageEl.appendChild(wrap);
    }

    // Scripted answers for demo mode (general product FAQs, beta-honest,
    // no company identity). Mirrors the landing-page interactive preview.
    function scriptedReply(input) {
        const text = String(input).toLowerCase();
        if (/(price|pricing|cost|plan)/.test(text)) {
            return "BizOS AI is free while in beta \u2014 one chatbot, knowledge base, embed widget, leads, and tickets included. Paid plans aren't finalized yet, and beta users carry founding terms into them.";
        }
        if (/(install|embed|website|wordpress|snippet|add)/.test(text)) {
            return "Installing takes about a minute: copy the snippet from your Install page and paste it before the closing </body> tag on your site. It works with WordPress, Webflow, Shopify, or plain HTML \u2014 no coding required.";
        }
        if (/(lead|leads|sales|capture)/.test(text)) {
            return "Yes! When lead capture is enabled, I collect a visitor's name, email, and notes mid-conversation and save them straight to the Leads pipeline.";
        }
        if (/(ticket|support|help|issue)/.test(text)) {
            return "I can create support tickets too \u2014 just describe the issue and I'll file one with a trackable reference.";
        }
        if (/(document|upload|knowledge|pdf|train)/.test(text)) {
            return "I answer from uploaded PDFs, DOCX, or TXT files \u2014 or a crawled website \u2014 with cited sources, and I'll say so honestly when something isn't covered.";
        }
        if (/(feature|what can|do you do|capable|abilities)/.test(text)) {
            return "I answer from business documents and websites, capture leads, and file support tickets. Ask me about features, installation, or pricing.";
        }
        if (/(hi|hello|hey|yo)\b/.test(text)) {
            return "Hi there! Ask me what this chatbot can do, how to install it, or whether it captures leads.";
        }
        if (/(thank|thanks|great|awesome|cool)/.test(text)) {
            return "You're welcome! Signup is free and the Install page walks through setup.";
        }
        return "Good question! I'm running scripted preview answers here \u2014 the real chatbot answers from business documents and websites.";
    }

    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text || isWaitingForResponse) return;
        if (!demoMode && !chatbotId && !legacyCompanyId) {
            appendMessage('This chat widget is not configured correctly.', 'bizos-ai');
            return;
        }

        inputField.value = '';
        inputField.disabled = true;
        sendBtn.disabled = true;
        isWaitingForResponse = true;

        appendMessage(text, 'bizos-user');

        const typingId = showTypingIndicator();
        let aiMessageEl = null;
        let rawContent = '';
        let sources = [];

        // Scripted demo: answer locally, no network calls at all.
        if (demoMode) {
            await new Promise(function(resolve) {
                setTimeout(resolve, 700 + Math.min(text.length * 10, 900));
            });
            removeTypingIndicator(typingId);
            const replyEl = appendMessage(scriptedReply(text), 'bizos-ai');
            appendFeedback(replyEl);
            inputField.disabled = false;
            sendBtn.disabled = false;
            isWaitingForResponse = false;
            inputField.focus();
            return;
        }

        try {
            const response = await fetch(CHAT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatbot_id: chatbotId || undefined,
                    company_id: legacyCompanyId || undefined,
                    message: text,
                    conversation_id: conversationId
                })
            });

            if (!response.ok) {
                throw new Error('Server error');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'conversation_id') {
                                conversationId = data.data;
                                sessionStorage.setItem(storageKey, conversationId);
                            } else if (data.type === 'content') {
                                if (!aiMessageEl) {
                                    removeTypingIndicator(typingId);
                                    aiMessageEl = createMessageElement('bizos-ai');
                                }
                                rawContent += data.data;
                                aiMessageEl.innerHTML = parseMarkdown(rawContent);
                                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                            } else if (data.type === 'sources') {
                                sources = data.data || [];
                            } else if (data.type === 'error') {
                                if (!aiMessageEl) {
                                    removeTypingIndicator(typingId);
                                    appendMessage(data.data || 'Sorry, I encountered an error. Please try again.', 'bizos-ai');
                                } else {
                                    aiMessageEl.innerHTML = parseMarkdown(rawContent);
                                }
                            }
                        } catch {
                            // ignore parse errors for partial chunks
                        }
                    }
                }
            }

            // Append source citations and feedback once the stream is complete
            if (aiMessageEl) {
                appendSources(aiMessageEl, sources);
                appendFeedback(aiMessageEl);
            } else {
                removeTypingIndicator(typingId);
            }
        } catch {
            removeTypingIndicator(typingId);
            appendMessage('Sorry, the chat service is currently unavailable.', 'bizos-ai');
        } finally {
            inputField.disabled = false;
            sendBtn.disabled = false;
            isWaitingForResponse = false;
            inputField.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function createMessageElement(className) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `bizos-message ${className}`;
        msgDiv.id = 'msg-' + Date.now();
        messagesContainer.appendChild(msgDiv);
        return msgDiv;
    }

    function appendMessage(text, className) {
        const msgDiv = createMessageElement(className);
        msgDiv.innerHTML = text ? parseMarkdown(text) : '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return msgDiv;
    }

})();
