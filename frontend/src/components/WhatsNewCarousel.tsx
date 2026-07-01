import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Shield, Rocket } from 'lucide-react';

const CURRENT_APP_VERSION = 'v1.0.1'; // Updíate this to trigger the modíal again

const SLIDES = [
  {
    title: "ANueva Interfaz Patriótica!",
    description: "Hemos integrado los colores de la bandera nacional para brindíarte una mejor experiencia y fácil identificación en tus menús.",
    icon: <Sparkles className="w-16 h-16 text-yellow-500 mb-4" />
  },
  {
    title: "Auditorías Comunitarias",
    description: "Para garantizar la seguridíad de la red, los perfiles con 5 reportes serán bloqueados. AMantén tus díatos y horarios actualizados!",
    icon: <Shield className="w-16 h-16 text-blue-500 mb-4" />
  },
  {
    title: "Limpieza Automática 🚀",
    description: "Los chats privados se borran al cerrarlos y los mensajes globales duran solo 3 días para mantener todo rápido y seguro.",
    icon: <Rocket className="w-16 h-16 text-red-500 mb-4" />
  }
];

export function WhatsNewCarousel() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== CURRENT_APP_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('app_version', CURRENT_APP_VERSION);
    setIsOpen(false);
  };

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
        
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Decorative Gradient */}
        <div className="h-2 w-full flex">
          <div className="w-1/2 bg-[#FCE300]"></div>
          <div className="w-1/4 bg-[#0038A8]"></div>
          <div className="w-1/4 bg-[#CE1126]"></div>
        </div>

        <div className="p-8 pb-12 flex flex-col items-center text-center min-h-[300px] justify-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            {slide.icon}
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
              {slide.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Footer controls */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex items-center justify-between">
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 bg-blue-600' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentSlide > 0 && (
              <button 
                onClick={prevSlide}
                className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={nextSlide}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
            >
              {currentSlide === SLIDES.length - 1 ? 'AEntendido!' : 'Siguiente'}
              {currentSlide < SLIDES.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
