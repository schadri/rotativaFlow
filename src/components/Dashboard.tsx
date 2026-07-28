import React from 'react';
import { CheckSquare, Square, ExternalLink, Dumbbell, GraduationCap, Briefcase, Moon, Coffee, Car, ShieldAlert, Sparkles } from 'lucide-react';
import type { DaySchedule, UserSettings, BlockCategory } from '../types';
import { PrepAlertBanner } from './PrepAlertBanner';
import { getGoogleCalendarUrl } from '../utils/icsExporter';

interface DashboardProps {
  todaySchedule: DaySchedule;
  settings: UserSettings;
  onToggleBlockComplete: (blockId: string) => void;
  selectedDateStr: string;
  setSelectedDateStr: (dateStr: string) => void;
  allSchedules: DaySchedule[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  todaySchedule,
  settings,
  onToggleBlockComplete,
  selectedDateStr,
  setSelectedDateStr,
  allSchedules
}) => {
  const blocks = todaySchedule?.blocks || [];
  const completedCount = blocks.filter((b) => b.completed).length;
  const progressPercent = blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0;

  const getCategoryIcon = (category: BlockCategory) => {
    switch (category) {
      case 'work':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'prep':
        return <ShieldAlert className="w-4 h-4 text-slate-400" />;
      case 'commute':
        return <Car className="w-4 h-4 text-slate-400" />;
      case 'gym':
        return <Dumbbell className="w-4 h-4 text-emerald-400" />;
      case 'study':
        return <GraduationCap className="w-4 h-4 text-amber-400" />;
      case 'rest':
        return <Coffee className="w-4 h-4 text-purple-400" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getCategoryClass = (category: BlockCategory) => {
    switch (category) {
      case 'work':
        return 'category-work';
      case 'prep':
        return 'category-prep';
      case 'commute':
        return 'category-commute';
      case 'gym':
        return 'category-gym';
      case 'study':
        return 'category-study';
      case 'rest':
        return 'category-rest';
      case 'sleep':
        return 'category-sleep';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Real-time Prep & Leave Alert Banner */}
      <PrepAlertBanner todaySchedule={todaySchedule} settings={settings} />

      {/* 2. Header & Day Selector Bar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Time-Blocking Diario Optimizado</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Agenda de {todaySchedule.dayName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Turno actual: <strong className="text-indigo-300">{todaySchedule.shiftConfig.shiftType.replace('_', ' ').toUpperCase()}</strong>
          </p>
        </div>

        {/* Day selection tabs (Lunes - Domingo) */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {allSchedules.map((s) => {
            const isSelected = s.dateStr === selectedDateStr;
            return (
              <button
                key={s.dateStr}
                onClick={() => setSelectedDateStr(s.dateStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {s.dayName.slice(0, 3)}
              </button>
            );
          })}
        </div>

      </div>

      {/* 3. Progress Bar Component */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Progreso del Día</h3>
            <span className="text-xs text-slate-400 font-mono">
              ({completedCount} de {blocks.length} bloques)
            </span>
          </div>
          <span className="text-sm font-bold font-mono text-indigo-400">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 4. Blocks List (Time-Blocking Agenda) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
          Cronograma del Día ({blocks.length} Bloques)
        </h3>

        {blocks.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 border border-slate-800">
            No hay bloques programados para este día.
          </div>
        ) : (
          blocks.map((block) => {
            const googleCalUrl = getGoogleCalendarUrl(block, todaySchedule.dateStr);

            return (
              <div
                key={block.id}
                className={`rounded-2xl p-4 transition-all border border-slate-800/60 hover:border-slate-700/80 ${getCategoryClass(
                  block.category
                )} ${block.completed ? 'opacity-55 line-through grayscale-[30%]' : ''}`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  
                  {/* Left: Checkbox + Icon + Title */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleBlockComplete(block.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors focus:outline-none"
                      title={block.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                    >
                      {block.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1 rounded-md bg-slate-900/60 border border-slate-800">
                          {getCategoryIcon(block.category)}
                        </span>
                        <h4 className="font-bold text-white text-base">{block.title}</h4>
                        {block.isConflict && (
                          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            📹 Grabación (Reubicado)
                          </span>
                        )}
                      </div>

                      {block.description && (
                        <p className="text-xs text-slate-300 mt-1 pl-7">{block.description}</p>
                      )}

                      {block.conflictDetails && (
                        <p className="text-xs text-amber-400/90 mt-1 pl-7 font-medium">
                          ⚠️ {block.conflictDetails}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Time badge + Google Calendar button */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-indigo-300 font-bold shadow-inner">
                      {block.startTime} - {block.endTime}
                    </div>

                    <a
                      href={googleCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-900/80 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-800 transition-all text-xs flex items-center gap-1"
                      title="Agregar evento a Google Calendar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Google Cal</span>
                    </a>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
