import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  Auth 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Calendar permission scope
provider.addScope("https://www.googleapis.com/auth/calendar.events");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Check stored token or verify on auth state change
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
): (() => void) => {
  // Catch redirect login results on app startup (crucial for Android WebView redirections fallback)
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const apiToken = credential?.accessToken;
        if (apiToken) {
          cachedAccessToken = apiToken;
          if (onAuthSuccess) {
            onAuthSuccess(result.user, apiToken);
          }
        }
      }
    })
    .catch((error) => {
      console.error("Firebase Auth Redirect Result Retrieval Error: ", error);
    });

  // We can load cached token temporarily from local variable during runtime session.
  // Note: Guideline says: "Do NOT store the access token in localStorage or sessionStorage"
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // Detect general WebView wrappers on iOS/Android or specific environment indicators 
    const ua = navigator.userAgent || "";
    const isWebView = /wv|Android|iPhone|iPod|iPad/i.test(ua) && !(window as any).chrome;

    if (isWebView) {
      console.log("Android App WebView wrapper detected. Processing Redirect login flow...");
      await signInWithRedirect(auth, provider);
      return null; // The page will reload/redirect immediately
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const apiToken = credential?.accessToken;
    if (!apiToken) {
      throw new Error("Failed to get Google Calendar oauth access token.");
    }
    cachedAccessToken = apiToken;
    return { user: result.user, accessToken: apiToken };
  } catch (error: any) {
    // If popups are disabled, blocked or unsupported by the browser wrapper environment, fall back gracefully to redirects
    if (
      error && 
      (error.code === "auth/operation-not-supported-in-this-environment" || 
       error.code === "auth/popup-blocked" || 
       error.message?.includes("operation-not-supported"))
    ) {
      console.warn("Popup authentication is unsupported here. Triggering redirect authentication instead...");
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectErr) {
        console.error("Failed to fallback redirect auth:", redirectErr);
        throw redirectErr;
      }
    }

    if (error && (error.code === "auth/popup-closed-by-user" || error.message?.includes("popup-closed-by-user"))) {
      console.warn("User closed the Google Authentication popup window.");
      return null;
    }
    console.error("Firebase Google Sign In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Google Calendar Event Creator
export interface CalendarEventPayload {
  summary: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  recurrenceRule?: string; // e.g., "RRULE:FREQ=YEARLY"
  reminders?: {
    emailOnDay?: boolean;    // Get email on the day itself
    emailDayBefore?: boolean; // Get email 1 day before
    popupOnDay?: boolean;     // Popup notification on the day itself
  };
}

export const createCalendarEvent = async (
  token: string,
  event: CalendarEventPayload
): Promise<{ success: boolean; link?: string; error?: string }> => {
  try {
    const overrides: Array<{ method: "email" | "popup"; minutes: number }> = [];
    
    if (event.reminders) {
      if (event.reminders.emailOnDay) {
        overrides.push({ method: "email", minutes: 0 }); // At 9:00 AM on the day of the event
      }
      if (event.reminders.emailDayBefore) {
        overrides.push({ method: "email", minutes: 1440 }); // At 9:00 AM one day before (24 hours = 1440 mins)
      }
      if (event.reminders.popupOnDay) {
        overrides.push({ method: "popup", minutes: 0 }); // Notification on the day itself
      }
    }

    const hasReminders = overrides.length > 0;

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        start: {
          date: event.startDate,
          timeZone: "UTC",
        },
        end: {
          date: event.endDate,
          timeZone: "UTC",
        },
        recurrence: event.recurrenceRule ? [event.recurrenceRule] : undefined,
        reminders: hasReminders
          ? {
              useDefault: false,
              overrides,
            }
          : {
              useDefault: true,
            },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, link: data.htmlLink };
  } catch (error: any) {
    console.error("Create calendar event failed: ", error);
    return { success: false, error: error.message || String(error) };
  }
};

