import cadquery as cq
import os

# === PARAMETERS ===
metin = "TA4TUN"
yazi_boyutu = 30
kavis_yaricapi = 50  # Arc Radius (R)
taban_yukseklik = 5
plaka_en_payi = 20
plaka_boy_payi = 20

# === 1. BASE GEOMETRY (Taban Plakası) ===
# Metnin yaklaşık boyutlarını hesapla (Basit bir kutu için)
approx_width = len(metin) * yazi_boyutu * 0.7 + plaka_en_payi
approx_depth = yazi_boyutu + kavis_yaricapi + plaka_boy_payi

result = (
    cq.Workplane("XY")
    .box(approx_width, approx_depth, taban_yukseklik)
    .edges("|Z").fillet(2) # Köşeleri yumuşat
    .faces(">Z").edges().chamfer(2) # Üst kenarlara pah kır
)

# === 2. PATH DEFINITION (Kavis Yolu) ===
# YZ düzleminde bir çeyrek daire (Arc) çiziyoruz.
# Başlangıç: Metnin alt sırtı. Bitiş: Taban/Masa seviyesi.
path = (
    cq.Workplane("YZ")
    .moveTo(0, yazi_boyutu / 2) # Metnin merkezi/tabanı gibi düşünelim
    .radiusArc((kavis_yaricapi, -yazi_boyutu / 2), -kavis_yaricapi)
)

# === 3. TEXT PROFILE & SWEEP ===
# Metni 2D profil olarak oluşturuyoruz.
# 'isFixedOffset=True' (Fixed Orientation) kullanarak metnin dikey kalmasını sağlıyoruz.
yazi_profili = (
    cq.Workplane("XY")
    .offsetRect(0, 0)
    .text(metin, yazi_boyutu, 1, font="Arial", kind="bold")
)

# Not: CadQuery'de Sweep için profilin path'in başında olması gerekir.
# Burada basitleştirilmiş bir modelleme kullanıyoruz.
swept_text = yazi_profili.sweep(path, isFixedOffset=True)

# === 4. COMBINE & EXPORT ===
final_model = result.union(swept_text)

# STL olarak kaydet
output_file = "isimlik_curved.stl"
cq.exporters.export(final_model, output_file)

print(f"Model başarıyla oluşturuldu: {output_file}")
