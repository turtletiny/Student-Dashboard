function switchPanel(targetId) {
  hideContextMenu();
  els.navButtons.forEach((button) => {
    const isSubjectsRoute = targetId === "subjects" || targetId === "subject-page";
    const matches = button.dataset.target === targetId || (isSubjectsRoute && button.dataset.target === "subjects");
    button.classList.toggle("active", matches);
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
  hideContextMenu();
  renderTodos();
  renderHabits();
  renderUpcomingAssignments();
  renderCalendar();
  renderDashboardTwoWeekCalendar();
  renderSubjects();
  renderSubjectCards();
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
  hideContextMenu();

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
  } else if (mode === "resource") {
    title = "Add Resource";
    label = "Resource title";
    placeholder = "e.g. Course notes";
    maxLength = 120;
  } else if (mode === "assignment") {
    title = "Add Assignment";
    label = "Assignment";
    placeholder = "e.g. Chapter 4 worksheet";
    maxLength = 120;
  } else if (mode === "note-file") {
    title = "Add Note File";
    label = "File name";
    placeholder = "e.g. Lecture 3 Notes";
    maxLength = 120;
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
  if (els.addItemDueDateWrapper) {
    els.addItemDueDateWrapper.hidden = mode !== "todo" && mode !== "assignment";
  }
  if (els.addItemDueDate) {
    els.addItemDueDate.hidden = mode !== "todo" && mode !== "assignment";
    els.addItemDueDate.value = "";
  }
  if (els.addItemDetailsWrapper) {
    els.addItemDetailsWrapper.hidden = mode !== "assignment";
  }
  if (els.addItemDetails) {
    els.addItemDetails.hidden = mode !== "assignment";
    els.addItemDetails.value = "";
  }
  if (els.addItemFilesWrapper) {
    els.addItemFilesWrapper.hidden = mode !== "assignment";
  }
  if (els.addItemFiles) {
    els.addItemFiles.hidden = mode !== "assignment";
    els.addItemFiles.value = "";
  }
  if (els.addItemLinkWrapper) {
    els.addItemLinkWrapper.hidden = mode !== "resource";
  }
  if (els.addItemLink) {
    els.addItemLink.hidden = mode !== "resource";
    els.addItemLink.value = "";
    els.addItemLink.required = mode === "resource";
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

async function handleAddItemSubmit(event) {
  event.preventDefault();
  if (!els.addItemInput) return;

  const value = els.addItemInput.value.trim();
  if (!value) return;
  const isPriority = Boolean(els.addItemPriority?.checked);
  const dueDate = typeof els.addItemDueDate?.value === "string" ? els.addItemDueDate.value : "";
  const details = typeof els.addItemDetails?.value === "string" ? els.addItemDetails.value.trim() : "";
  const selectedFiles = els.addItemFiles?.files ? Array.from(els.addItemFiles.files) : [];
  const link = typeof els.addItemLink?.value === "string" ? els.addItemLink.value.trim() : "";

  if (addDialogMode === "todo") {
    state.todos.unshift({
      id: crypto.randomUUID(),
      title: value,
      done: false,
      priority: isPriority,
      dueDate,
      createdAt: Date.now()
    });
    saveState();
    renderTodos();
    renderUpcomingAssignments();
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
      courseCode: "",
      contacts: "",
      outlineFile: null,
      notesFiles: [{
        id: crypto.randomUUID(),
        title: "General Notes",
        content: ""
      }],
      selectedNoteFileId: "",
      resources: [],
      assignments: []
    };
    subject.selectedNoteFileId = "";

    state.subjects.push(subject);
    state.selectedSubjectId = subject.id;
    saveState();
    renderSubjects();
    switchPanel("subjects");
  } else if (addDialogMode === "resource") {
    const subject = getSelectedSubject();
    if (!subject || !link) return;
    subject.resources.unshift({
      id: crypto.randomUUID(),
      label: value,
      url: link
    });
    saveState();
    renderSubjects();
  } else if (addDialogMode === "assignment") {
    const subject = getSelectedSubject();
    if (!subject || !dueDate) return;
    if (!Array.isArray(subject.assignments)) {
      subject.assignments = [];
    }
    const files = await Promise.all(selectedFiles.map(readFileAsDataUrl));
    subject.assignments.unshift({
      id: crypto.randomUUID(),
      title: value,
      dueDate,
      done: false,
      details,
      files
    });
    saveState();
    renderSubjects();
    renderUpcomingAssignments();
    renderCalendar();
  } else if (addDialogMode === "note-file") {
    const subject = getSelectedSubject();
    if (!subject) return;
    if (!Array.isArray(subject.notesFiles)) {
      subject.notesFiles = [];
    }
    const noteFile = {
      id: crypto.randomUUID(),
      title: value,
      content: ""
    };
    subject.notesFiles.unshift(noteFile);
    subject.selectedNoteFileId = "";
    saveState();
    renderSubjects();
  }

  closeAddItemDialog();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name || "Attachment",
        dataUrl: typeof reader.result === "string" ? reader.result : "",
        mimeType: file.type || ""
      });
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
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
    checkbox.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    checkbox.addEventListener("change", () => {
      item.done = checkbox.checked;
      saveState();
      renderTodos();
      renderUpcomingAssignments();
    });

    const textWrap = document.createElement("div");

    const text = document.createElement("span");
    text.className = `item-title ${item.done ? "strike" : ""}`;
    text.textContent = item.title;
    textWrap.append(text);

    if (item.dueDate) {
      const dueDateText = document.createElement("p");
      dueDateText.className = "item-subtext";
      dueDateText.textContent = `Due ${formatIsoDate(item.dueDate)}`;
      textWrap.append(dueDateText);
    }

    if (item.priority) {
      const priorityBadge = document.createElement("span");
      priorityBadge.className = "priority-badge";
      priorityBadge.textContent = "Priority";
      textWrap.append(priorityBadge);
      li.classList.add("priority-item");
    }

    attachContextMenu(li, {
      onRename: () => {
        openRenameDialog({
          title: "Rename To-Do",
          initialValue: item.title,
          onSave: (trimmed) => {
            item.title = trimmed;
            saveState();
            renderTodos();
            renderUpcomingAssignments();
          }
        });
      },
      onDelete: () => {
        deleteCollectionItemWithUndo({
          collectionName: "todos",
          itemId: item.id,
          deletedMessage: "To-do deleted.",
          render: () => {
            renderTodos();
            renderUpcomingAssignments();
          }
        });
      }
    });

    li.addEventListener("click", () => {
      const nextChecked = !checkbox.checked;
      checkbox.checked = nextChecked;
      item.done = nextChecked;
      saveState();
      renderTodos();
      renderUpcomingAssignments();
    });

    li.append(checkbox, textWrap);
    els.todoList.append(li);
  }
}

