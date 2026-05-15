import { createBrowserRouter } from 'react-router';
import { ReactNode } from 'react';
import { Dashboard } from './pages/Dashboard';
import { DetailView } from './pages/DetailView';
import { SmartQuery } from './pages/SmartQuery';
import { Activity } from './pages/Activity';
import { CalendarPage } from './pages/CalendarPage';
import { Records } from './pages/Records';
import { DietPlan } from './pages/DietPlan';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { Sidebar } from './components/Sidebar';
import { TourOverlay } from './components/TourOverlay';
import { TraceBot } from './components/TraceBot';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';

function Root({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#F4F7F6] font-sans overflow-hidden">
      {/* Soft background ambient glows - adapted to Teal/Emerald */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#2EC4B6]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#0F3D3E]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
      
      {/* Subtle Data Flow Line Patterns (Memory Loops) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] mix-blend-multiply" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100 200 C 300 0, 600 400, 1200 200 S 2000 0, 2400 300" fill="none" stroke="#0F3D3E" strokeWidth="2" strokeDasharray="8 8" />
        <path d="M-100 300 C 400 100, 500 600, 1000 400 S 1800 100, 2400 500" fill="none" stroke="#2EC4B6" strokeWidth="3" />
        <path d="M-100 800 C 300 600, 700 900, 1300 700 S 1900 500, 2400 800" fill="none" stroke="#0F3D3E" strokeWidth="1.5" strokeDasharray="4 6" />
        <path d="M-100 900 C 400 1100, 800 700, 1400 1000 S 2000 800, 2400 1100" fill="none" stroke="#2EC4B6" strokeWidth="2" opacity="0.5" />
      </svg>
      
      <Sidebar />
      <div className="relative z-10">
        {children}
      </div>
      <TourOverlay />
      <TraceBot />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Root><Dashboard /></Root></ProtectedRoute>,
  },
  {
    path: '/detail/:partId',
    element: <ProtectedRoute><Root><DetailView /></Root></ProtectedRoute>,
  },
  {
    path: '/query',
    element: <ProtectedRoute><Root><SmartQuery /></Root></ProtectedRoute>,
  },
  {
    path: '/activity',
    element: <ProtectedRoute><Root><Activity /></Root></ProtectedRoute>,
  },
  {
    path: '/schedule',
    element: <ProtectedRoute><Root><CalendarPage /></Root></ProtectedRoute>,
  },
  {
    path: '/records',
    element: <ProtectedRoute><Root><Records /></Root></ProtectedRoute>,
  },
  {
    path: '/diet-plan',
    element: <ProtectedRoute><Root><DietPlan /></Root></ProtectedRoute>,
  },
  {
    path: '/profile',
    element: <ProtectedRoute><Root><Profile /></Root></ProtectedRoute>,
  },
  {
    path: '/settings',
    element: <ProtectedRoute><Root><Settings /></Root></ProtectedRoute>,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
