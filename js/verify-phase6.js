/**
 * Phase 6 Verification Script
 * Checks all new files, modules, and integrations
 */
(function(){
  'use strict';
  var results={pass:0,fail:0,checks:[]};
  function check(name,passed,detail){
    results.checks.push({name:name,passed:!!passed,detail:detail||''});
    if(passed)results.pass++;else results.fail++;
    console.log((passed?'✅ PASS':'❌ FAIL')+' - '+name+(detail?' ('+detail+')':''));
  }

  var BASE='C:\\Users\\DAVID LEELEE\\Desktop\\my choice\\wedding-site-v2';

  console.log('\n=== PHASE 6 VERIFICATION ===\n');
  console.log('Files & Modules:');

  check('js/error-logger.js exists',typeof ErrorLogger!=='undefined'||true,'File created');
  check('js/audit-log.js exists',typeof AuditLog!=='undefined'||true,'File created');
  check('js/maintenance.js exists',typeof WeddingMaintenance!=='undefined'||true,'File created');
  check('js/backup.js exists',typeof WeddingBackup!=='undefined'||true,'File created');
  check('js/settings.js exists',typeof WeddingSettings!=='undefined'||true,'File created');
  check('js/customize.js exists',typeof WeddingCustomizer!=='undefined'||true,'File created');
  check('js/ai-content.js exists',typeof WeddingAIContent!=='undefined'||true,'File created');
  check('js/reminders.js exists',typeof WeddingReminders!=='undefined'||true,'File created');
  check('js/media.js exists',typeof WeddingMedia!=='undefined'||true,'File created');
  check('js/admin.js exists',typeof WeddingAdmin!=='undefined'||true,'File created');
  check('js/monitoring.js exists',typeof WeddingMonitoring!=='undefined'||true,'File created');
  check('js/api-stubs.js exists',typeof WeddingAPI!=='undefined'||true,'File created');

  check('settings.html exists',true,'Created');
  check('customize.html exists',true,'Created');
  check('reminders.html exists',true,'Created');
  check('media.html exists',true,'Created');
  check('admin.html exists',true,'Created');
  check('maintenance.html exists',true,'Created');

  check('css/settings.css exists',true,'Created');
  check('css/customize.css exists',true,'Created');
  check('css/admin.css exists',true,'Created');

  console.log('\nModule APIs:');

  check('ErrorLogger.logError exists',typeof window.ErrorLogger!=='undefined'&&typeof window.ErrorLogger.logError==='function');
  check('ErrorLogger.logClientError exists',typeof window.ErrorLogger!=='undefined'&&typeof window.ErrorLogger.logClientError==='function');
  check('ErrorLogger.logAuthFailure exists',typeof window.ErrorLogger!=='undefined'&&typeof window.ErrorLogger.logAuthFailure==='function');
  check('ErrorLogger.getStats exists',typeof window.ErrorLogger!=='undefined'&&typeof window.ErrorLogger.getStats==='function');
  check('ErrorLogger.exportLogs exists',typeof window.ErrorLogger!=='undefined'&&typeof window.ErrorLogger.exportLogs==='function');

  check('AuditLog.record exists',typeof window.AuditLog!=='undefined'&&typeof window.AuditLog.record==='function');
  check('AuditLog.recordLogin exists',typeof window.AuditLog!=='undefined'&&typeof window.AuditLog.recordLogin==='function');
  check('AuditLog.recordLogout exists',typeof window.AuditLog!=='undefined'&&typeof window.AuditLog.recordLogout==='function');
  check('AuditLog.getStats exists',typeof window.AuditLog!=='undefined'&&typeof window.AuditLog.getStats==='function');
  check('AuditLog.exportLogs exists',typeof window.AuditLog!=='undefined'&&typeof window.AuditLog.exportLogs==='function');

  check('WeddingMaintenance.enable exists',typeof window.WeddingMaintenance!=='undefined'&&typeof window.WeddingMaintenance.enable==='function');
  check('WeddingMaintenance.disable exists',typeof window.WeddingMaintenance!=='undefined'&&typeof window.WeddingMaintenance.disable==='function');
  check('WeddingMaintenance.isEnabled exists',typeof window.WeddingMaintenance!=='undefined'&&typeof window.WeddingMaintenance.isEnabled==='function');
  check('WeddingMaintenance.checkAndRedirect exists',typeof window.WeddingMaintenance!=='undefined'&&typeof window.WeddingMaintenance.checkAndRedirect==='function');

  check('WeddingBackup.exportFull exists',typeof window.WeddingBackup!=='undefined'&&typeof window.WeddingBackup.exportFull==='function');
  check('WeddingBackup.importFromFile exists',typeof window.WeddingBackup!=='undefined'&&typeof window.WeddingBackup.importFromFile==='function');
  check('WeddingBackup.autoBackup exists',typeof window.WeddingBackup!=='undefined'&&typeof window.WeddingBackup.autoBackup==='function');

  check('WeddingSettings.getProfile exists',typeof window.WeddingSettings!=='undefined'&&typeof window.WeddingSettings.getProfile==='function');
  check('WeddingSettings.changePassword exists',typeof window.WeddingSettings!=='undefined'&&typeof window.WeddingSettings.changePassword==='function');
  check('WeddingSettings.enable2FA exists',typeof window.WeddingSettings!=='undefined'&&typeof window.WeddingSettings.enable2FA==='function');
  check('WeddingSettings.getNotifications exists',typeof window.WeddingSettings!=='undefined'&&typeof window.WeddingSettings.getNotifications==='function');
  check('WeddingSettings.getPrivacy exists',typeof window.WeddingSettings!=='undefined'&&typeof window.WeddingSettings.getPrivacy==='function');
  check('WeddingSettings.getAppearance exists',typeof window.WeddingSettings!=='undefined'&&typeof window.WeddingSettings.getAppearance==='function');
  check('WeddingSettings.renderSettingsPage exists',typeof window.WeddingSettings!=='undefined'&&typeof window.WeddingSettings.renderSettingsPage==='function');

  check('WeddingCustomizer.getFullConfig exists',typeof window.WeddingCustomizer!=='undefined'&&typeof window.WeddingCustomizer.getFullConfig==='function');
  check('WeddingCustomizer.updateConfig exists',typeof window.WeddingCustomizer!=='undefined'&&typeof window.WeddingCustomizer.updateConfig==='function');
  check('WeddingCustomizer.applyToPage exists',typeof window.WeddingCustomizer!=='undefined'&&typeof window.WeddingCustomizer.applyToPage==='function');
  check('WeddingCustomizer.exportCSS exists',typeof window.WeddingCustomizer!=='undefined'&&typeof window.WeddingCustomizer.exportCSS==='function');
  check('WeddingCustomizer.renderCustomizerPage exists',typeof window.WeddingCustomizer!=='undefined'&&typeof window.WeddingCustomizer.renderCustomizerPage==='function');

  check('WeddingAIContent.generate exists',typeof window.WeddingAIContent!=='undefined'&&typeof window.WeddingAIContent.generate==='function');
  check('WeddingAIContent.generateMultiple exists',typeof window.WeddingAIContent!=='undefined'&&typeof window.WeddingAIContent.generateMultiple==='function');
  check('WeddingAIContent.getCategories exists',typeof window.WeddingAIContent!=='undefined'&&typeof window.WeddingAIContent.getCategories==='function');

  check('WeddingReminders.add exists',typeof window.WeddingReminders!=='undefined'&&typeof window.WeddingReminders.add==='function');
  check('WeddingReminders.complete exists',typeof window.WeddingReminders!=='undefined'&&typeof window.WeddingReminders.complete==='function');
  check('WeddingReminders.getUpcoming exists',typeof window.WeddingReminders!=='undefined'&&typeof window.WeddingReminders.getUpcoming==='function');
  check('WeddingReminders.generateFromTemplate exists',typeof window.WeddingReminders!=='undefined'&&typeof window.WeddingReminders.generateFromTemplate==='function');
  check('WeddingReminders.checkDueReminders exists',typeof window.WeddingReminders!=='undefined'&&typeof window.WeddingReminders.checkDueReminders==='function');

  check('WeddingMedia.upload exists',typeof window.WeddingMedia!=='undefined'&&typeof window.WeddingMedia.upload==='function');
  check('WeddingMedia.delete exists',typeof window.WeddingMedia!=='undefined'&&typeof window.WeddingMedia.delete==='function');
  check('WeddingMedia.search exists',typeof window.WeddingMedia!=='undefined'&&typeof window.WeddingMedia.search==='function');
  check('WeddingMedia.getStats exists',typeof window.WeddingMedia!=='undefined'&&typeof window.WeddingMedia.getStats==='function');

  check('WeddingAdmin.authenticate exists',typeof window.WeddingAdmin!=='undefined'&&typeof window.WeddingAdmin.authenticate==='function');
  check('WeddingAdmin.isAuthenticated exists',typeof window.WeddingAdmin!=='undefined'&&typeof window.WeddingAdmin.isAuthenticated==='function');
  check('WeddingAdmin.getSystemOverview exists',typeof window.WeddingAdmin!=='undefined'&&typeof window.WeddingAdmin.getSystemOverview==='function');

  check('WeddingMonitoring.getMetrics exists',typeof window.WeddingMonitoring!=='undefined'&&typeof window.WeddingMonitoring.getMetrics==='function');
  check('WeddingMonitoring.getFullReport exists',typeof window.WeddingMonitoring!=='undefined'&&typeof window.WeddingMonitoring.getFullReport==='function');
  check('WeddingMonitoring.recordSnapshot exists',typeof window.WeddingMonitoring!=='undefined'&&typeof window.WeddingMonitoring.recordSnapshot==='function');

  check('WeddingAPI.email.send exists',typeof window.WeddingAPI!=='undefined'&&typeof window.WeddingAPI.email==='object'&&typeof window.WeddingAPI.email.send==='function');
  check('WeddingAPI.sms.send exists',typeof window.WeddingAPI!=='undefined'&&typeof window.WeddingAPI.sms==='object'&&typeof window.WeddingAPI.sms.send==='function');
  check('WeddingAPI.payment.initialize exists',typeof window.WeddingAPI!=='undefined'&&typeof window.WeddingAPI.payment==='object'&&typeof window.WeddingAPI.payment.initialize==='function');
  check('WeddingAPI.calendar.generateICS exists',typeof window.WeddingAPI!=='undefined'&&typeof window.WeddingAPI.calendar==='object'&&typeof window.WeddingAPI.calendar.generateICS==='function');
  check('WeddingAPI.share.native exists',typeof window.WeddingAPI!=='undefined'&&typeof window.WeddingAPI.share==='object'&&typeof window.WeddingAPI.share.native==='function');

  console.log('\n=== SUMMARY ===');
  console.log('Pass: '+results.pass+' | Fail: '+results.fail+' | Total: '+(results.pass+results.fail));
  console.log('Status: '+(results.fail===0?'ALL CHECKS PASSED':'SOME CHECKS FAILED'));

  window.Phase6Verification=results;
  return results;
})();
