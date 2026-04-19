# ArcGIS World Imagery Tile Downloader
# Downloads tiles and creates an equirectangular projection for 3D Earth

$zoomLevel = 2
$maxTile = [math]::Pow(2, $zoomLevel)
$tileSize = 256
$canvasWidth = $tileSize * $maxTile
$canvasHeight = $tileSize * $maxTile

Write-Host "Downloading $maxTile x $maxTile tiles for zoom level $zoomLevel..."

# Create temporary directory for tiles
$tempDir = "temp_tiles"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# Download tiles
$downloadedTiles = 0
for ($x = 0; $x -lt $maxTile; $x++) {
    for ($y = 0; $y -lt $maxTile; $y++) {
        $url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/$zoomLevel/$y/$x"
        $filename = "$tempDir\tile_${zoomLevel}_${x}_${y}.png"
        
        try {
            Write-Progress -Activity "Downloading tiles" -Status "Tile ${x},${y}" -PercentComplete (($downloadedTiles / ($maxTile * $maxTile)) * 100)
            Invoke-WebRequest -Uri $url -OutFile $filename -TimeoutSec 30 -ErrorAction Stop
            $downloadedTiles++
        }
        catch {
            $errorMsg = $_.Exception.Message
            Write-Warning "Failed to download tile ${x},${y}: ${errorMsg}"
            # Create a placeholder for failed tiles
            $placeholder = New-Object System.Drawing.Bitmap($tileSize, $tileSize)
            $graphics = [System.Drawing.Graphics]::FromImage($placeholder)
            $graphics.Clear([System.Drawing.Color]::FromArgb(30, 30, 30))
            $placeholder.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose()
            $placeholder.Dispose()
        }
    }
}

Write-Host "Downloaded $downloadedTiles tiles successfully"

# Stitch tiles together using .NET
Write-Host "Creating equirectangular projection..."
$stitchedBitmap = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight)
$graphics = [System.Drawing.Graphics]::FromImage($stitchedBitmap)

for ($x = 0; $x -lt $maxTile; $x++) {
    for ($y = 0; $y -lt $maxTile; $y++) {
        $filename = "$tempDir\tile_${zoomLevel}_${x}_${y}.png"
        if (Test-Path $filename) {
            $tileBitmap = [System.Drawing.Image]::FromFile($filename)
            $graphics.DrawImage($tileBitmap, $x * $tileSize, $y * $tileSize, $tileSize, $tileSize)
            $tileBitmap.Dispose()
        }
    }
}

# Resize to equirectangular format (2:1 aspect ratio)
$targetWidth = 2048
$targetHeight = 1024
$equirectangularBitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
$equirectangularGraphics = [System.Drawing.Graphics]::FromImage($equirectangularBitmap)
$equirectangularGraphics.DrawImage($stitchedBitmap, 0, 0, $targetWidth, $targetHeight)

# Save the result
$outputFile = "public\earth_arcgis.jpg"
$equirectangularBitmap.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Cleanup
$graphics.Dispose()
$stitchedBitmap.Dispose()
$equirectangularGraphics.Dispose()
$equirectangularBitmap.Dispose()

# Clean up temporary files
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "✅ Successfully created earth texture: $outputFile"
Write-Host "   Image size: ${targetWidth}x${targetHeight}"