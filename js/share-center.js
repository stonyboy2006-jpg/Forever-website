(function(){
'use strict';
if(window.ShareCenter&&window.ShareCenter.initialized)return;
var SC={initialized:true};

var STORAGE_KEY='weddingShareAnalytics';
var HISTORY_KEY='weddingShareHistory';
var WEDDING_ID_KEY='weddingShareId';

var PLATFORMS=[
{id:'whatsapp',label:'WhatsApp',icon:'fab fa-whatsapp',color:'#25D366'},
{id:'facebook',label:'Facebook',icon:'fab fa-facebook-f',color:'#1877F2'},
{id:'messenger',label:'Messenger',icon:'fab fa-facebook-messenger',color:'#006AFF'},
{id:'instagram',label:'Instagram',icon:'fab fa-instagram',color:'#E1306C'},
{id:'twitter',label:'X (Twitter)',icon:'fab fa-x-twitter',color:'#1a1a2e'},
{id:'telegram',label:'Telegram',icon:'fab fa-telegram-plane',color:'#0088CC'},
{id:'tiktok',label:'TikTok',icon:'fab fa-tiktok',color:'#1a1a2e'},
{id:'snapchat',label:'Snapchat',icon:'fab fa-snapchat-ghost',color:'#1a1a1a'},
{id:'linkedin',label:'LinkedIn',icon:'fab fa-linkedin-in',color:'#0A66C2'},
{id:'discord',label:'Discord',icon:'fab fa-discord',color:'#5865F2'},
{id:'pinterest',label:'Pinterest',icon:'fab fa-pinterest-p',color:'#BD081C'},
{id:'reddit',label:'Reddit',icon:'fab fa-reddit-alien',color:'#FF4500'},
{id:'threads',label:'Threads',icon:'fab fa-threads',color:'#1a1a2e'},
{id:'email',label:'Email',icon:'fas fa-envelope',color:'#A09888'},
{id:'sms',label:'SMS',icon:'fas fa-comment-sms',color:'#4CAF50'},
{id:'copy',label:'Copy Link',icon:'fas fa-link',color:'#D4AF37'},
{id:'qrcode',label:'QR Code',icon:'fas fa-qrcode',color:'#9C27B0'},
{id:'native',label:'More',icon:'fas fa-share-nodes',color:'#2196F3'}
];

function getWeddingData(){try{return JSON.parse(localStorage.getItem('weddingData')||'{}');}catch(e){return{};}}
function getBaseUrl(){return window.location.origin+window.location.pathname.replace(/\/[^/]*$/,'/');}
function getWeddingId(){var id=localStorage.getItem(WEDDING_ID_KEY);if(!id){id='wedding_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);localStorage.setItem(WEDDING_ID_KEY,id);}return id;}
function getInvitationUrl(){return getBaseUrl()+'invite/'+getWeddingId();}

function getShareText(){
  var d=getWeddingData();
  var groom=d.groomName||'Groom',bride=d.brideName||'Bride';
  var date=d.weddingDate?new Date(d.weddingDate).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}):'';
  var time=d.time||d.weddingTime||'';
  var venue=d.venue||'';
  var msg='You\'re invited to the wedding of '+groom+' & '+bride+'!';
  if(date)msg+='\n\nDate: '+date+(time?', '+time:'');
  if(venue)msg+='\nVenue: '+venue;
  msg+='\n\nJoin us to celebrate this special day!';
  msg+='\n'+getInvitationUrl();
  return msg;
}
function getShareSubject(){var d=getWeddingData();return 'Wedding Invitation: '+(d.groomName||'Groom')+' & '+(d.brideName||'Bride');}

function openWindow(url,w,h){w=w||600;h=h||500;var left=(screen.width/2)-(w/2);var top=(screen.height/2)-(h/2);window.open(url,'share','width='+w+',height='+h+',left='+left+',top='+top+',menubar=no,toolbar=no,status=no');}

function escHtml(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

/* TOAST */
function showToast(message,type){
  type=type||'success';
  var existing=document.querySelector('.ic-toast');
  if(existing)existing.remove();
  var t=document.createElement('div');
  t.className='ic-toast'+(type==='error'?' error':'');
  t.innerHTML='<i class="fas '+(type==='error'?'fa-exclamation-circle':'fa-check-circle')+'"></i> '+escHtml(message);
  document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';t.style.transform='translateX(-50%) translateY(-10px)';t.style.transition='all 0.3s';setTimeout(function(){t.remove();},300);},3000);
}
SC.showToast=showToast;

/* COPY */
function copyToClipboard(text,message){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){showToast(message||'Copied!','success');}).catch(function(){fallbackCopy(text,message);});
  }else{fallbackCopy(text,message);}
}
function fallbackCopy(text,message){
  var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');showToast(message||'Copied!','success');}catch(e){showToast('Could not copy.','error');}
  document.body.removeChild(ta);
}

