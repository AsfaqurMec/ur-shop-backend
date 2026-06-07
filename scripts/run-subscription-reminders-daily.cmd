@echo off
REM Daily Windows Task Scheduler target: runs HTTP trigger against local API (backend must be up).
cd /d "%~dp0.."
node scripts\trigger-subscription-reminders.js
exit /b %ERRORLEVEL%
