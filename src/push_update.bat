@echo off
cd push
call npm -s install
node push_update.js
cd ..