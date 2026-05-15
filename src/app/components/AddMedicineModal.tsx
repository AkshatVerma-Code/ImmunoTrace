import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pill, Clock, Calendar, CheckCircle2, Activity, Plus, Trash2 } from 'lucide-react';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (payload: MedicineReminderFormData) => Promise<void> | void;
}

const WHEN_TO_TAKE_OPTIONS = [
  "Before Food", "After Food", "With Food", "Empty Stomach", "As Needed"
];

export type MedicineReminderFormData = {
  medicineName: string;
  whenToTake: string;
  times: string[];
  startDate: string;
  endDate: string;
};

export function AddMedicineModal({ isOpen, onClose, onSave }: AddMedicineModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState<MedicineReminderFormData>({
    medicineName: '',
    whenToTake: '',
    times: [''],
    startDate: '',
    endDate: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setFormData({ medicineName: '', whenToTake: '', times: [''], startDate: '', endDate: '' });
      setSaving(false);
      setError('');
    }
  }, [isOpen]);

  const updateTimeAtIndex = (index: number, value: string) => {
    setFormData((prev) => {
      const next = [...prev.times];
      next[index] = value;
      return { ...prev, times: next };
    });
  };

  const addTimeSlot = () => {
    setFormData((prev) => ({ ...prev, times: [...prev.times, ''] }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData((prev) => {
      const next = prev.times.filter((_, i) => i !== index);
      return { ...prev, times: next.length > 0 ? next : [''] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const normalizedTimes = Array.from(
      new Set(
        formData.times
          .map((time) => time.trim())
          .filter(Boolean)
      )
    );

    if (normalizedTimes.length === 0) {
      setError('Add at least one medicine reminder time.');
      setSaving(false);
      return;
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setError('End date must be on or after start date.');
      setSaving(false);
      return;
    }

    try {
      await onSave?.({
        medicineName: formData.medicineName.trim(),
        whenToTake: formData.whenToTake,
        times: normalizedTimes,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      setStep('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Unable to save medicine reminder right now.');
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
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#FFFBEB]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-amber-100 flex items-center justify-center text-amber-500">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F3D3E]">Add Medicine</h2>
                <p className="text-xs text-slate-500">Track a new prescription</p>
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
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-amber-500" /> Medicine Name
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.medicineName}
                    onChange={e => setFormData({...formData, medicineName: e.target.value})}
                    placeholder="e.g. Amoxicillin 500mg"
                    className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" /> When to take
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WHEN_TO_TAKE_OPTIONS.map(opt => {
                      const isSelected = formData.whenToTake === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormData({...formData, whenToTake: opt})}
                          className={`px-4 py-2 rounded-[14px] text-sm font-medium transition-all duration-300 border ${
                            isSelected 
                              ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300/50 hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-800 mb-2 flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" /> Reminder Times
                    </span>
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add time
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.times.map((time, index) => (
                      <div key={`time-${index}`} className="flex items-center gap-2">
                        <input
                          required
                          type="time"
                          value={time}
                          onChange={(e) => updateTimeAtIndex(index, e.target.value)}
                          className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                        />
                        {formData.times.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index)}
                            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Remove time"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" /> Start Date
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" /> End Date
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.endDate}
                      min={formData.startDate || undefined}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
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
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-[16px] font-semibold shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
                  >
                    {saving ? 'Saving...' : 'Save Medicine Reminder'}
                  </button>
                </div>
              </form>
            )}

            {step === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-[#0F3D3E] mb-2">Medicine Added!</h3>
                <p className="text-sm text-slate-500">Your medication {formData.medicineName || ''} is now tracked.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
