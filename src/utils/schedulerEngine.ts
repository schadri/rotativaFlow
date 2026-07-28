import type { UserSettings, DayShiftConfig, DaySchedule, ScheduledBlock } from '../types';
import { PRESET_SHIFTS } from '../types';

export function hhmmToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToHHMM(totalMinutes: number): string {
  let mins = Math.floor(totalMinutes) % 1440;
  if (mins < 0) mins += 1440;
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function isOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return Math.max(start1, start2) < Math.min(end1, end2);
}

export function generateDailySchedule(
  config: DayShiftConfig,
  settings: UserSettings,
  completedBlockIds: Set<string>
): DaySchedule {
  const blocks: ScheduledBlock[] = [];
  const destination = settings.destinationName || 'Trabajo';

  let workStartMins: number | null = null;
  let workEndMins: number | null = null;
  let shiftLabel = 'Franco';

  // 1. Determine shift details
  if (config.shiftType !== 'franco') {
    if (config.shiftType === 'custom') {
      if (config.customStartTime && config.customEndTime) {
        workStartMins = hhmmToMinutes(config.customStartTime);
        workEndMins = hhmmToMinutes(config.customEndTime);
        shiftLabel = `Personalizado (${config.customStartTime} - ${config.customEndTime})`;
      }
    } else {
      const preset = PRESET_SHIFTS.find((s) => s.id === config.shiftType);
      if (preset) {
        workStartMins = hhmmToMinutes(preset.startTime);
        workEndMins = hhmmToMinutes(preset.endTime);
        shiftLabel = preset.label;
      }
    }
  }

  // Prep and Commute times
  const prep = settings.prepTimeMinutes || 30;
  const commute = settings.commuteTimeMinutes || 15;

  // Track busy slots for conflict-free study and gym placement
  const occupiedRanges: { start: number; end: number; name: string }[] = [];

  // 2. Pre-shift & Work blocks
  let startPrepMins: number | null = null;
  let leaveHouseMins: number | null = null;
  let returnHomeMins: number | null = null;
  let decompressEndMins: number | null = null;

  if (workStartMins !== null && workEndMins !== null) {
    leaveHouseMins = workStartMins - commute;
    startPrepMins = leaveHouseMins - prep;
    returnHomeMins = workEndMins + commute;
    decompressEndMins = returnHomeMins + 15;

    // Add Prep Block
    blocks.push({
      id: `${config.dateStr}-prep`,
      title: `Preparación para salir`,
      category: 'prep',
      startTime: minutesToHHMM(startPrepMins),
      endTime: minutesToHHMM(leaveHouseMins),
      description: `Cambiarse, preparar mochila y llaves para salir hacia ${destination} a las ${minutesToHHMM(leaveHouseMins)} hs.`
    });
    occupiedRanges.push({ start: startPrepMins, end: leaveHouseMins, name: 'Prep' });

    // Add Commute to Work Block
    blocks.push({
      id: `${config.dateStr}-commute-to`,
      title: `Traslado hacia ${destination}`,
      category: 'commute',
      startTime: minutesToHHMM(leaveHouseMins),
      endTime: minutesToHHMM(workStartMins),
      description: `Viaje estimado de ${commute} min.`
    });
    occupiedRanges.push({ start: leaveHouseMins, end: workStartMins, name: 'Traslado' });

    // Add Work Shift Block
    blocks.push({
      id: `${config.dateStr}-work`,
      title: `Jornada Laboral (${shiftLabel})`,
      category: 'work',
      startTime: minutesToHHMM(workStartMins),
      endTime: minutesToHHMM(workEndMins),
      description: `Turno de trabajo activo`
    });
    occupiedRanges.push({ start: workStartMins, end: workEndMins, name: 'Trabajo' });

    // Add Commute Return Block
    blocks.push({
      id: `${config.dateStr}-commute-from`,
      title: `Regreso a casa desde ${destination}`,
      category: 'commute',
      startTime: minutesToHHMM(workEndMins),
      endTime: minutesToHHMM(returnHomeMins),
      description: `Viaje de retorno de ${commute} min.`
    });
    occupiedRanges.push({ start: workEndMins, end: returnHomeMins, name: 'Regreso' });

    // Add Decompression Block
    blocks.push({
      id: `${config.dateStr}-decompress`,
      title: `Descompresión & Cambio de ropa`,
      category: 'rest',
      startTime: minutesToHHMM(returnHomeMins),
      endTime: minutesToHHMM(decompressEndMins),
      description: `Llegada a casa, ducha breve, hidratación.`
    });
    occupiedRanges.push({ start: returnHomeMins, end: decompressEndMins, name: 'Descompresión' });
  }

  // 3. Live Class Assignment & Recording Relocation
  const dayClasses = settings.liveClasses.filter((c) => c.dayOfWeek === config.dayOfWeek);

  for (const liveClass of dayClasses) {
    const classStartMins = hhmmToMinutes(liveClass.startTime);
    const classEndMins = hhmmToMinutes(liveClass.endTime);

    // Check if class overlaps with work or work prep/commute
    let hasConflict = false;
    let conflictReason = '';

    if (workStartMins !== null && workEndMins !== null && startPrepMins !== null && decompressEndMins !== null) {
      if (isOverlap(classStartMins, classEndMins, startPrepMins, decompressEndMins)) {
        hasConflict = true;
        conflictReason = `Solapamiento con turno laboral (${minutesToHHMM(workStartMins)} - ${minutesToHHMM(workEndMins)})`;
      }
    }

    if (!hasConflict) {
      // Free to attend live class!
      blocks.push({
        id: `${config.dateStr}-class-${liveClass.name}`,
        title: `🎓 Clase en Vivo: ${liveClass.name}`,
        category: 'study',
        startTime: liveClass.startTime,
        endTime: liveClass.endTime,
        description: `Cursada sincrónica EducaciónIT`
      });
      occupiedRanges.push({ start: classStartMins, end: classEndMins, name: liveClass.name });
    } else {
      // Overlap detected -> Schedule recording study block (60-90 min)
      const studyDuration = 75; // 75 min
      let candidateStart = 600; // default 10:00 AM

      if (workStartMins !== null && workStartMins >= 13 * 60) {
        // Afternoon shift (e.g. 14:00 - 22:00) -> Place study in the morning (e.g. 11:00)
        candidateStart = 11 * 60;
      } else if (decompressEndMins !== null) {
        // Morning or intermediate shift -> Place study in evening after decompression (e.g. 18:30 or 19:00)
        candidateStart = Math.max(decompressEndMins + 30, 18 * 60 + 30);
      }

      let candidateEnd = candidateStart + studyDuration;

      // Adjust if candidate overlaps existing range
      while (occupiedRanges.some((r) => isOverlap(candidateStart, candidateEnd, r.start, r.end)) && candidateStart < 1320) {
        candidateStart += 30;
        candidateEnd = candidateStart + studyDuration;
      }

      blocks.push({
        id: `${config.dateStr}-study-recording-${liveClass.name}`,
        title: `📹 Estudio de Grabación (${liveClass.name})`,
        category: 'study',
        startTime: minutesToHHMM(candidateStart),
        endTime: minutesToHHMM(candidateEnd),
        description: `Reemplazo de clase por solapamiento laboral. Ver grabación del módulo.`,
        isConflict: true,
        conflictDetails: conflictReason
      });
      occupiedRanges.push({ start: candidateStart, end: candidateEnd, name: `Estudio Rec` });
    }
  }

  // 4. Gym Assignment Logic
  const isGymDay = checkIsGymDay(config.dayOfWeek, settings.gymFrequencyPerWeek);

  if (isGymDay) {
    const gymDuration = settings.gymDurationMinutes || 60;
    let gymStart = 0;

    if (config.shiftType === 'tarde' || (workStartMins !== null && workStartMins >= 13 * 60)) {
      // Afternoon shift (14-22) -> Schedule Gym in the morning (e.g., 09:30)
      gymStart = 9 * 60 + 30;
    } else if (config.shiftType === 'franco' || workStartMins === null) {
      // Off day -> Schedule Gym at comfortable morning time (10:30)
      gymStart = 10 * 60 + 30;
    } else {
      // Morning / Intermediate shift -> Schedule Gym in afternoon/evening after work + decompression
      const baseAfterWork = decompressEndMins ? decompressEndMins + 15 : 17 * 60 + 30;
      gymStart = Math.max(baseAfterWork, 17 * 60 + 30);
    }

    let gymEnd = gymStart + gymDuration;

    // Check for overlap with occupied slots (e.g., classes/study)
    while (occupiedRanges.some((r) => isOverlap(gymStart, gymEnd, r.start, r.end)) && gymStart < 1320) {
      gymStart += 30;
      gymEnd = gymStart + gymDuration;
    }

    blocks.push({
      id: `${config.dateStr}-gym`,
      title: `🏋️ Entrenamiento Gimnasio`,
      category: 'gym',
      startTime: minutesToHHMM(gymStart),
      endTime: minutesToHHMM(gymEnd),
      description: `Rutina de fuerza / musculación (${gymDuration} min)`
    });
    occupiedRanges.push({ start: gymStart, end: gymEnd, name: 'Gimnasio' });
  }

  // 5. Dynamic Sleep Schedule
  const targetSleepHours = settings.targetSleepHours || 8;
  const sleepCurfewMins = hhmmToMinutes(settings.sleepCurfew || '23:30');

  let bedtimeMins = sleepCurfewMins;
  let wakeTimeMins = (sleepCurfewMins + targetSleepHours * 60) % 1440;

  if (startPrepMins !== null) {
    wakeTimeMins = startPrepMins - 15;
    bedtimeMins = wakeTimeMins - targetSleepHours * 60;
    if (bedtimeMins < 0) bedtimeMins += 1440;
  }

  blocks.push({
    id: `${config.dateStr}-sleep`,
    title: `🌙 Descanso & Sueño (${targetSleepHours}h)`,
    category: 'sleep',
    startTime: minutesToHHMM(bedtimeMins),
    endTime: minutesToHHMM(wakeTimeMins),
    description: `Hora límite para acostarse: ${minutesToHHMM(bedtimeMins)} hs.`
  });

  // 6. Sort all blocks by start time
  blocks.sort((a, b) => hhmmToMinutes(a.startTime) - hhmmToMinutes(b.startTime));

  // Mark completion status
  blocks.forEach((b) => {
    b.completed = completedBlockIds.has(b.id);
  });

  return {
    dateStr: config.dateStr,
    dayName: config.dayName,
    shiftConfig: config,
    blocks
  };
}

function checkIsGymDay(dayOfWeek: number, frequency: number): boolean {
  if (frequency <= 0) return false;
  if (frequency === 7) return true;

  if (frequency === 3) {
    return [1, 3, 5].includes(dayOfWeek);
  }
  if (frequency === 4) {
    return [1, 3, 5, 6].includes(dayOfWeek);
  }
  if (frequency === 5) {
    return [1, 2, 4, 5, 6].includes(dayOfWeek);
  }
  if (frequency === 6) {
    return dayOfWeek !== 0;
  }
  return [1, 3].includes(dayOfWeek);
}
