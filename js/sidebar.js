/**
 * Collapsible Sidebar Navigation
 * - Sidebar visible ONLY on Home Page (index.html)
 * - On all other pages: sidebar hidden, back button shown
 * - Desktop: sidebar visible by default on home, toggle to collapse
 * - Mobile: sidebar hidden by default, toggle to open as overlay
 * - Esc key closes on mobile
 * - Click outside closes on mobile
 * - State persisted in localStorage
 */
(function(){
'use strict';

var SIDEBAR_KEY='wedding_sidebar_state';
var sidebar,toggle,overlay,isMobile,isHome;

function init(){
  /* Phase 19: Never initialize sidebar on public invite pages */
  if (window.__PUBLIC_INVITE_PAGE === true) return;

  sidebar=document.getElementById('sidebarNav');
  toggle=document.getElementById('sidebarToggle');
  overlay=document.getElementById('sidebarOverlay');

  var path=window.location.pathname.split('/').pop()||'index.html';
  isHome=(path===''||path==='index.html');

  if(isHome){
    initSidebar();
  }else{
    initInnerPage();
  }
}

function initSidebar(){
  if(!sidebar||!toggle) return;

  isMobile=window.innerWidth<=768;

  var state=localStorage.getItem(SIDEBAR_KEY);
  if(!isMobile && state==='collapsed'){
    document.body.classList.add('sidebar-collapsed');
    toggle.classList.add('active');
  }

  toggle.addEventListener('click',function(e){
    e.stopPropagation();
    if(isMobile){
      openMobileSidebar();
    }else{
      toggleDesktopSidebar();
    }
  });

  var closeBtn=sidebar.querySelector('.sidebar-close');
  if(closeBtn){
    closeBtn.addEventListener('click',function(){
      if(isMobile) closeMobileSidebar();
      else collapseDesktopSidebar();
    });
  }

  if(overlay){
    overlay.addEventListener('click',function(){
      closeMobileSidebar();
    });
  }

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && isMobile && sidebar.classList.contains('mobile-open')){
      closeMobileSidebar();
      toggle.focus();
    }
  });

  sidebar.querySelectorAll('.sidebar-link').forEach(function(link){
    link.addEventListener('click',function(){
      if(isMobile) closeMobileSidebar();
    });
  });

  var resizeTimer;
  window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(function(){
      var wasMobile=isMobile;
      isMobile=window.innerWidth<=768;
      if(wasMobile && !isMobile){
        closeMobileSidebar();
        var state=localStorage.getItem(SIDEBAR_KEY);
        if(state==='collapsed'){
          document.body.classList.add('sidebar-collapsed');
          toggle.classList.add('active');
        }
      }else if(!wasMobile && isMobile){
        document.body.classList.remove('sidebar-collapsed');
        toggle.classList.remove('active');
      }
    },150);
  });

  setActiveLink();
  applyGuestRestrictions();
}

function initInnerPage(){
  document.body.classList.add('inner-page');

  if(sidebar) sidebar.style.display='none';
  if(toggle) toggle.style.display='none';
  if(overlay) overlay.style.display='none';

  var wrapper=document.querySelector('.page-wrapper');
  if(wrapper) wrapper.style.marginLeft='0';

  createBackButton();
  applyGuestRestrictions();
}

function createBackButton(){
  if(document.querySelector('.inner-back-btn')) return;

  var btn=document.createElement('a');
  btn.href='index.html';
  btn.className='inner-back-btn';
  btn.setAttribute('aria-label','Back to Home');
  btn.innerHTML='<i class="fas fa-arrow-left"></i><span>Back</span>';

  document.body.appendChild(btn);
}

function toggleDesktopSidebar(){
  var collapsed=document.body.classList.toggle('sidebar-collapsed');
  toggle.classList.toggle('active',collapsed);
  localStorage.setItem(SIDEBAR_KEY,collapsed?'collapsed':'expanded');
}

function collapseDesktopSidebar(){
  document.body.classList.add('sidebar-collapsed');
  toggle.classList.add('active');
  localStorage.setItem(SIDEBAR_KEY,'collapsed');
}

function openMobileSidebar(){
  sidebar.classList.add('mobile-open');
  overlay.classList.add('active');
  toggle.classList.add('active');
  document.body.style.overflow='hidden';
  var firstLink=sidebar.querySelector('.sidebar-link');
  if(firstLink) setTimeout(function(){firstLink.focus();},100);
}

function closeMobileSidebar(){
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('active');
  toggle.classList.remove('active');
  document.body.style.overflow='';
}

function setActiveLink(){
  if(!sidebar) return;
  var path=window.location.pathname.split('/').pop()||'index.html';
  sidebar.querySelectorAll('.sidebar-link').forEach(function(link){
    var href=link.getAttribute('href');
    if(href===path){
      link.classList.add('active');
    }else{
      link.classList.remove('active');
    }
  });
}

function applyGuestRestrictions(){
  var isLoggedIn=false;
  try{
    var s=localStorage.getItem('weddingAuthSession');
    if(s){var sess=JSON.parse(s);isLoggedIn=!!(sess&&sess.userId&&sess.expiresAt&&Date.now()<sess.expiresAt);}
  }catch(e){}
  if(!isLoggedIn){
    var privatePages=['planner.html','profile.html','dashboard.html','setup.html','settings.html','customize.html','developer.html','memories.html','invitation.html','share.html','preview.html','analytics.html','admin.html','guests.html','reports.html','invitation-center.html','ai-assistant.html'];
    if(sidebar){
      sidebar.querySelectorAll('.sidebar-link').forEach(function(link){
        var href=link.getAttribute('href');
        if(privatePages.indexOf(href)!==-1){link.style.display='none';}
      });
    }
    var footerLinks=document.getElementById('authUserMenu');
    if(footerLinks){
      footerLinks.innerHTML='<a href="login.html" class="sidebar-link"><i class="fas fa-sign-in-alt"></i> Login</a>';
    }
  }
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}

})();
