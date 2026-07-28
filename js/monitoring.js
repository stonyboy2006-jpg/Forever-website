/**
 * System Monitoring Module
 * Client-side metrics: memory, storage, page load, errors
 */
(function(){
  'use strict';
  var W=window.__WEDDING_MONITORING=window.__WEDDING_MONITORING||{};
  if(W.initialized)return;
  W.initialized=true;

  var METRICS_KEY='weddingSystemMetrics';
  var HISTORY_KEY='weddingMetricsHistory';

  function getMetrics(){
    var m={
      timestamp:new Date().toISOString(),
      url:window.location.href,
      performance:getPerformanceMetrics(),
      storage:getStorageMetrics(),
      memory:getMemoryMetrics(),
      browser:getBrowserInfo(),
      errors:getErrorStats()
    };
    return m;
  }

  function getPerformanceMetrics(){
    var p=window.performance||{};
    var nav=p.navigation||{};
    var timing=p.timing||{};
    return{
      loadTime:timing.loadEventEnd-timing.navigationStart||0,
      domReady:timing.domContentLoadedEventEnd-timing.navigationStart||0,
      firstPaint:getFirstPaint(),
      resources:p.getEntries?p.getEntries().length:0,
      jsHeapSize:p.memory?p.memory.usedJSHeapSize:0,
      jsHeapLimit:p.memory?p.memory.jsHeapSizeLimit:0
    };
  }

  function getFirstPaint(){
    if(window.PerformanceObserver){
      try{
        var entries=performance.getEntriesByName('first-paint');
        return entries.length>0?entries[0].startTime:0;
      }catch(e){}
    }
    return 0;
  }

  function getStorageMetrics(){
    var total=0;
    var used=0;
    try{
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        var v=localStorage.getItem(k);
        if(k&&v){used+=k.length+v.length;}
      }
    }catch(e){}
    return{
      usedBytes:used*2,
      usedFormatted:formatSize(used*2),
      items:localStorage.length,
      estimatedQuota:5*1024*1024,
      percentUsed:Math.round((used*2/(5*1024*1024))*100)
    };
  }

  function getMemoryMetrics(){
    if(performance.memory){
      return{
        usedJSHeapSize:performance.memory.usedJSHeapSize,
        jsHeapSizeLimit:performance.memory.jsHeapSizeLimit,
        totalJSHeapSize:performance.memory.totalJSHeapSize
      };
    }
    return{usedJSHeapSize:0,jsHeapSizeLimit:0,totalJSHeapSize:0};
  }

  function getBrowserInfo(){
    return{
      userAgent:navigator.userAgent,
      platform:navigator.platform,
      language:navigator.language,
      cookieEnabled:navigator.cookieEnabled,
      online:navigator.onLine,
      cores:navigator.hardwareConcurrency||0,
      screenResolution:screen.width+'x'+screen.height,
      colorDepth:screen.colorDepth,
      timezone:Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  function getErrorStats(){
    if(window.ErrorLogger&&window.ErrorLogger.getStats)return window.ErrorLogger.getStats();
    return{total:0,byType:{}};
  }

  function formatSize(bytes){
    if(bytes===0)return'0 B';
    var units=['B','KB','MB','GB'];
    var i=Math.floor(Math.log(bytes)/Math.log(1024));
    return Math.round(bytes/Math.pow(1024,i)*10)/10+' '+units[i];
  }

  W.getMetrics=getMetrics;

  W.getFullReport=function(){
    var metrics=getMetrics();
    var history=getHistory();
    var trends={
      avgLoadTime:history.length>0?Math.round(history.reduce(function(s,h){return s+(h.performance.loadTime||0);},0)/history.length):0,
      avgStorage:history.length>0?Math.round(history.reduce(function(s,h){return s+(h.storage.usedBytes||0);},0)/history.length):0,
      errorTrend:history.length>0?history.slice(-5).map(function(h){return h.errors.total||0;}):[]
    };
    return{current:metrics,trends:trends,historyCount:history.length};
  };

  function getHistory(){
    try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');}catch(e){return[];}
  }

  W.recordSnapshot=function(){
    var metrics=getMetrics();
    var history=getHistory();
    history.push(metrics);
    if(history.length>50)history=history.slice(-50);
    try{localStorage.setItem(HISTORY_KEY,JSON.stringify(history));}catch(e){}
    return metrics;
  };

  W.renderMonitoringPanel=function(containerId){
    var el=document.getElementById(containerId);if(!el)return;
    var report=W.getFullReport();
    var m=report.current;
    var t=report.trends;
    el.innerHTML='\n'+
      '<div class="glass-card" style="padding:24px;border-radius:16px;border:1px solid rgba(212,175,55,0.08)">\n'+
      '  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">\n'+
      '    <h3 style="font-family:Playfair Display,serif;color:#D4AF37"><i class="fas fa-chart-line" style="margin-right:8px"></i>System Monitor</h3>\n'+
      '    <button onclick="WeddingMonitoring.recordSnapshot()" style="padding:6px 12px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.15);border-radius:8px;color:#D4AF37;cursor:pointer;font-size:0.78rem"><i class="fas fa-sync-alt"></i></button>\n'+
      '  </div>\n'+
      '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">\n'+
      metricCard('Performance','fa-bolt','#4CAF50',[
        'Load: '+(m.performance.loadTime||0)+'ms',
        'DOM Ready: '+(m.performance.domReady||0)+'ms',
        'First Paint: '+(Math.round(m.performance.firstPaint||0))+'ms',
        'Resources: '+(m.performance.resources||0)
      ])+
      metricCard('Storage','fa-database','#FF9800',[
        'Used: '+m.storage.usedFormatted,
        'Items: '+m.storage.items,
        'Quota: '+m.storage.percentUsed+'%',
        'Limit: 5MB'
      ])+
      metricCard('Memory','fa-memory','#2196F3',[
        'JS Heap: '+(m.memory.usedJSHeapSize?formatSize(m.memory.usedJSHeapSize):'N/A'),
        'Limit: '+(m.memory.jsHeapSizeLimit?formatSize(m.memory.jsHeapSizeLimit):'N/A')
      ])+
      metricCard('Errors','fa-exclamation-triangle','#F44336',[
        'Total: '+(m.errors.total||0),
        'Client: '+(m.errors.byType.client_error||0),
        'Auth: '+(m.errors.byType.auth_failure||0),
        'API: '+(m.errors.byType.api_exception||0)
      ])+
      '  </div>\n'+
      '  <div style="padding:12px;background:rgba(255,255,255,0.02);border-radius:10px">\n'+
      '    <p style="color:#A09888;font-size:0.8rem;margin-bottom:8px">Browser Info</p>\n'+
      '    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.78rem">\n'+
      '      <span style="color:#666">Platform:</span><span style="color:#E8E0D0">'+m.browser.platform+'</span>\n'+
      '      <span style="color:#666">Language:</span><span style="color:#E8E0D0">'+m.browser.language+'</span>\n'+
      '      <span style="color:#666">Cores:</span><span style="color:#E8E0D0">'+m.browser.cores+'</span>\n'+
      '      <span style="color:#666">Screen:</span><span style="color:#E8E0D0">'+m.browser.screenResolution+'</span>\n'+
      '      <span style="color:#666">Timezone:</span><span style="color:#E8E0D0">'+m.browser.timezone+'</span>\n'+
      '      <span style="color:#666">Online:</span><span style="color:'+(m.browser.online?'#4CAF50':'#F44336')+'">'+m.browser.online+'</span>\n'+
      '    </div>\n'+
      '  </div>\n'+
      '  <div style="margin-top:12px;padding:12px;background:rgba(255,255,255,0.02);border-radius:10px">\n'+
      '    <p style="color:#A09888;font-size:0.8rem;margin-bottom:6px">Trends ('+report.historyCount+' snapshots)</p>\n'+
      '    <p style="color:#666;font-size:0.78rem">Avg Load: '+(t.avgLoadTime||0)+'ms | Avg Storage: '+formatSize(t.avgStorage||0)+'</p>\n'+
      '  </div>\n'+
      '</div>\n';
  };

  function metricCard(title,icon,color,items){
    return '<div style="padding:16px;background:rgba(255,255,255,0.02);border-radius:12px;border:1px solid rgba(212,175,55,0.06)">\n'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><i class="fas '+icon+'" style="color:'+color+'"></i><span style="color:#E8E0D0;font-weight:500;font-size:0.88rem">'+title+'</span></div>\n'+
      items.map(function(item){return'<p style="color:#A09888;font-size:0.78rem;margin-bottom:3px">'+item+'</p>';}).join('')+
      '</div>';
  }

  window.WeddingMonitoring=W;
  // System Monitoring initialized
})();
