import { Bell, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-end mb-12">
      <div className="flex items-center bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-2 py-1.5 gap-1">
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#F36B6B] rounded-full border-2 border-white" />
        </button>
        <button 
          onClick={() => router.push('/settings')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button 
          onClick={() => router.push('/profile')}
          className="ml-1 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm"
        >
          <img 
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150" 
            alt="User Profile" 
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </div>
  );
}