import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  AIMessage,
  AIModerationLog,
  AppState,
  AuthSession,
  Meeting,
  Student,
} from "../types";
import {
  fetchCloudStorageKind,
  pullWorkspace,
  pushWorkspace,
  type CloudStorageKind,
  type WorkspaceDelta,
  type WorkspaceSnapshot,
} from "../services/workspaceSync";

const PULL_INTERVAL_MS = 6000;
const PUSH_DEBOUNCE_MS = 500;

export type WorkspaceSyncStatus =
  | "idle"
  | "local"
  | "syncing"
  | "synced"
  | "error"
  | "offline";

interface SyncedMaps {
  students: Map<string, string>;
  messages: Map<string, string>;
  logs: Map<string, string>;
  meetings: Map<string, string>;
  settings: string | null;
}

function emptyMaps(): SyncedMaps {
  return {
    students: new Map(),
    messages: new Map(),
    logs: new Map(),
    meetings: new Map(),
    settings: null,
  };
}

function serialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => serialize(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${serialize(record[key])}`)
    .join(",")}}`;
}

interface MergeResult {
  items: Student[] | AIMessage[] | AIModerationLog[] | Meeting[];
  changed: boolean;
}

function mergeEntities<T extends { id: string }>(
  local: T[],
  remote: T[],
  synced: Map<string, string>,
  initial: boolean
): MergeResult {
  const localById = new Map(local.map((item) => [item.id, item]));
  const remoteIds = new Set(remote.map((item) => item.id));
  const merged = new Map(localById);
  let changed = false;

  for (const remoteItem of remote) {
    const id = remoteItem.id;
    const remoteSerialized = serialize(remoteItem);
    const localItem = localById.get(id);
    if (!localItem) {
      merged.set(id, remoteItem);
      synced.set(id, remoteSerialized);
      changed = true;
      continue;
    }
    const localSerialized = serialize(localItem);
    const pendingLocal = localSerialized !== synced.get(id);
    if (initial || !pendingLocal) {
      if (localSerialized !== remoteSerialized) {
        merged.set(id, remoteItem);
        changed = true;
      }
      synced.set(id, remoteSerialized);
    }
  }

  for (const id of [...merged.keys()]) {
    if (remoteIds.has(id)) continue;
    if (synced.has(id)) {
      merged.delete(id);
      synced.delete(id);
      changed = true;
    }
  }

  return { items: [...merged.values()] as unknown as MergeResult["items"], changed };
}

interface ApplyPlan {
  nextState: AppState | null;
  maps: SyncedMaps;
}

function applyRemoteSnapshot(
  state: AppState,
  snapshot: WorkspaceSnapshot,
  currentMaps: SyncedMaps,
  initial: boolean
): ApplyPlan {
  const maps: SyncedMaps = {
    students: new Map(currentMaps.students),
    messages: new Map(currentMaps.messages),
    logs: new Map(currentMaps.logs),
    meetings: new Map(currentMaps.meetings),
    settings: currentMaps.settings,
  };

  const students = mergeEntities(
    state.students,
    snapshot.students,
    maps.students,
    initial
  );
  const messages = mergeEntities(
    state.aiMessages,
    snapshot.aiMessages,
    maps.messages,
    initial
  );
  const logs = mergeEntities(
    state.aiModerationLogs,
    snapshot.aiModerationLogs,
    maps.logs,
    initial
  );
  const meetings = mergeEntities(
    state.meetings,
    snapshot.meetings,
    maps.meetings,
    initial
  );

  let settingsChanged = false;
  let approval = state.settings.requireTeacherApprovalBeforeDisplay;
  const remoteApproval = snapshot.settings?.requireTeacherApprovalBeforeDisplay;
  if (typeof remoteApproval === "boolean") {
    const remoteSerialized = serialize(remoteApproval);
    const pendingLocal = serialize(approval) !== maps.settings;
    if (initial || !pendingLocal) {
      if (approval !== remoteApproval) {
        approval = remoteApproval;
        settingsChanged = true;
      }
      maps.settings = remoteSerialized;
    }
  }

  const changed =
    students.changed ||
    messages.changed ||
    logs.changed ||
    meetings.changed ||
    settingsChanged;
  if (!changed) {
    return { nextState: null, maps };
  }

  return {
    maps,
    nextState: {
      ...state,
      students: students.items as Student[],
      aiMessages: messages.items as AIMessage[],
      aiModerationLogs: logs.items as AIModerationLog[],
      meetings: meetings.items as Meeting[],
      settings: {
        ...state.settings,
        requireTeacherApprovalBeforeDisplay: approval,
      },
    },
  };
}

