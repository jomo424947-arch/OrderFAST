import os
from PIL import Image, ImageDraw

def create_circular_icon(img):
    mask = Image.new('L', img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, img.size[0], img.size[1]), fill=255)
    result = img.copy()
    result.putalpha(mask)
    return result

def main():
    root_dir = r"c:\Users\jomo4\OneDrive\Desktop\OrserFAST"
    mobile_res = os.path.join(root_dir, "apps", "mobile", "android", "app", "src", "main", "res")
    store_dir = os.path.join(root_dir, "apps", "mobile", "store_assets")
    release_dir = os.path.join(root_dir, "release_builds")
    os.makedirs(store_dir, exist_ok=True)
    os.makedirs(release_dir, exist_ok=True)

    # Use the pristine, borderless 1024x1024 icon
    icon_src_path = os.path.join(root_dir, "apps", "mobile", "scripts", "perfect_icon_1024.png")
    icon_src = Image.open(icon_src_path).convert("RGBA")

    # Background color of the icon
    bg_color = (22, 25, 32, 255)

    print("Generating Store Assets...")
    # 512x512 Play Store High-res Icon
    icon_512 = icon_src.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save(os.path.join(store_dir, "icon_512x512.png"), "PNG")
    icon_512.save(os.path.join(release_dir, "store_assets", "icon_512x512.png"), "PNG")

    # Mipmap densities
    densities = [
        ("mdpi", 48, 108),
        ("hdpi", 72, 162),
        ("xhdpi", 96, 216),
        ("xxhdpi", 144, 324),
        ("xxxhdpi", 192, 432),
    ]

    print("Generating Clean Mipmap Icons...")
    for name, icon_sz, fg_sz in densities:
        folder = os.path.join(mobile_res, f"mipmap-{name}")
        os.makedirs(folder, exist_ok=True)

        # 1. Standard Square Icon (no outer borders, edge-to-edge dark background)
        resized_icon = icon_src.resize((icon_sz, icon_sz), Image.Resampling.LANCZOS)
        resized_icon.save(os.path.join(folder, "ic_launcher.png"), "PNG")

        # 2. Circular Icon for circle launchers (pure circle cut, no double borders)
        round_icon = create_circular_icon(resized_icon)
        round_icon.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")

        # 3. Adaptive Icon Foreground (contains the centered symbol for Android 8+)
        # In Android adaptive icon, foreground canvas is 108x108 etc.
        # Safe zone is inner 66-72px.
        fg_canvas = Image.new("RGBA", (fg_sz, fg_sz), (0, 0, 0, 0))
        # icon occupies safe central area
        inner_sz = int(fg_sz * 0.72)
        inner_icon = icon_src.resize((inner_sz, inner_sz), Image.Resampling.LANCZOS)
        offset = (fg_sz - inner_sz) // 2
        fg_canvas.paste(inner_icon, (offset, offset), inner_icon)
        fg_canvas.save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")

    print("SUCCESS: High quality, borderless Android icons deployed to all mipmaps!")

if __name__ == "__main__":
    main()
