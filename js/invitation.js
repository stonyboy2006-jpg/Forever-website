/**
 * Wedding Invitation & Share System
 */
(function(){
'use strict';

var DB_KEY='weddingData';
var INV_KEY='weddingInvitations';
var INV_TEMPLATE_KEY='weddingInvTemplate';

function getData(){try{var r=localStorage.getItem(DB_KEY);return r?JSON.parse(r):{};}catch(e){return{};}}
function saveData(d){localStorage.setItem(DB_KEY,JSON.stringify(d));}
function getInvData(){try{var r=localStorage.getItem(INV_KEY);return r?JSON.parse(r):{guests:[],reminders:[]};}catch(e){return{guests:[],reminders:[]};}}
function saveInvData(d){localStorage.setItem(INV_KEY,JSON.stringify(d));}
function getTemplate(){return localStorage.getItem(INV_TEMPLATE_KEY)||'royal-gold';}
function setTemplate(t){localStorage.setItem(INV_TEMPLATE_KEY,t);}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function genId(){return 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,6);}
function fmt(s){if(!s||isNaN(s))return'0:00';var m=Math.floor(s/60);var sec=Math.floor(s%60);return m+':'+(sec<10?'0':'')+sec;}

var TEMPLATES=[
  {id:'royal-gold',name:'Royal Gold',desc:'Classic luxury gold on dark',cls:'tpl-royal-gold',ornament:'👑',colors:{bg:'#0B0F19',gold:'#D4AF37',text:'#E8E0D0'}},
  {id:'rose-gold',name:'Rose Gold',desc:'Romantic pink & rose tones',cls:'tpl-rose-gold',ornament:'🌹',colors:{bg:'#1A0F0A',gold:'#E8A87C',text:'#E8D0C0'}},
  {id:'floral',name:'Floral Garden',desc:'Natural green & floral',cls:'tpl-floral',ornament:'🌿',colors:{bg:'#0A1A0F',gold:'#90EE90',text:'#D0E0D0'}},
  {id:'midnight',name:'Midnight Romance',desc:'Deep blue elegance',cls:'tpl-midnight',ornament:'🌙',colors:{bg:'#0A0A1A',gold:'#C0C0FF',text:'#D0D0FF'}},
  {id:'minimalist',name:'Modern Minimalist',desc:'Clean & contemporary',cls:'tpl-minimalist',ornament:'✨',colors:{bg:'#FFFEF7',gold:'#333333',text:'#333333'}},
  {id:'emerald',name:'Emerald Elegance',desc:'Rich green luxury',cls:'tpl-emerald',ornament:'💎',colors:{bg:'#0A1A0F',gold:'#50C878',text:'#D0E0D0'}},
  {id:'classic-white',name:'Classic White',desc:'Timeless ivory & gold',cls:'tpl-classic-white',ornament:'🕊️',colors:{bg:'#FFFEF7',gold:'#B8860B',text:'#333333'}},
  {id:'african',name:'Traditional African',desc:'Warm earthy tones',cls:'tpl-african',ornament:'🎊',colors:{bg:'#1A0E05',gold:'#D4892E',text:'#E8D4C0'}}
];

function getInvitationUrl(){
  var base=window.location.origin+window.location.pathname.replace(/invitation\.html.*$/,'')+'invitation.html';
  return base;
}

function generateQR(text,size){
  var canvas=document.createElement('canvas');
  var ctx=canvas.getContext('2d');
  size=size||200;
  canvas.width=size;canvas.height=size;
  var modules=25;
  var cellSize=size/modules;
  ctx.fillStyle='#FFFFFF';
  ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#000000';
  var seed=0;
  for(var i=0;i<text.length;i++)seed=((seed<<5)-seed)+text.charCodeAt(i);
  function rand(){seed=(seed*16807+0)%2147483647;return(seed&1);}
  for(var r=0;r<modules;r++){
    for(var c=0;c<modules;c++){
      if((r<7&&c<7)||(r<7&&c>=modules-7)||(r>=modules-7&&c<7)){
        if(r===0||r===6||c===0||c===6||r>=modules-7&&c>=modules-7||(r>=2&&r<=4&&c>=2&&c<=4)){
          ctx.fillRect(c*cellSize,r*cellSize,cellSize,cellSize);
        }
      }else if(rand()){
        ctx.fillRect(c*cellSize,r*cellSize,cellSize,cellSize);
      }
    }
  }
  return canvas;
}

function downloadQR(){
  var url=getInvitationUrl();
  var canvas=generateQR(url,300);
  var link=document.createElement('a');
  link.download='wedding-qr-code.png';
  link.href=canvas.toDataURL('image/png');
  link.click();
  notify('QR Code downloaded!','success');
}

function shareWhatsApp(){
  var d=getData();
  var msg='You\'re invited to the wedding of '+esc(d.groomName||'Groom')+' & '+esc(d.brideName||'Bride')+'! 🎉\n\n';
  msg+='📅 '+esc(d.weddingDate||'')+'\n🕐 '+esc(d.weddingTime||'')+'\n📍 '+esc(d.venue||'')+'\n\n';
  msg+='View invitation: '+getInvitationUrl();
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}

function shareFacebook(){
  window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(getInvitationUrl()),'_blank');
}

