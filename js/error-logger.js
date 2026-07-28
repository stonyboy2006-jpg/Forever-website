/**
 * Error Logger — Client-Side Error Capture & Reporting
 * Records errors, auth failures, upload failures, API exceptions
 */
(function(){
  'use strict';
  var W=window.__WEDDING_ERROR_LOGGER=window.__WEDDING_ERROR_LOGGER||{};
  if(W.initialized)return;
  W.initialized=true;

  var STORAGE_KEY='weddingErrorLogs';
  var MAX_LOGS=500;

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
      url:window.location.href,
      timestamp:new Date().toISOString()
    };
  }

  function log(type,message,detail){
    var entry={
      id:'err_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
      type:type||'error',
      message:String(message||''),
      detail:detail||null,
      clientInfo:getClientInfo(),
      timestamp:Date.now()
    };
    var logs=getLogs();
    logs.push(entry);
    saveLogs(logs);
    return entry;
  }

  W.logError=function(message,detail){return log('error',message,detail);};
  W.logClientError=function(message,detail){return log('client_error',message,detail);};
  W.logServerError=function(message,detail){return log('server_error',message,detail);};
  W.logAuthFailure=function(message,detail){return log('auth_failure',message,detail);};
  W.logUploadFailure=function(message,detail){return log('upload_failure',message,detail);};
  W.logPaymentFailure=function(message,detail){return log('payment_failure',message,detail);};
  W.logEmailFailure=function(message,detail){return log('email_failure',message,detail);};
  W.logAPIException=function(message,detail){return log('api_exception',message,detail);};

  W.getLogs=function(type){
    var logs=getLogs();
    if(type)logs=logs.filter(function(l){return l.type===type;});
    return logs;
  };
  W.getStats=function(){
    var logs=getLogs();
    var stats={total:logs.length,byType:{}};
    logs.forEach(function(l){stats.byType[l.type]=(stats.byType[l.type]||0)+1;});
    return stats;
  };
  W.searchLogs=function(query){
    var logs=getLogs();
    var q=(query||'').toLowerCase();
    return logs.filter(function(l){return l.message.toLowerCase().indexOf(q)!==-1;});
  };
  W.exportLogs=function(format){
    var logs=getLogs();
    if(format==='csv'){
      var csv='ID,Type,Message,URL,Timestamp\n';
      logs.forEach(function(l){
        csv+='"'+l.id+'","'+l.type+'","'+(l.message||'').replace(/"/g,'""')+'","'+(l.clientInfo?l.clientInfo.url:'')+'","'+new Date(l.timestamp).toISOString()+'"\n';
      });
      downloadFile(csv,'error-logs.csv','text/csv');
    }else{
      downloadFile(JSON.stringify(logs,null,2),'error-logs.json','application/json');
    }
    if(typeof notify==='function')notify('Error logs exported','success');
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

  window.addEventListener('error',function(e){
    W.logClientError(e.message||'Unknown error',{
      filename:e.filename||'',lineno:e.lineno||0,colno:e.colno||0
    });
  });
  window.addEventListener('unhandledrejection',function(e){
    W.logClientError('Unhandled Promise: '+(e.reason?.message||String(e.reason)||'Unknown'),{type:'unhandledrejection'});
  });

  window.ErrorLogger=W;
  console.log('Error Logger initialized');
})();
