import { Activity, Home, Calendar, Stethoscope, BookOpen, MessageCircle, Flag, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Diet Plan', path: '/diet-plan' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: MessageCircle, label: 'Chat', path: '/query' },
    { icon: Stethoscope, label: 'Docs', path: '/records' },
    { icon: BookOpen, label: 'Health Records', path: '/activity' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-24 flex flex-col items-center py-8 z-50 hidden md:flex">
      {/* Logo */}
      <div className="mb-12">
        <div className="w-10 h-10 rounded-2xl bg-[#0F3D3E] text-white grid place-items-center shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path === '/dashboard' && pathname.startsWith('/detail/'));

          return (
            <Link
              key={item.path}
              href={item.path}
              className="relative group flex items-center justify-center w-12 h-12"
            >
              {isActive && (
                <motion.div
                  layoutId="activeSidebar"
                  className="absolute inset-0 bg-[#0F3D3E] rounded-full shadow-lg"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'text-white'
                  : 'bg-white text-slate-400 shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:text-[#2EC4B6] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)]'
              }`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
            </Link>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={async () => {
            if (confirm('Are you sure you want to log out?')) {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/');
            }
          }}
          className="relative group flex items-center justify-center w-12 h-12 mt-2"
        >
          <div className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 bg-white text-slate-400 shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:text-[#E63946] hover:bg-[#E63946]/5 hover:shadow-[0_4px_15px_rgba(230,57,70,0.1)]">
            <LogOut className="w-5 h-5" strokeWidth={2} />
          </div>
        </button>
      </nav>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-6 mt-auto">
        <div className="flex flex-col gap-6">
          <button className="w-12 h-12 rounded-full bg-white text-slate-400 shadow-[0_4px_15px_rgb(0,0,0,0.03)] flex items-center justify-center hover:text-[#2EC4B6] transition-all">
             <span className="font-bold text-lg leading-none">?</span>
          </button>
          <button className="w-12 h-12 rounded-full bg-white text-slate-400 shadow-[0_4px_15px_rgb(0,0,0,0.03)] flex items-center justify-center hover:text-[#2EC4B6] transition-all">
            <Flag className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center mt-2 pb-2 group relative cursor-help">
          <div className="flex flex-col items-center justify-center gap-1 text-[9px] text-slate-400 font-medium">
            <Shield className="w-3 h-3 text-[#2EC4B6]" />
            <span className="leading-tight">Data<br/>Secure</span>
          </div>
          {/* Tooltip */}
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Your data is secure & encrypted
            <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}
