;(function() {
  'use strict';

  var DEFAULT_RAW = 'Forever & Always';
  var DEFAULT_TITLE = 'Forever &amp; Always';

  function getCoupleNames() {
    try {
      var wd = JSON.parse(localStorage.getItem('weddingData') || '{}');
      if (wd.groomName && wd.brideName) return wd.groomName + ' &amp; ' + wd.brideName;
      if (wd.groomFirst && wd.brideFirst) return wd.groomFirst + ' &amp; ' + wd.brideFirst;
      if (wd.groomName) return wd.groomName;
      if (wd.brideName) return wd.brideName;
    } catch(e) {}
    return null;
  }

  function setCustomTitle(val) {
    try {
      var trimmed = (val || '').trim().replace(/&amp;/g, '&');
      if (!trimmed || trimmed === DEFAULT_RAW || trimmed === '') {
        localStorage.removeItem('_website_title_custom');
      } else {
        localStorage.setItem('_website_title_custom', trimmed);
      }
    } catch(e) {}
  }

  function getActiveTitle() {
    var custom = localStorage.getItem('_website_title_custom');
    var title = custom || DEFAULT_TITLE;
    var couple = getCoupleNames();
    if (couple) {
      return couple + ' ' + String.fromCharCode(10084) + ' ' + title;
    }
    return title;
  }

  function updateAll() {
    var title = getActiveTitle();
    var plainTitle = title.replace(/&amp;/g, '&');

    /* Document title */
    var pt = document.getElementById('pageTitle');
    if (pt) pt.textContent = plainTitle;

    /* Nav logo */
    var navLogo = document.getElementById('navLogo');
    if (navLogo) navLogo.innerHTML = title;

    /* Footer copyright */
    var ftr = document.getElementById('footerBrand');
    if (ftr) ftr.innerHTML = title;

    /* Hero heading */
    var hd = document.getElementById('heroHeading');
    if (hd) hd.innerHTML = title;

    /* SEO meta */
    var og = document.getElementById('ogTitle');
    if (og) og.setAttribute('content', plainTitle);
    var tw = document.getElementById('twTitle');
    if (tw) tw.setAttribute('content', plainTitle);
    var md = document.getElementById('metaDesc');
    if (md) md.setAttribute('content', 'Welcome to ' + plainTitle + ' — join us in celebrating our special day!');
    var ogd = document.getElementById('ogDesc');
    if (ogd) ogd.setAttribute('content', 'Welcome to ' + plainTitle + ' — join us in celebrating our special day!');
    var twd = document.getElementById('twDesc');
    if (twd) twd.setAttribute('content', 'Welcome to ' + plainTitle + ' — join us in celebrating our special day!');
    var ogu = document.getElementById('ogUrl');
    if (ogu) ogu.setAttribute('content', window.location.href);
  }

  function init() {
    updateAll();
    window.addEventListener('storage', function(e) {
      if (e.key === 'weddingData' || e.key === '_website_title_custom') {
        updateAll();
      }
    });
    var checkTimer = setInterval(function() {
      var old = window.__wtLast || '';
      var cur = getActiveTitle();
      if (cur !== old) { window.__wtLast = cur; updateAll(); }
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.WebsiteTitle = {
    get: getActiveTitle,
    getDefault: function() { return DEFAULT_TITLE; },
    setCustom: setCustomTitle,
    getCustom: function() { return localStorage.getItem('_website_title_custom') || ''; },
    getCouple: getCoupleNames,
    update: updateAll
  };
})();
