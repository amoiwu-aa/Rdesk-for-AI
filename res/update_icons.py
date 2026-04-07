import cairosvg
from PIL import Image
import shutil
import os

svg_file = '../flutter/assets/icon.svg'

def gen_png(size, out):
    cairosvg.svg2png(url=svg_file, write_to=out, output_width=size, output_height=size)

print("Generating PNGs...")
gen_png(1024, 'icon.png')
gen_png(1024, 'mac-icon.png')
gen_png(128, '128x128.png')
gen_png(256, '128x128@2x.png')
gen_png(32, '32x32.png')
gen_png(64, '64x64.png')
gen_png(64, 'mac-tray-dark-x2.png')
gen_png(64, 'mac-tray-light-x2.png')

print("Generating ICOs...")
sizes = [(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)]
img = Image.open('icon.png')
img.save('icon.ico', format='ICO', sizes=sizes)
img.save('tray-icon.ico', format='ICO', sizes=sizes)

print("Copying SVGs...")
shutil.copy(svg_file, 'logo.svg')
shutil.copy(svg_file, 'scalable.svg')
shutil.copy(svg_file, 'design.svg')
shutil.copy(svg_file, 'rustdesk-banner.svg')
shutil.copy(svg_file, 'logo-header.svg')

print("Done!")
