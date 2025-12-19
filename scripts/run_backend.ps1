$currentDir = $PSScriptRoot
Set-Location -Path "$currentDir\backend"
Write-Host "Starting Backend..."
npm install
npm run start:dev
