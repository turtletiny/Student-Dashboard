function switchPanel(targetId) {
  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.target === targetId);
  });

  els.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });
}

function moveItemInCollection(collectionName, fromItemId, toItemId) {
  const collection = state[collectionName];
  if (!Array.isArray(collection)) return false;

  const fromIndex = collection.findIndex((entry) => entry.id === fromItemId);
  const toIndex = collection.findIndex((entry) => entry.id === toItemId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return false;

  const [movedItem] = collection.splice(fromIndex, 1);
  collection.splice(toIndex, 0, movedItem);
  return true;
}

function makeDraggableSortItem(element, collectionName, itemId, renderFn) {
  element.draggable = true;
  element.classList.add("draggable-item");

  element.addEventListener("dragstart", (event) => {
    dragReorderState.collectionName = collectionName;
    dragReorderState.itemId = itemId;
    element.classList.add("dragging");

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", itemId);
    }
  });

  element.addEventListener("dragover", (event) => {
    if (dragReorderState.collectionName !== collectionName || dragReorderState.itemId === itemId) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    element.classList.add("drag-over");
  });

  element.addEventListener("dragleave", () => {
    element.classList.remove("drag-over");
  });

  element.addEventListener("drop", (event) => {
    event.preventDefault();
    element.classList.remove("drag-over");

    if (dragReorderState.collectionName !== collectionName || dragReorderState.itemId === itemId) return;

    const didMove = moveItemInCollection(collectionName, dragReorderState.itemId, itemId);
    if (!didMove) return;

    saveState();
    renderFn();
  });

  element.addEventListener("dragend", () => {
    dragReorderState.collectionName = "";
    dragReorderState.itemId = "";
    element.classList.remove("dragging");
    document.querySelectorAll(".draggable-item.drag-over").forEach((node) => node.classList.remove("drag-over"));
  });
}

function renderAll() {
  renderTodos();
  renderHabits();
  renderSchedule();
  renderCalendar();
  renderSubjects();
  renderGoogleStatus();
  renderGoogleEvents();
  renderCurrentDateTime();
}

function renderCurrentDateTime() {
  if (!els.currentDateLine || !els.currentTimeLine) return;

  const now = new Date();
  const dateText = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric"
  });
  const timeText = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  els.currentDateLine.textContent = dateText;
  els.currentTimeLine.textContent = timeText;
}

function startCurrentDateTimeTicker() {
  renderCurrentDateTime();
  setInterval(renderCurrentDateTime, 1000);
}

function openAddItemDialog(mode) {
  if (!els.addItemDialog || !els.addItemDialogTitle || !els.addItemInput) return;

  addDialogMode = mode;
  let title = "Add";
  let label = "Name";
  let placeholder = "";
  let maxLength = 120;

  if (mode === "todo") {
    title = "Add To-Do";
    label = "Task";
    placeholder = "e.g. Review biology notes";
    maxLength = 120;
  } else if (mode === "habit") {
    title = "Add Daily Habit";
    label = "Habit";
    placeholder = "e.g. Read 20 pages";
    maxLength = 80;
  } else if (mode === "subject") {
    title = "Add Subject";
    label = "Subject";
    placeholder = "e.g. Mathematics";
    maxLength = 80;
  }

  els.addItemDialogTitle.textContent = title;
  const addItemLabel = document.querySelector('label[for="addItemInput"]');
  if (addItemLabel) {
    addItemLabel.textContent = label;
  }

  els.addItemInput.value = "";
  els.addItemInput.placeholder = placeholder;
  els.addItemInput.maxLength = maxLength;

  const showPriorityOption = mode === "todo" || mode === "habit";
  if (els.addItemPriorityWrapper) {
    els.addItemPriorityWrapper.hidden = !showPriorityOption;
  }
  if (els.addItemPriority) {
    els.addItemPriority.checked = false;
  }

  if (els.addItemDialog.hasAttribute("open")) {
    return;
  }

  if (typeof els.addItemDialog.showModal === "function") {
    els.addItemDialog.showModal();
  } else {
    els.addItemDialog.setAttribute("open", "");
  }

  setTimeout(() => {
    els.addItemInput.focus();
  }, 0);
}

function closeAddItemDialog() {
  if (!els.addItemDialog) return;

  if (typeof els.addItemDialog.close === "function") {
    els.addItemDialog.close();
  } else {
    els.addItemDialog.removeAttribute("open");
  }
}