function renderHabits() {
  const today = isoToday();
  const completedTodayCount = state.habits.filter((habit) => habit.completedDates.includes(today)).length;
  els.habitStreakSummary.textContent = `${completedTodayCount}/${state.habits.length}`;
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
    checkbox.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    checkbox.addEventListener("change", () => {
      toggleHabitForToday(habit.id, checkbox.checked);
    });

    const textWrap = document.createElement("div");
    const title = document.createElement("p");
    title.className = "item-title";
    title.textContent = habit.name;

    const sub = document.createElement("p");
    sub.className = "item-subtext";
    sub.textContent = `Streak: ${streak} day${streak === 1 ? "" : "s"}`;

    textWrap.append(title, sub);

    if (habit.priority) {
      const priorityBadge = document.createElement("span");
      priorityBadge.className = "priority-badge";
      priorityBadge.textContent = "Priority";
      textWrap.append(priorityBadge);
      li.classList.add("priority-item");
    }

    attachContextMenu(li, {
      onRename: () => {
        openRenameDialog({
          title: "Rename Habit",
          initialValue: habit.name,
          onSave: (trimmed) => {
            habit.name = trimmed;
            saveState();
            renderHabits();
          }
        });
      },
      onDelete: () => {
        deleteCollectionItemWithUndo({
          collectionName: "habits",
          itemId: habit.id,
          deletedMessage: "Habit deleted.",
          render: renderHabits
        });
      }
    });

    li.addEventListener("click", () => {
      const nextChecked = !checkbox.checked;
      checkbox.checked = nextChecked;
      toggleHabitForToday(habit.id, nextChecked);
    });

    li.append(checkbox, textWrap);
    els.habitList.append(li);
  }
}

