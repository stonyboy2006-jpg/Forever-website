/**
 * Audit Log — Client-Side Action Recording
 * Records login, logout, setup changes, RSVP changes, settings changes
 */
(function(){
  'use strict';
  var W=window.__WEDDING_AUDIT_LOG=window.__WEDDING_AUDIT_LOG||{};
  if(W.initialized)return;
  W.initialized=true;

  var STORAGE_KEY='weddingAuditLog';
  var MAX_LOGS=1000;

  function getLogs(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch(e){return[];}
  }
  function saveLogs(logs){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(logs.slice(-MAX_LOGS)));}catch(e){}
  }
  function getClientInfo(){
    return{
      userAgent:navigator.userAgent||'',
      platform:navigator.platform||'',
      language:navigator.language||'',
      screenSize:(screen.width||0)+'x'+(screen.height||0),
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||''
    };
  }
  function getUserInfo(){
    try{
      var s=localStorage.getItem('weddingAuthSession');
      if(s){var sess=JSON.parse(s);return{name:sess.name||'Unknown',email:sess.email||''};}
    }catch(e){}
    return{name:'Anonymous',email:''};
  }

  function record(action,detail,category){
    var user=getUserInfo();
    var entry={
      id:'audit_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
      user:user.name,
      email:user.email,
      action:action||'unknown',
      detail:detail||'',
      category:category||'general',
      clientInfo:getClientInfo(),
      timestamp:Date.now(),
      date:new Date().toISOString()
    };
    var logs=getLogs();
    logs.push(entry);
    saveLogs(logs);
    return entry;
  }

  W.record=function(action,detail,category){return record(action,detail,category);};
  W.recordLogin=function(){return record('login','User logged in','auth');};
  W.recordLogout=function(){return record('logout','User logged out','auth');};
  W.recordSetupChange=function(detail){return record('setup_change',detail||'Wedding setup updated','setup');};
  W.recordWeddingUpdate=function(detail){return record('wedding_update',detail||'Wedding info updated','wedding');};
  W.recordRSVPChange=function(detail){return record('rsvp_change',detail||'RSVP modified','rsvp');};
  W.recordGuestDeletion=function(detail){return record('guest_deletion',detail||'Guest removed','guests');};
  W.recordMediaUpload=function(detail){return record('media_upload',detail||'Media uploaded','media');};
  W.recordSettingsChange=function(detail){return record('settings_change',detail||'Settings modified','settings');};
  W.recordBackup=function(detail){return record('backup',detail||'Backup created','backup');};
  W.recordRestore=function(detail){return record('restore',detail||'Data restored','backup');};
  W.recordProfileUpdate=function(detail){return record('profile_update',detail||'Profile updated','profile');};
  W.recordPasswordChange=function(){return record('password_change','Password changed','security');};
  W.recordMaintenanceToggle=function(detail){return record('maintenance_toggle',detail||'Maintenance mode toggled','system');};

  W.getLogs=function(category){
    var logs=getLogs();
    if(category)logs=logs.filter(function(l){return l.category===category;});
    return logs.sort(function(a,b){return b.timestamp-a.timestamp;});
  };
  W.getStats=function(){
    var logs=getLogs();
    var stats={total:logs.length,byCategory:{},byUser:{}};
    logs.forEach(function(l){
      stats.byCategory[l.category]=(stats.byCategory[l.category]||0)+1;
      stats.byUser[l.user]=(stats.byUser[l.user]||0)+1;
    });
    return stats;
  };
  W.searchLogs=function(query){
    var logs=getLogs();
    var q=(query||'').toLowerCase();
    return logs.filter(function(l){
      return l.action.toLowerCase().indexOf(q)!==-1||
             (l.detail||'').toLowerCase().indexOf(q)!==-1||
             l.user.toLowerCase().indexOf(q)!==-1;
    });
  };
  W.exportLogs=function(format){
    var logs=getLogs();
    if(format==='csv'){
      var csv='ID,User,Email,Action,Detail,Category,Date,IP\n';
      logs.forEach(function(l){
        csv+='"'+l.id+'","'+l.user+'","'+l.email+'","'+l.action+'","'+(l.detail||'').replace(/"/g,'""')+'","'+l.category+'","'+l.date+'",""\n';
      });
      downloadFile(csv,'audit-log.csv','text/csv');
    }else{
      downloadFile(JSON.stringify(logs,null,2),'audit-log.json','application/json');
    }
  };
  W.clearLogs=function(){saveLogs([]);};
  W.deleteLog=function(id){
    var logs=getLogs().filter(function(l){return l.id!==id;});
    saveLogs(logs);
  };

  function downloadFile(content,filename,type){
    var blob=new Blob([content],{type:type});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download=filename;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.AuditLog=W;
  // Audit Log initialized
})();
