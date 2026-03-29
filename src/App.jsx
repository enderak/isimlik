import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene3D } from './components/organisms/Scene3D';
import { SettingsCard } from './components/molecules/SettingsCard';
import { handleExport } from './utils/exportUtils';
import { Settings, User, Lightbulb, Search, RefreshCcw, Grid, Beaker } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const App = () => {
  const [text, setText] = useState('73');
  const [isItalic, setIsItalic] = useState(false);
  const [isThicknessThick, setIsThicknessThick] = useState(true);
  const [materialColor, setMaterialColor] = useState('#3B82F6'); // Default Blue
  const [plateThickness, setPlateThickness] = useState(4.5);
  const [tiltAngle, setTiltAngle] = useState(15);
  const groupRef = useRef();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full bg-[#f4f5f8] flex flex-col font-sans text-slate-900 pb-24 md:pb-0 relative overflow-x-hidden">
      
      {/* Top Navigation */}
      <header className="px-6 py-4 flex justify-between items-center w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Beaker size={20} />
          </div>
          <h1 className="font-bold tracking-tight text-lg text-slate-800">
            {t('title')}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-slate-700 transition-colors">
            <Settings size={22} />
          </button>
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white shadow-sm cursor-pointer hover:bg-slate-800">
            <User size={18} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-12 px-4 sm:px-6 relative">
        
        {/* Left Column: Settings */}
        <div className="w-full md:w-auto flex flex-col gap-6 items-center md:items-start z-10 shrink-0">
          <SettingsCard 
            text={text} 
            setText={setText}
            isItalic={isItalic} 
            setIsItalic={setIsItalic}
            isThicknessThick={isThicknessThick}
            setIsThicknessThick={setIsThicknessThick}
            materialColor={materialColor}
            setMaterialColor={setMaterialColor}
            plateThickness={plateThickness}
            setPlateThickness={setPlateThickness}
            tiltAngle={tiltAngle}
            setTiltAngle={setTiltAngle}
            onExport={() => handleExport(groupRef, text)}
          />

          {/* Warning Tip */}
          <div className="bg-[#FEF5E7] p-4 rounded-xl shadow-sm border border-orange-100/50 flex gap-3 text-sm text-amber-800/80 w-full max-w-sm">
            <Lightbulb size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-snug text-[13px]">
              {t('tip', { angle: tiltAngle })}
            </p>
          </div>

          {/* Branding Footer (Left Col) */}
          <footer className="w-full max-w-sm flex flex-col items-center gap-1.5 opacity-60 mt-4 md:mb-10 text-center">
            <a 
              href="https://www.sakrad.org/hakkimizda/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-blue-500 transition-colors"
            >
              SAKRAD - SAKARYA AMATÖR TELSİZCİLER VE RADYO AMATÖRLERİ DERNEĞİ
            </a>
            <span className="text-[10px] text-slate-400 font-medium">{t('developer')} TA2NLE</span>
          </footer>
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
            <div className="flex items-center gap-2 text-[10px] font-mono whitespace-nowrap"><div className="w-8 h-px bg-slate-600"></div> W: {Math.max((text.length * 15), 30)}mm</div>
            <div className="flex items-center gap-2 text-[10px] font-mono whitespace-nowrap"><div className="w-8 h-px bg-slate-600"></div> H: {Math.max((text.length * 0.5 * 10), 15)}mm</div>
          </div>

          {/* The Actual Canvas */}
          <div className="absolute inset-0 z-0">
            {/* Soft gradient background simulating floor in canvas behind 3D space */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f8fbff] to-white/50 pointer-events-none"></div>
            
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 5, 12], fov: 45 }}>
              <Scene3D 
                text={text} 
                isItalic={isItalic} 
                groupRef={groupRef}
                isThicknessThick={isThicknessThick}
                materialColor={materialColor}
                plateThickness={plateThickness}
                tiltAngle={tiltAngle}
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