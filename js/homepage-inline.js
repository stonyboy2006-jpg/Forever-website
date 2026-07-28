/* ===== HOMEPAGE INLINE JS ===== */
/* Extracted from index.html inline <script> blocks */
/* Phase 0: Foundation — Code Extraction */
/* Deduplicated: particles, renderEverything overrides merged */

// ===== THEME PALETTE =====
var THEMES={'':'Classic Gold','dark-gold':'Dark Gold','rose-gold':'Rose Gold','royal-blue-gold':'Royal Blue Gold','emerald-gold':'Emerald Gold','african-wedding':'African Wedding'};
function applyTheme(p){document.documentElement.setAttribute('data-palette',p);localStorage.setItem('weddingPalette',p);}
function openThemePicker(){var c=localStorage.getItem('weddingPalette')||'';var h='<div style="position:fixed;inset:0;z-index:99999;background:rgba(5,11,24,0.9);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;" onclick="if(event.target===this)closeThemePicker()"><div style="max-width:420px;width:100%;padding:40px;background:linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(212,175,55,0.15);border-radius:24px;text-align:center;"><h2 style="font-family:\'Playfair Display\',serif;font-size:1.5rem;color:var(--gold);margin-bottom:6px;">Choose Theme</h2><p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:24px;">Select a color palette for your wedding website</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';Object.entries(THEMES).forEach(function(e){var k=e[0],v=e[1];var a=k===c?'border:2px solid var(--gold);':'';var cl={'':['#C9A84C','#1A1A2E'],'dark-gold':['#B8860B','#0A0A0A'],'rose-gold':['#E8A87C','#1A0F0A'],'royal-blue-gold':['#C9A84C','#0B1030'],'emerald-gold':['#C9A84C','#0A1A0F'],'african-wedding':['#D4892E','#1A0E05']};h+='<div style="cursor:pointer;padding:14px 10px;border-radius:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(212,175,55,0.12);transition:all 0.3s;'+a+'" onclick="applyTheme(\''+k+'\');closeThemePicker();" onmouseover="this.style.borderColor=\'var(--gold)\'" onmouseout="this.style.borderColor=\'rgba(212,175,55,0.12)\'"><div style="display:flex;gap:4px;justify-content:center;margin-bottom:6px;">';(cl[k]||cl['']).forEach(function(c){h+='<span style="width:22px;height:22px;border-radius:50%;background:'+c+';border:2px solid rgba(255,255,255,0.1);display:inline-block;"></span>';});h+='</div><span style="font-family:\'Inter\',sans-serif;font-size:0.75rem;color:var(--gold);font-weight:500;">'+v+'</span></div>';});h+='</div></div></div>';var d=document.createElement('div');d.innerHTML=h;document.body.appendChild(d);}
function closeThemePicker(){var e=document.querySelector('[style*="position:fixed;inset:0;z-index:99999"]');if(e)e.remove();}
(function(){applyTheme(localStorage.getItem('weddingPalette')||'');})();

// ===== BUTTON RIPPLE EFFECT =====
document.addEventListener('mouseover',function(e){var t=e.target.closest('.btn-gold,.btn-gold-outline,.hero-btn');if(t){var r=t.getBoundingClientRect();t.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');t.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%')}});

// ===== HERO PARTICLES (deduplicated — single instance) =====
(function(){
  var c=document.getElementById('heroParticles');
  if(!c)return;
  for(var i=0;i<35;i++){
    var p=document.createElement('div');
    p.className='hero-particle';
    p.style.left=Math.random()*100+'%';
    p.style.animationDuration=(4+Math.random()*8)+'s';
    p.style.animationDelay=Math.random()*6+'s';
    p.style.width=p.style.height=(1+Math.random()*3)+'px';
    c.appendChild(p);
  }
})();

// ===== HERO SPARKLES =====
(function(){
  var c=document.getElementById('heroSparkles');
  if(!c)return;
  for(var i=0;i<20;i++){
    var s=document.createElement('div');
    s.className='hero-sparkle';
    s.style.left=Math.random()*100+'%';
    s.style.bottom=Math.random()*30+'%';
    s.style.animationDuration=(3+Math.random()*5)+'s';
    s.style.animationDelay=Math.random()*8+'s';
    s.style.width=s.style.height=(2+Math.random()*4)+'px';
    c.appendChild(s);
  }
})();

