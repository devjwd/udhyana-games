from PIL import Image
import os

png_path = os.path.join("build", "icon.png")
ico_path = os.path.join("build", "icon.ico")
app_ico_path = os.path.join("electron", "app", "icon.ico")

img = Image.open(png_path)
img.save(ico_path, format="ICO", sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
img.save(app_ico_path, format="ICO", sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
print("Successfully generated icon.ico in build/ and electron/app/")