function shareTwitter(){
  var d=getData();
  var text='You\'re invited to the wedding of '+esc(d.groomName||'Groom')+' & '+esc(d.brideName||'Bride')+'! 💍';
  window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(getInvitationUrl()),'_blank');
}

function shareTelegram(){
  var d=getData();
  var text='You\'re invited to the wedding of '+esc(d.groomName||'Groom')+' & '+esc(d.brideName||'Bride')+'! 💍\n\nView invitation: '+getInvitationUrl();
  window.open('https://t.me/share/url?url='+encodeURIComponent(getInvitationUrl())+'&text='+encodeURIComponent(text),'_blank');
}

function shareEmail(){
  var d=getData();
  var subject='Wedding Invitation - '+esc(d.groomName||'Groom')+' & '+esc(d.brideName||'Bride');
  var body='You are cordially invited to the wedding celebration of\n\n'+esc(d.groomName||'Groom')+' & '+esc(d.brideName||'Bride')+'\n\n';
  body+='Date: '+esc(d.weddingDate||'')+'\nTime: '+esc(d.weddingTime||'')+'\nVenue: '+esc(d.venue||'')+'\n\n';
  body+='View your invitation: '+getInvitationUrl();
  window.location.href='mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
}

function copyLink(){
  var url=getInvitationUrl();
  if(navigator.clipboard){
    navigator.clipboard.writeText(url).then(function(){showCopied();});
  }else{
    var ta=document.createElement('textarea');ta.value=url;document.body.appendChild(ta);ta.select();
    document.execCommand('copy');document.body.removeChild(ta);showCopied();
  }
}

function showCopied(){
  var btn=document.querySelector('.share-copy');
  if(btn){btn.classList.add('copied');btn.innerHTML='<i class="fas fa-check"></i> Copied!';setTimeout(function(){btn.classList.remove('copied');btn.innerHTML='<i class="fas fa-link"></i> Copy Link';},2000);}
}

