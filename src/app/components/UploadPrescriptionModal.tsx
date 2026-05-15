import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  Stethoscope,
  Pill,
  Calendar,
  Activity,
  FileCheck,
  Loader2,
  Plus,
} from "lucide-react";

const SYMPTOMS = [
  "Fever",
  "Cough",
  "Headache",
  "Nausea",
  "Fatigue",
  "Body Ache",
  "Sore Throat",
  "Dizziness",
  "Shortness of breath",
];

type Medicine = {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
};

interface UploadPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseDurationToDays(duration?: string): number | null {
  if (!duration) return null;
  const text = duration.toLowerCase();
  const match = text.match(/(\d+)\s*(day|days|week|weeks|month|months)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (Number.isNaN(value) || value <= 0) return null;
  const unit = match[2];
  if (unit.startsWith("week")) return value * 7;
  if (unit.startsWith("month")) return value * 30;
  return value;
}

function addDays(yyyyMmDd: string, days: number): string {
  const base = new Date(`${yyyyMmDd}T00:00:00`);
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function UploadPrescriptionModal({ isOpen, onClose, onSaved }: UploadPrescriptionModalProps) {
  const [step, setStep] = useState<"upload" | "details" | "processing" | "result">("upload");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [advice, setAdvice] = useState("");
  const [processingText, setProcessingText] = useState("Initializing...");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [treatmentStartDate, setTreatmentStartDate] = useState("");
  const [treatmentEndDate, setTreatmentEndDate] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setStep("upload");
    setSelectedSymptoms([]);
    setAdvice("");
    setProcessingText("Initializing...");
    setError("");
    setSaving(false);
    setFile(null);
    setImageBase64("");
    setDoctorName("");
    setDiagnosis("");
    setPrescriptionDate("");
    setTreatmentStartDate("");
    setTreatmentEndDate("");
    setAiSummary("");
    setMedicines([]);
  }, [isOpen]);

