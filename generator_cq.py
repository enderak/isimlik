#!/usr/bin/env python3
"""
İsimlik 3D Nameplate Generator — v2.0.0-sweep-update
=====================================================
CadQuery tabanlı kavisli (sweep) isimlik üretici.
Metin, bir yay (arc) yolu boyunca süpürülerek tabladan 
kavisli bir şekilde çıkar.

Kullanım:
  python generator_cq.py --text SAKRAD --arc_radius 50 --base_height 5

Gereksinimler:
  pip install cadquery
"""

import cadquery as cq
import argparse
import sys
import math

# ============================================================
# CLI ARGÜMANLARI
# ============================================================

parser = argparse.ArgumentParser(description="3D Kavisli İsimlik Üretici (Sweep)")
parser.add_argument("--text",          type=str,   default="TA4TUN",   help="İsimlik metni")
parser.add_argument("--font_size",     type=float, default=30.0,       help="Yazı boyutu (mm)")
parser.add_argument("--arc_radius",    type=float, default=50.0,       help="Kavis yarıçapı R (mm)")
parser.add_argument("--base_height",   type=float, default=5.0,        help="Taban plakası yüksekliği (mm)")
parser.add_argument("--chamfer",       type=float, default=3.0,        help="Taban üst kenar pah kırma (mm)")
parser.add_argument("--plate_padding", type=float, default=20.0,       help="Plaka kenar payı (mm)")
parser.add_argument("--font",         type=str,   default="Arial",    help="Font adı (sistem fontları)")
parser.add_argument("--output",       type=str,   default="isimlik_curved.stl", help="Çıktı dosyası")
args = parser.parse_args()

# ============================================================
# PARAMETRELER
# ============================================================

metin           = args.text
yazi_boyutu     = args.font_size
kavis_yaricapi  = args.arc_radius
taban_yukseklik = args.base_height
pah_miktari     = args.chamfer
plaka_payi      = args.plate_padding
font_adi        = args.font
output_file     = args.output

# Yazı kalınlığı (sweep derinliği mm)
yazi_kalinlik   = 3.0

# ============================================================
# 1. TABAN PLAKASI (Base Plate + Chamfer)
# ============================================================

# Metnin yaklaşık genişliğini hesapla
approx_width = len(metin) * yazi_boyutu * 0.7 + plaka_payi
approx_depth = yazi_boyutu + kavis_yaricapi + plaka_payi

print(f"[BASE] Taban boyutları: {approx_width:.1f} x {approx_depth:.1f} x {taban_yukseklik:.1f} mm")

# Taban oluştur
base = (
    cq.Workplane("XY")
    .box(approx_width, approx_depth, taban_yukseklik)
)

# Alt köşelere 2mm fillet (yumuşak kenarlar)
try:
    base = base.edges("|Z").fillet(2)
except Exception as e:
    print(f"[WARN] Alt fillet uygulanamadı: {e}")

# Üst kenarlara Chamfer (Pah) — kritik profesyonel detay!
# Chamfer miktarı taban yüksekliğinin yarısını geçmemeli
safe_chamfer = min(pah_miktari, (taban_yukseklik / 2) - 0.5)
if safe_chamfer > 0.5:
    try:
        base = base.faces(">Z").edges().chamfer(safe_chamfer)
        print(f"[BASE] Üst kenarlara {safe_chamfer:.1f}mm chamfer uygulandı ✓")
    except Exception as e:
        print(f"[WARN] Chamfer uygulanamadı (fallback: fillet): {e}")
        try:
            base = base.faces(">Z").edges().fillet(safe_chamfer * 0.8)
        except:
            pass

# ============================================================
# 2. KAVİS YOLU (Arc Path — XZ düzleminde çeyrek daire)
# ============================================================

# Yay; tabanın üst yüzeyinden başlar, yukarı+geriye doğru kıvrılır.
# Başlangıç: (0, taban_yükseklik/2)   → tabanın üst yüzeyi
# Bitiş:     (0, taban_yükseklik/2 + kavis_yaricapi)  → tam dikey
# Bu XZ düzleminde bir çeyrek daire: Z ekseninde ileri, Y ekseninde yukarı

arc_start_y = taban_yukseklik / 2
arc_end_y   = arc_start_y + kavis_yaricapi

# threePointArc için ara nokta (45 derece noktası)
mid_angle = math.pi / 4  # 45 derece
mid_z = kavis_yaricapi * math.sin(mid_angle)
mid_y = arc_start_y + kavis_yaricapi * (1 - math.cos(mid_angle))

# Son nokta (90 derece — tam dikey)
end_z = kavis_yaricapi
end_y = arc_end_y

print(f"[PATH] Yay: R={kavis_yaricapi:.0f}mm, "
      f"Başlangıç=(0, {arc_start_y:.1f}), "
      f"Ara=(z:{mid_z:.1f}, y:{mid_y:.1f}), "
      f"Bitiş=(z:{end_z:.1f}, y:{end_y:.1f})")

