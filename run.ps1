Write-Output "Running Backend"
cd backend
.\.venv\Scripts\Activate.ps1
python app.py &

Write-Output "Running Frontend"
cd ../frontend
npm run dev
