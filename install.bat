@echo off
cd src\push
call npm -s install
node install.js
cd ..