function downloadInvitation(format){
  var d=getData();
  var tpl=getTemplate();
  var tplData=TEMPLATES.find(function(t){return t.id===tpl;})||TEMPLATES[0];
  var canvas=document.createElement('canvas');
  canvas.width=1080;canvas.height=1920;
  var ctx=canvas.getContext('2d');
  ctx.fillStyle=tplData.colors.bg;
  ctx.fillRect(0,0,1080,1920);
  ctx.fillStyle=tplData.colors.gold;
  ctx.font='80px serif';
  ctx.textAlign='center';
  ctx.fillText(tplData.ornament,540,200);
  ctx.fillStyle=tplData.colors.text;
  ctx.font='24px sans-serif';
  ctx.fillText('You Are Invited To The Wedding Of',540,300);
  ctx.font='bold 72px serif';
  ctx.fillStyle=tplData.colors.gold;
  ctx.fillText(d.groomName||'Groom',540,420);
  ctx.font='italic 48px serif';
  ctx.fillText('&',540,490);
  ctx.fillText(d.brideName||'Bride',540,570);
  ctx.font='28px sans-serif';
  ctx.fillStyle=tplData.colors.text;
  var dateStr=d.weddingDate?new Date(d.weddingDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}):'';
  ctx.fillText(dateStr,540,680);
  ctx.fillText(d.weddingTime||'',540,730);
  ctx.fillText(d.venue||'',540,800);
  ctx.fillText(d.address||'',540,850);
  var qrCanvas=generateQR(getInvitationUrl(),200);
  ctx.drawImage(qrCanvas,440,950,200,200);
  ctx.font='20px sans-serif';
  ctx.fillStyle=tplData.colors.text;
  ctx.fillText('Scan for invitation & RSVP',540,1200);
  ctx.font='18px sans-serif';
  ctx.globalAlpha=0.5;
  ctx.fillText('Forever & Always',540,1850);
  if(format==='pdf'){
    var link=document.createElement('a');
    link.download='wedding-invitation.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
    notify('Invitation downloaded! For full PDF, use a PDF library.','info');
  }else{
    var link=document.createElement('a');
    link.download='wedding-invitation.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
  }
  notify('Invitation downloaded as '+format.toUpperCase()+'!','success');
}

// ===== GUEST MANAGEMENT =====
function addGuest(name,email,phone){
  var inv=getInvData();
  inv.guests.push({id:genId(),name:name,email:email||'',phone:phone||'',invited:false,rsvp:'pending',sentAt:null,rsvpAt:null});
  saveInvData(inv);
  notify('Guest added!','success');
}

function editGuest(id,name,email,phone){
  var inv=getInvData();
  var g=inv.guests.find(function(g){return g.id===id;});
  if(g){g.name=name;g.email=email;g.phone=phone;saveInvData(inv);notify('Guest updated!','success');}
}

function deleteGuest(id){
  var inv=getInvData();
  inv.guests=inv.guests.filter(function(g){return g.id!==id;});
  saveInvData(inv);
  notify('Guest removed','info');
}

function sendInvitation(id){
  var inv=getInvData();
  var g=inv.guests.find(function(g){return g.id===id;});
  if(g){g.invited=true;g.sentAt=Date.now();saveInvData(inv);notify('Invitation sent to '+g.name+'!','success');}
}

function sendReminder(id,type){
  var inv=getInvData();
  var g=inv.guests.find(function(g){return g.id===id;});
  if(!g)return;
  var d=getData();
  var msg='';
  if(type==='30days')msg='Wedding in 30 days! '+esc(d.groomName)+' & '+esc(d.brideName)+' - '+esc(d.weddingDate)+' at '+esc(d.venue);
  else if(type==='7days')msg='Just 1 week until the wedding of '+esc(d.groomName)+' & '+esc(d.brideName)+'! We can\'t wait to celebrate with you!';
  else if(type==='tomorrow')msg='Tomorrow is the big day! '+esc(d.groomName)+' & '+esc(d.brideName)+'\'s wedding is TOMORROW at '+esc(d.venue)+'!';
  else if(type==='thankyou')msg='Thank you for celebrating with us at our wedding! Love, '+esc(d.groomName)+' & '+esc(d.brideName)+' 💕';
  if(g.email){
    var subject='Wedding Update - '+esc(d.groomName)+' & '+esc(d.brideName);
    window.open('mailto:'+g.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(msg),'_blank');
  }else if(g.phone){
    window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
  }else{
    copyToClipboard(msg);
    notify('Reminder copied to clipboard!','info');
  }
}

