function initializeCloudSync() {
  if (!isCloudSyncConfigured()) return;
  if (!window.supabase?.createClient) return;

  try {
    cloudSyncClient = window.supabase.createClient(SUPABASE_SYNC_CONFIG.url, SUPABASE_SYNC_CONFIG.anonKey);

    hydrateStateFromCloud().then(() => {
      cloudSyncReady = true;
    });
  } catch (error) {
    console.error("Cloud sync initialization failed", error);
  }
}

async function hydrateStateFromCloud() {
  if (!cloudSyncClient) return;

  try {
    const { data, error } = await cloudSyncClient
      .from(SUPABASE_SYNC_CONFIG.table)
      .select("data, updated_at")
      .eq("id", SUPABASE_SYNC_CONFIG.rowId)
      .maybeSingle();

    if (error) {
      console.error("Cloud sync fetch failed", error);
      return;
    }

    if (!data || !data.data) {
      await pushStateToCloud();
      return;
    }

    const remoteState = normalizeState({
      ...data.data,
      updatedAt: typeof data.updated_at === "number" ? data.updated_at : data.data.updatedAt
    });

    if ((remoteState.updatedAt || 0) > (state.updatedAt || 0)) {
      state = remoteState;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      return;
    }

    if ((state.updatedAt || 0) > (remoteState.updatedAt || 0)) {
      await pushStateToCloud();
    }
  } catch (error) {
    console.error("Cloud sync fetch failed", error);
  }
}

function queueCloudSyncSave() {
  if (!cloudSyncReady) return;

  if (cloudSyncSaveTimerId) {
    clearTimeout(cloudSyncSaveTimerId);
  }

  cloudSyncSaveTimerId = setTimeout(() => {
    pushStateToCloud();
  }, 300);
}

async function pushStateToCloud() {
  if (!cloudSyncClient) return;

  try {
    const payload = {
      id: SUPABASE_SYNC_CONFIG.rowId,
      updated_at: state.updatedAt || Date.now(),
      data: state
    };

    const { error } = await cloudSyncClient.from(SUPABASE_SYNC_CONFIG.table).upsert(payload, {
      onConflict: "id"
    });

    if (error) {
      console.error("Cloud sync save failed", error);
    }
  } catch (error) {
    console.error("Cloud sync save failed", error);
  }
}
