/**
 * FFCS Scraper — Background Service Worker (Manifest V3)
 *
 * Handles:
 *  - Message relay between popup and content script
 *  - chrome.storage persistence for scraped data
 *  - Faculty list fetch proxy (CORS-safe)
 */

interface ScrapeSession {
  id: string;
  timestamp: number;
  campus: string;
  courses: number;
  faculty: number;
  data: Record<string, unknown>;
}

const SESSIONS_KEY = "ffcs-scrape-sessions";

async function getSessions(): Promise<ScrapeSession[]> {
  const result = await chrome.storage.local.get(SESSIONS_KEY);
  return result[SESSIONS_KEY] ?? [];
}

async function saveSession(session: ScrapeSession): Promise<void> {
  const sessions = await getSessions();
  sessions.unshift(session);
  // Keep last 20 sessions
  const trimmed = sessions.slice(0, 20);
  await chrome.storage.local.set({ [SESSIONS_KEY]: trimmed });
}

// ─── Message Handling ──────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => {
    const msg = message as { type: string; payload?: Record<string, unknown> };

    switch (msg.type) {
      case "GET_SCRAPE_DATA": {
        // Forward to active tab's content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs[0]?.id) {
            sendResponse({ error: "No active tab found" });
            return;
          }
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: "FFCS_SCRAPER_GET_DATA" },
            (response) => {
              sendResponse(response ?? { error: "Content script not responding" });
            }
          );
        });
        return true; // keep channel open for async response
      }

      case "SAVE_SCRAPE_SESSION": {
        const session = msg.payload as unknown as ScrapeSession;
        saveSession(session).then(() => sendResponse({ ok: true }));
        return true;
      }

      case "GET_SESSIONS": {
        getSessions().then((sessions) => sendResponse({ sessions }));
        return true;
      }

      case "CLEAR_SESSIONS": {
        chrome.storage.local.remove(SESSIONS_KEY).then(() => sendResponse({ ok: true }));
        return true;
      }

      case "OPEN_PLANNER": {
        chrome.tabs.create({ url: "https://ffcsmaker.vercel.app/planner" });
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ error: `Unknown message type: ${msg.type}` });
    }

    return undefined;
  }
);

// ─── Extension Install/Update ──────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({
      ffcs_installed_at: Date.now(),
      ffcs_scrape_sessions: [],
    });
  }
});
