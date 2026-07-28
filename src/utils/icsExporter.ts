import type { DaySchedule, ScheduledBlock } from '../types';

export function formatIcsDateTime(dateStr: string, timeStr: string): string {
  const dateClean = dateStr.replace(/-/g, '');
  const timeClean = timeStr.replace(/:/g, '') + '00';
  return `${dateClean}T${timeClean}`;
}

export function generateIcsContent(schedules: DaySchedule[]): string {
  const events: string[] = [];

  for (const day of schedules) {
    for (const block of day.blocks) {
      if (block.category === 'sleep' || block.category === 'rest') continue;

      const startDt = formatIcsDateTime(day.dateStr, block.startTime);
      const endDt = formatIcsDateTime(day.dateStr, block.endTime);
      const summary = block.title;
      const description = (block.description || '') + (block.conflictDetails ? `\nNota: ${block.conflictDetails}` : '');

      events.push([
        'BEGIN:VEVENT',
        `UID:rotative-${day.dateStr}-${block.id}@scheduler.app`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${startDt}`,
        `DTEND:${endDt}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n'));
    }
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RotativeShiftScheduler//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcsFile(schedules: DaySchedule[], filename = 'agenda_rotativa.ics') {
  const icsData = generateIcsContent(schedules);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(block: ScheduledBlock, dateStr: string): string {
  const startDt = formatIcsDateTime(dateStr, block.startTime);
  const endDt = formatIcsDateTime(dateStr, block.endTime);
  const details = encodeURIComponent((block.description || '') + (block.conflictDetails ? `\n${block.conflictDetails}` : ''));
  const title = encodeURIComponent(block.title);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDt}/${endDt}&details=${details}`;
}
