/**
 * Owner Settings Page Controller
 * Account info, security, notifications, 2FA, session management
 */
(function(){
  'use strict';
  var W=window.__WEDDING_SETTINGS=window.__WEDDING_SETTINGS||{};
  if(W.initialized)return;
  W.initialized=true;

  function getData(){
    try{return JSON.parse(localStorage.getItem('weddingData')||'{}');}catch(e){return{};}
  }
  function setData(d){localStorage.setItem('weddingData',JSON.stringify(d));}
  function getSession(){
    try{return JSON.parse(localStorage.getItem('weddingAuthSession')||'{}');}catch(e){return{};}
  }
  function setSession(s){localStorage.setItem('weddingAuthSession',JSON.stringify(s));}

  W.getProfile=function(){
    var s=getSession();
    var d=getData();
    return{
      name:s.name||d.coupleName||'',
      email:s.email||'',
      phone:s.phone||'',
      avatar:s.avatar||d.coupleAvatar||'',
      role:s.role||'owner',
      twoFactorEnabled:s.twoFactorEnabled||false,
      lastLogin:s.lastLogin||'',
      createdAt:s.createdAt||'',
      setupComplete:s.setupComplete||false
    };
  };

  W.updateProfile=function(updates){
    var s=getSession();
    var changed=[];
    if(updates.name!==undefined&&updates.name!==s.name){s.name=updates.name;changed.push('name');}
    if(updates.email!==undefined&&updates.email!==s.email){s.email=updates.email;changed.push('email');}
    if(updates.phone!==undefined){s.phone=updates.phone;changed.push('phone');}
    if(updates.avatar!==undefined){s.avatar=updates.avatar;changed.push('avatar');}
    setSession(s);
    if(updates.name){var dd=getData();dd.coupleName=updates.name;setData(dd);}
    if(window.AuditLog)window.AuditLog.recordProfileUpdate('Updated: '+changed.join(', '));
    return{success:true,changed:changed};
  };

  W.changePassword=function(currentPass,newPass,confirmPass){
    if(!currentPass||!newPass){return{success:false,error:'All fields are required'};}
    if(newPass.length<8){return{success:false,error:'Password must be at least 8 characters'};}
    if(newPass!==confirmPass){return{success:false,error:'Passwords do not match'};}
    var s=getSession();
    if(s.password!==hashPassword(currentPass)){return{success:false,error:'Current password is incorrect'};}
    s.password=hashPassword(newPass);
    setSession(s);
    if(window.AuditLog)window.AuditLog.recordPasswordChange();
    return{success:true};
  };

  W.enable2FA=function(){
    var s=getSession();
    s.twoFactorEnabled=true;
    s.twoFactorSetupAt=new Date().toISOString();
    s.twoFactorBackupCodes=generateBackupCodes();
    setSession(s);
    if(window.AuditLog)window.AuditLog.record('2fa_enabled','Two-factor authentication enabled','security');
    return{success:true,backupCodes:s.twoFactorBackupCodes};
  };

  W.disable2FA=function(){
    var s=getSession();
    s.twoFactorEnabled=false;
    s.twoFactorDisabledAt=new Date().toISOString();
    setSession(s);
    if(window.AuditLog)window.AuditLog.record('2fa_disabled','Two-factor authentication disabled','security');
    return{success:true};
  };

  W.get2FAStatus=function(){
    var s=getSession();
    return{enabled:!!s.twoFactorEnabled,setupAt:s.twoFactorSetupAt||null,backupCodes:s.twoFactorBackupCodes||[]};
  };

  W.getSessions=function(){
    var s=getSession();
    return[{id:'current',device:s.userAgent||'Current Device',lastActive:new Date().toISOString(),current:true}];
  };

  W.logoutAllSessions=function(){
    setSession({});
    localStorage.removeItem('weddingAuthSession');
    return{success:true};
  };

  W.getNotifications=function(){
    var d=getData();
    return{
      emailReminders:d.settings_emailReminders!==false,
      smsReminders:d.settings_smsReminders||false,
      rsvpNotifications:d.settings_rsvpNotifications!==false,
      guestCheckin:d.settings_guestCheckin||false,
      dailyDigest:d.settings_dailyDigest||false,
      marketing:d.settings_marketing||false
    };
  };

  W.updateNotifications=function(prefs){
    var d=getData();
    d.settings_emailReminders=prefs.emailReminders!==undefined?prefs.emailReminders:true;
    d.settings_smsReminders=!!prefs.smsReminders;
    d.settings_rsvpNotifications=prefs.rsvpNotifications!==undefined?prefs.rsvpNotifications:true;
    d.settings_guestCheckin=!!prefs.guestCheckin;
    d.settings_dailyDigest=!!prefs.dailyDigest;
    d.settings_marketing=!!prefs.marketing;
    setData(d);
    if(window.AuditLog)window.AuditLog.recordSettingsChange('Notification preferences updated');
    return{success:true};
  };

  W.getPrivacy=function(){
    var d=getData();
    return{
      showGuestList:d.privacy_showGuestList||false,
      showSchedule:d.privacy_showSchedule!==false,
      showPhotos:d.privacy_showPhotos!==false,
      showMap:d.privacy_showMap!==false,
      allowGuestPhotos:d.privacy_allowGuestPhotos||false,
      allowComments:d.privacy_allowComments||false,
      showGiftRegistry:d.privacy_showGiftRegistry!==false
    };
  };

  W.updatePrivacy=function(prefs){
    var d=getData();
    Object.keys(prefs).forEach(function(k){d['privacy_'+k]=prefs[k];});
    setData(d);
    if(window.AuditLog)window.AuditLog.recordSettingsChange('Privacy settings updated');
    return{success:true};
  };

  W.getAppearance=function(){
    var d=getData();
    return{
      themeColor:d.appearance_themeColor||'#D4AF37',
      accentColor:d.appearance_accentColor||'#E8C4C0',
      fontFamily:d.appearance_fontFamily||'Playfair Display',
      darkMode:d.appearance_darkMode!==false,
      animations:d.appearance_animations!==false,
      compactMode:d.appearance_compactMode||false
    };
  };

  W.updateAppearance=function(prefs){
    var d=getData();
    Object.keys(prefs).forEach(function(k){d['appearance_'+k]=prefs[k];});
    setData(d);
    applyAppearance(prefs);
    if(window.AuditLog)window.AuditLog.recordSettingsChange('Appearance settings updated');
    return{success:true};
  };

  W.renderSettingsPage=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    var profile=W.getProfile();
    var notifications=W.getNotifications();
    var privacy=W.getPrivacy();
    var appearance=W.getAppearance();
    var twofa=W.get2FAStatus();

    el.innerHTML='\n'+
      '<div class="settings-grid">\n'+
      '  <div class="settings-sidebar">\n'+
      '    <nav class="settings-nav">\n'+
      '      <a href="#profile" class="active" onclick="WeddingSettings.showSection(\'profile\')"><i class="fas fa-user"></i> Profile</a>\n'+
      '      <a href="#security" onclick="WeddingSettings.showSection(\'security\')"><i class="fas fa-shield-alt"></i> Security</a>\n'+
      '      <a href="#notifications" onclick="WeddingSettings.showSection(\'notifications\')"><i class="fas fa-bell"></i> Notifications</a>\n'+
      '      <a href="#privacy" onclick="WeddingSettings.showSection(\'privacy\')"><i class="fas fa-eye-slash"></i> Privacy</a>\n'+
      '      <a href="#appearance" onclick="WeddingSettings.showSection(\'appearance\')"><i class="fas fa-palette"></i> Appearance</a>\n'+
      '      <a href="#maintenance" onclick="WeddingSettings.showSection(\'maintenance\')"><i class="fas fa-wrench"></i> Maintenance</a>\n'+
      '      <a href="#backup" onclick="WeddingSettings.showSection(\'backup\')"><i class="fas fa-cloud"></i> Backup</a>\n'+
      '    </nav>\n'+
      '  </div>\n'+
      '  <div class="settings-content" id="settingsContent"></div>\n'+
      '</div>\n';

    W.showSection('profile');
  };

  W.showSection=function(section){
    var el=document.getElementById('settingsContent');if(!el)return;
    document.querySelectorAll('.settings-nav a').forEach(function(a){
      a.classList.toggle('active',a.getAttribute('href')==='#'+section);
    });
    switch(section){
      case 'profile':renderProfileSection(el);break;
      case 'security':renderSecuritySection(el);break;
      case 'notifications':renderNotificationsSection(el);break;
      case 'privacy':renderPrivacySection(el);break;
      case 'appearance':renderAppearanceSection(el);break;
      case 'maintenance':renderMaintenanceSection(el);break;
      case 'backup':renderBackupSection(el);break;
    }
  };

  function renderProfileSection(el){
    var p=W.getProfile();
    el.innerHTML='\n'+
      '<h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px">Profile Settings</h2>\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08);margin-bottom:16px">\n'+
      '  <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px">\n'+
      '    <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#D4AF37,#E8C4C0);display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:#0B0F19;font-weight:700;overflow:hidden">'+(p.avatar?'<img src="'+p.avatar+'" style="width:100%;height:100%;object-fit:cover" alt="">':getInitials(p.name))+'</div>\n'+
      '    <div><h3 style="color:#E8E0D0;margin-bottom:4px">'+escapeHTML(p.name)+'</h3><p style="color:#A09888;font-size:0.85rem">'+escapeHTML(p.email)+'</p><p style="color:#666;font-size:0.75rem;margin-top:4px">Member since '+(p.createdAt?new Date(p.createdAt).toLocaleDateString():'N/A')+'</p></div>\n'+
      '  </div>\n'+
      '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">\n'+
      '    <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Full Name</label><input id="setProfileName" value="'+escapeHTML(p.name)+'" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem"></div>\n'+
      '    <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Email</label><input id="setProfileEmail" type="email" value="'+escapeHTML(p.email)+'" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem"></div>\n'+
      '    <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Phone</label><input id="setProfilePhone" value="'+escapeHTML(p.phone||'')+'" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem"></div>\n'+
      '    <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Role</label><input value="'+escapeHTML(p.role)+'" disabled style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.05);border-radius:10px;color:#666;font-size:0.85rem"></div>\n'+
      '  </div>\n'+
      '  <button onclick="WeddingSettings.saveProfile()" style="margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-save" style="margin-right:6px"></i>Save Changes</button>\n'+
      '</div>\n';
  }

  function renderSecuritySection(el){
    var twofa=W.get2FAStatus();
    el.innerHTML='\n'+
      '<h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px">Security Settings</h2>\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08);margin-bottom:16px">\n'+
      '  <h3 style="color:#E8E0D0;font-size:1rem;margin-bottom:16px">Change Password</h3>\n'+
      '  <div style="display:grid;gap:12px">\n'+
      '    <input id="secCurrentPass" type="password" placeholder="Current password" style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem">\n'+
      '    <input id="secNewPass" type="password" placeholder="New password (min 8 chars)" style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem">\n'+
      '    <input id="secConfirmPass" type="password" placeholder="Confirm new password" style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem">\n'+
      '    <button onclick="WeddingSettings.handleChangePassword()" style="padding:12px 24px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif;width:fit-content">Update Password</button>\n'+
      '  </div>\n'+
      '</div>\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08);margin-bottom:16px">\n'+
      '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">\n'+
      '    <div><h3 style="color:#E8E0D0;font-size:1rem;margin-bottom:4px">Two-Factor Authentication</h3><p style="color:#A09888;font-size:0.8rem">'+(twofa.enabled?'Enabled':'Disabled')+'</p></div>\n'+
      '    <button onclick="WeddingSettings.toggle2FA()" style="padding:8px 16px;background:'+(twofa.enabled?'rgba(244,67,54,0.1)':'rgba(76,175,80,0.1)')+';border:1px solid '+(twofa.enabled?'rgba(244,67,54,0.2)':'rgba(76,175,80,0.2)')+';border-radius:8px;color:'+(twofa.enabled?'#F44336':'#4CAF50')+';cursor:pointer;font-size:0.85rem">'+(twofa.enabled?'Disable':'Enable')+'</button>\n'+
      '  </div>\n'+
      (twofa.enabled?'<div style="background:rgba(255,255,255,0.02);padding:12px;border-radius:10px;margin-bottom:12px"><p style="color:#A09888;font-size:0.8rem;margin-bottom:8px">Backup Codes:</p><div style="display:flex;flex-wrap:wrap;gap:6px">'+twofa.backupCodes.map(function(c){return'<code style="padding:4px 8px;background:rgba(212,175,55,0.06);border-radius:4px;color:#D4AF37;font-size:0.75rem">'+c+'</code>';}).join('')+'</div></div>':'')+
      '</div>\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '  <h3 style="color:#E8E0D0;font-size:1rem;margin-bottom:16px">Active Sessions</h3>\n'+
      '  <div style="padding:12px;background:rgba(255,255,255,0.02);border-radius:10px;display:flex;justify-content:space-between;align-items:center">\n'+
      '    <div><p style="color:#E8E0D0;font-size:0.85rem">Current Browser</p><p style="color:#666;font-size:0.75rem">Last active: Now</p></div>\n'+
      '    <span style="color:#4CAF50;font-size:0.8rem"><i class="fas fa-circle" style="font-size:0.5rem;margin-right:4px"></i>Active</span>\n'+
      '  </div>\n'+
      '  <button onclick="WeddingSettings.handleLogoutAll()" style="margin-top:12px;padding:8px 16px;background:rgba(244,67,54,0.1);border:1px solid rgba(244,67,54,0.2);border-radius:8px;color:#F44336;cursor:pointer;font-size:0.85rem"><i class="fas fa-sign-out-alt" style="margin-right:6px"></i>Logout All Other Sessions</button>\n'+
      '</div>\n';
  }

  function renderNotificationsSection(el){
    var n=W.getNotifications();
    el.innerHTML='\n'+
      '<h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px">Notification Preferences</h2>\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
      buildToggle('Email Reminders',n.emailReminders,'notifEmail')+'\n'+
      buildToggle('SMS Reminders (requires backend)',n.smsReminders,'notifSms')+'\n'+
      buildToggle('RSVP Notifications',n.rsvpNotifications,'notifRsvp')+'\n'+
      buildToggle('Guest Check-in Alerts',n.guestCheckin,'notifCheckin')+'\n'+
      buildToggle('Daily Digest',n.dailyDigest,'notifDigest')+'\n'+
      buildToggle('Marketing & Updates',n.marketing,'notifMarketing')+'\n'+
      '  <button onclick="WeddingSettings.saveNotifications()" style="margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-save" style="margin-right:6px"></i>Save Preferences</button>\n'+
      '</div>\n';
  }

  function renderPrivacySection(el){
    var p=W.getPrivacy();
    el.innerHTML='\n'+
      '<h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px">Privacy Settings</h2>\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
      buildToggle('Show Guest List to Visitors',p.showGuestList,'privGuestList')+'\n'+
      buildToggle('Show Wedding Schedule',p.showSchedule,'privSchedule')+'\n'+
      buildToggle('Show Photo Gallery',p.showPhotos,'privPhotos')+'\n'+
      buildToggle('Show Map & Venue',p.showMap,'privMap')+'\n'+
      buildToggle('Allow Guest Photo Uploads',p.allowGuestPhotos,'privGuestPhotos')+'\n'+
      buildToggle('Allow Guest Comments',p.allowComments,'privComments')+'\n'+
      buildToggle('Show Gift Registry',p.showGiftRegistry,'privGifts')+'\n'+
      '  <button onclick="WeddingSettings.savePrivacy()" style="margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-save" style="margin-right:6px"></i>Save Privacy</button>\n'+
      '</div>\n';
  }

  function renderAppearanceSection(el){
    var a=W.getAppearance();
    el.innerHTML='\n'+
      '<h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px">Appearance</h2>\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">\n'+
      '    <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Theme Color</label><div style="display:flex;gap:8px;align-items:center"><input type="color" id="appTheme" value="'+a.themeColor+'" style="width:40px;height:40px;border:none;cursor:pointer;background:transparent"><input id="appThemeHex" value="'+a.themeColor+'" style="width:calc(100% - 50px);padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem"></div></div>\n'+
      '    <div><label style="display:block;color:#A09888;font-size:0.8rem;margin-bottom:6px">Accent Color</label><div style="display:flex;gap:8px;align-items:center"><input type="color" id="appAccent" value="'+a.accentColor+'" style="width:40px;height:40px;border:none;cursor:pointer;background:transparent"><input id="appAccentHex" value="'+a.accentColor+'" style="width:calc(100% - 50px);padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem"></div></div>\n'+
      '  </div>\n'+
      buildToggle('Dark Mode',a.darkMode,'appDark')+'\n'+
      buildToggle('Animations Enabled',a.animations,'appAnimations')+'\n'+
      buildToggle('Compact Mode',a.compactMode,'appCompact')+'\n'+
      '  <button onclick="WeddingSettings.saveAppearance()" style="margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-save" style="margin-right:6px"></i>Save Appearance</button>\n'+
      '</div>\n';

    document.getElementById('appTheme').addEventListener('input',function(){document.getElementById('appThemeHex').value=this.value;});
    document.getElementById('appThemeHex').addEventListener('input',function(){document.getElementById('appTheme').value=this.value;});
    document.getElementById('appAccent').addEventListener('input',function(){document.getElementById('appAccentHex').value=this.value;});
    document.getElementById('appAccentHex').addEventListener('input',function(){document.getElementById('appAccent').value=this.value;});
  }

  function renderMaintenanceSection(el){
    el.innerHTML='<h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px">Maintenance Mode</h2><div id="maintPanel"></div>';
    if(window.WeddingMaintenance)window.WeddingMaintenance.renderMaintenancePanel('maintPanel');
  }

  function renderBackupSection(el){
    el.innerHTML='<h2 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:20px">Backup & Restore</h2><div id="backupPanel"></div>';
    if(window.WeddingBackup)window.WeddingBackup.renderBackupPanel('backupPanel');
  }

  function buildToggle(label,checked,id){
    return '  <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.03)">\n'+
      '    <span style="color:#E8E0D0;font-size:0.88rem">'+label+'</span>\n'+
      '    <label style="position:relative;display:inline-block;width:48px;height:26px;cursor:pointer">\n'+
      '      <input type="checkbox" id="'+id+'" '+(checked?'checked':'')+' style="opacity:0;width:0;height:0">\n'+
      '      <span style="position:absolute;inset:0;background:'+(checked?'#D4AF37':'#333')+';border-radius:13px;transition:0.3s"></span>\n'+
      '      <span style="position:absolute;left:'+(checked?'22px':'2px')+';top:2px;width:22px;height:22px;background:#fff;border-radius:50%;transition:0.3s"></span>\n'+
      '    </label>\n'+
      '  </div>\n';
  }

  W.saveProfile=function(){
    var updates={
      name:document.getElementById('setProfileName').value,
      email:document.getElementById('setProfileEmail').value,
      phone:document.getElementById('setProfilePhone').value
    };
    var result=W.updateProfile(updates);
    if(typeof notify==='function')notify(result.success?'Profile updated!':'Update failed',result.success?'success':'error');
  };

  W.handleChangePassword=function(){
    var result=W.changePassword(
      document.getElementById('secCurrentPass').value,
      document.getElementById('secNewPass').value,
      document.getElementById('secConfirmPass').value
    );
    if(typeof notify==='function')notify(result.success?'Password updated!':result.error,result.success?'success':'error');
    if(result.success){
      document.getElementById('secCurrentPass').value='';
      document.getElementById('secNewPass').value='';
      document.getElementById('secConfirmPass').value='';
    }
  };

  W.toggle2FA=function(){
    var status=W.get2FAStatus();
    if(status.enabled){
      if(!confirm('Disable two-factor authentication?'))return;
      W.disable2FA();
      if(typeof notify==='function')notify('2FA disabled','success');
    }else{
      var result=W.enable2FA();
      if(typeof notify==='function')notify('2FA enabled! Save your backup codes.','success');
      alert('Backup Codes:\n'+result.backupCodes.join('\n')+'\n\nSave these codes securely!');
    }
    W.showSection('security');
  };

  W.handleLogoutAll=function(){
    if(!confirm('This will log you out from all sessions. Continue?'))return;
    W.logoutAllSessions();
    if(typeof notify==='function')notify('All sessions terminated','success');
    setTimeout(function(){window.location.href='login.html';},1500);
  };

  W.saveNotifications=function(){
    W.updateNotifications({
      emailReminders:document.getElementById('notifEmail').checked,
      smsReminders:document.getElementById('notifSms').checked,
      rsvpNotifications:document.getElementById('notifRsvp').checked,
      guestCheckin:document.getElementById('notifCheckin').checked,
      dailyDigest:document.getElementById('notifDigest').checked,
      marketing:document.getElementById('notifMarketing').checked
    });
    if(typeof notify==='function')notify('Notification preferences saved','success');
  };

  W.savePrivacy=function(){
    W.updatePrivacy({
      showGuestList:document.getElementById('privGuestList').checked,
      showSchedule:document.getElementById('privSchedule').checked,
      showPhotos:document.getElementById('privPhotos').checked,
      showMap:document.getElementById('privMap').checked,
      allowGuestPhotos:document.getElementById('privGuestPhotos').checked,
      allowComments:document.getElementById('privComments').checked,
      showGiftRegistry:document.getElementById('privGifts').checked
    });
    if(typeof notify==='function')notify('Privacy settings saved','success');
  };

  W.saveAppearance=function(){
    W.updateAppearance({
      themeColor:document.getElementById('appThemeHex').value,
      accentColor:document.getElementById('appAccentHex').value,
      darkMode:document.getElementById('appDark').checked,
      animations:document.getElementById('appAnimations').checked,
      compactMode:document.getElementById('appCompact').checked
    });
    if(typeof notify==='function')notify('Appearance settings saved','success');
  };

  function applyAppearance(prefs){
    var root=document.documentElement;
    if(prefs.themeColor)root.style.setProperty('--primary',prefs.themeColor);
    if(prefs.accentColor)root.style.setProperty('--secondary',prefs.accentColor);
    if(!prefs.animations)root.classList.add('no-animations');
    else root.classList.remove('no-animations');
  }

  function getInitials(name){var p=(name||'N').split(' ');return(p[0]||'').charAt(0)+((p[1]||'').charAt(0)||'');}
  function escapeHTML(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  async function hashPassword(p){var enc=new TextEncoder().encode(p+'wedding-salt-2024');var hash=await crypto.subtle.digest('SHA-256',enc);return Array.from(new Uint8Array(hash)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');}
  function generateBackupCodes(){var codes=[];for(var i=0;i<8;i++)codes.push(Math.random().toString(36).substr(2,4).toUpperCase()+'-'+Math.random().toString(36).substr(2,4).toUpperCase());return codes;}

  window.WeddingSettings=W;
})();
