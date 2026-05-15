export interface HealthEvent {
  id: string;
  date: string;
  condition: string;
  severity: 'low' | 'medium' | 'high';
  bodyPart: string;
  category: string;
  patternHint?: string;
}

export interface BodyPartData {
  id: string;
  name: string;
  displayName: string;
  frequency: number; // 0-10 scale
  issues: HealthEvent[];
  triggers: string[];
  remedies: string[];
}

export interface Symptom {
  id: string;
  date: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  bodyPart: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
}

export interface DoctorNote {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  notes: string;
  diagnosis?: string;
}

export const healthEvents: HealthEvent[] = [
  { id: '1', date: '2026-03-15', condition: 'Throat Infection', severity: 'medium', bodyPart: 'throat', category: 'Infection', patternHint: 'Recurring in winter' },
  { id: '2', date: '2026-02-20', condition: 'Throat Infection', severity: 'high', bodyPart: 'throat', category: 'Infection' },
  { id: '3', date: '2026-01-10', condition: 'Sore Throat', severity: 'low', bodyPart: 'throat', category: 'Inflammation' },
  { id: '4', date: '2025-12-05', condition: 'Throat Infection', severity: 'medium', bodyPart: 'throat', category: 'Infection', patternHint: 'Recurring in winter' },
  { id: '5', date: '2026-03-01', condition: 'Lower Back Pain', severity: 'medium', bodyPart: 'back', category: 'Musculoskeletal' },
  { id: '6', date: '2026-02-10', condition: 'Back Strain', severity: 'high', bodyPart: 'back', category: 'Injury' },
  { id: '7', date: '2026-01-25', condition: 'Tension Headache', severity: 'low', bodyPart: 'head', category: 'Neurological' },
  { id: '8', date: '2025-11-15', condition: 'Knee Pain', severity: 'medium', bodyPart: 'knee', category: 'Joint' },
];

export const bodyParts: Record<string, BodyPartData> = {
  throat: {
    id: 'throat',
    name: 'throat',
    displayName: 'Throat',
    frequency: 8,
    issues: healthEvents.filter(e => e.bodyPart === 'throat'),
    triggers: ['Cold weather', 'Dry air', 'Stress', 'Lack of sleep'],
    remedies: ['Warm water with honey', 'Antibiotics (prescribed)', 'Rest', 'Throat lozenges']
  },
  back: {
    id: 'back',
    name: 'back',
    displayName: 'Lower Back',
    frequency: 6,
    issues: healthEvents.filter(e => e.bodyPart === 'back'),
    triggers: ['Prolonged sitting', 'Poor posture', 'Heavy lifting'],
    remedies: ['Physical therapy', 'Anti-inflammatory medication', 'Stretching exercises', 'Ergonomic chair']
  },
  head: {
    id: 'head',
    name: 'head',
    displayName: 'Head',
    frequency: 3,
    issues: healthEvents.filter(e => e.bodyPart === 'head'),
    triggers: ['Screen time', 'Stress', 'Dehydration'],
    remedies: ['Rest', 'Hydration', 'Pain relievers', 'Dark room']
  },
  knee: {
    id: 'knee',
    name: 'knee',
    displayName: 'Knee',
    frequency: 4,
    issues: healthEvents.filter(e => e.bodyPart === 'knee'),
    triggers: ['Running', 'Cold weather', 'Overexertion'],
    remedies: ['Ice pack', 'Compression bandage', 'Rest', 'Anti-inflammatory gel']
  },
  chest: {
    id: 'chest',
    name: 'chest',
    displayName: 'Chest',
    frequency: 1,
    issues: [],
    triggers: [],
    remedies: []
  },
  stomach: {
    id: 'stomach',
    name: 'stomach',
    displayName: 'Stomach',
    frequency: 2,
    issues: [],
    triggers: [],
    remedies: []
  }
};

export const recentSymptoms: Symptom[] = [
  { id: '1', date: '2026-03-25', description: 'Mild sore throat, difficulty swallowing', severity: 'mild', bodyPart: 'throat' },
  { id: '2', date: '2026-03-20', description: 'Sharp lower back pain when bending', severity: 'moderate', bodyPart: 'back' },
  { id: '3', date: '2026-03-18', description: 'Dull headache behind eyes', severity: 'mild', bodyPart: 'head' },
];

export const currentMedications: Medication[] = [
  { id: '1', name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', startDate: '2026-03-01' },
  { id: '2', name: 'Vitamin D3', dosage: '2000 IU', frequency: 'Daily', startDate: '2026-01-15' },
  { id: '3', name: 'Throat lozenges', dosage: '1 lozenge', frequency: 'Every 3-4 hours', startDate: '2026-03-15', endDate: '2026-03-28' },
];

export const doctorNotes: DoctorNote[] = [
  { 
    id: '1', 
    date: '2026-02-22', 
    doctor: 'Dr. Sarah Chen', 
    specialty: 'ENT Specialist',
    notes: 'Recurring throat infections. Advised to monitor for pattern. Consider allergy testing if continues.',
    diagnosis: 'Pharyngitis'
  },
  { 
    id: '2', 
    date: '2026-02-12', 
    doctor: 'Dr. Michael Torres', 
    specialty: 'Orthopedic',
    notes: 'Lower back strain due to poor ergonomics. Recommended physical therapy and posture correction.',
    diagnosis: 'Lumbar strain'
  },
];

export const aiInsights = [
  {
    id: '1',
    type: 'pattern',
    title: 'Pattern Detected',
    description: 'Throat infections recurring every 4-6 weeks',
    detail: "You've experienced 4 throat-related issues in the past 4 months. This pattern suggests a possible underlying cause.",
    confidence: 'high',
    actionable: true,
    suggestion: 'Consider booking an appointment with an ENT specialist for comprehensive evaluation.'
  },
  {
    id: '2',
    type: 'preventive',
    title: 'Suggested Preventive Action',
    description: 'Back pain correlation with work hours',
    detail: 'Based on your last 3 cases, back pain episodes occur after 4+ consecutive days of desk work.',
    confidence: 'medium',
    actionable: true,
    suggestion: 'Set hourly reminders to stretch. Consider ergonomic assessment of workspace.'
  },
  {
    id: '3',
    type: 'trend',
    title: 'Positive Health Trend',
    description: 'Headache frequency decreased by 60%',
    detail: 'Compared to last quarter, your headache incidents have significantly reduced since increasing water intake.',
    confidence: 'high',
    actionable: false,
    suggestion: 'Continue current hydration habits.'
  }
];