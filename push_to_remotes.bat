@echo off
echo ==========================================================
echo Pushing DiffWeave to GitHub and Hugging Face Spaces
echo ==========================================================
echo.
echo [1/2] Pushing to GitHub (origin main)...
git push origin main

echo.
echo [2/2] Pushing to Hugging Face Spaces (hf main)...
echo If prompted for password, paste your Hugging Face write token:
echo https://huggingface.co/settings/tokens
git push hf main --force

echo.
echo ==========================================================
echo Deployment push complete!
echo ==========================================================
pause
