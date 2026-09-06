import os
from PIL import Image

def generate_splash_assets():
    root_dir = r"c:\Users\jomo4\OneDrive\Desktop\OrserFAST"
    mobile_res = os.path.join(root_dir, "apps", "mobile", "android", "app", "src", "main", "res")
    icon_src_path = os.path.join(root_dir, "apps", "mobile", "scripts", "perfect_icon_1024.png")
    
    icon_src = Image.open(icon_src_path).convert("RGBA")
    bg_color = (22, 25, 32, 255) # #161920
    
    # 1. Create transparent emblem (clean alpha extraction)
    w, h = icon_src.size
    pixels = icon_src.load()
    trans_emblem = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    trans_px = trans_emblem.load()
    bg_r, bg_g, bg_b = 22, 25, 32
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = ((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)**0.5
            if dist < 12:
                trans_px[x, y] = (0, 0, 0, 0)
            elif dist < 25:
                alpha = int(255 * (dist - 12) / 13)
                trans_px[x, y] = (r, g, b, alpha)
            else:
                trans_px[x, y] = (r, g, b, 255)

    drawable_dir = os.path.join(mobile_res, "drawable")
    os.makedirs(drawable_dir, exist_ok=True)
    
    # Save high-res transparent emblem and standard emblem
    trans_512 = trans_emblem.resize((512, 512), Image.Resampling.LANCZOS)
    trans_512.save(os.path.join(drawable_dir, "splash_logo_trans.png"), "PNG")
    
    logo_512 = icon_src.resize((512, 512), Image.Resampling.LANCZOS)
    logo_512.save(os.path.join(drawable_dir, "splash_logo.png"), "PNG")
    
    # 2. Splash screen targets (portrait and landscape)
    targets = [
        ("drawable", 720, 1280),
        ("drawable-port-mdpi", 320, 480),
        ("drawable-port-hdpi", 480, 800),
        ("drawable-port-xhdpi", 720, 1280),
        ("drawable-port-xxhdpi", 960, 1600),
        ("drawable-port-xxxhdpi", 1280, 1920),
        ("drawable-land-mdpi", 480, 320),
        ("drawable-land-hdpi", 800, 480),
        ("drawable-land-xhdpi", 1280, 720),
        ("drawable-land-xxhdpi", 1600, 960),
        ("drawable-land-xxxhdpi", 1920, 1280),
    ]
    
    for folder, sw, sh in targets:
        target_dir = os.path.join(mobile_res, folder)
        os.makedirs(target_dir, exist_ok=True)
        splash_img = Image.new("RGBA", (sw, sh), bg_color)
        
        # Calculate emblem size (roughly 35% of min dimension, but balanced)
        min_dim = min(sw, sh)
        logo_size = int(min_dim * 0.40)
        resized_logo = trans_emblem.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Position centered horizontally, slightly above center vertically (46%)
        pos_x = (sw - logo_size) // 2
        pos_y = int(sh * 0.46) - (logo_size // 2)
        
        splash_img.paste(resized_logo, (pos_x, pos_y), resized_logo)
        
        target_file = os.path.join(target_dir, "splash.png")
        splash_img.save(target_file, "PNG")
        print(f"Generated {target_file} ({sw}x{sh})")
        
    print("SUCCESS: All splash screen drawables generated with #161920 background and official logo!")

if __name__ == "__main__":
    generate_splash_assets()
