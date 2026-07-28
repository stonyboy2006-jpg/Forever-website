/**
 * AI Content Generator Module
 * Generates wedding vows, speeches, toasts, bios, and stories
 */
(function(){
  'use strict';
  var W=window.__WEDDING_AI_CONTENT=window.__WEDDING_AI_CONTENT||{};
  if(W.initialized)return;
  W.initialized=true;

  var TEMPLATES={
    vow_classic:[
      "I, [name], take you, [partner], to be my lawfully wedded [role]. In sickness and in health, in richness and in poorness, I will love and honor you for all the days of my life.",
      "Before God and those gathered here today, I, [name], choose you, [partner], as my partner for life. I promise to love you unconditionally, to support your dreams, and to stand by your side through whatever comes our way.",
      "Today, surrounded by those we love most, I vow to be your faithful partner, your constant friend, and your true love. I promise to laugh with you, cry with you, and grow with you."
    ],
    vow_modern:[
      "I promise to be your biggest fan and your safest place. I'll make you laugh when you don't feel like it, and I'll hold your hand through every storm. You're my favorite adventure, and I choose you — today, tomorrow, and every day after.",
      "I vow to always leave the last slice of pizza for you, to never stop learning who you are, and to love you even when you leave the lights on. You're my person, and I'm all yours.",
      "Here's my promise: I will always be honest with you, kind, patient, and forgiving. I will be your partner in all things — the big decisions and the small ones. I love you more than words can say."
    ],
    vow_funny:[
      "I promise to love you, to honor you, and to never, ever touch your vinyl collection without permission. I will always let you have the remote (most of the time), and I will never judge your questionable taste in reality TV.",
      "I vow to always be your emergency contact, your plus-one at awkward family events, and the person who laughs at your jokes even when nobody else does. I love you more than WiFi.",
      "I promise to always make your coffee exactly the way you like it, to never use your towel, and to pretend I didn't see you ugly-cry during that movie. You're stuck with me forever."
    ],
    toast_bride:[
      "To [name] and [partner]! [name], watching you find your person has been one of the greatest joys of my life. You deserve all the happiness in the world, and I can see you've found it. Here's to a lifetime of love, laughter, and happily ever after.",
      "When [name] first told me about [partner], I knew something special was happening. The way your eyes light up when you talk about each other — that's what everyone hopes to find. Cheers to the happy couple!",
      "To the bride and groom! [name], you look absolutely stunning today. [partner], you're one lucky person. Take care of each other, never go to bed angry, and always remember why you fell in love. Congratulations!"
    ],
    toast_groom:[
      "To [partner] — the most beautiful bride I've ever seen. [name], today I marry my best friend. Thank you for choosing me, for believing in us, and for making every day brighter just by being you. I love you.",
      "When I think about our journey together, I'm amazed at how two people can grow so close. [partner], you complete me in ways I never knew I needed. Here's to forever.",
      "To my wonderful [partner] — today is just the beginning of our greatest adventure. I promise to love you, to protect you, and to make you smile every single day. You're everything to me."
    ],
    bio_creative:[
      "A match made in heaven, [name] and [partner] first crossed paths at [location/occasion]. What started as a conversation that lasted all night has turned into a love story that will last a lifetime.",
      "[name] and [partner]'s love story began with [how they met]. From that moment on, they knew they had found something special. Now, surrounded by the people they love most, they're ready to start their next chapter together.",
      "Two hearts, one love. [name] and [partner] believe that love is not just about finding the right person, but about being the right person. Today, they celebrate their love with all of you."
    ],
    story_romantic:[
      "In a world full of fleeting moments, [name] and [partner] found something timeless. Their love story is one of laughter, adventure, and unwavering support for each other. Today marks the beginning of forever.",
      "They say that when you know, you know. And from the very first date at [location], both [name] and [partner] knew they had found their forever person. Join us as they celebrate their love.",
      "[name] and [partner]'s love is the kind that inspires everyone around them. Through every challenge and every triumph, they've remained each other's biggest supporters. Today, they make it official."
    ]
  };

  var REMINDER_TEMPLATES=[
    {days:90,title:'Save the Date',desc:'Send save the date notifications to guests'},
    {days:60,title:'Formal Invitations',desc:'Send formal wedding invitations'},
    {days:30,title:'RSVP Deadline',desc:'Final RSVP collection deadline'},
    {days:14,title:'Final Headcount',desc:'Confirm final guest count with venue'},
    {days:7,title:'Rehearsal Dinner',desc:'Schedule and plan rehearsal dinner'},
    {days:3,title:'Welcome Bags',desc:'Prepare and distribute welcome bags'},
    {days:1,title:'Final Details',desc:'Confirm all vendor arrangements'},
    {days:0,title:'Wedding Day!',desc:'It\'s your special day!'}
  ];

  W.generate=function(type,options){
    options=options||{};
    var name=options.name||'';
    var partner=options.partner||'';
    var location=options.location||'';
    var role=options.role||'bride';

    var templates=TEMPLATES[type]||TEMPLATES.vow_classic;
    var template=templates[Math.floor(Math.random()*templates.length)];
    var result=template
      .replace(/\[name\]/g,name||'the bride')
      .replace(/\[partner\]/g,partner||'the groom')
      .replace(/\[role\]/g,role==='bride'?'bride':'groom')
      .replace(/\[location\/occasion\]/g,location||'a mutual friend\'s party')
      .replace(/\[location\]/g,location||'the most wonderful place');
    return result;
  };

  W.generateMultiple=function(type,count,options){
    var results=[];
    var seen=new Set();
    count=count||3;
    for(var i=0;i<count*3&&results.length<count;i++){
      var generated=W.generate(type,options);
      var hash=generated.substring(0,30);
      if(!seen.has(hash)){seen.add(hash);results.push(generated);}
    }
    return results;
  };

  W.getCategories=function(){
    return[
      {id:'vow_classic',label:'Classic Vows',icon:'fa-book'},
      {id:'vow_modern',label:'Modern Vows',icon:'fa-heart'},
      {id:'vow_funny',label:'Funny Vows',icon:'fa-laugh'},
      {id:'toast_bride',label:'Bride Toast',icon:'fa-champagne-glasses'},
      {id:'toast_groom',label:'Groom Toast',icon:'fa-wine-glass'},
      {id:'bio_creative',label:'Couple Bio',icon:'fa-user-group'},
      {id:'story_romantic',label:'Love Story',icon:'fa-book-open'}
    ];
  };

  W.getReminderTemplates=function(){return REMINDER_TEMPLATES;};

  W.renderGenerator=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    var categories=W.getCategories();
    el.innerHTML='\n'+
      '<div style="max-width:700px;margin:0 auto">\n'+
      '  <h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px;text-align:center"><i class="fas fa-wand-magic-sparkles" style="margin-right:8px"></i>AI Content Generator</h2>\n'+
      '  <div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08);margin-bottom:20px">\n'+
      '    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">\n'+
      '      <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Your Name</label><input id="aiName" placeholder="e.g., Sarah" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem"></div>\n'+
      '      <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Partner Name</label><input id="aiPartner" placeholder="e.g., James" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem"></div>\n'+
      '    </div>\n'+
      '    <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Category</label>\n'+
      '      <div style="display:flex;flex-wrap:wrap;gap:8px" id="aiCategories">\n'+
      categories.map(function(c){
        return '<button onclick="WeddingAIContent.selectCategory(\''+c.id+'\')" data-cat="'+c.id+'" style="padding:8px 14px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.1);border-radius:8px;color:#A09888;cursor:pointer;font-size:0.8rem;transition:all 0.2s"><i class="fas '+c.icon+'" style="margin-right:4px"></i>'+c.label+'</button>';
      }).join('')+
      '      </div>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <button onclick="WeddingAIContent.generate()" id="aiGenerateBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:12px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif;font-size:0.95rem;margin-bottom:20px"><i class="fas fa-wand-magic-sparkles" style="margin-right:8px"></i>Generate Content</button>\n'+
      '  <div id="aiResults"></div>\n'+
      '</div>\n';
    W._selectedCategory='vow_classic';
    W.selectCategory('vow_classic');
  };

  W.selectCategory=function(cat){
    W._selectedCategory=cat;
    document.querySelectorAll('#aiCategories button').forEach(function(b){
      b.style.background=b.getAttribute('data-cat')===cat?'rgba(212,175,55,0.15)':'rgba(212,175,55,0.06)';
      b.style.color=b.getAttribute('data-cat')===cat?'#D4AF37':'#A09888';
      b.style.borderColor=b.getAttribute('data-cat')===cat?'rgba(212,175,55,0.3)':'rgba(212,175,55,0.1)';
    });
  };

  W.generate=function(){
    var name=document.getElementById('aiName').value;
    var partner=document.getElementById('aiPartner').value;
    var results=W.generateMultiple(W._selectedCategory,3,{name:name,partner:partner});
    var el=document.getElementById('aiResults');if(!el)return;
    el.innerHTML=results.map(function(r,i){
      return '<div class="glass-card" style="padding:20px;border-radius:14px;border:1px solid rgba(212,175,55,0.08);margin-bottom:12px;position:relative">'+
        '<p style="color:#E8E0D0;font-size:0.9rem;line-height:1.7;font-style:italic;margin-bottom:12px">"'+escapeHTML(r)+'"</p>'+
        '<div style="display:flex;gap:8px">'+
        '<button onclick="WeddingAIContent.copy(\''+escapeJS(r)+'\')" style="padding:6px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.15);border-radius:8px;color:#D4AF37;cursor:pointer;font-size:0.78rem"><i class="fas fa-copy" style="margin-right:4px"></i>Copy</button>'+
        '<button onclick="WeddingAIContent.save(\''+escapeJS(r)+'\')" style="padding:6px 14px;background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.15);border-radius:8px;color:#4CAF50;cursor:pointer;font-size:0.78rem"><i class="fas fa-save" style="margin-right:4px"></i>Save</button>'+
        '</div></div>';
    }).join('');
    if(typeof notify==='function')notify('Content generated!','success');
  };

  W.copy=function(text){
    if(navigator.clipboard)navigator.clipboard.writeText(text);
    if(typeof notify==='function')notify('Copied to clipboard!','success');
  };

  W.save=function(text){
    var saved=JSON.parse(localStorage.getItem('weddingSavedContent')||'[]');
    saved.push({text:text,category:W._selectedCategory,savedAt:new Date().toISOString()});
    localStorage.setItem('weddingSavedContent',JSON.stringify(saved));
    if(typeof notify==='function')notify('Content saved!','success');
  };

  function escapeHTML(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function escapeJS(s){return escapeHTML(s).replace(/'/g,"\\'").replace(/\n/g,'\\n');}

  window.WeddingAIContent=W;
    // AI Content Generator initialized
})();