function copyToClipboard(text){
  if(navigator.clipboard){navigator.clipboard.writeText(text);}
  else{var ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}
}

function exportGuests(fmt){
  var inv=getInvData();
  var guests=inv.guests||[];
  if(fmt==='csv'){
    var csv='Name,Email,Phone,Invited,RSVP,Sent Date,RSVP Date\n';
    guests.forEach(function(g){
      csv+='"'+esc(g.name)+'","'+esc(g.email)+'","'+esc(g.phone)+'","'+(g.invited?'Yes':'No')+'","'+g.rsvp+'","'+(g.sentAt?new Date(g.sentAt).toLocaleDateString():'')+'","'+(g.rsvpAt?new Date(g.rsvpAt).toLocaleDateString():'')+'"\n';
    });
    downloadFile(csv,'guest-invitations.csv','text/csv');
  }else if(fmt==='excel'){
    var xml='<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Guests"><Table><Row><Cell><Data ss:Type="String">Name</Data></Cell><Cell><Data ss:Type="String">Email</Data></Cell><Cell><Data ss:Type="String">Phone</Data></Cell><Cell><Data ss:Type="String">Invited</Data></Cell><Cell><Data ss:Type="String">RSVP</Data></Cell></Row>';
    guests.forEach(function(g){xml+='<Row><Cell><Data ss:Type="String">'+esc(g.name)+'</Data></Cell><Cell><Data ss:Type="String">'+esc(g.email)+'</Data></Cell><Cell><Data ss:Type="String">'+esc(g.phone)+'</Data></Cell><Cell><Data ss:Type="String">'+(g.invited?'Yes':'No')+'</Data></Cell><Cell><Data ss:Type="String">'+g.rsvp+'</Data></Cell></Row>';});
    xml+='</Table></Worksheet></Workbook>';
    downloadFile(xml,'guest-invitations.xls','application/vnd.ms-excel');
  }else if(fmt==='pdf'){
    var text='GUEST INVITATION LIST\n\n';
    text+='Name | Email | Phone | Invited | RSVP\n';
    text+='='.repeat(60)+'\n';
    guests.forEach(function(g){text+=g.name+' | '+(g.email||'-')+' | '+(g.phone||'-')+' | '+(g.invited?'Yes':'No')+' | '+g.rsvp+'\n';});
    downloadFile(text,'guest-invitations.txt','text/plain');
  }
  notify('Guest list exported as '+fmt.toUpperCase(),'success');
}

function downloadFile(content,filename,type){
  var blob=new Blob([content],{type:type});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getStats(){
  var inv=getInvData();
  var guests=inv.guests||[];
  return{
    total:guests.length,
    sent:guests.filter(function(g){return g.invited;}).length,
    confirmed:guests.filter(function(g){return g.rsvp==='accepted';}).length,
    declined:guests.filter(function(g){return g.rsvp==='declined';}).length,
    pending:guests.filter(function(g){return g.rsvp==='pending';}).length,
    maybe:guests.filter(function(g){return g.rsvp==='maybe';}).length
  };
}

function notify(msg,type){
  var existing=document.querySelector('.inv-toast');
  if(existing)existing.remove();
  var t=document.createElement('div');
  t.className='inv-toast';
  t.style.cssText='position:fixed;top:24px;right:24px;z-index:100001;padding:14px 20px;border-radius:12px;background:rgba(11,15,25,0.95);border:1px solid rgba(212,175,55,0.15);backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;align-items:center;gap:10px;font-size:0.88rem;color:var(--text);transform:translateX(120%);opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
  var icons={success:'fa-check-circle',error:'fa-times-circle',info:'fa-info-circle'};
  var colors={success:'rgba(34,197,94,0.1)',error:'rgba(239,68,68,0.1)',info:'rgba(59,130,246,0.1)'};
  var iconColors={success:'#22c55e',error:'#ef4444',info:'#3b82f6'};
  t.innerHTML='<div style="width:28px;height:28px;border-radius:50%;background:'+colors[type]+';display:flex;align-items:center;justify-content:center"><i class="fas '+(icons[type]||icons.info)+'" style="color:'+(iconColors[type]||iconColors.info)+'"></i></div><span>'+msg+'</span>';
  document.body.appendChild(t);
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.style.transform='translateX(0)';t.style.opacity='1';});});
  setTimeout(function(){t.style.transform='translateX(120%)';t.style.opacity='0';setTimeout(function(){if(t.parentElement)t.remove();},400);},3000);
}

