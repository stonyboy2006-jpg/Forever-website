/**
 * Super Admin Panel Module
 * System-wide management, user overview, and administrative tools
 */
(function(){
  'use strict';
  var W=window.__WEDDING_ADMIN=window.__WEDDING_ADMIN||{};
  if(W.initialized)return;
  W.initialized=true;

  var ADMIN_KEY='weddingSuperAdmin';
  var ADMIN_HASH_KEY='weddingAdminHash';

  function getAdminConfig(){
    try{return JSON.parse(localStorage.getItem(ADMIN_KEY)||'{}');}catch(e){return{};}
  }
  function saveAdminConfig(c){localStorage.setItem(ADMIN_KEY,JSON.stringify(c));}

  async function hashPassword(password){
    var encoder=new TextEncoder();
    var data=encoder.encode(password+'wedding-salt-2024');
    var hashBuffer=await crypto.subtle.digest('SHA-256',data);
    var hashArray=Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }

  W.setAdminPassword=async function(newPassword){
    if(!newPassword||newPassword.length<8)return{success:false,error:'Password must be at least 8 characters'};
    var hash=await hashPassword(newPassword);
    localStorage.setItem(ADMIN_HASH_KEY,hash);
    return{success:true};
  };

  W.authenticate=async function(password){
    var storedHash=localStorage.getItem(ADMIN_HASH_KEY);
    if(!storedHash){
      var defaultHash=await hashPassword('WeddingAdmin2026!');
      if(await hashPassword(password)===defaultHash){
        localStorage.setItem(ADMIN_HASH_KEY,defaultHash);
      }else{
        if(window.ErrorLogger)window.ErrorLogger.logAuthFailure('Failed super admin login attempt');
        return false;
      }
    }else{
      var passwordHash=await hashPassword(password);
      if(passwordHash!==storedHash){
        if(window.ErrorLogger)window.ErrorLogger.logAuthFailure('Failed super admin login attempt');
        return false;
      }
    }
    var config=getAdminConfig();
    config.authenticated=true;
    config.authTime=new Date().toISOString();
    saveAdminConfig(config);
    if(window.AuditLog)window.AuditLog.record('admin_auth','Super admin authenticated','admin');
    return true;
  };

  W.isAuthenticated=function(){
    var config=getAdminConfig();
    if(!config.authenticated)return false;
    if(config.authTime){
      var elapsed=Date.now()-new Date(config.authTime).getTime();
      if(elapsed>30*60*1000){config.authenticated=false;saveAdminConfig(config);return false;}
    }
    return true;
  };

  W.logout=function(){
    var config=getAdminConfig();
    config.authenticated=false;
    saveAdminConfig(config);
  };

  W.getSystemOverview=function(){
    var overview={
      localStorage:getStorageOverview(),
      users:getUserOverview(),
      system:getSystemInfo(),
      features:getFeatureStatus(),
      security:getSecurityOverview(),
      performance:getPerformanceOverview()
    };
    return overview;
  };

  function getStorageOverview(){
    var total=0;var items={};
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        var v=localStorage.getItem(k);
        if(k&&v){total+=k.length+v.length;items[k]=v.length;}
      }
    }catch(e){}
    return{
      totalBytes:total*2,
      totalFormatted:formatSize(total*2),
      itemCount:localStorage.length,
      largestItems:Object.entries(items).sort(function(a,b){return b[1]-a[1];}).slice(0,10).map(function(e){return{name:e[0],size:formatSize(e[1]*2)};})
    };
  }

  function getUserOverview(){
    var session=null;
    try{session=JSON.parse(localStorage.getItem('weddingAuthSession')||'null');}catch(e){}
    var guests=[];
    try{guests=JSON.parse(localStorage.getItem('weddingGuests')||'[]');}catch(e){}
    return{
      owner:session?{name:session.name,email:session.email,role:session.role,setupComplete:session.setupComplete}:null,
      guestCount:guests.length,
      rsvps:guests.filter(function(g){return g.rsvpStatus==='attending';}).length,
      declined:guests.filter(function(g){return g.rsvpStatus==='declined';}).length
    };
  }

  function getSystemInfo(){
    return{
      platform:navigator.platform,
      userAgent:navigator.userAgent,
      cores:navigator.hardwareConcurrency||0,
      memory:navigator.deviceMemory||'unknown',
      language:navigator.language,
      cookieEnabled:navigator.cookieEnabled,
      serviceWorker:'serviceWorker' in navigator,
      offlineSupport:!!navigator.onLine,
      screenResolution:screen.width+'x'+screen.height,
      colorDepth:screen.colorDepth,
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  function getFeatureStatus(){
    var features=[
      {name:'Firebase Integration',enabled:typeof firebase!=='undefined'&&firebase.initializeApp,note:typeof firebase!=='undefined'?'Configured':'Placeholder only'},
      {name:'Service Worker',enabled:'serviceWorker' in navigator,note:navigator.serviceWorker?.controller?'Active':'Not active'},
      {name:'Push Notifications',enabled:'Notification' in window,note:'Notification' in window?Notification.permission:'Not supported'},
      {name:'Offline Storage',enabled:typeof localStorage!=='undefined',note:typeof localStorage!=='undefined'?'Available':'Unavailable'},
      {name:'Camera Access',enabled:!!navigator.mediaDevices,note:!!navigator.mediaDevices?'Supported':'Not supported'},
      {name:'Geolocation',enabled:'geolocation' in navigator,note:'geolocation' in navigator?'Available':'Unavailable'},
      {name:'Clipboard API',enabled:!!navigator.clipboard,note:!!navigator.clipboard?'Supported':'Not supported'},
      {name:'Web Share API',enabled:!!navigator.share,note:!!navigator.share?'Supported':'Not supported'}
    ];
    return features;
  }

  function getSecurityOverview(){
    var errors=window.ErrorLogger?window.ErrorLogger.getStats():{total:0};
    var audit=window.AuditLog?window.AuditLog.getStats():{total:0};
    var maint=window.WeddingMaintenance?window.WeddingMaintenance.isEnabled():false;
    return{
      totalErrors:errors.total,
      authFailures:errors.byType?errors.byType.auth_failure||0:0,
      totalAuditEntries:audit.total,
      maintenanceMode:maint,
      cspEnabled:!!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
      https:location.protocol==='https:'||location.hostname==='localhost'
    };
  }

  function getPerformanceOverview(){
    var perf=window.performance||{};
    var timing=perf.timing||{};
    return{
      loadTime:timing.loadEventEnd-timing.navigationStart||0,
      domReady:timing.domContentLoadedEventEnd-timing.navigationStart||0,
      resources:perf.getEntries?perf.getEntries().length:0
    };
  }

  W.runHealthCheck=function(){
    var issues=[];
    var wd={};try{wd=JSON.parse(localStorage.getItem('weddingData')||'{}');}catch(e){}
    if(!wd.groomName&&!wd.brideName)issues.push('No wedding couple data found');
    if(!wd.weddingDate)issues.push('No wedding date set');
    if(!wd.venue)issues.push('No venue specified');
    var users=[];try{users=JSON.parse(localStorage.getItem('weddingAuthUsers')||'[]');}catch(e){}
    if(!users.length)issues.push('No user accounts found');
    try{
      var guests=JSON.parse(localStorage.getItem('weddingGuests')||'[]');
      if(guests.length)issues.push(guests.length+' guest(s) in list');
    }catch(e){}
    try{
      var errs=JSON.parse(localStorage.getItem('weddingErrorLog')||'[]');
      if(errs.length>10)issues.push(errs.length+' logged errors (review needed)');
    }catch(e){}
    return issues.length?issues:['All systems healthy'];
  };

  W.clearAppCache=function(){
    var keys=['weddingData','weddingAuthSession','weddingAuthUsers','weddingGuests','weddingGallery',
      'weddingPalette','weddingNotifications','weddingActivity','_last_save_time',
      'weddingErrorLog','weddingAuditLog','weddingMaintenance','weddingBackups',
      'weddingCustomizer','weddingReminders','weddingMedia','weddingSuperAdmin'];
    var cleared=0;
    keys.forEach(function(k){
      try{if(localStorage.getItem(k)!==null){localStorage.removeItem(k);cleared++;}}catch(e){}
    });
    if(window.AuditLog)window.AuditLog.record('cache_clear','Cleared '+cleared+' app cache keys','admin');
    return cleared;
  };

  W.scanBrokenLinks=function(pages,callback){
    var results={checked:0,broken:0,links:[]};
    var toCheck=pages||['index.html','our-story.html','wedding-details.html','wedding-party.html',
      'events.html','gallery.html','timeline.html','rsvp.html','gift-registry.html',
      'faq.html','contact.html','planner.html','privacy.html','terms.html',
      'about.html','login.html','signup.html','profile.html','dashboard.html',
      'setup.html','invitation.html','ai-assistant.html','settings.html',
      'customize.html','reminders.html','media.html'];
    var idx=0;
    function checkNext(){
      if(idx>=toCheck.length){if(callback)callback(results);return;}
      var page=toCheck[idx++];
      var xhr=new XMLHttpRequest();
      xhr.open('HEAD',page,true);
      xhr.timeout=5000;
      xhr.onload=function(){
        results.checked++;
        if(xhr.status>=400){results.broken++;results.links.push({page:page,status:xhr.status});}
        checkNext();
      };
      xhr.onerror=function(){results.checked++;results.broken++;results.links.push({page:page,status:0});checkNext();};
      xhr.ontimeout=function(){results.checked++;results.broken++;results.links.push({page:page,status:0});checkNext();};
      xhr.send();
    }
    checkNext();
    return results;
  };

  W.renderAdminPanel=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    if(!W.isAuthenticated()){
      el.innerHTML='\n'+
        '<div style="max-width:400px;margin:60px auto;text-align:center">\n'+
        '  <div class="glass-card" style="padding:40px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
        '    <i class="fas fa-user-shield" style="font-size:2.5rem;color:#D4AF37;margin-bottom:16px"></i>\n'+
        '    <h2 style="font-family:Playfair Display,serif;color:#E8E0D0;margin-bottom:8px">Super Admin</h2>\n'+
        '    <p style="color:#A09888;font-size:0.85rem;margin-bottom:20px">Enter admin credentials to access the panel</p>\n'+
        '    <input id="adminPassInput" type="password" placeholder="Admin password" style="width:100%;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.9rem;margin-bottom:12px">\n'+
        '    <button onclick="WeddingAdmin.handleLogin()" style="width:100%;padding:12px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-lock" style="margin-right:6px"></i>Authenticate</button>\n'+
        '  </div>\n'+
        '</div>\n';
      return;
    }
    var overview=W.getSystemOverview();
    el.innerHTML='\n'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">\n'+
      '  <h2 style="font-family:Playfair Display,serif;color:#D4AF37"><i class="fas fa-user-shield" style="margin-right:8px"></i>Super Admin Dashboard</h2>\n'+
      '  <button onclick="WeddingAdmin.logout();WeddingAdmin.renderAdminPanel(\'adminRoot\')" style="padding:8px 16px;background:rgba(244,67,54,0.1);border:1px solid rgba(244,67,54,0.2);border-radius:8px;color:#F44336;cursor:pointer;font-size:0.85rem"><i class="fas fa-sign-out-alt" style="margin-right:4px"></i>Logout</button>\n'+
      '</div>\n'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">\n'+
      adminStatCard('Storage Used',overview.localStorage.totalFormatted,'fa-database','#FF9800')+
      adminStatCard('Guests',overview.users.guestCount,'fa-users','#4CAF50')+
      adminStatCard('Errors',overview.security.totalErrors,'fa-exclamation-triangle','#F44336')+
      adminStatCard('RSVPs',overview.users.rsvps,'fa-check-circle','#2196F3')+
      adminStatCard('Audit Entries',overview.security.totalAuditEntries,'fa-history','#9C27B0')+
      adminStatCard('Load Time',overview.performance.loadTime+'ms','fa-bolt','#00BCD4')+
      '</div>\n'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">\n'+
      '  <div class="glass-card" style="padding:20px;border-radius:14px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '    <h3 style="color:#D4AF37;font-size:0.9rem;margin-bottom:12px"><i class="fas fa-user" style="margin-right:6px"></i>Owner Account</h3>\n'+
      '    '+(overview.users.owner?'<p style="color:#E8E0D0;font-size:0.85rem">'+escapeHTML(overview.users.owner.name)+'</p><p style="color:#A09888;font-size:0.8rem">'+escapeHTML(overview.users.owner.email)+'</p><p style="color:#666;font-size:0.75rem">Setup: '+(overview.users.owner.setupComplete?'Complete':'Pending')+'</p>':'<p style="color:#666;font-size:0.85rem">No owner account found</p>')+
      '  </div>\n'+
      '  <div class="glass-card" style="padding:20px;border-radius:14px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '    <h3 style="color:#D4AF37;font-size:0.9rem;margin-bottom:12px"><i class="fas fa-shield-alt" style="margin-right:6px"></i>Security</h3>\n'+
      '    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.8rem">\n'+
      '      <span style="color:#666">HTTPS:</span><span style="color:'+(overview.security.https?'#4CAF50':'#F44336')+'">'+overview.security.https+'</span>\n'+
      '      <span style="color:#666">CSP:</span><span style="color:'+(overview.security.cspEnabled?'#4CAF50':'#F44336')+'">'+overview.security.cspEnabled+'</span>\n'+
      '      <span style="color:#666">Auth Failures:</span><span style="color:#FF9800">'+overview.security.authFailures+'</span>\n'+
      '      <span style="color:#666">Maintenance:</span><span style="color:'+(overview.security.maintenanceMode?'#F44336':'#4CAF50')+'">'+overview.security.maintenanceMode+'</span>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '</div>\n'+
      '  <div class="glass-card" style="padding:20px;border-radius:14px;border:1px solid rgba(212,175,55,0.08);margin-bottom:24px">\n'+
      '    <h3 style="color:#D4AF37;font-size:0.9rem;margin-bottom:12px"><i class="fas fa-puzzle-piece" style="margin-right:6px"></i>Feature Status</h3>\n'+
      '    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">\n'+
      overview.features.map(function(f){
        return '<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px">'+
          '<i class="fas '+(f.enabled?'fa-check-circle':'fa-times-circle')+'" style="color:'+(f.enabled?'#4CAF50':'#F44336')+'"></i>'+
          '<div><span style="color:#E8E0D0;font-size:0.82rem">'+f.name+'</span><span style="color:#666;font-size:0.72rem;margin-left:6px">'+f.note+'</span></div></div>';
      }).join('')+
      '    </div>\n'+
      '  </div>\n'+
      '  <div class="glass-card" style="padding:20px;border-radius:14px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '    <h3 style="color:#D4AF37;font-size:0.9rem;margin-bottom:12px"><i class="fas fa-database" style="margin-right:6px"></i>Storage Breakdown</h3>\n'+
      '    <div style="margin-bottom:12px">\n'+
      '      <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="color:#A09888;font-size:0.8rem">Used</span><span style="color:#E8E0D0;font-size:0.8rem">'+overview.localStorage.totalFormatted+'</span></div>\n'+
      '      <div style="width:100%;height:8px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden"><div style="width:'+Math.min(overview.localStorage.totalBytes/(5*1024*1024)*100,100)+'%;height:100%;background:linear-gradient(90deg,#D4AF37,#E8C4C0);border-radius:4px"></div></div>\n'+
      '    </div>\n'+
      '    <p style="color:#666;font-size:0.75rem">'+overview.localStorage.itemCount+' items in localStorage</p>\n'+
      '  </div>\n'+
      '  <div class="glass-card" style="padding:20px;border-radius:14px;border:1px solid rgba(212,175,55,0.08);margin-bottom:24px">\n'+
      '    <h3 style="color:#D4AF37;font-size:0.9rem;margin-bottom:12px"><i class="fas fa-tools" style="margin-right:6px"></i>Admin Tools</h3>\n'+
      '    <div style="display:flex;flex-wrap:wrap;gap:10px">\n'+
      '      <button onclick="WeddingAdmin.runHealthCheck();alert(\'Health check complete. Check console.\')" style="padding:10px 18px;background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.2);border-radius:8px;color:#4CAF50;cursor:pointer;font-size:0.82rem"><i class="fas fa-heartbeat" style="margin-right:6px"></i>Health Check</button>\n'+
      '      <button onclick="if(confirm(\'Clear all app cache? This will remove all stored wedding data.\')){var c=WeddingAdmin.clearAppCache();alert(\'Cleared \'+c+\' cache keys.\');WeddingAdmin.renderAdminPanel(\'adminRoot\')}" style="padding:10px 18px;background:rgba(255,152,0,0.1);border:1px solid rgba(255,152,0,0.2);border-radius:8px;color:#FF9800;cursor:pointer;font-size:0.82rem"><i class="fas fa-eraser" style="margin-right:6px"></i>Clear Cache</button>\n'+
      '      <button onclick="WeddingAdmin.scanBrokenLinks(null,function(r){var m=\'Scanned \'+r.checked+\' pages: \'+r.broken+\' broken.\';if(r.broken){m+=\'\\nBroken:\';r.links.forEach(function(l){m+=\'\\n- \'+l.page+\' (status \'+l.status+\')\';});}alert(m);})" style="padding:10px 18px;background:rgba(244,67,54,0.1);border:1px solid rgba(244,67,54,0.2);border-radius:8px;color:#F44336;cursor:pointer;font-size:0.82rem"><i class="fas fa-link" style="margin-right:6px"></i>Scan Links</button>\n'+
      '    </div>\n'+
      '  </div>\n';
  };

  function adminStatCard(label,value,icon,color){
    return '<div style="padding:16px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(212,175,55,0.06);text-align:center">'+
      '<i class="fas '+icon+'" style="color:'+color+';font-size:1.1rem;margin-bottom:6px"></i>'+
      '<div style="font-size:1.3rem;color:#E8E0D0;font-weight:600">'+value+'</div>'+
      '<div style="font-size:0.7rem;color:#A09888">'+label+'</div></div>';
  }

  W.handleLogin=function(){
    var pass=document.getElementById('adminPassInput').value;
    W.authenticate(pass).then(function(ok){
      if(ok){
        W.renderAdminPanel('adminRoot');
        if(typeof notify==='function')notify('Admin authenticated','success');
      }else{
        if(typeof notify==='function')notify('Invalid admin password','error');
      }
    });
  };

  function escapeHTML(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function formatSize(bytes){
    if(bytes===0)return'0 B';var u=['B','KB','MB','GB'];var i=Math.floor(Math.log(bytes)/Math.log(1024));
    return Math.round(bytes/Math.pow(1024,i)*10)/10+' '+u[i];
  }

  window.WeddingAdmin=W;
})();
