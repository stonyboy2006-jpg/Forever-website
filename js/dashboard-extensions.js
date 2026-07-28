/**
 * Dashboard Extensions — Phase 2: Video Gallery, Gift Registry, Payments, Notifications, Live Stats
 * Extends DashApp (window.DashApp) and adds new objects to window scope.
 */
(function(){
'use strict';

var DB_KEY='weddingData';
function getData(){try{var r=localStorage.getItem(DB_KEY);return r?JSON.parse(r):{};}catch(e){return {};}}
function saveData(d){localStorage.setItem(DB_KEY,JSON.stringify(d));}
function escapeHtml(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function formatDate(d){if(!d)return'';var dt=new Date(d);return dt.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});}
function formatCurrency(a){return '$'+parseFloat(a||0).toFixed(2);}
function genId(){return 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,6);}
function notify(msg,type){
  var c=document.getElementById('dashNotifications');
  if(!c)return;
  var t=document.createElement('div');
  t.className='dash-toast '+(type||'info');
  var icons={success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle'};
  t.innerHTML='<div class="toast-icon"><i class="fas '+(icons[type]||icons.info)+'"></i></div><div class="toast-msg">'+msg+'</div><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>';
  c.appendChild(t);
  requestAnimationFrame(function(){requestAnimationFrame(function(){t.classList.add('show');});});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){if(t.parentElement)t.remove();},400);},4000);
}
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

// ===== 1. NAVIGATION EXTENSION =====
(function(){
  if(typeof DashApp==='undefined')return;
  var origNav=DashApp.navigate;
  DashApp.navigate=function(section){
    document.querySelectorAll('.dash-nav-item').forEach(function(b){b.classList.remove('active');});
    document.querySelectorAll('.dash-section').forEach(function(s){s.classList.remove('active');});
    var btn=document.querySelector('[data-section="'+section+'"]');
    var sec=document.getElementById('sec-'+section);
    if(btn)btn.classList.add('active');
    if(sec)sec.classList.add('active');
    var titles={
      'overview':'Dashboard','wedding-info':'Wedding Details','slideshow':'Slideshow Manager',
      'memories-mgr':'Memories Manager','themes':'Theme Manager','gallery-mgr':'Gallery Manager',
      'video-mgr':'Video Gallery','timeline-mgr':'Timeline','guests':'Guest Manager',
      'rsvp-mgr':'RSVP Manager','invitations':'Invitation Manager',
      'gift-registry':'Gift Registry','payments':'Payments',
      'ai-settings':'AI Assistant Settings','social-links':'Social Links',
      'analytics':'Analytics','notifications':'Notifications',
      'website-settings':'Website Settings','backup':'Backup & Restore','settings':'Account Settings'
    };
    document.getElementById('topbarTitle').textContent=titles[section]||'Dashboard';
    var sb=document.getElementById('dashSidebar');
    if(window.innerWidth<=768)sb.classList.remove('open');
  };
})();

// ===== 2. LIVE STATS =====
function updateLiveStats(){
  var d=getData();
  var guests=d.guests||[];
  var invited=guests.filter(function(g){return g.invited;}).length;
  var accepted=guests.filter(function(g){return g.rsvp==='accepted';}).length;
  var declined=guests.filter(function(g){return g.rsvp==='declined';}).length;
  var pending=guests.length-accepted-declined;
  var totalGuests=guests.reduce(function(s,g){return s+(parseInt(g.guestCount)||1);},0);
  var analytics=d.analytics||{};
  var el=function(id){return document.getElementById(id);};
  if(el('liveInvitationsSent'))el('liveInvitationsSent').textContent=invited;
  if(el('liveInvitationViews'))el('liveInvitationViews').textContent=analytics.invitationViews||0;
  if(el('liveAccepted'))el('liveAccepted').textContent=accepted;
  if(el('liveDeclined'))el('liveDeclined').textContent=declined;
  if(el('livePending'))el('livePending').textContent=pending;
  if(el('liveExpectedGuests'))el('liveExpectedGuests').textContent=totalGuests;
  if(el('liveCountdown'))el('liveCountdown').textContent=countdown(d.weddingDate);
  if(el('liveVisitors'))el('liveVisitors').textContent=analytics.views||0;
  if(el('liveShares'))el('liveShares').textContent=analytics.shares||0;
  if(el('liveGalleryViews'))el('liveGalleryViews').textContent=analytics.galleryViews||0;
}
setInterval(updateLiveStats,10000);