  const cleanedMedicines = useMemo(
    () =>
      medicines
        .map((med) => ({
          name: (med.name || "").trim(),
          dosage: (med.dosage || "").trim(),
          frequency: (med.frequency || "").trim(),
          duration: (med.duration || "").trim(),
        }))
        .filter((med) => med.name.length > 0),
    [medicines]
  );

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));
  };

  const onFileSelected = async (selectedFile?: File) => {
    if (!selectedFile) return;
    setError("");
    setFile(selectedFile);
    try {
      const base64 = await fileToBase64(selectedFile);
      setImageBase64(base64);
      setStep("details");
    } catch {
      setError("Failed to read file. Please try another file.");
    }
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    setMedicines((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleAnalyze = async () => {
    if (!imageBase64) return;

    setError("");
    setStep("processing");
    setProcessingText("Scanning document OCR...");

    try {
      const response = await fetch("/api/prescriptions/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          symptoms: selectedSymptoms,
          doctorAdvice: advice,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Extraction failed.");

      setProcessingText("Extracting medicines and clinical details...");
      const extracted = data.extracted || {};
      const extractedMedicines =
        Array.isArray(extracted.medicines) && extracted.medicines.length > 0 ? extracted.medicines : [{ name: "" }];
      const extractedPrescriptionDate = extracted.prescription_date || "";
      const extractedTreatmentStart = extractedPrescriptionDate;

      let extractedTreatmentEnd = "";
      if (extractedTreatmentStart) {
        const maxDurationDays = extractedMedicines.reduce((max: number, med: Medicine) => {
          const days = parseDurationToDays(med.duration);
          return days && days > max ? days : max;
        }, 0);
        if (maxDurationDays > 0) {
          extractedTreatmentEnd = addDays(extractedTreatmentStart, maxDurationDays);
        }
      }

      setDoctorName(extracted.doctor_name || "");
      setDiagnosis(extracted.diagnosis || "");
      setPrescriptionDate(extractedPrescriptionDate);
      setTreatmentStartDate(extractedTreatmentStart);
      setTreatmentEndDate(extractedTreatmentEnd);
      setMedicines(extractedMedicines);
      setAiSummary(String(extracted.ai_summary || ""));
      setStep("result");
    } catch (e: any) {
      setError(e?.message || "Failed to extract prescription details.");
      setStep("details");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_name: file?.name || null,
          doctor_name: doctorName || null,
          doctor_advice: advice || null,
          diagnosis: diagnosis || null,
          prescription_date: prescriptionDate || null,
          treatment_start_date: treatmentStartDate || null,
          treatment_end_date: treatmentEndDate || null,
          medicines_json: cleanedMedicines,
          ai_summary: aiSummary || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save prescription.");

      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save prescription.");
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
          className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#EAF7F6]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-[#2EC4B6]/10 flex items-center justify-center text-[#2EC4B6]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F3D3E]">Upload Prescription</h2>
                <p className="text-xs text-slate-500">Scan physical documents to digital records</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
            {error ? (
              <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {step === "upload" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#2EC4B6]" /> Upload Prescription
                </h3>
                <label className="w-full border-2 border-dashed border-[#2EC4B6]/30 hover:border-[#2EC4B6] bg-[#EAF7F6]/30 hover:bg-[#EAF7F6] rounded-[24px] p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <UploadCloud className="w-8 h-8 text-[#2EC4B6]" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-[#0F3D3E]">Click to upload a prescription image</p>
                    <p className="text-sm text-slate-500 mt-2">Supports JPG, PNG, WEBP (Max 10MB)</p>
                  </div>
                  <input className="hidden" type="file" accept="image/*" onChange={(e) => onFileSelected(e.target.files?.[0])} />
                </label>
              </div>
            ) : null}

            {step === "details" ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {file ? (
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-[16px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-[#2EC4B6]" />
                  </div>
                ) : null}

                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#2EC4B6]" /> What are your current symptoms?
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOMS.map((symptom) => {
                      const isSelected = selectedSymptoms.includes(symptom);
                      return (
                        <button
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          type="button"
                          className={`px-4 py-2 rounded-[14px] text-sm font-medium transition-all duration-300 border ${
                            isSelected
                              ? "bg-[#2EC4B6]/10 border-[#2EC4B6] text-[#0F3D3E] shadow-sm"
                              : "bg-white border-slate-200 text-slate-600 hover:border-[#2EC4B6]/50 hover:bg-slate-50"
                          }`}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-[#2EC4B6]" /> Doctor&apos;s Advice / Notes
                  </h3>
                  <textarea
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                    placeholder="E.g., doctor advised fluids and 3 days rest..."
                    className="w-full h-24 px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!imageBase64}
                  className="w-full py-4 bg-[#2EC4B6] hover:bg-[#20A498] text-white rounded-[16px] font-semibold shadow-lg shadow-[#2EC4B6]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Sparkles className="w-5 h-5" /> Analyze Prescription
                </button>
              </div>
            ) : null}

            {step === "processing" ? (
              <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="relative mb-8">
                  <div className="absolute inset-0 border-4 border-[#2EC4B6]/20 rounded-full w-24 h-24 animate-ping" />
                  <div className="w-24 h-24 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center relative z-10">
                    <Loader2 className="w-10 h-10 text-[#2EC4B6] animate-spin" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#0F3D3E] mb-2">Analyzing Prescription</h3>
                <p className="text-slate-500 font-medium animate-pulse">{processingText}</p>
              </div>
            ) : null}

            {step === "result" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-[#0A2C2D] rounded-[24px] p-6 text-white relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#2EC4B6]/20 rounded-full blur-[40px] pointer-events-none" />
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <Sparkles className="w-5 h-5 text-[#2EC4B6]" />
                    <h3 className="font-semibold text-white">AI Prescription Summary</h3>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <textarea
                      value={aiSummary}
                      onChange={(e) => setAiSummary(e.target.value)}
                      placeholder="AI summary will be generated here..."
                      className="w-full min-h-[120px] px-4 py-3 rounded-[14px] border border-white/20 bg-white/5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[#2EC4B6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-[20px]">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Stethoscope className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Doctor Name</span>
                    </div>
                    <input
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800"
                    />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-[20px]">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Prescription Date</span>
                    </div>
                    <input
                      type="date"
                      value={prescriptionDate}
                      onChange={(e) => setPrescriptionDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-[20px]">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Treatment Start Date</span>
                    </div>
                    <input
                      type="date"
                      value={treatmentStartDate}
                      onChange={(e) => setTreatmentStartDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800"
                    />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-[20px]">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Treatment End Date</span>
                    </div>
                    <input
                      type="date"
                      value={treatmentEndDate}
                      onChange={(e) => setTreatmentEndDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2EC4B6]" /> Diagnosis
                  </h3>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full min-h-[90px] px-4 py-3 rounded-[14px] border border-slate-200 text-sm focus:outline-none focus:border-[#2EC4B6]"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-[#2EC4B6]" /> Extracted Medications
                  </h3>
                  <div className="hidden md:grid grid-cols-4 gap-2 px-1 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span>Medicine Name</span>
                    <span>Dosage</span>
                    <span>When to take</span>
                    <span>Duration</span>
                  </div>
                  <div className="space-y-3">
                    {medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-[20px] border border-slate-200 bg-white grid grid-cols-1 md:grid-cols-4 gap-2"
                      >
                        <input
                          placeholder="Medicine name"
                          value={med.name || ""}
                          onChange={(e) => updateMedicine(idx, "name", e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                        <input
                          placeholder="Dosage"
                          value={med.dosage || ""}
                          onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                        <input
                          placeholder="When to take"
                          value={med.frequency || ""}
                          onChange={(e) => updateMedicine(idx, "frequency", e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                        <input
                          placeholder="Duration"
                          value={med.duration || ""}
                          onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMedicines((prev) => [...prev, { name: "" }])}
                    className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700"
                  >
                    <Plus className="w-4 h-4" /> Add medicine
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {step === "result" ? (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-[14px] text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-[14px] text-sm font-medium bg-[#2EC4B6] hover:bg-[#20A498] text-white shadow-lg shadow-[#2EC4B6]/20 transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                {saving ? "Saving..." : "Save to Records"}
              </button>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
