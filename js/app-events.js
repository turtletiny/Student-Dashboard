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

  if (els.backToSubjectsBtn) {
    els.backToSubjectsBtn.addEventListener("click", () => {
      const selectedSubject = getSelectedSubject();
      if (selectedSubject?.selectedNoteFileId) {
        selectedSubject.selectedNoteFileId = "";
        saveState();
        renderSubjects();
        return;
      }
      switchPanel("subjects");
    });
  }

  if (els.openDashboardSubjectAddBtn) {
    els.openDashboardSubjectAddBtn.addEventListener("click", () => {
      openAddItemDialog("subject");
    });
  }

  if (els.addItemForm) {
    els.addItemForm.addEventListener("submit", handleAddItemSubmit);
  }

  if (els.cancelAddItemBtn) {
    els.cancelAddItemBtn.addEventListener("click", closeAddItemDialog);
  }

  if (els.renameItemForm && els.renameItemInput) {
    els.renameItemForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = els.renameItemInput.value.trim();
      if (!value) return;
      const action = pendingRenameAction;
      closeRenameDialog();
      if (typeof action === "function") {
        action(value);
      }
    });
  }

  if (els.cancelRenameItemBtn) {
    els.cancelRenameItemBtn.addEventListener("click", closeRenameDialog);
  }

  els.saveNotesBtn.addEventListener("click", () => {
    const subject = getSelectedSubject();
    if (!subject) return;
    if (!Array.isArray(subject.notesFiles) || !subject.notesFiles.length) return;
    const selectedNoteFile = subject.notesFiles.find((file) => file.id === subject.selectedNoteFileId);
    if (!selectedNoteFile) return;
    selectedNoteFile.content = els.subjectNotes.value;
    subject.notes = selectedNoteFile.content;
    saveState();
    renderSubjects();
  });

  if (els.openNoteFileAddBtn) {
    els.openNoteFileAddBtn.addEventListener("click", () => {
      if (!getSelectedSubject()) return;
      openAddItemDialog("note-file");
    });
  }

  if (els.openResourceAddBtn) {
    els.openResourceAddBtn.addEventListener("click", () => {
      if (!getSelectedSubject()) return;
      openAddItemDialog("resource");
    });
  }

  if (els.openAssignmentAddBtn) {
    els.openAssignmentAddBtn.addEventListener("click", () => {
      if (!getSelectedSubject()) return;
      openAddItemDialog("assignment");
    });
  }

  if (els.subjectContactsInput) {
    els.subjectContactsInput.addEventListener("change", () => {
      const subject = getSelectedSubject();
      if (!subject) return;
      subject.contacts = els.subjectContactsInput.value.trim();
      saveState();
      renderSubjects();
    });
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

  if (els.contextMenuRenameBtn) {
    els.contextMenuRenameBtn.addEventListener("click", () => {
      const action = contextMenuState?.onRename;
      hideContextMenu();
      if (typeof action === "function") {
        action();
      }
    });
  }

  if (els.contextMenuEditBtn) {
    els.contextMenuEditBtn.addEventListener("click", () => {
      const action = contextMenuState?.onEdit;
      hideContextMenu();
      if (typeof action === "function") {
        action();
      }
    });
  }

  if (els.contextMenuDeleteBtn) {
    els.contextMenuDeleteBtn.addEventListener("click", () => {
      const action = contextMenuState?.onDelete;
      hideContextMenu();
      if (typeof action === "function") {
        action();
      }
    });
  }

  document.addEventListener("pointerdown", (event) => {
    if (!els.contextActionMenu || els.contextActionMenu.hidden) return;
    const clickedInsideMenu = event.target instanceof Node && els.contextActionMenu.contains(event.target);
    if (!clickedInsideMenu) {
      hideContextMenu();
    }
  }, true);

  document.addEventListener("contextmenu", () => {
    hideContextMenu();
  }, true);

  document.addEventListener("click", (event) => {
    if (!els.contextActionMenu || els.contextActionMenu.hidden) return;
    const clickedInsideMenu = event.target instanceof Node && els.contextActionMenu.contains(event.target);
    if (!clickedInsideMenu) {
      hideContextMenu();
    }
  });

  document.addEventListener("scroll", () => {
    hideContextMenu();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideContextMenu();
    }
  });

  window.addEventListener("blur", () => {
    hideContextMenu();
  });

}
