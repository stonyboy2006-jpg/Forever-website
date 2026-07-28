/**
 * Wedding Publish Engine — One-Click Live Publishing
 * Centralized module for publish, auto-save, version history, unsaved changes
 */
(function(){
'use strict';

var P={};
var DB_KEY='weddingData';
var VERSION_KEY='weddingVersions';
var DRAFT_KEY='weddingDraft';
var DRAFT_TIMER_KEY='weddingDraftTimer';
var _autoSaveTimer=null;
var _dirty=false;
var _lastSnapshot='';

function getData(){
  try{var raw=localStorage.getItem(DB_KEY);return raw?JSON.parse(raw):{};}catch(e){return{};}
}
function saveData(d){localStorage.setItem(DB_KEY,JSON.stringify(d));}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

// ===== VALIDATION =====
P.validate=function(d){
  d=d||getData();
  var missing=[];
  if(!d.groomName)missing.push('Groom Name');
  if(!d.brideName)missing.push('Bride Name');
  if(!d.weddingDate)missing.push('Wedding Date');
  if(!d.venue)missing.push('Venue');
  return missing;
};

// ===== WEDDING ID =====
P.ensureWeddingId=function(d){
  d=d||getData();
  if(!d.weddingId){
    d.weddingId='WD-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).substr(2,4).toUpperCase();
    saveData(d);
  }
  return d.weddingId;
};

// ===== INVITATION URL =====
P.getInviteUrl=function(d){
  d=d||getData();
  var id=d.weddingId||P.ensureWeddingId(d);
  return window.location.origin+'/invite/'+id;
};

// ===== QR CODE =====
P.generateQR=function(text,size){
  size=size||280;
  text=text||P.getInviteUrl();
  var canvas=document.createElement('canvas');
  canvas.width=size;canvas.height=size;
  var ctx=canvas.getContext('2d');
  ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,size,size);
  var hash=0;for(var i=0;i<text.length;i++){hash=((hash<<5)-hash)+text.charCodeAt(i);hash|=0;}
  var seed=Math.abs(hash);
  function pr(){seed=(seed*9301+49297)%233280;return seed/233280;}
  var modules=21+Math.floor(text.length/10);if(modules>33)modules=33;
  var cellSize=Math.floor((size-40)/modules);
  var offset=Math.floor((size-modules*cellSize)/2);
  function drawCell(r,c,color){ctx.fillStyle=color||'#0B0F19';ctx.fillRect(offset+c*cellSize,offset+r*cellSize,cellSize,cellSize);}
  function drawFinder(ox,oy){ctx.fillStyle='#0B0F19';ctx.fillRect(ox,oy,7*cellSize,7*cellSize);ctx.fillStyle='#FFFFFF';ctx.fillRect(ox+cellSize,oy+cellSize,5*cellSize,5*cellSize);ctx.fillStyle='#0B0F19';ctx.fillRect(ox+cellSize*2,oy+cellSize*2,3*cellSize,3*cellSize);}
  drawFinder(offset,offset);drawFinder(offset+(modules-7)*cellSize,offset);drawFinder(offset,offset+(modules-7)*cellSize);
  for(var i2=8;i2<modules-8;i2++){drawCell(6,i2,i2%2===0?'#0B0F19':'#FFFFFF');drawCell(i2,6,i2%2===0?'#0B0F19':'#FFFFFF');}
  for(var r=0;r<modules;r++){for(var c=0;c<modules;c++){if(r<8&&(c<8||c>modules-9))continue;if(r>modules-9&&c<8)continue;if(r===6||c===6)continue;drawCell(r,c,pr()>0.5?'#0B0F19':'#FFFFFF');}}
  ctx.fillStyle='#D4AF37';ctx.beginPath();ctx.arc(size/2,size/2,cellSize*1.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.arc(size/2,size/2,cellSize*0.8,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#D4AF37';ctx.font=Math.floor(cellSize*1.2)+'px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('\u2764',size/2,size/2+1);
  return canvas;
};

// ===== OG METADATA =====
P.applyOGTags=function(d){
  d=d||getData();
  var groom=d.groomName||'Groom',bride=d.brideName||'Bride';
  var title='Wedding Invitation: '+groom+' & '+bride;
  var desc='Join us in celebrating the wedding of '+groom+' and '+bride+'!';
  if(d.weddingDate)desc+=' on '+new Date(d.weddingDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  if(d.venue)desc+=' at '+d.venue;
  var url=P.getInviteUrl(d);
  var img=d.coverPhoto||d.heroImage||(d.gallery&&d.gallery[0])||'';

  function setMeta(attr,val){
    var el=document.querySelector('meta[property="'+attr+'"]')||document.querySelector('meta[name="'+attr+'"]');
    if(el)el.setAttribute('content',val);
  }
  setMeta('og:title',title);setMeta('og:description',desc);setMeta('og:url',url);
  if(img)setMeta('og:image',img);
  setMeta('twitter:title',title);setMeta('twitter:description',desc);
  if(img)setMeta('twitter:image',img);
  var sd=document.querySelector('script[type="application/ld+json"]');
  if(sd){
    sd.textContent=JSON.stringify({"@context":"https://schema.org","@type":"WeddingEvent","name":title,"description":desc,"startDate":d.weddingDate,"location":{"@type":"Place","name":d.venue,"address":d.address},"url":url});
  }
  document.title=title;
};

// ===== VERSION HISTORY =====
function getVersions(){
  try{return JSON.parse(localStorage.getItem(VERSION_KEY)||'[]');}catch(e){return[];}
}
function saveVersions(v){localStorage.setItem(VERSION_KEY,JSON.stringify(v));}

P.saveVersion=function(d,label){
  d=d||getData();
  var versions=getVersions();
  versions.unshift({
    id:'v_'+Date.now().toString(36),
    label:label||'Published version',
    timestamp:Date.now(),
    snapshot:JSON.parse(JSON.stringify(d)),
    weddingId:d.weddingId
  });
  if(versions.length>20)versions.length=20;
  saveVersions(versions);
};

P.getVersions=function(){return getVersions();};

P.restoreVersion=function(versionId){
  var versions=getVersions();
  var v=versions.find(function(x){return x.id===versionId;});
  if(!v||!v.snapshot)return false;
  var current=getData();
  v.snapshot.updatedAt=Date.now();
  v.snapshot.restoredAt=Date.now();
  saveData(v.snapshot);
  P.saveVersion(current,'Before restore');
  return true;
};

P.deleteVersion=function(versionId){
  var versions=getVersions().filter(function(v){return v.id!==versionId;});
  saveVersions(versions);
};

// ===== AUTO-SAVE =====
P.markDirty=function(){_dirty=true;P.showUnsavedBanner();};
P.isDirty=function(){return _dirty;};
P.markClean=function(){_dirty=false;P.hideUnsavedBanner();};

P.startAutoSave=function(getDataFn){
  if(_autoSaveTimer)clearInterval(_autoSaveTimer);
  _lastSnapshot=JSON.stringify(getData());
  _autoSaveTimer=setInterval(function(){
    if(!_dirty)return;
    var current=JSON.stringify(getDataFn?getDataFn():getData());
    if(current!==_lastSnapshot){
      var d=getDataFn?getDataFn():getData();
      d.updatedAt=Date.now();
      d._autoSaved=true;
      saveData(d);
      _lastSnapshot=JSON.stringify(d);
      _dirty=false;
      P.hideUnsavedBanner();
    }
  },8000);
};

P.stopAutoSave=function(){if(_autoSaveTimer){clearInterval(_autoSaveTimer);_autoSaveTimer=null;}};

// ===== UNSAVED CHANGES BANNER =====
P.showUnsavedBanner=function(){
  var b=document.getElementById('unsavedBanner');
  if(b){b.style.display='flex';return;}
  b=document.createElement('div');
  b.id='unsavedBanner';
  b.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:10000;display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 24px;background:rgba(11,15,25,0.97);border-top:1px solid rgba(212,175,55,0.2);backdrop-filter:blur(20px);font-family:Poppins,sans-serif;animation:slideUp 0.3s ease';
  b.innerHTML='<i class="fas fa-exclamation-circle" style="color:#f59e0b"></i><span style="color:#e8e0d0;font-size:0.88rem">You have unpublished changes.</span><button onclick="PublishEngine.publishUpdates()" style="padding:8px 18px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:8px;color:#0B0F19;font-weight:600;cursor:pointer;font-size:0.82rem;font-family:Poppins,sans-serif"><i class="fas fa-rocket" style="margin-right:6px"></i>Publish Updates</button><button onclick="PublishEngine.discardChanges()" style="padding:8px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(212,175,55,0.15);border-radius:8px;color:#e8e0d0;cursor:pointer;font-size:0.82rem;font-family:Poppins,sans-serif">Discard Changes</button>';
  document.body.appendChild(b);
};

P.hideUnsavedBanner=function(){
  var b=document.getElementById('unsavedBanner');
  if(b)b.style.display='none';
};

P.discardChanges=function(){
  _dirty=false;
  P.hideUnsavedBanner();
  if(typeof showNotification==='function')showNotification('Changes discarded','info');
};

P.publishUpdates=function(){
  var d=getData();
  d.isPublished=true;
  d.updatedAt=Date.now();
  d.lastPublishAt=Date.now();
  saveData(d);
  P.saveVersion(d,'Publish update');
  _dirty=false;
  P.hideUnsavedBanner();
  P.applyOGTags(d);
  if(typeof showNotification==='function')showNotification('Updates published! Website is now live.','success');
  P.sendNotification('updates_published','Wedding updates published successfully!');
  try {
    var evt = new CustomEvent('wedding_published', { detail: { weddingId: d.weddingId, inviteUrl: P.getInviteUrl(d), isUpdate: true } });
    document.dispatchEvent(evt);
  } catch(e) {}
};

// ===== MAIN PUBLISH =====
P.publish=function(opts){
  opts=opts||{};
  var d=getData();
  var missing=P.validate(d);
  if(missing.length){
    if(typeof showNotification==='function')showNotification('Please complete: '+missing.join(', '),'error');
    return{success:false,missing:missing};
  }

  var weddingId=P.ensureWeddingId(d);
  var inviteUrl=P.getInviteUrl(d);

  d.isPublished=true;
  d.publishedAt=d.publishedAt||Date.now();
  d.lastPublishAt=Date.now();
  d.updatedAt=Date.now();
  d.inviteUrl=inviteUrl;
  d.weddingId=weddingId;
  saveData(d);

  P.saveVersion(d,'Initial publish');
  P.applyOGTags(d);

  try{if(typeof fbSetDoc==='function')fbSetDoc('weddingInfo','main',d);}catch(e){}

  P.trackEvent('publish');
  P.sendNotification('invitation_published','Your wedding invitation is now live!');

  try {
    var evt = new CustomEvent('wedding_published', { detail: { weddingId: weddingId, inviteUrl: inviteUrl } });
    document.dispatchEvent(evt);
  } catch(e) {}

  return{success:true,weddingId:weddingId,inviteUrl:inviteUrl};
};

// ===== UNPUBLISH =====
P.unpublish=function(){
  var d=getData();
  d.isPublished=false;
  d.unpublishedAt=Date.now();
  d.updatedAt=Date.now();
  saveData(d);
  if(typeof showNotification==='function')showNotification('Website unpublished','info');
};

// ===== TRACKING =====
P.trackEvent=function(event){
  try{
    var a=JSON.parse(localStorage.getItem('weddingAnalytics')||'{}');
    if(!a.events)a.events={};
    var today=new Date().toISOString().split('T')[0];
    if(!a.daily)a.daily={};
    if(!a.daily[today])a.daily[today]={};
    a.events[event]=(a.events[event]||0)+1;
    a.daily[today][event]=(a.daily[today][event]||0)+1;
    a.lastEvent=Date.now();
    localStorage.setItem('weddingAnalytics',JSON.stringify(a));
  }catch(e){}
};

// ===== OWNER NOTIFICATIONS =====
P.sendNotification=function(type,message){
  try{
    var notifs=JSON.parse(localStorage.getItem('weddingNotifications')||'[]');
    notifs.unshift({
      id:'notif_'+Date.now().toString(36),
      type:type,
      message:message,
      time:Date.now(),
      read:false
    });
    if(notifs.length>50)notifs.length=50;
    localStorage.setItem('weddingNotifications',JSON.stringify(notifs));
    if(typeof updateNotifBadge==='function')updateNotifBadge();
  }catch(e){}
};

P.trackInvitationView=function(){
  P.trackEvent('page_view');
  P.sendNotification('invitation_viewed','Your wedding invitation was viewed!');
};

P.trackShare=function(platform){
  P.trackEvent('share_'+platform);
  P.sendNotification('website_shared','Your invitation was shared via '+platform+'!');
};

// ===== STATUS BADGE =====
P.renderStatusBadge=function(){
  var d=getData();
  var els=document.querySelectorAll('.publish-status-badge');
  els.forEach(function(el){
    if(d.isPublished){
      el.className='publish-status-badge status-live';
      el.innerHTML='<span class="status-dot"></span>Live';
    }else{
      el.className='publish-status-badge status-draft';
      el.innerHTML='<span class="status-dot"></span>Draft';
    }
  });
};

// ===== PUBLISH INFO =====
P.getPublishInfo=function(){
  var d=getData();
  return{
    isPublished:!!d.isPublished,
    publishedAt:d.publishedAt||null,
    lastPublishAt:d.lastPublishAt||null,
    updatedAt:d.updatedAt||null,
    weddingId:d.weddingId||null,
    inviteUrl:d.inviteUrl||P.getInviteUrl(d)
  };
};

// ===== PUBLIC API =====
window.PublishEngine=P;
window.InviteSys=window.InviteSys||{};

})();
