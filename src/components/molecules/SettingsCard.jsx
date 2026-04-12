import React from 'react';
import { Button } from "../atoms/Button";
import { Download, Globe } from "lucide-react";
import { useTranslation } from 'react-i18next';

export const SettingsCard = ({ 
  text, setText, 
  isItalic, setIsItalic, 
  isThicknessThick, setIsThicknessThick,
  materialColor, setMaterialColor,
  baseColor, setBaseColor,
  plateThickness, setPlateThickness,
  tiltAngle, setTiltAngle,
  textOffset, setTextOffset,
  autoCenter, setAutoCenter,
  arcRadius, setArcRadius,
  baseHeight, setBaseHeight,
  targetWidth, setTargetWidth,
  onExport 
}) => {
  const { t, i18n } = useTranslation();

  const colors = [
    { value: '#22C55E', label: 'Sakarya Green' }, // Açık Yeşil
    { value: '#0F172A', label: 'Sakarya Black' }, // Siyah
    { value: '#3B82F6', label: 'Blue' },   // Mavi
    { value: '#FBBF24', label: 'Yellow' }, // Sarı
    { value: '#F87171', label: 'Coral' },  // Mercan
  ];

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col gap-6 w-full max-w-sm shrink-0">
      
      {/* Language Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
          <Globe size={12} />
          {t('language')}
        </label>
        <div className="bg-slate-100/80 p-1 rounded-xl flex items-center h-11 w-full relative">
          {[
            { code: 'TR', name: 'TÜRKÇE' },
            { code: 'AZ', name: 'AZƏRBAYCANCA' },
            { code: 'ES', name: 'ESPAÑOL' },
            { code: 'DE', name: 'DEUTSCH' },
            { code: 'EN', name: 'ENGLISH' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              title={lang.name}
              className={`z-10 flex-1 text-[11px] font-bold tracking-wider rounded-lg h-full transition-all flex items-center justify-center ${
                i18n.language === lang.code 
                  ? 'bg-white shadow-sm text-emerald-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {lang.code}
            </button>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-500">{t('label_text')}</label>
        <input 
          value={text}
          onChange={(e) => setText(e.target.value.toLocaleUpperCase('tr-TR'))}
          className="w-full bg-white border border-slate-200/80 text-sm text-slate-800 py-3 px-4 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all shadow-sm shadow-slate-100/50"
          placeholder={t('placeholder')}
        />
      </div>

      {/* Toggles Row: Kalınlık & İtalik */}
      <div className="flex justify-between gap-4">
        {/* Yazı Kalınlığı */}
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-500">{t('font_weight')}</label>
          <div className="bg-slate-100/80 p-1 rounded-xl flex items-center h-11 w-full relative">
            {/* Sliding Background */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${
                !isThicknessThick ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
              }`}
            />
            <button 
              onClick={() => setIsThicknessThick(true)}
              className={`z-10 flex-1 text-[11px] font-bold tracking-wider rounded-lg h-full transition-colors ${
                isThicknessThick ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('thick')}
            </button>
            <button 
              onClick={() => setIsThicknessThick(false)}
              className={`z-10 flex-1 text-[11px] font-bold tracking-wider rounded-lg h-full transition-colors ${
                !isThicknessThick ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('thin')}
            </button>
          </div>
        </div>

        {/* Dönüştürme (İtalik) */}
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-500">{t('transform')}</label>
          <div className="bg-white border border-slate-200/80 rounded-xl flex items-center justify-between px-4 h-11 cursor-pointer shadow-sm shadow-slate-100/50"
               onClick={() => setIsItalic(!isItalic)}>
            <span className="text-xs text-slate-700 font-medium">{t('italic')}</span>
            <div className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors duration-300 ${
              isItalic ? 'bg-emerald-600' : 'bg-slate-200'
            }`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                isItalic ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Renk Seçimi: Yazı ve Taban */}
      <div className="flex flex-col gap-4">
        {/* Yazı Rengi */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-500">{t('label_text_color')}</label>
          <div className="flex gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setMaterialColor(color.value)}
                className={`w-8 h-8 rounded-full relative transition-transform hover:scale-110 shadow-sm ${
                  materialColor === color.value ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : ''
                }`}
                style={{ backgroundColor: color.value }}
                aria-label={color.label}
              />
            ))}
          </div>
        </div>
        
        {/* Taban Rengi */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-500">{t('label_base_color')}</label>
          <div className="flex gap-3">
            {colors.map((color) => (
              <button
                key={color.value}
                onClick={() => setBaseColor(color.value)}
                className={`w-8 h-8 rounded-full relative transition-transform hover:scale-110 shadow-sm ${
                  baseColor === color.value ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : ''
                }`}
                style={{ backgroundColor: color.value }}
                aria-label={color.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-4 mt-2">


        {/* Eğim Açısı */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
            <span>{t('tilt_angle')}</span>
            <span>{tiltAngle}°</span>
          </div>
          <input 
            type="range" 
            min="0" max="45" step="1"
            value={tiltAngle}
            onChange={(e) => setTiltAngle(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 outline-none"
          />
        </div>

        {/* Kavis Yarıçapı (R) */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
            <span>{t('arc_radius')}</span>
            <span>{arcRadius}mm</span>
          </div>
          <input 
            type="range" 
            min="10" max="200" step="5"
            value={arcRadius}
            onChange={(e) => setArcRadius(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 outline-none"
          />
        </div>

        {/* Taban Yüksekliği (Base Height) */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
            <span>{t('base_height')}</span>
            <span>{baseHeight.toFixed(1)}mm</span>
          </div>
          <input 
            type="range" 
            min="3" max="15" step="0.5"
            value={baseHeight}
            onChange={(e) => setBaseHeight(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 outline-none"
          />
        </div>

        {/* --- YENİ: KONUM AYARLARI --- */}
        <div className="w-full h-px bg-slate-100/80 my-1"></div>
        
        {/* Üretim Uzunluğu Seçici */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('fixed_length')}</label>
          <div className="bg-slate-100/80 p-1 rounded-xl flex items-center h-11 w-full relative">
              <button 
                onClick={() => setTargetWidth(100)}
                className={`z-10 flex-1 text-[11px] font-bold tracking-wider rounded-lg h-full transition-colors ${
                  targetWidth === 100 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                10 cm
              </button>
              <button 
                onClick={() => setTargetWidth(150)}
                className={`z-10 flex-1 text-[11px] font-bold tracking-wider rounded-lg h-full transition-colors ${
                  targetWidth === 150 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                15 cm
              </button>
              <button 
                onClick={() => setTargetWidth(200)}
                className={`z-10 flex-1 text-[11px] font-bold tracking-wider rounded-lg h-full transition-colors ${
                  targetWidth === 200 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                20 cm
              </button>
              <button 
                onClick={() => setTargetWidth(null)}
                className={`z-10 flex-1 text-[11px] font-bold tracking-wider rounded-lg h-full transition-colors flex items-center justify-center gap-1 ${
                  targetWidth === null ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
                title={t('auto_length_tooltip')}
              >
                {t('auto')}
              </button>
          </div>
        </div>


      </div>

      {/* Export Buttons */}
      <div className="flex flex-row gap-3 mt-4">
        <button 
          onClick={() => onExport(false)}
          className="flex-1 bg-[#059669] hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg shadow-emerald-500/20 py-3.5 px-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[11px] text-center"
        >
          <Download size={18} />
          {t('export_single')}
        </button>
        <button 
          onClick={() => onExport(true)}
          className="flex-1 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-lg shadow-slate-900/20 py-3.5 px-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-[11px] text-center border border-slate-700"
        >
          <div className="flex items-center -space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-800 z-10"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500 ring-2 ring-slate-800 z-0"></span>
          </div>
          {t('export_multi')}
        </button>
      </div>

    </div>
  );
};
