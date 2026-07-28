/**
 * Owner Dashboard — Home Page After Publish
 * Shows hero banner, couple photos, live countdown, share, RSVP stats, quick actions
 */
(function(){
'use strict';

function getData(){
  try{return JSON.parse(localStorage.getItem('weddingData')||'{}');}catch(e){return{};}
}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function formatDate(d){if(!d)return'';return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});}
function timeAgo(ts){if(!ts)return'';var diff=Date.now()-ts;if(diff<60000)return'Just now';if(diff<3600000)return Math.floor(diff/60000)+'m ago';if(diff<86400000)return Math.floor(diff/3600000)+'h ago';return Math.floor(diff/86400000)+'d ago';}

function getCountdownParts(dateStr){
  if(!dateStr)return null;
  var target=new Date(dateStr).getTime();
  if(isNaN(target))return null;
  var now=Date.now();
  var diff=target-now;
  if(diff<=0)return{days:0,hours:0,minutes:0,seconds:0,expired:true};
  return{
    days:Math.floor(diff/86400000),
    hours:Math.floor((diff%86400000)/3600000),
    minutes:Math.floor((diff%3600000)/60000),
    seconds:Math.floor((diff%60000)/1000),
    expired:false
  };
}

window.renderOwnerDashboard=function(containerId){
  var el=document.getElementById(containerId);
  if(!el)return;
  var d=getData();
  var groom=d.groomName||'Groom',bride=d.brideName||'Bride';
  var isPublished=!!d.isPublished;
  if(!isPublished)return;

  var weddingId=d.weddingId||'';
  var inviteUrl=d.inviteUrl||(typeof PublishEngine!=='undefined'?PublishEngine.getInviteUrl(d):window.location.origin+'/invite/'+weddingId);
  var publishedDate=d.publishedAt?formatDate(d.publishedAt):'';
  var updatedDate=d.updatedAt?formatDate(d.updatedAt):'';
  var weddingDate=d.weddingDate||d.date||'';
  var coverPhoto=d.coverPhoto||d.coverImage||'';
  var groomPhoto=d.groomPhoto||'';
  var bridePhoto=d.bridePhoto||'';
  var guests=d.guests||[];
  var totalGuests=guests.length;
  var accepted=guests.filter(function(g){return g.rsvp==='accepted'||g.status==='accepted';}).length;
  var declined=guests.filter(function(g){return g.rsvp==='declined'||g.status==='declined';}).length;
  var maybe=guests.filter(function(g){return g.rsvp==='maybe'||g.status==='maybe';}).length;
  var pending=totalGuests-accepted-declined-maybe;

  var analytics={pageViews:0,shares:0,qrScans:0};
  try{var a=JSON.parse(localStorage.getItem('weddingAnalytics')||'{}');analytics.pageViews=a.pageViews||0;analytics.shares=a.shares||0;analytics.qrScans=a.qrScans||0;}catch(e){}

  var notifs=[];
  try{notifs=JSON.parse(localStorage.getItem('weddingNotifications')||'[]');}catch(e){}
  var unreadCount=notifs.filter(function(n){return !n.read;}).length;

  var guestbookStats={total:0,approved:0,pending:0};
  try{
    var gb=JSON.parse(localStorage.getItem('weddingGuestbook')||'[]');
    guestbookStats.total=gb.length;
    guestbookStats.approved=gb.filter(function(e){return e.status==='approved';}).length;
    guestbookStats.pending=gb.filter(function(e){return e.status==='pending';}).length;
  }catch(e){}

  var guestMessages=guests.filter(function(g){return g.message&&g.message.trim();}).slice(0,5);

  var countdown=getCountdownParts(weddingDate);

  var html='<div class="owner-dash">';

  // Hero Banner with couple photos and countdown
  html+='<div class="owner-hero-banner">';
  if(coverPhoto){
    html+='<img src="'+esc(coverPhoto)+'" alt="Wedding cover">';
  }
  html+='<div class="owner-hero-overlay"></div>';
  html+='<div class="owner-hero-couple">';
  html+='<div class="owner-hero-couple-photos">';
  if(groomPhoto){
    html+='<div class="owner-hero-couple-photo"><img src="'+esc(groomPhoto)+'" alt="'+esc(groom)+'"></div>';
  }else{
    html+='<div class="owner-hero-couple-photo"><i class="fas fa-user"></i></div>';
  }
  if(bridePhoto){
    html+='<div class="owner-hero-couple-photo"><img src="'+esc(bridePhoto)+'" alt="'+esc(bride)+'"></div>';
  }else{
    html+='<div class="owner-hero-couple-photo"><i class="fas fa-user"></i></div>';
  }
  html+='</div>';
  html+='<div class="owner-hero-couple-names">'+esc(groom)+'<span class="heart-sep">&hearts;</span>'+esc(bride)+'</div>';
  html+='</div>';

  // Countdown in hero
  if(countdown && !countdown.expired){
    html+='<div class="owner-hero-countdown">';
    html+='<div class="owner-countdown-unit"><span class="owner-countdown-num">'+countdown.days+'</span><span class="owner-countdown-label">Days</span></div>';
    html+='<div class="owner-countdown-unit"><span class="owner-countdown-num">'+countdown.hours+'</span><span class="owner-countdown-label">Hrs</span></div>';
    html+='<div class="owner-countdown-unit"><span class="owner-countdown-num">'+countdown.minutes+'</span><span class="owner-countdown-label">Min</span></div>';
    html+='<div class="owner-countdown-unit"><span class="owner-countdown-num">'+countdown.seconds+'</span><span class="owner-countdown-label">Sec</span></div>';
    html+='</div>';
  }
  html+='</div>';

  // Publish Updates banner (only if has unsaved changes)
  if(typeof PublishEngine!=='undefined' && PublishEngine.isDirty && PublishEngine.isDirty()){
    html+='<div class="owner-publish-banner">';
    html+='<div class="owner-publish-banner-icon"><i class="fas fa-exclamation-triangle"></i></div>';
    html+='<div class="owner-publish-banner-text">You have <strong>unpublished changes</strong> on your website.</div>';
    html+='<button onclick="if(typeof PublishEngine!==\'undefined\')PublishEngine.publishUpdates()" class="owner-publish-banner-btn">Publish Now</button>';
    html+='</div>';
  }

  html+='<div class="owner-dash-header">';
  html+='<div class="owner-dash-title">';
  html+='<h2><i class="fas fa-heart" style="color:var(--gold)"></i> '+esc(groom)+' &amp; '+esc(bride)+'</h2>';
  html+='<div class="owner-status-row">';
  html+='<span class="owner-live-badge"><span class="status-dot-live"></span> Live</span>';
  if(publishedDate)html+='<span class="owner-meta"><i class="fas fa-calendar-check"></i> Published '+publishedDate+'</span>';
  if(updatedDate)html+='<span class="owner-meta"><i class="fas fa-sync"></i> Updated '+updatedDate+'</span>';
  html+='</div></div>';
  html+='<div class="owner-dash-actions">';
  html+='<a href="invite/'+esc(weddingId)+'" target="_blank" class="owner-btn owner-btn-primary"><i class="fas fa-external-link-alt"></i> View Public Website</a>';
  html+='<a href="share.html" class="owner-btn owner-btn-gold"><i class="fas fa-share-alt"></i> Share Invitation</a>';
  html+='<a href="dashboard.html" class="owner-btn owner-btn-outline"><i class="fas fa-th-large"></i> Dashboard</a>';
  html+='</div></div>';

  html+='<div class="owner-stats-grid">';
  html+='<div class="owner-stat-card"><div class="owner-stat-icon" style="background:rgba(34,197,94,0.1);color:#22c55e"><i class="fas fa-eye"></i></div><div class="owner-stat-num">'+analytics.pageViews+'</div><div class="owner-stat-label">Invitation Views</div></div>';
  html+='<div class="owner-stat-card"><div class="owner-stat-icon" style="background:rgba(212,175,55,0.1);color:var(--gold)"><i class="fas fa-users"></i></div><div class="owner-stat-num">'+totalGuests+'</div><div class="owner-stat-label">Total Guests</div></div>';
  html+='<div class="owner-stat-card"><div class="owner-stat-icon" style="background:rgba(34,197,94,0.1);color:#22c55e"><i class="fas fa-check-circle"></i></div><div class="owner-stat-num">'+accepted+'</div><div class="owner-stat-label">Accepted</div></div>';
  html+='<div class="owner-stat-card"><div class="owner-stat-icon" style="background:rgba(239,68,68,0.1);color:#ef4444"><i class="fas fa-times-circle"></i></div><div class="owner-stat-num">'+declined+'</div><div class="owner-stat-label">Declined</div></div>';
  html+='<div class="owner-stat-card"><div class="owner-stat-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b"><i class="fas fa-clock"></i></div><div class="owner-stat-num">'+pending+'</div><div class="owner-stat-label">Pending</div></div>';
  html+='<div class="owner-stat-card"><div class="owner-stat-icon" style="background:rgba(139,92,246,0.1);color:#8b5cf6"><i class="fas fa-qrcode"></i></div><div class="owner-stat-num">'+analytics.qrScans+'</div><div class="owner-stat-label">QR Scans</div></div>';
  html+='<div class="owner-stat-card"><div class="owner-stat-icon" style="background:rgba(236,72,153,0.1);color:#ec4899"><i class="fas fa-book"></i></div><div class="owner-stat-num">'+guestbookStats.total+'</div><div class="owner-stat-label">Guestbook</div></div>';
  html+='<div class="owner-stat-card"><div class="owner-stat-icon" style="background:rgba(34,197,94,0.1);color:#22c55e"><i class="fas fa-check"></i></div><div class="owner-stat-num">'+guestbookStats.approved+'</div><div class="owner-stat-label">Messages</div></div>';
  html+='</div>';

  html+='<div class="owner-sections">';
  html+='<div class="owner-section">';
  html+='<h3><i class="fas fa-share-nodes"></i> Share Invitation</h3>';
  html+='<div class="owner-link-row">';
  html+='<input type="text" id="ownerInviteLink" value="'+esc(inviteUrl)+'" readonly>';
  html+='<button onclick="navigator.clipboard.writeText(\''+esc(inviteUrl)+'\');if(typeof showNotification===\'function\')showNotification(\'Link copied!\',\'success\')" class="owner-btn owner-btn-sm owner-btn-gold"><i class="fas fa-copy"></i> Copy</button>';
  html+='</div>';
  html+='<div class="owner-share-platforms">';
  html+='<a href="https://wa.me/?text='+encodeURIComponent(groom+' & '+bride+' wedding invitation! '+inviteUrl)+'" target="_blank" class="owner-share-btn" style="background:#25D366"><i class="fab fa-whatsapp"></i></a>';
  html+='<a href="https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(inviteUrl)+'" target="_blank" class="owner-share-btn" style="background:#1877F2"><i class="fab fa-facebook-f"></i></a>';
  html+='<a href="https://t.me/share/url?url='+encodeURIComponent(inviteUrl)+'&text='+encodeURIComponent(groom+' & '+bride+' wedding invitation')+'" target="_blank" class="owner-share-btn" style="background:#0088CC"><i class="fab fa-telegram-plane"></i></a>';
  html+='<a href="https://twitter.com/intent/tweet?text='+encodeURIComponent(groom+' & '+bride+' wedding invitation!')+'&url='+encodeURIComponent(inviteUrl)+'" target="_blank" class="owner-share-btn" style="background:#000"><i class="fab fa-x-twitter"></i></a>';
  html+='<a href="mailto:?subject='+encodeURIComponent(groom+' & '+bride+' Wedding Invitation')+'&body='+encodeURIComponent('You are invited to the wedding of '+groom+' & '+bride+'! '+inviteUrl)+'" class="owner-share-btn" style="background:#EA4335"><i class="fas fa-envelope"></i></a>';
  html+='</div></div>';

  html+='<div class="owner-section">';
  html+='<h3><i class="fas fa-qrcode"></i> QR Code</h3>';
  html+='<div class="owner-qr-container" id="ownerQRContainer"></div>';
  html+='<div class="owner-qr-actions">';
  html+='<button onclick="if(typeof PublishEngine!==\'undefined\'){var c=PublishEngine.generateQR(\''+esc(inviteUrl)+'\',300);var a=document.createElement(\'a\');a.download=\'wedding-qr.png\';a.href=c.toDataURL(\'image/png\');a.click();}" class="owner-btn owner-btn-sm owner-btn-outline"><i class="fas fa-download"></i> Download QR</button>';
  html+='</div></div>';

  html+='<div class="owner-section">';
  html+='<h3><i class="fas fa-chart-bar"></i> Invitation Analytics</h3>';
  html+='<div class="owner-analytics-grid">';
  html+='<div class="owner-analytics-item"><span class="owner-analytics-num">'+analytics.pageViews+'</span><span class="owner-analytics-label">Page Views</span></div>';
  html+='<div class="owner-analytics-item"><span class="owner-analytics-num">'+analytics.shares+'</span><span class="owner-analytics-label">Shares</span></div>';
  html+='<div class="owner-analytics-item"><span class="owner-analytics-num">'+analytics.qrScans+'</span><span class="owner-analytics-label">QR Scans</span></div>';
  html+='<div class="owner-analytics-item"><span class="owner-analytics-num">'+totalGuests+'</span><span class="owner-analytics-label">RSVPs</span></div>';
  html+='</div></div>';

  if(notifs.length>0){
    html+='<div class="owner-section">';
    html+='<h3><i class="fas fa-bell"></i> Recent Notifications <span class="owner-notif-badge">'+unreadCount+'</span></h3>';
    html+='<div class="owner-notif-list">';
    notifs.slice(0,5).forEach(function(n){
      var icon='fa-info-circle';var color='var(--gold)';
      if(n.type==='invitation_published'||n.type==='updates_published'){icon='fa-rocket';color='#22c55e';}
      else if(n.type==='invitation_viewed'){icon='fa-eye';color='#3b82f6';}
      else if(n.type==='website_shared'){icon='fa-share-alt';color='#8b5cf6';}
      else if(n.type==='guestbook'){icon='fa-book';color='#ec4899';}
      html+='<div class="owner-notif-item">';
      html+='<div class="owner-notif-icon" style="background:rgba(212,175,55,0.1);color:'+color+'"><i class="fas '+icon+'"></i></div>';
      html+='<div class="owner-notif-content"><span>'+esc(n.message)+'</span><span class="owner-notif-time">'+timeAgo(n.time)+'</span></div>';
      html+='</div>';
    });
    html+='</div></div>';
  }

  // Guest Messages Section
  if(guestMessages.length>0){
    html+='<div class="owner-section">';
    html+='<h3><i class="fas fa-comment-dots"></i> Recent Guest Messages <span class="owner-notif-badge" style="background:rgba(236,72,153,0.15);color:#ec4899">'+guestMessages.length+'</span></h3>';
    html+='<div class="owner-notif-list">';
    guestMessages.forEach(function(g){
      html+='<div class="owner-notif-item">';
      html+='<div class="owner-notif-icon" style="background:rgba(236,72,153,0.1);color:#ec4899"><i class="fas fa-heart"></i></div>';
      html+='<div class="owner-notif-content"><strong>'+esc(g.guestName||g.name||'Guest')+'</strong><span>'+esc(g.message||'')+'</span><span class="owner-notif-time">'+(g.guestCount>1?'+'+g.guestCount+' guests':'')+'</span></div>';
      html+='</div>';
    });
    html+='</div></div>';
  }

  html+='<div class="owner-section">';
  html+='<h3><i class="fas fa-bolt"></i> Quick Actions</h3>';
  html+='<div class="owner-quick-actions">';
  html+='<a href="dashboard.html" class="owner-action-card"><i class="fas fa-th-large"></i><span>Dashboard</span></a>';
  html+='<a href="planner.html" class="owner-action-card"><i class="fas fa-clipboard-list"></i><span>Planner</span></a>';
  html+='<a href="share.html" class="owner-action-card"><i class="fas fa-share-alt"></i><span>Share Center</span></a>';
  html+='<a href="settings.html" class="owner-action-card"><i class="fas fa-cog"></i><span>Settings</span></a>';
  html+='<a href="customize.html" class="owner-action-card"><i class="fas fa-palette"></i><span>Customize</span></a>';
  html+='<a href="gallery.html" class="owner-action-card"><i class="fas fa-images"></i><span>Gallery</span></a>';
  html+='<a href="rsvp.html" class="owner-action-card"><i class="fas fa-users"></i><span>Manage Guests</span></a>';
  html+='</div></div>';

  html+='</div></div>';

  el.innerHTML=html;

  // Live countdown ticker
  if(countdown && !countdown.expired){
    var _cd=countdown;
    var _cdEl=el;
    setInterval(function(){
      _cd.seconds--;
      if(_cd.seconds<0){_cd.seconds=59;_cd.minutes--;}
      if(_cd.minutes<0){_cd.minutes=59;_cd.hours--;}
      if(_cd.hours<0){_cd.hours=23;_cd.days--;}
      if(_cd.days<0)_cd.days=0;
      var units=_cdEl.querySelectorAll('.owner-countdown-num');
      if(units.length===4){
        units[0].textContent=_cd.days;
        units[1].textContent=_cd.hours;
        units[2].textContent=_cd.minutes;
        units[3].textContent=_cd.seconds;
      }
    },1000);
  }

  setTimeout(function(){
    var qrEl=document.getElementById('ownerQRContainer');
    if(qrEl&&typeof PublishEngine!=='undefined'){
      var canvas=PublishEngine.generateQR(inviteUrl,180);
      canvas.style.borderRadius='12px';
      canvas.style.display='block';
      canvas.style.margin='0 auto';
      qrEl.appendChild(canvas);
    }
  },100);
};

})();