function handleAddItemSubmit(event) {
  event.preventDefault();
  if (!els.addItemInput) return;

  const value = els.addItemInput.value.trim();
  if (!value) return;
  const isPriority = Boolean(els.addItemPriority?.checked);

  if (addDialogMode === "todo") {
    state.todos.unshift({
      id: crypto.randomUUID(),
      title: value,
      done: false,
      priority: isPriority,
      createdAt: Date.now()
    });
    saveState();
    renderTodos();
  } else if (addDialogMode === "habit") {
    state.habits.unshift({
      id: crypto.randomUUID(),
      name: value,
      priority: isPriority,
      completedDates: []
    });
    saveState();
    renderHabits();
  } else if (addDialogMode === "subject") {
    const subject = {
      id: crypto.randomUUID(),
      name: value,
      notes: "",
      resources: []
    };

    state.subjects.push(subject);
    state.selectedSubjectId = subject.id;
    saveState();
    renderSubjects();
    switchPanel("subjects");
  }

  closeAddItemDialog();
}

function renderTodos() {
  const completed = state.todos.filter((item) => item.done).length;
  els.todoProgress.textContent = `${completed}/${state.todos.length}`;

  els.todoList.innerHTML = "";
  for (const item of state.todos) {
    const li = document.createElement("li");
    li.className = "list-item";
    makeDraggableSortItem(li, "todos", item.id, renderTodos);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.done;
    checkbox.addEventListener("change", () => {
      item.done = checkbox.checked;
      saveState();
      renderTodos();
    });

    const textWrap = document.createElement("div");

    const text = document.createElement("span");
    text.className = `item-title ${item.done ? "strike" : ""}`;
    text.textContent = item.title;
    textWrap.append(text);

    if (item.priority) {
      const priorityBadge = document.createElement("span");
      priorityBadge.className = "priority-badge";
      priorityBadge.textContent = "Priority";
      textWrap.append(priorityBadge);
      li.classList.add("priority-item");
    }

    const remove = buildIconButton("Delete");
    remove.addEventListener("click", () => {
      deleteCollectionItemWithUndo({
        collectionName: "todos",
        itemId: item.id,
        deletedMessage: "To-do deleted.",
        render: renderTodos
      });
    });

    li.append(checkbox, textWrap, remove);
    els.todoList.append(li);
  }
}

function renderHabits() {
  const today = isoToday();
  els.habitStreakSummary.textContent = `${state.habits.length} habits`;
  els.habitList.innerHTML = "";

  for (const habit of state.habits) {
    const checkedToday = habit.completedDates.includes(today);
    const streak = computeStreak(habit.completedDates);

    const li = document.createElement("li");
    li.className = "list-item";
    makeDraggableSortItem(li, "habits", habit.id, renderHabits);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = checkedToday;
    checkbox.addEventListener("change", () => {
      toggleHabitForToday(habit.id, checkbox.checked);
    });

    const textWrap = document.createElement("div");
    const title = document.createElement("p");
    title.className = "item-title";
    title.textContent = habit.name;

    const sub = document.createElement("p");
    sub.className = "item-subtext";
    sub.textContent = `Current streak: ${streak} day${streak === 1 ? "" : "s"}`;

    textWrap.append(title, sub);

    if (habit.priority) {
      const priorityBadge = document.createElement("span");
      priorityBadge.className = "priority-badge";
      priorityBadge.textContent = "Priority";
      textWrap.append(priorityBadge);
      li.classList.add("priority-item");
    }

    const remove = buildIconButton("Delete");
    remove.addEventListener("click", () => {
      deleteCollectionItemWithUndo({
        collectionName: "habits",
        itemId: habit.id,
        deletedMessage: "Habit deleted.",
        render: renderHabits
      });
    });

    li.append(checkbox, textWrap, remove);
    els.habitList.append(li);
  }
}