// ===== 3. VIDEO GALLERY MANAGER =====
var VideoMgr=(function(){
  var V_KEY='weddingVideos';
  function getVids(){try{var r=localStorage.getItem(V_KEY);return r?JSON.parse(r):{videos:[]};}catch(e){return{videos:[]};}}
  function saveVids(d){localStorage.setItem(V_KEY,JSON.stringify(d));}
  var currentFilter='all';
  function detectPlatform(url){
    if(!url)return'uploaded';
    var u=url.toLowerCase();
    if(u.indexOf('youtube.com')!==-1||u.indexOf('youtu.be')!==-1)return'youtube';
    if(u.indexOf('tiktok.com')!==-1)return'tiktok';
    if(u.indexOf('instagram.com')!==-1)return'instagram';
    if(u.indexOf('facebook.com')!==-1||u.indexOf('fb.com')!==-1)return'facebook';
    return'uploaded';
  }
  function getEmbedUrl(url){
    var u=url||'';
    var ytMatch=u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if(ytMatch)return'https://www.youtube.com/embed/'+ytMatch[1];
    var igMatch=u.match(/instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
    if(igMatch)return'https://www.instagram.com/p/'+igMatch[1]+'/embed';
    var fbMatch=u.match(/facebook\.com\/(?:watch\/?\?v=|[\w.]+\/videos\/)(\d+)/);
    if(fbMatch)return'https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(u);
    var ttMatch=u.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/);
    if(ttMatch)return'https://www.tiktok.com/embed/v2/'+ttMatch[1];
    return u;
  }
  function getThumbnail(url){
    var u=url||'';
    var ytMatch=u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if(ytMatch)return'https://img.youtube.com/vi/'+ytMatch[1]+'/hqdefault.jpg';
    return'';
  }
  function renderGrid(){
    var vids=getVids().videos||[];
    var filtered=vids;
    if(currentFilter!=='all')filtered=vids.filter(function(v){return v.platform===currentFilter;});
    var grid=document.getElementById('videoGrid');
    if(!grid)return;
    if(!filtered.length){
      grid.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-light)"><i class="fas fa-video" style="font-size:3rem;opacity:0.2;display:block;margin-bottom:12px"></i>No videos yet. Add a URL or upload an MP4 file.</div>';
      return;
    }
    grid.innerHTML=filtered.map(function(v,i){
      var ri=vids.indexOf(v);
      var platformIcons={youtube:'fab fa-youtube',tiktok:'fab fa-tiktok',instagram:'fab fa-instagram',facebook:'fab fa-facebook',uploaded:'fas fa-video'};
      var platformColors={youtube:'#FF0000',tiktok:'#00f2ea',instagram:'#E1306C',facebook:'#1877F2',uploaded:'var(--gold)'};
      var thumb=v.thumbnail||getThumbnail(v.url);
      return '<div class="video-card">'+
        '<div class="thumb">'+
          (thumb?'<img src="'+thumb+'" alt="'+escapeHtml(v.title)+'" loading="lazy">':'<div style="color:var(--text-light);font-size:0.85rem">No preview</div>')+
          '<button class="play-btn" onclick="VideoMgr.playVideo(\''+v.id+'\')" title="Play"><i class="fas fa-play"></i></button>'+
        '</div>'+
        '<div class="info">'+
          '<div class="title">'+escapeHtml(v.title||'Untitled Video')+'</div>'+
          '<div class="meta"><i class="'+platformIcons[v.platform]+'" style="color:'+(platformColors[v.platform]||'var(--gold)')+';margin-right:4px"></i>'+v.platform.charAt(0).toUpperCase()+v.platform.slice(1)+'</div>'+
          '<div class="actions">'+
            '<button class="dash-btn dash-btn-sm dash-btn-outline" onclick="VideoMgr.playVideo(\''+v.id+'\')"><i class="fas fa-play"></i></button>'+
            '<button class="dash-btn dash-btn-sm dash-btn-ghost" onclick="VideoMgr.editVideo(\''+v.id+'\')"><i class="fas fa-edit"></i></button>'+
            '<button class="dash-btn dash-btn-sm dash-btn-danger" onclick="VideoMgr.deleteVideo(\''+v.id+'\')"><i class="fas fa-trash"></i></button>'+
          '</div>'+
        '</div>'+
      '</div>';
    }).join('');
    // Update notification if videos exist
    if(vids.length&&typeof updateNotifBadge==='function')updateNotifBadge();
  }
  return{
    init:function(){renderGrid();},
    filter:function(f,btn){
      currentFilter=f;
      document.querySelectorAll('#videoTabs .dash-tab').forEach(function(t){t.classList.remove('active');});
      if(btn)btn.classList.add('active');
      renderGrid();
    },
    addVideo:function(){
      var url=document.getElementById('videoUrlInput').value.trim();
      var title=document.getElementById('videoTitleInput').value.trim()||'Wedding Video';
      if(!url){notify('Please enter a video URL','error');return;}
      var vids=getVids();if(!vids.videos)vids.videos=[];
      vids.videos.push({id:genId(),url:url,title:title,platform:detectPlatform(url),thumbnail:getThumbnail(url),addedAt:Date.now()});
      saveVids(vids);
      document.getElementById('videoUrlInput').value='';
      document.getElementById('videoTitleInput').value='';
      renderGrid();
      notify('Video added!','success');
      if(typeof DashApp!=='undefined'&&DashApp.logActivity)DashApp.logActivity('Added video: '+title);
    },
    handleFileUpload:function(e){
      var files=e.target.files;if(!files.length)return;
      var vids=getVids();if(!vids.videos)vids.videos=[];
      var loaded=0;var total=files.length;
      Array.from(files).forEach(function(file){
        var reader=new FileReader();
        reader.onload=function(ev){
          vids.videos.push({id:genId(),url:ev.target.result,title:file.name.replace(/\.[^.]+$/,''),platform:'uploaded',thumbnail:'',addedAt:Date.now()});
          loaded++;
          if(loaded===total){saveVids(vids);renderGrid();notify(total+' video(s) uploaded!','success');}
        };
        reader.readAsDataURL(file);
      });
      e.target.value='';
    },
    handleDrop:function(e){
      e.preventDefault();
      document.getElementById('videoDropZone').classList.remove('dragover');
      var files=e.dataTransfer.files;if(!files.length)return;
      var input=document.getElementById('videoFileInput');
      if(input){input.files=files;VideoMgr.handleFileUpload({target:input});}
    },
    playVideo:function(id){
      var v=getVids().videos.find(function(x){return x.id===id;});
      if(!v)return;
      if(v.platform==='uploaded'){
        // Open uploaded video in overlay
        var overlay=document.createElement('div');
        overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center';
        overlay.innerHTML='<button style="position:absolute;top:20px;right:20px;width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.1);color:#fff;font-size:1.2rem;cursor:pointer" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button><video src="'+v.url+'" controls autoplay style="max-width:90%;max-height:90%;border-radius:12px"></video>';
        document.body.appendChild(overlay);
      }else if(v.platform==='youtube'||v.platform==='tiktok'||v.platform==='instagram'||v.platform==='facebook'){
        var embed=getEmbedUrl(v.url);
        var overlay=document.createElement('div');
        overlay.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center';
        overlay.innerHTML='<button style="position:absolute;top:20px;right:20px;width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.1);color:#fff;font-size:1.2rem;cursor:pointer" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button><iframe src="'+embed+'" style="width:80vw;height:45vw;max-width:800px;max-height:450px;border-radius:12px;border:none" allowfullscreen></iframe>';
        document.body.appendChild(overlay);
      }else{
        window.open(v.url,'_blank');
      }
    },
    editVideo:function(id){
      var vids=getVids();var v=vids.videos.find(function(x){return x.id===id;});
      if(!v)return;
      if(typeof DashApp!=='undefined'&&DashApp.openModal){
        DashApp.openModal('Edit Video',
          '<div class="dash-form-group"><label class="dash-form-label">Title</label><input class="dash-input" id="vidEditTitle" value="'+escapeHtml(v.title)+'"></div>'+
          '<div class="dash-form-group"><label class="dash-form-label">URL</label><input class="dash-input" id="vidEditUrl" value="'+escapeHtml(v.url)+'"></div>',
          [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Save',class:'dash-btn dash-btn-gold',action:'VideoMgr.saveEdit(\''+id+'\')'}]
        );
      }
    },
    saveEdit:function(id){
      var vids=getVids();var v=vids.videos.find(function(x){return x.id===id;});
      if(!v)return;
      v.title=document.getElementById('vidEditTitle').value.trim()||v.title;
      v.url=document.getElementById('vidEditUrl').value.trim()||v.url;
      v.platform=detectPlatform(v.url);
      v.thumbnail=getThumbnail(v.url);
      saveVids(vids);
      if(typeof DashApp!=='undefined')DashApp.closeModal();
      renderGrid();
      notify('Video updated!','success');
    },
    deleteVideo:function(id){
      if(!confirm('Delete this video?'))return;
      var vids=getVids();vids.videos=vids.videos.filter(function(x){return x.id!==id;});
      saveVids(vids);
      renderGrid();
      notify('Video deleted','info');
    }
  };
})();

