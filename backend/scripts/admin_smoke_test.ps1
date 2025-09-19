param(
  [string]$BaseUrl = 'http://localhost:5000',
  [string]$AdminEmail = 'ahmedchetoui987@gmail.com',
  [string]$AdminPassword = '200223Ata'
)

$ErrorActionPreference = 'Stop'

function New-TestImage {
  $tmp = Join-Path $PSScriptRoot 'tmp'
  if (!(Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp | Out-Null }
  $file = Join-Path $tmp 'test.png'
  $b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3h4XkAAAAASUVORK5CYII='
  [IO.File]::WriteAllBytes($file, [Convert]::FromBase64String($b64))
  return $file
}

try {
  Write-Host '1) Login admin…'
  $login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -ContentType 'application/json' -Body (@{ email=$AdminEmail; password=$AdminPassword } | ConvertTo-Json)
  if (-not $login.token) { throw 'Login failed: no token' }
  $token = $login.token
  Write-Host ("   -> OK, token: {0}…" -f $token.Substring(0,20))

  $imgPath = New-TestImage

  Write-Host '2) Création catégorie…'
  $catName = 'Cat Test Admin ' + (Get-Random)
  $catJson = & curl.exe --% -s -X POST "$BaseUrl/api/categories" -H "Authorization: Bearer $token" -F "name=$catName" -F "description=Cat pour tests" -F "image=@$imgPath;type=image/png"
  $catResp = $null
  try { $catResp = $catJson | ConvertFrom-Json } catch {}
  if (-not $catResp) {
    throw "Category creation failed. Raw: $catJson"
  }
  $catId = $catResp.category._id
  if (-not $catId) { throw 'Category id missing' }
  Write-Host "   -> Catégorie créée: $catId"

  Write-Host '3) Création produit…'
  $prodName = 'Produit Test Admin ' + (Get-Random)
  $prodJson = & curl.exe --% -s -X POST "$BaseUrl/api/products" -H "Authorization: Bearer $token" -F "name=$prodName" -F "description=Description produit test admin 12345" -F "price=99.99" -F "category=$catId" -F "images=@$imgPath;type=image/png"
  $prodResp = $null
  try { $prodResp = $prodJson | ConvertFrom-Json } catch {}
  if (-not $prodResp) { throw "Product creation failed. Raw: $prodJson" }
  $prodId = $prodResp.product._id
  if (-not $prodId) { throw 'Product id missing' }
  Write-Host "   -> Produit créé: $prodId"

  Write-Host '4) Vérification via recherche…'
  $search = Invoke-RestMethod -Uri ("$BaseUrl/api/products?search={0}&limit=5" -f [uri]::EscapeDataString($prodName)) -Method GET
  $found = $false
  if ($search.products) {
    foreach ($p in $search.products) { if ($p._id -eq $prodId) { $found = $true; break } }
  }
  if (-not $found) { throw 'Product not found in search' }
  Write-Host '   -> Produit trouvé dans la recherche'

  Write-Host '5) Suppression produit…'
  $headers = @{ Authorization = "Bearer $token" }
  $delProd = Invoke-RestMethod -Uri "$BaseUrl/api/products/$prodId" -Method DELETE -Headers $headers
  Write-Host "   -> $($delProd.message)"

  Write-Host '6) Suppression catégorie…'
  $delCat = Invoke-RestMethod -Uri "$BaseUrl/api/categories/$catId" -Method DELETE -Headers $headers
  Write-Host "   -> $($delCat.message)"

  Write-Host '=== Résumé ==='
  Write-Host 'Ajout produit: OK'
  Write-Host 'Suppression produit: OK'
  Write-Host 'Suppression catégorie: OK'

} catch {
  Write-Error $_
  exit 1
}

