from PIL import Image
import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
png_path = os.path.join(root_dir, "build", "icon.png")
ico_path = os.path.join(root_dir, "build", "icon.ico")
app_ico_path = os.path.join(root_dir, "electron", "app", "icon.ico")

img = Image.open(png_path)
img.save(ico_path, format="ICO", sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
img.save(app_ico_path, format="ICO", sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
print(f"Successfully generated icon.ico in {ico_path} and {app_ico_path}")
