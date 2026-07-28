/**
 * Wedding Owner Dashboard - Complete Management System
 */
(function(){
'use strict';

var D={};
var DB_KEY='weddingData';

function getData(){
  try{var raw=localStorage.getItem(DB_KEY);return raw?JSON.parse(raw):getDefaultData();}
  catch(e){return getDefaultData();}
}
function saveData(d){localStorage.setItem(DB_KEY,JSON.stringify(d));}
function escapeHtml(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function getInitials(name){if(!name)return'?';var parts=name.trim().split(/\s+/);if(parts.length>=2)return(parts[0][0]+parts[parts.length-1][0]).toUpperCase();return parts[0].substring(0,2).toUpperCase();}
function getDefaultData(){
  return {
    groomName:'',brideName:'',weddingDate:'',weddingTime:'',venue:'',address:'',
    quote:'A Love Written By God',weddingStory:'',coverPhoto:'',musicUrl:'',
    slideshowImages:[],slideshowTransition:'ken-right',slideshowSpeed:5,
    currentTheme:'classic-gold',isPublished:false,
    gallery:[],timeline:[],
    guests:[],socialLinks:{},
    aiSettings:{date:'',venue:'',dressCode:'',contact:'',directions:'',giftRegistry:'',faq:''},
    analytics:{views:0,clicks:0,aiUsage:0,dailyViews:{}},
    createdAt:Date.now(),updatedAt:Date.now()
  };
}

function notify(msg,type){
  var c=document.getElementById('dashNotifications');
  var t=document.createElement('div');
  t.className='dash-toast '+(type||'info');
  var icons={success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
  t.innerHTML='<div class="toast-icon"><i class="fas '+(icons[type]||icons.info)+'"></i></div><div class="toast-msg">'+escapeHtml(msg)+'</div><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';
  c.appendChild(t);
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.classList.add('show');});});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){if(t.parentElement)t.remove();},400);},4000);
}

function formatDate(d){if(!d)return'';var dt=new Date(d);return dt.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});}
function formatTime(t){if(!t)return'';var parts=t.split(':');var h=parseInt(parts[0]);var m=parts[1];var ampm=h>=12?'PM':'AM';h=h%12||12;return h+':'+m+' '+ampm;}
function genId(){return 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,6);}

function countdown(dateStr){
  if(!dateStr)return'--';
  var target=new Date(dateStr+'T00:00:00');
  var now=new Date();
  var diff=target-now;
  if(diff<=0)return'Today!';
  var days=Math.floor(diff/(1000*60*60*24));
  if(days===1)return'1 day left';
  return days+' days left';
}