function renderSchedule() {
  els.scheduleSummary.textContent = `${state.schedule.length} sessions`;
  els.scheduleList.innerHTML = "";

  for (const session of state.schedule) {
    const li = document.createElement("li");
    li.className = "list-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = session.done;
    checkbox.addEventListener("change", () => {
      session.done = checkbox.checked;
      saveState();
      renderSchedule();
      renderCalendar();
    });

    const textWrap = document.createElement("div");
    const title = document.createElement("p");
    title.className = `item-title ${session.done ? "strike" : ""}`;
    title.textContent = `${session.subject} · ${session.focus}`;

    const sub = document.createElement("p");
    sub.className = "item-subtext";
    sub.textContent = `${session.date} | ${session.startTime} - ${session.endTime}`;

    textWrap.append(title, sub);

    const remove = buildIconButton("Delete");
    remove.addEventListener("click", () => {
      state.schedule = state.schedule.filter((entry) => entry.id !== session.id);
      saveState();
      renderSchedule();
      renderCalendar();
    });

    li.append(checkbox, textWrap, remove);
    els.scheduleList.append(li);
  }
}

function renderCalendar() {
  const base = new Date();
  const visible = new Date(base.getFullYear(), base.getMonth() + state.calendarMonthOffset, 1);

  const year = visible.getFullYear();
  const month = visible.getMonth();
  els.calendarMonthLabel.textContent = visible.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long"
  });

  const daysHeader = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  els.calendarGrid.innerHTML = "";

  for (const day of daysHeader) {
    const head = document.createElement("div");
    head.className = "day-head";
    head.textContent = day;
    els.calendarGrid.append(head);
  }

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  for (let blank = 0; blank < firstDayIndex; blank += 1) {
    const empty = document.createElement("div");
    empty.className = "day-cell";
    els.calendarGrid.append(empty);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    const isoDate = date.toISOString().split("T")[0];
    const dayCell = document.createElement("div");
    dayCell.className = "day-cell";

    const dayLabel = document.createElement("p");
    dayLabel.textContent = String(day);
    dayCell.append(dayLabel);

    const events = state.schedule.filter((session) => session.date === isoDate);
    events.slice(0, 3).forEach((session) => {
      const eventText = document.createElement("div");
      eventText.className = "day-event";
      eventText.textContent = `${session.startTime} ${session.subject}`;
      dayCell.append(eventText);
    });

    if (events.length > 3) {
      const overflow = document.createElement("div");
      overflow.className = "day-event";
      overflow.textContent = `+${events.length - 3} more`;
      dayCell.append(overflow);
    }

    els.calendarGrid.append(dayCell);
  }
}

function renderSubjects() {
  if (!state.selectedSubjectId && state.subjects[0]) {
    state.selectedSubjectId = state.subjects[0].id;
  }

  if (els.subjectCount) {
    els.subjectCount.textContent = String(state.subjects.length);
  }

  els.subjectTabs.innerHTML = "";

  for (const subject of state.subjects) {
    const li = document.createElement("li");
    makeDraggableSortItem(li, "subjects", subject.id, renderSubjects);
    const button = document.createElement("button");

    button.type = "button";
    button.className = "subject-tab";
    button.textContent = subject.name;
    if (subject.id === state.selectedSubjectId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.selectedSubjectId = subject.id;
      saveState();
      renderSubjects();
    });

    li.append(button);
    els.subjectTabs.append(li);
  }

  const selected = getSelectedSubject();
  if (!selected) {
    els.subjectTitle.textContent = "Select a Subject";
    if (els.deleteSubjectBtn) {
      els.deleteSubjectBtn.disabled = true;
    }
    els.subjectNotes.value = "";
    els.subjectNotes.disabled = true;
    els.saveNotesBtn.disabled = true;
    els.resourceForm.querySelector("button").disabled = true;
    els.resourceLabel.disabled = true;
    els.resourceLink.disabled = true;
    els.resourceList.innerHTML = "";
    return;
  }

  els.subjectTitle.textContent = selected.name;
  if (els.deleteSubjectBtn) {
    els.deleteSubjectBtn.disabled = false;
  }
  els.subjectNotes.value = selected.notes;
  els.subjectNotes.disabled = false;
  els.saveNotesBtn.disabled = false;
  els.resourceForm.querySelector("button").disabled = false;
  els.resourceLabel.disabled = false;
  els.resourceLink.disabled = false;

  els.resourceList.innerHTML = "";
  for (const resource of selected.resources) {
    const li = document.createElement("li");
    li.className = "list-item compact-item";

    const link = document.createElement("a");
    link.href = resource.url;
    link.className = "resource-link";
    link.textContent = resource.label;
    link.target = "_blank";
    link.rel = "noreferrer noopener";

    const remove = buildIconButton("Delete");
    remove.addEventListener("click", () => {
      selected.resources = selected.resources.filter((entry) => entry.id !== resource.id);
      saveState();
      renderSubjects();
    });

    li.append(link, remove);
    els.resourceList.append(li);
  }
}

