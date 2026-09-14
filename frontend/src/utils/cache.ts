import { AttendanceData } from "@/types/attendance";

const CACHE_KEY = "present_attendance_cache";

interface CachePayload {
  data: AttendanceData;
  updatedAt: number;
}

export function loadCache(): {
  data: AttendanceData | null;
  updatedAt: number | null;
} {
  try {
    const raw = localStorage.getItem(CACHE_KEY);

    if (!raw) return { data: null, updatedAt: null };
    const parsed = JSON.parse(raw) as CachePayload;

    if (!parsed.data || !parsed.updatedAt)
      return { data: null, updatedAt: null };

    return { data: parsed.data, updatedAt: parsed.updatedAt };
  } catch {
    return { data: null, updatedAt: null };
  }
}

export function saveCache(data: AttendanceData, updatedAt: number): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, updatedAt }));
  } catch {
    // storage full or unavailable — instant-open just won't work, app still works
  }
}

export function timeAgo(ts: number | null): string {
  if (!ts) return "";
  const seconds = Math.floor((Date.now() - ts) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}
