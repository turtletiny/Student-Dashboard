function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchPanel(button.dataset.target);
    });
  });

  if (els.openTodoAddBtn) {
    els.openTodoAddBtn.addEventListener("click", () => {
      openAddItemDialog("todo");
    });
  }

  if (els.openHabitAddBtn) {
    els.openHabitAddBtn.addEventListener("click", () => {
      openAddItemDialog("habit");
    });
  }

  if (els.openSubjectAddBtn) {
    els.openSubjectAddBtn.addEventListener("click", () => {
      openAddItemDialog("subject");
    });
  }

  if (els.addItemForm) {
    els.addItemForm.addEventListener("submit", handleAddItemSubmit);
  }

  if (els.cancelAddItemBtn) {
    els.cancelAddItemBtn.addEventListener("click", closeAddItemDialog);
  }

  els.scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const subject = document.getElementById("scheduleSubject").value.trim();
    const date = document.getElementById("scheduleDate").value;
    const startTime = document.getElementById("scheduleStart").value;
    const endTime = document.getElementById("scheduleEnd").value;
    const focus = document.getElementById("scheduleFocus").value.trim();

    if (!subject || !date || !startTime || !endTime || !focus) return;
    if (endTime <= startTime) {
      alert("End time must be after start time.");
      return;
    }

    state.schedule.push({
      id: crypto.randomUUID(),
      subject,
      date,
      startTime,
      endTime,
      focus,
      done: false
    });

    state.schedule.sort((a, b) => {
      const left = `${a.date}T${a.startTime}`;
      const right = `${b.date}T${b.startTime}`;
      return left.localeCompare(right);
    });

    els.scheduleForm.reset();
    saveState();
    renderSchedule();
    renderCalendar();
  });

  els.saveNotesBtn.addEventListener("click", () => {
    const subject = getSelectedSubject();
    if (!subject) return;
    subject.notes = els.subjectNotes.value;
    saveState();
    renderSubjects();
  });

  els.resourceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const subject = getSelectedSubject();
    if (!subject) return;

    const label = els.resourceLabel.value.trim();
    const url = els.resourceLink.value.trim();
    if (!label || !url) return;

    subject.resources.unshift({
      id: crypto.randomUUID(),
      label,
      url
    });

    els.resourceForm.reset();
    saveState();
    renderSubjects();
  });

  els.newSubjectQuickBtn.addEventListener("click", () => {
    switchPanel("subjects");
    openAddItemDialog("subject");
  });

  if (els.deleteSubjectBtn) {
    els.deleteSubjectBtn.addEventListener("click", deleteSelectedSubject);
  }

  els.prevMonthBtn.addEventListener("click", () => {
    state.calendarMonthOffset -= 1;
    saveState();
    renderCalendar();
  });

  els.nextMonthBtn.addEventListener("click", () => {
    state.calendarMonthOffset += 1;
    saveState();
    renderCalendar();
  });

  if (els.googleConnectBtn) {
    els.googleConnectBtn.addEventListener("click", handleGoogleConnect);
  }

  if (els.googleDisconnectBtn) {
    els.googleDisconnectBtn.addEventListener("click", handleGoogleDisconnect);
  }

  if (els.fetchEventsBtn) {
    els.fetchEventsBtn.addEventListener("click", fetchGoogleEvents);
  }

  if (els.syncTodayBtn) {
    els.syncTodayBtn.addEventListener("click", syncTodayScheduleToGoogle);
  }
}
