const STORAGE_KEY = "scholarlySanctuaryDataV1";

const APP_CONFIG = window.APP_CONFIG || {};
const GOOGLE_CONFIG = {
  clientId: APP_CONFIG.google?.clientId || "",
  apiKey: APP_CONFIG.google?.apiKey || "",
  calendarId: APP_CONFIG.google?.calendarId || "primary"
};

const SUPABASE_SYNC_CONFIG = {
  url: APP_CONFIG.supabase?.url || "",
  anonKey: APP_CONFIG.supabase?.anonKey || "",
  table: APP_CONFIG.supabase?.table || "dashboard_state",
  rowId: APP_CONFIG.supabase?.rowId || "personal"
};

const initialState = {
  todos: [],
  habits: [],
  schedule: [],
  subjects: [],
  selectedSubjectId: null,
  calendarMonthOffset: 0,
  updatedAt: 0,
  google: {
    clientId: GOOGLE_CONFIG.clientId,
    apiKey: GOOGLE_CONFIG.apiKey,
    calendarId: GOOGLE_CONFIG.calendarId,
    accessToken: "",
    connected: false
  },
  googleEvents: []
};

let state = loadState();
let tokenClient = null;
let gapiLoaded = false;
let gisLoaded = false;
let undoToastTimerId = null;
let pendingUndoAction = null;
let cloudSyncSaveTimerId = null;
let cloudSyncClient = null;
let cloudSyncReady = false;
let dragReorderState = {
  collectionName: "",
  itemId: ""
};
let addDialogMode = "todo";

const els = {
  navButtons: document.querySelectorAll(".nav-btn"),
  panels: document.querySelectorAll(".panel"),

  openTodoAddBtn: document.getElementById("openTodoAddBtn"),
  todoList: document.getElementById("todoList"),
  todoProgress: document.getElementById("todoProgress"),

  openHabitAddBtn: document.getElementById("openHabitAddBtn"),
  habitList: document.getElementById("habitList"),
  habitStreakSummary: document.getElementById("habitStreakSummary"),

  scheduleForm: document.getElementById("scheduleForm"),
  scheduleList: document.getElementById("scheduleList"),
  scheduleSummary: document.getElementById("scheduleSummary"),

  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarGrid: document.getElementById("calendarGrid"),

  openSubjectAddBtn: document.getElementById("openSubjectAddBtn"),
  subjectCount: document.getElementById("subjectCount"),
  subjectTabs: document.getElementById("subjectTabs"),
  subjectTitle: document.getElementById("subjectTitle"),
  deleteSubjectBtn: document.getElementById("deleteSubjectBtn"),
  subjectNotes: document.getElementById("subjectNotes"),
  saveNotesBtn: document.getElementById("saveNotesBtn"),
  resourceForm: document.getElementById("resourceForm"),
  resourceLabel: document.getElementById("resourceLabel"),
  resourceLink: document.getElementById("resourceLink"),
  resourceList: document.getElementById("resourceList"),
  newSubjectQuickBtn: document.getElementById("newSubjectQuickBtn"),

  googleStatus: document.getElementById("googleStatus"),
  googleConnectBtn: document.getElementById("googleConnectBtn"),
  googleDisconnectBtn: document.getElementById("googleDisconnectBtn"),
  fetchEventsBtn: document.getElementById("fetchEventsBtn"),
  googleEventsList: document.getElementById("googleEventsList"),
  syncTodayBtn: document.getElementById("syncTodayBtn"),
  currentDateTime: document.getElementById("currentDateTime"),
  currentDateLine: document.getElementById("currentDateLine"),
  currentTimeLine: document.getElementById("currentTimeLine"),

  addItemDialog: document.getElementById("addItemDialog"),
  addItemForm: document.getElementById("addItemForm"),
  addItemDialogTitle: document.getElementById("addItemDialogTitle"),
  addItemInput: document.getElementById("addItemInput"),
  addItemPriorityWrapper: document.getElementById("addItemPriorityWrapper"),
  addItemPriority: document.getElementById("addItemPriority"),
  cancelAddItemBtn: document.getElementById("cancelAddItemBtn")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(saved);
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  state.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueCloudSyncSave();
}

function normalizeState(saved) {
  if (!saved) return structuredClone(initialState);

  const merged = {
    ...structuredClone(initialState),
    ...saved,
    google: {
      ...structuredClone(initialState.google),
      ...(saved.google || {})
    }
  };

  merged.updatedAt = typeof saved.updatedAt === "number" ? saved.updatedAt : 0;
  merged.google.clientId = GOOGLE_CONFIG.clientId;
  merged.google.apiKey = GOOGLE_CONFIG.apiKey;
  merged.google.calendarId = GOOGLE_CONFIG.calendarId;

  return merged;
}

function isCloudSyncConfigured() {
  return Boolean(SUPABASE_SYNC_CONFIG.url && SUPABASE_SYNC_CONFIG.anonKey && SUPABASE_SYNC_CONFIG.table && SUPABASE_SYNC_CONFIG.rowId);
}

function isoToday() {
  return new Date().toISOString().split("T")[0];
}
