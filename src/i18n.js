import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  TR: {
    translation: {
      "title": "3 Boyutlu İsimlik Üretici",
      "settings_title": "Oluşturucu Ayarları",
      "settings_desc": "3D yazdırılabilir isimliğinizi özelleştirin",
      "language": "Dil",
      "label_text": "Etiket Metni",
      "placeholder": "Örn: 73",
      "font_weight": "Yazı Kalınlığı",
      "thick": "KALIN",
      "thin": "İNCE",
      "transform": "Dönüştürme",
      "italic": "İtalik",
      "filament_color": "Filaman Rengi",
      "plate_thickness": "PLAKA KALINLIĞI",
      "tilt_angle": "EĞİM AÇISI",
      "export_btn": "STL DOSYASI OLARAK ÇIKAR",
      "tip": "İpucu: 30-40 derece arası bir eğim (geriye yatıklık), destek (support) kullanmadan kusursuz FDM baskıları almanızı sağlar.",
      "export_ready": "DIŞA AKTARIMA HAZIR",
      "orbit_mode": "Yörünge Modu",
      "developer": "Geliştirici",
      "alignment_settings": "KONUM AYARLARI",
      "auto_center": "Otomatik Ortala",
      "text_position": "Metin Konumu",
      "arc_radius": "KAVİS YARIÇAPI (R)",
      "base_height": "TABAN YÜKSEKLİĞİ",
      "label_text_color": "Yazı Rengi",
      "label_base_color": "Taban Plakası Rengi",
      "fixed_length": "Sabit Uzunluk (Üretim)",
      "auto": "OTO",
      "auto_length_tooltip": "Harf sayısına göre otomatik uzunluk",
      "export_single": "Tek Parça STL İndir",
      "export_multi": "Çift Renk (AMS) STL İndir",
      "ams_tip_title": "Çoklu Renk (AMS) Baskı",
      "ams_tip": "İndirdiğiniz ZIP dosyasındaki iki parçayı Bambu Studio'ya aynı anda sürükleyin. 'Tek obje olarak yüklensin mi?' sorusuna EVET deyin. Sol taraftaki Objeler (Objects) panelinden parçalara sağ tıklayıp farklı renk (flament) atayabilirsiniz."
    }
  },
  EN: {
    translation: {
      "title": "3D Nameplate Generator",
      "settings_title": "Generator Settings",
      "settings_desc": "Customize your 3D printable nameplate",
      "language": "Language",
      "label_text": "Label Text",
      "placeholder": "Ex: 73",
      "font_weight": "Font Weight",
      "thick": "BOLD",
      "thin": "THIN",
      "transform": "Transform",
      "italic": "Italic",
      "filament_color": "Filament Color",
      "plate_thickness": "PLATE THICKNESS",
      "tilt_angle": "TILT ANGLE",
      "export_btn": "EXPORT AS STL",
      "tip": "Tip: A tilt angle between 30-40 degrees ensures flawless FDM prints without the need for supports.",
      "export_ready": "READY FOR EXPORT",
      "orbit_mode": "Orbit Mode",
      "developer": "Developer",
      "alignment_settings": "ALIGNMENT SETTINGS",
      "auto_center": "Auto-Center",
      "text_position": "Text Position",
      "arc_radius": "ARC RADIUS (R)",
      "base_height": "BASE HEIGHT",
      "label_text_color": "Text Color",
      "label_base_color": "Base Plate Color",
      "fixed_length": "Fixed Length (Production)",
      "auto": "AUTO",
      "auto_length_tooltip": "Automatic length based on letter count",
      "export_single": "Download Single Part STL",
      "export_multi": "Download Dual-Color (AMS) ZIP",
      "ams_tip_title": "Multi-Color (AMS) Printing",
      "ams_tip": "Drag both pieces from the downloaded ZIP into Bambu Studio simultaneously. Click YES when asked 'Load as single object?'. You can assign different colors by right-clicking parts in the Objects panel on the left."
    }
  },
  DE: {
    translation: {
      "title": "3D-Namensschild-Generator",
      "settings_title": "Generator-Einstellungen",
      "settings_desc": "Passen Sie Ihr 3D-Druck-Namensschild an",
      "language": "Sprache",
      "label_text": "Beschriftungstext",
      "placeholder": "Bsp: 73",
      "font_weight": "Schriftstärke",
      "thick": "FETT",
      "thin": "DÜNN",
      "transform": "Transformieren",
      "italic": "Kursiv",
      "filament_color": "Filamentfarbe",
      "plate_thickness": "PLATTENDICKE",
      "tilt_angle": "NEIGUNGSWINKEL",
      "export_btn": "ALS STL EXPORTIEREN",
      "tip": "Tipp: Ein Neigungswinkel zwischen 30-40 Grad sorgt für fehlerfreie FDM-Drucke ohne Stützstrukturen.",
      "export_ready": "BEREIT ZUM EXPORT",
      "orbit_mode": "Orbit-Modus",
      "developer": "Entwickler",
      "arc_radius": "BOGENRADIUS (R)",
      "base_height": "BASISHÖHE",
      "label_text_color": "Textfarbe",
      "label_base_color": "Grundplattenfarbe",
      "fixed_length": "Feste Länge (Produktion)",
      "auto": "AUTO",
      "auto_length_tooltip": "Automatische Länge basierend auf Buchstabenanzahl",
      "export_single": "Einzel-STL herunterladen",
      "export_multi": "Zweifarbige (AMS) ZIP herunterladen",
      "ams_tip_title": "Mehrfarbiger (AMS) Druck",
      "ams_tip": "Ziehen Sie beide Dateien aus der heruntergeladenen ZIP-Datei gleichzeitig in Bambu Studio. Klicken Sie auf JA, wenn Sie gefragt werden: 'Als einzelnes Objekt laden?'. Sie können verschiedene Farben zuweisen, indem Sie im Objektabschitt mit der rechten Maustaste klicken."
    }
  },
  AZ: {
    translation: {
      "title": "3D Adlıq İstehsalçısı",
      "settings_title": "Yaradıcı Ayarları",
      "settings_desc": "3D çap edilə bilən adlığınızı fərdiləşdirin",
      "language": "Dil",
      "label_text": "Etiket Mətni",
      "placeholder": "Məsələn: 73",
      "font_weight": "Yazı Qalınlığı",
      "thick": "QALIN",
      "thin": "İNCƏ",
      "transform": "Çevirmə",
      "italic": "İtalik",
      "filament_color": "Filament Rəngi",
      "plate_thickness": "LÖVHƏ QALINLIĞI",
      "tilt_angle": "ƏYİLMƏ BUCAĞI",
      "export_btn": "STL FAYLI KİMİ ÇIXAR",
      "tip": "İpucu: 30-40 dərəcəlik bir əyilmə, dəstəyə ehtiyac olmadan qüsursuz FDM çapını təmin edir.",
      "export_ready": "İXRACA HAZIRDIR",
      "orbit_mode": "Orbit Rejimi",
      "developer": "Tərtibatçı",
      "arc_radius": "QÖVS RADİUSU (R)",
      "base_height": "BAZA HÜNDÜRLÜYü",
      "label_text_color": "Yazı Rəngi",
      "label_base_color": "Baza Lövhəsi Rəngi",
      "fixed_length": "Sabit Uzunluq (İstehsal)",
      "auto": "AVTO",
      "auto_length_tooltip": "Hərf sayına görə avtomatik uzunluq",
      "export_single": "Tək Parça STL Yüklə",
      "export_multi": "Çox Rəngli (AMS) ZIP Yüklə",
      "ams_tip_title": "Çox Rəngli (AMS) Çap",
      "ams_tip": "Yüklədiyiniz ZIP faylındakı iki parçanı eyni anda Bambu Studio-ya sürükləyin. 'Tək obyekt kimi yüklənsin?' sualına BƏLİ deyin. Sol tərəfdəki Obyektlər panelindən hissələrə sağ klikləməklə müxtəlif rənglər (filament) təyin edə bilərsiniz."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "TR", // default language
    fallbackLng: "EN",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
