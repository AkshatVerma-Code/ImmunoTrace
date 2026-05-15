import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Home, Search } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-[#EAF7F6] flex items-center justify-center">
            <Search className="w-12 h-12 text-[#2EC4B6]" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-6xl font-heading font-extrabold text-[#0F3D3E] mb-4 tracking-tighter">404</h1>
        <h2 className="text-3xl font-heading font-bold text-[#0F3D3E] mb-3 tracking-tight">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F3D3E] text-white rounded-xl font-medium shadow-lg shadow-[#0F3D3E]/20 hover:shadow-xl hover:shadow-[#0F3D3E]/30 transition-all"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </motion.button>
      </motion.div>
    </div>
  );
}
