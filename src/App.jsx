import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene3D } from './components/organisms/Scene3D';
import { SettingsCard } from './components/molecules/SettingsCard';
import { handleExport } from './utils/exportUtils';
import { Lightbulb, Search, RefreshCcw, Grid, Beaker } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const App = () => {
  const [text, setText] = useState('YM2KY');
  const [isItalic, setIsItalic] = useState(false);
  const [isThicknessThick, setIsThicknessThick] = useState(true);
  const [materialColor, setMaterialColor] = useState('#22C55E'); // Yazı Rengi
  const [baseColor, setBaseColor] = useState('#0F172A'); // Taban Rengi
  const [tiltAngle, setTiltAngle] = useState(34);
  const [targetWidth, setTargetWidth] = useState(200); // 20 cm
  const [textOffset, setTextOffset] = useState(0);
  const [autoCenter, setAutoCenter] = useState(true);
  const [arcRadius, setArcRadius] = useState(30);
  const [baseHeight, setBaseHeight] = useState(7.5);
  const groupRef = useRef();
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen w-full bg-[#f4f5f8] flex flex-col font-sans text-slate-900 pb-24 md:pb-0 relative overflow-x-hidden">
      
      {/* Top Navigation */}
      <header className="px-6 py-4 flex justify-between items-center w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <img 
            src="/sakrad_logo.png" 
            alt="SAKRAD Logo" 
            className="w-8 h-8 object-contain drop-shadow-md"
          />
          <h1 className="font-bold tracking-tight text-lg text-slate-800">
            {t('title')}
          </h1>
        </div>
        <div className="flex items-center gap-4">
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-12 px-4 sm:px-6 relative">
        
        {/* Left Column: Settings */}
        <div className="w-full md:w-auto flex flex-col gap-6 items-center md:items-start z-10 shrink-0">
          {/* Branding Header (Moved to top) */}
          <div className="relative w-full max-w-sm flex flex-col items-center gap-3 text-center bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 overflow-hidden group/card">
            <a 
              href="https://www.sakrad.org/hakkimizda/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-1.5 relative z-10 py-2"
            >
              <div className="flex items-center gap-3">
                <img 
                  src="/sakrad_logo.png" 
                  alt="SAKRAD Logo" 
                  className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300"
                />
                <div className="text-3xl font-[1000] tracking-[0.25em] text-slate-950 group-hover:text-emerald-700 transition-colors drop-shadow-sm">
                  SAKRAD
                </div>
              </div>
              <div className="text-[11px] font-extrabold tracking-widest text-slate-800 max-w-[300px] leading-tight mt-1">
                SAKARYA AMATÖR TELSİZCİLER VE RADYO AMATÖRLERİ DERNEĞİ
              </div>
            </a>
            
            <div className="w-16 h-px bg-slate-200/80 my-1 relative z-10"></div>
            
            <div className="flex items-center gap-2 text-[12px] text-slate-500 font-bold relative z-10">
              {t('developer')} <strong className="text-emerald-700 font-black bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm">TA2NLE</strong>
            </div>
          </div>

          <SettingsCard 
            text={text} 
            setText={setText}
            isItalic={isItalic} 
            setIsItalic={setIsItalic}
            isThicknessThick={isThicknessThick}
            setIsThicknessThick={setIsThicknessThick}
            materialColor={materialColor}
            setMaterialColor={setMaterialColor}
            baseColor={baseColor}
            setBaseColor={setBaseColor}
            tiltAngle={tiltAngle}
            setTiltAngle={setTiltAngle}
            textOffset={textOffset}
            setTextOffset={setTextOffset}
            autoCenter={autoCenter}
            setAutoCenter={setAutoCenter}
            arcRadius={arcRadius}
            setArcRadius={setArcRadius}
            baseHeight={baseHeight}
            setBaseHeight={setBaseHeight}
            targetWidth={targetWidth}
            setTargetWidth={setTargetWidth}
            onExport={(isMultiColor) => handleExport(groupRef, text, isMultiColor)}
          />

          {/* Tips Section */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <div className="bg-[#FEF5E7] p-4 rounded-xl shadow-sm border border-orange-100/50 flex gap-3 text-sm text-amber-800/80">
              <Lightbulb size={20} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-snug text-[13px]">
                {t('tip', { angle: tiltAngle })}
              </p>
            </div>
            
            <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100/50 flex gap-3 text-sm text-emerald-800/80">
              <span className="text-lg shrink-0 mt-0.5">🎨</span>
              <p className="leading-tight text-[12px]">
                <strong className="block mb-1 text-emerald-900">{t('ams_tip_title')}</strong>
                {t('ams_tip')}
              </p>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl shadow-sm border border-rose-100/50 flex gap-3 text-sm text-rose-800/80">
              <p className="leading-tight text-[12px]">
                {t('ignore_cantilever')}
              </p>
            </div>
          </div>


        </div>

        {/* Right Column: 3D Canvas */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[500px] md:min-h-0 bg-white md:bg-transparent rounded-3xl overflow-hidden shadow-sm md:shadow-none mb-8 md:mb-0">
          
          {/* Canvas View Options Toolbar */}
          <div className="absolute top-4 w-full px-6 flex justify-between items-center z-10 font-medium text-slate-600 text-xs pointer-events-none">
            
            {/* Status Chip */}
            <div className="flex items-center gap-2 bg-slate-50/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 pointer-events-auto shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{t('export_ready')}</span>
            </div>

            <div className="flex items-center gap-4 pointer-events-auto">
              <span className="text-slate-400 tracking-wide text-[11px]">Scale:<br/>1:1</span>
              <div className="flex gap-2 bg-slate-50/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200">
                <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><Search size={16} /></button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><RefreshCcw size={16} /></button>
                <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"><Grid size={16} /></button>
              </div>
            </div>

          </div>

          {/* Width / Height display markers (Visual only mockup) */}
          <div className="absolute left-6 top-32 flex flex-col gap-3 z-10 pointer-events-none opacity-40">
            <div className="flex items-center gap-2 text-[10px] font-mono whitespace-nowrap"><div className="w-8 h-px bg-slate-600"></div> W: {Math.max((text.length * 28), 30)}mm</div>
            <div className="flex items-center gap-2 text-[10px] font-mono whitespace-nowrap"><div className="w-8 h-px bg-slate-600"></div> H: 30mm</div>
          </div>

          {/* The Actual Canvas */}
          <div className="absolute inset-0 z-0">
            {/* Soft gradient background simulating floor in canvas behind 3D space */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f8fbff] to-white/50 pointer-events-none"></div>
            
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 4, 14], fov: 50 }}>
              <Scene3D 
                text={text} 
                isItalic={isItalic} 
                groupRef={groupRef}
                isThicknessThick={isThicknessThick}
                materialColor={materialColor}
                baseColor={baseColor}
                tiltAngle={tiltAngle}
                textOffset={textOffset}
                autoCenter={autoCenter}
                arcRadius={arcRadius}
                baseHeight={baseHeight}
                targetWidth={targetWidth}
              />
            </Canvas>
          </div>

          {/* Orbit Indicator Tool */}
          <div className="absolute bottom-6 flex flex-col items-center gap-1 z-10 pointer-events-none text-slate-400 opacity-60">
             <div className="w-10 h-10 rounded-full border border-dashed border-slate-400 flex items-center justify-center pointer-events-auto cursor-pointer">
               <span className="text-[10px] font-bold">3D</span>
             </div>
             <span className="text-[8px] uppercase font-bold tracking-widest">{t('orbit_mode')}</span>
          </div>

        </div>
      </main>

    </div>
  );
};

export default App;