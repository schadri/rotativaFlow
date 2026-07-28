import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, Navigation, CheckCircle2, Volume2 } from 'lucide-react';
import type { DaySchedule, UserSettings } from '../types';
import { hhmmToMinutes } from '../utils/schedulerEngine';

interface PrepAlertBannerProps {
  todaySchedule?: DaySchedule;
  settings: UserSettings;
}

export const PrepAlertBanner: React.FC<PrepAlertBannerProps> = ({ todaySchedule, settings }) => {
  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [prepStartTimeStr, setPrepStartTimeStr] = useState<string | null>(null);
  const [leaveTimeStr, setLeaveTimeStr] = useState<string | null>(null);
  const [workStartTimeStr, setWorkStartTimeStr] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [simulatingUrgent, setSimulatingUrgent] = useState(false);

  // Find today's prep block & work block
  const prepBlock = todaySchedule?.blocks.find((b) => b.category === 'prep');
  const workBlock = todaySchedule?.blocks.find((b) => b.category === 'work');

  useEffect(() => {
    if (!prepBlock) {
      setMinutesRemaining(null);
      return;
    }

    setPrepStartTimeStr(prepBlock.startTime);
    setLeaveTimeStr(prepBlock.endTime);
    if (workBlock) setWorkStartTimeStr(workBlock.startTime);

    const updateCountdown = () => {
      if (simulatingUrgent) {
        setMinutesRemaining(8); // Simulated 8 minutes remaining
        return;
      }

      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const targetMins = hhmmToMinutes(prepBlock.startTime);

      const diff = targetMins - currentMins;

      if (diff < -120) {
        setMinutesRemaining(null);
      } else {
        setMinutesRemaining(diff);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 10000);
    return () => clearInterval(interval);
  }, [prepBlock, workBlock, simulatingUrgent]);

  const requestNotifPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        new Notification('Alertas de Salida Activadas 🚨', {
          body: 'Te notificaremos 10 minutos antes de empezar a cambiarte.',
          icon: '/vite.svg'
        });
      }
    }
  };

  const triggerTestNotification = () => {
    setSimulatingUrgent(true);

    if (notifPermission === 'granted') {
      new Notification('⚠️ Falta poco para salir', {
        body: `Empezá a cambiarte para salir hacia ${settings.destinationName || 'Trabajo'} a las ${leaveTimeStr || '05:15'} hs`,
        icon: '/vite.svg'
      });
    }
  };

  if (!prepBlock || minutesRemaining === null) {
    return (
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Sin salidas pendientes hoy</h3>
            <p className="text-xs text-slate-400">Día libre o turno completado. ¡Aprovechá tu tiempo libre!</p>
          </div>
        </div>
      </div>
    );
  }

  const isUrgent = minutesRemaining <= 10 && minutesRemaining >= -prepBlock.startTime.length;
  const isPastPrep = minutesRemaining < 0;

  const hoursLeft = Math.floor(Math.abs(minutesRemaining) / 60);
  const minsLeft = Math.abs(minutesRemaining) % 60;

  return (
    <div
      className={`rounded-2xl p-5 border transition-all shadow-xl ${
        isUrgent
          ? 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-rose-950/80 border-amber-500/50 shadow-amber-500/10 animate-pulse'
          : 'glass-panel border-indigo-500/30 shadow-indigo-950/40'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Side: Status & Details */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl flex items-center justify-center shrink-0 ${
              isUrgent
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            {isUrgent ? <AlertTriangle className="w-6 h-6 animate-bounce" /> : <Navigation className="w-6 h-6" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Prep & Leave Alert
              </span>
              {isUrgent && (
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ⚠️ Preparación inminente
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-white mt-1">
              {isPastPrep
                ? `En horario de preparación / salida (${prepStartTimeStr} hs)`
                : `Próxima Salida: Empezar a cambiarte a las ${prepStartTimeStr} hs`}
            </h3>

            <p className="text-xs text-slate-300 mt-0.5">
              Salida de casa a las <strong className="text-indigo-300 font-mono">{leaveTimeStr} hs</strong> para llegar al turno de las{' '}
              <strong className="text-white font-mono">{workStartTimeStr} hs</strong> en{' '}
              <span className="text-indigo-400 font-medium">{settings.destinationName || 'Trabajo'}</span>.
            </p>
          </div>
        </div>

        {/* Right Side: Countdown & Actions */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Tiempo para prep</div>
            <div className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-1">
              <Clock className="w-5 h-5 text-indigo-400 inline" />
              {isPastPrep ? (
                <span className="text-amber-400">¡En curso!</span>
              ) : (
                <span>
                  {hoursLeft > 0 && `${hoursLeft}h `}
                  {minsLeft}m
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {notifPermission !== 'granted' ? (
              <button
                onClick={requestNotifPermission}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                Activar Alertas
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Alertas ON
              </span>
            )}

            <button
              onClick={() => {
                if (simulatingUrgent) {
                  setSimulatingUrgent(false);
                } else {
                  triggerTestNotification();
                }
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-all"
            >
              <Volume2 className="w-3 h-3 text-amber-400" />
              {simulatingUrgent ? 'Restablecer' : 'Simular Alerta 10m'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