function deleteSelectedSubject() {
  const selected = getSelectedSubject();
  if (!selected) return;

  const resourceCount = selected.resources.length;
  const warningMessage = `Delete subject "${selected.name}"?\n\nThis will remove its notes and ${resourceCount} resource${resourceCount === 1 ? "" : "s"}. This cannot be undone.`;
  if (!window.confirm(warningMessage)) return;

  state.subjects = state.subjects.filter((subject) => subject.id !== selected.id);
  state.selectedSubjectId = state.subjects[0]?.id || null;
  saveState();
  renderSubjects();
}

function getSelectedSubject() {
  return state.subjects.find((subject) => subject.id === state.selectedSubjectId) || null;
}

function computeStreak(completedDates) {
  if (!completedDates.length) return 0;

  const normalized = [...new Set(completedDates)].sort();
  let streak = 0;
  let cursor = new Date();

  while (true) {
    const dateIso = cursor.toISOString().split("T")[0];
    if (normalized.includes(dateIso)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (streak === 0) {
      cursor.setDate(cursor.getDate() - 1);
      const yesterdayIso = cursor.toISOString().split("T")[0];
      if (normalized.includes(yesterdayIso)) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
    }

    break;
  }

  return streak;
}

function toggleHabitForToday(habitId, isChecked) {
  const today = isoToday();
  const habit = state.habits.find((entry) => entry.id === habitId);
  if (!habit) return;

  if (isChecked && !habit.completedDates.includes(today)) {
    habit.completedDates.push(today);
  }

  if (!isChecked) {
    habit.completedDates = habit.completedDates.filter((date) => date !== today);
  }

  saveState();
  renderHabits();
}

function buildIconButton(label) {
  const button = document.createElement("button");
  button.className = "ghost-btn icon-btn";
  button.type = "button";
  button.setAttribute("aria-label", label);

  const icon = document.createElement("span");
  icon.className = "material-symbols-outlined";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "delete";
  button.append(icon);

  return button;
}

function deleteCollectionItemWithUndo({ collectionName, itemId, deletedMessage, render }) {
  const collection = state[collectionName];
  if (!Array.isArray(collection)) return;

  const removedIndex = collection.findIndex((entry) => entry.id === itemId);
  if (removedIndex === -1) return;

  const [removedItem] = collection.splice(removedIndex, 1);
  saveState();
  render();

  showUndoToast(deletedMessage, () => {
    const targetCollection = state[collectionName];
    if (!Array.isArray(targetCollection)) return;

    const safeIndex = Math.min(removedIndex, targetCollection.length);
    targetCollection.splice(safeIndex, 0, removedItem);
    saveState();
    render();
  });
}

function showUndoToast(message, onUndo) {
  const toast = getOrCreateUndoToast();
  const messageEl = toast.querySelector(".undo-toast-message");
  if (messageEl) {
    messageEl.textContent = message;
  }

  pendingUndoAction = onUndo;
  toast.classList.add("visible");

  if (undoToastTimerId) {
    clearTimeout(undoToastTimerId);
  }

  undoToastTimerId = setTimeout(() => {
    hideUndoToast();
  }, 5000);
}

function hideUndoToast() {
  const toast = document.getElementById("undoToast");
  if (!toast) return;

  toast.classList.remove("visible");
  pendingUndoAction = null;

  if (undoToastTimerId) {
    clearTimeout(undoToastTimerId);
    undoToastTimerId = null;
  }
}

function getOrCreateUndoToast() {
  let toast = document.getElementById("undoToast");
  if (toast) return toast;

  toast = document.createElement("div");
  toast.id = "undoToast";
  toast.className = "undo-toast";

  const message = document.createElement("span");
  message.className = "undo-toast-message";

  const undoButton = document.createElement("button");
  undoButton.type = "button";
  undoButton.className = "ghost-btn undo-toast-btn";
  undoButton.textContent = "Undo";
  undoButton.addEventListener("click", () => {
    const action = pendingUndoAction;
    hideUndoToast();
    if (typeof action === "function") {
      action();
    }
  });

  toast.append(message, undoButton);
  document.body.append(toast);
  return toast;
}
