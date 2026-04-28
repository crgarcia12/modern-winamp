#!/usr/bin/env python3
"""
Convert Winamp BMP files to PNG format using PIL/Pillow
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("PIL/Pillow not found. Trying to install...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def convert_bmp_to_png(input_dir, output_dir):
    """Convert all BMP files in input_dir to PNG in output_dir"""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    bmp_files = list(input_path.glob("*.BMP"))
    
    if not bmp_files:
        print(f"No BMP files found in {input_dir}")
        return
    
    for bmp_file in bmp_files:
        try:
            print(f"Converting {bmp_file.name}...")
            img = Image.open(bmp_file)
            png_file = output_path / (bmp_file.stem.lower() + ".png")
            img.save(png_file, "PNG")
            print(f"  -> {png_file.name}")
        except Exception as e:
            print(f"Error converting {bmp_file.name}: {e}")

if __name__ == "__main__":
    assets_dir = "web-winamp/assets"
    convert_bmp_to_png(assets_dir, assets_dir)
    print("Conversion complete!")