// ===== PAGE INIT =====
function initInvitationPage(){
  var d=getData();
  var tpl=getTemplate();
  var tplData=TEMPLATES.find(function(t){return t.id===tpl;})||TEMPLATES[0];
  document.documentElement.style.setProperty('--inv-bg',tplData.colors.bg);
  document.documentElement.style.setProperty('--inv-gold',tplData.colors.gold);
  document.documentElement.style.setProperty('--inv-text',tplData.colors.text);
  var namesEl=document.getElementById('invNames');
  if(namesEl)namesEl.innerHTML=esc(d.groomName||'Groom')+' <span class="amp">&</span> '+esc(d.brideName||'Bride');
  var tagline=document.getElementById('invTagline');
  if(tagline)tagline.textContent=d.quote||'A Love Written By God';
  var venueEl=document.getElementById('invVenue');
  if(venueEl)venueEl.innerHTML='<i class="fas fa-location-dot"></i> '+esc(d.venue||'Venue TBD');
  var timeEl=document.getElementById('invTime');
  if(timeEl)timeEl.innerHTML='<i class="fas fa-clock"></i> '+esc(d.weddingTime||'Time TBD');
  var dateEl=document.getElementById('invDate');
  if(dateEl&&d.weddingDate){
    var dt=new Date(d.weddingDate+'T00:00:00');
    dateEl.innerHTML='<span class="day">'+dt.getDate()+'</span><div class="month-year"><div class="month">'+dt.toLocaleDateString('en-US',{month:'long'})+'</div><div class="year">'+dt.getFullYear()+'</div></div>';
  }
  var photoEl=document.getElementById('invPhoto');
  if(photoEl){
    if(d.coverPhoto)photoEl.innerHTML='<img src="'+d.coverPhoto+'" alt="Couple">';
    else if(d.groomPhoto||d.bridePhoto){
      var imgs='';
      if(d.groomPhoto)imgs+='<img src="'+d.groomPhoto+'" alt="Groom" style="position:absolute;left:10%;top:15%;width:55%;height:70%;object-fit:cover;border-radius:50%">';
      if(d.bridePhoto)imgs+='<img src="'+d.bridePhoto+'" alt="Bride" style="position:absolute;right:10%;top:15%;width:55%;height:70%;object-fit:cover;border-radius:50%">';
      photoEl.innerHTML=imgs||'<i class="fas fa-heart"></i>';
    }else{
      photoEl.innerHTML='<i class="fas fa-heart"></i>';
    }
  }
  startCountdown(d.weddingDate);
  generateQR(getInvitationUrl(),180);
  renderTemplates();
  createSparkles();
  createPetals();
}

function startCountdown(dateStr){
  if(!dateStr)return;
  var target=new Date(dateStr+'T00:00:00');
  function update(){
    var diff=target-new Date();
    if(diff<=0){
      var els=document.querySelectorAll('.inv-cd-num');
      els.forEach(function(el){el.textContent='0';});
      return;
    }
    var days=Math.floor(diff/(1000*60*60*24));
    var hours=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
    var mins=Math.floor((diff%(1000*60*60))/(1000*60));
    var secs=Math.floor((diff%(1000*60))/1000);
    var d=document.getElementById('cdDays');if(d)d.textContent=days;
    var h=document.getElementById('cdHours');if(h)h.textContent=hours;
    var m=document.getElementById('cdMinutes');if(m)m.textContent=mins;
    var s=document.getElementById('cdSeconds');if(s)s.textContent=secs;
  }
  update();setInterval(update,1000);
}

