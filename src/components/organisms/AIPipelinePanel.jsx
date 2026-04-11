import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, X, Check, Loader2, AlertTriangle, Download, Cpu, Paintbrush, FileCode, Box, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STEPS = [
  { key: 'prompt',    icon: Sparkles,   labelKey: 'ai_step_prompt' },
  { key: 'generate',  icon: Paintbrush, labelKey: 'ai_step_generate' },
  { key: 'cleanup',   icon: Cpu,        labelKey: 'ai_step_cleanup' },
  { key: 'vectorize', icon: FileCode,   labelKey: 'ai_step_vectorize' },
  { key: 'model',     icon: Box,        labelKey: 'ai_step_model' },
  { key: 'done',      icon: Zap,        labelKey: 'ai_step_done' },
];

const STYLES = [
  { value: 'standard', label: 'Standard', emoji: '🧱' },
  { value: 'fluid',    label: 'Fluid',    emoji: '🌊' },
  { value: 'extreme',  label: 'Extreme',  emoji: '💥' },
];

const API_URL = 'http://localhost:3001';

export const AIPipelinePanel = ({ text }) => {
  const { t } = useTranslation();

  const [style, setStyle] = useState('standard');
  const [currentStep, setCurrentStep] = useState(-1); // -1 = idle
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [wasCached, setWasCached] = useState(false);
  const controllerRef = useRef(null);

  const stepLabel = (key) => {
    const map = {
      ai_step_prompt:    'Prompt oluşturuluyor...',
      ai_step_generate:  'Görsel üretiliyor...',
      ai_step_cleanup:   'Temizleniyor (AI optimize)...',
      ai_step_vectorize: 'SVG oluşturuluyor...',
      ai_step_model:     '3D model hazırlanıyor...',
      ai_step_done:      'STL hazır!',
    };
    return t(key, map[key]);
  };

  // Simulate step progression during the API call
  const simulateSteps = useCallback((controller) => {
    // Step timings simulate the pipeline stages
    const timings = [0, 2000, 12000, 18000, 22000]; // prompt, generate, cleanup, vectorize, model
    const timeouts = [];

    timings.forEach((delay, i) => {
      const tid = setTimeout(() => {
        if (!controller.signal.aborted) {
          setCurrentStep(i);
        }
      }, delay);
      timeouts.push(tid);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const handleGenerate = async () => {
    if (!text || text.length < 2) {
      setError('Metin en az 2 karakter olmalı.');
      return;
    }
    if (text.length > 15) {
      setError('Metin en fazla 15 karakter olabilir.');
      return;
    }

    setError(null);
    setIsRunning(true);
    setCurrentStep(0);
    setWasCached(false);

    const controller = new AbortController();
    controllerRef.current = controller;

    const clearSteps = simulateSteps(controller);

    try {
      const response = await fetch(`${API_URL}/api/generate-stl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      // Check cache hit
      const cacheHit = response.headers.get('X-Cache-Hit') === 'true';
      setWasCached(cacheHit);

      // Download the STL file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${text}.stl`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setCurrentStep(5); // Done

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('İptal edildi.');
      } else {
        setError(err.message);
      }
    } finally {
      clearSteps();
      setIsRunning(false);
      controllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
  };

  const isIdle = currentStep === -1;
  const isDone = currentStep === 5;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 flex flex-col gap-5 w-full max-w-sm shrink-0">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="text-slate-800 font-bold text-base leading-tight">AI Pipeline</h2>
          <p className="text-[10px] text-slate-400 font-semibold tracking-tight">
            Text → AI → SVG → STL (ücretsiz)
          </p>
        </div>
      </div>

      {/* Style Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stil</label>
        <div className="bg-slate-100/80 p-1 rounded-xl flex items-center h-11 w-full relative">
          {/* Sliding Background */}
          <div 
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-in-out"
            style={{
              width: `calc(${100 / STYLES.length}% - 4px)`,
              transform: `translateX(calc(${STYLES.findIndex(s => s.value === style) * 100}% + ${STYLES.findIndex(s => s.value === style) * 4}px))`,
            }}
          />
          {STYLES.map((s) => (
            <button 
              key={s.value}
              onClick={() => !isRunning && setStyle(s.value)}
              disabled={isRunning}
              className={`z-10 flex-1 text-[11px] font-bold tracking-wider rounded-lg h-full transition-colors flex items-center justify-center gap-1 ${
                style === s.value ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
              } ${isRunning ? 'cursor-not-allowed' : ''}`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Progress Steps */}
      {!isIdle && (
        <div className="flex flex-col gap-1 animate-in fade-in">
          {STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isActive = i === currentStep && !isDone;
            const isCompleted = i < currentStep || isDone;
            const isPending = i > currentStep;

            return (
              <div 
                key={step.key}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-violet-50 border border-violet-200/50' :
                  isCompleted ? 'bg-emerald-50/50' : 
                  'opacity-40'
                }`}
              >
                {/* Icon */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-violet-500 text-white' :
                  isCompleted ? 'bg-emerald-500 text-white' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {isActive ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isCompleted ? (
                    <Check size={14} />
                  ) : (
                    <StepIcon size={14} />
                  )}
                </div>

                {/* Label */}
                <span className={`text-[12px] font-semibold ${
                  isActive ? 'text-violet-700' :
                  isCompleted ? 'text-emerald-700' :
                  'text-slate-400'
                }`}>
                  {stepLabel(step.labelKey)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Cache Hit Badge */}
      {isDone && wasCached && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200/50">
          <Zap size={14} className="text-amber-600" />
          <span className="text-[11px] font-bold text-amber-700">
            Cache'den yüklendi — anında teslim! ⚡
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-3 bg-red-50 rounded-xl border border-red-200/50 text-red-700">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span className="text-[12px] font-semibold leading-snug">{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 mt-1">
        {isRunning ? (
          <button 
            onClick={handleCancel}
            className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-lg shadow-red-500/20 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
          >
            <X size={18} />
            İptal Et
          </button>
        ) : (
          <button 
            onClick={handleGenerate}
            disabled={!text || text.length < 2}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:from-violet-800 active:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-violet-500/20 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
          >
            {isDone ? <Download size={18} /> : <Sparkles size={18} />}
            {isDone ? 'Tekrar Üret' : 'AI ile STL Üret'}
          </button>
        )}
      </div>

      {/* Info */}
      <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
        Pollinations.ai (ücretsiz) → Sharp → Potrace → OpenSCAD
      </p>
    </div>
  );
};
