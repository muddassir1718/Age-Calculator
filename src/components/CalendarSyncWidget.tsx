import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "firebase/auth";
import { Calendar, Check, LogOut, Loader2, Sparkles, HelpCircle } from "lucide-react";
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  createCalendarEvent, 
  CalendarEventPayload 
} from "../utils/calendarAuth";

interface CalendarSyncWidgetProps {
  lang: "en" | "bn";
  formData: {
    startDay: string;
    startMonth: string;
    startYear: string;
    endDay: string;
    endMonth: string;
    endYear: string;
    mode: "today" | "custom";
  };
  dict: any;
}

export const CalendarSyncWidget: React.FC<CalendarSyncWidgetProps> = ({ lang, formData, dict }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; link?: string; err?: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse birthday date info
  const startDayNum = parseInt(formData.startDay);
  const startMonthNum = parseInt(formData.startMonth);
  const startYearNum = parseInt(formData.startYear);
  const hasValidStart = !isNaN(startDayNum) && !isNaN(startMonthNum) && !isNaN(startYearNum);

  useEffect(() => {
    const unsub = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setIsInitialized(true);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsInitialized(true);
      }
    );
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setSyncStatus(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setSyncStatus(null);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerSyncToCalendar = async () => {
    if (!token || !hasValidStart) return;
    
    // Hide confirm modal
    setShowConfirm(false);
    setSyncing(true);
    setSyncStatus(null);

    // Format start and end date (all-day event)
    const formattedMonth = String(startMonthNum).padStart(2, '0');
    const formattedDay = String(startDayNum).padStart(2, '0');
    
    // Next occurance starting year
    const currentYear = new Date().getFullYear();
    const eventStartDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
    
    // Day after for all-day duration end (exclusive in Google Calendar allDay events)
    const startDateObj = new Date(currentYear, startMonthNum - 1, startDayNum);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 1);

    const endYearStr = endDateObj.getFullYear();
    const endMonthStr = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDayStr = String(endDateObj.getDate()).padStart(2, '0');
    const eventEndDate = `${endYearStr}-${endMonthStr}-${endDayStr}`;

    const summary = lang === "bn" ? "🎂 জন্মবার্ষিকী উদযাপন" : "🎂 Birthday Anniversary";
    const description = lang === "bn" 
      ? `ক্রনিকল বয়স ও কালপঞ্জি ক্যানভাস অ্যাপের সহায়তায় সংরক্ষিত হয়েছে। জন্ম তারিখ: ${formData.startDay}/${formData.startMonth}/${formData.startYear}`
      : `Saved via Chronicle Age & Time Canvas. Accurate birth anniversary calculated starting from ${formData.startDay}/${formData.startMonth}/${formData.startYear}`;

    const payload: CalendarEventPayload = {
      summary,
      description,
      startDate: eventStartDate,
      endDate: eventEndDate,
      recurrenceRule: "RRULE:FREQ=YEARLY", // Yearly repeating event
    };

    const res = await createCalendarEvent(token, payload);
    if (res.success) {
      setSyncStatus({ success: true, link: res.link });
    } else {
      setSyncStatus({ success: false, err: res.error });
    }
    setSyncing(false);
  };

  const formattedBirthdayString = hasValidStart 
    ? `${String(startDayNum).padStart(2, '0')}/${String(startMonthNum).padStart(2, '0')} (${lang === "bn" ? "প্রতি বছর" : "Every Year"})`
    : "";

  return (
    <div className="bg-surface/85 backdrop-blur-md border border-text-muted/10 p-6 rounded-2xl shadow-xl flex flex-col gap-4 mt-6">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-text-muted/10 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent animate-pulse" />
          <h3 className="font-serif italic font-black text-lg text-text-main">
            {lang === "bn" ? "গুগল ক্যালেন্ডার সিনক্রোনাইজ" : "Google Calendar Sync"}
          </h3>
        </div>
        {user && (
          <button 
            onClick={handleLogout} 
            title={lang === "bn" ? "সাইন আউট" : "Sign Out"}
            className="p-1.5 rounded-lg border border-text-muted/15 hover:bg-red-500/10 hover:border-red-500/30 text-text-muted hover:text-red-500 transition-colors flex items-center justify-center cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs text-text-muted leading-relaxed">
        {lang === "bn" 
          ? "আপনার জন্মতারিখটিকে গুগল ক্যালেন্ডারে একটি বার্ষিক পুনরাবৃত্তিমূলক ইভেন্ট হিসেবে সরাসরি যুক্ত করুন যাতে কোনো বছর এটি ভুলে না যান।" 
          : "Add your birthday dynamically as an annual recurring event to your primary Google Calendar so you never miss another anniversary celebration."}
      </p>

      {/* Auth State Manager */}
      {!isInitialized ? (
        <div className="py-4 flex items-center justify-center gap-2 text-text-muted text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          <span>{lang === "bn" ? "লোডিং..." : "Initializing connection..."}</span>
        </div>
      ) : !user ? (
        <div className="py-3 flex flex-col items-center gap-3">
          {/* Symmetrical material Google Sign In button */}
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="gsi-material-button w-full sm:w-auto relative cursor-pointer group flex items-center justify-center gap-3 pl-3 pr-4 py-2 bg-text-main hover:bg-text-main/90 text-background font-sans font-semibold text-sm rounded-xl transition-all duration-300 hover:shadow-md disabled:opacity-50"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-background" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block flex-shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            <span className="gsi-material-button-contents text-xs md:text-sm">
              {lang === "bn" ? "গুগল অ্যাকাউন্ট দিয়ে লগইন করুন" : "Connect Google Account"}
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Signed status info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-text-muted/5">
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="U" 
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-accent/20" 
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs">
                  {user.displayName ? user.displayName[0] : "U"}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-main truncate max-w-[170px] sm:max-w-[200px]">
                  {user.displayName}
                </span>
                <span className="text-[10px] text-text-muted font-mono">
                  {lang === "bn" ? "সংযুক্ত আছে" : "Connected"}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-mono font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {lang === "bn" ? "অনলাইন" : "Ready"}
            </span>
          </div>

          {/* Sync Trigger block */}
          {hasValidStart ? (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                    {lang === "bn" ? "ইভেন্টের নাম ও ধরণ" : "Event details to sync"}
                  </span>
                  <span className="text-sm font-semibold text-text-main mt-0.5">
                    🎂 {lang === "bn" ? "জন্মবার্ষিকী উদযাপন" : "Birthday Celebration"}
                  </span>
                  <span className="text-xs text-text-muted mt-0.5 font-mono">
                    📅 {formattedBirthdayString}
                  </span>
                </div>

                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={syncing}
                  className="px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
                >
                  {syncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                  {lang === "bn" ? "ক্যালেন্ডারে যুক্ত করুন" : "Sync Birthday"}
                </button>
              </div>

              {/* Status messages mapping */}
              <AnimatePresence>
                {syncStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                      syncStatus.success 
                        ? "bg-green-500/15 border-green-500/20 text-green-500" 
                        : "bg-red-500/15 border-red-500/20 text-red-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-bold font-serif">
                        {syncStatus.success 
                          ? (lang === "bn" ? "সফলভাবে যুক্ত করা হয়েছে!" : "Successfully synchronized!") 
                          : (lang === "bn" ? "সংযোগ ব্যর্থ হয়েছে" : "Synchronization failed")}
                      </span>
                    </div>
                    {syncStatus.success && syncStatus.link && (
                      <a 
                        href={syncStatus.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[11px] underline font-medium text-text-main hover:text-accent transition-colors flex items-center gap-1 self-start pointer-events-auto cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-accent" />
                        {lang === "bn" ? "গুগল ক্যালেন্ডারে ইভেন্টটি দেখুন ↗" : "View created event in Google Calendar ↗"}
                      </a>
                    )}
                    {!syncStatus.success && syncStatus.err && (
                      <span className="text-[10px] text-red-400 font-mono italic">
                        Error: {syncStatus.err}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <span className="text-xs text-text-muted justify-center text-center italic py-2">
              {lang === "bn" ? "দয়া করে প্রথমে উপরে আপনার সঠিক জন্মতারিখ লিখুন।" : "Please input your valid birth date above first."}
            </span>
          )}
        </div>
      )}

      {/* Confirmation Overlay Modal Modal to adhere to user confirmation requirement */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface border border-accent/20 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center items-center"
            >
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                <HelpCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-serif italic font-black text-lg text-text-main">
                  {lang === "bn" ? "গুগল ক্যালেন্ডারে যোগ করবেন?" : "Add Birthday to Google Calendar?"}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed max-w-sm">
                  {lang === "bn" 
                    ? `ইভেন্টটি প্রতি বছরের ${formData.startDay}/${formData.startMonth} তারিখে আপনার নিজের প্রাথমিক গুগল ক্যালেন্ডারে পুনরাবৃত্তিমূলক ইভেন্ট হিসেবে সংরক্ষিত হবে। আপনি কি নিশ্চিত?`
                    : `This will create an annual recurring and everlasting custom calendar event on your Google Account with absolute precision. Proceed?`}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-text-muted/20 hover:bg-background text-text-muted transition-colors cursor-pointer"
                >
                  {lang === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  onClick={triggerSyncToCalendar}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20 transition-all cursor-pointer"
                >
                  {lang === "bn" ? "হ্যাঁ, যোগ করুন" : "Yes, Add Event"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
