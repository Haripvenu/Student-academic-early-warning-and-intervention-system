@echo off
title Push EduGuard to GitHub
echo ========================================================
echo   Pushing EduGuard EWS to GitHub as Hari P Venu
echo ========================================================
echo.
git config user.name "Hari P Venu"
git config user.email "hari89260@gmail.com"
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo   [SUCCESS] Code pushed to GitHub successfully!
    echo ========================================================
) else (
    echo ========================================================
    echo   [NOTE] If a browser login opened, complete sign-in
    echo   as Haripvenu and run this script again.
    echo ========================================================
)
echo.
pause
