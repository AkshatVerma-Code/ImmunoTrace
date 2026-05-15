import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useDemoMode } from '../context/DemoContext';
import { ChevronRight, ChevronLeft, X, PlayCircle } from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Action Required Alert',
    description: 'Show how HealthWise bubbles up urgent, clinically-relevant action items based on active tracking.',
    path: '/dashboard',
    highlightClass: 'tour-highlight-alert'
  },
  {
    step: 2,
    title: 'AI Insight & Evidence',
    description: 'Demonstrate how AI detects recurring issues, and expand the evidence chain to build trust.',
    path: '/dashboard',
    highlightClass: 'tour-highlight-insight'
  },
  {
    step: 3,
    title: 'Pattern Detection',
    description: 'Transitioning to Records to explore how the AI maps patterns across unstructured medical history.',
    path: '/records',
    highlightClass: 'tour-highlight-patterns'
  },
  {
    step: 4,
    title: 'Smart Query',
    description: 'Run a complex RAG query to showcase the real-time reasoning chain and synthesis.',
    path: '/query',
    highlightClass: 'tour-highlight-query'
  }
];

export function TourOverlay() {
  const { isTourActive, tourStep, nextStep, prevStep, endTour, startTour } = useDemoMode();
  const navigate = useNavigate();
  const location = useLocation();

  // Automatically navigate if the current step requires a different page
  useEffect(() => {
    if (!isTourActive || tourStep === 0) return;
    
    const targetPath = TOUR_STEPS[tourStep - 1]?.path;
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }
  }, [tourStep, isTourActive, navigate, location.pathname]);

  if (!isTourActive) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <button 
          onClick={startTour}
          className="flex items-center gap-2 bg-[#0F3D3E] text-white px-4 py-2.5 rounded-full shadow-xl hover:bg-[#1A595A] transition-all text-sm font-semibold border border-[#2EC4B6]/30"
        >
          <PlayCircle className="w-4 h-4 text-[#2EC4B6]" />
          Start Guided Demo
        </button>
      </div>
    );
  }

  const currentStepData = TOUR_STEPS[tourStep - 1];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md"
      >
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <button 
            onClick={endTour}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-3">
            {TOUR_STEPS.map((s, idx) => (
              <div 
                key={s.step} 
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  idx + 1 === tourStep ? 'bg-[#2EC4B6]' : idx + 1 < tourStep ? 'bg-[#2EC4B6]/40' : 'bg-white/10'
                }`} 
              />
            ))}
          </div>

          <h3 className="text-white font-bold text-base flex items-center gap-2 mb-1">
            <span className="text-[#2EC4B6]">Step {tourStep}:</span> {currentStepData.title}
          </h3>
          <p className="text-white/60 text-xs leading-relaxed mb-5">
            {currentStepData.description}
          </p>

          <div className="flex items-center justify-between">
            <button 
              onClick={prevStep}
              disabled={tourStep === 1}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                tourStep === 1 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            
            {tourStep < TOUR_STEPS.length ? (
              <button 
                onClick={nextStep}
                className="px-4 py-2 bg-[#2EC4B6] hover:bg-[#25A69A] text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-[0_0_15px_rgba(46,196,182,0.3)]"
              >
                Next Step <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button 
                onClick={endTour}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Finish Demo
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}