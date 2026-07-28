/**
 * Media Library Module
 * Manage wedding photos, albums, and media uploads
 */
(function(){
  'use strict';
  var W=window.__WEDDING_MEDIA=window.__WEDDING_MEDIA||{};
  if(W.initialized)return;
  W.initialized=true;

  var STORAGE_KEY='weddingMedia';
  var MAX_FILE_SIZE=5*1024*1024;
  var ALLOWED_TYPES=['image/jpeg','image/png','image/gif','image/webp','image/svg+xml','video/mp4','video/webm'];

  function getMedia(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch(e){return[];}
  }
  function saveMedia(m){localStorage.setItem(STORAGE_KEY,JSON.stringify(m));}

  W.getAll=function(){return getMedia();};
  W.getByAlbum=function(album){
    return getMedia().filter(function(m){return m.album===album;});
  };
  W.getAlbums=function(){
    var media=getMedia();
    var albums={};
    media.forEach(function(m){
      if(!albums[m.album])albums[m.album]={name:m.album,count:0,cover:m.thumbnail||m.url};
      albums[m.album].count++;
    });
    return Object.values(albums);
  };

  W.upload=function(file,options){
    return new Promise(function(resolve,reject){
      if(!file){reject(new Error('No file'));return;}
      if(file.size>MAX_FILE_SIZE){reject(new Error('File too large (max 5MB)'));return;}
      if(ALLOWED_TYPES.indexOf(file.type)===-1){reject(new Error('Unsupported file type'));return;}

      var reader=new FileReader();
      reader.onload=function(e){
        var entry={
          id:'media_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
          name:file.name,
          type:file.type,
          size:file.size,
          url:e.target.result,
          thumbnail:createThumbnail(e.target.result),
          album:(options&&options.album)||'General',
          caption:(options&&options.caption)||'',
          tags:(options&&options.tags)||[],
          uploadedAt:new Date().toISOString(),
          favorite:false
        };
        var media=getMedia();
        media.push(entry);
        saveMedia(media);
        if(window.AuditLog)window.AuditLog.recordMediaUpload(file.name+' ('+Math.round(file.size/1024)+'KB)');
        resolve(entry);
      };
      reader.onerror=function(){reject(new Error('Failed to read file'));};
      reader.readAsDataURL(file);
    });
  };

  W.uploadMultiple=function(files,options){
    var promises=[];
    for(var i=0;i<files.length;i++){
      promises.push(W.upload(files[i],options));
    }
    return Promise.all(promises);
  };

  W.update=function(id,updates){
    var media=getMedia();
    var idx=media.findIndex(function(m){return m.id===id;});
    if(idx===-1)return null;
    Object.keys(updates).forEach(function(k){media[idx][k]=updates[k];});
    saveMedia(media);
    return media[idx];
  };

  W.delete=function(id){
    var media=getMedia().filter(function(m){return m.id!==id;});
    saveMedia(media);
    return true;
  };

  W.deleteMultiple=function(ids){
    var idSet=new Set(ids);
    var media=getMedia().filter(function(m){return!idSet.has(m.id);});
    saveMedia(media);
    return true;
  };

  W.toggleFavorite=function(id){
    var media=getMedia();
    var item=media.find(function(m){return m.id===id;});
    if(!item)return null;
    item.favorite=!item.favorite;
    saveMedia(media);
    return item;
  };

  W.search=function(query){
    var media=getMedia();
    var q=(query||'').toLowerCase();
    return media.filter(function(m){
      return m.name.toLowerCase().indexOf(q)!==-1||
             (m.caption||'').toLowerCase().indexOf(q)!==-1||
             m.album.toLowerCase().indexOf(q)!==-1||
             (m.tags||[]).some(function(t){return t.toLowerCase().indexOf(q)!==-1;});
    });
  };

  W.getStats=function(){
    var media=getMedia();
    var totalSize=media.reduce(function(sum,m){return sum+(m.size||0);},0);
    return{
      total:media.length,
      images:media.filter(function(m){return m.type&&m.type.indexOf('image')===0;}).length,
      videos:media.filter(function(m){return m.type&&m.type.indexOf('video')===0;}).length,
      favorites:media.filter(function(m){return m.favorite;}).length,
      albums:W.getAlbums().length,
      totalSize:totalSize,
      totalSizeFormatted:formatSize(totalSize)
    };
  };

  W.exportData=function(){
    var media=getMedia().map(function(m){
      return{id:m.id,name:m.name,type:m.type,size:m.size,album:m.album,caption:m.caption,tags:m.tags,favorite:m.favorite,uploadedAt:m.uploadedAt};
    });
    var blob=new Blob([JSON.stringify(media,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='media-catalog.json';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  W.renderMediaPanel=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    var stats=W.getStats();
    var albums=W.getAlbums();
    el.innerHTML='\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">\n'+
      '    <h3 style="font-family:Playfair Display,serif;color:#D4AF37"><i class="fas fa-photo-video" style="margin-right:8px"></i>Media Library</h3>\n'+
      '    <div style="display:flex;gap:8px">\n'+
      '      <button onclick="document.getElementById(\'mediaFileInput\').click()" style="padding:8px 14px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:8px;color:#0B0F19;font-weight:600;cursor:pointer;font-size:0.8rem"><i class="fas fa-upload" style="margin-right:4px"></i>Upload</button>\n'+
      '      <button onclick="WeddingMedia.exportData()" style="padding:8px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.15);border-radius:8px;color:#D4AF37;cursor:pointer;font-size:0.8rem"><i class="fas fa-download"></i></button>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <input type="file" id="mediaFileInput" multiple accept="image/*,video/mp4,video/webm" style="display:none" onchange="WeddingMedia.handleUpload(this.files)">\n'+
      '  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">\n'+
      '    <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.02);border-radius:10px"><div style="font-size:1.2rem;color:#D4AF37;font-weight:600">'+stats.total+'</div><div style="font-size:0.7rem;color:#A09888">Total Files</div></div>\n'+
      '    <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.02);border-radius:10px"><div style="font-size:1.2rem;color:#4CAF50;font-weight:600">'+stats.albums+'</div><div style="font-size:0.7rem;color:#A09888">Albums</div></div>\n'+
      '    <div style="text-align:center;padding:12px;background:rgba(255,255,255,0.02);border-radius:10px"><div style="font-size:1.2rem;color:#FF9800;font-weight:600">'+stats.totalSizeFormatted+'</div><div style="font-size:0.7rem;color:#A09888">Storage Used</div></div>\n'+
      '  </div>\n'+
      '  <div id="mediaAlbums">'+(albums.length===0?'<p style="color:#666;font-size:0.85rem;text-align:center;padding:16px">No media uploaded yet</p>':albums.map(function(a){
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:rgba(255,255,255,0.02);border-radius:8px;margin-bottom:6px"><div><span style="color:#E8E0D0;font-size:0.85rem">'+escapeHTML(a.name)+'</span><span style="color:#666;font-size:0.75rem;margin-left:8px">'+a.count+' files</span></div></div>';
      }).join(''))+'</div>\n'+
      '  <div id="mediaGrid" style="margin-top:16px"></div>\n'+
      '</div>\n';
  };

  W.handleUpload=function(files){
    if(!files||!files.length)return;
    var count=0;
    Array.from(files).forEach(function(f){
      W.upload(f).then(function(){count++;}).catch(function(e){if(typeof notify==='function')notify('Upload failed: '+e.message,'error');});
    });
    setTimeout(function(){
      if(count>0&&typeof notify==='function')notify(count+' file(s) uploaded!','success');
      W.renderMediaPanel(document.getElementById('mediaGrid').parentElement.parentElement.id||'mediaPanel');
    },1000);
  };

  function createThumbnail(dataUrl){
    return dataUrl;
  }
  function formatSize(bytes){
    if(bytes===0)return'0 B';
    var units=['B','KB','MB','GB'];
    var i=Math.floor(Math.log(bytes)/Math.log(1024));
    return Math.round(bytes/Math.pow(1024,i))+' '+units[i];
  }
  function escapeHTML(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  window.WeddingMedia=W;
  // Media Library initialized
})();
