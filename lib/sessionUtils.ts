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

export function groupEventsIntoSessions(
  events: any[],
  gapThresholdSeconds: number = 120
): Session[] {
  if (!events || events.length === 0) return [];

  // Sort events by timestamp
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  const sessions: Session[] = [];
  const activeSessions = new Map<string, Session>();

  sortedEvents.forEach((event) => {
    const meterId = event.meterId || event.deviceId || "Unknown Router";
    const hostname = findValue(event.details, "hostname") || findValue(event.details, "device_name") || "Unknown Device";
    const ip = findValue(event.details, "ip") || "Unknown IP";
    const mac = findValue(event.details, "mac") || "Unknown MAC";
    const hhid =
      findValue(event.details, "hhid") ||
      event.hhid ||
      "N/A";
    const member =
      findValue(event.details, ["member", "user"]) ||
      event.member ||
      event.member_code ||   // ✅ important
      "Unknown";

    const deviceType =
      findValue(event.details, ["device_type", "type"]) ||
      event.deviceType ||
      event.device_type ||   // ✅ important
      "Other";
    const platform = findValue(event.details, "platform") || "Unknown";
    const category = findValue(event.details, "category") || "Unknown";
    const subCategory = findValue(event.details, "sub_category") || "Default";
    const eventType = findValue(event.details, "event");

    // Unique key for Router x Device x Platform x Category x Sub-Category
    const sessionKey = `${meterId}-${hostname}-${platform}-${category}-${subCategory}`;
    const timestamp = event.timestamp;

    let currentSession = activeSessions.get(sessionKey);

    // Rule 1 & 2: Check if session exists and if gap is within threshold
    if (currentSession && (timestamp - currentSession.endTime) <= gapThresholdSeconds) {
      // Update existing session
      currentSession.endTime = timestamp;
      currentSession.eventCount += 1;
      currentSession.events.push(event);
      currentSession.duration = currentSession.endTime - currentSession.startTime;

      // Rule 5: Check for disconnect event to end session
      if (eventType === "disconnected") {
        sessions.push(currentSession);
        activeSessions.delete(sessionKey);
      }
    } else {
      // If there was an old session that timed out, push it to completed sessions
      if (currentSession) {
        sessions.push(currentSession);
      }

      // Start new session
      const newSession: Session = {
        id: `session-${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        meterId,
        hostname,
        ip,
        mac,
        hhid,
        member,
        deviceType,
        platform,
        category,
        subCategory,
        startTime: timestamp,
        endTime: timestamp,
        duration: 0,
        eventCount: 1,
        events: [event],
      };
      
      activeSessions.set(sessionKey, newSession);
    }
  });

  // Push remaining active sessions
  activeSessions.forEach((session) => {
    sessions.push(session);
  });

  return sessions.sort((a, b) => a.startTime - b.startTime);
}