path = (
    cq.Workplane("YZ")
    .moveTo(0, arc_start_y)
    .threePointArc(
        (mid_z, mid_y),        # Ara nokta (45°)
        (end_z, end_y)         # Bitiş noktası (90°)
    )
)

# ============================================================
# 3. METİN PROFİLİ OLUŞTURMA & SWEEP
# ============================================================

def sweep_single_char(char, font, size, path_wire):
    """Tek bir harfi sweep eder. Hata durumunda None döner."""
    try:
        profile = (
            cq.Workplane("XZ")
            .text(char, size, yazi_kalinlik, font=font, kind="bold")
        )
        swept = profile.sweep(path_wire, isFrenet=True)
        return swept
    except Exception as e:
        print(f"[WARN] Harf '{char}' sweep başarısız (isFrenet=True): {e}")
        # Fallback: isFrenet=False dene
        try:
            profile = (
                cq.Workplane("XZ")
                .text(char, size, yazi_kalinlik, font=font, kind="bold")
            )
            swept = profile.sweep(path_wire, isFrenet=False)
            return swept
        except Exception as e2:
            print(f"[ERROR] Harf '{char}' sweep tamamen başarısız: {e2}")
            return None


def sweep_text_full(text, font, size, path_wire):
    """Tüm metni tek seferde sweep eder."""
    try:
        profile = (
            cq.Workplane("XZ")
            .text(text, size, yazi_kalinlik, font=font, kind="bold")
        )
        swept = profile.sweep(path_wire, isFrenet=True)
        print(f"[SWEEP] Tam metin sweep başarılı ✓")
        return swept
    except Exception as e:
        print(f"[INFO] Tam metin sweep başarısız, harf harf deneniyor: {e}")
        return None


# Önce tam metni sweep etmeyi dene
swept_text = sweep_text_full(metin, font_adi, yazi_boyutu, path)

# Başarısızsa harf harf dene
if swept_text is None:
    print("[FALLBACK] Harf harf sweep moduna geçiliyor...")
    
    # Harf genişlik tahmini
    char_width = yazi_boyutu * 0.65
    total_width = len(metin) * char_width
    start_x = -total_width / 2 + char_width / 2
    
    result_chars = []
    for i, char in enumerate(metin):
        if char == ' ':
            continue
        
        swept_char = sweep_single_char(char, font_adi, yazi_boyutu, path)
        if swept_char is not None:
            # Harfi X ekseni boyunca konumlandır
            x_offset = start_x + i * char_width
            swept_char = swept_char.translate((x_offset, 0, 0))
            result_chars.append(swept_char)
    
    if result_chars:
        swept_text = result_chars[0]
        for sc in result_chars[1:]:
            try:
                swept_text = swept_text.union(sc)
            except:
                pass
        print(f"[SWEEP] {len(result_chars)}/{len(metin)} harf sweep edildi ✓")
    else:
        # Son çare: Basit extrude + rotate (fallback)
        print("[FALLBACK] Sweep tamamen başarısız, extrude+rotate kullanılıyor...")
        swept_text = (
            cq.Workplane("XY")
            .text(metin, yazi_boyutu, yazi_kalinlik, font=font_adi, kind="bold")
            .translate((0, 0, taban_yukseklik / 2))
        )

# ============================================================
# 4. BİRLEŞTİRME & EXPORT
# ============================================================

# TABAN ALTINDAN TAŞAN KISMI KES (DÜZ ZEMİN VER)
try:
    bottom_z = -taban_yukseklik / 2
    cut_box_height = 500
    keep_box = (
        cq.Workplane("XY")
        .box(approx_width * 3, approx_depth * 3, cut_box_height)
        .translate((0, 0, bottom_z + (cut_box_height / 2)))
    )
    if isinstance(swept_text, cq.Workplane):
        swept_text = swept_text.intersect(keep_box)
        print("[CUT] Yazının tabandan taşan alt kısımları düzeltildi ✓")
except Exception as e:
    print(f"[WARN] Alt kesim işlemi başarısız: {e}")

try:
    final_model = base.union(swept_text)
    print("[UNION] Taban + Yazı birleştirildi ✓")
except Exception as e:
    print(f"[WARN] Union başarısız, ayrı compound olarak kaydediliyor: {e}")
    final_model = cq.Assembly()
    final_model.add(base)
    final_model.add(swept_text)

# STL olarak kaydet
try:
    cq.exporters.export(final_model, output_file)
    print(f"\n{'='*50}")
    print(f"  ✅ Model başarıyla oluşturuldu: {output_file}")
    print(f"  📐 Kavis Yarıçapı: {kavis_yaricapi}mm")
    print(f"  📏 Taban Yükseklik: {taban_yukseklik}mm") 
    print(f"  🔲 Chamfer: {safe_chamfer:.1f}mm")
    print(f"  🔤 Metin: {metin}")
    print(f"{'='*50}\n")
except Exception as e:
    print(f"[FATAL] STL export başarısız: {e}")
    sys.exit(1)
