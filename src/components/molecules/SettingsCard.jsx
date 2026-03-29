import React from 'react';
import { Button } from "../atoms/Button";
import { Download, Globe } from "lucide-react";
import { useTranslation } from 'react-i18next';

export const SettingsCard = ({ 
  text, setText, 
  isItalic, setIsItalic, 
  isThicknessThick, setIsThicknessThick,
  materialColor, setMaterialColor,
  plateThickness, setPlateThickness,
  tiltAngle, setTiltAngle,
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
      
      {/* Header */}
      <div>
        <h2 className="text-slate-800 font-bold text-lg leading-tight">{t('settings_title')}</h2>
        <p className="text-xs text-slate-400 font-medium tracking-tight mt-1">
          {t('settings_desc')}
        </p>
      </div>

      {/* Language / Dil */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-500">{t('language')}</label>
        <div className="relative">
          <select 
            className="w-full bg-white border border-slate-200/80 text-sm text-slate-700 py-3 px-4 rounded-xl appearance-none outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all cursor-pointer"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            <option value="TR">Türkçe (TR)</option>
            <option value="EN">English (EN)</option>
            <option value="DE">Deutsch (DE)</option>
            <option value="AZ">Azərbaycanca (AZ)</option>
          </select>
          <Globe size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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

      {/* Filaman Rengi */}
      <div className="flex flex-col gap-3">
        <label className="text-[11px] font-bold text-slate-500">{t('filament_color')}</label>
        <div className="flex gap-3">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => setMaterialColor(color.value)}
              className={`w-9 h-9 rounded-full relative transition-transform hover:scale-105 ${
                materialColor === color.value ? 'ring-2 ring-offset-2 ring-emerald-500' : ''
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={color.label}
            />
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-4 mt-2">
        {/* Plaka Kalınlığı */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
            <span>{t('plate_thickness')}</span>
            <span>{plateThickness.toFixed(1)}mm</span>
          </div>
          <input 
            type="range" 
            min="2" max="10" step="0.5"
            value={plateThickness}
            onChange={(e) => setPlateThickness(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 outline-none"
          />
        </div>

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
      </div>

      {/* Export Button */}
      <button 
        onClick={onExport}
        className="w-full mt-2 bg-[#059669] hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-lg shadow-emerald-500/20 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
      >
        <Download size={18} />
        {t('export_btn')}
      </button>

    </div>
  );
};
