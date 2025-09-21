# Script de debug pour tester la connexion admin
# Usage: .\debug-login-fixed.ps1

Write-Host "🔍 Diagnostic de connexion admin" -ForegroundColor Yellow
Write-Host "=" * 40

# Test 1: Vérifier que l'API fonctionne
Write-Host "1️⃣ Test API Health..." -NoNewline
try {
    $health = Invoke-WebRequest -Uri "https://delta-n5d8.onrender.com/api/health" -Method GET
    if ($health.StatusCode -eq 200) {
        Write-Host " ✅" -ForegroundColor Green
    }
} catch {
    Write-Host " ❌ API non accessible" -ForegroundColor Red
    exit 1
}

# Test 2: Tester la connexion avec plus de détails
Write-Host "2️⃣ Test connexion admin détaillé..." -ForegroundColor Cyan

$loginData = @{
    email = "ahmedchetoui987@gmail.com"
    password = "200223Ata"
}

$jsonBody = $loginData | ConvertTo-Json
Write-Host "📤 Données envoyées:" -ForegroundColor Yellow
Write-Host $jsonBody

try {
    $response = Invoke-WebRequest -Uri "https://delta-n5d8.onrender.com/api/auth/login" -Method POST -Body $jsonBody -ContentType "application/json" -UseBasicParsing
    
    Write-Host "✅ Connexion réussie!" -ForegroundColor Green
    Write-Host "📥 Réponse:" -ForegroundColor Yellow
    Write-Host $response.Content
    
} catch {
    Write-Host "❌ Erreur de connexion" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        
        Write-Host "📥 Détails de l'erreur:" -ForegroundColor Yellow
        Write-Host $errorContent
        Write-Host ""
        Write-Host "🔍 Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# Test 3: Suggestions
Write-Host ""
Write-Host "3️⃣ Suggestions de dépannage:" -ForegroundColor Cyan
Write-Host "• Vérifiez que le script createAdminAccount.js a bien fonctionné"
Write-Host "• Le compte pourrait ne pas être synchronisé avec la base de données"
Write-Host "• Testez avec l'autre compte admin: admin@deltafashion.com / admin123"

Write-Host ""
Write-Host "🔧 Actions recommandées:" -ForegroundColor Yellow
Write-Host "1. Exécuter à nouveau: node backend/scripts/createAdminAccount.js"
Write-Host "2. Ou repeupler la base: https://delta-n5d8.onrender.com/api/seed-database"
Write-Host "3. Vérifier les logs Render pour plus de détails"
