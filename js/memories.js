/**
 * Wedding Memories - Photo & Video Gallery
 */
(function(){
'use strict';

var DB_KEY='weddingData';
var MEM_KEY='weddingMemories';
var currentAlbum='all';
var currentType='all';
var currentFilter='all';
var lightboxItems=[];
var lightboxIndex=0;
var isSlideshow=false;
var slideshowTimer=null;

function getData(){try{var r=localStorage.getItem(DB_KEY);return r?JSON.parse(r):{};}catch(e){return{};}}
function getMemData(){try{var r=localStorage.getItem(MEM_KEY);return r?JSON.parse(r):getDefaultMem();}catch(e){return getDefaultMem();}}
function saveMemData(d){localStorage.setItem(MEM_KEY,JSON.stringify(d));}
function getDefaultMem(){return{featuredVideo:{title:'',desc:'',url:''},photos:[],guestUploads:[],settings:{allowDownloads:true,allowGuestUploads:true}};}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function genId(){return 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,6);}
function isVideo(url){return /\.(mp4|webm|ogg)$/i.test(url)||(url&&url.includes('youtube.com'))||(url&&url.includes('vimeo.com'));}
function isYouTube(url){return url&&(url.includes('youtube.com')||url.includes('youtu.be'));}
function isVimeo(url){return url&&url.includes('vimeo.com');}
function ytThumb(url){if(!url)return'';var m=url.match(/(?:v=|\/)([\w-]{11})/);return m?'https://img.youtube.com/vi/'+m[1]+'/hqdefault.jpg':'';}
function vimeoThumb(url){return url||'';}
function fmtSize(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';return(b/1048576).toFixed(1)+'MB';}
function fmtDate(d){if(!d)return'';return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}

var ALBUMS=[
  {id:'all',label:'All Media',icon:'fa-images'},
  {id:'engagement',label:'Engagement',icon:'fa-ring'},
  {id:'prewedding',label:'Pre-Wedding',icon:'fa-camera-retro'},
  {id:'traditional',label:'Traditional',icon:'fa-vest'},
  {id:'white',label:'White Wedding',icon:'fa-dove'},
  {id:'reception',label:'Reception',icon:'fa-champagne-glasses'},
  {id:'family',label:'Family & Friends',icon:'fa-users'},
  {id:'honeymoon',label:'Honeymoon',icon:'fa-plane'}
];

function getAllMedia(){
  var mem=getMemData();
  var photos=(mem.photos||[]).filter(function(p){return p.approved!==false;});
  var guest=(mem.guestUploads||[]).filter(function(u){return u.approved===true;});
  return photos.concat(guest);
}

function getFilteredMedia(){
  var all=getAllMedia();
  if(currentAlbum!=='all')all=all.filter(function(m){return m.album===currentAlbum;});
  if(currentType==='photos')all=all.filter(function(m){return !isVideo(m.url);});
  else if(currentType==='videos')all=all.filter(function(m){return isVideo(m.url);});
  var search=document.getElementById('memSearch');
  if(search&&search.value.trim()){
    var q=search.value.trim().toLowerCase();
    all=all.filter(function(m){return((m.title||'')+(m.description||'')+(m.album||'')).toLowerCase().indexOf(q)!==-1;});
  }
  return all;
}

function renderGrid(){
  var grid=document.getElementById('memGrid');
  if(!grid)return;
  var items=getFilteredMedia();
  if(!items.length){
    grid.innerHTML='<div class="mem-empty"><i class="fas fa-images"></i><h3>No memories yet</h3><p>Upload photos and videos to start building your wedding memories.</p></div>';
    return;
  }
  grid.innerHTML=items.map(function(m,i){
    var vid=isVideo(m.url);
    var thumb=vid?(isYouTube(m.url)?ytThumb(m.url):m.url):m.url;
    var isGuest=m.guestUpload;
    return '<div class="mem-item" data-id="'+m.id+'" onclick="MemApp.openLightbox(\''+m.id+'\')">'+
      (vid?'<video src="'+esc(m.url)+'" muted loop preload="metadata" onmouseenter="this.play()" onmouseleave="this.pause();this.currentTime=0" style="width:100%;display:block"></video>':'<img src="'+esc(m.url)+'" alt="'+esc(m.title||'Memory')+'" loading="lazy">')+
      (vid?'<div class="mem-video-badge"><i class="fas fa-play"></i> Video</div>':'')+
      '<div class="mem-overlay">'+
        '<div class="mem-actions">'+
          '<button onclick="event.stopPropagation();MemApp.shareMedia(\''+m.id+'\')" title="Share"><i class="fas fa-share-nodes"></i></button>'+
          (getData().websiteSettings&&getData().websiteSettings.allowDownloads!==false?'<button onclick="event.stopPropagation();MemApp.downloadMedia(\''+m.id+'\')" title="Download"><i class="fas fa-download"></i></button>':'')+
        '</div>'+
        '<div class="mem-title">'+esc(m.title||'Untitled')+'</div>'+
        '<div class="mem-meta">'+esc(ALBUMS.find(function(a){return a.id===m.album;})?.label||m.album||'')+(m.uploadDate?' · '+fmtDate(m.uploadDate):'')+(isGuest?' · Guest Upload':'')+'</div>'+
      '</div></div>';
  }).join('');
  createSparkles();
}

function renderAlbumTabs(){
  var container=document.getElementById('memAlbums');
  if(!container)return;
  var all=getAllMedia();
  container.innerHTML=ALBUMS.map(function(a){
    var count=a.id==='all'?all.length:all.filter(function(m){return m.album===a.id;}).length;
    return '<button class="mem-album-tab'+(a.id===currentAlbum?' active':'')+'" data-album="'+a.id+'" onclick="MemApp.setAlbum(\''+a.id+'\')" aria-label="'+a.label+'"><i class="fas '+a.icon+'"></i> '+a.label+'<span class="mem-album-count">'+count+'</span></button>';
  }).join('');
}

function renderStats(){
  var all=getAllMedia();
  var photos=all.filter(function(m){return !isVideo(m.url);});
  var videos=all.filter(function(m){return isVideo(m.url);});
  var el=document.getElementById('memStats');
  if(el)el.innerHTML='<span style="color:var(--text-light);font-size:0.85rem">'+photos.length+' photos · '+videos.length+' videos</span>';
}

function setAlbum(id){
  currentAlbum=id;
  document.querySelectorAll('.mem-album-tab').forEach(function(b){b.classList.toggle('active',b.dataset.album===id);});
  renderGrid();
}

function setType(type){
  currentType=type;
  document.querySelectorAll('.mem-type-btn').forEach(function(b){b.classList.toggle('active',b.dataset.type===type);});
  renderGrid();
}

// ===== LIGHTBOX =====
function openLightbox(id){
  lightboxItems=getFilteredMedia();
  lightboxIndex=lightboxItems.findIndex(function(m){return m.id===id;});
  if(lightboxIndex===-1)lightboxIndex=0;
  showLightbox();
}

function showLightbox(){
  var lb=document.getElementById('memLightbox');
  if(!lb||!lightboxItems.length)return;
  var m=lightboxItems[lightboxIndex];
  var vid=isVideo(m.url);
  var content=lb.querySelector('.mem-lb-content');
  if(vid){
    if(isYouTube(m.url)){
      content.innerHTML='<iframe src="'+m.url.replace('watch?v=','embed/')+'" style="width:80vw;max-width:900px;aspect-ratio:16/9;border:none;border-radius:8px" allowfullscreen></iframe>';
    }else if(isVimeo(m.url)){
      content.innerHTML='<iframe src="'+m.url.replace('vimeo.com','player.vimeo.com/video')+'" style="width:80vw;max-width:900px;aspect-ratio:16/9;border:none;border-radius:8px" allowfullscreen></iframe>';
    }else{
      content.innerHTML='<video src="'+esc(m.url)+'" controls autoplay style="max-width:80vw;max-height:80vh;border-radius:8px"></video>';
    }
  }else{
    content.innerHTML='<img src="'+esc(m.url)+'" alt="'+esc(m.title||'Memory')+'" style="max-width:80vw;max-height:80vh;object-fit:contain;border-radius:8px">';
  }
  var title=lb.querySelector('.lb-title');
  if(title)title.textContent=m.title||'';
  var counter=lb.querySelector('.lb-counter');
  if(counter)counter.textContent=(lightboxIndex+1)+' / '+lightboxItems.length;
  lb.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeLightbox(){
  var lb=document.getElementById('memLightbox');
  if(lb)lb.classList.remove('open');
  document.body.style.overflow='';
  stopSlideshow();
}

function navLightbox(dir){
  lightboxIndex+=dir;
  if(lightboxIndex<0)lightboxIndex=lightboxItems.length-1;
  if(lightboxIndex>=lightboxItems.length)lightboxIndex=0;
  showLightbox();
}

function toggleSlideshow(){
  isSlideshow=!isSlideshow;
  var btn=document.getElementById('slideshowBtn');
  if(btn)btn.classList.toggle('active',isSlideshow);
  if(isSlideshow){
    slideshowTimer=setInterval(function(){navLightbox(1);},3000);
  }else{
    clearInterval(slideshowTimer);
  }
}

function stopSlideshow(){
  isSlideshow=false;
  clearInterval(slideshowTimer);
  var btn=document.getElementById('slideshowBtn');
  if(btn)btn.classList.remove('active');
}

// ===== SHARING =====
function shareMedia(id){
  var all=getAllMedia();
  var m=all.find(function(x){return x.id===id;});
  if(!m)return;
  window._shareItem=m;
  var modal=document.getElementById('memShareModal');
  if(modal)modal.classList.add('open');
}

function closeShare(){
  var modal=document.getElementById('memShareModal');
  if(modal)modal.classList.remove('open');
}

function shareWhatsApp(){
  var m=window._shareItem;if(!m)return;
  var msg='Check out this wedding memory: '+esc(m.title||'Beautiful moment')+'\n'+m.url;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
}

function shareFB(){
  var m=window._shareItem;if(!m)return;
  window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(m.url),'_blank');
}

function shareTW(){
  var m=window._shareItem;if(!m)return;
  window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(esc(m.title||'Wedding memory'))+'&url='+encodeURIComponent(m.url),'_blank');
}

function shareEmail(){
  var m=window._shareItem;if(!m)return;
  window.location.href='mailto:?subject='+encodeURIComponent('Wedding Memory: '+esc(m.title||''))+'&body='+encodeURIComponent(m.url);
}

function copyLink(){
  var m=window._shareItem;if(!m)return;
  if(navigator.clipboard){navigator.clipboard.writeText(m.url);}
  else{var ta=document.createElement('textarea');ta.value=m.url;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}
  notify('Link copied!','success');closeShare();
}

function downloadMedia(id){
  var all=getAllMedia();
  var m=all.find(function(x){return x.id===id;});
  if(!m||!m.url)return;
  var a=document.createElement('a');
  a.href=m.url;
  a.download=(m.title||'wedding-memory')+(isVideo(m.url)?'.mp4':'.jpg');
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  notify('Download started!','success');
}

// ===== GUEST UPLOADS =====
function handleGuestUpload(files){
  if(!files||!files.length)return;
  var mem=getMemData();
  if(!mem.guestUploads)mem.guestUploads=[];
  var loaded=0;var total=files.length;
  var maxSize=50*1024*1024;
  Array.from(files).forEach(function(file){
    if(file.size>maxSize){
      notify('File too large: '+file.name+' (max 50MB)','error');
      loaded++;return;
    }
    var reader=new FileReader();
    reader.onload=function(ev){
      mem.guestUploads.push({
        id:genId(),url:ev.target.result,title:file.name.replace(/\.[^.]+$/,''),
        album:'family',uploadDate:Date.now(),approved:false,guestUpload:true,
        fileType:file.type,size:file.size
      });
      loaded++;
      if(loaded===total){
        saveMemData(mem);notify(total+' file(s) uploaded! Awaiting approval.','success');
        renderGrid();renderAlbumTabs();renderGuestUploads();
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderGuestUploads(){
  var mem=getMemData();
  var uploads=mem.guestUploads||[];
  var list=document.getElementById('memUploadList');
  if(!list)return;
  if(!uploads.length){list.innerHTML='';return;}
  list.innerHTML=uploads.map(function(u){
    var statusCls=u.approved===true?'approved':u.approved===false?'rejected':'pending';
    var statusText=u.approved===true?'Approved':u.approved===false?'Rejected':'Pending';
    return '<div class="mem-upload-item">'+
      '<div class="thumb">'+(isVideo(u.url)?'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(212,175,55,0.1)"><i class="fas fa-play" style="color:var(--gold)"></i></div>':'<img src="'+esc(u.url)+'" alt="'+esc(u.title)+'">')+'</div>'+
      '<div class="info"><div class="name">'+esc(u.title)+'</div><div class="size">'+fmtSize(u.size||0)+' · '+fmtDate(u.uploadDate)+'</div></div>'+
      '<span class="status '+statusCls+'">'+statusText+'</span>'+
      '<button class="remove" onclick="MemApp.removeGuestUpload(\''+u.id+'\')" title="Remove"><i class="fas fa-times"></i></button>'+
    '</div>';
  }).join('');
}

function removeGuestUpload(id){
  var mem=getMemData();
  mem.guestUploads=(mem.guestUploads||[]).filter(function(u){return u.id!==id;});
  saveMemData(mem);renderGuestUploads();renderGrid();renderAlbumTabs();notify('Upload removed','info');
}

// ===== FEATURED VIDEO =====
function renderFeatured(){
  var mem=getMemData();
  var fv=mem.featuredVideo||{};
  var card=document.getElementById('memFeatured');
  if(!card)return;
  if(!fv.url){
    card.style.display='none';return;
  }
  card.style.display='block';
  var thumb=fv.thumbnailUrl||(isYouTube(fv.url)?ytThumb(fv.url):'');
  var thumbEl=card.querySelector('.mem-featured-thumb');
  if(thumbEl&&thumb){
    thumbEl.style.backgroundImage='url('+thumb+')';
    thumbEl.style.backgroundSize='cover';
    thumbEl.style.backgroundPosition='center';
  }
  var title=card.querySelector('h2');
  if(title)title.textContent=fv.title||'Our Wedding Film';
  var desc=card.querySelector('p');
  if(desc)desc.textContent=fv.desc||'Watch our special day highlights';
}

// ===== SPARKLES =====
function createSparkles(){
  var c=document.querySelector('.mem-sparkles');
  if(!c||c.children.length>20)return;
  for(var i=0;i<20;i++){
    var s=document.createElement('div');
    s.className='mem-sparkle';
    s.style.left=Math.random()*100+'%';
    s.style.top=Math.random()*100+'%';
    s.style.animationDelay=Math.random()*5+'s';
    s.style.animationDuration=(2+Math.random()*4)+'s';
    c.appendChild(s);
  }
}

function notify(msg,type){
  var existing=document.querySelector('.mem-toast');
  if(existing)existing.remove();
  var t=document.createElement('div');
  t.className='mem-toast';
  t.style.cssText='position:fixed;top:24px;right:24px;z-index:100001;padding:14px 20px;border-radius:12px;background:rgba(11,15,25,0.95);border:1px solid rgba(212,175,55,0.15);backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;align-items:center;gap:10px;font-size:0.88rem;color:var(--text);transform:translateX(120%);opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
  var icons={success:'fa-check-circle',error:'fa-times-circle',info:'fa-info-circle'};
  var colors={success:'rgba(34,197,94,0.1)',error:'rgba(239,68,68,0.1)',info:'rgba(59,130,246,0.1)'};
  var iconColors={success:'#22c55e',error:'#ef4444',info:'#3b82f6'};
  t.innerHTML='<div style="width:28px;height:28px;border-radius:50%;background:'+colors[type]+';display:flex;align-items:center;justify-content:center"><i class="fas '+(icons[type]||icons.info)+'" style="color:'+(iconColors[type]||iconColors.info)+'"></i></div><span>'+msg+'</span>';
  document.body.appendChild(t);
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.style.transform='translateX(0)';t.style.opacity='1';});});
  setTimeout(function(){t.style.transform='translateX(120%)';t.style.opacity='0';setTimeout(function(){if(t.parentElement)t.remove();},400);},3000);
}

// ===== KEYBOARD =====
document.addEventListener('keydown',function(e){
  var lb=document.getElementById('memLightbox');
  if(!lb||!lb.classList.contains('open'))return;
  if(e.key==='Escape')closeLightbox();
  if(e.key==='ArrowLeft')navLightbox(-1);
  if(e.key==='ArrowRight')navLightbox(1);
  if(e.key===' '){e.preventDefault();toggleSlideshow();}
});

// ===== TOUCH =====
var touchStartX=0;
document.addEventListener('touchstart',function(e){
  var lb=document.getElementById('memLightbox');
  if(!lb||!lb.classList.contains('open'))return;
  touchStartX=e.touches[0].clientX;
});
document.addEventListener('touchend',function(e){
  var lb=document.getElementById('memLightbox');
  if(!lb||!lb.classList.contains('open'))return;
  var diff=e.changedTouches[0].clientX-touchStartX;
  if(Math.abs(diff)>60){navLightbox(diff>0?-1:1);}
});

var M={
  init:function(){
    renderAlbumTabs();
    renderGrid();
    renderStats();
    renderFeatured();
    renderGuestUploads();
    createSparkles();
    setupDropzone();
  },
  setAlbum:setAlbum,
  setType:setType,
  openLightbox:openLightbox,
  closeLightbox:closeLightbox,
  navLightbox:navLightbox,
  toggleSlideshow:toggleSlideshow,
  shareMedia:shareMedia,
  closeShare:closeShare,
  shareWhatsApp:shareWhatsApp,
  shareFB:shareFB,
  shareTW:shareTW,
  shareEmail:shareEmail,
  copyLink:copyLink,
  downloadMedia:downloadMedia,
  handleGuestUpload:handleGuestUpload,
  removeGuestUpload:removeGuestUpload
};
window.MemApp=M;

function setupDropzone(){
  var dz=document.getElementById('memDropzone');
  var inp=document.getElementById('memUploadInput');
  if(!dz||!inp)return;
  dz.addEventListener('dragover',function(e){e.preventDefault();dz.classList.add('dragover');});
  dz.addEventListener('dragleave',function(){dz.classList.remove('dragover');});
  dz.addEventListener('drop',function(e){e.preventDefault();dz.classList.remove('dragover');handleGuestUpload(e.dataTransfer.files);});
  inp.addEventListener('change',function(e){handleGuestUpload(e.target.files);e.target.value='';});
}

document.addEventListener('DOMContentLoaded',function(){
  if(document.querySelector('.mem-page'))M.init();
});

})();
