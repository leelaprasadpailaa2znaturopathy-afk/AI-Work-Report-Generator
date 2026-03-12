@echo off
title AI Work Report Launcher
echo Starting AI Work Report Generator...

:: Start the Python NLP Fallback in the background
echo [1/2] Starting Python NLP Service...
start "Python NLP Backend" /min py d:\ALLproducts\tools\work_report\nlp_service.py

:: Start the Vite Frontend
echo [2/2] Starting Vite Frontend...
cd /d d:\ALLproducts\tools\work_report
npm run dev

pause
