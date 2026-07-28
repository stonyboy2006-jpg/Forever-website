/**
 * Backup & Restore Module
 * Export all wedding data as JSON, restore from backup, auto-backup reminder
 */
(function(){
  'use strict';
  var W=window.__WEDDING_BACKUP=window.__WEDDING_BACKUP||{};
  if(W.initialized)return;
  W.initialized=true;

  var BACKUP_META_KEY='weddingBackupMeta';
  var AUTO_BACKUP_KEY='weddingAutoBackup';
  var MAX_AUTO_BACKUPS=5;

  function getAllData(){
    var data={version:'2.0',exportDate:new Date().toISOString(),source:'ForeverAndAlways Backup'};
    var keys=['weddingData','weddingGuests','weddingGuestBook','weddingRSVPs','weddingLayoutSettings',
              'weddingInvitationCustomization','weddingScheduleData','weddingReminders','weddingMedia',
              'weddingAuditLog','weddingErrorLogs','weddingMaintenance','weddingProfile',
              'weddingNotifications','weddingFavorites','weddingVisitorData','weddingTimeline',
              'weddingMoments','weddingSeatingChart','weddingAccommodationData','weddingTransportData',
              'weddingFAQData','weddingMusicPlaylist'];
    keys.forEach(function(k){
      try{var v=localStorage.getItem(k);if(v)data[k]=JSON.parse(v);}catch(e){}
    });
    data._rawKeys={};
    keys.forEach(function(k){try{var v=localStorage.getItem(k);if(v)data._rawKeys[k]=v;}catch(e){}});
    return data;
  }

  W.exportFull=function(format){
    var data=getAllData();
    var content=format==='compact'?JSON.stringify(data):JSON.stringify(data,null,2);
    var filename='wedding-backup-'+formatDateForFile(new Date())+'.'+(format==='csv'?'json':'json');
    downloadFile(content,filename,'application/json');
    var meta={lastBackup:new Date().toISOString(),format:format||'full',size:content.length};
    localStorage.setItem(BACKUP_META_KEY,JSON.stringify(meta));
    if(window.AuditLog)window.AuditLog.recordBackup('Full backup exported ('+Math.round(content.length/1024)+'KB)');
    return meta;
  };

  W.exportCSV=function(){
    var data=getAllData();
    var rows=[];
    rows.push(['Key','Type','Size','Preview']);
    Object.keys(data).forEach(function(k){
      if(k==='version'||k==='exportDate'||k==='source'||k==='_rawKeys')return;
      var v=typeof data[k]==='string'?data[k]:JSON.stringify(data[k]);
      rows.push([k,typeof data[k],String(v.length),v.substring(0,100)]);
    });
    var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    downloadFile(csv,'wedding-backup-'+formatDateForFile(new Date())+'.csv','text/csv');
  };

  W.importFromFile=function(file,callback){
    if(!file){if(callback)callback(new Error('No file selected'));return;}
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var data=JSON.parse(e.target.result);
        var count=0;
        Object.keys(data).forEach(function(k){
          if(k==='version'||k==='exportDate'||k==='source'||k==='_rawKeys')return;
          var val=typeof data[k]==='string'?data[k]:JSON.stringify(data[k]);
          try{localStorage.setItem(k,val);count++;}catch(ex){}
        });
        if(data._rawKeys){
          Object.keys(data._rawKeys).forEach(function(k){
            try{localStorage.setItem(k,data._rawKeys[k]);count++;}catch(ex){}
          });
        }
        if(window.AuditLog)window.AuditLog.recordRestore('Data restored from backup: '+count+' keys');
        if(callback)callback(null,{count:count,keys:Object.keys(data)});
      }catch(err){
        if(window.ErrorLogger)window.ErrorLogger.logClientError('Backup restore failed: '+err.message);
        if(callback)callback(err);
      }
    };
    reader.onerror=function(){if(callback)callback(new Error('Failed to read file'));};
    reader.readAsText(file);
  };

  W.autoBackup=function(){
    var now=Date.now();
    var lastAuto=parseInt(localStorage.getItem(AUTO_BACKUP_KEY)||'0',10);
    var interval=24*60*60*1000;
    if(now-lastAuto<interval)return null;
    var data=getAllData();
    var key='weddingAutoBackup_'+formatDateForFile(new Date());
    try{localStorage.setItem(key,JSON.stringify(data));}catch(e){}
    var backups=getAutoBackupList();
    if(backups.length>MAX_AUTO_BACKUPS){
      var oldest=backups[0];
      try{localStorage.removeItem('weddingAutoBackup_'+oldest.date);}catch(e){}
    }
    localStorage.setItem(AUTO_BACKUP_KEY,String(now));
    return{key:key,timestamp:now};
  };

  W.getAutoBackupList=function(){return getAutoBackupList();};
  function getAutoBackupList(){
    var list=[];
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k&&k.indexOf('weddingAutoBackup_')===0&&k!=='weddingAutoBackup'){
        try{
          var d=JSON.parse(localStorage.getItem(k));
          list.push({key:k,date:k.replace('weddingAutoBackup_',''),exportDate:d.exportDate,size:JSON.stringify(d).length});
        }catch(e){}
      }
    }
    return list.sort(function(a,b){return a.date>b.date?1:-1;});
  }

  W.restoreAutoBackup=function(key){
    try{
      var raw=localStorage.getItem(key);
      if(!raw)return false;
      var data=JSON.parse(raw);
      Object.keys(data).forEach(function(k){
        if(k==='version'||k==='exportDate'||k==='source'||k==='_rawKeys')return;
        try{localStorage.setItem(k,typeof data[k]==='string'?data[k]:JSON.stringify(data[k]));}catch(e){}
      });
      if(window.AuditLog)window.AuditLog.recordRestore('Auto-backup restored: '+key);
      return true;
    }catch(e){return false;}
  };

  W.deleteAutoBackup=function(key){
    try{localStorage.removeItem(key);return true;}catch(e){return false;}
  };

  W.getMeta=function(){
    try{return JSON.parse(localStorage.getItem(BACKUP_META_KEY)||'{}');}catch(e){return{};}
  };

  W.renderBackupPanel=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    var meta=W.getMeta();
    var autoBackups=getAutoBackupList();
    el.innerHTML='\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '  <h3 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:16px"><i class="fas fa-cloud-upload-alt" style="margin-right:8px"></i>Backup & Restore</h3>\n'+
      '  <div style="margin-bottom:20px">\n'+
      '    <p style="color:#A09888;font-size:0.85rem;margin-bottom:12px">Last backup: '+(meta.lastBackup?new Date(meta.lastBackup).toLocaleString():'Never')+'</p>\n'+
      '    <div style="display:flex;gap:12px;flex-wrap:wrap">\n'+
      '      <button onclick="WeddingBackup.exportFull()" style="flex:1;min-width:140px;padding:12px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-download" style="margin-right:6px"></i>Export Full Backup</button>\n'+
      '      <button onclick="WeddingBackup.exportCSV()" style="flex:1;min-width:140px;padding:12px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:10px;color:#D4AF37;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-file-csv" style="margin-right:6px"></i>Export CSV</button>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <div style="margin-bottom:20px">\n'+
      '    <label style="display:block;font-size:0.8rem;color:#A09888;margin-bottom:8px">Restore from Backup</label>\n'+
      '    <div style="display:flex;gap:8px">\n'+
      '      <input type="file" id="backupFile" accept=".json" style="flex:1;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem">\n'+
      '      <button onclick="WeddingBackup.handleImport()" style="padding:10px 20px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:10px;color:#D4AF37;cursor:pointer"><i class="fas fa-upload"></i></button>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <div>\n'+
      '    <h4 style="color:#C0B090;font-size:0.85rem;margin-bottom:10px"><i class="fas fa-clock" style="margin-right:6px"></i>Auto-Backups ('+autoBackups.length+'/'+MAX_AUTO_BACKUPS+')</h4>\n'+
      '    <div id="autoBackupList">'+(autoBackups.length===0?'<p style="color:#666;font-size:0.8rem">No auto-backups yet</p>':'')+'</div>\n'+
      '  </div>\n'+
      '</div>\n';
    var listEl=document.getElementById('autoBackupList');
    autoBackups.forEach(function(b){
      var div=document.createElement('div');
      div.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;margin-bottom:6px';
      div.innerHTML='<div><span style="color:#A09888;font-size:0.8rem">'+b.date+'</span><span style="color:#666;font-size:0.75rem;margin-left:8px">'+Math.round(b.size/1024)+'KB</span></div>'+
        '<div style="display:flex;gap:6px"><button onclick="WeddingBackup.restoreAutoBackup(\''+b.key+'\')" style="padding:4px 10px;background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.2);border-radius:6px;color:#4CAF50;cursor:pointer;font-size:0.75rem"><i class="fas fa-undo"></i></button>'+
        '<button onclick="WeddingBackup.deleteAutoBackup(\''+b.key+'\');WeddingBackup.renderBackupPanel(\''+containerId+'\')" style="padding:4px 10px;background:rgba(244,67,54,0.1);border:1px solid rgba(244,67,54,0.2);border-radius:6px;color:#F44336;cursor:pointer;font-size:0.75rem"><i class="fas fa-trash"></i></button></div>';
      listEl.appendChild(div);
    });
  };

  W.handleImport=function(){
    var file=document.getElementById('backupFile');
    if(!file||!file.files[0]){if(typeof notify==='function')notify('Select a backup file first','warning');return;}
    if(!confirm('This will overwrite your current wedding data. Continue?'))return;
    W.importFromFile(file.files[0],function(err,result){
      if(err){if(typeof notify==='function')notify('Import failed: '+err.message,'error');return;}
      if(typeof notify==='function')notify('Restored '+result.count+' settings from backup!','success');
      setTimeout(function(){location.reload();},1500);
    });
  };

  function downloadFile(content,filename,type){
    var blob=new Blob([content],{type:type});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function formatDateForFile(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

  window.WeddingBackup=W;
  // Backup & Restore initialized
})();
