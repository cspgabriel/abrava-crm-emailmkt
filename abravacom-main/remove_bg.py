import urllib.request
import sys
import subprocess

def main():
    try:
        import rembg
    except ImportError:
        print("Installing rembg...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "rembg", "onnxruntime"])
        import rembg

    from rembg import remove
    from PIL import Image

    print("Downloading image...")
    url = 'https://i.ibb.co/4wCtPpnC/image-1773870221155.png'
    urllib.request.urlretrieve(url, 'temp_logo.png')

    print("Removing background...")
    input_image = Image.open('temp_logo.png')
    output_image = remove(input_image)
    
    print("Saving transparent image...")
    output_image.save('public/logo_abravacon_transparent.png')
    print("Done!")

if __name__ == "__main__":
    main()
