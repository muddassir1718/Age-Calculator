import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, Auth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Calendar writable permission scope
provider.addScope("https://www.googleapis.com/auth/calendar.events");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Check stored token or verify on auth state change
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
): (() => void) => {
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
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const apiToken = credential?.accessToken;
    if (!apiToken) {
      throw new Error("Failed to get Google Calendar oauth access token.");
    }
    cachedAccessToken = apiToken;
    return { user: result.user, accessToken: apiToken };
  } catch (error) {
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
}

export const createCalendarEvent = async (
  token: string,
  event: CalendarEventPayload
): Promise<{ success: boolean; link?: string; error?: string }> => {
  try {
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
        reminders: {
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
