import { createContext, useContext, useState, ReactNode } from 'react';

type DemoContextType = {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  isTourActive: boolean;
  tourStep: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const startTour = () => {
    setIsTourActive(true);
    setTourStep(1);
  };

  const nextStep = () => {
    setTourStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setTourStep((prev) => Math.max(1, prev - 1));
  };

  const endTour = () => {
    setIsTourActive(false);
    setTourStep(0);
  };

  return (
    <DemoContext.Provider value={{ 
      isDemoMode, 
      toggleDemoMode: () => setIsDemoMode(!isDemoMode),
      isTourActive,
      tourStep,
      startTour,
      nextStep,
      prevStep,
      endTour
    }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoContext);
  if (!context) return { 
    isDemoMode: false, 
    toggleDemoMode: () => {},
    isTourActive: false,
    tourStep: 0,
    startTour: () => {},
    nextStep: () => {},
    prevStep: () => {},
    endTour: () => {}
  };
  return context;
}
