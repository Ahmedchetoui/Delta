# PowerShell script pour déployer les corrections Delta Fashion
# Usage: .\deploy-fixes.ps1

Write-Host "🚀 Déploiement des corrections Delta Fashion" -ForegroundColor Green
Write-Host "=" * 50

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "package.json" -PathType Leaf) -and -not (Test-Path "backend\package.json" -PathType Leaf)) {
    Write-Host "❌ Erreur: Exécutez ce script depuis le répertoire racine du projet" -ForegroundColor Red
    exit 1
}

# Variables
$API_URL = "https://delta-n5d8.onrender.com"
$FRONTEND_URL = "https://delta-e79s-4lp8o17ah-deltas-projects-ce7253f2.vercel.app"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Backend: $API_URL"
Write-Host "   Frontend: $FRONTEND_URL"
Write-Host ""

# Étape 1: Git status
Write-Host "📊 Vérification du statut Git..." -ForegroundColor Cyan
git status --porcelain
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur Git. Vérifiez que vous êtes dans un repo Git." -ForegroundColor Red
    exit 1
}

# Étape 2: Add et Commit
Write-Host "📦 Ajout des fichiers modifiés..." -ForegroundColor Cyan
git add .

Write-Host "💾 Commit des corrections..." -ForegroundColor Cyan
$commitMessage = @"
🔧 Fix CORS and deployment issues

- Add current Vercel URL to CORS whitelist
- Add manifest.json route to prevent 401 errors  
- Improve error handling for network issues
- Add comprehensive CORS debugging logs
- Support automatic Vercel domain detection
"@

git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Pas de changements à commiter ou erreur de commit" -ForegroundColor Yellow
}

# Étape 3: Push
Write-Host "🚀 Push vers le repository..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du push. Vérifiez vos credentials Git." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Code pushé avec succès!" -ForegroundColor Green

# Étape 4: Attendre un peu pour le déploiement
Write-Host "⏳ Attente du déploiement Render (30 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Étape 5: Tests de connectivité
Write-Host "🧪 Tests de connectivité..." -ForegroundColor Cyan

# Test 1: API Health
Write-Host "   🔍 Test API Health..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ Status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Manifest
Write-Host "   🔍 Test Manifest..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$API_URL/manifest.json" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ Status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: CORS Preflight
Write-Host "   🔍 Test CORS..." -NoNewline
try {
    $headers = @{
        'Origin' = $FRONTEND_URL
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'Content-Type,Authorization'
    }
    $response = Invoke-WebRequest -Uri "$API_URL/api/auth/login" -Method OPTIONS -Headers $headers -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 204) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ Status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host " ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Déploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Vérifiez les logs Render: https://dashboard.render.com"
Write-Host "2. Testez l'application: $FRONTEND_URL"
Write-Host "3. Vérifiez la console browser (F12) pour les erreurs"
Write-Host ""
Write-Host "🔗 Liens utiles:" -ForegroundColor Cyan
Write-Host "   Backend API: $API_URL/api/health"
Write-Host "   Frontend: $FRONTEND_URL"
Write-Host "   Render Dashboard: https://dashboard.render.com"
Write-Host "   Vercel Dashboard: https://vercel.com/dashboard"
