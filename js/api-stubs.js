/**
 * API Stubs & Integration Documentation
 * Client-side API wrappers for potential backend integration
 */
(function(){
  'use strict';
  var W=window.__WEDDING_API=window.__WEDDING_API||{};
  if(W.initialized)return;
  W.initialized=true;

  var CONFIG_KEY='weddingAPIConfig';

  function getAPIConfig(){
    try{return JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}');}catch(e){return{};}
  }
  function saveAPIConfig(c){localStorage.setItem(CONFIG_KEY,JSON.stringify(c));}

  W.configure=function(options){
    var config=getAPIConfig();
    if(options.baseURL)config.baseURL=options.baseURL;
    if(options.apiKey)config.apiKey=options.apiKey;
    if(options.emailProvider)config.emailProvider=options.emailProvider;
    if(options.smsProvider)config.smsProvider=options.smsProvider;
    if(options.paymentProvider)config.paymentProvider=options.paymentProvider;
    saveAPIConfig(config);
    return config;
  };

  W.getConfig=getAPIConfig;

  W.email={
    send:function(to,subject,body,options){
      console.log('[API Stub] Email send:',{to:to,subject:subject,body:body,options:options});
      return Promise.resolve({success:true,provider:'mailto',message:'mailto: link generated',mailtoLink:'mailto:'+to+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)});
    },
    sendBulk:function(recipients,template){
      console.log('[API Stub] Email bulk send:',{recipients:recipients.length,template:template});
      return Promise.resolve({success:true,provider:'mailto',sent:recipients.length,failed:0});
    },
    sendReminder:function(guestEmail,guestName,weddingDate,daysUntil){
      var subject='Wedding Reminder: '+daysUntil+' days to go!';
      var body='Hi '+guestName+',\n\nJust a friendly reminder that our wedding is in '+daysUntil+' day(s)!\n\nDate: '+weddingDate+'\n\nWe hope to see you there!\n\nWith love';
      return W.email.send(guestEmail,subject,body);
    },
    sendInvitation:function(guestEmail,guestName,inviteLink){
      var subject='You are invited to our wedding!';
      var body='Dear '+guestName+',\n\nYou are cordially invited to celebrate our special day with us!\n\nView your invitation: '+inviteLink+'\n\nPlease RSVP at your earliest convenience.\n\nWith love';
      return W.email.send(guestEmail,subject,body);
    }
  };

  W.sms={
    send:function(to,message){
      console.log('[API Stub] SMS send:',{to:to,message:message});
      return Promise.resolve({success:true,provider:'stub',note:'SMS requires backend integration with Twilio/MessageBird'});
    },
    sendBulk:function(recipients,message){
      console.log('[API Stub] SMS bulk send:',{count:recipients.length,message:message});
      return Promise.resolve({success:false,provider:'stub',note:'SMS bulk sending requires backend'});
    },
    sendReminder:function(to,name,daysUntil){
      var msg='Hi '+name+'! Reminder: Our wedding is in '+daysUntil+' day(s). We hope to see you there! - Forever & Always';
      return W.sms.send(to,msg);
    }
  };

  W.payment={
    initialize:function(amount,currency,description){
      console.log('[API Stub] Payment init:',{amount:amount,currency:currency,description:description});
      return Promise.resolve({
        success:true,
        provider:'stub',
        note:'Payment processing requires backend integration',
        reference:'PAY_'+Date.now(),
        amount:amount,
        currency:currency||'NGN'
      });
    },
    verify:function(reference){
      console.log('[API Stub] Payment verify:',{reference:reference});
      return Promise.resolve({success:true,status:'pending',note:'Payment verification requires backend'});
    },
    getGifts:function(){
      var gifts=[];
      try{gifts=JSON.parse(localStorage.getItem('weddingGifts')||'[]');}catch(e){}
      return Promise.resolve({success:true,gifts:gifts});
    },
    addGift:function(gift){
      var gifts=[];
      try{gifts=JSON.parse(localStorage.getItem('weddingGifts')||'[]');}catch(e){}
      gift.id='gift_'+Date.now();
      gift.createdAt=new Date().toISOString();
      gifts.push(gift);
      localStorage.setItem('weddingGifts',JSON.stringify(gifts));
      return Promise.resolve({success:true,gift:gift});
    }
  };

  W.calendar={
    generateICS:function(event){
      var ics='BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-/ForeverAndAlways/Wedding\nBEGIN:VEVENT\nDTSTART:'+formatICSDate(event.startDate)+'\nDTEND:'+formatICSDate(event.endDate||new Date(new Date(event.startDate).getTime()+3*3600*1000))+'\nSUMMARY:'+event.title+'\nDESCRIPTION:'+event.description+'\nLOCATION:'+event.location+'\nEND:VEVENT\nEND:VCALENDAR';
      return ics;
    },
    downloadICS:function(event){
      var ics=W.calendar.generateICS(event);
      var blob=new Blob([ics],{type:'text/calendar'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');a.href=url;a.download=(event.title||'wedding')+'.ics';
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return{success:true};
    },
    addToGoogleCalendar:function(event){
      var url='https://calendar.google.com/calendar/render?action=TEMPLATE'+
        '&text='+encodeURIComponent(event.title)+
        '&dates='+formatGoogleDate(event.startDate)+'/'+formatGoogleDate(event.endDate||new Date(new Date(event.startDate).getTime()+3*3600*1000))+
        '&details='+encodeURIComponent(event.description||'')+
        '&location='+encodeURIComponent(event.location||'');
      window.open(url,'_blank');
      return{success:true,url:url};
    }
  };

  W.share={
    native:function(data){
      if(navigator.share){
        return navigator.share({title:data.title,text:data.text,url:data.url});
      }
      return Promise.resolve({success:false,fallback:true});
    },
    facebook:function(url,text){
      window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)+'&quote='+encodeURIComponent(text),'_blank','width=600,height=400');
    },
    twitter:function(text,url){
      window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(url),'_blank','width=600,height=400');
    },
    whatsapp:function(text,url){
      window.open('https://wa.me/?text='+encodeURIComponent(text+' '+url),'_blank');
    },
    email:function(subject,body){
      window.location.href='mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    },
    copyLink:function(url){
      if(navigator.clipboard){navigator.clipboard.writeText(url);return Promise.resolve({success:true});}
      return Promise.resolve({success:false});
    }
  };

  W.storage={
    uploadToFirebase:function(file,path){
      console.log('[API Stub] Firebase Storage upload:',{file:file.name,path:path});
      return Promise.resolve({success:false,note:'Firebase Storage not configured',url:null});
    },
    deleteFromFirebase:function(url){
      console.log('[API Stub] Firebase Storage delete:',{url:url});
      return Promise.resolve({success:false,note:'Firebase Storage not configured'});
    }
  };

  W.firestore={
    save:function(collection,docId,data){
      console.log('[API Stub] Firestore save:',{collection:collection,docId:docId});
      return Promise.resolve({success:false,note:'Firebase Firestore not configured with real credentials'});
    },
    get:function(collection,docId){
      console.log('[API Stub] Firestore get:',{collection:collection,docId:docId});
      return Promise.resolve({success:false,note:'Firebase Firestore not configured'});
    },
    query:function(collection,filters){
      console.log('[API Stub] Firestore query:',{collection:collection,filters:filters});
      return Promise.resolve({success:false,results:[],note:'Firebase Firestore not configured'});
    }
  };

  W.renderAPIPanel=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    var config=getAPIConfig();
    el.innerHTML='\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '  <h3 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:16px"><i class="fas fa-plug" style="margin-right:8px"></i>API & Integrations</h3>\n'+
      '  <div style="margin-bottom:16px">\n'+
      '    <p style="color:#A09888;font-size:0.85rem;margin-bottom:12px">Configure external service integrations. Currently using client-side stubs.</p>\n'+
      '    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">\n'+
      '      <div><label style="display:block;color:#A09888;font-size:0.75rem;margin-bottom:4px">Base URL</label><input id="apiBaseURL" value="'+escapeHTML(config.baseURL||'')+'" placeholder="https://your-api.com" style="width:100%;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:8px;color:#E8E0D0;font-size:0.85rem"></div>\n'+
      '      <div><label style="display:block;color:#A09888;font-size:0.75rem;margin-bottom:4px">API Key</label><input id="apiKeyInput" type="password" value="'+escapeHTML(config.apiKey||'')+'" placeholder="your-api-key" style="width:100%;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:8px;color:#E8E0D0;font-size:0.85rem"></div>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px">\n'+
      '    <div style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(212,175,55,0.06)">\n'+
      '      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-envelope" style="color:#FF9800"></i><span style="color:#E8E0D0;font-size:0.85rem">Email</span></div>\n'+
      '      <p style="color:#666;font-size:0.78rem">Uses mailto: links. For SMTP/SendGrid, configure backend.</p>\n'+
      '    </div>\n'+
      '    <div style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(212,175,55,0.06)">\n'+
      '      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-comment" style="color:#4CAF50"></i><span style="color:#E8E0D0;font-size:0.85rem">SMS</span></div>\n'+
      '      <p style="color:#666;font-size:0.78rem">Stub only. Requires Twilio/MessageBird backend.</p>\n'+
      '    </div>\n'+
      '    <div style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(212,175,55,0.06)">\n'+
      '      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-credit-card" style="color:#2196F3"></i><span style="color:#E8E0D0;font-size:0.85rem">Payments</span></div>\n'+
      '      <p style="color:#666;font-size:0.78rem">Stub only. Requires Paystack/Flutterwave backend.</p>\n'+
      '    </div>\n'+
      '    <div style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(212,175,55,0.06)">\n'+
      '      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-calendar" style="color:#9C27B0"></i><span style="color:#E8E0D0;font-size:0.85rem">Calendar</span></div>\n'+
      '      <p style="color:#666;font-size:0.78rem">ICS download + Google Calendar links. Working client-side.</p>\n'+
      '    </div>\n'+
      '    <div style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(212,175,55,0.06)">\n'+
      '      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-share-nodes" style="color:#E8C4C0"></i><span style="color:#E8E0D0;font-size:0.85rem">Social Sharing</span></div>\n'+
      '      <p style="color:#666;font-size:0.78rem">Facebook, Twitter, WhatsApp, Native Share. Working.</p>\n'+
      '    </div>\n'+
      '    <div style="padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;border:1px solid rgba(212,175,55,0.06)">\n'+
      '      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><i class="fas fa-cloud" style="color:#00BCD4"></i><span style="color:#E8E0D0;font-size:0.85rem">Firebase</span></div>\n'+
      '      <p style="color:#666;font-size:0.78rem">Firestore + Storage. Requires real Firebase config.</p>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <button onclick="WeddingAPI.saveConfig()" style="padding:12px 24px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-save" style="margin-right:6px"></i>Save Configuration</button>\n'+
      '</div>\n';
  };

  W.saveConfig=function(){
    W.configure({
      baseURL:document.getElementById('apiBaseURL').value,
      apiKey:document.getElementById('apiKeyInput').value
    });
    if(typeof notify==='function')notify('API configuration saved','success');
  };

  function formatICSDate(d){var date=new Date(d);return date.getFullYear()+String(date.getMonth()+1).padStart(2,'0')+String(date.getDate()).padStart(2,'0')+'T'+String(date.getHours()).padStart(2,'0')+String(date.getMinutes()).padStart(2,'0')+'00';}
  function formatGoogleDate(d){return d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');}
  function escapeHTML(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  window.WeddingAPI=W;
  // API Stubs initialized
})();
