export type ShiftType = 'manana_temprano' | 'manana' | 'intermedio_temprano' | 'intermedio_tarde' | 'tarde' | 'franco' | 'custom';

export interface ShiftPreset {
  id: ShiftType;
  label: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  color: string;
  description: string;
}

export const PRESET_SHIFTS: ShiftPreset[] = [
  {
    id: 'manana_temprano',
    label: 'Mañana temprano',
    startTime: '06:00',
    endTime: '14:00',
    color: '#3b82f6', // blue
    description: '06:00 a 14:00 hs'
  },
  {
    id: 'manana',
    label: 'Mañana',
    startTime: '07:00',
    endTime: '15:00',
    color: '#0284c7', // sky blue
    description: '07:00 a 15:00 hs'
  },
  {
    id: 'intermedio_temprano',
    label: 'Intermedio temprano',
    startTime: '08:00',
    endTime: '16:00',
    color: '#2563eb', // royal blue
    description: '08:00 a 16:00 hs'
  },
  {
    id: 'intermedio_tarde',
    label: 'Intermedio tarde',
    startTime: '10:00',
    endTime: '18:00',
    color: '#4f46e5', // indigo
    description: '10:00 a 18:00 hs'
  },
  {
    id: 'tarde',
    label: 'Tarde',
    startTime: '14:00',
    endTime: '22:00',
    color: '#7c3aed', // purple
    description: '14:00 a 22:00 hs'
  },
  {
    id: 'franco',
    label: 'Franco / Día Libre',
    startTime: '',
    endTime: '',
    color: '#10b981', // emerald
    description: 'Sin turno de trabajo'
  }
];

export interface LiveClassSchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface UserSettings {
  prepTimeMinutes: number;    // default 30
  commuteTimeMinutes: number; // default 15
  targetSleepHours: number;   // default 8
  sleepCurfew: string;        // default "23:30"
  liveClasses: LiveClassSchedule[]; // e.g. Martes (2) y Jueves (4) 19:00 - 22:00
  gymFrequencyPerWeek: number; // default 4
  gymDurationMinutes: number; // default 60
  destinationName: string;   // e.g. "Coto", "Oficina", etc.
}

export type BlockCategory = 'work' | 'prep' | 'commute' | 'gym' | 'study' | 'rest' | 'sleep';

export interface ScheduledBlock {
  id: string;
  title: string;
  category: BlockCategory;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  description?: string;
  completed?: boolean;
  isConflict?: boolean;
  conflictDetails?: string;
}

export interface DayShiftConfig {
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0..6
  dayName: string;
  shiftType: ShiftType;
  customStartTime?: string;
  customEndTime?: string;
}

export interface DaySchedule {
  dateStr: string;
  dayName: string;
  shiftConfig: DayShiftConfig;
  blocks: ScheduledBlock[];
}
