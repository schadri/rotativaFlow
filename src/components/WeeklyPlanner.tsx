import React, { useState } from 'react';
import { Download, Sparkles, Dumbbell, GraduationCap, Briefcase, CheckCircle2, ChevronRight } from 'lucide-react';
import type { DaySchedule, DayShiftConfig, ShiftType } from '../types';
import { PRESET_SHIFTS } from '../types';
import { downloadIcsFile } from '../utils/icsExporter';

interface WeeklyPlannerProps {
  weeklyConfigs: DayShiftConfig[];
  onUpdateShiftConfig: (dayOfWeek: number, newConfig: Partial<DayShiftConfig>) => void;
  weeklySchedules: DaySchedule[];
}

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  weeklyConfigs,
  onUpdateShiftConfig,
  weeklySchedules
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportIcs = () => {
    downloadIcsFile(weeklySchedules, 'Agenda_Semanal_Rotativa.ics');
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Export Actions */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Matriz Semanal de Horarios</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">Planificador de Turnos Laborales</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Seleccioná tu turno para cada día de la semana. El motor optimizará automáticamente los bloques de traslado, gimnasio, clases en vivo y estudio de grabación.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportIcs}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{downloadSuccess ? '¡Archivo .ICS Descargado!' : 'Exportar a Calendario (.ICS)'}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            El archivo <strong>Agenda_Semanal_Rotativa.ics</strong> se ha generado exitosamente. Importalo en Google Calendar o Apple Calendar.
          </span>
        </div>
      )}

      {/* Days Grid (Monday - Sunday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weeklyConfigs.map((config) => {
          const schedule = weeklySchedules.find((s) => s.shiftConfig.dayOfWeek === config.dayOfWeek);
          const workBlock = schedule?.blocks.find((b) => b.category === 'work');
          const gymBlock = schedule?.blocks.find((b) => b.category === 'gym');
          const studyBlock = schedule?.blocks.find((b) => b.category === 'study');

          return (
            <div
              key={config.dayOfWeek}
              className="glass-panel rounded-2xl p-4 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <h3 className="font-extrabold text-white text-base font-[Outfit]">
                      {config.dayName}
                    </h3>
                    <span className="text-[11px] text-slate-400">{config.dateStr}</span>
                  </div>

                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                    Día {config.dayOfWeek === 0 ? 7 : config.dayOfWeek}
                  </span>
                </div>

                {/* Shift Selector */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Turno Laboral:
                  </label>

                  <select
                    value={config.shiftType}
                    onChange={(e) =>
                      onUpdateShiftConfig(config.dayOfWeek, { shiftType: e.target.value as ShiftType })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    {PRESET_SHIFTS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label} {preset.startTime ? `(${preset.startTime}-${preset.endTime})` : ''}
                      </option>
                    ))}
                    <option value="custom">⚙️ Horario Personalizado</option>
                  </select>

                  {/* Custom shift inputs */}
                  {config.shiftType === 'custom' && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="time"
                        value={config.customStartTime || '08:00'}
                        onChange={(e) =>
                          onUpdateShiftConfig(config.dayOfWeek, { customStartTime: e.target.value })
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                      <span className="text-xs text-slate-400">a</span>
                      <input
                        type="time"
                        value={config.customEndTime || '16:00'}
                        onChange={(e) =>
                          onUpdateShiftConfig(config.dayOfWeek, { customEndTime: e.target.value })
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Day Summary Badges */}
                <div className="space-y-2 text-xs">
                  {/* Work shift summary */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-slate-300 font-medium">Trabajo</span>
                    </div>
                    <span className="font-mono text-[11px] text-blue-400 font-bold">
                      {workBlock ? `${workBlock.startTime} - ${workBlock.endTime}` : 'Franco'}
                    </span>
                  </div>

                  {/* Gym summary */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-300 font-medium">Gimnasio</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-400 font-bold">
                      {gymBlock ? `${gymBlock.startTime} - ${gymBlock.endTime}` : 'Descanso'}
                    </span>
                  </div>

                  {/* Study summary */}
                  {studyBlock && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-300 font-medium">Estudio</span>
                      </div>
                      <span className="font-mono text-[11px] text-amber-400 font-bold">
                        {studyBlock.startTime} - {studyBlock.endTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer details count */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{schedule?.blocks.length || 0} bloques calculados</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
