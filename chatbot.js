(() => {
  if (window.__texasCampusAssistantLoaded) return;
  window.__texasCampusAssistantLoaded = true;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "./chatbot.css?v=2";
  document.head.appendChild(css);

  const start = () => {
    if (document.getElementById("tc-assistant")) return;
    const root = document.createElement("div");
    root.id = "tc-assistant";
    root.innerHTML = `
      <button class="tc-chat-launcher" type="button" aria-label="Open Texas Campus AI assistant" aria-expanded="false" aria-controls="tc-chat-panel">
        <span class="tc-launcher-pulse"></span>
        <svg class="tc-launcher-robot" viewBox="0 0 100 118" aria-hidden="true">
          <defs>
            <linearGradient id="tcBotMetal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".55" stop-color="#cbd2df"/><stop offset="1" stop-color="#858d9c"/></linearGradient>
            <linearGradient id="tcBotRed" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff5369"/><stop offset="1" stop-color="#a90d27"/></linearGradient>
            <linearGradient id="tcBotVisor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#132535"/><stop offset="1" stop-color="#080d16"/></linearGradient>
            <radialGradient id="tcBotEye"><stop stop-color="#c8ffff"/><stop offset=".38" stop-color="#55e7ff"/><stop offset="1" stop-color="#1686ed"/></radialGradient>
            <filter id="tcBotGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <ellipse cx="51" cy="111" rx="25" ry="4" fill="#11151d" opacity=".2"/>
          <path d="M50 13V7" stroke="#b8c2d2" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="6" r="4" fill="#ed334b"/>
          <path d="M27 31c0-12 9-21 23-21s23 9 23 21v14H27V31Z" fill="url(#tcBotMetal)" stroke="#8993a3" stroke-width="1.5"/>
          <path d="M24 28c0-12 11-21 26-21s26 9 26 21v3H24v-3Z" fill="#f5f7fb"/>
          <path d="M26 27c0-11 10-18 24-18s24 7 24 18H26Z" fill="url(#tcBotMetal)"/>
          <rect x="26" y="24" width="48" height="31" rx="14" fill="url(#tcBotVisor)" stroke="#596579" stroke-width="1.5"/>
          <ellipse cx="40" cy="39" rx="5" ry="6" fill="url(#tcBotEye)" filter="url(#tcBotGlow)"/>
          <ellipse cx="60" cy="39" rx="5" ry="6" fill="url(#tcBotEye)" filter="url(#tcBotGlow)"/>
          <path d="M44 49c3 2 9 2 12 0" stroke="#66dcfa" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M25 31h-5a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h5m50-18h5a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-5" fill="url(#tcBotRed)" stroke="#c3cad6" stroke-width="2"/>
          <path d="M42 55v7h16v-7" fill="#aeb7c6"/>
          <path d="M32 62c0-3 3-5 6-5h24c3 0 6 2 6 5l8 31-12 9H36l-12-9 8-31Z" fill="url(#tcBotMetal)" stroke="#8a93a2" stroke-width="1.5"/>
          <path d="M39 62h22l-2 11-9 5-9-5-2-11Z" fill="url(#tcBotRed)" opacity=".9"/>
          <path d="M40 78c0-2 2-4 4-4h12c2 0 4 2 4 4v9c0 2-2 4-4 4H44c-2 0-4-2-4-4v-9Z" fill="#1b2737" stroke="#8c96a8" stroke-width="1.5"/>
          <path d="m50 77 5 6-5 6-5-6 5-6Z" fill="#77edff" filter="url(#tcBotGlow)"/>
          <path d="m32 66-8 4-7 18 5 3 13-14m33-11 8 4 7 18-5 3-13-14" fill="none" stroke="url(#tcBotMetal)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="18" cy="91" r="4" fill="#dce1ea" stroke="#929bab"/><circle cx="82" cy="91" r="4" fill="#dce1ea" stroke="#929bab"/>
          <path d="m39 99-4 10m26-10 4 10" stroke="#aeb7c6" stroke-width="7" stroke-linecap="round"/>
          <path d="M29 111h11m20 0h11" stroke="#dce1ea" stroke-width="6" stroke-linecap="round"/>
        </svg>
        <span class="tc-launcher-label">Ask Texas</span>
      </button>
      <section class="tc-chat-panel" id="tc-chat-panel" role="dialog" aria-label="Texas Campus assistant" aria-modal="false" hidden>
        <header class="tc-chat-header">
          <div class="tc-bot-avatar" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M16 4v4m-7 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z"/><path d="M11 18h.1m9.8 0h.1M12 22h8"/><circle cx="16" cy="4" r="1.4"/></svg>
          </div>
          <div class="tc-chat-identity"><strong>Texas Campus Assistant</strong><span><i></i> Online now</span></div>
          <button class="tc-chat-close" type="button" aria-label="Close chat">×</button>
        </header>
        <div class="tc-chat-welcome"><span class="tc-welcome-eyebrow">WELCOME TO TEXAS CAMPUS</span><h2>How can I help you today?</h2><p>Ask about courses, packages, payments or video access.</p></div>
        <div class="tc-chat-messages" aria-live="polite" aria-relevant="additions text"></div>
        <div class="tc-quick-prompts" aria-label="Common questions">
          <button type="button" data-question="What packages do you have?">Course packages</button>
          <button type="button" data-question="How do I enroll and get access?">Enrollment steps</button>
          <button type="button" data-question="How do I contact Texas Campus?">Talk to our team</button>
        </div>
        <form class="tc-chat-form">
          <label class="tc-sr-only" for="tc-chat-input">Type your question</label>
          <input id="tc-chat-input" name="question" type="text" maxlength="400" placeholder="Type your question…" autocomplete="off" required>
          <button type="submit" aria-label="Send message">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 3-7.1 18-3.8-7.1L3 10.1 21 3Z"/><path d="M10.1 13.9 21 3"/></svg>
          </button>
        </form>
        <p class="tc-chat-footnote">For personal support, message our team on WhatsApp.</p>
      </section>`;
    document.body.appendChild(root);

    const launcher = root.querySelector(".tc-chat-launcher");
    const panel = root.querySelector(".tc-chat-panel");
    const close = root.querySelector(".tc-chat-close");
    const form = root.querySelector(".tc-chat-form");
    const input = root.querySelector("#tc-chat-input");
    const messages = root.querySelector(".tc-chat-messages");
    const quickPrompts = root.querySelector(".tc-quick-prompts");

    const addMessage = (text, kind = "bot", action) => {
      const item = document.createElement("div");
      item.className = `tc-message tc-message-${kind}`;
      const bubble = document.createElement("div");
      bubble.className = "tc-message-bubble";
      bubble.textContent = text;
      item.appendChild(bubble);
      if (action) {
        const link = document.createElement("a");
        link.className = "tc-message-action";
        link.href = action.href;
        link.target = action.external ? "_blank" : "_self";
        if (action.external) link.rel = "noopener noreferrer";
        link.textContent = action.label;
        item.appendChild(link);
      }
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
    };

    const wa = { href: "https://wa.me/94779011780?text=Hi%20Texas%20Campus%2C%20I%20need%20help%20with%20a%20course.", label: "Chat with our team on WhatsApp ↗", external: true };
    const normalize = (value) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    const answer = (raw) => {
      const q = normalize(raw);
      if (/package|bundle|full package/.test(q) || ((/price|cost|ganan|kiyada/.test(q)) && /complete|both|all courses|package/.test(q))) {
        return {
          text: "We have three course packages: Digital Accounting (8 courses) for Rs. 32,000; AI Accounting (4 courses) for Rs. 32,000; and the Complete Bundle (all 12 courses) for Rs. 60,000.",
          action: { href: "./courses.html#package-title", label: "View course packages →" }
        };
      }
      if (/price|cost|fee|ganan|kiyada/.test(q)) {
        return {
          text: "Individual course prices are shown on their course cards. Tell me which course you’re interested in, or open the catalogue to compare them.",
          action: { href: "./courses.html#package-title", label: "Browse individual courses →" }
        };
      }
      if (/enrol|enroll|purchase|buy|payment|deposit|approval|bank|reference|ganna|salli|pay/.test(q)) {
        return {
          text: "Choose a course or package, sign in or create your student account, then submit your bank deposit reference. The admin team reviews it. Once approved, the included video lessons appear in your student dashboard.",
          action: { href: "./courses.html#package-title", label: "Browse courses and packages →" }
        };
      }
      if (/video|access|dashboard|pending|login|log in|password|approve|unlock/.test(q)) {
        return {
          text: "Video access is enabled after the admin approves your payment. Sign in to your student dashboard to open approved courses. If your request is still pending or you cannot sign in, our team can help.",
          action: wa
        };
      }
      if (/individual|single course|course list|catalog|course|class|learn|igena|category/.test(q)) {
        return {
          text: "The catalogue has Digital Accounting and AI for Accounting courses. Individual courses keep their own listed prices; package prices are shown in the Course Packages section.",
          action: { href: "./courses.html#package-title", label: "Open the course catalogue →" }
        };
      }
      if (/contact|human|team|whatsapp|help|support|call|phone|email|katha|contact karanna/.test(q)) {
        return { text: "Our support team is ready to help with course details, payments and student access.", action: wa };
      }
      return {
        text: "I can help with course packages, course categories, enrollment, payment approval and video access. For anything else, our team can answer you directly.",
        action: wa
      };
    };

    const submitQuestion = (value) => {
      const question = value.trim();
      if (!question) return;
      addMessage(question, "user");
      const result = answer(question);
      window.setTimeout(() => addMessage(result.text, "bot", result.action), 260);
    };

    const setOpen = (open) => {
      panel.hidden = !open;
      launcher.setAttribute("aria-expanded", String(open));
      launcher.setAttribute("aria-label", open ? "Close Texas Campus assistant" : "Open Texas Campus assistant");
      root.classList.toggle("tc-chat-open", open);
      if (open) window.setTimeout(() => input.focus(), 80);
    };

    launcher.addEventListener("click", () => setOpen(panel.hidden));
    close.addEventListener("click", () => { setOpen(false); launcher.focus(); });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value;
      input.value = "";
      submitQuestion(value);
    });
    quickPrompts.addEventListener("click", (event) => {
      const button = event.target.closest("[data-question]");
      if (button) submitQuestion(button.dataset.question);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hidden) setOpen(false);
    });
    addMessage("Ayubowan! I can help you find a course, understand package options and learn how payment approval works.", "bot");
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();