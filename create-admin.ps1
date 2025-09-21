# Script PowerShell pour créer le compte admin Ahmed
# Usage: .\create-admin.ps1

Write-Host "👑 Création du compte admin Ahmed Chetoui" -ForegroundColor Green
Write-Host "=" * 50

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "backend\scripts\createAdminAccount.js" -PathType Leaf)) {
    Write-Host "❌ Erreur: Script createAdminAccount.js non trouvé" -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire racine du projet" -ForegroundColor Yellow
    exit 1
}

# Variables
$ADMIN_EMAIL = "ahmedchetoui987@gmail.com"
$ADMIN_PASSWORD = "200223Ata"

Write-Host "📋 Configuration du compte admin:" -ForegroundColor Yellow
Write-Host "   📧 Email: $ADMIN_EMAIL"
Write-Host "   🔒 Mot de passe: $ADMIN_PASSWORD"
Write-Host "   👑 Rôle: admin"
Write-Host ""

# Exécuter le script de création du compte admin
Write-Host "🔄 Exécution du script de création..." -ForegroundColor Cyan
cd backend
node scripts/createAdminAccount.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Compte admin créé/mis à jour avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Vous pouvez maintenant vous connecter avec:" -ForegroundColor Yellow
    Write-Host "   📧 Email: $ADMIN_EMAIL" -ForegroundColor White
    Write-Host "   🔒 Mot de passe: $ADMIN_PASSWORD" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Testez la connexion sur:" -ForegroundColor Cyan
    Write-Host "   Frontend: https://delta-e79s-4lp8o17ah-deltas-projects-ce7253f2.vercel.app" -ForegroundColor Blue
    Write-Host "   API Login: https://delta-n5d8.onrender.com/api/auth/login" -ForegroundColor Blue
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la création du compte admin" -ForegroundColor Red
    Write-Host "   Vérifiez la connexion à MongoDB et les logs ci-dessus" -ForegroundColor Yellow
}

cd ..
Write-Host ""
Write-Host "🔚 Script terminé" -ForegroundColor Green
