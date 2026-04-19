import requests
import os
from PIL import Image
import numpy as np
from io import BytesIO

def download_tile(z, x, y):
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return Image.open(BytesIO(response.content))
        else:
            print(f"Failed to download tile {z}/{x}/{y}: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error downloading tile {z}/{x}/{y}: {e}")
        return None

def download_tiles_for_zoom_level(zoom_level):
    tiles = []
    max_tile = 2 ** zoom_level
    
    print(f"Downloading {max_tile * max_tile} tiles for zoom level {zoom_level}...")
    
    for x in range(max_tile):
        for y in range(max_tile):
            tile = download_tile(zoom_level, x, y)
            if tile:
                tiles.append((x, y, tile))
            else:
                # Create a placeholder for failed tiles
                placeholder = Image.new('RGB', (256, 256), (30, 30, 30))
                tiles.append((x, y, placeholder))
    
    print(f"Downloaded {len(tiles)} tiles")
    return tiles

def stitch_tiles(tiles, zoom_level):
    tile_size = 256
    max_tile = 2 ** zoom_level
    canvas_width = tile_size * max_tile
    canvas_height = tile_size * max_tile
    
    print(f"Creating canvas of size {canvas_width}x{canvas_height}...")
    
    canvas = Image.new('RGB', (canvas_width, canvas_height))
    
    for x, y, tile in tiles:
        canvas.paste(tile, (x * tile_size, y * tile_size))
    
    return canvas

def create_equirectangular_projection(stitched_image):
    width, height = stitched_image.size
    
    # Create equirectangular projection (2:1 aspect ratio)
    target_width = 2048
    target_height = 1024
    
    print(f"Creating equirectangular projection {target_width}x{target_height}...")
    
    # Resize the stitched image to equirectangular format
    equirectangular = stitched_image.resize((target_width, target_height), Image.LANCZOS)
    
    return equirectangular

def main():
    zoom_level = 2  # Use zoom level 2 for reasonable download time
    output_file = 'public/earth_arcgis.jpg'
    
    try:
        # Download tiles
        tiles = download_tiles_for_zoom_level(zoom_level)
        
        if not tiles:
            print("No tiles downloaded!")
            return
        
        # Stitch tiles together
        stitched = stitch_tiles(tiles, zoom_level)
        
        # Create equirectangular projection
        equirectangular = create_equirectangular_projection(stitched)
        
        # Save the result
        os.makedirs('public', exist_ok=True)
        equirectangular.save(output_file, 'JPEG', quality=95)
        
        print(f"✅ Successfully created earth texture: {output_file}")
        print(f"   Image size: {equirectangular.size}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()