import { motion } from 'motion/react';
import { Upload, CalendarPlus, Pill, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { UploadPrescriptionModal } from './UploadPrescriptionModal';
import { AddAppointmentModal } from './AddAppointmentModal';
import { AddMedicineModal } from './AddMedicineModal';

export function QuickActions() {
  const navigate = useNavigate();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isMedicineOpen, setIsMedicineOpen] = useState(false);

  const actions = [
    {
      icon: Upload,
      label: 'Upload Prescription',
      desc: 'Scan & parse documents',
      color: 'bg-[#F7F9F9] text-[#0F3D3E] border-transparent hover:border-[#2EC4B6]/30',
      action: () => setIsUploadOpen(true)
    },
    {
      icon: CalendarPlus,
      label: 'Add Appointment',
      desc: 'Schedule doctor visit',
      color: 'bg-[#F7F9F9] text-[#0F3D3E] border-transparent hover:border-[#2EC4B6]/30',
      action: () => setIsAppointmentOpen(true)
    },
    {
      icon: Pill,
      label: 'Add Medicine',
      desc: 'Track prescription',
      color: 'bg-[#F7F9F9] text-[#0F3D3E] border-transparent hover:border-[#2EC4B6]/30',
      action: () => setIsMedicineOpen(true)
    },
    {
      icon: Sparkles,
      label: 'Ask HealthWise',
      desc: 'Query health history',
      color: 'bg-amber-500 text-white border-transparent hover:bg-amber-600 shadow-[0_4px_14px_rgba(245,158,11,0.3)]',
      action: () => navigate('/query')
    }
  ];

  return (
    <>
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 mb-8">
        <h3 className="text-base font-semibold text-[#0F3D3E] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((btn, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={btn.action}
              className={`flex items-start gap-4 p-4 rounded-[14px] border transition-all text-left ${btn.color}`}
            >
              <div className={`mt-0.5 ${btn.label === 'Ask HealthWise' ? 'text-[#2EC4B6]' : 'text-[#0F3D3E]'}`}>
                <btn.icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-sm font-semibold mb-1 ${btn.label === 'Ask HealthWise' ? 'text-white' : 'text-[#0F3D3E]'}`}>
                  {btn.label}
                </div>
                <div className={`text-xs ${btn.label === 'Ask HealthWise' ? 'text-[#2EC4B6]' : 'text-slate-500'}`}>
                  {btn.desc}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      <UploadPrescriptionModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
      <AddAppointmentModal isOpen={isAppointmentOpen} onClose={() => setIsAppointmentOpen(false)} />
      <AddMedicineModal isOpen={isMedicineOpen} onClose={() => setIsMedicineOpen(false)} />
    </>
  );
}