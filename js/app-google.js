function renderGoogleStatus() {
  if (!els.googleStatus) return;

  if (!state.google.clientId || !state.google.apiKey) {
    els.googleStatus.textContent = "Config Missing";
    return;
  }

  els.googleStatus.textContent = state.google.connected ? "Connected" : "Disconnected";
}

function renderGoogleEvents() {
  if (!els.googleEventsList) return;

  els.googleEventsList.innerHTML = "";
  if (!state.googleEvents.length) {
    const li = document.createElement("li");
    li.className = "list-item compact-item";
    li.textContent = "No synced events yet.";
    els.googleEventsList.append(li);
    return;
  }

  for (const event of state.googleEvents) {
    const li = document.createElement("li");
    li.className = "list-item compact-item";

    const textWrap = document.createElement("div");
    const title = document.createElement("p");
    title.className = "item-title";
    title.textContent = event.summary || "Untitled event";

    const when = document.createElement("p");
    when.className = "item-subtext";
    when.textContent = formatGoogleEventDate(event);

    textWrap.append(title, when);
    li.append(textWrap);
    els.googleEventsList.append(li);
  }
}

function initializeGoogleApis() {
  if (!state.google.clientId || !state.google.apiKey) return;

  const waitForScripts = setInterval(async () => {
    if (window.gapi && window.google?.accounts?.oauth2) {
      clearInterval(waitForScripts);

      try {
        await new Promise((resolve) => {
          gapi.load("client", resolve);
        });

        await gapi.client.init({
          apiKey: state.google.apiKey,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
        });

        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: state.google.clientId,
          scope: "https://www.googleapis.com/auth/calendar",
          callback: (tokenResponse) => {
            if (tokenResponse?.access_token) {
              state.google.accessToken = tokenResponse.access_token;
              state.google.connected = true;
              gapi.client.setToken({ access_token: tokenResponse.access_token });
              saveState();
              renderGoogleStatus();
            }
          }
        });

        gapiLoaded = true;
        gisLoaded = true;

        if (state.google.accessToken) {
          gapi.client.setToken({ access_token: state.google.accessToken });
          state.google.connected = true;
          renderGoogleStatus();
        }
      } catch (error) {
        console.error("Google API initialization failed", error);
      }
    }
  }, 250);

  setTimeout(() => clearInterval(waitForScripts), 15000);
}

function handleGoogleConnect() {
  if (!state.google.clientId || !state.google.apiKey) {
    alert("Set your Google credentials in config.local.js first.");
    return;
  }

  if (!gapiLoaded || !gisLoaded || !tokenClient) {
    initializeGoogleApis();
    setTimeout(() => {
      if (tokenClient) tokenClient.requestAccessToken({ prompt: "consent" });
    }, 400);
    return;
  }

  tokenClient.requestAccessToken({ prompt: "consent" });
}

function handleGoogleDisconnect() {
  state.google.accessToken = "";
  state.google.connected = false;
  state.googleEvents = [];

  const activeToken = window.gapi?.client?.getToken?.();
  if (window.google?.accounts?.oauth2 && activeToken) {
    google.accounts.oauth2.revoke(activeToken.access_token);
  }

  window.gapi?.client?.setToken?.(null);
  saveState();
  renderGoogleStatus();
  renderGoogleEvents();
}

async function fetchGoogleEvents() {
  if (!state.google.connected || !state.google.accessToken) {
    alert("Connect your Google account first.");
    return;
  }

  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: state.google.calendarId || "primary",
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 12,
      orderBy: "startTime"
    });

    state.googleEvents = response.result.items || [];
    saveState();
    renderGoogleEvents();
  } catch (error) {
    console.error("Failed to fetch Google events", error);
    alert("Unable to fetch events. Verify your credentials and consent screen.");
  }
}

async function syncTodayScheduleToGoogle() {
  if (!state.google.connected || !state.google.accessToken) {
    alert("Connect Google Calendar first.");
    return;
  }

  const today = isoToday();
  const todaysSessions = state.schedule.filter((entry) => entry.date === today);

  if (!todaysSessions.length) {
    alert("No study sessions scheduled for today.");
    return;
  }

  let successCount = 0;

  for (const session of todaysSessions) {
    const eventBody = {
      summary: `Study: ${session.subject}`,
      description: session.focus,
      start: {
        dateTime: `${session.date}T${session.startTime}:00`
      },
      end: {
        dateTime: `${session.date}T${session.endTime}:00`
      }
    };

    try {
      await gapi.client.calendar.events.insert({
        calendarId: state.google.calendarId || "primary",
        resource: eventBody
      });
      successCount += 1;
    } catch (error) {
      console.error("Failed to sync session", session, error);
    }
  }

  alert(`Synced ${successCount}/${todaysSessions.length} sessions to Google Calendar.`);
  fetchGoogleEvents();
}

function formatGoogleEventDate(event) {
  const startValue = event.start?.dateTime || event.start?.date;
  if (!startValue) return "Unknown date";

  const date = new Date(startValue);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