// ===== FLOATING HEARTS =====
(function(){
  var c=document.getElementById('heroHearts');
  if(!c)return;
  var hearts=['\u2665','\u2666','\u2726','\u2727'];
  function spawnHeart(){
    var h=document.createElement('div');
    h.className='hero-heart-float';
    h.textContent=hearts[Math.floor(Math.random()*hearts.length)];
    h.style.left=Math.random()*100+'%';
    h.style.fontSize=(10+Math.random()*16)+'px';
    h.style.animationDuration=(8+Math.random()*12)+'s';
    h.style.animationDelay=Math.random()*2+'s';
    c.appendChild(h);
    setTimeout(function(){if(h.parentElement)h.remove();},22000);
  }
  for(var i=0;i<6;i++) setTimeout(spawnHeart,i*1500);
  setInterval(spawnHeart,4000);
})();

// ===== ENHANCED renderEverything (merged override) =====
(function(){
  if(typeof renderEverything==='undefined')return;
  var origRender = renderEverything;
  renderEverything = function() {
    origRender();
    var d = weddingData || {};

    // Info cards venue/dress
    var infoVenue = document.getElementById('infoVenue');
    if (infoVenue && d.venue) infoVenue.textContent = d.venue;
    var infoDress = document.getElementById('infoDress');
    if (infoDress && d.dressCode) infoDress.textContent = d.dressCode;

    // Footer social links
    var fSocial = document.getElementById('footerSocial');
    if (fSocial) {
      var socials = [
        { key:'whatsapp', color:'#25D366', icon:'fab fa-whatsapp' },
        { key:'facebook', color:'#1877F2', icon:'fab fa-facebook-f' },
        { key:'instagram', color:'#E1306C', icon:'fab fa-instagram' },
        { key:'twitter', color:'#000', icon:'fab fa-x-twitter' },
        { key:'telegram', color:'#0088CC', icon:'fab fa-telegram-plane' }
      ];
      fbGetDoc('socialLinks', 'main').then(function(social) {
        var s = social || {};
        fSocial.innerHTML = socials.filter(function(soc) { return s[soc.key] || d[soc.key]; }).map(function(soc) {
          return '<a href="' + (s[soc.key] || d[soc.key]) + '" target="_blank" title="' + soc.key + '" style="background:' + soc.color + ';"><i class="' + soc.icon + '"></i></a>';
        }).join('');
      }).catch(function() {});
    }

    // Build memories collage from gallery
    var collageContainer = document.getElementById('memoriesCollage');
    if (collageContainer && galleryImages && galleryImages.length) {
      var images = galleryImages.slice(0, 7);
      collageContainer.innerHTML = '<div class="memories-collage">' + images.map(function(img, i) {
        if (i === 0) return '<div class="collage-item"><img src="' + img + '" alt="Memory ' + (i+1) + '" loading="lazy"><div class="polaroid"><span>Our Beautiful Moment</span></div></div>';
        return '<div class="collage-item"><img src="' + img + '" alt="Memory ' + (i+1) + '" loading="lazy"></div>';
      }).join('') + '</div>';
    } else if (collageContainer) {
      collageContainer.innerHTML = '<div class="memories-collage"><div class="collage-item" style="grid-column:span 4;display:flex;align-items:center;justify-content:center;color:var(--text-light);font-style:italic;border:none;">Memories will appear here once photos are added</div></div>';
    }

    // Contact info
    var cEmail = document.getElementById('contactEmail');
    if (cEmail && d.email) cEmail.textContent = d.email;
    var cPhone = document.getElementById('contactPhone');
    if (cPhone && d.phone) cPhone.textContent = d.phone;
    var cWhatsapp = document.getElementById('contactWhatsapp');
    if (cWhatsapp && d.whatsapp) cWhatsapp.textContent = d.whatsapp;
    // Hide contact fields that have no data
    if (cPhone && !d.phone && !d.contactPhone) cPhone.closest('span').style.display='none';
    if (cEmail && !d.email && !d.contactEmail) cEmail.closest('span').style.display='none';
    if (cWhatsapp && !d.whatsapp) cWhatsapp.closest('span').style.display='none';
    // Footer contact
    var fWpNum=document.getElementById('footerWhatsappNum');
    var fPhNum=document.getElementById('footerPhoneNum');
    if(fWpNum&&d.whatsapp)fWpNum.textContent=d.whatsapp;
    if(fPhNum&&d.phone)fPhNum.textContent=d.phone;
    // Hide footer contact items with no data
    if(fWpNum&&!d.whatsapp){var fp=fWpNum.closest('p');if(fp)fp.style.display='none';}
    if(fPhNum&&!d.phone){var fp2=fPhNum.closest('p');if(fp2)fp2.style.display='none';}

    // Render invitation center
    renderInvitationCenter();
  };

  // Invitation center renderer
  function renderInvitationCenter() {
    if (typeof InviteSys === 'undefined' || typeof InviteSys.renderInvitationCenter !== 'function') return;
    var session = null;
    try { session = (typeof getSession === 'function') ? getSession() : null; } catch(e) {}
    if (!session) return;
    var d = weddingData || {};
    if (d.groomName || d.brideName) {
      var section = document.getElementById('invitationCenterSection');
      if (section) section.style.display = '';
      InviteSys.renderInvitationCenter('invitationCenterContainer');
    }
  }
})();