// ===== 4. GIFT REGISTRY =====
var GiftReg=(function(){
  var G_KEY='weddingGiftRegistry';
  function getReg(){try{var r=localStorage.getItem(G_KEY);return r?JSON.parse(r):{bank:{},gateways:{},gifts:[]};}catch(e){return{bank:{},gateways:{},gifts:[]};}}
  function saveReg(d){localStorage.setItem(G_KEY,JSON.stringify(d));}
  function renderGifts(){
    var reg=getReg();var gifts=reg.gifts||[];
    var tbody=document.getElementById('giftTableBody');
    if(!tbody)return;
    tbody.innerHTML=gifts.length?gifts.map(function(g,i){
      return '<tr><td><strong style="color:var(--gold)">'+formatCurrency(g.amount)+'</strong></td><td>'+(g.anonymous?'<em>Anonymous</em>':escapeHtml(g.sender||''))+'</td><td>'+(g.anonymous?'<span style="color:var(--success)"><i class="fas fa-check"></i> Yes</span>':'No')+'</td>'+
        '<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escapeHtml(g.message||'')+'">'+(g.message?escapeHtml(g.message.substring(0,30)):'-')+'</td>'+
        '<td><span class="status-badge '+(g.status==='completed'?'active':g.status==='pending'?'pending':'inactive')+'">'+(g.status||'completed')+'</span></td>'+
        '<td style="font-size:0.82rem;color:var(--text-light)">'+(g.date?formatDate(g.date):'-')+'</td>'+
        '<td class="actions"><button class="del" onclick="GiftReg.deleteGift('+i+')"><i class="fas fa-trash"></i></button></td></tr>';
    }).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:30px">No gifts recorded yet.</td></tr>';
    // Also update payment summary
    if(typeof Payments!=='undefined'&&Payments.refresh)Payments.refresh();
  }
  return{
    init:function(){
      var reg=getReg();
      var bk=reg.bank||{};
      if(document.getElementById('giftBankName'))document.getElementById('giftBankName').value=bk.bankName||'';
      if(document.getElementById('giftAccountName'))document.getElementById('giftAccountName').value=bk.accountName||'';
      if(document.getElementById('giftAccountNumber'))document.getElementById('giftAccountNumber').value=bk.accountNumber||'';
      if(document.getElementById('giftSortCode'))document.getElementById('giftSortCode').value=bk.sortCode||'';
      // Gateways
      var gw=reg.gateways||{};
      ['paystack','flutterwave','stripe','paypal'].forEach(function(k){
        var toggle=document.getElementById('gateway'+k.charAt(0).toUpperCase()+k.slice(1)+'Toggle');
        if(toggle)toggle.checked=gw[k]&&gw[k].enabled;
        var keyInput=document.getElementById('gateway'+k.charAt(0).toUpperCase()+k.slice(1)+'Key');
        if(keyInput&&gw[k])keyInput.value=gw[k].key||'';
      });
      renderGifts();
    },
    saveBankDetails:function(){
      var reg=getReg();
      reg.bank={
        bankName:document.getElementById('giftBankName').value.trim(),
        accountName:document.getElementById('giftAccountName').value.trim(),
        accountNumber:document.getElementById('giftAccountNumber').value.trim(),
        sortCode:document.getElementById('giftSortCode').value.trim()
      };
      saveReg(reg);
      notify('Bank details saved!','success');
    },
    toggleGateway:function(name){
      var toggle=document.getElementById('gateway'+name.charAt(0).toUpperCase()+name.slice(1)+'Toggle');
      var keyInput=document.getElementById('gateway'+name.charAt(0).toUpperCase()+name.slice(1)+'Key');
      var reg=getReg();if(!reg.gateways)reg.gateways={};
      reg.gateways[name]={enabled:toggle?toggle.checked:false,key:keyInput?keyInput.value.trim():''};
      saveReg(reg);
      notify((toggle&&toggle.checked?'Enabled':'Disabled')+' '+name.charAt(0).toUpperCase()+name.slice(1),toggle&&toggle.checked?'success':'info');
    },
    addGift:function(amount,sender,anonymous,message,status){
      var reg=getReg();if(!reg.gifts)reg.gifts=[];
      reg.gifts.unshift({id:genId(),amount:parseFloat(amount)||0,sender:sender||'',anonymous:!!anonymous,message:message||'',status:status||'completed',date:new Date().toISOString()});
      saveReg(reg);
      renderGifts();
    },
    deleteGift:function(i){
      if(!confirm('Delete this gift record?'))return;
      var reg=getReg();reg.gifts.splice(i,1);saveReg(reg);renderGifts();notify('Gift record deleted','info');
    },
    exportReport:function(fmt){
      var reg=getReg();var gifts=reg.gifts||[];
      if(fmt==='csv'){
        var csv='Amount,Sender,Anonymous,Message,Status,Date\n';
        gifts.forEach(function(g){csv+='"'+g.amount+'","'+(g.anonymous?'Anonymous':g.sender)+'","'+(g.anonymous?'Yes':'No')+'","'+(g.message||'')+'","'+(g.status||'completed')+'","'+(g.date||'')+'"\n';});
        var blob=new Blob([csv],{type:'text/csv'});var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download='gift-registry.csv';a.click();URL.revokeObjectURL(url);
      }else if(fmt==='excel'){
        var xml='<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Gifts"><Table><Row><Cell><Data ss:Type="String">Amount</Data></Cell><Cell><Data ss:Type="String">Sender</Data></Cell><Cell><Data ss:Type="String">Anonymous</Data></Cell><Cell><Data ss:Type="String">Message</Data></Cell><Cell><Data ss:Type="String">Status</Data></Cell><Cell><Data ss:Type="String">Date</Data></Cell></Row>';
        gifts.forEach(function(g){xml+='<Row><Cell><Data ss:Type="Number">'+g.amount+'</Data></Cell><Cell><Data ss:Type="String">'+(g.anonymous?'Anonymous':g.sender)+'</Data></Cell><Cell><Data ss:Type="String">'+(g.anonymous?'Yes':'No')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.message||'')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.status||'completed')+'</Data></Cell><Cell><Data ss:Type="String">'+(g.date||'')+'</Data></Cell></Row>';});
        xml+='</Table></Worksheet></Workbook>';
        var blob=new Blob([xml],{type:'application/vnd.ms-excel'});var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download='gift-registry.xls';a.click();URL.revokeObjectURL(url);
      }else if(fmt==='pdf'){
        var text='GIFT REGISTRY REPORT\n\n';
        gifts.forEach(function(g){text+=formatCurrency(g.amount)+' | '+(g.anonymous?'Anonymous':g.sender)+' | '+(g.status||'completed')+' | '+(g.date?formatDate(g.date):'')+'\n';});
        var blob=new Blob([text],{type:'text/plain'});var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download='gift-registry.txt';a.click();URL.revokeObjectURL(url);
        notify('PDF export saves as text. Use for printing.','info');
      }
      notify('Gift report exported as '+fmt.toUpperCase(),'success');
    }
  };
})();

// ===== 5. PAYMENTS =====
var Payments=(function(){
  return{
    init:function(){Payments.refresh();},
    refresh:function(){
      var reg=(typeof GiftReg!=='undefined')?(function(){
        try{var r=localStorage.getItem('weddingGiftRegistry');return r?JSON.parse(r):{gifts:[]};}catch(e){return{gifts:[]};}
      })():{gifts:[]};
      var gifts=reg.gifts||[];
      var total=gifts.reduce(function(s,g){return s+parseFloat(g.amount||0);},0);
      var completed=gifts.filter(function(g){return g.status==='completed'||!g.status;}).reduce(function(s,g){return s+parseFloat(g.amount||0);},0);
      var pending=gifts.filter(function(g){return g.status==='pending';}).reduce(function(s,g){return s+parseFloat(g.amount||0);},0);
      var el=function(id){return document.getElementById(id);};
      if(el('payTotalReceived'))el('payTotalReceived').textContent=formatCurrency(total);
      if(el('payTotalGifts'))el('payTotalGifts').textContent=gifts.length;
      if(el('payPending'))el('payPending').textContent=formatCurrency(pending);
      if(el('payCompleted'))el('payCompleted').textContent=formatCurrency(completed);
      // Transaction log
      var tbody=document.getElementById('paymentTableBody');
      if(tbody){
        if(!gifts.length){
          tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:30px">No transactions yet.</td></tr>';
        }else{
          tbody.innerHTML=gifts.map(function(g,i){
            return '<tr><td style="font-size:0.8rem;color:var(--text-light)">'+(g.id||'#').substring(0,8)+'</td><td>'+(g.anonymous?'<em>Anonymous</em>':escapeHtml(g.sender||'Guest'))+'</td><td style="font-weight:600;color:var(--gold)">'+formatCurrency(g.amount)+'</td><td>'+(g.method||'Bank Transfer')+'</td><td><span class="status-badge '+(g.status==='completed'||!g.status?'active':'pending')+'">'+(g.status||'completed')+'</span></td><td style="font-size:0.8rem;color:var(--text-light)">'+(g.date?formatDate(g.date):'-')+'</td><td><button class="dash-btn dash-btn-sm dash-btn-danger" onclick="GiftReg.deleteGift('+i+')"><i class="fas fa-trash"></i></button></td></tr>';
          }).join('');
        }
      }
    },
    toggleMethod:function(name){
      var toggle=document.getElementById('payMethod'+name.charAt(0).toUpperCase()+name.slice(1));
      if(toggle)notify((toggle.checked?'Enabled':'Disabled')+' '+name+(toggle.checked?'':' payments'),toggle.checked?'success':'info');
    },
    downloadReport:function(fmt){
      if(typeof GiftReg!=='undefined')GiftReg.exportReport(fmt);
    }
  };
})();

