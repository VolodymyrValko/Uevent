import { Event } from '../types';

export const getGoogleCalendarUrl = (event: Event): string => {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const frontendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `${event.description.slice(0, 500)}\n\n${frontendUrl}/events/${event.id}`,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const toICSDate = (date: Date): string =>
  date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

const escapeICS = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

export const downloadICS = (event: Event): void => {
  const start = new Date(event.date);

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const now = new Date();

  const uid = `uevent-${event.id}-${Date.now()}@uevent.app`;
  const frontendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') ?? 'http://localhost:3000';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Uevent//Uevent Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description.slice(0, 500))}`,
    `LOCATION:${escapeICS(event.location)}`,
    `URL:${frontendUrl}/events/${event.id}`,
    ...(event.latitude && event.longitude
      ? [`GEO:${event.latitude};${event.longitude}`]
      : []),
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = lines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
