/**
 * Wedding Music Library & Player
 */
(function(){
'use strict';

var DB_KEY='weddingData';
var MUSIC_KEY='weddingMusic';
var audio=null;
var currentTrack=null;
var isPlaying=false;
var isShuffle=false;
var repeatMode=0;
var playlist=[];
var currentIndex=-1;
var volume=0.7;
var isMuted=false;

function getData(){try{var r=localStorage.getItem(DB_KEY);return r?JSON.parse(r):{};}catch(e){return{};}}
function saveData(d){localStorage.setItem(DB_KEY,JSON.stringify(d));}
function getMusicSettings(){try{var r=localStorage.getItem(MUSIC_KEY);return r?JSON.parse(r):getDefaultSettings();}catch(e){return getDefaultSettings();}}
function saveMusicSettings(s){localStorage.setItem(MUSIC_KEY,JSON.stringify(s));}
function getDefaultSettings(){return{enabled:false,volume:0.7,loop:true,fadeIn:true,fadeOut:true,selectedTrack:null,customTracks:[]};}
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmt(s){if(!s||isNaN(s))return'0:00';var m=Math.floor(s/60);var sec=Math.floor(s%60);return m+':'+(sec<10?'0':'')+sec;}

var TRACKS=[
  {id:'romantic-1',title:'Instrumental Love Theme',artist:'Elegant Strings',category:'romantic',duration:'3:45',src:''},
  {id:'romantic-2',title:'Piano Love Melody',artist:'Gentle Keys',category:'romantic',duration:'4:12',src:''},
  {id:'romantic-3',title:'Romantic Strings',artist:'Wedding Orchestra',category:'romantic',duration:'3:58',src:''},
  {id:'romantic-4',title:'Soft Love Ballad',artist:'Acoustic Dreams',category:'romantic',duration:'4:30',src:''},
  {id:'classical-1',title:'Canon in D (Instrumental)',artist:'Pachelbel Collection',category:'classical',duration:'5:15',src:''},
  {id:'classical-2',title:'Wedding Processional',artist:'Ceremony Classics',category:'classical',duration:'3:22',src:''},
  {id:'classical-3',title:'Bridal Entrance Piano',artist:'Ivory Keys',category:'classical',duration:'4:05',src:''},
  {id:'classical-4',title:'String Quartet Collection',artist:'Harmony Ensemble',category:'classical',duration:'5:40',src:''},
  {id:'christian-1',title:'Instrumental Worship',artist:'Sacred Sounds',category:'christian',duration:'4:18',src:''},
  {id:'christian-2',title:'Soft Piano Hymns',artist:'Grace Notes',category:'christian',duration:'3:55',src:''},
  {id:'christian-3',title:'Contemporary Worship Instrumentals',artist:'Faithful Melodies',category:'christian',duration:'4:42',src:''},
  {id:'jazz-1',title:'Smooth Jazz Evening',artist:'Night Jazz Trio',category:'jazz',duration:'4:55',src:''},
  {id:'jazz-2',title:'Acoustic Guitar Lounge',artist:'Warm Tones',category:'jazz',duration:'3:48',src:''},
  {id:'jazz-3',title:'Piano Lounge',artist:'Evening Keys',category:'jazz',duration:'4:22',src:''},
  {id:'reception-1',title:'Upbeat Celebration',artist:'Party Orchestra',category:'reception',duration:'3:35',src:''},
  {id:'reception-2',title:'Light Dance Instrumentals',artist:'Dance Floor Band',category:'reception',duration:'4:10',src:''},
  {id:'reception-3',title:'Celebration Playlist',artist:'Joyful Ensemble',category:'reception',duration:'3:52',src:''}
];

var CATEGORIES=[
  {id:'all',label:'All Tracks',icon:'fa-music'},
  {id:'romantic',label:'Romantic',icon:'fa-heart'},
  {id:'classical',label:'Classical Wedding',icon:'fa-violin'},
  {id:'christian',label:'Christian Wedding',icon:'fa-cross'},
  {id:'jazz',label:'Jazz & Elegant',icon:'fa-martini-glass-empty'},
  {id:'reception',label:'Reception',icon:'fa-champagne-glasses'},
  {id:'custom',label:'My Uploads',icon:'fa-cloud-arrow-up'}
];

function getAllTracks(){
  var settings=getMusicSettings();
  var custom=(settings.customTracks||[]).map(function(t){t.custom=true;return t;});
  return TRACKS.concat(custom);
}

function getTracksByCategory(cat){
  var all=getAllTracks();
  if(cat==='all')return all;
  if(cat==='custom')return all.filter(function(t){return t.custom;});
  return all.filter(function(t){return t.category===cat;});
}

function initAudio(){
  if(audio){audio.pause();audio.removeEventListener('ended',onTrackEnd);audio.removeEventListener('timeupdate',onTimeUpdate);audio.removeEventListener('loadedmetadata',onMetadata);}
  audio=new Audio();
  audio.addEventListener('ended',onTrackEnd);
  audio.addEventListener('timeupdate',onTimeUpdate);
  audio.addEventListener('loadedmetadata',onMetadata);
  audio.volume=isMuted?0:volume;
}

function onTrackEnd(){
  if(repeatMode===1){audio.currentTime=0;audio.play();return;}
  var tracks=playlist.length?playlist:getAllTracks();
  if(isShuffle){playRandom(tracks);return;}
  if(currentIndex<tracks.length-1){playTrackByIndex(currentIndex+1,tracks);}
  else if(repeatMode===2){playTrackByIndex(0,tracks);}
  else{stopPlayback();}
}

function onTimeUpdate(){
  if(!audio||!currentTrack)return;
  var pct=audio.duration?(audio.currentTime/audio.duration*100):0;
  var bars=document.querySelectorAll('.np-bar-fill');
  bars.forEach(function(b){b.style.width=pct+'%';});
  var times=document.querySelectorAll('.np-current');
  times.forEach(function(t){t.textContent=fmt(audio.currentTime);});
}

function onMetadata(){
  var durs=document.querySelectorAll('.np-total');
  durs.forEach(function(d){d.textContent=fmt(audio.duration);});
}

function playTrack(track){
  if(!track||(!track.src&&!track.custom))return;
  initAudio();
  if(track.src){audio.src=track.src;}
  else if(track.url){audio.src=track.url;}
  else{return;}
  currentTrack=track;
  var settings=getMusicSettings();
  settings.selectedTrack=track.id;
  saveMusicSettings(settings);
  audio.play().then(function(){isPlaying=true;updateUI();}).catch(function(){isPlaying=false;updateUI();});
}

function playTrackByIndex(idx,tracks){
  tracks=tracks||playlist.length?playlist:getAllTracks();
  if(idx<0||idx>=tracks.length)return;
  currentIndex=idx;
  playTrack(tracks[idx]);
}

function playRandom(tracks){
  tracks=tracks||getAllTracks();
  var idx=Math.floor(Math.random()*tracks.length);
  playTrackByIndex(idx,tracks);
}

function togglePlay(){
  if(!audio||!currentTrack){
    var tracks=getAllTracks();
    if(tracks.length)playTrackByIndex(0,tracks);
    return;
  }
  if(isPlaying){audio.pause();isPlaying=false;}
  else{audio.play().then(function(){isPlaying=true;}).catch(function(){});}
  updateUI();
}

function stopPlayback(){
  if(audio){audio.pause();audio.currentTime=0;}
  isPlaying=false;currentTrack=null;currentIndex=-1;
  updateUI();
}

function playPrev(){
  var tracks=playlist.length?playlist:getAllTracks();
  if(isShuffle){playRandom(tracks);return;}
  var idx=currentIndex>0?currentIndex-1:tracks.length-1;
  playTrackByIndex(idx,tracks);
}

function playNext(){
  var tracks=playlist.length?playlist:getAllTracks();
  if(isShuffle){playRandom(tracks);return;}
  var idx=currentIndex<tracks.length-1?currentIndex+1:0;
  playTrackByIndex(idx,tracks);
}

function toggleShuffle(){isShuffle=!isShuffle;updateUI();}
function cycleRepeat(){repeatMode=(repeatMode+1)%3;updateUI();}

function setVolume(v){
  volume=v;isMuted=v===0;
  if(audio)audio.volume=v;
  updateVolumeUI();
}

function toggleMute(){
  isMuted=!isMuted;
  if(audio)audio.volume=isMuted?0:volume;
  updateVolumeUI();
}

function seekTo(pct){
  if(!audio||!audio.duration)return;
  audio.currentTime=pct*audio.duration;
}

function updateUI(){
  document.querySelectorAll('.track-play-btn').forEach(function(btn){
    var id=btn.dataset.trackId;
    var isCurrent=currentTrack&&currentTrack.id===id;
    btn.innerHTML=isCurrent&&isPlaying?'<i class="fas fa-pause"></i>':'<i class="fas fa-play"></i>';
  });
  document.querySelectorAll('.music-track').forEach(function(el){
    var id=el.dataset.trackId;
    var isCurrent=currentTrack&&currentTrack.id===id;
    el.classList.toggle('playing',isCurrent&&isPlaying);
  });
  var np=document.querySelector('.now-playing');
  if(np){np.classList.toggle('visible',!!currentTrack);}
  if(currentTrack){
    var titles=document.querySelectorAll('.np-title');
    titles.forEach(function(t){t.textContent=currentTrack.title;});
    var artists=document.querySelectorAll('.np-artist');
    artists.forEach(function(a){a.textContent=currentTrack.artist;});
  }
  var playBtn=document.querySelector('.np-btn.play');
  if(playBtn){playBtn.innerHTML=isPlaying?'<i class="fas fa-pause"></i>':'<i class="fas fa-play"></i>';}
  var shuffleBtn=document.querySelector('.np-shuffle');
  if(shuffleBtn)shuffleBtn.classList.toggle('active',isShuffle);
  var repeatBtn=document.querySelector('.np-repeat');
  if(repeatBtn){
    repeatBtn.classList.toggle('active',repeatMode>0);
    repeatBtn.innerHTML=repeatMode===1?'<i class="fas fa-repeat"></i><span style="position:absolute;bottom:2px;right:2px;font-size:0.5rem;font-weight:700">1</span>':repeatMode===2?'<i class="fas fa-repeat"></i>':'<i class="fas fa-repeat"></i>';
  }
  updateVolumeUI();
  updateFloatingPlayer();
}

function updateVolumeUI(){
  var sliders=document.querySelectorAll('.np-volume-slider');
  sliders.forEach(function(s){s.value=isMuted?0:volume;});
  var icons=document.querySelectorAll('.np-mute');
  icons.forEach(function(i){
    i.innerHTML=isMuted||volume===0?'<i class="fas fa-volume-xmark"></i>':volume<0.5?'<i class="fas fa-volume-low"></i>':'<i class="fas fa-volume-high"></i>';
  });
}

function updateFloatingPlayer(){
  var fm=document.querySelector('.floating-music');
  if(!fm)return;
  var settings=getMusicSettings();
  fm.classList.toggle('visible',settings.enabled&&!!currentTrack);
  if(currentTrack){
    fm.querySelector('.fm-title').textContent=currentTrack.title;
    fm.querySelector('.fm-artist').textContent=currentTrack.artist;
    fm.querySelector('.fm-art').classList.toggle('playing',isPlaying);
    fm.querySelector('.fm-play').innerHTML=isPlaying?'<i class="fas fa-pause"></i>':'<i class="fas fa-play"></i>';
  }
}

function renderTrackList(container,cat){
  var tracks=getTracksByCategory(cat);
  var settings=getMusicSettings();
  if(!tracks.length){
    container.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-light)"><i class="fas fa-music" style="font-size:2rem;opacity:0.3;margin-bottom:12px;display:block"></i>No tracks in this category.</div>';
    return;
  }
  container.innerHTML=tracks.map(function(t,i){
    var isSelected=settings.selectedTrack===t.id;
    var isCurrent=currentTrack&&currentTrack.id===t.id;
    var icon=t.custom?'fa-file-audio':CATEGORIES.find(function(c){return c.id===t.category;})?
      (t.category==='romantic'?'fa-heart':t.category==='classical'?'fa-violin':t.category==='christian'?'fa-cross':t.category==='jazz'?'fa-martini-glass-empty':'fa-champagne-glasses'):'fa-music';
    return '<div class="music-track'+(isCurrent&&isPlaying?' playing':'')+(isSelected?' selected':'')+'" data-track-id="'+t.id+'" onclick="MusicApp.playTrackById(\''+t.id+'\')">'+
      '<div class="music-track-num">'+(i+1)+'</div>'+
      '<div class="music-track-art"><i class="fas '+icon+'"></i><div class="eq"><span></span><span></span><span></span><span></span></div></div>'+
      '<div class="music-track-info"><div class="music-track-title">'+esc(t.title)+'</div><div class="music-track-artist">'+esc(t.artist)+'</div></div>'+
      '<span class="selected-badge"><i class="fas fa-check"></i> Selected</span>'+
      '<div class="music-track-duration">'+esc(t.duration||'')+'</div>'+
      '<div class="music-track-actions">'+
        '<button class="track-play-btn" data-track-id="'+t.id+'" onclick="event.stopPropagation();MusicApp.playTrackById(\''+t.id+'\')" aria-label="Play '+esc(t.title)+'"><i class="fas fa-play"></i></button>'+
        '<button class="select-btn" onclick="event.stopPropagation();MusicApp.selectTrack(\''+t.id+'\')" aria-label="Select as background music" title="Select as background"><i class="fas fa-'+(isSelected?'check':'plus')+'"></i></button>'+
      '</div></div>';
  }).join('');
}

function renderCategories(container){
  var settings=getMusicSettings();
  container.innerHTML=CATEGORIES.map(function(cat){
    var count=cat.id==='all'?getAllTracks().length:cat.id==='custom'?(settings.customTracks||[]).length:getTracksByCategory(cat.id).length;
    return '<button class="music-cat-btn'+(cat.id==='all'?' active':'')+'" data-cat="'+cat.id+'" onclick="MusicApp.filterCategory(\''+cat.id+'\')" aria-label="'+cat.label+'"><i class="fas '+cat.icon+'"></i> '+cat.label+'<span class="music-cat-count">'+count+'</span></button>';
  }).join('');
}

function selectTrack(id){
  var settings=getMusicSettings();
  settings.selectedTrack=id;
  saveMusicSettings(settings);
  document.querySelectorAll('.music-track').forEach(function(el){
    var isSel=el.dataset.trackId===id;
    el.classList.toggle('selected',isSel);
    var badge=el.querySelector('.selected-badge');
    if(badge)badge.style.display=isSel?'inline-flex':'none';
    var btn=el.querySelector('.select-btn i');
    if(btn)btn.className='fas fa-'+(isSel?'check':'plus');
  });
  showNotification('Background music updated!','success');
}

function playTrackById(id){
  var all=getAllTracks();
  var track=all.find(function(t){return t.id===id;});
  if(!track)return;
  if(!track.src&&!track.url){
    showNotification('This is a demo track. Upload your own music to play it!','info');
    return;
  }
  currentIndex=all.indexOf(track);
  playTrack(track);
}

function handleUpload(files){
  if(!files||!files.length)return;
  var settings=getMusicSettings();
  if(!settings.customTracks)settings.customTracks=[];
  var validTypes=['audio/mpeg','audio/wav','audio/ogg','audio/mp4','audio/x-m4a','audio/aac'];
  var maxSize=20*1024*1024;
  var loaded=0;
  var total=files.length;
  Array.from(files).forEach(function(file){
    if(!validTypes.some(function(t){return file.type===t||file.name.match(/\.(mp3|wav|ogg|m4a)$/i);})){
      showNotification('Unsupported format: '+file.name,'error');
      loaded++;return;
    }
    if(file.size>maxSize){
      showNotification('File too large: '+file.name+' (max 20MB)','error');
      loaded++;return;
    }
    var reader=new FileReader();
    reader.onload=function(ev){
      var id='custom-'+Date.now()+'-'+Math.random().toString(36).substr(2,6);
      settings.customTracks.push({
        id:id,title:file.name.replace(/\.[^.]+$/,''),artist:'Custom Upload',
        category:'custom',duration:'',src:ev.target.result,url:ev.target.result,custom:true
      });
      loaded++;
      if(loaded===total){
        saveMusicSettings(settings);
        showNotification(total+' track(s) uploaded!','success');
        if(typeof renderMusicPage==='function')renderMusicPage();
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeCustomTrack(id){
  var settings=getMusicSettings();
  settings.customTracks=(settings.customTracks||[]).filter(function(t){return t.id!==id;});
  if(settings.selectedTrack===id)settings.selectedTrack=null;
  saveMusicSettings(settings);
  if(currentTrack&&currentTrack.id===id)stopPlayback();
  showNotification('Track removed','info');
  if(typeof renderMusicPage==='function')renderMusicPage();
}

function saveMusicConfig(){
  var settings=getMusicSettings();
  settings.enabled=document.getElementById('musicEnabled')?document.getElementById('musicEnabled').classList.contains('active'):settings.enabled;
  settings.volume=document.getElementById('musicVolume')?parseFloat(document.getElementById('musicVolume').value):settings.volume;
  settings.loop=document.getElementById('musicLoop')?document.getElementById('musicLoop').checked:settings.loop;
  settings.fadeIn=document.getElementById('musicFadeIn')?document.getElementById('musicFadeIn').checked:settings.fadeIn;
  settings.fadeOut=document.getElementById('musicFadeOut')?document.getElementById('musicFadeOut').checked:settings.fadeOut;
  saveMusicSettings(settings);
  volume=settings.volume;
  if(audio){audio.volume=isMuted?0:volume;audio.loop=settings.loop;}
  showNotification('Music settings saved!','success');
}

function showNotification(msg,type){
  var existing=document.querySelector('.music-toast');
  if(existing)existing.remove();
  var t=document.createElement('div');
  t.className='music-toast';
  t.style.cssText='position:fixed;top:24px;right:24px;z-index:100001;padding:14px 20px;border-radius:12px;background:rgba(11,15,25,0.95);border:1px solid rgba(212,175,55,0.15);backdrop-filter:blur(20px);box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;align-items:center;gap:10px;font-size:0.88rem;color:var(--text);transform:translateX(120%);opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1)';
  var icons={success:'fa-check-circle',error:'fa-times-circle',info:'fa-info-circle',warning:'fa-exclamation-triangle'};
  var colors={success:'rgba(34,197,94,0.1)',error:'rgba(239,68,68,0.1)',info:'rgba(59,130,246,0.1)',warning:'rgba(245,158,11,0.1)'};
  var iconColors={success:'#22c55e',error:'#ef4444',info:'#3b82f6',warning:'#f59e0b'};
  t.innerHTML='<div style="width:28px;height:28px;border-radius:50%;background:'+colors[type]+';display:flex;align-items:center;justify-content:center"><i class="fas '+(icons[type]||icons.info)+'" style="color:'+(iconColors[type]||iconColors.info)+'"></i></div><span>'+msg+'</span>';
  document.body.appendChild(t);
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.style.transform='translateX(0)';t.style.opacity='1';});});
  setTimeout(function(){t.style.transform='translateX(120%)';t.style.opacity='0';setTimeout(function(){if(t.parentElement)t.remove();},400);},3000);
}

var M={
  init:function(){
    var settings=getMusicSettings();
    volume=settings.volume||0.7;
    isMuted=false;
    renderMusicPage();
    setupUploadZone();
    setupSettings();
  },
  filterCategory:function(cat){
    document.querySelectorAll('.music-cat-btn').forEach(function(b){b.classList.toggle('active',b.dataset.cat===cat);});
    var trackList=document.getElementById('musicTrackList');
    if(trackList)renderTrackList(trackList,cat);
  },
  playTrackById:playTrackById,
  selectTrack:selectTrack,
  togglePlay:togglePlay,
  playPrev:playPrev,
  playNext:playNext,
  toggleShuffle:toggleShuffle,
  cycleRepeat:cycleRepeat,
  setVolume:setVolume,
  toggleMute:toggleMute,
  seekTo:function(e){
    var bar=e.currentTarget;
    var rect=bar.getBoundingClientRect();
    var pct=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
    seekTo(pct);
  },
  removeCustomTrack:removeCustomTrack,
  saveMusicConfig:saveMusicConfig,
  toggleMusicEnabled:function(){
    var btn=document.getElementById('musicEnabled');
    if(!btn)return;
    btn.classList.toggle('active');
    var settings=getMusicSettings();
    settings.enabled=btn.classList.contains('active');
    saveMusicSettings(settings);
    if(!settings.enabled&&audio){stopPlayback();}
  }
};
window.MusicApp=M;

function renderMusicPage(){
  var container=document.getElementById('musicTrackList');
  var catContainer=document.getElementById('musicCategories');
  if(catContainer)renderCategories(catContainer);
  if(container)renderTrackList(container,'all');
}

function setupUploadZone(){
  var zone=document.getElementById('musicUploadZone');
  var input=document.getElementById('musicUploadInput');
  if(!zone||!input)return;
  zone.addEventListener('dragover',function(e){e.preventDefault();zone.classList.add('dragover');});
  zone.addEventListener('dragleave',function(){zone.classList.remove('dragover');});
  zone.addEventListener('drop',function(e){e.preventDefault();zone.classList.remove('dragover');handleUpload(e.dataTransfer.files);});
  input.addEventListener('change',function(e){handleUpload(e.target.files);e.target.value='';});
}

function setupSettings(){
  var settings=getMusicSettings();
  var toggle=document.getElementById('musicEnabled');
  if(toggle){settings.enabled?toggle.classList.add('active'):toggle.classList.remove('active');}
  var vol=document.getElementById('musicVolume');
  if(vol){vol.value=settings.volume||0.7;}
  var loop=document.getElementById('musicLoop');
  if(loop){loop.checked=settings.loop!==false;}
  var fadeIn=document.getElementById('musicFadeIn');
  if(fadeIn){fadeIn.checked=settings.fadeIn!==false;}
  var fadeOut=document.getElementById('musicFadeOut');
  if(fadeOut){fadeOut.checked=settings.fadeOut!==false;}
}

function initFloatingPlayer(){
  var settings=getMusicSettings();
  if(!settings.enabled||!settings.selectedTrack)return;
  var fm=document.querySelector('.floating-music');
  if(!fm)return;
  fm.classList.add('visible');
  fm.querySelector('.fm-play').addEventListener('click',function(e){e.stopPropagation();togglePlay();});
  fm.querySelector('.fm-next').addEventListener('click',function(e){e.stopPropagation();playNext();});
  fm.addEventListener('click',function(){window.location.href='music.html';});
}

function initNowPlayingBar(){
  var np=document.querySelector('.now-playing');
  if(!np)return;
  np.querySelector('.np-btn.play').addEventListener('click',togglePlay);
  np.querySelector('.np-prev').addEventListener('click',playPrev);
  np.querySelector('.np-next').addEventListener('click',playNext);
  var shuffleBtn=np.querySelector('.np-shuffle');
  if(shuffleBtn)shuffleBtn.addEventListener('click',toggleShuffle);
  var repeatBtn=np.querySelector('.np-repeat');
  if(repeatBtn)repeatBtn.addEventListener('click',cycleRepeat);
  var muteBtn=np.querySelector('.np-mute');
  if(muteBtn)muteBtn.addEventListener('click',toggleMute);
  var bar=np.querySelector('.np-bar');
  if(bar)bar.addEventListener('click',M.seekTo);
  var volSlider=np.querySelector('.np-volume-slider');
  if(volSlider){volSlider.addEventListener('input',function(){setVolume(parseFloat(this.value));});}
  var closeBtn=np.querySelector('.np-close');
  if(closeBtn)closeBtn.addEventListener('click',function(){stopPlayback();np.classList.remove('visible');});
}

document.addEventListener('DOMContentLoaded',function(){
  if(document.querySelector('.music-page')){M.init();}
  initNowPlayingBar();
  initFloatingPlayer();
  var settings=getMusicSettings();
  if(settings.selectedTrack){
    var all=getAllTracks();
    var track=all.find(function(t){return t.id===settings.selectedTrack;});
    if(track){currentTrack=track;updateUI();}
  }
});

})();