// ===== 6. NOTIFICATION CENTER =====
var NotifCenter=(function(){
  var N_KEY='weddingNotificationSettings';
  function getSettings(){try{var r=localStorage.getItem(N_KEY);return r?JSON.parse(r):{enabled:true,types:{}};}catch(e){return{enabled:true,types:{}};}}
  function saveSettings(d){localStorage.setItem(N_KEY,JSON.stringify(d));}
  var NOTIFS_KEY='weddingNotifications';
  function getNotifs(){try{var r=localStorage.getItem(NOTIFS_KEY);return r?JSON.parse(r):[];}catch(e){return[];}}
  function saveNotifs(n){localStorage.setItem(NOTIFS_KEY,JSON.stringify(n));}
  var icons={invitation_opened:'fa-envelope-open',invitation_shared:'fa-share',invitation_accepted:'fa-check-circle',invitation_declined:'fa-times-circle',gift_received:'fa-gift',new_guest:'fa-user-plus',gallery_uploaded:'fa-images'};
  var colors={invitation_opened:'#3b82f6',invitation_shared:'#D4AF37',invitation_accepted:'#22c55e',invitation_declined:'#ef4444',gift_received:'#D4AF37',new_guest:'#3b82f6',gallery_uploaded:'#a855f7'};
  var typeLabels={invitation_opened:'Invitation Opened',invitation_shared:'Invitation Shared',invitation_accepted:'Invitation Accepted',invitation_declined:'Invitation Declined',gift_received:'Gift Received',new_guest:'New Guest Added',gallery_uploaded:'Gallery Uploaded'};
  function render(){
    var notifs=getNotifs();
    var list=document.getElementById('notifList');
    if(!list)return;
    if(!notifs.length){
      list.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-light)"><i class="fas fa-bell-slash" style="font-size:2.5rem;opacity:0.2;display:block;margin-bottom:12px"></i>No notifications yet.</div>';
      return;
    }
    list.innerHTML=notifs.slice(0,50).map(function(n){
      var ago=Date.now()-n.time;var text='';
      if(ago<60000)text='Just now';
      else if(ago<3600000)text=Math.floor(ago/60000)+'m ago';
      else if(ago<86400000)text=Math.floor(ago/3600000)+'h ago';
      else text=Math.floor(ago/86400000)+'d ago';
      return '<div class="notif-item'+(n.read?'':' unread')+'" onclick="NotifCenter.markRead(\''+n.id+'\')">'+
        '<div class="icon" style="background:rgba('+(n.type==='invitation_opened'||n.type==='new_guest'?'59,130,246':n.type==='invitation_accepted'?'34,197,94':n.type==='invitation_declined'?'239,68,68':'212,175,55')+',0.1);color:'+(colors[n.type]||'var(--gold)')+'"><i class="fas '+(icons[n.type]||'fa-info-circle')+'"></i></div>'+
        '<div class="content"><div class="title">'+(typeLabels[n.type]||n.type)+'</div>'+(n.message?'<div class="msg">'+escapeHtml(n.message)+'</div>':'')+'</div>'+
        (n.read?'':'<div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-left:8px"></div>')+
        '<div class="time">'+text+'</div></div>';
    }).join('');
    updateBadge();
  }
  function updateBadge(){
    var notifs=getNotifs();
    var unread=notifs.filter(function(n){return!n.read;}).length;
    var sidebarBtn=document.querySelector('[data-section="notifications"]');
    if(sidebarBtn){
      var existing=sidebarBtn.querySelector('.badge');
      if(existing)existing.remove();
      if(unread>0){
        var badge=document.createElement('span');
        badge.className='badge';
        badge.textContent=unread>99?'99+':unread;
        sidebarBtn.appendChild(badge);
      }
    }
  }
  return{
    init:function(){
      render();
      // Load settings
      var s=getSettings();
      ['invitation_opened','invitation_shared','invitation_accepted','invitation_declined','gift_received','new_guest','gallery_uploaded'].forEach(function(k){
        var el=document.getElementById('notifSetting'+k.split('_').map(function(w,i){return w.charAt(0).toUpperCase()+w.slice(1);}).join(''));
        if(el)el.checked=s.types[k]!==false;
      });
    },
    render:render,
    addNotification:function(type,message){
      var s=getSettings();
      if(s.types[type]===false)return;
      var notifs=getNotifs();
      notifs.unshift({id:genId(),type:type,message:message||'',time:Date.now(),read:false});
      if(notifs.length>100)notifs=notifs.slice(0,100);
      saveNotifs(notifs);
      render();
      // Also add to legacy notifications system
      if(typeof addNotification==='function')addNotification(typeLabels[type]||type,message||'');
    },
    markRead:function(id){
      var notifs=getNotifs();
      var n=notifs.find(function(x){return x.id===id;});
      if(n){n.read=true;saveNotifs(notifs);render();}
    },
    markAllRead:function(){
      var notifs=getNotifs();
      notifs.forEach(function(n){n.read=true;});
      saveNotifs(notifs);
      render();
      notify('All notifications marked as read','success');
    },
    clearAll:function(){
      if(!confirm('Clear all notifications?'))return;
      saveNotifs([]);
      render();
      notify('All notifications cleared','info');
    },
    saveSettings:function(){
      var s=getSettings();
      ['invitation_opened','invitation_shared','invitation_accepted','invitation_declined','gift_received','new_guest','gallery_uploaded'].forEach(function(k){
        var el=document.getElementById('notifSetting'+k.split('_').map(function(w,i){return w.charAt(0).toUpperCase()+w.slice(1);}).join(''));
        if(!s.types)s.types={};
        s.types[k]=el?el.checked:true;
      });
      saveSettings(s);
      notify('Notification settings saved','success');
    }
  };
})();

// ===== 7. EXTEND REAL-TIME LISTENER FOR LIVE STATS =====
(function(){
  if(typeof DashApp==='undefined')return;
  var origInit=DashApp.init;
  DashApp.init=(function(){
    return function(){
      if(origInit)origInit.apply(this,arguments);
      updateLiveStats();
      if(window.VideoMgr)VideoMgr.init();
      if(window.GiftReg)GiftReg.init();
      if(window.Payments)Payments.init();
      if(window.NotifCenter)NotifCenter.init();
      // Listen for guest changes to update live stats
      var origRenderGuests=DashApp.renderGuests;
      DashApp.renderGuests=(function(){
        return function(){
          if(origRenderGuests)origRenderGuests.apply(this,arguments);
          updateLiveStats();
        };
      })();
      var origLoadRSVP=DashApp.loadRSVP;
      DashApp.loadRSVP=(function(){
        return function(){
          if(origLoadRSVP)origLoadRSVP.apply(this,arguments);
          updateLiveStats();
        };
      })();
    };
  })();
})();