// ===== APPLE MAPS =====
function openAppleMaps() {
  var addr = document.getElementById('locAddress');
  if (addr && addr.textContent) {
    window.open('https://maps.apple.com/?q=' + encodeURIComponent(addr.textContent), '_blank');
  } else {
    showNotification('Address not available yet.', 'warning');
  }
}

// ===== AI WIDGET =====
function toggleAIWidget(){document.getElementById('aiWidgetWindow').classList.toggle('open')}
document.addEventListener('DOMContentLoaded',function(){
  if(typeof AIConcierge==='undefined')return;
  AIConcierge.init();
  var c=document.getElementById('aiWidgetMessages');
  if(c)c.innerHTML='<div class="ai-widget-msg ai"><div class="bubble">'+AIConcierge.getWelcomeMessage().replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')+'</div></div>';
  var q=document.getElementById('aiWidgetQs');
  if(q)q.innerHTML=AIConcierge.getSuggestedQuestions().map(function(qt){return '<span class="ai-widget-q" onclick="document.getElementById(\'aiWidgetInput\').value=\''+qt.replace(/'/g,"\\'")+'\';sendWidgetMsg();">'+qt+'</span>';}).join('');
});
function sendWidgetMsg(){var i=document.getElementById('aiWidgetInput'),t=i.value.trim();if(!t)return;i.value='';addWidgetMsg(t,'user');showWidgetTyping(true);AIConcierge.processMessage(t).then(function(r){showWidgetTyping(false);addWidgetMsg(r.text,'ai');});}
function addWidgetMsg(text,role){var c=document.getElementById('aiWidgetMessages'),msg=document.createElement('div');msg.className='ai-widget-msg '+role;msg.innerHTML='<div class="bubble">'+text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')+'</div>';c.appendChild(msg);c.scrollTop=c.scrollHeight;}
function showWidgetTyping(show){document.getElementById('aiWidgetTyping').classList.toggle('show',show)}

// ===== SETUP / PUBLISH NOTIFICATIONS =====
function isSetupComplete(){
  try{
    var d=JSON.parse(localStorage.getItem('weddingData')||'{}');
    var hasGroom=!!(d.groomName||d.groom);
    var hasBride=!!(d.brideName||d.bride);
    var hasDate=!!(d.weddingDate||d.date);
    var hasVenue=!!(d.venue);
    return hasGroom&&hasBride&&hasDate&&hasVenue;
  }catch(e){return false;}
}
function handleGetStarted(){
  var user=null;
  try{var s=localStorage.getItem('weddingAuthSession');if(s){var sess=JSON.parse(s);if(sess&&sess.userId&&sess.expiresAt&&Date.now()<sess.expiresAt)user=sess;}}catch(e){}
  if(!user){
    window.location.href='signup.html';
  }else if(!isSetupComplete()){
    window.location.href='setup.html';
  }else{
    var el=document.getElementById('story');
    if(el)el.scrollIntoView({behavior:'smooth'});
  }
}
(function(){
  if(localStorage.getItem('_setup_just_completed')){
    localStorage.removeItem('_setup_just_completed');
    setTimeout(function(){
      if(typeof showNotification==='function'){
        showNotification('Congratulations! Your wedding website has been successfully set up.','success');
      }
    },800);
  }
  if(localStorage.getItem('_publish_success')){
    localStorage.removeItem('_publish_success');
    setTimeout(function(){
      if(typeof showNotification==='function'){
        showNotification('\uD83C\uDF89 Your wedding website has been published successfully and is ready to share with your guests!','success');
      }
    },800);
  }
})();

// ===== SCROLL REVEAL ANIMATIONS =====
(function(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}
    });
  },{threshold:0.12});
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-zoom').forEach(function(el){obs.observe(el);});
})();