type AccessScope = { teacher: boolean; ids: Set<string> };

function accessScope(session: AuthSession): AccessScope {
  if (session.user.role === "teacher") {
    return { teacher: true, ids: new Set() };
  }
  if (session.user.role === "student") {
    return { teacher: false, ids: new Set([`acc:${session.user.id}`]) };
  }
  return {
    teacher: false,
    ids: new Set(
      (session.user.linkedChildren ?? []).map((child) => child.studentId)
    ),
  };
}

function buildDelta(
  state: AppState,
  session: AuthSession,
  maps: SyncedMaps
): WorkspaceDelta | null {
  const scope = accessScope(session);
  const visible = (studentId: string) =>
    scope.teacher || scope.ids.has(studentId);

  const delta: WorkspaceDelta = {};
  let hasChange = false;

  const students = state.students.filter(
    (student) => visible(student.id) && serialize(student) !== maps.students.get(student.id)
  );
  if (students.length > 0) {
    delta.students = students;
    hasChange = true;
  }

  if (session.user.role !== "parent") {
    const messages = state.aiMessages.filter(
      (message) =>
        visible(message.studentId) &&
        serialize(message) !== maps.messages.get(message.id)
    );
    if (messages.length > 0) {
      delta.aiMessages = messages;
      hasChange = true;
    }

    const logs = state.aiModerationLogs.filter(
      (log) =>
        visible(log.studentId) && serialize(log) !== maps.logs.get(log.id)
    );
    if (logs.length > 0) {
      delta.aiModerationLogs = logs;
      hasChange = true;
    }
  }

  if (session.user.role !== "student") {
    const meetings = state.meetings.filter(
      (meeting) =>
        visible(meeting.studentId) &&
        serialize(meeting) !== maps.meetings.get(meeting.id)
    );
    if (meetings.length > 0) {
      delta.meetings = meetings;
      hasChange = true;
    }
  }

  if (
    session.user.role === "teacher" &&
    serialize(state.settings.requireTeacherApprovalBeforeDisplay) !==
      maps.settings
  ) {
    delta.settings = {
      requireTeacherApprovalBeforeDisplay:
        state.settings.requireTeacherApprovalBeforeDisplay,
    };
    hasChange = true;
  }

  return hasChange ? delta : null;
}

function markPushed(
  delta: WorkspaceDelta,
  state: AppState,
  maps: SyncedMaps
): void {
  for (const student of delta.students ?? []) {
    const latest = state.students.find((item) => item.id === student.id);
    if (latest) maps.students.set(student.id, serialize(latest));
  }
  for (const message of delta.aiMessages ?? []) {
    const latest = state.aiMessages.find((item) => item.id === message.id);
    if (latest) maps.messages.set(message.id, serialize(latest));
  }
  for (const log of delta.aiModerationLogs ?? []) {
    const latest = state.aiModerationLogs.find((item) => item.id === log.id);
    if (latest) maps.logs.set(log.id, serialize(latest));
  }
  for (const meeting of delta.meetings ?? []) {
    const latest = state.meetings.find((item) => item.id === meeting.id);
    if (latest) maps.meetings.set(meeting.id, serialize(latest));
  }
  if (delta.settings) {
    maps.settings = serialize(
      delta.settings.requireTeacherApprovalBeforeDisplay
    );
  }
}

interface UseWorkspaceSyncOptions {
  session: AuthSession | null;
  hydrated: boolean;
  appState: AppState;
  setAppState: Dispatch<SetStateAction<AppState>>;
}