function renderUpcomingAssignments() {
  if (!els.upcomingAssignmentCount || !els.upcomingAssignmentsList) return;

  const todoUpcoming = state.todos
    .filter((item) => !item.done && item.dueDate)
    .map((item) => ({
      id: item.id,
      title: item.title,
      dueDate: item.dueDate,
      subjectName: "",
      details: ""
    }));
  const subjectUpcoming = state.subjects.flatMap((subject) =>
    (subject.assignments || [])
      .filter((assignment) => !assignment.done && assignment.dueDate)
      .map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        subjectName: subject.name,
        details: typeof assignment.details === "string" ? assignment.details : ""
      }))
  );
  const upcoming = [...todoUpcoming, ...subjectUpcoming].sort((left, right) => left.dueDate.localeCompare(right.dueDate));

  els.upcomingAssignmentCount.textContent = String(upcoming.length);
  els.upcomingAssignmentsList.innerHTML = "";

  if (!upcoming.length) return;

  for (const item of upcoming.slice(0, 6)) {
    const li = document.createElement("li");
    li.className = "assignment-deadline-card";

    const topBar = document.createElement("span");
    topBar.className = "assignment-card-topbar";
    li.append(topBar);

    const metaRow = document.createElement("div");
    metaRow.className = "assignment-card-meta-row";

    const subjectTag = document.createElement("span");
    subjectTag.className = "assignment-card-subject";
    subjectTag.textContent = item.subjectName || "To-Do";

    const dueTag = document.createElement("span");
    dueTag.className = "assignment-card-due";
    dueTag.textContent = formatDaysUntil(item.dueDate);
    metaRow.append(subjectTag, dueTag);

    const title = document.createElement("p");
    title.className = "assignment-card-title";
    title.textContent = item.title;

    const summary = document.createElement("p");
    summary.className = "assignment-card-summary";
    summary.textContent = item.details
      ? item.details
      : item.subjectName
        ? `Complete ${item.subjectName} work before the due date.`
        : "Complete this task before the due date.";

    const footer = document.createElement("div");
    footer.className = "assignment-card-footer";

    const typePill = document.createElement("span");
    typePill.className = "assignment-card-pill";
    typePill.textContent = item.subjectName ? "Assignment" : "Task";

    footer.append(typePill);
    li.append(metaRow, title, summary, footer);
    els.upcomingAssignmentsList.append(li);
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

  const daysHeader = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  els.calendarGrid.innerHTML = "";

  for (const day of daysHeader) {
    const head = document.createElement("div");
    head.className = "day-head";
    head.textContent = day;
    els.calendarGrid.append(head);
  }

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
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

    const todoEvents = state.todos
      .filter((item) => !item.done && item.dueDate === isoDate)
      .map((item) => ({ title: item.title }));
    const subjectEvents = state.subjects.flatMap((subject) =>
      (subject.assignments || [])
        .filter((assignment) => !assignment.done && assignment.dueDate === isoDate)
        .map((assignment) => ({ title: `${subject.name}: ${assignment.title}` }))
    );
    const events = [...todoEvents, ...subjectEvents];
    events.slice(0, 3).forEach((item) => {
      const eventText = document.createElement("div");
      eventText.className = "day-event";
      eventText.textContent = item.title;
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

function renderDashboardTwoWeekCalendar() {
  if (!els.dashboardTwoWeekGrid || !els.dashboardTwoWeekRange) return;

  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentDayIndex = (todayMidnight.getDay() + 6) % 7;
  const start = new Date(todayMidnight);
  start.setDate(todayMidnight.getDate() - currentDayIndex);

  const end = new Date(start);
  end.setDate(start.getDate() + 13);

  els.dashboardTwoWeekRange.textContent = `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  els.dashboardTwoWeekGrid.innerHTML = "";

  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const isoDate = date.toISOString().split("T")[0];

    const dayCell = document.createElement("article");
    dayCell.className = "two-week-day-cell";

    const dayHeading = document.createElement("p");
    dayHeading.className = "two-week-day-heading";
    dayHeading.textContent = date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
    dayCell.append(dayHeading);

    const todoEvents = state.todos
      .filter((item) => !item.done && item.dueDate === isoDate)
      .map((item) => item.title);
    const subjectEvents = state.subjects.flatMap((subject) =>
      (subject.assignments || [])
        .filter((assignment) => !assignment.done && assignment.dueDate === isoDate)
        .map((assignment) => `${subject.name}: ${assignment.title}`)
    );
    const events = [...todoEvents, ...subjectEvents];

    if (events.length) {
      for (const eventTitle of events.slice(0, 2)) {
        const eventRow = document.createElement("p");
        eventRow.className = "two-week-event";
        eventRow.textContent = eventTitle;
        dayCell.append(eventRow);
      }
      if (events.length > 2) {
        const overflow = document.createElement("p");
        overflow.className = "item-subtext";
        overflow.textContent = `+${events.length - 2} more`;
        dayCell.append(overflow);
      }
    }

    els.dashboardTwoWeekGrid.append(dayCell);
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
    button.className = "subject-card subject-tab";
    button.setAttribute("aria-label", `Select ${subject.name}`);

    const cover = document.createElement("span");
    cover.className = "subject-card-cover";
    cover.style.setProperty("--subject-hue", String(pickSubjectHue(subject.name)));

    const footer = document.createElement("span");
    footer.className = "subject-card-footer";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined subject-card-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "book_2";

    const title = document.createElement("span");
    title.className = "subject-card-title";
    title.textContent = subject.name;

    footer.append(icon, title);
    button.append(cover, footer);
    if (subject.id === state.selectedSubjectId) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.selectedSubjectId = subject.id;
      subject.selectedNoteFileId = "";
      saveState();
      renderSubjects();
      switchPanel("subject-page");
    });

    attachContextMenu(button, {
      onRename: () => {
        openRenameDialog({
          title: "Rename Subject",
          initialValue: subject.name,
          onSave: (trimmed) => {
            subject.name = trimmed;
            saveState();
            renderSubjects();
            renderSubjectCards();
            renderUpcomingAssignments();
            renderCalendar();
          }
        });
      },
      onDelete: () => {
        deleteSubjectById(subject.id);
      }
    });

    li.append(button);
    els.subjectTabs.append(li);
  }

  const selected = getSelectedSubject();
  if (!selected) {
    if (els.subjectPagePanel) {
      els.subjectPagePanel.classList.remove("note-selected");
      els.subjectPagePanel.classList.remove("note-browsing");
    }
    els.subjectTitle.textContent = "Select a Subject";
    els.subjectNotes.value = "";
    els.subjectNotes.disabled = true;
    els.saveNotesBtn.disabled = true;
    if (els.noteFileTabs) {
      els.noteFileTabs.innerHTML = "";
    }
    if (els.openNoteFileAddBtn) {
      els.openNoteFileAddBtn.disabled = true;
    }
    if (els.openResourceAddBtn) {
      els.openResourceAddBtn.disabled = true;
    }
    if (els.openAssignmentAddBtn) {
      els.openAssignmentAddBtn.disabled = true;
    }
    els.resourceList.innerHTML = "";
    els.subjectAssignmentList.innerHTML = "";
    if (els.noteBreadcrumb) {
      els.noteBreadcrumb.textContent = "Archive · Current Note";
    }
    if (els.noteStatusLabel) {
      els.noteStatusLabel.textContent = "Select a subject to begin.";
    }
    if (els.noteEditorHeading) {
      els.noteEditorHeading.textContent = "Current Note";
    }
    if (els.noteDraftSavedAt) {
      els.noteDraftSavedAt.textContent = "Draft mode";
    }
    if (els.noteLinkedCitations) {
      els.noteLinkedCitations.textContent = "0";
    }
    if (els.noteLinkedGraphics) {
      els.noteLinkedGraphics.textContent = "0";
    }
    if (els.subjectQuoteText) {
      els.subjectQuoteText.textContent = "\"The pen is the tongue of the mind.\"";
    }
    if (els.noteContextSubject) {
      els.noteContextSubject.textContent = "-";
    }
    if (els.subjectCourseCodeValue) {
      els.subjectCourseCodeValue.textContent = "-";
    }
    if (els.subjectContactsInput) {
      els.subjectContactsInput.value = "";
      els.subjectContactsInput.disabled = true;
    }
    if (els.subjectOutlineStatus) {
      els.subjectOutlineStatus.textContent = "No file uploaded";
    }
    if (els.noteContextAssignments) {
      els.noteContextAssignments.textContent = "0 total";
    }
    if (els.noteContextResources) {
      els.noteContextResources.textContent = "0 linked";
    }
    if (els.subjectCourseProgressBar) {
      els.subjectCourseProgressBar.style.width = "0%";
    }
    if (els.subjectCourseProgressLabel) {
      els.subjectCourseProgressLabel.textContent = "0% complete";
    }
    if (els.subjectUpcomingAssignmentsCount) {
      els.subjectUpcomingAssignmentsCount.textContent = "0";
    }
    if (els.subjectUpcomingAssignmentsList) {
      els.subjectUpcomingAssignmentsList.innerHTML = "";
    }
    return;
  }

  if (!Array.isArray(selected.notesFiles) || !selected.notesFiles.length) {
    selected.notesFiles = [{
      id: crypto.randomUUID(),
      title: "General Notes",
      content: typeof selected.notes === "string" ? selected.notes : ""
    }];
  }
  if (selected.selectedNoteFileId && !selected.notesFiles.some((file) => file.id === selected.selectedNoteFileId)) {
    selected.selectedNoteFileId = "";
  }

  const selectedNoteFile = selected.notesFiles.find((file) => file.id === selected.selectedNoteFileId) || null;
  els.subjectTitle.textContent = selectedNoteFile ? selectedNoteFile.title : selected.name;
  els.subjectNotes.disabled = false;
  els.saveNotesBtn.disabled = false;
  if (els.openNoteFileAddBtn) {
    els.openNoteFileAddBtn.disabled = false;
  }

  if (els.noteFileTabs) {
    els.noteFileTabs.innerHTML = "";
    for (const noteFile of selected.notesFiles) {
      const li = document.createElement("li");
      li.className = "note-file-item";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "note-file-card";
      if (noteFile.id === selected.selectedNoteFileId) {
        button.classList.add("active");
      }

      const fileTitle = document.createElement("p");
      fileTitle.className = "note-file-title";
      fileTitle.textContent = noteFile.title;

      button.append(fileTitle);
      button.addEventListener("click", () => {
        selected.selectedNoteFileId = noteFile.id;
        saveState();
        renderSubjects();
      });

      attachContextMenu(button, {
        onRename: () => {
          openRenameDialog({
            title: "Rename Note File",
            initialValue: noteFile.title,
            onSave: (trimmed) => {
              noteFile.title = trimmed;
              saveState();
              renderSubjects();
            }
          });
        },
        onDelete: () => {
          if (selected.notesFiles.length <= 1) {
            alert("At least one note file is required.");
            return;
          }
          selected.notesFiles = selected.notesFiles.filter((entry) => entry.id !== noteFile.id);
          if (selected.selectedNoteFileId === noteFile.id) {
            selected.selectedNoteFileId = "";
          }
          saveState();
          renderSubjects();
        }
      });

      li.append(button);
      els.noteFileTabs.append(li);
    }
  }

  if (els.subjectPagePanel) {
    els.subjectPagePanel.classList.toggle("note-selected", Boolean(selectedNoteFile));
    els.subjectPagePanel.classList.toggle("note-browsing", !selectedNoteFile);
  }
  els.subjectNotes.value = selectedNoteFile ? selectedNoteFile.content : "";
  els.subjectNotes.disabled = !selectedNoteFile;
  els.saveNotesBtn.disabled = !selectedNoteFile;
  if (els.noteBreadcrumb) {
    els.noteBreadcrumb.textContent = selectedNoteFile
      ? `Archive · ${selected.name} · ${selectedNoteFile.title}`
      : `Archive · ${selected.name} · Select a note file`;
  }
  if (els.noteStatusLabel) {
    if (selectedNoteFile) {
      const assignmentCount = (selected.assignments || []).filter((assignment) => !assignment.done).length;
      els.noteStatusLabel.textContent = `${assignmentCount} active assignment${assignmentCount === 1 ? "" : "s"}`;
      if (els.noteDraftSavedAt) {
        els.noteDraftSavedAt.textContent = "Draft mode";
      }
    } else {
      els.noteStatusLabel.textContent = "Pick a note file to open the editor.";
      if (els.noteDraftSavedAt) {
        els.noteDraftSavedAt.textContent = "No note selected";
      }
    }
  }
  if (els.noteEditorHeading) {
    els.noteEditorHeading.textContent = selectedNoteFile ? selectedNoteFile.title : "Current Note";
  }
  if (els.noteContextSubject) {
    els.noteContextSubject.textContent = selected.name;
  }
  if (els.subjectCourseCodeValue) {
    els.subjectCourseCodeValue.textContent = selected.courseCode || "-";
  }
  if (els.subjectContactsInput) {
    els.subjectContactsInput.value = typeof selected.contacts === "string" ? selected.contacts : "";
    els.subjectContactsInput.disabled = false;
  }
  if (els.subjectOutlineStatus) {
    const outline = selected.outlineFile;
    els.subjectOutlineStatus.textContent = outline?.name ? outline.name : "No file uploaded";
  }
  if (els.noteContextAssignments) {
    els.noteContextAssignments.textContent = `${(selected.assignments || []).length} total`;
  }
  if (els.noteContextResources) {
    els.noteContextResources.textContent = `${(selected.resources || []).length} linked`;
  }
  if (els.noteLinkedCitations) {
    const noteText = selectedNoteFile ? selectedNoteFile.content : "";
    const citationMatches = (noteText.match(/\[[^\]]+\]/g) || []).length;
    els.noteLinkedCitations.textContent = String(citationMatches);
  }
  if (els.noteLinkedGraphics) {
    const graphicCount = (selected.resources || []).filter((resource) =>
      /\.(png|jpe?g|gif|webp|svg|pdf)$/i.test(resource.url || "")
    ).length;
    els.noteLinkedGraphics.textContent = String(graphicCount);
  }
  if (els.subjectQuoteText) {
    els.subjectQuoteText.textContent = selectedNoteFile
      ? "\"The pen is the tongue of the mind.\""
      : "\"Start by selecting a note to enter focus mode.\"";
  }
  renderSubjectPageSummary(selected);
  if (els.openResourceAddBtn) {
    els.openResourceAddBtn.disabled = false;
  }
  if (els.openAssignmentAddBtn) {
    els.openAssignmentAddBtn.disabled = false;
  }

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

    attachContextMenu(li, {
      onRename: () => {
        openRenameDialog({
          title: "Rename Resource",
          initialValue: resource.label,
          onSave: (trimmed) => {
            resource.label = trimmed;
            saveState();
            renderSubjects();
          }
        });
      },
      onDelete: () => {
        selected.resources = selected.resources.filter((entry) => entry.id !== resource.id);
        saveState();
        renderSubjects();
      }
    });

    li.append(link);
    els.resourceList.append(li);
  }

  els.subjectAssignmentList.innerHTML = "";
  for (const assignment of selected.assignments || []) {
    const li = document.createElement("li");
    li.className = "list-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(assignment.done);
    checkbox.addEventListener("change", () => {
      assignment.done = checkbox.checked;
      saveState();
      renderSubjects();
      renderUpcomingAssignments();
      renderCalendar();
    });

    const textWrap = document.createElement("div");
    const title = document.createElement("p");
    title.className = `item-title ${assignment.done ? "strike" : ""}`;
    title.textContent = assignment.title;
    textWrap.append(title);

    if (assignment.dueDate) {
      const due = document.createElement("p");
      due.className = "item-subtext";
      due.textContent = `Due ${formatIsoDate(assignment.dueDate)}`;
      textWrap.append(due);
    }

    if (assignment.details) {
      const details = document.createElement("p");
      details.className = "item-subtext";
      details.textContent = assignment.details;
      textWrap.append(details);
    }

    if (Array.isArray(assignment.files) && assignment.files.length) {
      const filesWrap = document.createElement("div");
      filesWrap.className = "assignment-files-row";

      for (const file of assignment.files) {
        if (!file?.dataUrl) continue;
        const fileLink = document.createElement("a");
        fileLink.className = "assignment-file-link";
        fileLink.href = file.dataUrl;
        fileLink.download = file.name || "attachment";
        fileLink.textContent = file.name || "Attachment";
        filesWrap.append(fileLink);
      }

      if (filesWrap.childElementCount) {
        textWrap.append(filesWrap);
      }
    }

    attachContextMenu(li, {
      onRename: () => {
        openRenameDialog({
          title: "Rename Assignment",
          initialValue: assignment.title,
          onSave: (trimmed) => {
            assignment.title = trimmed;
            saveState();
            renderSubjects();
            renderUpcomingAssignments();
            renderCalendar();
          }
        });
      },
      onDelete: () => {
        selected.assignments = selected.assignments.filter((entry) => entry.id !== assignment.id);
        saveState();
        renderSubjects();
        renderUpcomingAssignments();
        renderCalendar();
      }
    });

    li.append(checkbox, textWrap);
    els.subjectAssignmentList.append(li);
  }

  renderSubjectCards();
}

function renderSubjectCards() {
  if (els.dashboardSubjectCount) {
    els.dashboardSubjectCount.textContent = String(state.subjects.length);
  }

  if (!els.dashboardSubjectCards) return;
  els.dashboardSubjectCards.innerHTML = "";

  if (!state.subjects.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "subject-card-empty";
    emptyItem.textContent = "No subjects yet. Add one to get started.";
    els.dashboardSubjectCards.append(emptyItem);
    return;
  }

  for (const subject of state.subjects) {
    const li = document.createElement("li");
    li.className = "subject-card-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "subject-card";
    if (subject.id === state.selectedSubjectId) {
      button.classList.add("active");
    }
    button.setAttribute("aria-label", `Open ${subject.name}`);

    const cover = document.createElement("span");
    cover.className = "subject-card-cover";
    cover.style.setProperty("--subject-hue", String(pickSubjectHue(subject.name)));

    const footer = document.createElement("span");
    footer.className = "subject-card-footer";

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined subject-card-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "book_2";

    const title = document.createElement("span");
    title.className = "subject-card-title";
    title.textContent = subject.name;

    footer.append(icon, title);
    button.append(cover, footer);

    button.addEventListener("click", () => {
      state.selectedSubjectId = subject.id;
      subject.selectedNoteFileId = "";
      saveState();
      renderSubjects();
      switchPanel("subject-page");
    });

    attachContextMenu(button, {
      onRename: () => {
        openRenameDialog({
          title: "Rename Subject",
          initialValue: subject.name,
          onSave: (trimmed) => {
            subject.name = trimmed;
            saveState();
            renderSubjects();
            renderSubjectCards();
            renderUpcomingAssignments();
            renderCalendar();
          }
        });
      },
      onDelete: () => {
        deleteSubjectById(subject.id);
      }
    });

    li.append(button);
    els.dashboardSubjectCards.append(li);
  }
}

function renderSubjectPageSummary(subject) {
  const assignments = Array.isArray(subject.assignments) ? subject.assignments : [];
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((assignment) => assignment.done).length;
  const progressPercent = totalAssignments ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  if (els.subjectCourseProgressBar) {
    els.subjectCourseProgressBar.style.width = `${progressPercent}%`;
  }
  if (els.subjectCourseProgressLabel) {
    els.subjectCourseProgressLabel.textContent = `${progressPercent}% complete`;
  }

  if (!els.subjectUpcomingAssignmentsList || !els.subjectUpcomingAssignmentsCount) return;

  const upcoming = assignments
    .filter((assignment) => !assignment.done && assignment.dueDate)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

  els.subjectUpcomingAssignmentsCount.textContent = String(upcoming.length);
  els.subjectUpcomingAssignmentsList.innerHTML = "";

  if (!upcoming.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "list-item compact-item";
    emptyItem.textContent = "No upcoming assignments.";
    els.subjectUpcomingAssignmentsList.append(emptyItem);
    return;
  }

  for (const assignment of upcoming.slice(0, 5)) {
    const li = document.createElement("li");
    li.className = "list-item compact-item";

    const wrap = document.createElement("div");
    const title = document.createElement("p");
    title.className = "item-title";
    title.textContent = assignment.title;

    const due = document.createElement("p");
    due.className = "item-subtext";
    due.textContent = `Due ${formatIsoDate(assignment.dueDate)}`;

    wrap.append(title, due);
    li.append(wrap);
    els.subjectUpcomingAssignmentsList.append(li);
  }
}

function pickSubjectHue(name) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 360;
  }
  return hash;
}

function formatIsoDate(isoDate) {
  if (!isoDate) return "No date";
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function formatDaysUntil(isoDate) {
  if (!isoDate) return "No due date";
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueDate = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) return formatIsoDate(isoDate);
  const msInDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((dueDate.getTime() - todayMidnight.getTime()) / msInDay);
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "1 day left";
  return `${diffDays} days left`;
}

function deleteSubjectById(subjectId) {
  const selected = state.subjects.find((subject) => subject.id === subjectId);
  if (!selected) return;

  const resourceCount = selected.resources.length;
  const assignmentCount = (selected.assignments || []).length;
  const warningMessage = `Delete subject "${selected.name}"?\n\nThis will remove its notes, ${resourceCount} resource${resourceCount === 1 ? "" : "s"}, and ${assignmentCount} assignment${assignmentCount === 1 ? "" : "s"}. This cannot be undone.`;
  if (!window.confirm(warningMessage)) return;

  state.subjects = state.subjects.filter((subject) => subject.id !== subjectId);
  state.selectedSubjectId = state.subjects[0]?.id || null;
  saveState();
  renderSubjects();
  renderSubjectCards();
  renderUpcomingAssignments();
  renderCalendar();
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

function attachContextMenu(targetElement, actions) {
  targetElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    hideContextMenu();
    showContextMenu(event.clientX, event.clientY, actions);
  });
}

function showContextMenu(x, y, actions) {
  if (!els.contextActionMenu || !els.contextMenuRenameBtn || !els.contextMenuDeleteBtn) return;
  const hasRename = typeof actions?.onRename === "function";
  const hasDelete = typeof actions?.onDelete === "function";
  if (!hasRename && !hasDelete) {
    hideContextMenu();
    return;
  }

  contextMenuState = actions;
  els.contextMenuRenameBtn.hidden = !hasRename;
  els.contextMenuDeleteBtn.hidden = !hasDelete;

  const menu = els.contextActionMenu;
  menu.hidden = false;
  menu.style.left = "0px";
  menu.style.top = "0px";

  const padding = 8;
  const maxLeft = Math.max(padding, window.innerWidth - menu.offsetWidth - padding);
  const maxTop = Math.max(padding, window.innerHeight - menu.offsetHeight - padding);
  const safeLeft = Math.min(Math.max(x, padding), maxLeft);
  const safeTop = Math.min(Math.max(y, padding), maxTop);

  menu.style.left = `${safeLeft}px`;
  menu.style.top = `${safeTop}px`;
}

function hideContextMenu() {
  if (!els.contextActionMenu) return;
  els.contextActionMenu.hidden = true;
  contextMenuState = null;
}

function openRenameDialog({ title, initialValue, onSave }) {
  if (!els.renameItemDialog || !els.renameItemDialogTitle || !els.renameItemInput) return;
  hideContextMenu();
  pendingRenameAction = typeof onSave === "function" ? onSave : null;
  els.renameItemDialogTitle.textContent = title || "Rename";
  els.renameItemInput.value = initialValue || "";

  if (typeof els.renameItemDialog.showModal === "function") {
    els.renameItemDialog.showModal();
  } else {
    els.renameItemDialog.setAttribute("open", "");
  }

  setTimeout(() => {
    els.renameItemInput.focus();
    els.renameItemInput.select();
  }, 0);
}

function closeRenameDialog() {
  if (!els.renameItemDialog) return;
  if (typeof els.renameItemDialog.close === "function") {
    els.renameItemDialog.close();
  } else {
    els.renameItemDialog.removeAttribute("open");
  }
  pendingRenameAction = null;
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
