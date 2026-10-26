(() => {
  if (window.__texasCampusAssistantLoaded) return;
  window.__texasCampusAssistantLoaded = true;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "./chatbot.css?v=1";
  document.head.appendChild(css);

  const start = () => {
    if (document.getElementById("tc-assistant")) return;
    const root = document.createElement("div");
    root.id = "tc-assistant";
    root.innerHTML = `
      <button class="tc-chat-launcher" type="button" aria-label="Open Texas Campus assistant" aria-expanded="false" aria-controls="tc-chat-panel">
        <span class="tc-launcher-pulse"></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2c-5 0-9 3.4-9 7.7 0 2.1 1 4 2.7 5.4L5 20.8l4.7-2.2c.8.2 1.5.3 2.3.3 5 0 9-3.5 9-7.8s-4-7.9-9-7.9Z"/><path d="M8 10.9h.1m3.9 0h.1m3.9 0h.1"/></svg>
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
      if (/package|bundle|full package|price|cost|ganan|kiyada/.test(q)) {
        return {
          text: "We have three course packages: Digital Accounting (8 courses) for Rs. 32,000; AI Accounting (4 courses) for Rs. 32,000; and the Complete Bundle (all 12 courses) for Rs. 60,000.",
          action: { href: "./courses.html#package-title", label: "View course packages →" }
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