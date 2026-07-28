import { useState, useEffect, useMemo } from 'react';
import type { UserSettings, DayShiftConfig, DaySchedule } from './types';
import { generateDailySchedule } from './utils/schedulerEngine';
import { dbGetItem, dbSetItem } from './utils/dbStorage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { SettingsComponent } from './components/Settings';

const DEFAULT_SETTINGS: UserSettings = {
  prepTimeMinutes: 30,
  commuteTimeMinutes: 15,
  targetSleepHours: 8,
  sleepCurfew: '23:30',
  destinationName: 'Coto',
  gymFrequencyPerWeek: 4,
  gymDurationMinutes: 60,
  liveClasses: [
    { dayOfWeek: 2, name: 'EducaciónIT - Desarrollo Web', startTime: '19:00', endTime: '22:00' },
    { dayOfWeek: 4, name: 'EducaciónIT - Desarrollo Web', startTime: '19:00', endTime: '22:00' }
  ]
};

function getInitialDates(): { dateStr: string; dayName: string; dayOfWeek: number }[] {
  const dates: { dateStr: string; dayName: string; dayOfWeek: number }[] = [];
  const now = new Date();
  
  const currentDayOfWeek = now.getDay();
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() + distanceToMonday);

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dow = d.getDay();

    dates.push({
      dateStr,
      dayName: dayNames[i],
      dayOfWeek: dow
    });
  }

  return dates;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly' | 'settings'>('today');

  // Calculate week dates
  const weekDates = useMemo(() => getInitialDates(), []);

  // Today's default date string
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const match = weekDates.find((w) => w.dateStr === todayStr);
    return match ? match.dateStr : weekDates[0].dateStr;
  });

  // States
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('rotativa_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [weeklyConfigs, setWeeklyConfigs] = useState<DayShiftConfig[]>(() => {
    const saved = localStorage.getItem('rotativa_shifts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    return weekDates.map((w, index) => {
      let shiftType: any = 'manana';
      if (index === 0) shiftType = 'manana_temprano';
      if (index === 1) shiftType = 'tarde';
      if (index === 2) shiftType = 'manana';
      if (index === 3) shiftType = 'intermedio_temprano';
      if (index === 4) shiftType = 'intermedio_tarde';
      if (index >= 5) shiftType = 'franco';

      return {
        dateStr: w.dateStr,
        dayOfWeek: w.dayOfWeek,
        dayName: w.dayName,
        shiftType
      };
    });
  });

  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('rotativa_completed');
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
    return new Set<string>();
  });

  // Asynchronously hydrate state from IndexedDB on startup
  useEffect(() => {
    async function hydrateFromIndexedDB() {
      const dbSettings = await dbGetItem<UserSettings>('rotativa_settings');
      if (dbSettings) {
        setSettings(dbSettings);
      }

      const dbShifts = await dbGetItem<DayShiftConfig[]>('rotativa_shifts');
      if (dbShifts) {
        setWeeklyConfigs(dbShifts);
      }

      const dbCompleted = await dbGetItem<string[]>('rotativa_completed');
      if (dbCompleted) {
        setCompletedBlocks(new Set(dbCompleted));
      }
    }

    hydrateFromIndexedDB();
  }, []);

  // Dual-layer Save to LocalStorage AND IndexedDB
  useEffect(() => {
    localStorage.setItem('rotativa_settings', JSON.stringify(settings));
    dbSetItem('rotativa_settings', settings);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('rotativa_shifts', JSON.stringify(weeklyConfigs));
    dbSetItem('rotativa_shifts', weeklyConfigs);
  }, [weeklyConfigs]);

  useEffect(() => {
    const arr = Array.from(completedBlocks);
    localStorage.setItem('rotativa_completed', JSON.stringify(arr));
    dbSetItem('rotativa_completed', arr);
  }, [completedBlocks]);

  // Update shift config for a specific day
  const handleUpdateShiftConfig = (dayOfWeek: number, newConfig: Partial<DayShiftConfig>) => {
    setWeeklyConfigs((prev) =>
      prev.map((c) => (c.dayOfWeek === dayOfWeek ? { ...c, ...newConfig } : c))
    );
  };

  // Toggle completion of a time block
  const handleToggleBlockComplete = (blockId: string) => {
    setCompletedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  // Calculate full week schedules dynamically
  const weeklySchedules: DaySchedule[] = useMemo(() => {
    return weeklyConfigs.map((config) => generateDailySchedule(config, settings, completedBlocks));
  }, [weeklyConfigs, settings, completedBlocks]);

  // Selected schedule
  const selectedSchedule = useMemo(() => {
    return (
      weeklySchedules.find((s) => s.dateStr === selectedDateStr) ||
      weeklySchedules[0]
    );
  }, [weeklySchedules, selectedDateStr]);

  // Next prep time for navbar alert
  const prepBlock = selectedSchedule?.blocks.find((b) => b.category === 'prep');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        nextPrepTimeStr={prepBlock?.startTime}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'today' && (
          <Dashboard
            todaySchedule={selectedSchedule}
            settings={settings}
            onToggleBlockComplete={handleToggleBlockComplete}
            selectedDateStr={selectedDateStr}
            setSelectedDateStr={setSelectedDateStr}
            allSchedules={weeklySchedules}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyPlanner
            weeklyConfigs={weeklyConfigs}
            onUpdateShiftConfig={handleUpdateShiftConfig}
            weeklySchedules={weeklySchedules}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsComponent
            settings={settings}
            onSaveSettings={(newSettings) => setSettings(newSettings)}
            onResetDefaults={() => {
              setSettings(DEFAULT_SETTINGS);
              localStorage.removeItem('rotativa_settings');
            }}
          />
        )}
      </main>

      <footer className="glass-panel border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 mt-12">
        <p>
          RotativaFlow © {new Date().getFullYear()} — Sincronización Inteligente & Almacenamiento Offline Persistente (IndexedDB)
        </p>
      </footer>
    </div>
  );
}

export default App;
