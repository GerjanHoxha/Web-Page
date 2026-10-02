/**
 * KINGDOM 500 - CHAT & ACTIVITY FEED MODULE
 * Interactive live chat box, automated bot activity simulator, user message submission.
 */

import { initialChatMessages, initialActivityFeed } from './data.js';

export class ChatEngine {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.messages = this.loadChat();
    this.feed = [...initialActivityFeed];

    this.chatContainer = document.getElementById('chat-messages');
    this.feedContainer = document.getElementById('activity-feed');
    this.chatForm = document.getElementById('chat-form');

    this.botNicks = ["Thor_Ragnarok", "Shieldmaiden_Helga", "Viking_Beast", "Skald_Gunnar", "Asgard_Warlord"];
    this.botQuotes = [
      "Gathering speedups for the KvK Gate 3 battle!",
      "Who needs dragon shrine title buff right now?",
      "Kingdom 500 family is unstoppable!",
      "Rally on pass in 10 minutes! Join up!",
      "Just upgraded to T5 Infantry troops!"
    ];

    this.init();
  }

  loadChat() {
    const saved = localStorage.getItem('k500_chat');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [...initialChatMessages];
      }
    }
    return [...initialChatMessages];
  }

  saveChat() {
    localStorage.setItem('k500_chat', JSON.stringify(this.messages));
  }

  init() {
    this.renderChat();
    this.renderFeed();

    if (this.chatForm) {
      this.chatForm.addEventListener('submit', (e) => this.handleChatSubmit(e));
    }

    // Bot simulator loop
    setInterval(() => this.simulateBotMessage(), 12000);
  }

  renderChat() {
    if (!this.chatContainer) return;

    this.chatContainer.innerHTML = this.messages.map(msg => `
      <div class="chat-msg">
        <div class="chat-msg-header">
          <span class="chat-msg-user">${msg.nick}</span>
          <span class="chat-msg-time">${msg.time}</span>
        </div>
        <div class="chat-msg-text">${msg.text}</div>
      </div>
    `).join('');

    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  renderFeed() {
    if (!this.feedContainer) return;

    this.feedContainer.innerHTML = this.feed.map(item => `
      <div class="feed-item">
        <div class="feed-icon">${item.icon}</div>
        <div class="feed-content">
          <p><strong>${item.title}</strong></p>
          <p style="color:var(--text-muted)">${item.text}</p>
          <span class="feed-time">${item.time}</span>
        </div>
      </div>
    `).join('');
  }

  handleChatSubmit(e) {
    e.preventDefault();

    const nickInput = document.getElementById('chat-nick');
    const textInput = document.getElementById('chat-text');

    const nick = nickInput?.value.trim() || 'Warrior_500';
    const text = textInput?.value.trim();

    if (!text) return;

    const newMsg = {
      nick: nick,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.messages.push(newMsg);
    this.saveChat();
    this.renderChat();

    if (textInput) textInput.value = '';

    if (this.audioEngine) {
      this.audioEngine.playClick();
    }
  }

  simulateBotMessage() {
    const randomNick = this.botNicks[Math.floor(Math.random() * this.botNicks.length)];
    const randomQuote = this.botQuotes[Math.floor(Math.random() * this.botQuotes.length)];

    const botMsg = {
      nick: randomNick,
      text: randomQuote,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.messages.push(botMsg);
    if (this.messages.length > 30) this.messages.shift();
    this.saveChat();
    this.renderChat();
  }
}