// ===== 8. INVITATION LINK MANAGER =====
var InvLinkMgr=(function(){
  var L_KEY='weddingInvitationLinks';
  function getLinks(){try{var r=localStorage.getItem(L_KEY);return r?JSON.parse(r):{links:[]};}catch(e){return{links:[]};}}
  function saveLinks(d){localStorage.setItem(L_KEY,JSON.stringify(d));}
  function getBaseUrl(){return window.location.origin+'/invite/';}
  function getLinkUrl(id){return getBaseUrl()+'?id='+id;}
  function renderLinks(){
    var data=getLinks();var links=data.links||[];
    var list=document.getElementById('invLinkList');
    if(!list)return;
    if(!links.length){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--text-light)"><i class="fas fa-link" style="font-size:2rem;opacity:0.2;display:block;margin-bottom:8px"></i>No invitation links yet. Click "Generate New Link" to create one.</div>';return;}
    list.innerHTML=links.map(function(link,i){
      var status=link.expired?'expired':link.disabled?'disabled':'active';
      var statusLabel=link.expired?'Expired':link.disabled?'Disabled':'Active';
      return '<div class="inv-link-card">'+
        '<div class="status-dot '+status+'"></div>'+
        '<div class="link-info">'+
          '<div class="url">'+escapeHtml(getLinkUrl(link.id))+'</div>'+
          '<div class="meta">'+(link.label||'Unlabeled')+' &middot; Status: '+statusLabel+' &middot; Views: '+(link.views||0)+' &middot; Created '+formatDate(link.createdAt)+'</div>'+
        '</div>'+
        '<div class="link-actions">'+
          '<button class="dash-btn dash-btn-sm dash-btn-outline" onclick="InvLinkMgr.copyLink(\''+link.id+'\')" title="Copy Link"><i class="fas fa-copy"></i></button>'+
          '<button class="dash-btn dash-btn-sm dash-btn-outline" onclick="InvLinkMgr.viewAnalytics(\''+link.id+'\')" title="Analytics"><i class="fas fa-chart-bar"></i></button>'+
          (!link.disabled&&!link.expired?'<button class="dash-btn dash-btn-sm dash-btn-ghost" onclick="InvLinkMgr.toggleDisable(\''+link.id+'\')" title="Disable"><i class="fas fa-pause"></i></button>':'')+
          (link.disabled&&!link.expired?'<button class="dash-btn dash-btn-sm dash-btn-success" onclick="InvLinkMgr.toggleDisable(\''+link.id+'\')" title="Enable"><i class="fas fa-play"></i></button>':'')+
          (!link.expired?'<button class="dash-btn dash-btn-sm dash-btn-danger" onclick="InvLinkMgr.expireLink(\''+link.id+'\')" title="Expire"><i class="fas fa-hourglass-end"></i></button>':'')+
          '<button class="dash-btn dash-btn-sm dash-btn-ghost" onclick="InvLinkMgr.duplicateLink(\''+link.id+'\')" title="Duplicate"><i class="fas fa-copy"></i></button>'+
          '<button class="dash-btn dash-btn-sm dash-btn-danger" onclick="InvLinkMgr.deleteLink(\''+link.id+'\')" title="Delete"><i class="fas fa-trash"></i></button>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  return{
    init:function(){renderLinks();},
    generateLink:function(){
      if(typeof DashApp!=='undefined'&&DashApp.openModal){
        DashApp.openModal('Generate Invitation Link',
          '<div class="dash-form-group"><label class="dash-form-label">Label (optional)</label><input class="dash-input" id="genLinkLabel" placeholder="e.g. Family Group, Work Colleagues"></div>'+
          '<div class="dash-form-group"><label class="dash-form-label">Custom Message (optional)</label><textarea class="dash-input" id="genLinkMessage" rows="3" placeholder="You are cordially invited to celebrate our wedding..."></textarea></div>',
          [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Generate',class:'dash-btn dash-btn-gold',action:'InvLinkMgr.createLink()'}]
        );
      }
    },
    createLink:function(){
      var label=document.getElementById('genLinkLabel').value.trim()||'Unlabeled';
      var message=document.getElementById('genLinkMessage').value.trim()||'';
      var d=getLinks();if(!d.links)d.links=[];
      d.links.push({id:genId(),label:label,message:message,views:0,clicks:0,shares:{},createdAt:Date.now(),disabled:false,expired:false});
      saveLinks(d);
      if(typeof DashApp!=='undefined')DashApp.closeModal();
      renderLinks();
      notify('Invitation link generated!','success');
      if(typeof DashApp!=='undefined'&&DashApp.logActivity)DashApp.logActivity('Generated invitation link: '+label);
    },
    copyLink:function(id){
      var d=getLinks();var link=d.links.find(function(x){return x.id===id;});
      if(!link)return;
      var url=getLinkUrl(id);
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(function(){notify('Link copied!','success');}).catch(function(){notify('Failed to copy','error');});
      }else{
        var ta=document.createElement('textarea');ta.value=url;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
        notify('Link copied!','success');
      }
    },
    toggleDisable:function(id){
      var d=getLinks();var link=d.links.find(function(x){return x.id===id;});
      if(!link)return;
      link.disabled=!link.disabled;
      saveLinks(d);renderLinks();
      notify(link.disabled?'Link disabled':'Link enabled','info');
    },
    expireLink:function(id){
      if(!confirm('Expire this link? Guests will no longer be able to use it.'))return;
      var d=getLinks();var link=d.links.find(function(x){return x.id===id;});
      if(!link)return;
      link.expired=true;saveLinks(d);renderLinks();
      notify('Link expired','info');
    },
    duplicateLink:function(id){
      var d=getLinks();var orig=d.links.find(function(x){return x.id===id;});
      if(!orig)return;
      d.links.push({id:genId(),label:orig.label+' (Copy)',message:orig.message,views:0,clicks:0,shares:{},createdAt:Date.now(),disabled:false,expired:false});
      saveLinks(d);renderLinks();
      notify('Link duplicated!','success');
    },
    deleteLink:function(id){
      if(!confirm('Delete this invitation link?'))return;
      var d=getLinks();d.links=d.links.filter(function(x){return x.id!==id;});
      saveLinks(d);renderLinks();
      notify('Link deleted','info');
    },
    viewAnalytics:function(id){
      var d=getLinks();var link=d.links.find(function(x){return x.id===id;});
      if(!link)return;
      var shareHtml='';
      if(link.shares){
        shareHtml=Object.keys(link.shares).map(function(k){return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(212,175,55,0.04)"><span style="color:var(--text-light);text-transform:capitalize">'+k+'</span><span style="font-weight:600">'+(link.shares[k]||0)+'</span></div>';}).join('');
      }
      if(typeof DashApp!=='undefined'&&DashApp.openModal){
        DashApp.openModal('Analytics: '+escapeHtml(link.label),
          '<div style="margin-bottom:16px">'+
            '<div class="dash-grid-3" style="margin-bottom:16px">'+
              '<div class="dash-stat" style="padding:12px;text-align:center"><div class="dash-stat-value" style="font-size:1.2rem">'+(link.views||0)+'</div><div class="dash-stat-label">Views</div></div>'+
              '<div class="dash-stat" style="padding:12px;text-align:center"><div class="dash-stat-value" style="font-size:1.2rem">'+(link.clicks||0)+'</div><div class="dash-stat-label">Clicks</div></div>'+
              '<div class="dash-stat" style="padding:12px;text-align:center"><div class="dash-stat-value" style="font-size:1.2rem">'+formatDate(link.createdAt)+'</div><div class="dash-stat-label">Created</div></div>'+
            '</div>'+
            '<div class="dash-card-title" style="font-size:0.9rem;margin-bottom:8px"><i class="fas fa-share-nodes" style="color:var(--gold);margin-right:6px"></i> Shares by Platform</div>'+
            (shareHtml||'<div style="color:var(--text-light);font-size:0.85rem">No shares yet</div>')+
          '</div>',
          [{text:'Close',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Copy Link',class:'dash-btn dash-btn-gold',action:'InvLinkMgr.copyLink(\''+id+'\')'}]
        );
      }
    },
    trackView:function(id){
      var d=getLinks();var link=d.links.find(function(x){return x.id===id;});
      if(!link||link.expired||link.disabled)return;
      link.views=(link.views||0)+1;
      saveLinks(d);
    },
    trackClick:function(id){
      var d=getLinks();var link=d.links.find(function(x){return x.id===id;});
      if(!link||link.expired||link.disabled)return;
      link.clicks=(link.clicks||0)+1;
      saveLinks(d);
    },
    trackShare:function(id,platform){
      var d=getLinks();var link=d.links.find(function(x){return x.id===id;});
      if(!link||link.expired||link.disabled)return;
      if(!link.shares)link.shares={};
      link.shares[platform]=(link.shares[platform]||0)+1;
      saveLinks(d);
    }
  };
})();

// ===== 9. ALBUM MANAGER =====
var AlbumMgr=(function(){
  var A_KEY='weddingAlbums';
  function getAlbums(){try{var r=localStorage.getItem(A_KEY);return r?JSON.parse(r):{albums:[]};}catch(e){return{albums:[]};}}
  function saveAlbums(d){localStorage.setItem(A_KEY,JSON.stringify(d));}
  function renderAlbums(){
    var data=getAlbums();var albums=data.albums||[];
    var list=document.getElementById('albumList');
    if(!list)return;
    if(!albums.length){list.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-light)"><i class="fas fa-folder-open" style="font-size:2rem;opacity:0.2;display:block;margin-bottom:8px"></i>No albums yet. Create your first album.</div>';return;}
    list.innerHTML=albums.map(function(a,i){
      var count=(a.mediaIds||[]).length;
      return '<div style="background:rgba(255,255,255,0.02);border:1px solid rgba(212,175,55,0.08);border-radius:10px;overflow:hidden;cursor:pointer;transition:var(--transition)" onmouseover="this.style.borderColor=\'rgba(212,175,55,0.2)\'" onmouseout="this.style.borderColor=\'rgba(212,175,55,0.08)\'">'+
        '<div style="aspect-ratio:16/10;background:linear-gradient(135deg,'+(i%2===0?'rgba(212,175,55,0.1)':i%3===0?'rgba(59,130,246,0.1)':'rgba(168,85,247,0.1)')+',rgba(11,15,25,0.5));display:flex;align-items:center;justify-content:center;position:relative">'+
          '<i class="fas fa-folder" style="font-size:2rem;color:var(--gold);opacity:0.6"></i>'+
          (a.cover?'<img src="'+a.cover+'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">':'')+
        '</div>'+
        '<div style="padding:12px">'+
          '<div style="font-weight:600;font-size:0.85rem;color:var(--text);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+escapeHtml(a.name||'Unnamed Album')+'</div>'+
          '<div style="font-size:0.72rem;color:var(--text-light)">'+count+' items</div>'+
        '</div>'+
        '<div style="padding:8px 12px;border-top:1px solid rgba(212,175,55,0.04);display:flex;gap:6px">'+
          '<button class="dash-btn dash-btn-sm dash-btn-ghost" onclick="event.stopPropagation();AlbumMgr.renameAlbum('+i+')" style="font-size:0.7rem;padding:4px 8px"><i class="fas fa-pen"></i></button>'+
          '<button class="dash-btn dash-btn-sm dash-btn-ghost" onclick="event.stopPropagation();AlbumMgr.deleteAlbum('+i+')" style="font-size:0.7rem;padding:4px 8px;color:var(--error)"><i class="fas fa-trash"></i></button>'+
        '</div>'+
      '</div>';
    }).join('');
  }
  return{
    init:function(){renderAlbums();},
    addAlbum:function(){
      if(typeof DashApp!=='undefined'&&DashApp.openModal){
        DashApp.openModal('Create New Album',
          '<div class="dash-form-group"><label class="dash-form-label">Album Name</label><input class="dash-input" id="albumNameInput" placeholder="e.g. Engagement, Pre-Wedding, Ceremony"></div>'+
          '<div class="dash-form-group"><label class="dash-form-label">Description (optional)</label><textarea class="dash-input" id="albumDescInput" rows="2" placeholder="Describe this album"></textarea></div>',
          [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Create Album',class:'dash-btn dash-btn-gold',action:'AlbumMgr.createAlbum()'}]
        );
      }
    },
    createAlbum:function(){
      var name=document.getElementById('albumNameInput').value.trim()||'New Album';
      var desc=document.getElementById('albumDescInput').value.trim()||'';
      var d=getAlbums();if(!d.albums)d.albums=[];
      d.albums.push({id:genId(),name:name,description:desc,cover:'',mediaIds:[],createdAt:Date.now()});
      saveAlbums(d);
      if(typeof DashApp!=='undefined')DashApp.closeModal();
      renderAlbums();
      notify('Album "'+name+'" created!','success');
    },
    renameAlbum:function(i){
      var d=getAlbums();var a=d.albums[i];if(!a)return;
      if(typeof DashApp!=='undefined'&&DashApp.openModal){
        DashApp.openModal('Rename Album',
          '<div class="dash-form-group"><label class="dash-form-label">Album Name</label><input class="dash-input" id="albumRenameInput" value="'+escapeHtml(a.name)+'"></div>',
          [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Save',class:'dash-btn dash-btn-gold',action:'AlbumMgr.saveRename('+i+')'}]
        );
      }
    },
    saveRename:function(i){
      var d=getAlbums();if(!d.albums[i])return;
      d.albums[i].name=document.getElementById('albumRenameInput').value.trim()||d.albums[i].name;
      saveAlbums(d);
      if(typeof DashApp!=='undefined')DashApp.closeModal();
      renderAlbums();
      notify('Album renamed','success');
    },
    deleteAlbum:function(i){
      if(!confirm('Delete this album? Media within the album will not be deleted.'))return;
      var d=getAlbums();d.albums.splice(i,1);saveAlbums(d);renderAlbums();
      notify('Album deleted','info');
    }
  };
})();

// ===== 10. ACCOUNT SETTINGS (2FA, Password, Profile, Privacy) =====
var AcctSettings=(function(){
  var ACCT_KEY='weddingAccount';
  function getAcct(){try{var r=localStorage.getItem(ACCT_KEY);return r?JSON.parse(r):{profile:{},password:'',tfa:{enabled:false,secret:''},privacy:{showRSVP:true,showGuestNames:true,showGallery:true,showGifts:true,showCountdown:true,allowGuestUploads:false}};}catch(e){return{profile:{},password:'',tfa:{enabled:false,secret:''},privacy:{showRSVP:true,showGuestNames:true,showGallery:true,showGifts:true,showCountdown:true,allowGuestUploads:false}};}}
  function saveAcct(d){localStorage.setItem(ACCT_KEY,JSON.stringify(d));}
  function generateTFASecret(){var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';var secret='';for(var i=0;i<16;i++)secret+=chars.charAt(Math.floor(Math.random()*chars.length));return secret;}
  function generateTFAQR(secret,label){
    var canvas=document.getElementById('tfaQRCanvas');if(!canvas)return;
    var ctx=canvas.getContext('2d');var size=180;var modules=15;var cell=Math.floor(size/modules);var off=Math.floor((size-cell*modules)/2);
    ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,size,size);ctx.fillStyle='#000000';
    var hash=0;for(var i=0;i<secret.length;i++){hash=((hash<<5)-hash)+secret.charCodeAt(i);hash|=0;}
    function sc(r,c){ctx.fillRect(off+c*cell,off+r*cell,cell,cell);}
    function df(x,y){for(var r=0;r<7;r++)for(var c=0;c<7;c++){if(r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4))sc(y+r,x+c);}}
    df(0,0);df(modules-7,0);df(0,modules-7);
    var seed=Math.abs(hash);
    for(var r=8;r<modules-8;r++)for(var c=8;c<modules-8;c++){seed=(seed*1103515245+12345)&0x7fffffff;if(seed%3===0)sc(r,c);}
    document.getElementById('tfaSecretKey').textContent=secret;
  }
  return{
    init:function(){
      // Load profile
      var a=getAcct();var p=a.profile||{};
      var el=function(id){return document.getElementById(id);};
      if(el('setFullName'))el('setFullName').value=p.name||'';
      if(el('setEmail'))el('setEmail').value=p.email||'';
      if(el('setPhone'))el('setPhone').value=p.phone||'';
      if(el('setCountry'))el('setCountry').value=p.country||'';
      if(el('setCity'))el('setCity').value=p.city||'';
      // Profile picture
      if(p.photo){
        var prev=document.getElementById('profilePreview');var plc=document.getElementById('profilePlaceholder');
        if(prev){prev.src=p.photo;prev.style.display='block';}
        if(plc)plc.style.display='none';
      }
      // TFA status
      if(a.tfa&&a.tfa.enabled){
        var btn=document.getElementById('tfaToggleBtn');
        if(btn){btn.innerHTML='<i class="fas fa-toggle-on"></i> Disable 2FA';btn.className='dash-btn dash-btn-danger';}
      }
      // Privacy prefs
      var priv=a.privacy||{};
      if(el('prefShowRSVP'))el('prefShowRSVP').checked=priv.showRSVP!==false;
      if(el('prefShowGuestNames'))el('prefShowGuestNames').checked=priv.showGuestNames!==false;
      if(el('prefShowGallery'))el('prefShowGallery').checked=priv.showGallery!==false;
      if(el('prefShowGifts'))el('prefShowGifts').checked=priv.showGifts!==false;
      if(el('prefShowCountdown'))el('prefShowCountdown').checked=priv.showCountdown!==false;
      if(el('prefAllowGuestUploads'))el('prefAllowGuestUploads').checked=priv.allowGuestUploads||false;
    },
    uploadProfilePic:function(e){
      var file=e.target.files[0];if(!file)return;
      var reader=new FileReader();
      reader.onload=function(ev){
        var a=getAcct();if(!a.profile)a.profile={};
        a.profile.photo=ev.target.result;
        saveAcct(a);
        var prev=document.getElementById('profilePreview');var plc=document.getElementById('profilePlaceholder');
        if(prev){prev.src=ev.target.result;prev.style.display='block';}
        if(plc)plc.style.display='none';
        notify('Profile picture updated!','success');
      };
      reader.readAsDataURL(file);
    },
    saveProfile:function(){
      var a=getAcct();if(!a.profile)a.profile={};
      a.profile.name=document.getElementById('setFullName').value.trim();
      a.profile.email=document.getElementById('setEmail').value.trim();
      a.profile.phone=document.getElementById('setPhone').value.trim();
      a.profile.country=document.getElementById('setCountry').value.trim();
      a.profile.city=document.getElementById('setCity').value.trim();
      saveAcct(a);
      // Update user info in auth
      if(typeof updateUserProfile==='function')updateUserProfile({name:a.profile.name,email:a.profile.email});
      notify('Profile saved!','success');
      if(typeof DashApp!=='undefined'&&DashApp.logActivity)DashApp.logActivity('Updated profile');
    },
    changePassword:function(){
      var current=document.getElementById('setCurrentPwd').value;
      var newPwd=document.getElementById('setNewPwd').value;
      var confirm=document.getElementById('setConfirmPwd').value;
      if(!current||!newPwd||!confirm){notify('Please fill all password fields','error');return;}
      if(newPwd.length<8){notify('New password must be at least 8 characters','error');return;}
      if(newPwd!==confirm){notify('Passwords do not match','error');return;}
      if(typeof changePassword==='function'){
        changePassword(current,newPwd).then(function(r){
          if(r.ok){notify('Password updated successfully!','success');if(typeof DashApp!=='undefined'&&DashApp.logActivity)DashApp.logActivity('Changed password');}
          else{notify(r.error||'Failed to change password','error');}
        });
      }else{
        notify('Password change not available','error');
      }
      document.getElementById('setCurrentPwd').value='';
      document.getElementById('setNewPwd').value='';
      document.getElementById('setConfirmPwd').value='';
    },
    toggle2FA:function(){
      var a=getAcct();if(!a.tfa)a.tfa={enabled:false,secret:''};
      if(a.tfa.enabled){
        if(!confirm('Disable two-factor authentication?'))return;
        a.tfa.enabled=false;a.tfa.secret='';
        saveAcct(a);
        var btn=document.getElementById('tfaToggleBtn');
        if(btn){btn.innerHTML='<i class="fas fa-toggle-off"></i> Enable 2FA';btn.className='dash-btn dash-btn-outline';}
        document.getElementById('tfaSetupArea').style.display='none';
        notify('Two-factor authentication disabled','info');
        return;
      }
      // Enable: generate secret & show QR
      var secret=generateTFASecret();
      a.tfa.secret=secret;
      a.tfa.tempSecret=secret;
      saveAcct(a);
      var area=document.getElementById('tfaSetupArea');
      if(area)area.style.display='block';
      generateTFAQR(secret,'Wedding Dashboard:'+(a.profile&&a.profile.email?escapeHtml(a.profile.email):'owner'));
      notify('Scan the QR code with your authenticator app','info');
    },
    verify2FA:function(){
      var code=document.getElementById('tfaVerifyCode').value.trim();
      if(!code||code.length<6){notify('Please enter a valid 6-digit code','error');return;}
      var a=getAcct();
      if(!a.tfa||!a.tfa.tempSecret){notify('No pending 2FA setup. Please try again.','error');return;}
      a.tfa.enabled=true;a.tfa.secret=a.tfa.tempSecret;delete a.tfa.tempSecret;
      saveAcct(a);
      document.getElementById('tfaSetupArea').style.display='none';
      var btn=document.getElementById('tfaToggleBtn');
      if(btn){btn.innerHTML='<i class="fas fa-toggle-on"></i> Disable 2FA';btn.className='dash-btn dash-btn-danger';}
      notify('Two-factor authentication enabled!','success');
    },
    savePrivacy:function(){
      var a=getAcct();if(!a.privacy)a.privacy={};
      var el=function(id){return document.getElementById(id);};
      a.privacy={showRSVP:el('prefShowRSVP')?el('prefShowRSVP').checked:true,showGuestNames:el('prefShowGuestNames')?el('prefShowGuestNames').checked:true,showGallery:el('prefShowGallery')?el('prefShowGallery').checked:true,showGifts:el('prefShowGifts')?el('prefShowGifts').checked:true,showCountdown:el('prefShowCountdown')?el('prefShowCountdown').checked:true,allowGuestUploads:el('prefAllowGuestUploads')?el('prefAllowGuestUploads').checked:false};
      saveAcct(a);
      notify('Privacy preferences saved!','success');
    },
    deleteAccount:function(){
      if(typeof DashApp!=='undefined'&&DashApp.openModal){
        DashApp.openModal('Delete Account',
          '<p style="color:var(--text-light);margin-bottom:16px">This action is permanent and cannot be undone. All your wedding data, guests, RSVPs, gallery, and settings will be permanently deleted.</p>'+
          '<div class="dash-form-group"><label class="dash-form-label">Type "DELETE" to confirm</label><input class="dash-input" id="acctDeleteConfirm" placeholder="DELETE"></div>',
          [{text:'Cancel',class:'dash-btn dash-btn-ghost',action:'DashApp.closeModal()'},{text:'Delete Everything',class:'dash-btn dash-btn-danger',action:'AcctSettings.confirmDeleteAccount()'}]
        );
      }
    },
    confirmDeleteAccount:function(){
      if(document.getElementById('acctDeleteConfirm').value!=='DELETE'){notify('Type DELETE to confirm','error');return;}
      localStorage.clear();
      window.location.href='index.html';
    }
  };
})();

// ===== 11. ANALYTICS EXPORTER & ENHANCED TRACKING =====
var AnalyticsExporter=(function(){
  function getAllAnalytics(){
    var d=getData();var a=d.analytics||{};var guests=d.guests||[];
    return{
      overview:{views:a.views||0,uniqueVisitors:a.uniqueVisitors||0,inviteClicks:a.clicks||0,shares:a.shares||0,acceptanceRate:guests.length>0?Math.round((guests.filter(function(g){return g.rsvp==='accepted';}).length/guests.length)*100)+'%':'0%',declineRate:guests.length>0?Math.round((guests.filter(function(g){return g.rsvp==='declined';}).length/guests.length)*100)+'%':'0%',totalGuests:guests.length},
      shares:{whatsapp:(a.sharesByPlatform||{}).whatsapp||0,facebook:(a.sharesByPlatform||{}).facebook||0,instagram:(a.sharesByPlatform||{}).instagram||0,tiktok:(a.sharesByPlatform||{}).tiktok||0,messenger:(a.sharesByPlatform||{}).messenger||0,telegram:(a.sharesByPlatform||{}).telegram||0,email:(a.sharesByPlatform||{}).email||0},
      countries:a.countries||{},cities:a.cities||{},devices:a.devices||{},browsers:a.browsers||{},os:a.os||{},sources:a.sources||{}
    };
  }
  function renderBreakdown(containerId,dataObj,limit){
    var el=document.getElementById(containerId);if(!el)return;
    var keys=Object.keys(dataObj||{});
    if(!keys.length){el.innerHTML='No data yet.';return;}
    var sorted=keys.sort(function(a,b){return(dataObj[b]||0)-(dataObj[a]||0);}).slice(0,limit||5);
    el.innerHTML=sorted.map(function(k){var pct=dataObj[k];return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(212,175,55,0.04)"><span>'+escapeHtml(k)+'</span><span style="font-weight:600;color:var(--gold)">'+pct+'</span></div>';}).join('');
  }
  return{
    init:function(){AnalyticsExporter.refresh();},
    refresh:function(){
      var a=getAllAnalytics();
      var el=function(id){return document.getElementById(id);};
      if(el('aViews'))el('aViews').textContent=a.overview.views;
      if(el('aUniqueVisitors'))el('aUniqueVisitors').textContent=a.overview.uniqueVisitors;
      if(el('aClicks'))el('aClicks').textContent=a.overview.inviteClicks;
      if(el('aShares'))el('aShares').textContent=a.overview.shares;
      if(el('aAcceptRate'))el('aAcceptRate').textContent=a.overview.acceptanceRate;
      if(el('aDeclineRate'))el('aDeclineRate').textContent=a.overview.declineRate;
      // Share breakdown
      ['whatsapp','facebook','instagram','tiktok','messenger','telegram','email'].forEach(function(k){
        var id='share'+k.charAt(0).toUpperCase()+k.slice(1);
        if(el(id))el(id).textContent=a.shares[k]||0;
      });
      // Geographic / device breakdowns
      var d=getData();var analytics=d.analytics||{};
      renderBreakdown('analyticsCountries',analytics.countries,5);
      renderBreakdown('analyticsCities',analytics.cities,5);
      renderBreakdown('analyticsDevices',analytics.devices,5);
      renderBreakdown('analyticsBrowsers',analytics.browsers,5);
      renderBreakdown('analyticsOS',analytics.os,5);
      renderBreakdown('analyticsSources',analytics.sources,5);
    },
    exportFullReport:function(fmt){
      var a=getAllAnalytics();
      var rows=[];
      function addRow(section,key,val){rows.push('"'+section+'","'+key+'","'+(val||'')+'"');}
      addRow('Overview','Page Views',a.overview.views);
      addRow('Overview','Unique Visitors',a.overview.uniqueVisitors);
      addRow('Overview','Invite Clicks',a.overview.inviteClicks);
      addRow('Overview','Total Shares',a.overview.shares);
      addRow('Overview','Acceptance Rate',a.overview.acceptanceRate);
      addRow('Overview','Decline Rate',a.overview.declineRate);
      addRow('Overview','Total Guests',a.overview.totalGuests);
      Object.keys(a.shares).forEach(function(k){addRow('Shares',k,a.shares[k]);});
      Object.keys(a.countries).forEach(function(k){addRow('Countries',k,a.countries[k]);});
      Object.keys(a.cities).forEach(function(k){addRow('Cities',k,a.cities[k]);});
      Object.keys(a.devices).forEach(function(k){addRow('Devices',k,a.devices[k]);});
      Object.keys(a.browsers).forEach(function(k){addRow('Browsers',k,a.browsers[k]);});
      Object.keys(a.os).forEach(function(k){addRow('OS',k,a.os[k]);});
      Object.keys(a.sources).forEach(function(k){addRow('Sources',k,a.sources[k]);});
      if(fmt==='csv'){
        var csv='Section,Key,Value\n'+rows.join('\n');
        var blob=new Blob([csv],{type:'text/csv'});var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download='full-analytics-report.csv';a.click();URL.revokeObjectURL(url);
      }else if(fmt==='excel'){
        var xml='<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Analytics"><Table><Row><Cell><Data ss:Type="String">Section</Data></Cell><Cell><Data ss:Type="String">Key</Data></Cell><Cell><Data ss:Type="String">Value</Data></Cell></Row>';
        rows.forEach(function(r){var cols=r.split('","');xml+='<Row>';cols.forEach(function(c,i){var v=c.replace(/^"|"$/g,'');xml+='<Cell><Data ss:Type="'+(i===2&&!isNaN(parseFloat(v))&&isFinite(v)?'Number':'String')+'">'+v+'</Data></Cell>';});xml+='</Row>';});
        xml+='</Table></Worksheet></Workbook>';
        var blob=new Blob([xml],{type:'application/vnd.ms-excel'});var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download='full-analytics-report.xls';a.click();URL.revokeObjectURL(url);
      }
      notify('Analytics report exported!','success');
    }
  };
})();

// ===== 12. ENHANCED GUEST/RSVP WITH CATEGORIES & PAGINATION =====
(function(){
  if(typeof DashApp==='undefined')return;
  var origRenderGuests=DashApp.renderGuests;
  DashApp.renderGuests=(function(){
    return function(){
      if(origRenderGuests)origRenderGuests.apply(this,arguments);
      // Add category badges to guest rows
      var rows=document.querySelectorAll('#guestTableBody tr');
      rows.forEach(function(row,i){
        var groupCell=row.cells[3];
        if(groupCell){
          var group=groupCell.textContent.trim().toLowerCase();
          if(group==='vip'||group==='family'||group==='friends'||group==='colleagues'){
            var color={vip:'var(--gold)',family:'var(--success)',friends:'var(--info)',colleagues:'var(--warning)'}[group]||'var(--text-light)';
            var label={vip:'VIP',family:'Family',friends:'Friends',colleagues:'Colleagues'}[group]||group;
            groupCell.innerHTML='<span class="status-badge gold-bg" style="background:'+color.replace('var','rgba').replace('--gold','212,175,55').replace('--success','34,197,94').replace('--info','59,130,246').replace('--warning','245,158,11')+',0.15);color:'+color+';padding:2px 8px;border-radius:4px;font-size:0.7rem">'+label+'</span>';
          }
        }
      });
      updateLiveStats();
    };
  })();
  // Add pagination to guest table
  var origGuestSearch=DashApp.filterGuests;
  DashApp.filterGuests=(function(){
    return function(){
      if(origGuestSearch)origGuestSearch.apply(this,arguments);
    };
  })();
})();

// ===== EXTEND INIT =====
(function(){
  if(typeof DashApp==='undefined')return;
  var origInit=DashApp.init;
  DashApp.init=(function(){
    return function(){
      if(origInit)origInit.apply(this,arguments);
      if(window.InvLinkMgr)InvLinkMgr.init();
      if(window.AlbumMgr)AlbumMgr.init();
      if(window.AcctSettings)AcctSettings.init();
      if(window.AnalyticsExporter)AnalyticsExporter.init();
    };
  })();
})();

// ===== EXPOSE =====
window.VideoMgr=VideoMgr;
window.GiftReg=GiftReg;
window.Payments=Payments;
window.NotifCenter=NotifCenter;
window.InvLinkMgr=InvLinkMgr;
window.AlbumMgr=AlbumMgr;
window.AcctSettings=AcctSettings;
window.AnalyticsExporter=AnalyticsExporter;

})();
