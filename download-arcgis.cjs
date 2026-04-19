const https = require('https');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const publicDir = path.join(__dirname, 'public');

async function downloadTile(z, x, y) {
  const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
  const filename = path.join(publicDir, `tile_${z}_${x}_${y}.png`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded tile ${z}/${x}/${y}`);
          resolve(filename);
        });
      } else {
        fs.unlink(filename, () => {});
        reject(new Error(`Failed to download tile ${z}/${x}/${y}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filename, () => {});
      reject(err);
    });
  });
}

async function downloadTilesForZoomLevel(zoomLevel) {
  const tiles = [];
  const maxTile = Math.pow(2, zoomLevel);
  
  for (let x = 0; x < maxTile; x++) {
    for (let y = 0; y < maxTile; y++) {
      tiles.push({ z: zoomLevel, x, y });
    }
  }
  
  console.log(`Downloading ${tiles.length} tiles for zoom level ${zoomLevel}...`);
  
  const results = await Promise.allSettled(
    tiles.map(tile => downloadTile(tile.z, tile.x, tile.y))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Download complete: ${successful} successful, ${failed} failed`);
  
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}

async function stitchTiles(tileFiles, zoomLevel) {
  const tileSize = 256;
  const maxTile = Math.pow(2, zoomLevel);
  const canvasWidth = tileSize * maxTile;
  const canvasHeight = tileSize * maxTile;
  
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  console.log('Stitching tiles together...');
  
  for (let x = 0; x < maxTile; x++) {
    for (let y = 0; y < maxTile; y++) {
      const tileFile = path.join(publicDir, `tile_${zoomLevel}_${x}_${y}.png`);
      
      if (fs.existsSync(tileFile)) {
        try {
          const img = await loadImage(tileFile);
          ctx.drawImage(img, x * tileSize, y * tileSize);
        } catch (err) {
          console.error(`Error loading tile ${zoomLevel}/${x}/${y}:`, err);
        }
      }
    }
  }
  
  const outputPath = path.join(publicDir, 'earth_arcgis.png');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Created stitched image: ${outputPath}`);
  
  return outputPath;
}

async function cleanupTiles(zoomLevel) {
  const maxTile = Math.pow(2, zoomLevel);
  let cleaned = 0;
  
  for (let x = 0; x < maxTile; x++) {
    for (let y = 0; y < maxTile; y++) {
      const tileFile = path.join(publicDir, `tile_${zoomLevel}_${x}_${y}.png`);
      if (fs.existsSync(tileFile)) {
        fs.unlinkSync(tileFile);
        cleaned++;
      }
    }
  }
  
  console.log(`Cleaned up ${cleaned} tile files`);
}

async function main() {
  const zoomLevel = 2; // 使用较低的缩放级别来减少下载量
  
  try {
    console.log('Starting ArcGIS World Imagery download...');
    
    const tileFiles = await downloadTilesForZoomLevel(zoomLevel);
    
    if (tileFiles.length > 0) {
      const outputPath = await stitchTiles(tileFiles, zoomLevel);
      console.log('✅ Successfully created earth texture:', outputPath);
      
      await cleanupTiles(zoomLevel);
    } else {
      console.error('❌ No tiles were downloaded successfully');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();