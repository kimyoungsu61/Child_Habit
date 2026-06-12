@echo off
setlocal EnableExtensions
chcp 65001 > nul

set "PROJECT_DIR=%~dp0"
set "TOMCAT_DIR=C:\apache-tomcat-9.0.118"
set "CATALINA_HOME=%TOMCAT_DIR%"
set "CATALINA_BASE=%TOMCAT_DIR%"
if not defined JAVA_HOME set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.10"
set "WAR_NAME=back.war"
set "APP_NAME=back"
set "APP_PORT=8081"
set "MAVEN_CMD="
if exist "C:\Program Files\Apache\Maven\apache-maven-3.9.16\bin\mvn.cmd" set "MAVEN_CMD=C:\Program Files\Apache\Maven\apache-maven-3.9.16\bin\mvn.cmd"
if not defined MAVEN_CMD if exist "C:\apache-maven-3.9.16\bin\mvn.cmd" set "MAVEN_CMD=C:\apache-maven-3.9.16\bin\mvn.cmd"
if not defined MAVEN_CMD for /f "delims=" %%M in ('where mvn.cmd 2^>nul') do if not defined MAVEN_CMD set "MAVEN_CMD=%%M"
if not defined MAVEN_CMD goto maven_not_found

echo ========================================
echo DDUUTTNN build and Tomcat deploy
echo ========================================

echo.
echo [1] Stopping Tomcat...
call "%TOMCAT_DIR%\bin\shutdown.bat" > nul 2>&1
call :waitForPortFree %APP_PORT% 30
if errorlevel 1 (
    echo Tomcat port %APP_PORT% is still listening. Continuing with cleanup retry...
)

echo.
echo [2] Removing previous exploded app...
call :deleteDir "%TOMCAT_DIR%\webapps\%APP_NAME%"
if errorlevel 1 goto cleanup_failed

echo.
echo [3] Removing previous WAR...
call :deleteFile "%TOMCAT_DIR%\webapps\%WAR_NAME%"
if errorlevel 1 goto cleanup_failed

echo.
echo [4] Running Maven build...
cd /d "%PROJECT_DIR%"
call "%MAVEN_CMD%" clean package -Dmaven.test.skip=true
if errorlevel 1 goto build_failed

echo.
echo [5] Ensuring deploy target is clean...
call :deleteDir "%TOMCAT_DIR%\webapps\%APP_NAME%"
if errorlevel 1 goto cleanup_failed
call :deleteFile "%TOMCAT_DIR%\webapps\%WAR_NAME%"
if errorlevel 1 goto cleanup_failed

echo.
echo [6] Copying WAR...
copy /Y "%PROJECT_DIR%\target\%WAR_NAME%" "%TOMCAT_DIR%\webapps\%WAR_NAME%"
if errorlevel 1 goto copy_failed

echo.
echo [7] Starting Tomcat...
call "%TOMCAT_DIR%\bin\startup.bat"

echo.
echo ========================================
echo Deploy complete
echo App URL, using your current host or PC IP:
echo http://HOST_OR_PC_IP:%APP_PORT%/%APP_NAME%/app
echo Root redirect:
echo http://HOST_OR_PC_IP:%APP_PORT%/%APP_NAME%
echo ========================================
pause
exit /b 0

:waitForPortFree
set "PORT=%~1"
set "TRIES=%~2"
for /L %%I in (1,1,%TRIES%) do (
    netstat -ano | findstr /R /C:":%PORT% .*LISTENING" > nul
    if errorlevel 1 exit /b 0
    timeout /t 1 /nobreak > nul
)
exit /b 1

:deleteDir
set "TARGET_DIR=%~1"
if not exist "%TARGET_DIR%" exit /b 0
for /L %%I in (1,1,10) do (
    rmdir /S /Q "%TARGET_DIR%" 2> nul
    if not exist "%TARGET_DIR%" exit /b 0
    timeout /t 1 /nobreak > nul
)
exit /b 1

:deleteFile
set "TARGET_FILE=%~1"
if not exist "%TARGET_FILE%" exit /b 0
for /L %%I in (1,1,10) do (
    del /F /Q "%TARGET_FILE%" 2> nul
    if not exist "%TARGET_FILE%" exit /b 0
    timeout /t 1 /nobreak > nul
)
exit /b 1

:cleanup_failed
echo.
echo ========================================
echo Cleanup failed. Close Tomcat/Java processes that hold webapps\%APP_NAME%, then retry.
echo ========================================
pause
exit /b 1

:build_failed
echo.
echo ========================================
echo Maven build failed.
echo ========================================
pause
exit /b 1

:maven_not_found
echo.
echo ========================================
echo Maven was not found. Check Maven installation or PATH.
echo ========================================
pause
exit /b 1

:copy_failed
echo.
echo ========================================
echo WAR copy failed. Check target\%WAR_NAME% and Tomcat permissions.
echo ========================================
pause
exit /b 1
