@echo off
rem ============================================================
rem やることリストの「声」を VOICEVOX で作る
rem   1. VOICEVOX を起動しておく
rem   2. このファイルをダブルクリック
rem   3. 使う声の番号を入力する
rem   できた声は、ひとつ上の voices フォルダに入ります。
rem   (このパソコンの中の VOICEVOX とだけ通信します)
rem ============================================================

rem このbatファイルがあるフォルダに移動する
cd /d "%~dp0"

rem PowerShell で声づくりのスクリプト(make_voices.ps1)を動かす
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0make_voices.ps1"

rem 結果を読めるよう、キーを押すまで閉じない
pause
