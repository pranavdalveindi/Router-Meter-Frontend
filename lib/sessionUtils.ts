import { findValue } from './dataUtils';

export interface Session {
  id: string;
  meterId: string;
  hostname: string;
  ip: string;
  mac: string;
  hhid: string;
  member: string;
  deviceType: string;
  platform: string;
  category: string;
  subCategory: string;
  startTime: number;
  endTime: number;
  duration: number;
  eventCount: number;
  events: any[];
}

export const groupEventsIntoSessions = (events: any[], gapThreshold = 120) => {
  if (!events || events.length === 0) return [];

  const sorted = [...events].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

  const sessions: any[] = [];
  let currentSession: any = null;

  for (const event of sorted) {
    const timestamp = Math.floor(new Date(event.timestamp).getTime() / 1000);

    if (!currentSession) {
      currentSession = {
        id: `${event.router_id}-${timestamp}`,
        meterId: event.router_id,
        hhid: event.hhid ?? "—",
        member: event.member ?? "—",
        deviceType: event.device_type ?? "—",
        hostname: event.hostname ?? "—",
        platform: event.platform ?? "—",
        category: event.category ?? "—",
        startTime: timestamp,
        endTime: timestamp,
        duration: 0
      };
      continue;
    }

    const gap = timestamp - currentSession.endTime;

    if (
      gap <= gapThreshold &&
      currentSession.meterId === event.router_id &&
      currentSession.hostname === (event.hostname ?? "—")
    ) {
      currentSession.endTime = timestamp;
      currentSession.duration = currentSession.endTime - currentSession.startTime;
    } else {
      sessions.push(currentSession);

      currentSession = {
        id: `${event.router_id}-${timestamp}`,
        meterId: event.router_id,
        hhid: event.hhid ?? "—",
        member: event.member ?? "—",
        deviceType: event.device_type ?? "—",
        hostname: event.hostname ?? "—",
        platform: event.platform ?? "—",
        category: event.category ?? "—",
        startTime: timestamp,
        endTime: timestamp,
        duration: 0
      };
    }
  }

  if (currentSession) sessions.push(currentSession);

  return sessions;
};
