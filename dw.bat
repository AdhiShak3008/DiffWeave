@echo off
setlocal
set DIFFWEAVE_DIR=%~dp0
set PYTHONPATH=%DIFFWEAVE_DIR%;%PYTHONPATH%
python -m diffweave.cli.main %*
endlocal