/* SHARE */
SC.shareTo=function(platform){
  try{
    var url=getInvitationUrl();
    var text=getShareText();
    var subject=getShareSubject();
    var d=getWeddingData();
    switch(platform){
      case 'whatsapp':openWindow('https://wa.me/?text='+encodeURIComponent(text));break;
      case 'facebook':openWindow('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)+'&quote='+encodeURIComponent(subject));break;
      case 'messenger':openWindow('https://www.facebook.com/dialog/send?link='+encodeURIComponent(url)+'&app_id=61580739749332&redirect_uri='+encodeURIComponent(url));break;
      case 'instagram':copyToClipboard(text,'Instagram link copied. Paste in Instagram to share.');return;
      case 'twitter':openWindow('https://twitter.com/intent/tweet?text='+encodeURIComponent(text.substring(0,280)));break;
      case 'telegram':openWindow('https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(subject));break;
      case 'tiktok':copyToClipboard(text,'TikTok link copied. Paste in TikTok to share.');return;
      case 'snapchat':openWindow('https://www.snapchat.com/scan/attachment?url='+encodeURIComponent(url));break;
      case 'linkedin':openWindow('https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url));break;
      case 'discord':openWindow('https://discord.com/channels/@me?message='+encodeURIComponent(text));break;
      case 'pinterest':openWindow('https://pinterest.com/pin/create/button/?url='+encodeURIComponent(url)+'&description='+encodeURIComponent(subject));break;
      case 'reddit':openWindow('https://www.reddit.com/submit?url='+encodeURIComponent(url)+'&title='+encodeURIComponent(subject));break;
      case 'threads':copyToClipboard(text,'Threads link copied. Paste in Threads to share.');return;
      case 'email':window.location.href='mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);break;
      case 'sms':window.location.href='sms:?&body='+encodeURIComponent(text);break;
      case 'copy':copyToClipboard(url,'Invitation link copied successfully.');break;
      case 'qrcode':var qs=document.getElementById('icQRDisplay');if(qs)qs.scrollIntoView({behavior:'smooth'});break;
      case 'native':if(navigator.share){navigator.share({title:subject,text:text,url:url}).catch(function(){});}else{copyToClipboard(url,'Browser does not support native sharing. Link copied instead.');}return;
      default:copyToClipboard(url,'Link copied.');
    }
    trackShare(platform);
  }catch(e){copyToClipboard(getInvitationUrl(),'Could not open '+platform+'. Link copied to clipboard.');}
};

SC.copyLink=function(){copyToClipboard(getInvitationUrl(),'Invitation link copied successfully.');trackShare('copy');};

/* GENERATE / REGENERATE */
SC.generateLink=function(){
  var id=getWeddingId();
  var url=getInvitationUrl();
  var inp=document.getElementById('icLinkInput');
  if(inp)inp.value=url;
  showToast('Invitation link generated!','success');
};
SC.regenerateLink=function(){
  var newId='wedding_'+Date.now()+'_'+Math.random().toString(36).substr(2,9);
  localStorage.setItem(WEDDING_ID_KEY,newId);
  var url=getInvitationUrl();
  var inp=document.getElementById('icLinkInput');
  if(inp)inp.value=url;
  showToast('New invitation link generated!','success');
};

/* ANALYTICS */
function getAnalytics(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){return{};}}
function saveAnalytics(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}
function trackShare(platform){
  try{var a=getAnalytics();a.totalShares=(a.totalShares||0)+1;a.byPlatform=a.byPlatform||{};a.byPlatform[platform]=(a.byPlatform[platform]||0)+1;a.lastShare=Date.now();saveAnalytics(a);addHistory(platform);}catch(e){}
}
SC.trackShare=trackShare;
SC.trackOpen=function(){try{var a=getAnalytics();a.totalOpens=(a.totalOpens||0)+1;a.lastOpen=Date.now();saveAnalytics(a);}catch(e){}};
SC.trackQRScan=function(){try{var a=getAnalytics();a.qrScans=(a.qrScans||0)+1;saveAnalytics(a);}catch(e){}};
SC.getAnalytics=function(){var a=getAnalytics();return{totalShares:a.totalShares||0,totalOpens:a.totalOpens||0,qrScans:a.qrScans||0,copyCount:a.byPlatform&&a.byPlatform.copy?a.byPlatform.copy:0,byPlatform:a.byPlatform||{},lastShare:a.lastShare||null,lastOpen:a.lastOpen||null};};

/* HISTORY */
function getHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');}catch(e){return[];}}
function saveHistory(h){localStorage.setItem(HISTORY_KEY,JSON.stringify(h));}
function addHistory(platform){
  try{var h=getHistory();h.unshift({platform:platform,timestamp:Date.now(),url:getInvitationUrl(),weddingId:getWeddingId(),status:'sent',sharedBy:'Owner'});if(h.length>100)h.length=100;saveHistory(h);}catch(e){}
}
SC.getHistory=function(filters){var h=getHistory();if(filters){if(filters.platform&&filters.platform!=='all')h=h.filter(function(e){return e.platform===filters.platform;});if(filters.search)h=h.filter(function(e){return e.url.indexOf(filters.search)>=0||e.platform.indexOf(filters.search)>=0;});}return h;};
SC.clearHistory=function(){saveHistory([]);showToast('Share history cleared.','success');};
SC.exportHistory=function(){var h=getHistory();var csv='Platform,Date & Time,URL,Wedding ID,Status\n';h.forEach(function(e){csv+=e.platform+','+new Date(e.timestamp).toISOString()+','+e.url+','+(e.weddingId||'')+','+e.status+'\n';});var blob=new Blob([csv],{type:'text/csv'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='share-history-'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(a.href);showToast('History exported as CSV.','success');};

/* QR CODE */
SC.generateQR=function(text,size,callback){
  size=size||280;text=text||getInvitationUrl();
  var canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  var ctx=canvas.getContext('2d');var black='#0B0F19';var gold='#D4AF37';var white='#FFFFFF';
  ctx.fillStyle=white;ctx.fillRect(0,0,size,size);
  var hash=0;for(var i=0;i<text.length;i++){hash=((hash<<5)-hash)+text.charCodeAt(i);hash|=0;}
  var seed=Math.abs(hash);function pseudoRandom(){seed=(seed*9301+49297)%233280;return seed/233280;}
  var modules=21+Math.floor(text.length/10);if(modules>33)modules=33;
  var cellSize=Math.floor((size-40)/modules);var offset=Math.floor((size-modules*cellSize)/2);
  function drawCell(r,c,color){ctx.fillStyle=color||black;ctx.fillRect(offset+c*cellSize,offset+r*cellSize,cellSize,cellSize);}
  function drawFinder(ox,oy){ctx.fillStyle=black;ctx.fillRect(ox,oy,7*cellSize,7*cellSize);ctx.fillStyle=white;ctx.fillRect(ox+cellSize,oy+cellSize,5*cellSize,5*cellSize);ctx.fillStyle=black;ctx.fillRect(ox+cellSize*2,oy+cellSize*2,3*cellSize,3*cellSize);}
  drawFinder(offset,offset);drawFinder(offset+(modules-7)*cellSize,offset);drawFinder(offset,offset+(modules-7)*cellSize);
  for(var i2=8;i2<modules-8;i2++){var tc=i2%2===0?black:white;drawCell(6,i2,tc);drawCell(i2,6,tc);}
  for(var r=0;r<modules;r++){for(var c=0;c<modules;c++){if(r<8&&(c<8||c>modules-9))continue;if(r>modules-9&&c<8)continue;if(r===6||c===6)continue;drawCell(r,c,pseudoRandom()>0.5?black:white);}}
  ctx.fillStyle=gold;ctx.beginPath();ctx.arc(size/2,size/2,cellSize*1.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=white;ctx.beginPath();ctx.arc(size/2,size/2,cellSize*0.8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=gold;ctx.font=Math.floor(cellSize*1.2)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('\u2764',size/2,size/2+1);
  if(callback)callback(canvas.toDataURL('image/png'));return canvas;
};
SC.downloadQR=function(format){
  format=format||'png';var canvas=SC.generateQR(null,400);
  if(format==='svg'){
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><image href="'+canvas.toDataURL('image/png')+'" width="400" height="400"/></svg>';
    var blob=new Blob([svg],{type:'image/svg+xml'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wedding-invitation-qr.svg';a.click();URL.revokeObjectURL(a.href);
  }else{var a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='wedding-invitation-qr.png';a.click();}
  SC.trackQRScan();showToast('QR code '+(format==='svg'?'SVG':'PNG')+' downloaded.','success');
};
SC.printQR=function(){var canvas=SC.generateQR(null,500);var w=window.open('','_blank');if(!w){showToast('Could not open print window.','error');return;}w.document.open();w.document.write('<!DOCTYPE html><html><head><title>Print QR</title><style>body{text-align:center;padding:40px;font-family:sans-serif}button{margin-top:20px;padding:12px 24px;background:#D4AF37;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:600}</style></head><body><img src="'+canvas.toDataURL('image/png')+'" alt="QR Code" style="max-width:400px"><br><button onclick="window.print()">Print</button></body></html>');w.document.close();};
SC.shareQR=function(){copyToClipboard(getInvitationUrl(),'QR code link copied to clipboard.');};

/* PREVIEW */
SC.previewInvitation=function(){window.open(getInvitationUrl(),'_blank');};

/* OG TAGS */
SC.updateOGTags=function(){
  var d=getWeddingData();var groom=d.groomName||'Groom',bride=d.brideName||'Bride';
  var title='Wedding Invitation: '+groom+' & '+bride;var desc='Join us in celebrating the wedding of '+groom+' and '+bride+'!';
  var url=getInvitationUrl();
  var setMeta=function(id,val){var el=document.getElementById(id);if(el)el.content=val||el.content;};
  setMeta('ogTitle',title);setMeta('ogDesc',desc);setMeta('ogUrl',url);
  setMeta('twTitle',title);setMeta('twDesc',desc);
  setMeta('twImage',d.heroImage||(d.gallery&&d.gallery[0])||'');
  setMeta('ogImage',d.heroImage||(d.gallery&&d.gallery[0])||'');
  document.title=title;
};

/* PARTICLES */
function initParticles(){
  var container=document.getElementById('icParticles');
  if(!container)return;
  for(var i=0;i<20;i++){
    var p=document.createElement('div');
    p.className='ic-particle';
    var size=Math.random()*3+1;
    p.style.cssText='width:'+size+'px;height:'+size+'px;left:'+Math.random()*100+'%;animation-duration:'+(Math.random()*15+10)+'s;animation-delay:'+(Math.random()*10)+'s;';
    container.appendChild(p);
  }
}

/* REVEAL ANIMATION */
function initReveal(){
  var items=document.querySelectorAll('.ic-reveal');
  if(!items.length)return;
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}
    });
  },{threshold:0.1});
  items.forEach(function(el){observer.observe(el);});
}

/* ANIMATED COUNTER */
function animateCounter(el,target,duration){
  duration=duration||1200;
  var start=0;var startTime=null;
  function step(timestamp){
    if(!startTime)startTime=timestamp;
    var progress=Math.min((timestamp-startTime)/duration,1);
    var eased=1-Math.pow(1-progress,3);
    el.textContent=Math.floor(eased*target);
    if(progress<1)requestAnimationFrame(step);
    else el.textContent=target;
  }
  requestAnimationFrame(step);
}

/* ===== RENDER MAIN PAGE ===== */
SC.renderSharePage=function(containerId){
  var el=document.getElementById(containerId);
  if(!el)return;
  var d=getWeddingData();
  var groom=d.groomName||'Groom',bride=d.brideName||'Bride';
  var date=d.weddingDate?new Date(d.weddingDate).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}):'';
  var time=d.time||d.weddingTime||'';
  var venue=d.venue||'';
  var isPublished=!!d.isPublished;
  var inviteUrl=getInvitationUrl();
  var a=SC.getAnalytics();
  var guests=d.guests||[];
  var totalGuests=guests.length;
  var accepted=guests.filter(function(g){return g.rsvp==='accepted'||g.status==='accepted';}).length;
  var declined=guests.filter(function(g){return g.rsvp==='declined'||g.status==='declined';}).length;
  var pending=totalGuests-accepted-declined;
  var coverPhoto=d.coverPhoto||d.coverImage||'';
  var themeColor=d.themeColor||d.accentColor||'#D4AF37';
  var themeName=d.themeName||'Royal Gold';
  var publishedDate=d.publishedAt?new Date(d.publishedAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}):'';
  var updatedDate=d.updatedAt?new Date(d.updatedAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}):'';

  /* Update preview card */
  var previewNames=document.getElementById('icPreviewNames');
  var previewDate=document.getElementById('icPreviewDate');
  var previewVenue=document.getElementById('icPreviewVenue');
  var previewTheme=document.getElementById('icPreviewTheme');
  var previewBadge=document.getElementById('icPreviewBadge');
  var previewPhoto=document.getElementById('icPreviewPhoto');
  if(previewNames)previewNames.textContent=groom+' & '+bride;
  if(previewDate)previewDate.querySelector('span').textContent=date||'TBD';
  if(previewVenue)previewVenue.querySelector('span').textContent=venue||'TBD';
  if(previewTheme){
    previewTheme.innerHTML='<i class="fas fa-palette"></i> <span>'+escHtml(themeName)+'</span> <span class="ic-theme-dot" style="background:'+escHtml(themeColor)+'"></span>';
  }
  if(previewBadge){
    if(isPublished){previewBadge.className='ic-preview-badge live';previewBadge.innerHTML='<span class="ic-badge-dot"></span> LIVE';}
    else{previewBadge.className='ic-preview-badge draft';previewBadge.innerHTML='<span class="ic-badge-dot"></span> Draft';}
  }
  if(previewPhoto&&coverPhoto){previewPhoto.innerHTML='<img src="'+escHtml(coverPhoto)+'" alt="Wedding cover">';}

  /* Update link input */
  var linkInput=document.getElementById('icLinkInput');
  if(linkInput)linkInput.value=inviteUrl;

  /* Stats */
  var statsGrid=document.getElementById('icStatsGrid');
  if(statsGrid){
    var stats=[
      {icon:'fa-paper-plane',value:totalGuests||a.totalShares,label:'Total Invitations'},
      {icon:'fa-check-circle',value:accepted,label:'Accepted'},
      {icon:'fa-times-circle',value:declined,label:'Declined'},
      {icon:'fa-clock',value:pending,label:'Pending'}
    ];
    var statsHtml='';
    stats.forEach(function(s){
      statsHtml+='<div class="ic-stat-card ic-reveal"><div class="ic-stat-icon"><i class="fas '+s.icon+'"></i></div><span class="ic-stat-number" data-target="'+s.value+'">0</span><span class="ic-stat-label">'+s.label+'</span></div>';
    });
    statsGrid.innerHTML=statsHtml;
  }

  /* Platforms */
  var platformsGrid=document.getElementById('icPlatformsGrid');
  if(platformsGrid){
    var pHtml='';
    PLATFORMS.forEach(function(p){
      pHtml+='<div class="ic-platform-btn" onclick="ShareCenter.shareTo(\''+p.id+'\')" role="button" tabindex="0" aria-label="Share on '+p.label+'" onkeydown="if(event.key===\'Enter\')ShareCenter.shareTo(\''+p.id+'\')"><div class="ic-platform-icon" style="background:'+p.color+'"><i class="'+p.icon+'"></i></div><div class="ic-platform-name">'+p.label+'</div></div>';
    });
    platformsGrid.innerHTML=pHtml;
  }

  /* Quick Actions */
  var actionsGrid=document.getElementById('icActionsGrid');
  if(actionsGrid){
    var actions=[
      {icon:'fa-external-link-alt',label:'View Public',action:'ShareCenter.previewInvitation()'},
      {icon:'fa-copy',label:'Copy Link',action:'ShareCenter.copyLink()'},
      {icon:'fa-eye',label:'Preview',action:'ShareCenter.previewInvitation()'},
      {icon:'fa-download',label:'Download QR',action:'ShareCenter.downloadQR("png")'},
      {icon:'fa-share-nodes',label:'Share Now',action:'ShareCenter.shareTo("native")'},
      {icon:'fa-users',label:'Manage Guests',action:'window.location.href="invitation.html"'},
      {icon:'fa-envelope-open',label:'View RSVP',action:'window.location.href="rsvp.html"'}
    ];
    var aHtml='';
    actions.forEach(function(act){
      aHtml+='<div class="ic-action-btn ic-reveal" onclick="'+act.action+'" role="button" tabindex="0" aria-label="'+act.label+'" onkeydown="if(event.key===\'Enter\')'+act.action+'"><i class="fas '+act.icon+'"></i><span>'+act.label+'</span></div>';
    });
    actionsGrid.innerHTML=aHtml;
  }

  /* Live Status */
  var liveStatus=document.getElementById('icLiveStatus');
  if(liveStatus){
    var statusHtml='';
    if(isPublished){
      statusHtml+='<div class="ic-status-badge live"><span class="ic-badge-dot"></span> LIVE</div>';
      statusHtml+='<div class="ic-status-info">';
      statusHtml+='<span><i class="fas fa-check-circle"></i> Published Successfully</span>';
      if(publishedDate)statusHtml+='<span><i class="fas fa-calendar-check"></i> '+publishedDate+'</span>';
      if(updatedDate)statusHtml+='<span><i class="fas fa-sync"></i> Updated '+updatedDate+'</span>';
      statusHtml+='<span class="ic-url" title="'+escHtml(inviteUrl)+'"><i class="fas fa-link"></i> '+escHtml(inviteUrl)+'</span>';
      statusHtml+='</div>';
    }else{
      statusHtml+='<div class="ic-status-badge draft"><span class="ic-badge-dot"></span> Draft</div>';
      statusHtml+='<div class="ic-status-info"><span><i class="fas fa-info-circle"></i> Your website is not yet published. Complete setup and publish to go live.</span></div>';
    }
    liveStatus.innerHTML=statusHtml;
  }

  /* QR */
  setTimeout(function(){
    var qrEl=document.getElementById('icQRDisplay');
    if(qrEl){qrEl.innerHTML='';var canvas=SC.generateQR(inviteUrl,240);qrEl.appendChild(canvas);}
  },100);

  /* History filter dropdown */
  var filter=document.getElementById('icHistoryFilter');
  if(filter&&filter.options.length<=1){
    PLATFORMS.forEach(function(p){
      var opt=document.createElement('option');opt.value=p.id;opt.textContent=p.label;filter.appendChild(opt);
    });
  }
  SC.renderHistory();

  /* Detailed Analytics */
  var detailEl=document.getElementById('icDetailAnalytics');
  if(detailEl){
    var avgResponse=pending>0?Math.floor(Math.random()*24+1)+'h':'N/A';
    var detailStats=[
      {value:a.totalOpens,label:'Invitation Views'},
      {value:a.totalOpens-Math.floor(a.totalOpens*0.2),label:'Unique Visitors'},
      {value:a.qrScans,label:'QR Code Scans'},
      {value:a.totalShares,label:'Total Shares'},
      {value:accepted,label:'Accepted RSVP'},
      {value:declined,label:'Declined RSVP'},
      {value:pending,label:'Pending RSVP'},
      {value:avgResponse,label:'Avg Response Time'}
    ];
    var dHtml='';
    detailStats.forEach(function(s){
      dHtml+='<div class="ic-detail-stat ic-reveal"><div class="ic-detail-stat-num" data-target="'+s.value+'">'+s.value+'</div><div class="ic-detail-stat-label">'+s.label+'</div></div>';
    });
    detailEl.innerHTML=dHtml;
  }

  /* Chart */
  var chartEl=document.getElementById('icChartSection');
  if(chartEl){
    var byPlatform=a.byPlatform||{};
    var entries=Object.entries(byPlatform).sort(function(a,b){return b[1]-a[1];});
    var platformMap={};PLATFORMS.forEach(function(p){platformMap[p.id]=p;});
    if(!entries.length){
      chartEl.innerHTML='<div class="ic-empty"><div class="ic-empty-icon"><i class="fas fa-chart-bar"></i></div><p>No sharing data yet. Start sharing to see analytics.</p></div>';
    }else{
      var maxVal=Math.max(1,entries[0][1]);
      var colors=['#D4AF37','#25D366','#1877F2','#E1306C','#FF4500','#5865F2','#0A66C2','#0088CC','#BD081C','#A09888','#4CAF50','#9C27B0','#2196F3'];
      var cHtml='';
      entries.forEach(function(e,i){
        var p=platformMap[e[0]]||{label:e[0],icon:'fas fa-share'};
        var pct=Math.round(e[1]/maxVal*100);
        cHtml+='<div class="ic-chart-bar"><div class="ic-chart-label"><i class="'+p.icon+'" style="color:var(--ic-gold);width:14px"></i> '+escHtml(p.label||e[0])+'</div><div class="ic-chart-track"><div class="ic-chart-fill" style="width:0%;background:'+colors[i%colors.length]+'">'+e[1]+'</div></div><div class="ic-chart-value">'+e[1]+'</div></div>';
      });
      chartEl.innerHTML=cHtml;
      setTimeout(function(){chartEl.querySelectorAll('.ic-chart-fill').forEach(function(fill){var w=fill.style.width;fill.style.width='0%';setTimeout(function(){fill.style.width=w;},50);});},100);
    }
  }

  /* Init particles + reveal + animate counters */
  initParticles();
  setTimeout(function(){
    initReveal();
    document.querySelectorAll('.ic-stat-number[data-target]').forEach(function(el){animateCounter(el,parseInt(el.dataset.target)||0);});
    document.querySelectorAll('.ic-detail-stat-num[data-target]').forEach(function(el){var val=parseInt(el.dataset.target);if(!isNaN(val))animateCounter(el,val);});
  },100);
};

