import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Building, CheckCircle2 } from 'lucide-react';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (payload: AppointmentFormData) => Promise<void> | void;
}

export type AppointmentFormData = {
  doctorName: string;
  date: string;
  time: string;
  hospitalName: string;
};

export function AddAppointmentModal({ isOpen, onClose, onSave }: AddAppointmentModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState<AppointmentFormData>({
    doctorName: '',
    date: '',
    time: '',
    hospitalName: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setFormData({ doctorName: '', date: '', time: '', hospitalName: '' });
      setSaving(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave?.(formData);
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Unable to save appointment right now.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#0F3D3E]/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#EAF7F6]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-[#2EC4B6]/10 flex items-center justify-center text-[#2EC4B6]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F3D3E]">Add Appointment</h2>
                <p className="text-xs text-slate-500">Schedule a new visit</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto scrollbar-hide">
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#2EC4B6]" /> Doctor Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.doctorName}
                    onChange={e => setFormData({...formData, doctorName: e.target.value})}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#2EC4B6]" /> Hospital / Clinic Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.hospitalName}
                    onChange={e => setFormData({...formData, hospitalName: e.target.value})}
                    placeholder="e.g. City General Hospital"
                    className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#2EC4B6]" /> Date
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#2EC4B6]" /> Time
                    </label>
                    <input
                      required
                      type="time"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                      className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 transition-all"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3.5 bg-[#2EC4B6] hover:bg-[#20A498] text-white rounded-[16px] font-semibold shadow-lg shadow-[#2EC4B6]/20 transition-all active:scale-[0.98]"
                  >
                    {saving ? 'Saving...' : 'Save Appointment'}
                  </button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-[#EAF7F6] rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-[#2EC4B6]" />
                </div>
                <h3 className="text-xl font-bold text-[#0F3D3E] mb-2">Appointment Saved!</h3>
                <p className="text-sm text-slate-500">Your upcoming visit with {formData.doctorName || 'the doctor'} has been scheduled.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
