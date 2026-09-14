/* eslint-disable @typescript-eslint/no-explicit-any */

export type ResolvedAlert = any & {
  __id: string;
  status?: "RESOLVED" | string;
  resolvedAt: string; // ISO string
};

const STORAGE_KEY = "police_resolved_alerts_v1";
const MAX_ITEMS = 200;

function safeParse(json: string | null): ResolvedAlert[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getResolvedAlerts(): ResolvedAlert[] {
  if (!canUseStorage()) return [];
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function setResolvedAlerts(alerts: ResolvedAlert[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, MAX_ITEMS)));
}

/**
 * Upsert by __id, newest first (by resolvedAt)
 */
export function addResolvedAlert(alert: any): ResolvedAlert[] {
  const id = (alert?.__id ?? alert?.id ?? alert?._id ?? "").toString();
  if (!id) return getResolvedAlerts();

  const nowIso = new Date().toISOString();
  const record: ResolvedAlert = {
    ...alert,
    __id: id,
    status: "RESOLVED",
    resolvedAt: alert?.resolvedAt ?? nowIso,
  };

  const existing = getResolvedAlerts().filter((a) => a.__id !== id);
  const next = [record, ...existing].sort(
    (a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime()
  );

  setResolvedAlerts(next);
  return next;
}

export function removeResolvedAlert(id: string): ResolvedAlert[] {
  const next = getResolvedAlerts().filter((a) => a.__id !== id);
  setResolvedAlerts(next);
  return next;
}

export function clearResolvedAlerts() {
  setResolvedAlerts([]);
}