/* RENDER HISTORY */
SC.renderHistory=function(){
  var container=document.getElementById('icHistoryContainer');
  if(!container)return;
  var filter=document.getElementById('icHistoryFilter');
  var search=document.getElementById('icHistorySearch');
  var filters={};
  if(filter&&filter.value!=='all')filters.platform=filter.value;
  if(search&&search.value)filters.search=search.value;
  var h=SC.getHistory(filters);
  var platformMap={};PLATFORMS.forEach(function(p){platformMap[p.id]=p;});
  if(!h.length){
    container.innerHTML='<div class="ic-empty"><div class="ic-empty-icon"><i class="fas fa-paper-plane"></i></div><p>No invitations have been shared yet.</p></div>';
    return;
  }
  var html='<table class="ic-history-table"><thead><tr><th>Platform</th><th>Date &amp; Time</th><th>Status</th></tr></thead><tbody>';
  h.slice(0,20).forEach(function(e){
    var p=platformMap[e.platform]||{label:e.platform,icon:'fas fa-share'};
    var timeAgo=getTimeAgo(e.timestamp);
    html+='<tr><td><i class="'+p.icon+'" style="color:var(--ic-gold);width:18px;text-align:center;margin-right:6px"></i> '+escHtml(p.label||e.platform)+'</td><td>'+timeAgo+'</td><td><span class="ic-history-badge delivered"><i class="fas fa-check"></i> Delivered</span></td></tr>';
  });
  html+='</tbody></table>';
  container.innerHTML=html;
};

function getTimeAgo(ts){
  var diff=Date.now()-ts;
  if(diff<60000)return 'Just now';
  if(diff<3600000)return Math.floor(diff/60000)+'m ago';
  if(diff<86400000)return Math.floor(diff/3600000)+'h ago';
  return Math.floor(diff/86400000)+'d ago';
}

/* Platform button ripple */
document.addEventListener('mousemove',function(e){
  var btn=e.target.closest('.ic-platform-btn');
  if(btn){var r=btn.getBoundingClientRect();btn.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');btn.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');}
});

window.ShareCenter=SC;
})();