// ===== ANIMATED STAT COUNTERS =====
(function(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        var el=e.target;
        var target=parseInt(el.getAttribute('data-target'))||0;
        var duration=2000;
        var start=0;
        var startTime=null;
        function animate(ts){
          if(!startTime)startTime=ts;
          var progress=Math.min((ts-startTime)/duration,1);
          var eased=1-Math.pow(1-progress,3);
          el.textContent=Math.floor(eased*target);
          if(progress<1)requestAnimationFrame(animate);
          else el.textContent=target;
        }
        requestAnimationFrame(animate);
        obs.unobserve(el);
      }
    });
  },{threshold:0.5});
  document.querySelectorAll('.stat-number[data-target]').forEach(function(el){obs.observe(el);});
})();

// ===== HOME PAGE STATE LOGIC =====
(function(){
  var user=null;
  try{var s=localStorage.getItem('weddingAuthSession');if(s){var sess=JSON.parse(s);if(sess&&sess.userId&&sess.expiresAt&&Date.now()<sess.expiresAt)user=sess;}}catch(e){}
  var wd={};try{wd=JSON.parse(localStorage.getItem('weddingData')||'{}');}catch(e){}
  var setupComplete=!!(wd.groomName||wd.groom)&&!!(wd.brideName||wd.bride)&&!!(wd.weddingDate||wd.date)&&!!(wd.venue);
  var isPublished=!!wd.isPublished;

  var btnGetStarted=document.getElementById('btnGetStarted');
  var btnRSVP=document.getElementById('btnRSVP');
  var heroDraft=document.getElementById('heroDraftCard');
  var welcomeSection=document.getElementById('welcomeCardSection');
  var guestSection=document.getElementById('guestCtaSection');
  var inviteSection=document.getElementById('invitationCenterSection');
  var ownerDash=document.getElementById('ownerDashboardSection');
  var ownerProfileIcon=document.getElementById('ownerProfileIcon');
  var sidebarFooter=document.querySelector('.sidebar-footer');
  var sidebarFooterMenu=document.getElementById('authUserMenu');

  /* ===== GUEST (not logged in) ===== */
  if(!user){
    if(isPublished){
      if(btnGetStarted)btnGetStarted.style.display='none';
      if(btnRSVP)btnRSVP.style.display='inline-flex';
      if(heroDraft)heroDraft.style.display='none';
      if(ownerDash)ownerDash.style.display='none';
      if(inviteSection)inviteSection.style.display='none';
      if(welcomeSection)welcomeSection.style.display='none';
      if(guestSection)guestSection.style.display='none';
      if(sidebarFooter)sidebarFooter.style.display='none';
      if(ownerProfileIcon)ownerProfileIcon.style.display='none';
    }else{
      if(btnGetStarted)btnGetStarted.style.display='inline-flex';
      if(btnRSVP)btnRSVP.style.display='none';
      if(heroDraft)heroDraft.style.display='block';
      if(ownerDash)ownerDash.style.display='none';
      if(inviteSection)inviteSection.style.display='none';
      if(welcomeSection)welcomeSection.style.display='none';
      if(guestSection)guestSection.style.display='block';
      if(sidebarFooter)sidebarFooter.style.display='';
      if(ownerProfileIcon)ownerProfileIcon.style.display='none';
    }
    return;
  }

  /* ===== OWNER (logged in) ===== */
  if(setupComplete && isPublished){
    if(btnGetStarted)btnGetStarted.style.display='none';
    if(btnRSVP)btnRSVP.style.display='inline-flex';
    if(heroDraft)heroDraft.style.display='none';
    if(welcomeSection)welcomeSection.style.display='none';
    if(guestSection)guestSection.style.display='none';
    if(inviteSection)inviteSection.style.display='none';
    if(sidebarFooter)sidebarFooter.style.display='none';
    if(ownerDash){
      ownerDash.style.display='block';
      if(typeof renderOwnerDashboard==='function')renderOwnerDashboard('ownerDashboardContainer');
    }
    if(ownerProfileIcon){
      ownerProfileIcon.style.display='flex';
      var avatarEl=document.getElementById('ownerProfileAvatar');
      var ddHeader=document.getElementById('ownerProfileDDHeader');
      if(avatarEl){var initial=(user.name||'U').charAt(0).toUpperCase();avatarEl.textContent=initial;}
      if(ddHeader){ddHeader.innerHTML='<div class="owner-dd-name">'+(user.name||'Owner')+'</div><div class="owner-dd-email">'+(user.email||'')+'</div>';}
    }
  }else if(setupComplete && !isPublished){
    if(btnGetStarted)btnGetStarted.style.display='none';
    if(btnRSVP)btnRSVP.style.display='none';
    if(heroDraft)heroDraft.style.display='block';
    if(welcomeSection)welcomeSection.style.display='block';
    if(guestSection)guestSection.style.display='none';
    if(inviteSection)inviteSection.style.display='none';
    if(ownerDash)ownerDash.style.display='none';
    if(sidebarFooter)sidebarFooter.style.display='';
    if(ownerProfileIcon)ownerProfileIcon.style.display='none';
  }else{
    if(btnGetStarted)btnGetStarted.style.display='inline-flex';
    if(btnRSVP)btnRSVP.style.display='none';
    if(heroDraft)heroDraft.style.display='block';
    if(welcomeSection)welcomeSection.style.display='block';
    if(guestSection)guestSection.style.display='none';
    if(inviteSection)inviteSection.style.display='none';
    if(ownerDash)ownerDash.style.display='none';
    if(sidebarFooter)sidebarFooter.style.display='';
    if(ownerProfileIcon)ownerProfileIcon.style.display='none';
  }

  if(localStorage.getItem('_publish_success')==='1'){
    localStorage.removeItem('_publish_success');
    setTimeout(function(){
      var t=document.createElement('div');
      t.className='publish-success-toast';
      t.style.cssText='position:fixed;top:24px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:100002;padding:18px 24px;border-radius:14px;background:rgba(20,30,20,0.97);border:1px solid rgba(34,197,94,0.3);backdrop-filter:blur(20px);box-shadow:0 10px 40px rgba(0,0,0,0.5);display:flex;flex-direction:column;align-items:center;gap:10px;font-family:Poppins,sans-serif;opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);max-width:90vw;min-width:300px;text-align:center';
      t.innerHTML='<div style="color:#e8e0d0;font-size:0.95rem;font-weight:600"><i class="fas fa-check-circle" style="color:#22c55e;margin-right:8px"></i>Wedding Published Successfully!</div><div style="color:#a09888;font-size:0.8rem">Your website is now live.</div>';
      document.body.appendChild(t);
      requestAnimationFrame(function(){requestAnimationFrame(function(){t.style.transform='translateX(-50%) translateY(0)';t.style.opacity='1';});});
      setTimeout(function(){t.style.opacity='0';t.style.transform='translateX(-50%) translateY(-20px)';setTimeout(function(){t.remove();},400);},3500);
    },500);
  }

  if(localStorage.getItem('_setup_just_completed')==='1'){
    localStorage.removeItem('_setup_just_completed');
  }
})();

// ===== PROFILE DROPDOWN TOGGLE =====
function toggleOwnerProfileDropdown(){
  var dd=document.getElementById('ownerProfileDropdown');
  if(dd)dd.classList.toggle('open');
}
document.addEventListener('click',function(e){
  var icon=document.getElementById('ownerProfileIcon');
  var dd=document.getElementById('ownerProfileDropdown');
  if(icon&&dd&&!icon.contains(e.target))dd.classList.remove('open');
});
