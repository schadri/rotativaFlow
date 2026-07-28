import React, { useState } from 'react';
import { Save, RotateCcw, Car, Moon, GraduationCap, Dumbbell, MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { UserSettings } from '../types';

interface SettingsProps {
  settings: UserSettings;
  onSaveSettings: (newSettings: UserSettings) => void;
  onResetDefaults: () => void;
}

export const SettingsComponent: React.FC<SettingsProps> = ({ settings, onSaveSettings, onResetDefaults }) => {
  const [form, setForm] = useState<UserSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [newClassName, setNewClassName] = useState('');
  const [newClassDay, setNewClassDay] = useState(2); // Martes
  const [newClassStart, setNewClassStart] = useState('19:00');
  const [newClassEnd, setNewClassEnd] = useState('22:00');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddClass = () => {
    if (!newClassName) return;
    const updatedClasses = [
      ...form.liveClasses,
      {
        dayOfWeek: newClassDay,
        name: newClassName,
        startTime: newClassStart,
        endTime: newClassEnd
      }
    ];
    setForm({ ...form, liveClasses: updatedClasses });
    setNewClassName('');
  };

  const handleRemoveClass = (index: number) => {
    const updated = form.liveClasses.filter((_, i) => i !== index);
    setForm({ ...form, liveClasses: updated });
  };

  const getDayName = (dayNum: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNum] || 'Día';
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Configuración del Perfil & Algoritmo</h2>
          <p className="text-xs text-slate-400 mt-1">
            Personalizá tus hábitos, tiempos de traslado y compromisos fijos para calibrar el motor de optimización.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetDefaults}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>¡Parámetros guardados y cronograma actualizado exitosamente!</span>
        </div>
      )}

      {/* Grid of settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Desplazamiento & Preparación */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 border-b border-slate-800 pb-3">
            <Car className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Traslado & Preparación</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-slate-300 block mb-1">
                Lugar / Empresa de destino:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.destinationName}
                  onChange={(e) => setForm({ ...form, destinationName: e.target.value })}
                  placeholder="Ej. Coto, Oficina Central..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pl-9 text-white focus:outline-none focus:border-indigo-500"
                />
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">
                Tiempo de preparación en casa (minutos):
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={form.prepTimeMinutes}
                onChange={(e) => setForm({ ...form, prepTimeMinutes: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Tiempo previo para vestirse y empacar antes de salir.</p>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">
                Tiempo de viaje / traslado (minutos):
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={form.commuteTimeMinutes}
                onChange={(e) => setForm({ ...form, commuteTimeMinutes: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Duración estimada del trayecto hasta el trabajo.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Sueño & Descanso */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 border-b border-slate-800 pb-3">
            <Moon className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Hábitos de Sueño & Descanso</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-slate-300 block mb-1">
                Horas objetivas de descanso nocturno:
              </label>
              <input
                type="number"
                min="5"
                max="12"
                value={form.targetSleepHours}
                onChange={(e) => setForm({ ...form, targetSleepHours: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Recomendado: 7 a 8 horas continuas.</p>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">
                Hora límite habitual para dormirse (Curfew):
              </label>
              <input
                type="time"
                value={form.sleepCurfew}
                onChange={(e) => setForm({ ...form, sleepCurfew: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Límite para días sin turno matutino temprano.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Gimnasio & Entrenamiento */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-3">
            <Dumbbell className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Entrenamiento Gimnasio</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-slate-300 block mb-1">
                Frecuencia deseada (días por semana):
              </label>
              <select
                value={form.gymFrequencyPerWeek}
                onChange={(e) => setForm({ ...form, gymFrequencyPerWeek: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value={3}>3 veces por semana</option>
                <option value={4}>4 veces por semana (Recomendado)</option>
                <option value={5}>5 veces por semana</option>
                <option value={6}>6 veces por semana</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-300 block mb-1">
                Duración de la sesión (minutos):
              </label>
              <input
                type="number"
                min="30"
                max="180"
                value={form.gymDurationMinutes}
                onChange={(e) => setForm({ ...form, gymDurationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Clases en Vivo & Cursada (EducaciónIT) */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3">
            <GraduationCap className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Cursada & Clases en Vivo</h3>
          </div>

          {/* List of current classes */}
          <div className="space-y-2">
            {form.liveClasses.map((lc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
              >
                <div>
                  <div className="font-bold text-white">{lc.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {getDayName(lc.dayOfWeek)} de {lc.startTime} a {lc.endTime} hs
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveClass(index)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add new class form */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block">Agregar nueva materia / clase:</span>

            <input
              type="text"
              placeholder="Nombre del curso (ej. Desarrollo Web)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />

            <div className="grid grid-cols-3 gap-2">
              <select
                value={newClassDay}
                onChange={(e) => setNewClassDay(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
              >
                <option value={1}>Lunes</option>
                <option value={2}>Martes</option>
                <option value={3}>Miércoles</option>
                <option value={4}>Jueves</option>
                <option value={5}>Viernes</option>
                <option value={6}>Sábado</option>
              </select>

              <input
                type="time"
                value={newClassStart}
                onChange={(e) => setNewClassStart(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
              />

              <input
                type="time"
                value={newClassEnd}
                onChange={(e) => setNewClassEnd(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleAddClass}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Clase Fija
            </button>
          </div>
        </div>

      </div>

    </form>
  );
};
