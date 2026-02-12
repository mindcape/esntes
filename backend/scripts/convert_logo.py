
import base64
import os
import sys

def convert_png_to_svg(png_path, svg_path):
    with open(png_path, "rb") as image_file:
        image_data = image_file.read()
        encoded_string = base64.b64encode(image_data).decode('utf-8')
    
    # Function to parse PNG IHDR chunk
    def get_png_dimensions(data):
        import struct
        # PNG signature: 8 bytes
        if data[:8] != b'\x89PNG\r\n\x1a\n':
            return None, None
        # IHDR chunk: 4 byte length, 4 byte type (IHDR), 4 byte width, 4 byte height
        # IHDR starts at offset 8. Length is at 8, Type at 12 (must be IHDR). Data at 16.
        # Width at 16, Height at 20.
        w, h = struct.unpack('>LL', data[16:24])
        return w, h

    # Try to use Pillow to get the bounding box (crop whitespace)
    viewBox = "0 0 100% 100%"
    width_attr = "100%"
    height_attr = "100%"

    try:
        from PIL import Image, ImageChops
        import io
        
        # Load image from bytes
        img = Image.open(io.BytesIO(image_data))
        print(f"Image Mode: {img.mode}")
        
        # Try simple getbbox first (works for transparent background)
        bbox = img.getbbox()
        
        # Check if bbox is full size, if so, might be white background
        if bbox == (0, 0, img.width, img.height):
            print("Simple getbbox returned full size. Trying thresholding to ignore near-white noise...")
            try:
                from PIL import ImageOps
                # Convert to grayscale
                gray = img.convert('L')
                
                # Apply threshold: anything > 240 becomes 255 (white), else 0 (black/content)
                # Then we want content to be non-zero for getbbox
                # So: > 240 -> 0 (bg), <= 240 -> 255 (content)
                threshold = 240
                bw = gray.point(lambda x: 255 if x <= threshold else 0, '1')
                
                bbox = bw.getbbox()
                if bbox:
                    print(f"Computed bounding box using Threshold {threshold}: {bbox}")
                else:
                    print("Thresholded image is empty (image was fully near-white).")
                    # If empty, maybe the logo is very light? Try looser threshold
                    threshold = 200
                    bw = gray.point(lambda x: 255 if x <= threshold else 0, '1')
                    bbox = bw.getbbox()
                    if bbox:
                         print(f"Computed bounding box using Threshold {threshold}: {bbox}")
                    else:
                         bbox = (0, 0, img.width, img.height)

            except Exception as inner_e:
                print(f"Error during thresholding: {inner_e}")
                bbox = (0, 0, img.width, img.height)
        
        if bbox:
            # bbox is (left, upper, right, lower)
            left, upper, right, lower = bbox
            width = right - left
            height = lower - upper
            
            # Construct viewBox
            viewBox = f"{left} {upper} {width} {height}"
            width_attr = str(width)
            height_attr = str(height)
            
            print(f"Detected dimensions: {img.width}x{img.height}")
            print(f"Final viewBox: {viewBox}")
        else:
            print("Could not detect bounding box.")
            w, h = get_png_dimensions(image_data)
            if w and h:
                width_attr = str(w)
                height_attr = str(h)
                viewBox = f"0 0 {w} {h}"

    except Exception as e:
        print(f"Error using Pillow for cropping: {e}")
        # Fallback to IHDR dimensions
        w, h = get_png_dimensions(image_data)
        if w and h:
            width_attr = str(w)
            height_attr = str(h)
            viewBox = f"0 0 {w} {h}"

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width_attr}" height="{height_attr}" viewBox="{viewBox}" version="1.1">
  <image href="data:image/png;base64,{encoded_string}" x="0" y="0" width="{width_attr}" height="{height_attr}" />
</svg>'''

    with open(svg_path, "w") as svg_file:
        svg_file.write(svg_content)
    
    print(f"Converted {png_path} to {svg_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert_logo.py <input_png> <output_svg>")
        sys.exit(1)
    
    convert_png_to_svg(sys.argv[1], sys.argv[2])
