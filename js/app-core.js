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
let contextMenuState = null;
let pendingRenameAction = null;

const els = {
  navButtons: document.querySelectorAll(".nav-btn"),
  panels: document.querySelectorAll(".panel"),

  openTodoAddBtn: document.getElementById("openTodoAddBtn"),
  todoList: document.getElementById("todoList"),
  todoProgress: document.getElementById("todoProgress"),
  dashboardTwoWeekRange: document.getElementById("dashboardTwoWeekRange"),
  dashboardTwoWeekGrid: document.getElementById("dashboardTwoWeekGrid"),

  openHabitAddBtn: document.getElementById("openHabitAddBtn"),
  habitList: document.getElementById("habitList"),
  habitStreakSummary: document.getElementById("habitStreakSummary"),

  upcomingAssignmentCount: document.getElementById("upcomingAssignmentCount"),
  upcomingAssignmentsList: document.getElementById("upcomingAssignmentsList"),

  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  calendarMonthLabel: document.getElementById("calendarMonthLabel"),
  calendarGrid: document.getElementById("calendarGrid"),

  openSubjectAddBtn: document.getElementById("openSubjectAddBtn"),
  backToSubjectsBtn: document.getElementById("backToSubjectsBtn"),
  openDashboardSubjectAddBtn: document.getElementById("openDashboardSubjectAddBtn"),
  subjectCount: document.getElementById("subjectCount"),
  subjectPagePanel: document.getElementById("subject-page"),
  dashboardSubjectCount: document.getElementById("dashboardSubjectCount"),
  subjectTabs: document.getElementById("subjectTabs"),
  dashboardSubjectCards: document.getElementById("dashboardSubjectCards"),
  subjectTitle: document.getElementById("subjectTitle"),
  subjectCourseProgressBar: document.getElementById("subjectCourseProgressBar"),
  subjectCourseProgressLabel: document.getElementById("subjectCourseProgressLabel"),
  subjectUpcomingAssignmentsCount: document.getElementById("subjectUpcomingAssignmentsCount"),
  subjectUpcomingAssignmentsList: document.getElementById("subjectUpcomingAssignmentsList"),
  noteLinkedCitations: document.getElementById("noteLinkedCitations"),
  noteLinkedGraphics: document.getElementById("noteLinkedGraphics"),
  subjectQuoteText: document.getElementById("subjectQuoteText"),
  noteFileTabs: document.getElementById("noteFileTabs"),
  openNoteFileAddBtn: document.getElementById("openNoteFileAddBtn"),
  noteBreadcrumb: document.getElementById("noteBreadcrumb"),
  noteEditorHeading: document.getElementById("noteEditorHeading"),
  noteDraftSavedAt: document.getElementById("noteDraftSavedAt"),
  noteStatusLabel: document.getElementById("noteStatusLabel"),
  noteContextSubject: document.getElementById("noteContextSubject"),
  subjectCourseCodeValue: document.getElementById("subjectCourseCodeValue"),
  subjectContactsInput: document.getElementById("subjectContactsInput"),
  subjectOutlineStatus: document.getElementById("subjectOutlineStatus"),
  noteContextAssignments: document.getElementById("noteContextAssignments"),
  noteContextResources: document.getElementById("noteContextResources"),
  subjectNotes: document.getElementById("subjectNotes"),
  saveNotesBtn: document.getElementById("saveNotesBtn"),
  openResourceAddBtn: document.getElementById("openResourceAddBtn"),
  resourceList: document.getElementById("resourceList"),
  openAssignmentAddBtn: document.getElementById("openAssignmentAddBtn"),
  subjectAssignmentList: document.getElementById("subjectAssignmentList"),

  googleStatus: document.getElementById("googleStatus"),
  googleConnectBtn: document.getElementById("googleConnectBtn"),
  googleDisconnectBtn: document.getElementById("googleDisconnectBtn"),
  fetchEventsBtn: document.getElementById("fetchEventsBtn"),
  googleEventsList: document.getElementById("googleEventsList"),
  currentDateTime: document.getElementById("currentDateTime"),
  currentDateLine: document.getElementById("currentDateLine"),
  currentTimeLine: document.getElementById("currentTimeLine"),

  addItemDialog: document.getElementById("addItemDialog"),
  addItemForm: document.getElementById("addItemForm"),
  addItemDialogTitle: document.getElementById("addItemDialogTitle"),
  addItemInput: document.getElementById("addItemInput"),
  addItemPriorityWrapper: document.getElementById("addItemPriorityWrapper"),
  addItemPriority: document.getElementById("addItemPriority"),
  addItemDueDateWrapper: document.getElementById("addItemDueDateWrapper"),
  addItemDueDate: document.getElementById("addItemDueDate"),
  addItemDetailsWrapper: document.getElementById("addItemDetailsWrapper"),
  addItemDetails: document.getElementById("addItemDetails"),
  addItemFilesWrapper: document.getElementById("addItemFilesWrapper"),
  addItemFiles: document.getElementById("addItemFiles"),
  addItemLinkWrapper: document.getElementById("addItemLinkWrapper"),
  addItemLink: document.getElementById("addItemLink"),
  cancelAddItemBtn: document.getElementById("cancelAddItemBtn"),
  renameItemDialog: document.getElementById("renameItemDialog"),
  renameItemForm: document.getElementById("renameItemForm"),
  renameItemDialogTitle: document.getElementById("renameItemDialogTitle"),
  renameItemInput: document.getElementById("renameItemInput"),
  cancelRenameItemBtn: document.getElementById("cancelRenameItemBtn"),
  contextActionMenu: document.getElementById("contextActionMenu"),
  contextMenuRenameBtn: document.getElementById("contextMenuRenameBtn"),
  contextMenuDeleteBtn: document.getElementById("contextMenuDeleteBtn")
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
  merged.todos = Array.isArray(merged.todos)
    ? merged.todos.map((item) => ({
      ...item,
      dueDate: typeof item.dueDate === "string" ? item.dueDate : ""
    }))
    : [];
  merged.subjects = Array.isArray(merged.subjects)
    ? merged.subjects.map((subject) => ({
      ...subject,
      courseCode: typeof subject.courseCode === "string" ? subject.courseCode : "",
      contacts: typeof subject.contacts === "string" ? subject.contacts : "",
      outlineFile: subject.outlineFile && typeof subject.outlineFile === "object"
        ? {
          name: typeof subject.outlineFile.name === "string" ? subject.outlineFile.name : "",
          dataUrl: typeof subject.outlineFile.dataUrl === "string" ? subject.outlineFile.dataUrl : "",
          mimeType: typeof subject.outlineFile.mimeType === "string" ? subject.outlineFile.mimeType : "",
          updatedAt: typeof subject.outlineFile.updatedAt === "number" ? subject.outlineFile.updatedAt : 0
        }
        : null,
      notesFiles: Array.isArray(subject.notesFiles)
        ? subject.notesFiles.map((noteFile) => ({
          ...noteFile,
          title: typeof noteFile.title === "string" ? noteFile.title : "Untitled note",
          content: typeof noteFile.content === "string" ? noteFile.content : ""
        }))
        : (() => {
          const legacyContent = typeof subject.notes === "string" ? subject.notes : "";
          return [{
            id: crypto.randomUUID(),
            title: "General Notes",
            content: legacyContent
          }];
        })(),
      selectedNoteFileId: typeof subject.selectedNoteFileId === "string" ? subject.selectedNoteFileId : "",
      assignments: Array.isArray(subject.assignments)
        ? subject.assignments.map((assignment) => ({
          ...assignment,
          details: typeof assignment.details === "string" ? assignment.details : "",
          files: Array.isArray(assignment.files)
            ? assignment.files
              .filter((file) => file && typeof file === "object")
              .map((file) => ({
                name: typeof file.name === "string" ? file.name : "Attachment",
                dataUrl: typeof file.dataUrl === "string" ? file.dataUrl : "",
                mimeType: typeof file.mimeType === "string" ? file.mimeType : ""
              }))
              .filter((file) => file.dataUrl)
            : [],
          dueDate: typeof assignment.dueDate === "string" ? assignment.dueDate : "",
          done: Boolean(assignment.done)
        }))
        : []
    }))
    : [];

  return merged;
}

function isCloudSyncConfigured() {
  return Boolean(SUPABASE_SYNC_CONFIG.url && SUPABASE_SYNC_CONFIG.anonKey && SUPABASE_SYNC_CONFIG.table && SUPABASE_SYNC_CONFIG.rowId);
}

function isoToday() {
  return new Date().toISOString().split("T")[0];
}