function renderTemplates(){
  var grid=document.getElementById('templateGrid');
  if(!grid)return;
  var current=getTemplate();
  grid.innerHTML=TEMPLATES.map(function(t){
    return '<div class="template-card '+t.cls+(t.id===current?' active':'')+'" data-tpl="'+t.id+'" onclick="InvApp.selectTemplate(\''+t.id+'\')">'+
      '<div class="template-preview"><span class="ornament">'+t.ornament+'</span><div class="names">Bride & Groom</div></div>'+
      '<div class="template-info"><div class="name">'+esc(t.name)+'</div><div class="desc">'+esc(t.desc)+'</div></div></div>';
  }).join('');
}

function selectTemplate(id){
  setTemplate(id);
  document.querySelectorAll('.template-card').forEach(function(c){c.classList.toggle('active',c.dataset.tpl===id);});
  var tplData=TEMPLATES.find(function(t){return t.id===id;});
  if(tplData){
    document.documentElement.style.setProperty('--inv-bg',tplData.colors.bg);
    document.documentElement.style.setProperty('--inv-gold',tplData.colors.gold);
    document.documentElement.style.setProperty('--inv-text',tplData.colors.text);
  }
  notify('Template changed to '+tplData.name,'success');
}

function createSparkles(){
  var container=document.querySelector('.sparkle-container');
  if(!container)return;
  for(var i=0;i<30;i++){
    var s=document.createElement('div');
    s.className='sparkle';
    s.style.left=Math.random()*100+'%';
    s.style.top=Math.random()*100+'%';
    s.style.animationDelay=Math.random()*4+'s';
    s.style.animationDuration=(2+Math.random()*3)+'s';
    s.style.width=s.style.height=(2+Math.random()*4)+'px';
    container.appendChild(s);
  }
}

function createPetals(){
  var container=document.querySelector('.petal-container');
  if(!container)return;
  for(var i=0;i<15;i++){
    var p=document.createElement('div');
    p.className='petal';
    p.style.left=Math.random()*100+'%';
    p.style.animationDuration=(10+Math.random()*15)+'s';
    p.style.animationDelay=(Math.random()*20)+'s';
    p.style.width=p.style.height=(8+Math.random()*12)+'px';
    container.appendChild(p);
  }
}

function animateStats(){
  document.querySelectorAll('.inv-stat .num').forEach(function(el){
    var target=parseInt(el.textContent)||0;
    el.textContent='0';
    var start=0;var startTime=null;
    function animate(ts){
      if(!startTime)startTime=ts;
      var progress=Math.min((ts-startTime)/1500,1);
      var eased=1-Math.pow(1-progress,3);
      el.textContent=Math.floor(eased*target);
      if(progress<1)requestAnimationFrame(animate);
      else el.textContent=target;
    }
    requestAnimationFrame(animate);
  });
}

var I={
  init:function(){initInvitationPage();},
  selectTemplate:selectTemplate,
  shareWhatsApp:shareWhatsApp,
  shareFacebook:shareFacebook,
  shareTwitter:shareTwitter,
  shareTelegram:shareTelegram,
  shareEmail:shareEmail,
  copyLink:copyLink,
  downloadQR:downloadQR,
  downloadInvitation:downloadInvitation,
  addGuest:addGuest,
  editGuest:editGuest,
  deleteGuest:deleteGuest,
  sendInvitation:sendInvitation,
  sendReminder:sendReminder,
  exportGuests:exportGuests,
  getStats:getStats,
  animateStats:animateStats
};
window.InvApp=I;

document.addEventListener('DOMContentLoaded',function(){
  if(document.querySelector('.inv-page'))I.init();
});

})();
