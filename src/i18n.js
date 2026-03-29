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
      "tip": "İpucu: {{angle}} derecelik bir eğim, desteklere ihtiyaç duymadan FDM baskı için yapısal kararlılığı artırır.",
      "export_ready": "DIŞA AKTARIMA HAZIR",
      "orbit_mode": "Yörünge Modu",
      "developer": "Geliştirici"
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
      "tip": "Tip: A {{angle}} degree tilt improves structural stability for FDM printing without needing supports.",
      "export_ready": "READY FOR EXPORT",
      "orbit_mode": "Orbit Mode",
      "developer": "Developer"
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
      "tip": "Tipp: Ein Neigungswinkel von {{angle}} Grad verbessert die strukturelle Stabilität für den FDM-Druck ohne Stützstrukturen.",
      "export_ready": "BEREIT ZUM EXPORT",
      "orbit_mode": "Orbit-Modus",
      "developer": "Entwickler"
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
      "tip": "İpucu: {{angle}} dərəcəlik bir əyilmə, dəstəyə ehtiyac olmadan FDM çapı üçün struktur dayanıqlığını artırır.",
      "export_ready": "İXRACA HAZIRDIR",
      "orbit_mode": "Orbit Rejimi",
      "developer": "Tərtibatçı"
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
