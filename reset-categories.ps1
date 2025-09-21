# Script PowerShell pour réinitialiser les catégories
# Usage: .\reset-categories.ps1

Write-Host "🗑️ Réinitialisation des catégories Delta Fashion" -ForegroundColor Yellow
Write-Host "=" * 50

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "backend\scripts\resetCategories.js" -PathType Leaf)) {
    Write-Host "❌ Erreur: Script resetCategories.js non trouvé" -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire racine du projet" -ForegroundColor Yellow
    exit 1
}

# Vérifier le dossier d'images
$imageFolder = "backend\uploads\categorie"
if (Test-Path $imageFolder) {
    $images = Get-ChildItem $imageFolder -Filter "*.jpg", "*.jpeg", "*.png", "*.gif", "*.webp"
    Write-Host "📁 Dossier d'images trouvé: $imageFolder" -ForegroundColor Green
    Write-Host "🖼️ Images disponibles: $($images.Count)" -ForegroundColor Cyan
    foreach ($img in $images) {
        Write-Host "   - $($img.Name)" -ForegroundColor White
    }
} else {
    Write-Host "⚠️ Dossier d'images non trouvé: $imageFolder" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Exécution du script de réinitialisation..." -ForegroundColor Cyan

# Exécuter le script de réinitialisation
cd backend
node scripts/resetCategories.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Réinitialisation terminée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Actions effectuées:" -ForegroundColor Yellow
    Write-Host "   ✅ Toutes les anciennes catégories supprimées" -ForegroundColor White
    Write-Host "   ✅ Tous les anciens produits supprimés" -ForegroundColor White
    Write-Host "   ✅ Nouvelle catégorie 'Enfants' créée" -ForegroundColor White
    Write-Host "   ✅ Image locale attachée (si disponible)" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Maintenant, déployez les changements:" -ForegroundColor Cyan
    Write-Host "   1. git add ." -ForegroundColor White
    Write-Host "   2. git commit -m 'Reset categories with local image'" -ForegroundColor White
    Write-Host "   3. git push origin main" -ForegroundColor White
    Write-Host "   4. Attendez le redéploiement Render" -ForegroundColor White
    Write-Host "   5. Testez sur votre app Vercel" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la réinitialisation" -ForegroundColor Red
    Write-Host "   Vérifiez la connexion à MongoDB et les logs ci-dessus" -ForegroundColor Yellow
}

cd ..
Write-Host ""
Write-Host "🔚 Script terminé" -ForegroundColor Green