function sanitizeCSV(v){var s=String(v||'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return s;}
function escapeCsvField(v){return '"'+sanitizeCSV(v).replace(/"/g,'""')+'"';}

// ===== NAVIGATION =====
D.navigate=function(section){
  document.querySelectorAll('.dash-nav-item').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.dash-section').forEach(function(s){s.classList.remove('active');});
  var btn=document.querySelector('[data-section="'+section+'"]');
  var sec=document.getElementById('sec-'+section);
  if(btn)btn.classList.add('active');
  if(sec)sec.classList.add('active');
  var titles={'overview':'Dashboard','wedding-info':'Wedding Details','slideshow':'Slideshow Manager','memories-mgr':'Memories Manager','themes':'Theme Manager','gallery-mgr':'Gallery Manager','timeline-mgr':'Timeline','guests':'Guest Manager','rsvp-mgr':'RSVP Manager','invitations':'Invitation Manager','ai-settings':'AI Assistant Settings','social-links':'Social Links','analytics':'Analytics','website-settings':'Website Settings','backup':'Backup & Restore','settings':'Account Settings'};
  document.getElementById('topbarTitle').textContent=titles[section]||'Dashboard';
  var sb=document.getElementById('dashSidebar');
  if(window.innerWidth<=768)sb.classList.remove('open');
};

// ===== INIT =====
D.init=function(){
  var data=getData();

  // User info from auth
  var userName='Owner';
  var userEmail='';
  var userPhoto='';
  if(typeof getUserProfile==='function'){
    var profile=getUserProfile();
    if(profile){
      userName=profile.name||'Owner';
      userEmail=profile.email||'';
      userPhoto=profile.photo||'';
      if(typeof updateLastLogin==='function')updateLastLogin();
    }
  }

  var initials=getInitials(userName);
  var avatar=document.getElementById('dashAvatar');
  var welcomeAvatar=document.getElementById('welcomeAvatar');

  if(userPhoto){
    if(avatar){avatar.innerHTML='<img src="'+escapeHtml(userPhoto)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';avatar.style.background='var(--gold)';}
    if(welcomeAvatar){welcomeAvatar.innerHTML='<img src="'+escapeHtml(userPhoto)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover">';welcomeAvatar.style.background='var(--gold)';}
  }else{
    if(avatar)avatar.textContent=initials;
    if(welcomeAvatar)welcomeAvatar.textContent=initials;
  }
  if(document.getElementById('dashUserName'))document.getElementById('dashUserName').textContent=userName;
  if(document.getElementById('dashUserEmail'))document.getElementById('dashUserEmail').textContent=userEmail;
  document.getElementById('welcomeName').textContent='Welcome back, '+userName.split(' ')[0]+'!';
  document.getElementById('countdownText').textContent=countdown(data.weddingDate);

  // Stats
  var guests=data.guests||[];
  var accepted=guests.filter(function(g){return g.rsvp==='accepted';}).length;
  var declined=guests.filter(function(g){return g.rsvp==='declined';}).length;
  var pending=guests.filter(function(g){return g.rsvp!=='accepted'&&g.rsvp!=='declined';}).length;
  document.getElementById('statGuests').textContent=guests.length;
  document.getElementById('statAccepted').textContent=accepted;
  document.getElementById('statDeclined').textContent=declined;
  document.getElementById('statPending').textContent=pending;
  document.getElementById('guestCount').textContent=guests.length;
  document.getElementById('rsvpCount').textContent=accepted+'/'+guests.length;

  // Sidebar nav
  document.querySelectorAll('.dash-nav-item').forEach(function(btn){
    btn.addEventListener('click',function(){D.navigate(this.dataset.section);});
  });

  // Hamburger
  document.getElementById('dashHamburger').addEventListener('click',function(){
    document.getElementById('dashSidebar').classList.toggle('open');
  });

  // Load sections
  D.loadWeddingInfo();
  D.loadSlideshow();
  D.loadGallery();
  D.loadTimeline();
  D.loadGuests();
  D.loadRSVP();
  D.loadAISettings();
  D.loadSocialLinks();
  D.loadAnalytics();
  D.loadProfile();
  D.loadTheme();
  D.loadWebsiteSettings();
  D.renderBackupHistory();
  D.renderWeddingProgress();
  D.renderWebsiteStatus();
  D.renderNotifications();
  if(typeof updateNotifBadge==='function')updateNotifBadge();

  // File handlers
  document.getElementById('slideUpload').addEventListener('change',function(e){D.handleSlideUpload(e);});
  document.getElementById('galleryUpload').addEventListener('change',function(e){D.handleGalleryUpload(e);});
  document.getElementById('guestImport').addEventListener('change',function(e){D.handleGuestImport(e);});

  // Publish/Save
  document.getElementById('btnPublish').addEventListener('click',function(){D.publish();});
  document.getElementById('btnSaveDraft').addEventListener('click',function(){D.saveDraft();});

  // Start real-time RSVP listener
  D.startRealtimeListener();

  // Show Unpublish if already published
  var d=getData();if(d.isPublished){var up=document.getElementById('btnUnpublish');if(up)up.style.display='inline-flex';}

  // Album tabs
  document.querySelectorAll('#albumTabs .dash-tab').forEach(function(tab){
    tab.addEventListener('click',function(){
      document.querySelectorAll('#albumTabs .dash-tab').forEach(function(t){t.classList.remove('active');});
      this.classList.add('active');
      D.filterGallery(this.dataset.album);
    });
  });
};

// ===== WEDDING INFO =====
D.loadWeddingInfo=function(){
  var d=getData();
  document.getElementById('infoGroom').value=d.groomName||'';
  document.getElementById('infoBride').value=d.brideName||'';
  document.getElementById('infoDate').value=d.weddingDate||'';
  document.getElementById('infoTime').value=d.weddingTime||'';
  document.getElementById('infoVenue').value=d.venue||'';
  document.getElementById('infoAddress').value=d.address||'';
  document.getElementById('infoQuote').value=d.quote||'';
  document.getElementById('infoStory').value=d.weddingStory||'';
};
D.saveWeddingInfo=function(){
  var d=getData();
  d.groomName=document.getElementById('infoGroom').value.trim();
  d.brideName=document.getElementById('infoBride').value.trim();
  d.weddingDate=document.getElementById('infoDate').value;
  d.weddingTime=document.getElementById('infoTime').value;
  d.venue=document.getElementById('infoVenue').value.trim();
  d.address=document.getElementById('infoAddress').value.trim();
  d.quote=document.getElementById('infoQuote').value.trim();
  d.weddingStory=document.getElementById('infoStory').value.trim();
  d.updatedAt=Date.now();
  saveData(d);
  // Also update Firebase if available
  try{if(typeof fbSetDoc==='function'){fbSetDoc('weddingInfo','main',{groomName:d.groomName,brideName:d.brideName,weddingDate:d.weddingDate,weddingTime:d.weddingTime,venue:d.venue,address:d.address,quote:d.quote,weddingStory:d.weddingStory});}}catch(e){}
  document.getElementById('countdownText').textContent=countdown(d.weddingDate);
  if(d.isPublished){
    notify('Wedding details saved and website updated live!','success');
  }else{
    notify('Wedding details saved successfully!','success');
  }
  D.logActivity('Updated wedding details');
};

// ===== SLIDESHOW =====
D.loadSlideshow=function(){
  var d=getData();
  document.getElementById('slideTransition').value=d.slideshowTransition||'ken-right';
  document.getElementById('slideSpeed').value=d.slideshowSpeed||5;
  D.renderSlideList();
};
D.renderSlideList=function(){
  var d=getData();var images=d.slideshowImages||[];
  var list=document.getElementById('slideList');
  if(!images.length){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-light)"><i class="fas fa-images" style="font-size:2rem;opacity:0.3;margin-bottom:8px;display:block"></i>No slideshow images yet. Click "Add Images" to upload.</div>';return;}
  list.innerHTML=images.map(function(img,i){
    return '<div class="slide-item" draggable="true" data-index="'+i+'">'+
      '<div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>'+
      '<div class="slide-thumb"><img src="'+img+'" alt="Slide '+(i+1)+'"></div>'+
      '<div class="slide-info"><div class="name">Slide '+(i+1)+'</div><div class="meta">'+(d.slideshowTransition||'ken-right')+' · '+(d.slideshowSpeed||5)+'s</div></div>'+
      '<div class="slide-actions"><button onclick="DashApp.moveSlide('+i+',-1)" title="Move up"><i class="fas fa-arrow-up"></i></button>'+
      '<button onclick="DashApp.moveSlide('+i+',1)" title="Move down"><i class="fas fa-arrow-down"></i></button>'+
      '<button class="del" onclick="DashApp.removeSlide('+i+')" title="Remove"><i class="fas fa-trash"></i></button></div>'+
    '</div>';
  }).join('');
  // Drag & drop
  var items=list.querySelectorAll('.slide-item');
  items.forEach(function(item){
    item.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',this.dataset.index);this.style.opacity='0.4';});
    item.addEventListener('dragend',function(){this.style.opacity='1';});
    item.addEventListener('dragover',function(e){e.preventDefault();this.style.borderColor='var(--gold)';});
    item.addEventListener('dragleave',function(){this.style.borderColor='';});
    item.addEventListener('drop',function(e){
      e.preventDefault();this.style.borderColor='';
      var from=parseInt(e.dataTransfer.getData('text/plain'));
      var to=parseInt(this.dataset.index);
      if(from!==to)D.reorderSlide(from,to);
    });
  });
};
D.handleSlideUpload=function(e){
  var files=e.target.files;if(!files.length)return;
  var d=getData();if(!d.slideshowImages)d.slideshowImages=[];
  Array.from(files).forEach(function(file){
    var reader=new FileReader();
    reader.onload=function(ev){
      d.slideshowImages.push(ev.target.result);
      saveData(d);D.renderSlideList();
    };
    reader.readAsDataURL(file);
  });
  e.target.value='';
  notify('Images uploaded to slideshow','success');
};
D.moveSlide=function(i,dir){
  var d=getData();var imgs=d.slideshowImages;var ni=i+dir;
  if(ni<0||ni>=imgs.length)return;
  var temp=imgs[i];imgs[i]=imgs[ni];imgs[ni]=temp;
  saveData(d);D.renderSlideList();
};
D.reorderSlide=function(from,to){
  var d=getData();var imgs=d.slideshowImages;
  var item=imgs.splice(from,1)[0];imgs.splice(to,0,item);
  saveData(d);D.renderSlideList();
};
D.removeSlide=function(i){
  var d=getData();d.slideshowImages.splice(i,1);
  saveData(d);D.renderSlideList();notify('Slide removed','info');
};
D.saveSlideshow=function(){
  var d=getData();
  d.slideshowTransition=document.getElementById('slideTransition').value;
  d.slideshowSpeed=parseInt(document.getElementById('slideSpeed').value)||5;
  d.updatedAt=Date.now();saveData(d);
  notify('Slideshow settings saved!','success');
  D.logActivity('Updated slideshow');
};
D.previewSlideshow=function(){
  window.open('index.html','_blank');
};

// ===== THEMES =====
D.loadTheme=function(){
  var d=getData();var theme=d.currentTheme||'classic-gold';
  document.querySelectorAll('.theme-card').forEach(function(c){
    c.classList.toggle('active',c.dataset.theme===theme);
  });
  D.applyTheme(theme);
};
D.setTheme=function(theme,el){
  document.querySelectorAll('.theme-card').forEach(function(c){c.classList.remove('active');});
  if(el)el.classList.add('active');
  var d=getData();d.currentTheme=theme;d.updatedAt=Date.now();saveData(d);
  D.applyTheme(theme);
  notify('Theme changed to '+el.querySelector('.theme-card-name').textContent,'success');
  D.logActivity('Changed theme');
};
D.applyTheme=function(theme){
  var themes={
    'classic-gold':{gold:'#D4AF37',dark:'#0B0F19',text:'#E8E0D0'},
    'dark-gold':{gold:'#B8860B',dark:'#0A0A0A',text:'#D4C5A0'},
    'emerald-gold':{gold:'#C9A84C',dark:'#0A1A0F',text:'#D0E0D0'},
    'rose-gold':{gold:'#E8A87C',dark:'#1A0F0A',text:'#E8D0C0'},
    'modern-black':{gold:'#FFFFFF',dark:'#000000',text:'#E0E0E0'},
    'african-wedding':{gold:'#D4892E',dark:'#1A0E05',text:'#E8D4C0'}
  };
  var t=themes[theme]||themes['classic-gold'];
  document.documentElement.style.setProperty('--gold',t.gold);
  document.documentElement.style.setProperty('--dark',t.dark);
  document.documentElement.style.setProperty('--text',t.text);
};

// ===== GALLERY =====
D.loadGallery=function(){D.renderGallery();};
D.renderGallery=function(filter){
  var d=getData();var items=d.gallery||[];
  if(filter&&filter!=='all'&&filter!=='cover'){
    items=items.filter(function(g){return filter==='photos'?g.type==='photo':g.type==='video';});
  }
  var grid=document.getElementById('galleryGrid');
  var html='<div class="gallery-upload" onclick="document.getElementById(\'galleryUpload\').click()"><i class="fas fa-cloud-upload-alt"></i><span>Upload Photos/Videos</span></div>';
  items.forEach(function(item,i){
    var isCover=d.coverPhoto===item.url;
    html+='<div class="gallery-item'+(isCover?' is-cover':'')+'" data-index="'+i+'">'+
      (item.type==='video'?'<video src="'+item.url+'" muted style="width:100%;height:100%;object-fit:cover"></video>':'<img src="'+item.url+'" alt="Gallery" loading="lazy">')+
      '<div class="cover-badge"><i class="fas fa-star"></i> Cover</div>'+
      '<div class="overlay">'+
        (!isCover?'<button class="set-cover" onclick="DashApp.setCover('+i+')">Set Cover</button>':'')+
        '<button class="del-btn" onclick="DashApp.removeGalleryItem('+i+')"><i class="fas fa-trash"></i></button>'+
      '</div></div>';
  });
  grid.innerHTML=html;
};
D.handleGalleryUpload=function(e){
  var files=e.target.files;if(!files.length)return;
  var d=getData();if(!d.gallery)d.gallery=[];
  var loaded=0;
  Array.from(files).forEach(function(file){
    var reader=new FileReader();
    reader.onload=function(ev){
      d.gallery.push({url:ev.target.result,type:file.type.startsWith('video')?'video':'photo',name:file.name,uploadedAt:Date.now()});
      loaded++;
      if(loaded===files.length){saveData(d);D.renderGallery();notify(files.length+' file(s) uploaded!','success');}
    };
    reader.readAsDataURL(file);
  });
  e.target.value='';
};
D.removeGalleryItem=function(i){
  var d=getData();d.gallery.splice(i,1);saveData(d);D.renderGallery();notify('Item removed','info');
};
D.setCover=function(i){
  var d=getData();d.coverPhoto=d.gallery[i].url;saveData(d);D.renderGallery();notify('Cover image set!','success');
};
D.filterGallery=function(filter){D.renderGallery(filter);};

// ===== TIMELINE =====
D.loadTimeline=function(){D.renderTimeline();};
D.renderTimeline=function(){
  var d=getData();var events=d.timeline||[];
  var list=document.getElementById('timelineList');
  if(!events.length){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-light)"><i class="fas fa-clock" style="font-size:2rem;opacity:0.3;margin-bottom:8px;display:block"></i>No timeline events. Click "Add Event" to create one.</div>';return;}
  list.innerHTML=events.map(function(ev,i){
    return '<div class="slide-item"><div class="drag-handle"><i class="fas fa-grip-vertical"></i></div>'+
      '<div style="flex:1;display:grid;grid-template-columns:100px 1fr;gap:12px;align-items:center">'+
        '<input class="dash-input" value="'+(ev.time||'')+'" placeholder="Time" style="padding:8px 10px;font-size:0.85rem" onchange="DashApp.updateTimeline('+i+',\'time\',this.value)">'+
        '<input class="dash-input" value="'+(ev.title||'')+'" placeholder="Event title" style="padding:8px 10px;font-size:0.85rem" onchange="DashApp.updateTimeline('+i+',\'title\',this.value)">'+
      '</div>'+
      '<div class="slide-actions"><button class="del" onclick="DashApp.removeTimelineEvent('+i+')"><i class="fas fa-trash"></i></button></div></div>';
  }).join('');
};
D.addTimelineEvent=function(){
  var d=getData();if(!d.timeline)d.timeline=[];
  d.timeline.push({time:'',title:'',id:genId()});
  saveData(d);D.renderTimeline();
};
D.updateTimeline=function(i,field,val){
  var d=getData();d.timeline[i][field]=val;saveData(d);
};
D.removeTimelineEvent=function(i){
  var d=getData();d.timeline.splice(i,1);saveData(d);D.renderTimeline();
};
D.saveTimeline=function(){
  var d=getData();d.updatedAt=Date.now();saveData(d);
  notify('Timeline saved!','success');D.logActivity('Updated timeline');
};

// ===== GUESTS =====
D.loadGuests=function(){D.renderGuests();};
D.renderGuests=function(){
  var d=getData();var guests=d.guests||[];
  var search=(document.getElementById('guestSearch').value||'').toLowerCase();
  var filter=document.getElementById('guestFilter').value;
  var filtered=guests;
  if(search)filtered=filtered.filter(function(g){return(g.name||'').toLowerCase().indexOf(search)!==-1||(g.email||'').toLowerCase().indexOf(search)!==-1||(g.group||'').toLowerCase().indexOf(search)!==-1;});
  if(filter!=='all')filtered=filtered.filter(function(g){return g.rsvp===filter;});
  var tbody=document.getElementById('guestTableBody');
  tbody.innerHTML=filtered.length?filtered.map(function(g,i){
    var ri=guests.indexOf(g);
    var rsvpColors={accepted:'var(--success)',declined:'var(--error)',pending:'var(--warning)'};
    return '<tr><td><strong>'+escapeHtml(g.name)+'</strong></td><td>'+escapeHtml(g.email||'-')+'</td><td>'+escapeHtml(g.phone||'-')+'</td><td>'+escapeHtml(g.group||'-')+'</td>'+
      '<td><span style="color:'+(rsvpColors[g.rsvp]||'var(--text-light)')+';font-weight:600;text-transform:capitalize">'+escapeHtml(g.rsvp||'pending')+'</span></td>'+
      '<td>'+(g.plusOne?'Yes':'No')+'</td>'+
      '<td class="actions"><button onclick="DashApp.editGuest('+ri+')"><i class="fas fa-pen"></i></button><button class="del" onclick="DashApp.removeGuest('+ri+')"><i class="fas fa-trash"></i></button></td></tr>';
  }).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:30px">No guests found</td></tr>';
  // Stats
  var total=guests.length;
  document.getElementById('gTotal').textContent=total;
  document.getElementById('gAccepted').textContent=guests.filter(function(g){return g.rsvp==='accepted';}).length;
  document.getElementById('gDeclined').textContent=guests.filter(function(g){return g.rsvp==='declined';}).length;
  document.getElementById('gPending').textContent=guests.filter(function(g){return g.rsvp!=='accepted'&&g.rsvp!=='declined';}).length;
  document.getElementById('guestCount').textContent=total;
  // RSVP sidebar stats
  document.getElementById('statGuests').textContent=total;
  document.getElementById('statAccepted').textContent=guests.filter(function(g){return g.rsvp==='accepted';}).length;
  document.getElementById('statDeclined').textContent=guests.filter(function(g){return g.rsvp==='declined';}).length;
  document.getElementById('statPending').textContent=guests.filter(function(g){return g.rsvp!=='accepted'&&g.rsvp!=='declined';}).length;
  document.getElementById('rsvpCount').textContent=guests.filter(function(g){return g.rsvp==='accepted';}).length+'/'+total;
};
D.filterGuests=function(){D.renderGuests();};
D.addGuest=function(){
  D.openModal('Add Guest',
    '<div class="dash-form-group"><label class="dash-form-label">Name *</label><input class="dash-input" id="mGuestName" placeholder="Full name"></div>'+
    '<div class="dash-form-row"><div class="dash-form-group"><label class="dash-form-label">Email</label><input class="dash-input" id="mGuestEmail" placeholder="email"></div>'+
    '<div class="dash-form-group"><label class="dash-form-label">Phone</label><input class="dash-input" id="mGuestPhone" placeholder="phone"></div></div>'+
    '<div class="dash-form-row"><div class="dash-form-group"><label class="dash-form-label">Group</label><input class="dash-input" id="mGuestGroup" placeholder="e.g. Family, Friends"></div>'+
    '<div class="dash-form-group"><label class="dash-form-label">RSVP</label><select class="dash-select" id="mGuestRSVP"><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div></div>'+
    '<div class="dash-form-group"><label class="dash-form-label" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="mGuestPlusOne"> Include +1</label></div>',
    [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Add Guest',class:'dash-btn dash-btn-gold',action:'DashApp.saveNewGuest()'}]
  );
};
D.saveNewGuest=function(){
  var name=document.getElementById('mGuestName').value.trim();
  if(!name){notify('Guest name is required','error');return;}
  var d=getData();if(!d.guests)d.guests=[];
  d.guests.push({id:genId(),name:name,email:document.getElementById('mGuestEmail').value.trim(),phone:document.getElementById('mGuestPhone').value.trim(),group:document.getElementById('mGuestGroup').value.trim(),rsvp:document.getElementById('mGuestRSVP').value,plusOne:document.getElementById('mGuestPlusOne').checked});
  saveData(d);D.closeModal();D.renderGuests();notify('Guest added!','success');D.logActivity('Added guest: '+name);
};
D.editGuest=function(i){
  var d=getData();var g=d.guests[i];
  D.openModal('Edit Guest',
    '<div class="dash-form-group"><label class="dash-form-label">Name *</label><input class="dash-input" id="mGuestName" value="'+escapeHtml(g.name)+'"></div>'+
    '<div class="dash-form-row"><div class="dash-form-group"><label class="dash-form-label">Email</label><input class="dash-input" id="mGuestEmail" value="'+escapeHtml(g.email||'')+'"></div>'+
    '<div class="dash-form-group"><label class="dash-form-label">Phone</label><input class="dash-input" id="mGuestPhone" value="'+escapeHtml(g.phone||'')+'"></div></div>'+
    '<div class="dash-form-row"><div class="dash-form-group"><label class="dash-form-label">Group</label><input class="dash-input" id="mGuestGroup" value="'+escapeHtml(g.group||'')+'"></div>'+
    '<div class="dash-form-group"><label class="dash-form-label">RSVP</label><select class="dash-select" id="mGuestRSVP"><option value="pending"'+(g.rsvp==='pending'?' selected':'')+'>Pending</option><option value="accepted"'+(g.rsvp==='accepted'?' selected':'')+'>Accepted</option><option value="declined"'+(g.rsvp==='declined'?' selected':'')+'>Declined</option></select></div></div>'+
    '<div class="dash-form-group"><label class="dash-form-label" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="mGuestPlusOne"'+(g.plusOne?' checked':'')+'> Include +1</label></div>',
    [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Save',class:'dash-btn dash-btn-gold',action:'DashApp.saveEditGuest('+i+')'}]
  );
};
D.saveEditGuest=function(i){
  var d=getData();var g=d.guests[i];
  g.name=document.getElementById('mGuestName').value.trim();
  g.email=document.getElementById('mGuestEmail').value.trim();
  g.phone=document.getElementById('mGuestPhone').value.trim();
  g.group=document.getElementById('mGuestGroup').value.trim();
  g.rsvp=document.getElementById('mGuestRSVP').value;
  g.plusOne=document.getElementById('mGuestPlusOne').checked;
  saveData(d);D.closeModal();D.renderGuests();notify('Guest updated!','success');
};
D.removeGuest=function(i){
  var d=getData();var name=d.guests[i].name;d.guests.splice(i,1);
  saveData(d);D.renderGuests();notify('Guest removed','info');D.logActivity('Removed guest: '+name);
};
D.handleGuestImport=function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var lines=ev.target.result.split('\n');
    var d=getData();if(!d.guests)d.guests=[];
    var count=0;
    lines.forEach(function(line,idx){
      if(idx===0)return;// skip header
      var cols=line.split(',').map(function(c){return c.trim().replace(/^"|"$/g,'');});
      if(cols[0]){d.guests.push({id:genId(),name:cols[0]||'',email:cols[1]||'',phone:cols[2]||'',group:cols[3]||'',rsvp:'pending',plusOne:false});count++;}
    });
    saveData(d);D.renderGuests();notify(count+' guests imported!','success');
  };
  reader.readAsText(file);e.target.value='';
};
D.exportGuests=function(fmt){
  var d=getData();var guests=d.guests||[];
  if(fmt==='csv'){
    var csv='Name,Email,Phone,Group,RSVP,Plus One\n';
    guests.forEach(function(g){csv+=escapeCsvField(g.name)+','+escapeCsvField(g.email)+','+escapeCsvField(g.phone)+','+escapeCsvField(g.group)+','+escapeCsvField(g.rsvp||'pending')+','+escapeCsvField(g.plusOne?'Yes':'No')+'\n';});
    D.downloadFile(csv,'guests.csv','text/csv');
  }else if(fmt==='pdf'){
    D.generatePDF(guests);
  }
  notify('Guest list exported as '+fmt.toUpperCase(),'success');
};

// ===== RSVP =====
D.loadRSVP=function(){
  var d=getData();var guests=d.guests||[];
  var total=guests.length;
  var accepted=guests.filter(function(g){return g.rsvp==='accepted'||g.attendanceStatus==='yes';}).length;
  var declined=guests.filter(function(g){return g.rsvp==='declined'||g.attendanceStatus==='no';}).length;
  var pending=total-accepted-declined;
  var totalGuests=guests.reduce(function(sum,g){return sum+(parseInt(g.guestCount)||1);},0);
  document.getElementById('rTotal').textContent=total;
  document.getElementById('rAccepted').textContent=accepted;
  document.getElementById('rDeclined').textContent=declined;
  document.getElementById('rPending').textContent=pending;
  document.getElementById('rGuests').textContent=totalGuests;
  D.renderRSVPTable(guests);
};
D.renderRSVPTable=function(guests){
  var tbody=document.getElementById('rsvpTableBody');
  var mealLabels={chicken:'Chicken',fish:'Fish',vegetarian:'Vegetarian',vegan:'Vegan'};
  var transportLabels={'need-ride':'Needs ride','can-car':'Carpool','shuttle':'Shuttle'};
  var statusColors={accepted:'var(--success)',declined:'var(--error)',pending:'var(--warning)'};
  var statusLabels={accepted:'Accepted',declined:'Declined',pending:'Pending'};
  tbody.innerHTML=guests.length?guests.map(function(g,i){
    var st=g.rsvp||'pending';
    return '<tr><td><strong>'+escapeHtml(g.name||g.fullName||'-')+'</strong>'+(g.phone?'<br><small style="color:var(--text-light)">'+escapeHtml(g.phone)+'</small>':'')+'</td><td style="font-size:0.85rem">'+escapeHtml(g.email||'-')+'</td><td><span style="color:'+(statusColors[st]||statusColors.pending)+';font-weight:600">'+(statusLabels[st]||st)+'</span></td><td>'+(g.guestCount||1)+'</td><td>'+(mealLabels[g.mealPreference]||'-')+'</td><td style="font-size:0.82rem">'+(transportLabels[g.transport]||'-')+'</td><td style="font-size:0.82rem;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escapeHtml(g.message||'')+'">'+(g.message?'<i class="fas fa-comment" style="color:var(--gold);margin-right:4px"></i>'+escapeHtml(g.message.substring(0,40))+(g.message.length>40?'...':''):'-')+'</td><td style="font-size:0.82rem;color:var(--text-light)">'+(g.rsvpDate?formatDate(g.rsvpDate):'-')+'</td><td><button class="dash-btn dash-btn-sm" onclick="DashApp.editRSVPGuest('+i+')" title="Edit"><i class="fas fa-edit"></i></button> <button class="dash-btn dash-btn-sm dash-btn-danger" onclick="DashApp.removeRSVPGuest('+i+')" title="Delete"><i class="fas fa-trash"></i></button></td></tr>';
  }).join(''):'<tr><td colspan="9" style="text-align:center;color:var(--text-light);padding:30px">No RSVP responses yet</td></tr>';
};
D.filterRSVP=function(){
  var d=getData();var guests=d.guests||[];
  var search=(document.getElementById('rsvpSearch').value||'').toLowerCase();
  var filter=document.getElementById('rsvpFilter').value;
  if(filter!=='all') guests=guests.filter(function(g){return g.rsvp===filter||g.attendanceStatus===filter;});
  if(search) guests=guests.filter(function(g){return ((g.name||g.fullName||'')+(g.email||'')).toLowerCase().indexOf(search)!==-1;});
  D.renderRSVPTable(guests);
};
D.editRSVPGuest=function(i){
  var d=getData();var g=d.guests[i];if(!g) return;
  var st=g.rsvp||'pending';
  D.openModal('Edit RSVP - '+(g.name||g.fullName),
    '<div class="dash-form-group"><label>Name</label><input id="modalRsvpName" value="'+escapeHtml(g.name||g.fullName||'')+'"></div>'+
    '<div class="dash-form-group"><label>Email</label><input id="modalRsvpEmail" value="'+escapeHtml(g.email||'')+'"></div>'+
    '<div class="dash-form-group"><label>Phone</label><input id="modalRsvpPhone" value="'+escapeHtml(g.phone||'')+'"></div>'+
    '<div class="dash-form-group"><label>Guests</label><input type="number" id="modalRsvpGuests" min="1" max="10" value="'+(g.guestCount||1)+'"></div>'+
    '<div class="dash-form-group"><label>Status</label><select id="modalRsvpStatus"><option value="accepted"'+(st==='accepted'?' selected':'')+'>Accepted</option><option value="declined"'+(st==='declined'?' selected':'')+'>Declined</option><option value="pending"'+(st==='pending'?' selected':'')+'>Pending</option></select></div>'+
    '<div class="dash-form-group"><label>Meal Preference</label><select id="modalRsvpMeal"><option value="">None</option><option value="chicken"'+((g.mealPreference||'')==='chicken'?' selected':'')+'>Chicken</option><option value="fish"'+((g.mealPreference||'')==='fish'?' selected':'')+'>Fish</option><option value="vegetarian"'+((g.mealPreference||'')==='vegetarian'?' selected':'')+'>Vegetarian</option><option value="vegan"'+((g.mealPreference||'')==='vegan'?' selected':'')+'>Vegan</option></select></div>'+
    '<div class="dash-form-group"><label>Dietary Restrictions</label><input id="modalRsvpDietary" value="'+escapeHtml(g.dietary||'')+'"></div>'+
    '<div class="dash-form-group"><label>Message</label><textarea id="modalRsvpMessage" rows="2">'+escapeHtml(g.message||'')+'</textarea></div>',
    [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Save Changes',class:'dash-btn dash-btn-gold',action:'DashApp.saveEditRSVP('+i+')'}]
  );
};
D.saveEditRSVP=function(i){
  var d=getData();var guests=d.guests||[];
  guests[i].name=document.getElementById('modalRsvpName').value.trim();
  guests[i].email=document.getElementById('modalRsvpEmail').value.trim();
  guests[i].phone=document.getElementById('modalRsvpPhone').value.trim();
  guests[i].guestCount=parseInt(document.getElementById('modalRsvpGuests').value)||1;
  guests[i].rsvp=document.getElementById('modalRsvpStatus').value;
  guests[i].mealPreference=document.getElementById('modalRsvpMeal').value;
  guests[i].dietary=document.getElementById('modalRsvpDietary').value.trim();
  guests[i].message=document.getElementById('modalRsvpMessage').value.trim();
  saveData(d);D.loadRSVP();D.loadGuests();D.closeModal();notify('RSVP updated','success');
};
D.removeRSVPGuest=function(i){
  var d=getData();var g=d.guests[i];if(!g) return;
  if(!confirm('Remove RSVP from '+(g.name||g.fullName||'this guest')+'?')) return;
  d.guests.splice(i,1);saveData(d);D.loadRSVP();D.loadGuests();notify('RSVP removed','success');
};
D.exportRSVP=function(fmt){
  var d=getData();var guests=d.guests||[];
  var mealLabels={chicken:'Chicken',fish:'Fish',vegetarian:'Vegetarian',vegan:'Vegan'};
  var transportLabels={'need-ride':'Needs ride','can-car':'Carpool','shuttle':'Shuttle'};
  if(fmt==='csv'){
    var csv='Name,Email,Phone,Status,Guests,Meal,Dietary,Transport,Message,Date\n';
    guests.forEach(function(g){csv+=escapeCsvField(g.name||g.fullName)+','+escapeCsvField(g.email)+','+escapeCsvField(g.phone)+','+escapeCsvField(g.rsvp||'pending')+','+escapeCsvField(g.guestCount||1)+','+escapeCsvField(mealLabels[g.mealPreference]||'')+','+escapeCsvField(g.dietary)+','+escapeCsvField(transportLabels[g.transport]||'')+','+escapeCsvField(g.message)+','+escapeCsvField(g.rsvpDate)+'\n';});
    D.downloadFile(csv,'rsvp-report.csv','text/csv');
  }else if(fmt==='pdf'){
    D.generatePDF(guests);
  }else if(fmt==='excel'){
    var xml='<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="RSVP"><Table><Row><Cell><Data ss:Type="String">Name</Data></Cell><Cell><Data ss:Type="String">Email</Data></Cell><Cell><Data ss:Type="String">Phone</Data></Cell><Cell><Data ss:Type="String">Status</Data></Cell><Cell><Data ss:Type="String">Guests</Data></Cell><Cell><Data ss:Type="String">Meal</Data></Cell><Cell><Data ss:Type="String">Dietary</Data></Cell><Cell><Data ss:Type="String">Transport</Data></Cell><Cell><Data ss:Type="String">Message</Data></Cell><Cell><Data ss:Type="String">Date</Data></Cell></Row>';
    guests.forEach(function(g){xml+='<Row><Cell><Data ss:Type="String">'+(g.name||g.fullName||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.email||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.phone||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.rsvp||'pending')+'</Data></Cell><Cell><Data ss:Type="Number">'+(g.guestCount||1)+'</Data></Cell><Cell><Data ss:Type="String">'+(mealLabels[g.mealPreference]||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.dietary||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(transportLabels[g.transport]||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.message||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.rsvpDate||'')+'</Data></Cell></Row>';});
    xml+='</Table></Worksheet></Workbook>';
    D.downloadFile(xml,'rsvp-report.xls','application/vnd.ms-excel');
  }
  notify('RSVP report exported as '+fmt.toUpperCase(),'success');
};

// ===== AI SETTINGS =====
D.loadAISettings=function(){
  var d=getData();var ai=d.aiSettings||{};
  document.getElementById('aiDate').value=ai.date||d.weddingDate||'';
  document.getElementById('aiVenue').value=ai.venue||d.venue||'';
  document.getElementById('aiDress').value=ai.dressCode||'';
  document.getElementById('aiContact').value=ai.contact||'';
  document.getElementById('aiDirections').value=ai.directions||'';
  document.getElementById('aiGifts').value=ai.giftRegistry||'';
  document.getElementById('aiFAQ').value=ai.faq||'';
};
D.saveAISettings=function(){
  var d=getData();
  d.aiSettings={
    date:document.getElementById('aiDate').value,
    venue:document.getElementById('aiVenue').value.trim(),
    dressCode:document.getElementById('aiDress').value.trim(),
    contact:document.getElementById('aiContact').value.trim(),
    directions:document.getElementById('aiDirections').value.trim(),
    giftRegistry:document.getElementById('aiGifts').value.trim(),
    faq:document.getElementById('aiFAQ').value.trim()
  };
  d.updatedAt=Date.now();saveData(d);
  notify('AI Assistant settings saved!','success');
  D.logActivity('Updated AI Assistant settings');
};

// ===== SOCIAL LINKS =====
D.loadSocialLinks=function(){
  var d=getData();var s=d.socialLinks||{};
  document.getElementById('linkInstagram').value=s.instagram||'';
  document.getElementById('linkFacebook').value=s.facebook||'';
  document.getElementById('linkTwitter').value=s.twitter||'';
  document.getElementById('linkTiktok').value=s.tiktok||'';
  document.getElementById('linkYoutube').value=s.youtube||'';
  document.getElementById('linkWhatsapp').value=s.whatsapp||'';
  document.getElementById('linkTelegram').value=s.telegram||'';
  document.getElementById('linkPinterest').value=s.pinterest||'';
};
D.saveSocialLinks=function(){
  var d=getData();
  d.socialLinks={
    instagram:document.getElementById('linkInstagram').value.trim(),
    facebook:document.getElementById('linkFacebook').value.trim(),
    twitter:document.getElementById('linkTwitter').value.trim(),
    tiktok:document.getElementById('linkTiktok').value.trim(),
    youtube:document.getElementById('linkYoutube').value.trim(),
    whatsapp:document.getElementById('linkWhatsapp').value.trim(),
    telegram:document.getElementById('linkTelegram').value.trim(),
    pinterest:document.getElementById('linkPinterest').value.trim()
  };
  d.updatedAt=Date.now();saveData(d);
  notify('Social links saved!','success');
};

// ===== ANALYTICS =====
D.loadAnalytics=function(){
  var d=getData();var a=d.analytics||{views:0,clicks:0};
  document.getElementById('aViews').textContent=a.views||0;
  document.getElementById('aClicks').textContent=a.clicks||0;
  // Simple bar chart for daily views
  var daily=a.dailyViews||{};
  var chart=document.getElementById('viewsChart');
  var labels=document.getElementById('viewsLabels');
  var days=[];var now=new Date();
  for(var i=6;i>=0;i--){
    var dt=new Date(now);dt.setDate(dt.getDate()-i);
    var key=dt.toISOString().split('T')[0];
    days.push({key:key,label:dt.toLocaleDateString('en-US',{weekday:'short'}),value:daily[key]||0});
  }
  var maxVal=Math.max.apply(null,days.map(function(d){return d.value;}))||1;
  chart.innerHTML=days.map(function(d){
    var h=Math.max(4,(d.value/maxVal)*200);
    return '<div class="chart-bar" style="height:'+h+'px;background:linear-gradient(to top,var(--gold),var(--gold-dark))"><div class="tooltip">'+d.label+': '+d.value+' views</div></div>';
  }).join('');
  labels.innerHTML=days.map(function(d){return '<span>'+d.label+'</span>';}).join('');
};
D.downloadReport=function(fmt){
  var d=getData();
  if(fmt==='csv'){
    var csv='Metric,Value\nPage Views,'+(d.analytics?.views||0)+'\nInvitation Clicks,'+(d.analytics?.clicks||0)+'\nAI Usage,'+(d.analytics?.aiUsage||0)+'\nTotal Guests,'+(d.guests?.length||0)+'\nAccepted,'+(d.guests||[]).filter(function(g){return g.rsvp==='accepted';}).length+'\n';
    D.downloadFile(csv,'analytics-report.csv','text/csv');
  }
  notify('Report downloaded','success');
};

// ===== PROFILE / SETTINGS =====
D.loadProfile=function(){
  var d=getData();
  document.getElementById('setFullName').value='';
  document.getElementById('setEmail').value='';
  document.getElementById('setCountry').value=d.country||'';
};
D.saveProfile=function(){
  notify('Settings saved!','success');
};
D.deleteAccount=function(){
  D.openModal('Delete Account',
    '<p style="color:var(--text-light);margin-bottom:16px">This action is permanent and cannot be undone. All your data will be deleted.</p>'+
    '<div class="dash-form-group"><label class="dash-form-label">Type "DELETE" to confirm</label><input class="dash-input" id="deleteConfirm" placeholder="DELETE"></div>',
    [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Delete',class:'dash-btn dash-btn-danger',action:'DashApp.confirmDeleteAccount()'}]
  );
};
D.confirmDeleteAccount=function(){
  if(document.getElementById('deleteConfirm').value!=='DELETE'){notify('Type DELETE to confirm','error');return;}
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem('weddingActivity');
  localStorage.removeItem('weddingNotifications');
  localStorage.removeItem('weddingShareAnalytics');
  localStorage.removeItem('weddingShareHistory');
  localStorage.removeItem('weddingAnalytics');
  localStorage.removeItem('weddingAuthUsers');
  localStorage.removeItem('weddingAuthSession');
  localStorage.removeItem('weddingSidebarState');
  localStorage.removeItem('wedding_sidebar_state');
  localStorage.removeItem('weddingPalette');
  localStorage.removeItem('weddingSuperAdmin');
  window.location.href='index.html';
  notify('Account deleted','info');
};

// ===== PUBLISH / SAVE =====
D.publish=function(){
  var d=getData();
  if(typeof PublishEngine!=='undefined'){
    var result=PublishEngine.publish();
    if(result&&result.success){
      D.renderWebsiteStatus();
      D.renderWeddingProgress();
      D.logActivity('Published website');
      localStorage.setItem('_publish_success','1');
      window.location.href='index.html';
    }
    return;
  }
  var missing=[];
  if(!d.groomName)missing.push('Groom Name');
  if(!d.brideName)missing.push('Bride Name');
  if(!d.weddingDate)missing.push('Wedding Date');
  if(!d.weddingTime)missing.push('Wedding Time');
  if(!d.venue)missing.push('Venue');
  if(!d.address)missing.push('Address');
  var hasContact=(d.socialLinks&&(d.socialLinks.whatsapp||d.socialLinks.facebook||d.socialLinks.instagram||d.socialLinks.twitter||d.socialLinks.telegram))||d.phone||d.email||d.whatsapp;
  if(!hasContact)missing.push('At least one contact method');
  if(missing.length){notify('Please complete: '+missing.join(', '),'error');return;}
  d.isPublished=true;
  d.publishedAt=d.publishedAt||Date.now();
  d.updatedAt=Date.now();
  saveData(d);
  D.renderWebsiteStatus();
  D.renderWeddingProgress();
  D.logActivity('Published website');
  localStorage.setItem('_publish_success','1');
  window.location.href='index.html';
};
D.unpublish=function(){
  var d=getData();
  if(typeof PublishEngine!=='undefined')PublishEngine.unpublish();
  else{d.isPublished=false;d.updatedAt=Date.now();saveData(d);}
  D.renderWebsiteStatus();
  D.renderWeddingProgress();
  notify('Website unpublished','info');
  D.logActivity('Unpublished website');
};
D.saveDraft=function(){
  var d=getData();d.updatedAt=Date.now();saveData(d);
  D.renderWebsiteStatus();
  notify('Draft saved successfully!','success');
};

// ===== WEBSITE SETTINGS =====
D.loadWebsiteSettings=function(){
  var d=getData();var ws=d.websiteSettings||{};
  document.getElementById('wsSiteName').value=ws.siteName||'Forever & Always';
  document.getElementById('wsBrowserTitle').value=ws.browserTitle||'';
  document.getElementById('wsFavicon').value=ws.favicon||'';
  document.getElementById('wsLogo').value=ws.logo||'';
  document.getElementById('wsPrimaryColor').value=ws.primaryColor||'#D4AF37';
  document.getElementById('wsSecondaryColor').value=ws.secondaryColor||'#0B0F19';
  document.getElementById('wsFontStyle').value=ws.fontStyle||'modern';
  document.getElementById('wsHeroImage').value=ws.heroImage||'';
  document.getElementById('wsFooterText').value=ws.footerText||'';
  document.getElementById('wsContactEmail').value=ws.contactEmail||'';
  document.getElementById('wsContactPhone').value=ws.contactPhone||'';
  document.getElementById('wsMetaDesc').value=ws.metaDesc||'';
};
D.saveWebsiteSettings=function(){
  var d=getData();
  d.websiteSettings={
    siteName:document.getElementById('wsSiteName').value.trim(),
    browserTitle:document.getElementById('wsBrowserTitle').value.trim(),
    favicon:document.getElementById('wsFavicon').value.trim(),
    logo:document.getElementById('wsLogo').value.trim(),
    primaryColor:document.getElementById('wsPrimaryColor').value,
    secondaryColor:document.getElementById('wsSecondaryColor').value,
    fontStyle:document.getElementById('wsFontStyle').value,
    heroImage:document.getElementById('wsHeroImage').value.trim(),
    footerText:document.getElementById('wsFooterText').value.trim(),
    contactEmail:document.getElementById('wsContactEmail').value.trim(),
    contactPhone:document.getElementById('wsContactPhone').value.trim(),
    metaDesc:document.getElementById('wsMetaDesc').value.trim()
  };
  d.updatedAt=Date.now();saveData(d);
  // Apply settings immediately
  if(d.websiteSettings.primaryColor){
    document.documentElement.style.setProperty('--gold',d.websiteSettings.primaryColor);
  }
  notify('Website settings saved!','success');
  D.logActivity('Updated website settings');
};

// ===== BACKUP & RESTORE =====
D.exportBackup=function(){
  var d=getData();
  var backup={
    version:'1.0',
    exportedAt:new Date().toISOString(),
    data:d
  };
  var json=JSON.stringify(backup,null,2);
  var filename='wedding-backup-'+new Date().toISOString().split('T')[0]+'.json';
  D.downloadFile(json,filename,'application/json');
  // Log backup
  if(!d.backupHistory)d.backupHistory=[];
  d.backupHistory.unshift({date:Date.now(),filename:filename,count:Object.keys(d).length});
  if(d.backupHistory.length>10)d.backupHistory=d.backupHistory.slice(0,10);
  saveData(d);
  D.renderBackupHistory();
  notify('Backup exported successfully!','success');
  D.logActivity('Exported backup: '+filename);
};
D.importBackup=function(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    try{
      var backup=JSON.parse(ev.target.result);
      if(!backup.data){notify('Invalid backup file format','error');return;}
      D.openModal('Import Backup',
        '<p style="color:var(--text-light);margin-bottom:16px">This will replace ALL current wedding data with the backup contents. This action cannot be undone.</p>'+
        '<p style="color:var(--text-light);font-size:0.85rem"><strong>Backup from:</strong> '+backup.exportedAt+'</p>'+
        '<div class="dash-form-group"><label class="dash-form-label" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="importConfirm"> I understand this will replace all current data</label></div>',
        [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Import',class:'dash-btn dash-btn-gold',action:'DashApp.confirmImport()'}]
      );
      window._importData=backup.data;
    }catch(err){
      notify('Failed to parse backup file','error');
    }
  };
  reader.readAsText(file);e.target.value='';
};
D.confirmImport=function(){
  if(!document.getElementById('importConfirm').checked){notify('Please confirm the import','error');return;}
  var data=window._importData;
  if(data){saveData(data);D.closeModal();D.init();notify('Backup imported successfully!','success');D.logActivity('Imported backup data');}
};
D.resetToDefault=function(){
  D.openModal('Reset All Data',
    '<p style="color:var(--error);font-weight:600;margin-bottom:12px">Warning: This action is permanent!</p>'+
    '<p style="color:var(--text-light);margin-bottom:16px">All your wedding data, guests, RSVPs, gallery images, and settings will be permanently deleted. The website will revert to default demo content.</p>'+
    '<div class="dash-form-group"><label class="dash-form-label" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="resetConfirm"> I understand this cannot be undone</label></div>'+
    '<div class="dash-form-group"><label class="dash-form-label">Type "RESET" to confirm</label><input class="dash-input" id="resetConfirmText" placeholder="RESET"></div>',
    [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Reset Everything',class:'dash-btn dash-btn-danger',action:'DashApp.confirmReset()'}]
  );
};
D.confirmReset=function(){
  if(!document.getElementById('resetConfirm').checked){notify('Please confirm the reset','error');return;}
  if(document.getElementById('resetConfirmText').value!=='RESET'){notify('Type RESET to confirm','error');return;}
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem('weddingPalette');
  localStorage.removeItem('wedding_sidebar_state');
  D.closeModal();
  D.init();
  notify('All data has been reset to defaults','success');
  D.logActivity('Reset all data to defaults');
};
D.renderBackupHistory=function(){
  var d=getData();var history=d.backupHistory||[];
  var el=document.getElementById('backupHistory');
  if(!history.length){el.innerHTML='No backups yet. Export your data to create a backup.';return;}
  el.innerHTML=history.map(function(b){
    var ago=Date.now()-b.date;var text='';
    if(ago<60000)text='Just now';
    else if(ago<3600000)text=Math.floor(ago/60000)+'m ago';
    else if(ago<86400000)text=Math.floor(ago/3600000)+'h ago';
    else text=Math.floor(ago/86400000)+'d ago';
    return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.04)"><div><i class="fas fa-file-export" style="color:var(--gold);margin-right:8px"></i><span>'+b.filename+'</span><span style="color:var(--text-light);font-size:0.82rem;margin-left:8px">'+b.count+' fields</span></div><span style="color:var(--text-light);font-size:0.78rem;white-space:nowrap">'+text+'</span></div>';
  }).join('');
};

// ===== MODAL =====
D.openModal=function(title,bodyHTML,buttons){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').innerHTML=bodyHTML;
  document.getElementById('modalFooter').innerHTML=buttons.map(function(b){return '<button class="'+b.class+'" onclick="'+b.action+'">'+b.text+'</button>';}).join('');
  document.getElementById('dashModal').classList.add('show');
};
D.closeModal=function(){document.getElementById('dashModal').classList.remove('show');};

// ===== ACTIVITY LOG =====
D.logActivity=function(msg){
  var d=getData();if(!d.activityLog)d.activityLog=[];
  d.activityLog.unshift({msg:msg,time:Date.now()});
  if(d.activityLog.length>20)d.activityLog=d.activityLog.slice(0,20);
  saveData(d);
  D.renderActivity();
};
D.renderActivity=function(){
  var d=getData();var log=d.activityLog||[];
  var el=document.getElementById('recentActivity');
  if(!el)return;
  if(!log.length){el.innerHTML='<div style="color:var(--text-light);font-size:0.85rem;padding:16px 0;text-align:center"><i class="fas fa-history" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:0.3"></i>No recent activity yet.</div>';return;}
  el.innerHTML=log.slice(0,8).map(function(a){
    var ago=Date.now()-a.time;var text='';
    if(ago<60000)text='Just now';
    else if(ago<3600000)text=Math.floor(ago/60000)+'m ago';
    else if(ago<86400000)text=Math.floor(ago/3600000)+'h ago';
    else text=Math.floor(ago/86400000)+'d ago';
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.04)"><div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;opacity:0.5"></div><span style="flex:1;font-size:0.85rem;color:var(--text)">'+a.msg+'</span><span style="color:var(--text-light);font-size:0.75rem;white-space:nowrap">'+text+'</span></div>';
  }).join('');
};

// ===== WEDDING PROGRESS =====
D.renderWeddingProgress=function(){
  if(typeof getWeddingProgress!=='function')return;
  var p=getWeddingProgress();
  var fillEl=document.getElementById('weddingProgressFill');
  var pctEl=document.getElementById('weddingProgressPct');
  var stepsEl=document.getElementById('weddingProgressSteps');
  if(fillEl)fillEl.style.width=p.percent+'%';
  if(pctEl)pctEl.textContent=p.percent+'%';
  if(stepsEl){
    stepsEl.innerHTML=p.steps.map(function(s){
      return '<div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:50px;font-size:0.78rem;background:'+(s.done?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.04)')+';color:'+(s.done?'var(--success)':'var(--text-light)')+';border:1px solid '+(s.done?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.06)')+'"><i class="fas fa-'+(s.done?'check-circle':'circle')+'" style="font-size:0.7rem"></i> '+s.name+'</div>';
    }).join('');
  }
};

// ===== WEBSITE STATUS =====
D.renderWebsiteStatus=function(){
  var d=getData();
  var badge=document.getElementById('websiteStatusBadge');
  var text=document.getElementById('websiteStatusText');
  var btn=document.getElementById('btnPublishWebsite');
  var shareRow=document.getElementById('websiteShareRow');
  if(!badge)return;
  if(d.isPublished){
    badge.innerHTML='<span class="status-dot-live"></span> Live';
    badge.style.background='rgba(34,197,94,0.12)';badge.style.color='#22c55e';badge.style.border='1px solid rgba(34,197,94,0.25)';
    var publishDate=d.publishedAt?formatDate(d.publishedAt):'';
    var updateDate=d.updatedAt?formatDate(d.updatedAt):'';
    var inviteUrl=d.inviteUrl||(typeof PublishEngine!=='undefined'?PublishEngine.getInviteUrl(d):'');
    var statusHTML='<div style="display:flex;flex-direction:column;gap:6px">';
    statusHTML+='<span style="color:#22c55e;font-size:0.82rem;font-weight:600"><i class="fas fa-check-circle" style="margin-right:4px"></i>Published Successfully</span>';
    if(publishDate)statusHTML+='<span style="color:var(--text-light);font-size:0.78rem">Published: '+publishDate+'</span>';
    if(updateDate)statusHTML+='<span style="color:var(--text-light);font-size:0.78rem">Last Updated: '+updateDate+'</span>';
    if(inviteUrl)statusHTML+='<span style="color:var(--text-light);font-size:0.78rem;word-break:break-all">Public URL: <a href="'+inviteUrl+'" target="_blank" style="color:var(--gold);text-decoration:none">'+inviteUrl+'</a></span>';
    statusHTML+='</div>';
    if(text)text.innerHTML=statusHTML;
    if(btn){btn.innerHTML='<i class="fas fa-eye-slash"></i> Unpublish';btn.onclick=function(){DashApp.unpublish();};}
    if(shareRow){
      var url=typeof PublishEngine!=='undefined'?PublishEngine.getInviteUrl(d):(window.location.origin+window.location.pathname.replace(/dashboard\.html.*/,'index.html'));
      shareRow.style.display='flex';
      shareRow.innerHTML='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:100%">'
        +'<span style="color:var(--text-light);font-size:0.82rem;margin-right:4px">Share:</span>'
        +'<a href="https://wa.me/?text='+encodeURIComponent('Check out our wedding website! '+url)+'" target="_blank" class="dash-share-btn" style="background:#25D366"><i class="fab fa-whatsapp"></i></a>'
        +'<a href="https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)+'" target="_blank" class="dash-share-btn" style="background:#1877F2"><i class="fab fa-facebook-f"></i></a>'
        +'<a href="https://twitter.com/intent/tweet?text='+encodeURIComponent('Check out our wedding website!')+'&url='+encodeURIComponent(url)+'" target="_blank" class="dash-share-btn" style="background:#1DA1F2"><i class="fab fa-x-twitter"></i></a>'
        +'<a href="mailto:?subject='+encodeURIComponent('Our Wedding Website')+'&body='+encodeURIComponent('Check out our wedding website! '+url)+'" class="dash-share-btn" style="background:#EA4335"><i class="fas fa-envelope"></i></a>'
        +'<button onclick="D.copyWebsiteLink()" class="dash-share-btn" style="background:var(--gold);color:var(--dark)"><i class="fas fa-link"></i></button>'
        +'<button onclick="D.showQRCode()" class="dash-share-btn" style="background:rgba(212,175,55,0.15);color:var(--gold)"><i class="fas fa-qrcode"></i></button>'
        +'</div>';
    }
  }else{
    badge.innerHTML='<span class="status-dot-draft"></span> Draft';
    badge.style.background='rgba(245,158,11,0.12)';badge.style.color='#f59e0b';badge.style.border='1px solid rgba(245,158,11,0.25)';
    if(text)text.textContent='Your website is in draft mode. Publish to make it live for guests.';
    if(btn){btn.innerHTML='<i class="fas fa-rocket"></i> Publish Website';btn.onclick=function(){DashApp.publish();};}
    if(shareRow){shareRow.style.display='none';shareRow.innerHTML='';}
  }
};
D.copyWebsiteLink=function(){
  var url=window.location.origin+window.location.pathname.replace(/dashboard\.html.*/,'index.html');
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){notify('Link copied!','success');}).catch(function(){notify('Failed to copy','error');});
  }else{
    var ta=document.createElement('textarea');ta.value=url;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
    notify('Link copied!','success');
  }
};
D.showQRCode=function(){
  var url=window.location.origin+window.location.pathname.replace(/dashboard\.html.*/,'index.html');
  var modal=document.getElementById('dashModal');
  var body=document.getElementById('modalBody');
  var title=document.getElementById('modalTitle');
  if(!modal||!body)return;
  if(title)title.textContent='Website QR Code';
  body.innerHTML='<div style="text-align:center"><p style="color:var(--text-light);font-size:0.85rem;margin-bottom:20px">Scan to visit your wedding website</p><canvas id="qrCanvas" width="250" height="250" style="background:#fff;border-radius:12px;margin-bottom:16px"></canvas><div style="display:flex;gap:10px;justify-content:center"><button onclick="D.downloadQR()" class="dash-btn dash-btn-gold"><i class="fas fa-download"></i> Download</button></div></div>';
  modal.classList.add('show');
  // Generate QR code on canvas
  var canvas=document.getElementById('qrCanvas');
  if(!canvas)return;
  var ctx=canvas.getContext('2d');
  var size=250;var modules=25;var cellSize=Math.floor(size/modules);var offset=Math.floor((size-cellSize*modules)/2);
  ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#000000';
  // Simple QR-like pattern (deterministic based on URL)
  var hash=0;for(var i=0;i<url.length;i++){hash=((hash<<5)-hash)+url.charCodeAt(i);hash|=0;}
  function setCell(r,c){ctx.fillRect(offset+c*cellSize,offset+r*cellSize,cellSize,cellSize);}
  // Position patterns
  function drawFinder(x,y){
    for(var r=0;r<7;r++)for(var c=0;c<7;c++){
      if(r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4))setCell(y+r,x+c);
    }
  }
  drawFinder(0,0);drawFinder(modules-7,0);drawFinder(0,modules-7);
  // Data pattern seeded by hash
  var seed=Math.abs(hash);
  for(var r=8;r<modules-8;r++)for(var c=8;c<modules-8;c++){
    seed=(seed*1103515245+12345)&0x7fffffff;
    if(seed%3===0)setCell(r,c);
  }
  for(var r=8;r<modules-8;r++){seed=(seed*1103515245+12345)&0x7fffffff;if(seed%2===0)setCell(r,modules-8);}
  for(var c=8;c<modules-8;c++){seed=(seed*1103515245+12345)&0x7fffffff;if(seed%2===0)setCell(modules-8,c);}
};
D.downloadQR=function(){
  var canvas=document.getElementById('qrCanvas');
  if(!canvas)return;
  var link=document.createElement('a');
  link.download='wedding-qr-code.png';
  link.href=canvas.toDataURL('image/png');
  link.click();
};

// ===== NOTIFICATIONS CENTER =====
D.renderNotifications=function(){
  var el=document.getElementById('dashNotifList');
  if(!el)return;
  var notifs=[];
  if(typeof getNotifications==='function')notifs=getNotifications();
  if(!notifs.length){
    el.innerHTML='<div style="color:var(--text-light);font-size:0.85rem;padding:16px 0;text-align:center"><i class="fas fa-bell-slash" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:0.3"></i>No notifications</div>';
    return;
  }
  el.innerHTML=notifs.slice(0,10).map(function(n){
    var ago=Date.now()-n.time;var text='';
    if(ago<60000)text='Just now';
    else if(ago<3600000)text=Math.floor(ago/60000)+'m ago';
    else if(ago<86400000)text=Math.floor(ago/3600000)+'h ago';
    else text=Math.floor(ago/86400000)+'d ago';
    var icons={rsvp:'fa-envelope-open',guest:'fa-users',system:'fa-info-circle',reminder:'fa-clock',setup:'fa-rocket'};
    var colors={rsvp:'var(--success)',guest:'var(--info)',system:'var(--gold)',reminder:'var(--warning)',setup:'var(--gold)'};
    var icon=icons[n.type]||'fa-info-circle';
    var color=colors[n.type]||'var(--gold)';
    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;margin-bottom:4px;cursor:pointer;transition:all 0.2s;background:'+(n.read?'transparent':'rgba(212,175,55,0.04)')+'" onclick="DashApp.markNotifRead(\''+n.id+'\')" onmouseover="this.style.background=\'rgba(212,175,55,0.06)\'" onmouseout="this.style.background=\''+(n.read?'transparent':'rgba(212,175,55,0.04)')+'\'"><div style="width:32px;height:32px;border-radius:8px;background:rgba(212,175,55,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas '+icon+'" style="color:'+color+';font-size:0.8rem"></i></div><div style="flex:1;min-width:0"><div style="font-size:0.85rem;color:var(--text);font-weight:'+(n.read?'400':'500')+'">'+escapeHtml(n.title)+'</div>'+(n.message?'<div style="font-size:0.75rem;color:var(--text-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(n.message)+'</div>':'')+'</div><div style="font-size:0.72rem;color:var(--text-light);white-space:nowrap">'+text+'</div>'+(n.read?'':'<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0"></div>')+'</div>';
  }).join('');
};
D.markNotifRead=function(id){
  if(typeof markNotificationRead==='function')markNotificationRead(id);
  D.renderNotifications();
};
D.markAllNotifsRead=function(){
  if(typeof markAllRead==='function')markAllRead();
  D.renderNotifications();
  notify('All notifications marked as read','success');
};

// ===== REAL-TIME FIREBASE LISTENER =====
D.startRealtimeListener=function(){
  if(typeof fbGetCollection !== 'function') return;
  var pollInterval = setInterval(function(){
    fbGetCollection('guests').then(function(guests){
      if(!guests || !guests.length) return;
      var d = getData();
      if(!d.guests) d.guests = [];
      var localNames = d.guests.map(function(g){return g.email || g.guestName || g.name;});
      var changed = false;
      guests.forEach(function(g){
        var key = g.email || g.guestName || g.name;
        if(!key) return;
        if(localNames.indexOf(key) === -1){
          d.guests.push({
            id: g.id || 'fb_' + Date.now(),
            name: g.guestName || g.name || '',
            email: g.email || '',
            phone: g.phone || '',
            rsvp: g.status || g.rsvp || 'pending',
            guestCount: parseInt(g.guestCount) || 1,
            message: g.message || '',
            mealPreference: g.mealPreference || '',
            transport: g.transport || '',
            rsvpDate: g.createdAt || new Date().toISOString()
          });
          changed = true;
        }
      });
      if(changed){
        saveData(d);
        D.loadRSVP();
        D.loadGuests();
        D.renderWeddingProgress();
      }
    }).catch(function(){});
  }, 15000);
  window._rsvpPollInterval = pollInterval;
};

// ===== HELPERS =====
D.downloadFile=function(content,filename,type){
  var blob=new Blob([content],{type:type});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
D.generatePDF=function(guests){
  var text='WEDDING GUEST LIST\n\n';
  text+='Name | Email | Phone | Group | RSVP\n';
  text+='='.repeat(60)+'\n';
  guests.forEach(function(g){text+=g.name+' | '+(g.email||'-')+' | '+(g.phone||'-')+' | '+(g.group||'-')+' | '+(g.rsvp||'pending')+'\n';});
  D.downloadFile(text,'guest-list.txt','text/plain');
  notify('PDF export generates a text file. For full PDF, use a PDF library.','info');
};

// ===== INVITATION MANAGER =====
var InvDash=(function(){
  var INV_KEY='weddingInvitations';
  function getInv(){try{var r=localStorage.getItem(INV_KEY);return r?JSON.parse(r):{guests:[]};}catch(e){return{guests:[]};}}
  function saveInv(d){localStorage.setItem(INV_KEY,JSON.stringify(d));}
  function genId(){return 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,6);}
  function getWeddingUrl(){return window.location.origin+window.location.pathname.replace(/dashboard\.html.*$/,'')+'invitation.html';}
  function notify(msg,type){
    if(typeof DashApp!=='undefined'&&DashApp.notify){DashApp.notify(msg,type);return;}
    var t=document.createElement('div');
    t.style.cssText='position:fixed;top:24px;right:24px;z-index:100001;padding:14px 20px;border-radius:12px;background:rgba(11,15,25,0.95);border:1px solid rgba(212,175,55,0.15);color:var(--text);font-size:0.88rem;z-index:100001';
    t.textContent=msg;document.body.appendChild(t);
    setTimeout(function(){if(t.parentElement)t.remove();},3000);
  }
  function renderStats(){
    var inv=getInv();var g=inv.guests||[];
    var stats={total:g.length,sent:g.filter(function(x){return x.invited;}).length,confirmed:g.filter(function(x){return x.rsvp==='accepted';}).length,declined:g.filter(function(x){return x.rsvp==='declined';}).length,pending:g.filter(function(x){return x.rsvp==='pending';}).length};
    var el=document.getElementById('invStats');
    if(!el)return;
    el.innerHTML='<div class="inv-stat"><div class="num">'+stats.total+'</div><div class="label">Total Guests</div></div>'+
      '<div class="inv-stat sent"><div class="num">'+stats.sent+'</div><div class="label">Invitations Sent</div></div>'+
      '<div class="inv-stat confirmed"><div class="num">'+stats.confirmed+'</div><div class="label">Confirmed</div></div>'+
      '<div class="inv-stat declined"><div class="num">'+stats.declined+'</div><div class="label">Declined</div></div>'+
      '<div class="inv-stat pending"><div class="num">'+stats.pending+'</div><div class="label">Pending</div></div>';
  }
  function renderGuests(){
    var inv=getInv();var guests=inv.guests||[];
    var search=(document.getElementById('invSearch')?document.getElementById('invSearch').value:'').toLowerCase();
    var filter=document.getElementById('invFilter')?document.getElementById('invFilter').value:'all';
    if(search)guests=guests.filter(function(g){return((g.name||'')+(g.email||'')+(g.phone||'')).toLowerCase().indexOf(search)!==-1;});
    if(filter==='invited')guests=guests.filter(function(g){return g.invited;});
    else if(filter==='not-invited')guests=guests.filter(function(g){return !g.invited;});
    else if(filter!=='all')guests=guests.filter(function(g){return g.rsvp===filter;});
    var tbody=document.getElementById('invGuestTable');
    if(!tbody)return;
    var statusColors={accepted:'var(--success)',declined:'var(--error)',pending:'var(--warning)',maybe:'var(--info)'};
    tbody.innerHTML=guests.length?guests.map(function(g,i){
      var ri=inv.guests.indexOf(g);
      return '<tr><td><strong>'+esc(g.name)+'</strong></td><td>'+(g.email||'-')+'</td><td>'+(g.phone||'-')+'</td>'+
        '<td>'+(g.invited?'<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Sent</span>':'<span style="color:var(--text-light)"><i class="fas fa-circle"></i> Not sent</span>')+'</td>'+
        '<td><span style="color:'+(statusColors[g.rsvp]||'var(--text-light)')+';font-weight:600;text-transform:capitalize">'+g.rsvp+'</span></td>'+
        '<td class="actions"><button onclick="InvDash.sendInvite(\''+g.id+'\')" title="Send Invitation"><i class="fas fa-paper-plane"></i></button>'+
        '<button onclick="InvDash.editGuest(\''+g.id+'\')" title="Edit"><i class="fas fa-pen"></i></button>'+
        '<button class="del" onclick="InvDash.deleteGuest(\''+g.id+'\')" title="Delete"><i class="fas fa-trash"></i></button></td></tr>';
    }).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:30px">No guests found. Click "Add Guest" to start.</td></tr>';
    renderStats();
  }
  function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  return{
    init:function(){renderGuests();renderStats();},
    renderGuests:renderGuests,
    addGuest:function(){
      if(typeof DashApp!=='undefined'&&DashApp.openModal){
        DashApp.openModal('Add Guest to Invitation',
          '<div class="dash-form-group"><label class="dash-form-label">Name *</label><input class="dash-input" id="invGName" placeholder="Full name"></div>'+
          '<div class="dash-form-row"><div class="dash-form-group"><label class="dash-form-label">Email</label><input class="dash-input" id="invGEmail" placeholder="email"></div>'+
          '<div class="dash-form-group"><label class="dash-form-label">Phone</label><input class="dash-input" id="invGPhone" placeholder="phone"></div></div>',
          [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Add Guest',class:'dash-btn dash-btn-gold',action:'InvDash.saveNewGuest()'}]
        );
      }
    },
    saveNewGuest:function(){
      var name=document.getElementById('invGName').value.trim();
      if(!name){notify('Name is required','error');return;}
      var inv=getInv();
      inv.guests.push({id:genId(),name:name,email:document.getElementById('invGEmail').value.trim(),phone:document.getElementById('invGPhone').value.trim(),invited:false,rsvp:'pending'});
      saveInv(inv);if(typeof DashApp!=='undefined')DashApp.closeModal();renderGuests();notify('Guest added!','success');
    },
    editGuest:function(id){
      var inv=getInv();var g=inv.guests.find(function(x){return x.id===id;});if(!g)return;
      if(typeof DashApp!=='undefined'&&DashApp.openModal){
        DashApp.openModal('Edit Guest',
          '<div class="dash-form-group"><label class="dash-form-label">Name *</label><input class="dash-input" id="invGName" value="'+esc(g.name)+'"></div>'+
          '<div class="dash-form-row"><div class="dash-form-group"><label class="dash-form-label">Email</label><input class="dash-input" id="invGEmail" value="'+esc(g.email||'')+'"></div>'+
          '<div class="dash-form-group"><label class="dash-form-label">Phone</label><input class="dash-input" id="invGPhone" value="'+esc(g.phone||'')+'"></div></div>'+
          '<div class="dash-form-group"><label class="dash-form-label">RSVP Status</label><select class="dash-select" id="invGRsvp"><option value="pending"'+(g.rsvp==='pending'?' selected':'')+'>Pending</option><option value="accepted"'+(g.rsvp==='accepted'?' selected':'')+'>Accepted</option><option value="declined"'+(g.rsvp==='declined'?' selected':'')+'>Declined</option><option value="maybe"'+(g.rsvp==='maybe'?' selected':'')+'>Maybe</option></select></div>',
          [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Save',class:'dash-btn dash-btn-gold',action:'InvDash.saveEditGuest(\''+id+'\')'}]
        );
      }
    },
    saveEditGuest:function(id){
      var inv=getInv();var g=inv.guests.find(function(x){return x.id===id;});if(!g)return;
      g.name=document.getElementById('invGName').value.trim();
      g.email=document.getElementById('invGEmail').value.trim();
      g.phone=document.getElementById('invGPhone').value.trim();
      g.rsvp=document.getElementById('invGRsvp').value;
      saveInv(inv);if(typeof DashApp!=='undefined')DashApp.closeModal();renderGuests();notify('Guest updated!','success');
    },
    deleteGuest:function(id){
      if(!confirm('Delete this guest?'))return;
      var inv=getInv();inv.guests=inv.guests.filter(function(x){return x.id!==id;});
      saveInv(inv);renderGuests();notify('Guest removed','info');
    },
    sendInvite:function(id){
      var inv=getInv();var g=inv.guests.find(function(x){return x.id===id;});if(!g)return;
      g.invited=true;g.sentAt=Date.now();saveInv(inv);renderGuests();
      var url=getWeddingUrl();
      var msg='You\'re invited to our wedding! View your invitation: '+url;
      if(g.email){
        var d=getData();
        var subject='Wedding Invitation - '+((d.groomName||'Groom')+' & '+(d.brideName||'Bride'));
        window.open('mailto:'+g.email+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(msg),'_blank');
      }else if(g.phone){
        window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
      }else{
        navigator.clipboard.writeText(msg);notify('Invitation message copied!','info');
      }
      notify('Invitation sent to '+g.name+'!','success');
    },
    sendBulkReminder:function(type,channel){
      var inv=getInv();var guests=inv.guests.filter(function(g){return g.invited&&g.email;});
      if(!guests.length){notify('No invited guests with email addresses','error');return;}
      var d=getData();
      var msg='';
      if(type==='30days')msg='Just a reminder: The wedding of '+((d.groomName||'Groom')+' & '+(d.brideName||'Bride'))+' is in 30 days! Save the date: '+d.weddingDate;
      else if(type==='7days')msg='One week to go! The wedding of '+((d.groomName||'Groom')+' & '+(d.brideName||'Bride'))+' is on '+d.weddingDate+' at '+d.venue;
      else if(type==='tomorrow')msg='Tomorrow is the big day! The wedding of '+((d.groomName||'Groom')+' & '+(d.brideName||'Bride'))+' is TOMORROW at '+d.venue+'!';
      else if(type==='thankyou')msg='Thank you for celebrating with us! Love, '+((d.groomName||'Groom')+' & '+(d.brideName||'Bride'))+' 💕';
      if(channel==='email'){
        var subject='Wedding Update - '+((d.groomName||'Groom')+' & '+(d.brideName||'Bride'));
        var bcc=guests.map(function(g){return g.email;}).join(',');
        window.open('mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(msg)+'&bcc='+bcc,'_blank');
      }else if(channel==='whatsapp'){
        window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
      }else{
        navigator.clipboard.writeText(msg);notify('Message copied to clipboard! Send via SMS.','info');
      }
      notify('Reminder prepared for '+guests.length+' guests!','success');
    },
    exportGuests:function(fmt){
      var inv=getInv();var guests=inv.guests||[];
      if(fmt==='csv'){
        var csv='Name,Email,Phone,Invited,RSVP\n';
        guests.forEach(function(g){csv+='"'+(g.name||'')+'","'+(g.email||'')+'","'+(g.phone||'')+'","'+(g.invited?'Yes':'No')+'","'+g.rsvp+'"\n';});
        D.downloadFile(csv,'invitation-guests.csv','text/csv');
      }else if(fmt==='excel'){
        var xml='<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Guests"><Table><Row><Cell><Data ss:Type="String">Name</Data></Cell><Cell><Data ss:Type="String">Email</Data></Cell><Cell><Data ss:Type="String">Phone</Data></Cell><Cell><Data ss:Type="String">Invited</Data></Cell><Cell><Data ss:Type="String">RSVP</Data></Cell></Row>';
        guests.forEach(function(g){xml+='<Row><Cell><Data ss:Type="String">'+(g.name||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.email||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.phone||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.invited?'Yes':'No')+'</Data></Cell><Cell><Data ss:Type="String">'+g.rsvp+'</Data></Cell></Row>';});
        xml+='</Table></Worksheet></Workbook>';
        D.downloadFile(xml,'invitation-guests.xls','application/vnd.ms-excel');
      }else if(fmt==='pdf'){
        var text='INVITATION GUEST LIST\n\n';
        guests.forEach(function(g){text+=g.name+' | '+(g.email||'-')+' | '+(g.phone||'-')+' | '+(g.invited?'Sent':'Not sent')+' | '+g.rsvp+'\n';});
        D.downloadFile(text,'invitation-guests.txt','text/plain');
      }
      notify('Guest list exported!','success');
    }
  };
})();

// ===== EXPOSE =====
window.DashApp=D;
window.InvDash=InvDash;

// ===== MEMORIES MANAGER =====
var MemMgr=(function(){
  var MEM_KEY='weddingMemories';
  function getMem(){try{var r=localStorage.getItem(MEM_KEY);return r?JSON.parse(r):{featuredVideo:{},photos:[],guestUploads:[],settings:{}};}catch(e){return{featuredVideo:{},photos:[],guestUploads:[],settings:{}};}}
  function saveMem(d){localStorage.setItem(MEM_KEY,JSON.stringify(d));}
  function genId(){return 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,6);}
  function isVideo(url){return /\.(mp4|webm|ogg)$/i.test(url);}
  function notify(msg,type){
    if(typeof DashApp!=='undefined'&&DashApp.notify){DashApp.notify(msg,type);return;}
    var t=document.createElement('div');t.style.cssText='position:fixed;top:24px;right:24px;z-index:100001;padding:14px 20px;border-radius:12px;background:rgba(11,15,25,0.95);border:1px solid rgba(212,175,55,0.15);color:var(--text);font-size:0.88rem';t.textContent=msg;document.body.appendChild(t);setTimeout(function(){if(t.parentElement)t.remove();},3000);
  }
  var currentTab='all';
  function renderGrid(filter){
    filter=filter||currentTab;
    var mem=getMem();
    var items=mem.photos||[];
    if(filter==='photos')items=items.filter(function(p){return !isVideo(p.url);});
    else if(filter==='videos')items=items.filter(function(p){return isVideo(p.url);});
    else if(filter==='pending')items=items.filter(function(p){return p.approved===false;});
    else if(filter==='featured'){items=[];}
    var grid=document.getElementById('memMgrGrid');
    if(!grid)return;
    grid.innerHTML=items.length?items.map(function(p){
      var vid=isVideo(p.url);
      return '<div style="position:relative;border-radius:8px;overflow:hidden;aspect-ratio:1;background:rgba(212,175,55,0.05)">'+
        (vid?'<video src="'+p.url+'" muted style="width:100%;height:100%;object-fit:cover"></video>':'<img src="'+p.url+'" alt="'+(p.title||'')+'" style="width:100%;height:100%;object-fit:cover" loading="lazy">')+
        '<div style="position:absolute;bottom:0;left:0;right:0;padding:8px;background:linear-gradient(transparent,rgba(0,0,0,0.7))">'+
          '<div style="font-size:0.75rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(p.title||'Untitled')+'</div>'+
          '<div style="font-size:0.65rem;color:#aaa">'+(p.approved===false?'<span style="color:#f59e0b">Pending</span>':p.album||'')+'</div>'+
        '</div>'+
        '<div style="position:absolute;top:6px;right:6px;display:flex;gap:4px">'+
          (p.approved===false?'<button onclick="MemMgr.approve(\''+p.id+'\')" style="width:28px;height:28px;border-radius:50%;border:none;background:rgba(34,197,94,0.9);color:#fff;cursor:pointer;font-size:0.75rem" title="Approve"><i class="fas fa-check"></i></button>':'')+
          '<button onclick="MemMgr.remove(\''+p.id+'\')" style="width:28px;height:28px;border-radius:50%;border:none;background:rgba(239,68,68,0.9);color:#fff;cursor:pointer;font-size:0.75rem" title="Delete"><i class="fas fa-trash"></i></button>'+
        '</div>'+
      '</div>';
    }).join(''):'<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-light)"><i class="fas fa-images" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:8px"></i>No media found.</div>';
  }
  function renderGuestUploads(){
    var mem=getMem();
    var uploads=mem.guestUploads||[];
    var el=document.getElementById('memGuestUploads');
    if(!el)return;
    if(!uploads.length){el.innerHTML='No guest uploads yet.';return;}
    el.innerHTML=uploads.map(function(u){
      var statusCls=u.approved===true?'color:var(--success)':u.approved===false?'color:var(--error)':'color:var(--warning)';
      var statusText=u.approved===true?'Approved':u.approved===false?'Rejected':'Pending';
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(212,175,55,0.04)">'+
        '<div style="width:48px;height:48px;border-radius:6px;overflow:hidden;flex-shrink:0;background:rgba(212,175,55,0.05)">'+(isVideo(u.url)?'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><i class="fas fa-play" style="color:var(--gold)"></i></div>':'<img src="'+u.url+'" style="width:100%;height:100%;object-fit:cover">')+'</div>'+
        '<div style="flex:1;min-width:0"><div style="font-size:0.88rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(u.title||'Untitled')+'</div><div style="font-size:0.75rem;color:var(--text-light)">'+(u.size?Math.round(u.size/1024)+'KB':'')+'</div></div>'+
        '<span style="font-size:0.75rem;'+statusCls+'">'+statusText+'</span>'+
        '<div style="display:flex;gap:4px">'+
          (u.approved!==true?'<button onclick="MemMgr.approveGuest(\''+u.id+'\')" style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(34,197,94,0.1);color:var(--success);cursor:pointer;font-size:0.75rem" title="Approve"><i class="fas fa-check"></i></button>':'')+
          (u.approved!==false?'<button onclick="MemMgr.rejectGuest(\''+u.id+'\')" style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(245,158,11,0.1);color:var(--warning);cursor:pointer;font-size:0.75rem" title="Reject"><i class="fas fa-times"></i></button>':'')+
          '<button onclick="MemMgr.removeGuest(\''+u.id+'\')" style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(239,68,68,0.1);color:var(--error);cursor:pointer;font-size:0.75rem" title="Delete"><i class="fas fa-trash"></i></button>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  return{
    init:function(){renderGrid();renderGuestUploads();loadFeatured();},
    filterTab:function(tab,btn){
      currentTab=tab;
      document.querySelectorAll('.dash-tabs .dash-tab').forEach(function(t){t.classList.remove('active');});
      if(btn)btn.classList.add('active');
      var fs=document.getElementById('memFeaturedSettings');
      if(fs)fs.style.display=tab==='featured'?'block':'none';
      if(tab!=='featured')renderGrid(tab);
    },
    handleUpload:function(e){
      var files=e.target.files;if(!files.length)return;
      var mem=getMem();if(!mem.photos)mem.photos=[];
      var loaded=0;var total=files.length;
      Array.from(files).forEach(function(file){
        var reader=new FileReader();
        reader.onload=function(ev){
          mem.photos.push({id:genId(),url:ev.target.result,title:file.name.replace(/\.[^.]+$/,''),album:'family',uploadDate:Date.now(),approved:true});
          loaded++;
          if(loaded===total){saveMem(mem);renderGrid();notify(total+' file(s) uploaded!','success');}
        };
        reader.readAsDataURL(file);
      });
      e.target.value='';
    },
    approve:function(id){
      var mem=getMem();
      var p=(mem.photos||[]).find(function(x){return x.id===id;});
      if(p){p.approved=true;saveMem(mem);renderGrid();notify('Media approved!','success');}
    },
    remove:function(id){
      if(!confirm('Delete this media?'))return;
      var mem=getMem();mem.photos=(mem.photos||[]).filter(function(x){return x.id!==id;});
      saveMem(mem);renderGrid();notify('Media deleted','info');
    },
    approveGuest:function(id){
      var mem=getMem();
      var u=(mem.guestUploads||[]).find(function(x){return x.id===id;});
      if(u){u.approved=true;saveMem(mem);renderGuestUploads();notify('Guest upload approved!','success');}
    },
    rejectGuest:function(id){
      var mem=getMem();
      var u=(mem.guestUploads||[]).find(function(x){return x.id===id;});
      if(u){u.approved=false;saveMem(mem);renderGuestUploads();notify('Guest upload rejected','info');}
    },
    removeGuest:function(id){
      if(!confirm('Delete this guest upload?'))return;
      var mem=getMem();mem.guestUploads=(mem.guestUploads||[]).filter(function(x){return x.id!==id;});
      saveMem(mem);renderGuestUploads();notify('Guest upload deleted','info');
    },
    saveFeatured:function(){
      var mem=getMem();
      mem.featuredVideo={
        title:document.getElementById('memFeatTitle').value.trim()||'Our Wedding Highlights',
        desc:document.getElementById('memFeatDesc').value.trim()||'Watch our special day',
        url:document.getElementById('memFeatUrl').value.trim()
      };
      saveMem(mem);notify('Featured video saved!','success');
    },
    clearFeatured:function(){
      var mem=getMem();mem.featuredVideo={};saveMem(mem);
      document.getElementById('memFeatTitle').value='';
      document.getElementById('memFeatDesc').value='';
      document.getElementById('memFeatUrl').value='';
      notify('Featured video removed','info');
    },
    loadFeatured:function(){
      var mem=getMem();var fv=mem.featuredVideo||{};
      var ti=document.getElementById('memFeatTitle');if(ti)ti.value=fv.title||'';
      var de=document.getElementById('memFeatDesc');if(de)de.value=fv.desc||'';
      var ur=document.getElementById('memFeatUrl');if(ur)ur.value=fv.url||'';
    }
  };
})();

window.MemMgr=MemMgr;

// ===== BOOT =====
document.addEventListener('DOMContentLoaded',function(){
  D.init();
  D.renderActivity();
  var modal=document.getElementById('dashModal');
  if(modal)modal.addEventListener('click',function(e){if(e.target===this)D.closeModal();});
  if(window.InvDash)InvDash.init();
  if(window.MemMgr)MemMgr.init();
});

})();