export interface WorkspaceSyncState {
  status: WorkspaceSyncStatus;
  lastSyncedAt: number | null;
  storageKind: CloudStorageKind | null;
}

export function useWorkspaceSync({
  session,
  hydrated,
  appState,
  setAppState,
}: UseWorkspaceSyncOptions): WorkspaceSyncState {
  const [status, setStatus] = useState<WorkspaceSyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [storageKind, setStorageKind] = useState<CloudStorageKind | null>(null);
  const [tick, setTick] = useState(0);

  const mapsRef = useRef<SyncedMaps>(emptyMaps());
  const initializedRef = useRef(false);
  const pushInFlightRef = useRef(false);
  const appStateRef = useRef(appState);
  appStateRef.current = appState;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const sessionToken = session?.token ?? "";
  const enabled =
    hydrated && Boolean(session) && !sessionToken.startsWith("local-");

  useEffect(() => {
    if (enabled) {
      void fetchCloudStorageKind().then((kind) => {
        if (kind) setStorageKind(kind);
      });
    }
  }, [enabled]);

  useEffect(() => {
    mapsRef.current = emptyMaps();
    initializedRef.current = false;
    pushInFlightRef.current = false;

    if (!enabled) {
      setStatus(session ? "local" : "idle");
      return;
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("offline");
    } else {
      setStatus("syncing");
    }

    let cancelled = false;

    const applySnapshot = (
      snapshot: WorkspaceSnapshot,
      initial: boolean
    ) => {
      const plan = applyRemoteSnapshot(
        appStateRef.current,
        snapshot,
        mapsRef.current,
        initial
      );
      mapsRef.current = plan.maps;
      if (plan.nextState) {
        setAppState(plan.nextState);
      }
    };

    const runPull = async (initial: boolean) => {
      const current = sessionRef.current;
      if (!current || current.token.startsWith("local-")) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        if (!cancelled) setStatus("offline");
        return;
      }
      const snapshot = await pullWorkspace(current);
      if (cancelled) return;
      if (!snapshot) {
        if (!initializedRef.current) setStatus("error");
        else if (!cancelled) setStatus("syncing");
        setTick((value) => value + 1);
        return;
      }
      applySnapshot(snapshot, initial);
      initializedRef.current = true;
      setStatus("synced");
      setLastSyncedAt(Date.now());
      setTick((value) => value + 1);
    };

    void runPull(true);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void runPull(false);
    }, PULL_INTERVAL_MS);
    const handleFocus = () => void runPull(false);
    const handleOnline = () => void runPull(false);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, sessionToken, setAppState]);

  useEffect(() => {
    if (!enabled || !initializedRef.current) return;
    const current = sessionRef.current;
    if (!current) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStatus("offline");
      return;
    }

    let delta: WorkspaceDelta | null;
    try {
      delta = buildDelta(appStateRef.current, current, mapsRef.current);
    } catch {
      delta = null;
    }
    if (!delta) return;

    const timer = window.setTimeout(async () => {
      if (pushInFlightRef.current) return;
      const active = sessionRef.current;
      if (!active || active.token !== current.token) return;
      pushInFlightRef.current = true;
      setStatus("syncing");
      const snapshot = await pushWorkspace(active, delta);
      pushInFlightRef.current = false;
      if (!snapshot) {
        setStatus(
          typeof navigator !== "undefined" && navigator.onLine === false
            ? "offline"
            : "error"
        );
        return;
      }
      markPushed(delta, appStateRef.current, mapsRef.current);
      setStatus("synced");
      setLastSyncedAt(Date.now());
      const plan = applyRemoteSnapshot(
        appStateRef.current,
        snapshot,
        mapsRef.current,
        false
      );
      mapsRef.current = plan.maps;
      if (plan.nextState) {
        setAppState(plan.nextState);
      }
      setTick((value) => value + 1);
    }, PUSH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [appState, enabled, sessionToken, setAppState, tick]);

  return { status, lastSyncedAt, storageKind };
}