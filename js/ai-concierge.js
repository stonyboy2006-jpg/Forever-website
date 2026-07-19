const AIConcierge = {
  weddingData: {},
  conversationHistory: [],
  isListening: false,
  voiceSupported: false,
  recognition: null,
  speaking: false,

  init() {
    this.loadWeddingData();
    this.conversationHistory = this.loadHistory();
    this.voiceSupported = !!(
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
    if (this.voiceSupported) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SR();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        this.isListening = false;
        if (this.onVoiceResult) this.onVoiceResult(text);
      };
      this.recognition.onerror = () => {
        this.isListening = false;
        if (this.onVoiceEnd) this.onVoiceEnd();
      };
      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onVoiceEnd) this.onVoiceEnd();
      };
    }
  },

  loadWeddingData() {
    try {
      const stored = localStorage.getItem('weddingData');
      if (stored) this.weddingData = JSON.parse(stored);
    } catch {}
    if (typeof fbGetDoc === 'function') {
      fbGetDoc('weddingInfo', 'main').then((d) => {
        if (d) {
          this.weddingData = d;
          localStorage.setItem('weddingData', JSON.stringify(d));
        }
      }).catch(() => {});
    }
  },

  loadHistory() {
    try {
      const h = localStorage.getItem('ai-conversation');
      return h ? JSON.parse(h) : [];
    } catch { return []; }
  },

  saveHistory() {
    try {
      localStorage.setItem('ai-conversation', JSON.stringify(this.conversationHistory.slice(-50)));
    } catch {}
  },

  clearHistory() {
    this.conversationHistory = [];
    this.saveHistory();
  },

  async processMessage(input) {
    const text = input.trim();
    if (!text) return { text: 'Please say or type something.', type: 'error' };

    this.conversationHistory.push({ role: 'user', text, time: Date.now() });

    const type = this.detectQuestionType(text);
    let response;

    if (type === 'wedding' || type === 'guest') {
      response = this.getWeddingAnswer(text);
    } else if (type === 'greeting') {
      response = this.getGreetingResponse(text);
    } else if (type === 'about_ai') {
      response = this.getAboutAIResponse(text);
    } else {
      response = this.getGeneralAnswer(text);
    }

    this.conversationHistory.push({ role: 'ai', text: response, time: Date.now() });
    this.saveHistory();

    return { text: response, type };
  },

  detectQuestionType(text) {
    const lower = text.toLowerCase();

    const weddingKeywords = [
      'wedding', 'venue', 'ceremony', 'reception', 'dress code', 'rsvp',
      'gift', 'registry', 'schedule', 'timeline', 'bridesmaid', 'groomsmen',
      'accommodation', 'hotel', 'directions', 'address', 'groom', 'bride',
      'couple', 'marry', 'marriage', 'vows', 'party', 'celebration',
      'invitation', 'invite', 'guest', 'seating', 'menu', 'food', 'cake',
      'flower', 'photographer', 'music', 'dj', 'officiant', 'program',
      'rehearsal', 'honeymoon', 'church', 'temple', 'location', 'map',
      'parking', 'transport', 'weather', 'plus one', 'children', 'kids',
      'dietary', 'allergies', 'alcohol', 'bar', 'toast', 'speech',
      'attire', 'outfit', 'color', 'theme', 'decor', 'tradition'
    ];

    const count = weddingKeywords.filter(k => lower.includes(k)).length;
    if (count >= 1) return 'wedding';

    const guestKeywords = [
      'my name', 'i am', 'i will', 'i want', 'my rsvp', 'i replied',
      'can i', 'should i', 'do i', 'am i', 'where do i', 'how do i'
    ];
    if (guestKeywords.some(k => lower.includes(k))) return 'guest';

    const greetingKeywords = [
      'hello', 'hi ', 'hey', 'good morning', 'good afternoon', 'good evening',
      'how are you', 'what\'s up', 'sup', 'greetings', 'howdy'
    ];
    if (greetingKeywords.some(k => lower.includes(k))) return 'greeting';

    const aboutAI = [
      'who are you', 'what are you', 'what can you do', 'how do you work',
      'are you real', 'are you ai', 'tell me about yourself', 'your name',
      'who made you', 'who created you'
    ];
    if (aboutAI.some(k => lower.includes(k))) return 'about_ai';

    return 'general';
  },

  getGreetingResponse(text) {
    const lower = text.toLowerCase();
    const hour = new Date().getHours();
    let timeGreeting = 'Hello';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    const greetings = [
      `${timeGreeting}! I'm the wedding concierge. How can I help you today? 💛`,
      `${timeGreeting} and welcome! Feel free to ask me anything about the wedding.`,
      `Hi there! ${timeGreeting}! I'm here to answer all your wedding questions.`
    ];

    if (lower.includes('how are you')) {
      return "I'm doing wonderful, thank you for asking! I'm here and ready to help with any questions about the wedding. What can I assist you with? 💛";
    }

    return greetings[Math.floor(Math.random() * greetings.length)];
  },

  getAboutAIResponse(text) {
    return "I'm the AI Wedding Concierge! I can help you with:\n\n💍 **Wedding Questions** — venue details, dress code, RSVP, schedule, gifts, and more\n🧠 **General Knowledge** — answer questions about the world, give advice, tell jokes, and more\n🎤 **Voice Interaction** — you can speak to me and I'll respond\n\nJust type or speak your question and I'll do my best to help!";
  },

  getWeddingAnswer(text) {
    const d = this.weddingData;
    const lower = text.toLowerCase();

    if (!d.groomName && !d.venue) {
      return "I couldn't find the wedding information in the database. Please contact the couple for more information.";
    }

    if (lower.includes('when') || lower.includes('date') || lower.includes('what day') || lower.includes('what time')) {
      if (d.weddingDate) {
        let dateStr = d.weddingDate;
        try {
          const dt = new Date(d.weddingDate);
          if (!isNaN(dt.getTime())) dateStr = dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } catch {}
        const time = d.weddingTime || d.time || '';
        const venue = d.venue || '';
        return `The wedding is on ${dateStr}${time ? ' at ' + time : ''}.${venue ? ` It will be held at ${venue}.` : ''}`;
      }
      if (d.venue) return `The wedding will be held at ${d.venue}${d.city ? ', ' + d.city : ''}.`;
      return "I couldn't find the wedding date in the wedding information. Please contact the couple for more information.";
    }

    if (lower.includes('venue') || lower.includes('address') || lower.includes('location') || lower.includes('where')) {
      const parts = [d.venue, d.address, d.city, d.state, d.country].filter(Boolean);
      if (parts.length) return `The wedding venue is ${parts.join(', ')}.`;
      return "I couldn't find the venue information in the wedding details.";
    }

    if (lower.includes('dress code') || lower.includes('wear') || lower.includes('attire') || lower.includes('outfit') || lower.includes('what to')) {
      if (d.dressCode) return `The dress code for the wedding is: ${d.dressCode}.`;
      return "I couldn't find specific dress code information. I recommend reaching out to the couple for guidance on attire.";
    }

    if (lower.includes('guest') || lower.includes('plus one') || lower.includes('bring') || lower.includes('children') || lower.includes('kids')) {
      return "If you have any questions about bringing guests or children, please reach out to the couple directly. You can also indicate your preferences when you RSVP.";
    }

    if (lower.includes('rsvp') || lower.includes('confirm')) {
      return `You can RSVP by visiting the RSVP section on the wedding website. Just fill in your name, contact details, and let us know if you'll be attending.${d.date ? ` We kindly ask you to RSVP before the wedding date.` : ''}`;
    }

    if (lower.includes('gift') || lower.includes('registry') || lower.includes('present') || lower.includes('what to bring')) {
      return "Your presence at the wedding is the greatest gift we could ask for! If you wish to honor us further, you can check the Gift Registry section on the website for gift ideas and bank details. Thank you for your generosity!";
    }

    if (lower.includes('schedule') || lower.includes('timeline') || lower.includes('itinerary') || lower.includes('program') || lower.includes('agenda')) {
      return "The wedding schedule and event details can be found on the Events section of the website. You'll find the timeline for the ceremony, reception, and any other planned activities.";
    }

    if (lower.includes('bridesmaid') || lower.includes('maid of honor')) {
      return "You can find information about the bridal party on the wedding website. If specific names aren't listed, feel free to ask the couple directly!";
    }

    if (lower.includes('groomsmen') || lower.includes('best man')) {
      return "You can find information about the groomsmen on the wedding website. If specific names aren't listed, feel free to ask the couple directly!";
    }

    if (lower.includes('contact') || lower.includes('reach') || lower.includes('phone') || lower.includes('email') || lower.includes('call')) {
      const phone = d.phone || d.contactPhone || d.groomPhone || d.bridePhone;
      const email = d.email || d.contactEmail;
      if (phone || email) {
        let msg = 'You can contact the couple through the following:';
        if (phone) msg += `\n📞 Phone: ${phone}`;
        if (email) msg += `\n📧 Email: ${email}`;
        return msg;
      }
      return "You can find contact information in the Contact section of the wedding website.";
    }

    if (lower.includes('accommodation') || lower.includes('hotel') || lower.includes('stay') || lower.includes('lodging') || lower.includes('sleep')) {
      return "For information about accommodation and hotels, please check the wedding website or contact the couple directly for recommendations on places to stay.";
    }

    if (lower.includes('direction') || lower.includes('get there') || lower.includes('how to find') || lower.includes('navigate') || lower.includes('drive')) {
      if (d.venue && d.city) {
        const q = encodeURIComponent([d.venue, d.city, d.state, d.country].filter(Boolean).join(', '));
        return `You can get directions to ${d.venue} by using the Location section on the website, which has a map and directions button. Here's a Google Maps link: https://www.google.com/maps/search/${q}`;
      }
      return "You can find directions and a map in the Location section of the wedding website.";
    }

    if (lower.includes('dietary') || lower.includes('food') || lower.includes('menu') || lower.includes('allergies') || lower.includes('meal')) {
      return "If you have any dietary restrictions or food allergies, please mention them when you RSVP so the couple can make appropriate arrangements.";
    }

    if (lower.includes('parking') || lower.includes('transport') || lower.includes('shuttle')) {
      return "For information about parking and transportation, please check the wedding website or contact the couple directly.";
    }

    if (lower.includes('photo') || lower.includes('photograph') || lower.includes('picture') || lower.includes('gallery')) {
      return "You can find photos in the Gallery section of the wedding website. The couple may also share photos after the wedding.";
    }

    if (lower.includes('song') || lower.includes('music') || lower.includes('dance') || lower.includes('playlist')) {
      return "There will be music and dancing at the reception! Feel free to check the Events section for more details about the entertainment.";
    }

    if (lower.includes('color') || lower.includes('theme')) {
      return `The wedding theme colors and decorations can be found on the wedding website. ${d.dressCode ? `The dress code is: ${d.dressCode}.` : ''}`;
    }

    const groomName = d.groomName || 'Groom';
    const brideName = d.brideName || 'Bride';
    const venue = d.venue || 'the venue';

    const fallbacks = [
      `The wedding of ${groomName} and ${brideName} will be a beautiful celebration at ${venue}. Is there something specific you'd like to know?`,
      `I'm here to help! You can ask me about the venue, schedule, RSVP, gifts, dress code, or anything else about ${groomName} & ${brideName}'s wedding.`,
      `I'm not sure I have that specific detail. Please check the website or contact ${groomName} or ${brideName} directly for more information.`
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  },

  getGeneralAnswer(text) {
    const lower = text.toLowerCase().replace(/[^\w\s]/g, ' ');

    if (lower.includes('president') && (lower.includes('nigeria') || lower.includes('nigerian'))) {
      return "As of 2026, the President of Nigeria is Bola Ahmed Tinubu, who has been in office since May 29, 2023. He is the 16th President of the Federal Republic of Nigeria.";
    }

    if (lower.includes('president') && (lower.includes('united states') || lower.includes('america') || lower.includes('usa') || lower.includes('us'))) {
      return "As of 2026, the President of the United States is Donald Trump, who began his second term on January 20, 2025, after winning the 2024 presidential election.";
    }

    if (lower.includes('what is ai') || lower.includes('what is artificial intelligence') || lower.includes('define ai') || (lower.includes('ai') && (lower.includes('meaning') || lower.includes('explain')))) {
      return "Artificial Intelligence (AI) is a branch of computer science that creates systems capable of performing tasks that typically require human intelligence. These include learning, reasoning, problem-solving, perception, and language understanding. AI powers everything from chatbots like me to self-driving cars and medical diagnosis systems.";
    }

    if ((lower.includes('joke') || lower.includes('funny') || lower.includes('humor') || lower.includes('laugh')) && !lower.includes('dont')) {
      const jokes = [
        "Why don't wedding cakes ever get lonely? Because they always have a 'tier'-ific party! 🎂",
        "What did the groom say to the bride at the altar? 'I love you a latte!' ☕",
        "Why do married couples live longer? Because they can't finish arguments — someone always interrupts! 😄",
        "What's a wedding planner's favorite type of music? Anything with a good 'processional'! 🎵",
        "I told my computer I needed a break from wedding planning. Now it's sending me 'no-reply' emails. 💻"
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    if (lower.includes('capital') && (lower.includes('france') || lower.includes('paris'))) {
      return "The capital of France is Paris, which is also its largest city. Paris is known as the 'City of Light' and is famous for landmarks like the Eiffel Tower, the Louvre Museum, and Notre-Dame Cathedral.";
    }

    if (lower.includes('capital') && (lower.includes('nigeria') || lower.includes('abuja'))) {
      return "The capital of Nigeria is Abuja, located in the Federal Capital Territory. Abuja replaced Lagos as the capital on December 12, 1991, and is known for its modern architecture and the Aso Rock.";
    }

    if (lower.includes('capital') && (lower.includes('england') || lower.includes('uk') || lower.includes('united kingdom') || lower.includes('london'))) {
      return "The capital of the United Kingdom is London, one of the world's most influential cities. It's known for the Tower of London, Buckingham Palace, the British Museum, and the Houses of Parliament.";
    }

    if (lower.includes('capital') && (lower.includes('japan') || lower.includes('tokyo'))) {
      return "The capital of Japan is Tokyo, one of the most populous cities in the world. Tokyo is a blend of traditional culture and cutting-edge technology, known for temples, neon-lit skyscrapers, and world-class cuisine.";
    }

    if (lower.includes('programming') || (lower.includes('code') && (lower.includes('what') || lower.includes('explain') || lower.includes('learn')))) {
      return "Programming is the process of creating instructions that a computer can follow to perform specific tasks. It involves writing code in languages like Python, JavaScript, or C++ to build software, websites, apps, and more. Think of it like writing a recipe — each step tells the computer exactly what to do!";
    }

    if (lower.includes('poem') || lower.includes('poetry') || lower.includes('write a')) {
      const poems = [
        "Here's a little poem for you:\n\n**Love's Eternal Bloom**\n\nTwo hearts entwined beneath the sky,\nA promise made, a joyful cry.\nThrough seasons change and time's embrace,\nTogether finding their special place.\n\nWith every laugh and every tear,\nTheir love grows stronger year by year.\nA timeless bond, a sacred vow,\nForever starts right here, right now. 💛",
        "**A Wedding Day**\n\nThe flowers bloom, the music plays,\nA celebration of love's sweet ways.\nFamily gathers, friends unite,\nTo witness love so pure and bright.\n\nThe rings exchange, the vows are said,\nA new beginning lies ahead.\nTwo souls now one, a perfect blend,\nA beautiful journey without end. 💕"
      ];
      return poems[Math.floor(Math.random() * poems.length)];
    }

    if (lower.includes('relationship advice') || lower.includes('love advice') || lower.includes('marriage advice')) {
      return "Here's some heartfelt relationship advice:\n\n1️⃣ **Communication is key** — Talk openly and listen actively.\n2️⃣ **Trust and respect** — These are the foundation of any strong relationship.\n3️⃣ **Quality time** — Make time for each other, even in busy seasons.\n4️⃣ **Forgiveness** — No one is perfect; learn to forgive and grow together.\n5️⃣ **Laughter** — Never underestimate the power of shared laughter.\n\nRemember, a successful relationship requires work from both sides, but the reward is a lifetime of love and companionship! 💛";
    }

    if (lower.includes('governor') && lower.includes('nigeria')) {
      return "Nigeria has 36 states, each with its own governor. Which state would you like to know about? I can tell you about a specific governor if you name the state.";
    }

    if (lower.includes('machine learning') || lower.includes('deep learning')) {
      return "Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. Deep Learning is a further subset that uses neural networks with many layers to analyze complex patterns. Together, they power technologies like voice assistants, image recognition, and recommendation systems.";
    }

    if (lower.includes('python') && (lower.includes('what') || lower.includes('explain') || lower.includes('language'))) {
      return "Python is a high-level, interpreted programming language known for its readability and versatility. It's widely used in web development, data science, AI, automation, and more. Guido van Rossum created Python, and its design philosophy emphasizes code readability with significant indentation.";
    }

    if (lower.includes('javascript') && (lower.includes('what') || lower.includes('explain') || lower.includes('language'))) {
      return "JavaScript is a high-level programming language primarily used for creating interactive websites. It's one of the core technologies of the web, alongside HTML and CSS. JavaScript runs in the browser and allows developers to create dynamic content, animations, and full web applications.";
    }

    if (lower.includes('blockchain') && (lower.includes('what') || lower.includes('explain'))) {
      return "Blockchain is a decentralized, distributed ledger technology that records transactions across many computers. Each 'block' contains a set of transactions, linked together in a 'chain.' It's best known for powering cryptocurrencies like Bitcoin and Ethereum, but also has applications in supply chain, healthcare, and voting systems.";
    }

    if ((lower.includes('thank') || lower.includes('thanks')) && !lower.includes('no thanks')) {
      return "You're very welcome! I'm always here to help. If you have any more questions, feel free to ask. 😊💛";
    }

    if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you') || lower.includes('talk later')) {
      return "Goodbye! It was lovely chatting with you. Feel free to come back anytime you have questions about the wedding. Have a wonderful day! 💛";
    }

    if (lower.includes('weather') && (lower.includes('today') || lower.includes('now') || lower.includes('outside'))) {
      return "I'm not connected to live weather data, but I'd suggest checking a weather app or website like weather.com for the most accurate forecast. If you're asking about the wedding day, you can check the weather closer to the date!";
    }

    if (lower.includes('time') && (lower.includes('now') || lower.includes('current') || lower.includes('what time'))) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`;
    }

    if (lower.includes('date') && (lower.includes('today') || lower.includes('current') || lower.includes('what date'))) {
      const now = new Date();
      return `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
    }

    if (lower.includes('name') && (lower.includes('your') || lower.includes('what is'))) {
      return "My name is the AI Wedding Concierge! I'm here to help you with questions about the wedding and more. What can I assist you with? 💛";
    }

    if (lower.includes('who created') || lower.includes('who made') || lower.includes('who developed') || lower.includes('who built')) {
      return "I was created by David Leelee Douglas (Stonyboy) as part of this wedding platform. He's a skilled developer passionate about building beautiful, AI-powered web experiences! 💛";
    }

    if (lower.includes('inspire') || lower.includes('motivate') || lower.includes('quote')) {
      const quotes = [
        "Here's an inspiring quote for you:\n\n**'The best thing to hold onto in life is each other.'** — Audrey Hepburn 💛",
        "**'A successful marriage requires falling in love many times, always with the same person.'** — Mignon McLaughlin",
        "**'Love is not about how many days, months, or years you've been together. Love is about how much you love each other every single day.'**",
        "**'The greatest thing you'll ever learn is just to love and be loved in return.'** — Eden Ahbez",
        "**'Where there is love, there is life.'** — Mahatma Gandhi"
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    }

    if (lower.includes('happiness') || lower.includes('happy')) {
      return "Happiness is found in the little moments — a shared smile, a warm embrace, a beautiful sunset, or the laughter of loved ones. The key to happiness is gratitude, kindness, and living in the present moment. What makes you happy? 😊";
    }

    if (lower.includes('success') && (lower.includes('key') || lower.includes('secret') || lower.includes('how to'))) {
      return "Success means different things to different people, but here are some universal principles:\n\n1️⃣ **Set clear goals** — Know what you're working toward.\n2️⃣ **Stay consistent** — Small daily efforts lead to big results.\n3️⃣ **Never stop learning** — Growth comes from knowledge.\n4️⃣ **Embrace failure** — Every setback is a setup for a comeback.\n5️⃣ **Surround yourself with positivity** — Your environment shapes your success.\n\nBelieve in yourself and keep moving forward! 🚀";
    }

    if (lower.includes('music') || lower.includes('song')) {
      return "Music is a beautiful part of life! Whether you're into afrobeats, pop, classical, or traditional wedding songs, there's something for everyone. What kind of music do you enjoy?";
    }

    if (lower.includes('sport') || lower.includes('football') || lower.includes('soccer') || lower.includes('basketball')) {
      return "Sports bring people together! Whether it's football (soccer), basketball, athletics, or traditional sports — they teach teamwork, discipline, and perseverance. Who's your favorite team or athlete?";
    }

    if (lower.includes('africa') && !lower.includes('capital')) {
      return "Africa is a beautiful and diverse continent with 54 countries, rich cultures, languages, and traditions. From the pyramids of Egypt to the wildlife of Kenya, from Nigeria's vibrant energy to South Africa's stunning landscapes — Africa is a land of incredible beauty and potential! 🌍";
    }

    if (lower.includes('nigeria') && !lower.includes('capital') && !lower.includes('president')) {
      return "Nigeria is a vibrant country in West Africa, known as the 'Giant of Africa.' It's home to over 200 million people, 250+ ethnic groups, and a rich culture of music, film (Nollywood), food, and fashion. Major cities include Lagos, Abuja (the capital), and Port Harcourt. Nigeria is also known for its Afrobeat music, delicious jollof rice, and warm, hospitable people! 🇳🇬";
    }

    if (lower.includes('internet') || lower.includes('website') || lower.includes('web')) {
      return "The internet is a global network connecting millions of computers worldwide. It powers websites, social media, email, streaming, and much more. The World Wide Web (WWW) was invented by Tim Berners-Lee in 1989, and since then, it has transformed how we live, work, and connect. This wedding website is a perfect example of how the web brings people together! 🌐";
    }

    const generalFallbacks = [
      "That's an interesting question! I'm not sure I have the answer to that specific one, but I can help with wedding-related questions or you can ask me something else!",
      "Great question! While I don't have that exact information, I'm happy to help with other questions. Ask me about the wedding, general knowledge, or just chat!",
      "I don't have a specific answer for that, but I'm always learning! Feel free to ask me about the wedding, general topics, or just say hello. 😊",
      "Hmm, I'm not quite sure about that. But here's what I can do — answer wedding questions, share knowledge, tell jokes, write poems, and more! What would you like to know?",
      "I'd love to help with that, but I don't have enough information to give a complete answer. Try asking me about the wedding or another topic!"
    ];
    return generalFallbacks[Math.floor(Math.random() * generalFallbacks.length)];
  },

  startVoiceInput() {
    if (!this.voiceSupported || !this.recognition) {
      return false;
    }
    if (this.isListening) return true;
    try {
      this.isListening = true;
      this.recognition.start();
      return true;
    } catch {
      this.isListening = false;
      return false;
    }
  },

  stopVoiceInput() {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch {}
      this.isListening = false;
    }
  },

  speak(text) {
    if (!window.speechSynthesis) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#\n\[\]\(\)]/g, ' ').replace(/\s+/g, ' '));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    this.speaking = true;
    utterance.onend = () => { this.speaking = false; };
    utterance.onerror = () => { this.speaking = false; };
    window.speechSynthesis.speak(utterance);
    return true;
  },

  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.speaking = false;
  },

  getSuggestedQuestions() {
    return [
      "When is the wedding?",
      "What is the dress code?",
      "Where is the venue?"
    ];
  },

  getQuickReplies() {
    return [
      { text: "Tell me a joke", icon: "fa-smile" },
      { text: "Who is the President of Nigeria?", icon: "fa-flag" },
      { text: "Write a poem", icon: "fa-feather" },
      { text: "Give relationship advice", icon: "fa-heart" },
      { text: "What is AI?", icon: "fa-robot" },
      { text: "Capital of France", icon: "fa-globe" }
    ];
  },

  getWelcomeMessage() {
    return "Hello and welcome to our wedding website! 🎉\n\nI can answer questions about our wedding, RSVP, venue, schedule, directions, accommodations, and many other topics. Feel free to ask me anything.";
  }
};
