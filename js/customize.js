/**
 * Invitation Customizer
 * Live theme editor for the public invitation page
 */
(function(){
  'use strict';
  var W=window.__WEDDING_CUSTOMIZER=window.__WEDDING_CUSTOMIZER||{};
  if(W.initialized)return;
  W.initialized=true;

  var STORAGE_KEY='weddingInvitationCustomization';

  function getConfig(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){return{};}
  }
  function saveConfig(cfg){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(cfg));
    if(window.AuditLog)window.AuditLog.recordSettingsChange('Invitation customization updated');
  }

  function defaults(){
    return{
      primaryColor:'#D4AF37',
      secondaryColor:'#E8C4C0',
      accentColor:'#FFD700',
      textColor:'#E8E0D0',
      bgColor:'#0B0F19',
      cardBg:'rgba(255,255,255,0.03)',
      fontFamily:'Playfair Display',
      headingFont:'Playfair Display',
      bodyFont:'Poppins',
      borderRadius:16,
      showTimeline:true,
      showGuestList:true,
      showPhotos:true,
      showMap:true,
      showRSVP:true,
      showGifts:true,
      showMusic:true,
      showVideo:false,
      showFAQ:true,
      showAccommodation:true,
      showTransport:true,
      showEvents:true,
      heroLayout:'centered',
      heroOverlay:0.7,
      cardStyle:'glass',
      animationSpeed:0.3,
      enableParallax:true,
      enableParticles:true,
      enableConfetti:false,
      customCSS:'',
      logoUrl:'',
      faviconUrl:'',
      customHeading:'',
      customSubheading:'',
      footerText:'',
      socialLinks:{facebook:'',instagram:'',twitter:'',tiktok:''}
    };
  }

  W.getFullConfig=function(){
    var saved=getConfig();
    var def=defaults();
    var merged={};
    Object.keys(def).forEach(function(k){merged[k]=saved[k]!==undefined?saved[k]:def[k];});
    return merged;
  };

  W.updateConfig=function(updates){
    var cfg=W.getFullConfig();
    Object.keys(updates).forEach(function(k){if(updates[k]!==undefined)cfg[k]=updates[k];});
    saveConfig(cfg);
    return cfg;
  };

  W.resetToDefaults=function(){
    saveConfig(defaults());
    return defaults();
  };

  W.applyToPage=function(doc){
    var cfg=W.getFullConfig();
    var root=doc.documentElement;
    root.style.setProperty('--primary',cfg.primaryColor);
    root.style.setProperty('--secondary',cfg.secondaryColor);
    root.style.setProperty('--accent',cfg.accentColor);
    root.style.setProperty('--text',cfg.textColor);
    root.style.setProperty('--bg',cfg.bgColor);
    root.style.setProperty('--card-bg',cfg.cardBg);
    root.style.setProperty('--font-heading',cfg.headingFont);
    root.style.setProperty('--font-body',cfg.bodyFont);
    root.style.setProperty('--radius',cfg.borderRadius+'px');
    if(cfg.customCSS){
      var existing=doc.getElementById('customizer-css');
      if(existing)existing.remove();
      var style=doc.createElement('style');style.id='customizer-css';
      style.textContent=cfg.customCSS;doc.head.appendChild(style);
    }
  };

  W.exportCSS=function(){
    var cfg=W.getFullConfig();
    return ':root{\n'+
      '  --primary:'+cfg.primaryColor+';\n'+
      '  --secondary:'+cfg.secondaryColor+';\n'+
      '  --accent:'+cfg.accentColor+';\n'+
      '  --text:'+cfg.textColor+';\n'+
      '  --bg:'+cfg.bgColor+';\n'+
      '  --card-bg:'+cfg.cardBg+';\n'+
      '  --font-heading:'+cfg.headingFont+',serif;\n'+
      '  --font-body:'+cfg.bodyFont+',sans-serif;\n'+
      '  --radius:'+cfg.borderRadius+'px;\n'+
      '}\n';
  };

  W.renderCustomizerPage=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    var cfg=W.getFullConfig();
    el.innerHTML='\n'+
      '<div class="customizer-layout">\n'+
      '  <div class="customizer-controls">\n'+
      '    <h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px"><i class="fas fa-palette" style="margin-right:8px"></i>Invitation Customizer</h2>\n'+
      buildSection('Colors',[
        colorPicker('Primary Color','primaryColor',cfg.primaryColor),
        colorPicker('Secondary Color','secondaryColor',cfg.secondaryColor),
        colorPicker('Accent Color','accentColor',cfg.accentColor),
        colorPicker('Text Color','textColor',cfg.textColor),
        colorPicker('Background','bgColor',cfg.bgColor)
      ])+
      buildSection('Typography',[
        selectPicker('Heading Font','headingFont',cfg.headingFont,['Playfair Display','Cormorant Garamond','Great Vibes','Dancing Script','Cinzel']),
        selectPicker('Body Font','bodyFont',cfg.bodyFont,['Poppins','Lato','Montserrat','Raleway','Open Sans'])
      ])+
      buildSection('Layout',[
        rangePicker('Card Border Radius','borderRadius',cfg.borderRadius,0,40,'px'),
        rangePicker('Hero Overlay Opacity','heroOverlay',cfg.heroOverlay,0,1,0.05,''),
        selectPicker('Hero Layout','heroLayout',cfg.heroLayout,['centered','left-aligned','full-screen']),
        selectPicker('Card Style','cardStyle',cfg.cardStyle,['glass','solid','outline','minimal'])
      ])+
      buildSection('Sections',[
        toggleSwitch('Timeline',cfg.showTimeline,'showTimeline'),
        toggleSwitch('Guest List',cfg.showGuestList,'showGuestList'),
        toggleSwitch('Photo Gallery',cfg.showPhotos,'showPhotos'),
        toggleSwitch('Map & Venue',cfg.showMap,'showMap'),
        toggleSwitch('RSVP Form',cfg.showRSVP,'showRSVP'),
        toggleSwitch('Gift Registry',cfg.showGifts,'showGifts'),
        toggleSwitch('Music Player',cfg.showMusic,'showMusic'),
        toggleSwitch('Video Section',cfg.showVideo,'showVideo'),
        toggleSwitch('FAQ',cfg.showFAQ,'showFAQ'),
        toggleSwitch('Accommodation',cfg.showAccommodation,'showAccommodation'),
        toggleSwitch('Transportation',cfg.showTransport,'showTransport'),
        toggleSwitch('Events',cfg.showEvents,'showEvents')
      ])+
      buildSection('Effects',[
        toggleSwitch('Enable Parallax',cfg.enableParallax,'enableParallax'),
        toggleSwitch('Enable Particles',cfg.enableParticles,'enableParticles'),
        toggleSwitch('Enable Confetti',cfg.enableConfetti,'enableConfetti'),
        rangePicker('Animation Speed','animationSpeed',cfg.animationSpeed,0,1,0.1,'s')
      ])+
      buildSection('Content',[
        textInput('Custom Heading','customHeading',cfg.customHeading,'e.g., Join Us To Celebrate'),
        textInput('Custom Subheading','customSubheading',cfg.customSubheading,'e.g., The Wedding of'),
        textInput('Footer Text','footerText',cfg.footerText,'e.g., Made with love'),
        textInput('Logo URL','logoUrl',cfg.logoUrl,'https://...'),
        textInput('Favicon URL','faviconUrl',cfg.faviconUrl,'https://...')
      ])+
      buildSection('Social Links',[
        textInput('Facebook','facebook',cfg.socialLinks.facebook,'https://facebook.com/...'),
        textInput('Instagram','instagram',cfg.socialLinks.instagram,'https://instagram.com/...'),
        textInput('Twitter','twitter',cfg.socialLinks.twitter,'https://twitter.com/...'),
        textInput('TikTok','tiktok',cfg.socialLinks.tiktok,'https://tiktok.com/...')
      ])+
      buildSection('Custom CSS',[
        '<textarea id="custCSS" style="width:100%;min-height:120px;padding:12px;background:rgba(0,0,0,0.3);border:1px solid rgba(212,175,55,0.1);border-radius:10px;color:#E8E0D0;font-family:monospace;font-size:0.8rem;resize:vertical" placeholder="/* Custom CSS overrides */">'+escapeHTML(cfg.customCSS||'')+'</textarea>'
      ])+
      '    <div style="display:flex;gap:12px;margin-top:20px">\n'+
      '      <button onclick="WeddingCustomizer.saveAll()" style="flex:1;padding:14px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:12px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-save" style="margin-right:6px"></i>Save Theme</button>\n'+
      '      <button onclick="WeddingCustomizer.resetAll()" style="padding:14px 20px;background:rgba(244,67,54,0.1);border:1px solid rgba(244,67,54,0.2);border-radius:12px;color:#F44336;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-undo"></i></button>\n'+
      '      <button onclick="WeddingCustomizer.exportTheme()" style="padding:14px 20px;background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.2);border-radius:12px;color:#4CAF50;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-download"></i></button>\n'+
      '      <button onclick="WeddingCustomizer.previewTheme()" style="padding:14px 20px;background:rgba(33,150,243,0.1);border:1px solid rgba(33,150,243,0.2);border-radius:12px;color:#2196F3;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-external-link-alt"></i></button>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <div class="customizer-preview" id="custPreview"></div>\n'+
      '</div>\n';

    el.querySelectorAll('[data-config-key]').forEach(function(input){
      input.addEventListener('input',function(){W.updatePreview();});
    });
    W.updatePreview();
  };

  W.updatePreview=function(){
    var el=document.getElementById('custPreview');if(!el)return;
    var cfg=W.collectValues();
    el.innerHTML='\n'+
      '<div style="background:'+cfg.bgColor+';border-radius:16px;padding:32px;border:1px solid rgba(212,175,55,0.08);min-height:400px;position:relative;overflow:hidden">\n'+
      '  <div style="text-align:center;margin-bottom:24px">\n'+
      '    <div style="display:inline-block;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,'+cfg.primaryColor+','+cfg.secondaryColor+');margin-bottom:12px"></div>\n'+
      '    <h2 style="font-family:'+cfg.headingFont+',serif;color:'+cfg.primaryColor+';font-size:1.5rem;margin-bottom:4px">'+escapeHTML(cfg.customHeading||'Sarah & James')+'</h2>\n'+
      '    <p style="color:'+cfg.textColor+';font-family:'+cfg.bodyFont+',sans-serif;font-size:0.9rem">'+escapeHTML(cfg.customSubheading||'Are getting married!')+'</p>\n'+
      '  </div>\n'+
      '  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">\n'+
      '    <div style="text-align:center;padding:16px;background:'+cfg.cardBg+';border-radius:'+(cfg.borderRadius||16)+'px;border:1px solid '+cfg.primaryColor+'33"><div style="color:'+cfg.primaryColor+';font-size:1.3rem;font-family:'+cfg.headingFont+',serif">15</div><div style="color:'+cfg.textColor+';font-size:0.7rem">Days</div></div>\n'+
      '    <div style="text-align:center;padding:16px;background:'+cfg.cardBg+';border-radius:'+(cfg.borderRadius||16)+'px;border:1px solid '+cfg.primaryColor+'33"><div style="color:'+cfg.primaryColor+';font-size:1.3rem;font-family:'+cfg.headingFont+',serif">08</div><div style="color:'+cfg.textColor+';font-size:0.7rem">Hours</div></div>\n'+
      '    <div style="text-align:center;padding:16px;background:'+cfg.cardBg+';border-radius:'+(cfg.borderRadius||16)+'px;border:1px solid '+cfg.primaryColor+'33"><div style="color:'+cfg.primaryColor+';font-size:1.3rem;font-family:'+cfg.headingFont+',serif">42</div><div style="color:'+cfg.textColor+';font-size:0.7rem">Mins</div></div>\n'+
      '  </div>\n'+
      '  <div style="padding:20px;background:'+cfg.cardBg+';border-radius:'+(cfg.borderRadius||16)+'px;border:1px solid rgba(212,175,55,0.08);margin-bottom:12px">\n'+
      '    <p style="color:'+cfg.primaryColor+';font-size:0.8rem;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">Saturday, August 15, 2026</p>\n'+
      '    <p style="color:'+cfg.textColor+';font-size:0.85rem">The Grand Ballroom, Lagos</p>\n'+
      '  </div>\n'+
      '  <p style="color:#666;font-size:0.75rem;text-align:center;margin-top:16px">Custom sections: '+[cfg.showTimeline&&'Timeline',cfg.showPhotos&&'Gallery',cfg.showRSVP&&'RSVP',cfg.showMap&&'Map',cfg.showGifts&&'Gifts',cfg.showMusic&&'Music',cfg.showEvents&&'Events',cfg.showFAQ&&'FAQ'].filter(Boolean).join(', ')+'</p>\n'+
      '</div>\n';
  };

  W.collectValues=function(){
    var cfg=W.getFullConfig();
    document.querySelectorAll('[data-config-key]').forEach(function(el){
      var key=el.getAttribute('data-config-key');
      if(el.type==='checkbox')cfg[key]=el.checked;
      else if(el.type==='range'||el.type==='number')cfg[key]=parseFloat(el.value);
      else cfg[key]=el.value;
    });
    var css=document.getElementById('custCSS');
    if(css)cfg.customCSS=css.value;
    cfg.socialLinks=cfg.socialLinks||{};
    ['facebook','instagram','twitter','tiktok'].forEach(function(s){
      var inp=document.getElementById('social_'+s);
      if(inp)cfg.socialLinks[s]=inp.value;
    });
    return cfg;
  };

  W.saveAll=function(){
    var cfg=W.collectValues();
    saveConfig(cfg);
    if(typeof notify==='function')notify('Theme saved! Preview it on the invitation page.','success');
  };

  W.resetAll=function(){
    if(!confirm('Reset all customization to defaults?'))return;
    saveConfig(defaults());
    if(typeof notify==='function')notify('Theme reset to defaults','success');
    W.renderCustomizerPage('customizerRoot');
  };

  W.exportTheme=function(){
    var cfg=W.getFullConfig();
    var css=W.exportCSS();
    downloadFile(JSON.stringify(cfg,null,2),'invitation-theme.json','application/json');
    if(typeof notify==='function')notify('Theme exported','success');
  };

  W.previewTheme=function(){
    window.open('invite.html?preview=1','_blank');
  };

  function buildSection(title,items){
    return '<div style="margin-bottom:20px"><h3 style="color:#C0B090;font-size:0.85rem;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px">'+title+'</h3>'+items.join('')+'</div>';
  }
  function colorPicker(label,key,value){
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="color:#A09888;font-size:0.8rem;width:120px">'+label+'</label><input type="color" data-config-key="'+key+'" value="'+value+'" style="width:36px;height:36px;border:none;cursor:pointer;background:transparent"><input data-config-key="'+key+'" value="'+value+'" style="flex:1;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:8px;color:#E8E0D0;font-size:0.8rem"></div>';
  }
  function selectPicker(label,key,value,options){
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="color:#A09888;font-size:0.8rem;width:120px">'+label+'</label><select data-config-key="'+key+'" style="flex:1;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:8px;color:#E8E0D0;font-size:0.8rem">'+options.map(function(o){return'<option value="'+o+'"'+(o===value?' selected':'')+'>'+o+'</option>';}).join('')+'</select></div>';
  }
  function rangePicker(label,key,value,min,max,step,unit){
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><label style="color:#A09888;font-size:0.8rem;width:120px">'+label+'</label><input type="range" data-config-key="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" style="flex:1"><span style="color:#D4AF37;font-size:0.8rem;min-width:40px">'+value+unit+'</span></div>';
  }
  function toggleSwitch(label,checked,key){
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03)"><span style="color:#E8E0D0;font-size:0.85rem">'+label+'</span><label style="position:relative;display:inline-block;width:42px;height:22px;cursor:pointer"><input type="checkbox" data-config-key="'+key+'" '+(checked?'checked':'')+' style="opacity:0;width:0;height:0"><span style="position:absolute;inset:0;background:'+(checked?'#D4AF37':'#333')+';border-radius:11px;transition:0.3s"></span><span style="position:absolute;left:'+(checked?'20px':'2px')+';top:2px;width:18px;height:18px;background:#fff;border-radius:50%;transition:0.3s"></span></label></div>';
  }
  function textInput(label,key,value,placeholder){
    return '<div style="margin-bottom:10px"><label style="display:block;color:#A09888;font-size:0.75rem;margin-bottom:4px">'+label+'</label><input id="social_'+key+'" data-config-key="'+key+'" value="'+escapeHTML(value||'')+'" placeholder="'+(placeholder||'')+'" style="width:100%;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:8px;color:#E8E0D0;font-size:0.8rem"></div>';
  }
  function escapeHTML(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function downloadFile(content,filename,type){
    var blob=new Blob([content],{type:type});var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  }

  window.WeddingCustomizer=W;
  console.log('Invitation Customizer initialized');
})();
