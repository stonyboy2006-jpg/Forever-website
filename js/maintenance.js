/**
 * Maintenance Mode Controller
 * Toggle maintenance mode, set return time, show/hide maintenance page
 */
(function(){
  'use strict';
  var W=window.__WEDDING_MAINTENANCE=window.__WEDDING_MAINTENANCE||{};
  if(W.initialized)return;
  W.initialized=true;

  var STORAGE_KEY='weddingMaintenance';
  var ADMIN_PASSWORD_KEY='weddingMaintenanceBypass';

  function getConfig(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){return{};}
  }
  function saveConfig(cfg){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cfg));}catch(e){}
    if(window.AuditLog)window.AuditLog.recordMaintenanceToggle(JSON.stringify(cfg));
  }

  W.isEnabled=function(){var c=getConfig();return c.enabled===true;};
  W.getConfig=getConfig;

  W.enable=function(options){
    var cfg=getConfig();
    cfg.enabled=true;
    cfg.activatedAt=new Date().toISOString();
    cfg.activatedBy=getUserName();
    cfg.message=(options&&options.message)||cfg.message||'Our wedding website is currently undergoing scheduled maintenance.';
    cfg.returnTime=(options&&options.returnTime)?new Date(options.returnTime).toISOString():null;
    cfg.contactEmail=(options&&options.contactEmail)||cfg.contactEmail||'';
    cfg.contactWhatsapp=(options&&options.contactWhatsapp)||cfg.contactWhatsapp||'';
    cfg.bypassKey=(options&&options.bypassKey)||cfg.bypassKey||generateBypassKey();
    saveConfig(cfg);
    if(window.ErrorLogger)window.ErrorLogger.logClientError('Maintenance mode enabled by '+getUserName());
    return cfg;
  };

  W.disable=function(){
    var cfg=getConfig();
    cfg.enabled=false;
    cfg.disabledAt=new Date().toISOString();
    cfg.disabledBy=getUserName();
    cfg.previousSession=cfg.activatedAt;
    saveConfig(cfg);
    return cfg;
  };

  W.toggle=function(enabled,options){
    return enabled?W.enable(options):W.disable();
  };

  W.setReturnTime=function(isoString){
    var cfg=getConfig();
    cfg.returnTime=isoString;
    saveConfig(cfg);
    return cfg;
  };

  W.updateMessage=function(msg){
    var cfg=getConfig();
    cfg.message=msg;
    saveConfig(cfg);
    return cfg;
  };

  W.checkAndRedirect=function(){
    if(!W.isEnabled())return false;
    var bypass=sessionStorage.getItem(ADMIN_PASSWORD_KEY);
    if(bypass===getConfig().bypassKey)return false;
    var isLoginPage=/login\.html$/i.test(window.location.pathname);
    var isMaintenancePage=/maintenance\.html$/i.test(window.location.pathname);
    if(!isLoginPage&&!isMaintenancePage){
      window.location.href='maintenance.html';
      return true;
    }
    return false;
  };

  W.bypassSession=function(key){
    var cfg=getConfig();
    if(key===cfg.bypassKey){
      sessionStorage.setItem(ADMIN_PASSWORD_KEY,key);
      if(window.AuditLog)window.AuditLog.record('maintenance_bypass','Maintenance mode bypassed for this session','system');
      return true;
    }
    return false;
  };

  W.getBypassStatus=function(){
    var bypass=sessionStorage.getItem(ADMIN_PASSWORD_KEY);
    return{hasBypass:!!bypass,matchesBypass:bypass===getConfig().bypassKey};
  };

  W.getStats=function(){
    var cfg=getConfig();
    return{
      enabled:cfg.enabled||false,
      activatedAt:cfg.activatedAt||null,
      disabledAt:cfg.disabledAt||null,
      returnTime:cfg.returnTime||null,
      message:cfg.message||'',
      duration:cfg.activatedAt?((cfg.disabledAt?new Date(cfg.disabledAt):new Date())-new Date(cfg.activatedAt)):0
    };
  };

  W.renderMaintenancePanel=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    var cfg=getConfig();
    var stats=W.getStats();
    el.innerHTML='\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;margin-bottom:20px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '  <h3 style="font-family:Playfair Display,serif;color:#D4AF37;margin-bottom:16px"><i class="fas fa-wrench" style="margin-right:8px"></i>Maintenance Mode</h3>\n'+
      '  <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">\n'+
      '    <label style="position:relative;display:inline-block;width:52px;height:28px;cursor:pointer">\n'+
      '      <input type="checkbox" id="maintToggle" '+(cfg.enabled?'checked':'')+' style="opacity:0;width:0;height:0">\n'+
      '      <span style="position:absolute;inset:0;background:'+(cfg.enabled?'#D4AF37':'#333')+';border-radius:14px;transition:0.3s"></span>\n'+
      '      <span style="position:absolute;left:'+(cfg.enabled?'26px':'2px')+';top:2px;width:24px;height:24px;background:#fff;border-radius:50%;transition:0.3s"></span>\n'+
      '    </label>\n'+
      '    <span style="color:'+(cfg.enabled?'#4CAF50':'#888')+';font-weight:500">'+(cfg.enabled?'Active':'Inactive')+'</span>\n'+
      '  </div>\n'+
      '  <div style="margin-bottom:12px">\n'+
      '    <label style="display:block;font-size:0.8rem;color:#A09888;margin-bottom:6px">Maintenance Message</label>\n'+
      '    <textarea id="maintMsg" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-family:Poppins,sans-serif;font-size:0.85rem;resize:vertical;min-height:60px" placeholder="Your maintenance message...">'+escapeHTML(cfg.message||'')+'</textarea>\n'+
      '  </div>\n'+
      '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">\n'+
      '    <div><label style="display:block;font-size:0.8rem;color:#A09888;margin-bottom:6px">Contact Email</label><input id="maintEmail" type="email" value="'+escapeHTML(cfg.contactEmail||'')+'" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem"></div>\n'+
      '    <div><label style="display:block;font-size:0.8rem;color:#A09888;margin-bottom:6px">WhatsApp Number</label><input id="maintWa" type="text" value="'+escapeHTML(cfg.contactWhatsapp||'')+'" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem" placeholder="234..."></div>\n'+
      '  </div>\n'+
      '  <div style="margin-bottom:12px">\n'+
      '    <label style="display:block;font-size:0.8rem;color:#A09888;margin-bottom:6px">Expected Return Time</label>\n'+
      '    <input id="maintReturn" type="datetime-local" value="'+(cfg.returnTime?new Date(cfg.returnTime).toISOString().slice(0,16):'')+'" style="width:100%;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem">\n'+
      '  </div>\n'+
      '  <div style="margin-bottom:12px">\n'+
      '    <label style="display:block;font-size:0.8rem;color:#A09888;margin-bottom:6px">Bypass Key</label>\n'+
      '    <div style="display:flex;gap:8px">\n'+
      '      <input id="maintKey" type="text" value="'+escapeHTML(cfg.bypassKey||'')+'" readonly style="flex:1;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.08);border-radius:10px;color:#E8E0D0;font-size:0.85rem">\n'+
      '      <button onclick="WeddingMaintenance.regenerateBypass()" style="padding:10px 16px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:10px;color:#D4AF37;cursor:pointer;font-size:0.8rem"><i class="fas fa-sync-alt"></i></button>\n'+
      '      <button onclick="WeddingMaintenance.copyBypass()" style="padding:10px 16px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:10px;color:#D4AF37;cursor:pointer;font-size:0.8rem"><i class="fas fa-copy"></i></button>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <div style="display:flex;gap:12px;margin-top:16px">\n'+
      '    <button onclick="WeddingMaintenance.saveFromPanel()" style="flex:1;padding:12px;background:linear-gradient(135deg,#D4AF37,#B8860B);border:none;border-radius:10px;color:#0B0F19;font-weight:600;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-save" style="margin-right:6px"></i>Save</button>\n'+
      '    <button onclick="WeddingMaintenance.testPage()" style="padding:12px 20px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.2);border-radius:10px;color:#D4AF37;cursor:pointer;font-family:Poppins,sans-serif"><i class="fas fa-external-link-alt"></i></button>\n'+
      '  </div>\n'+
      '</div>\n';

    document.getElementById('maintToggle').addEventListener('change',function(){
      var label=this.closest('label').querySelector('span:first-of-type');
      var status=label.parentElement.querySelector('span:last-of-type');
      if(this.checked){label.style.background='#D4AF37';label.querySelector('span:last-of-type').style.left='26px';status.textContent='Active';status.style.color='#4CAF50';}
      else{label.style.background='#333';label.querySelector('span:last-of-type').style.left='2px';status.textContent='Inactive';status.style.color='#888';}
    });
  };

  W.saveFromPanel=function(){
    var enabled=document.getElementById('maintToggle').checked;
    var opts={
      message:document.getElementById('maintMsg').value,
      contactEmail:document.getElementById('maintEmail').value,
      contactWhatsapp:document.getElementById('maintWa').value,
      returnTime:document.getElementById('maintReturn').value||null,
      bypassKey:document.getElementById('maintKey').value
    };
    if(enabled)W.enable(opts);else W.disable();
    if(typeof notify==='function')notify('Maintenance settings saved','success');
  };

  W.testPage=function(){window.open('maintenance.html','_blank');};
  W.copyBypass=function(){
    var key=getConfig().bypassKey;
    if(navigator.clipboard)navigator.clipboard.writeText(key);
    if(typeof notify==='function')notify('Bypass key copied','success');
  };
  W.regenerateBypass=function(){
    var cfg=getConfig();
    cfg.bypassKey=generateBypassKey();
    saveConfig(cfg);
    if(document.getElementById('maintKey'))document.getElementById('maintKey').value=cfg.bypassKey;
    if(typeof notify==='function')notify('New bypass key generated','success');
  };

  function generateBypassKey(){return 'MW-'+Math.random().toString(36).substr(2,8).toUpperCase();}
  function getUserName(){try{var s=JSON.parse(localStorage.getItem('weddingAuthSession')||'{}');return s.name||s.email||'Owner';}catch(e){return'Owner';}}
  function escapeHTML(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  window.WeddingMaintenance=W;
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){W.checkAndRedirect();});
  }else{
    W.checkAndRedirect();
  }
  // Maintenance Mode controller initialized
})();
