@echo off
chcp 65001 > nul

echo ========================================
echo DDUUTTNN 자동 빌드 및 Tomcat 배포 시작
echo ========================================

set PROJECT_DIR=C:\Users\SMHRD\Desktop\dduuttnn
set TOMCAT_DIR=C:\apache-tomcat-9.0.118
set WAR_NAME=back.war
set APP_NAME=back

echo.
echo [1] Tomcat 종료 중...
call "%TOMCAT_DIR%\bin\shutdown.bat"

echo.
echo [2] 잠시 대기 중...
timeout /t 3 /nobreak > nul

echo.
echo [3] 기존 배포 폴더 삭제 중...
if exist "%TOMCAT_DIR%\webapps\%APP_NAME%" (
    rmdir /s /q "%TOMCAT_DIR%\webapps\%APP_NAME%"
    echo 기존 %APP_NAME% 폴더 삭제 완료
) else (
    echo 기존 %APP_NAME% 폴더 없음
)

echo.
echo [4] 기존 WAR 파일 삭제 중...
if exist "%TOMCAT_DIR%\webapps\%WAR_NAME%" (
    del /f /q "%TOMCAT_DIR%\webapps\%WAR_NAME%"
    echo 기존 %WAR_NAME% 삭제 완료
) else (
    echo 기존 %WAR_NAME% 없음
)

echo.
echo [5] Maven 빌드 실행 중...
cd /d "%PROJECT_DIR%"
call mvn clean package

if errorlevel 1 (
    echo.
    echo ========================================
    echo Maven 빌드 실패
    echo 오류를 확인한 뒤 다시 실행하세요.
    echo ========================================
    pause
    exit /b 1
)

echo.
echo [6] 새 WAR 파일 복사 중...
copy "%PROJECT_DIR%\target\%WAR_NAME%" "%TOMCAT_DIR%\webapps\%WAR_NAME%"

if errorlevel 1 (
    echo.
    echo ========================================
    echo WAR 파일 복사 실패
    echo target\%WAR_NAME% 파일이 있는지 확인하세요.
    echo ========================================
    pause
    exit /b 1
)

echo.
echo [7] Tomcat 시작 중...
call "%TOMCAT_DIR%\bin\startup.bat"

echo.
echo ========================================
echo 배포 완료
echo 접속 주소:
echo http://localhost:8081/back
echo ========================================

pause