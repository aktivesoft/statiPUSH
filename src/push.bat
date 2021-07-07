@echo off
cd push
call npm -s install
node push.js %1 %2
cd ..