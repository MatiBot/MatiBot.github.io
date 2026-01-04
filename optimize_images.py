#!/usr/bin/env python3
"""
Image optimization script for Jekyll site.
Optimizes JPEG/PNG images and creates WebP versions.
"""

import os
from PIL import Image
import sys

# Images to optimize (from IMPROVEMENTS.md)
IMAGES_TO_OPTIMIZE = [
    'img/9.jpg',
    'img/IMG_0290.jpg',
    'img/IMG_0261.jpg',
    'img/IMG_0276.jpg',
    'img/IMG_0295-Pano.jpg',
    'img/IMG_0295-Pano-2.jpg',
    'img/intro-bg.jpg',
    'img/me.jpg',
    'img/IMG_0268.jpg',
    'img/IMG_0272.jpg',
]

def get_file_size(filepath):
    """Get file size in MB."""
    return os.path.getsize(filepath) / (1024 * 1024)

def optimize_image(input_path, quality=75, max_width=1920):
    """
    Optimize an image by compressing it.
    Returns the output path and new file size.
    """
    if not os.path.exists(input_path):
        print(f"Warning: {input_path} not found, skipping...")
        return None, None
    
    try:
        img = Image.open(input_path)
        
        # Get original size
        original_size = get_file_size(input_path)
        
        # Determine quality based on file size
        # Large files get more aggressive compression
        if original_size > 2:
            quality = 70
            max_width = 1920
        elif original_size > 1:
            quality = 75
            max_width = 2400
        else:
            quality = 80
            max_width = None
        
        # Convert RGBA to RGB for JPEG
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if max_width is specified and image is larger
        if max_width and img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            print(f"  Resized to {max_width}px width")
        
        # Save optimized version (overwrite original)
        output_path = input_path
        img.save(output_path, 'JPEG', quality=quality, optimize=True, progressive=True)
        
        new_size = get_file_size(output_path)
        reduction = ((original_size - new_size) / original_size) * 100
        
        print(f"✓ {input_path}")
        print(f"  Original: {original_size:.2f} MB → Optimized: {new_size:.2f} MB ({reduction:.1f}% reduction)")
        
        return output_path, new_size
    
    except Exception as e:
        print(f"Error optimizing {input_path}: {e}")
        return None, None

def create_webp(input_path, quality=75, max_width=1920):
    """
    Create WebP version of an image.
    Returns the output path and file size.
    """
    if not os.path.exists(input_path):
        return None, None
    
    try:
        img = Image.open(input_path)
        
        # Determine quality based on file size
        original_size = get_file_size(input_path)
        if original_size > 2:
            quality = 70
            max_width = 1920
        elif original_size > 1:
            quality = 75
            max_width = 2400
        else:
            quality = 80
            max_width = None
        
        # Convert RGBA to RGB for WebP
        if img.mode in ('RGBA', 'LA'):
            # Keep transparency for WebP
            pass
        elif img.mode == 'P':
            img = img.convert('RGBA')
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if max_width is specified and image is larger
        if max_width and img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save WebP version
        webp_path = input_path.replace('.jpg', '.webp').replace('.png', '.webp')
        img.save(webp_path, 'WEBP', quality=quality, method=6)
        
        webp_size = get_file_size(webp_path)
        original_size = get_file_size(input_path)
        reduction = ((original_size - webp_size) / original_size) * 100
        
        print(f"  WebP: {webp_size:.2f} MB ({reduction:.1f}% reduction from original)")
        
        return webp_path, webp_size
    
    except Exception as e:
        print(f"Error creating WebP for {input_path}: {e}")
        return None, None

def main():
    """Main optimization function."""
    print("Starting image optimization...\n")
    
    total_original = 0
    total_optimized = 0
    total_webp = 0
    
    for image_path in IMAGES_TO_OPTIMIZE:
        if not os.path.exists(image_path):
            continue
        
        original_size = get_file_size(image_path)
        total_original += original_size
        
        # Optimize the image (overwrites original)
        optimized_path, optimized_size = optimize_image(image_path)
        if optimized_path and optimized_size:
            total_optimized += optimized_size
            
            # Create WebP version from optimized image
            webp_path, webp_size = create_webp(optimized_path)
            if webp_path and webp_size:
                total_webp += webp_size
        
        print()
    
    print("=" * 60)
    print(f"Total original size: {total_original:.2f} MB")
    print(f"Total optimized size: {total_optimized:.2f} MB")
    print(f"Total WebP size: {total_webp:.2f} MB")
    print(f"Overall reduction: {((total_original - total_webp) / total_original * 100):.1f}%")
    print("=" * 60)
    print("\nOptimization complete!")
    print("\nNext steps:")
    print("1. Review the optimized images")
    print("2. Replace originals with optimized versions if satisfied")
    print("3. Update HTML/CSS to use WebP with fallbacks")

if __name__ == '__main__':
    main()

