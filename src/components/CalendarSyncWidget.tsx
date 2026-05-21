import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "firebase/auth";
import { 
  Calendar, 
  Check, 
  LogOut, 
  Loader2, 
  Sparkles, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Users, 
  Gift, 
  Bell, 
  Mail, 
  X, 
  ChevronRight, 
  Clock,
  ExternalLink,
  Edit2,
  CalendarDays,
  Copy
} from "lucide-react";
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  createCalendarEvent, 
  CalendarEventPayload
} from "../utils/calendarAuth";
import { calculateAge } from "../utils/dateUtils";

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

interface SavedBirthday {
  id: string;
  name: string;
  day: number;
  month: number;
  year?: number;
  relation: "friend" | "family" | "special" | "colleague" | "other";
  note: string;
  synced?: boolean;
  syncedLink?: string;
}

const translateNumber = (num: number | string, lang: "en" | "bn"): string => {
  if (lang !== "bn") return num.toString();
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num
    .toString()
    .split("")
    .map((digit) => {
      const parsed = parseInt(digit);
      return isNaN(parsed) ? digit : bengaliDigits[parsed];
    })
    .join("");
};

function getNextBirthdayWeeksDays(day: number, month: number) {
  const today = new Date();
  const currentYear = today.getFullYear();
  let nextBD = new Date(currentYear, month - 1, day);
  
  if (nextBD < today) {
    nextBD.setFullYear(currentYear + 1);
  }
  
  const diffTime = nextBD.getTime() - today.getTime();
  const totalDiffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return totalDiffDays;
}

export const CalendarSyncWidget: React.FC<CalendarSyncWidgetProps> = ({ lang, formData, dict }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Local state for Saved Birthday Book
  const [savedList, setSavedList] = useState<SavedBirthday[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Custom Form fields
  const [newName, setNewName] = useState("");
  const [newDay, setNewDay] = useState("");
  const [newMonth, setNewMonth] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newRelation, setNewRelation] = useState<SavedBirthday["relation"]>("friend");
  const [newNote, setNewNote] = useState("");

  // Edit Mode state variables
  const [editTarget, setEditTarget] = useState<SavedBirthday | null>(null);
  const [editName, setEditName] = useState("");
  const [editDay, setEditDay] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editRelation, setEditRelation] = useState<SavedBirthday["relation"]>("friend");
  const [editNote, setEditNote] = useState("");

  // Sync Manager Modal State
  const [syncTarget, setSyncTarget] = useState<SavedBirthday | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessResult, setSyncSuccessResult] = useState<{ link?: string; name: string } | null>(null);
  
  // Google Calendar Hub modal state
  const [showCalendarHub, setShowCalendarHub] = useState(false);
  const [activeHubTab, setActiveHubTab] = useState<"sync" | "android">("sync");
  const [androidLang, setAndroidLang] = useState<"kotlin" | "java">("kotlin");
  const [codeCopied, setCodeCopied] = useState(false);

  // Reminder settings inside Sync Modal
  const [emailOnDay, setEmailOnDay] = useState(true);
  const [emailDayBefore, setEmailDayBefore] = useState(true);
  const [popupOnDay, setPopupOnDay] = useState(false);

  // Parse birthday date info for Main User
  const startDayNum = parseInt(formData.startDay);
  const startMonthNum = parseInt(formData.startMonth);
  const startYearNum = parseInt(formData.startYear);
  const hasValidStart = !isNaN(startDayNum) && !isNaN(startMonthNum) && !isNaN(startYearNum);

  // Load Saved birthdays on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chronicle-birthday-book");
      if (stored) {
        setSavedList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved birthday book:", e);
    }

    // Initialize Google API Auth
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

  // Save changes to local volume
  const updateSavedList = (newList: SavedBirthday[]) => {
    setSavedList(newList);
    localStorage.setItem("chronicle-birthday-book", JSON.stringify(newList));
  };

  const handleAddNewBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseInt(newDay);
    const m = parseInt(newMonth);
    const y = parseInt(newYear);

    if (!newName.trim() || isNaN(d) || isNaN(m)) {
      alert(lang === "bn" ? "দয়া করে নাম এবং সঠিক জন্মতারিখ লিখুন!" : "Please fill name and correct birthday!");
      return;
    }

    if (d < 1 || d > 31 || m < 1 || m > 12) {
      alert(lang === "bn" ? "ভুল তারিখ প্রদান করা হয়েছে" : "Invalid date ranges provided");
      return;
    }

    const newItem: SavedBirthday = {
      id: crypto.randomUUID(),
      name: newName,
      day: d,
      month: m,
      year: isNaN(y) || y < 1 ? undefined : y,
      relation: newRelation,
      note: newNote,
      synced: false
    };

    const updated = [newItem, ...savedList];
    updateSavedList(updated);
    
    // Clear form inputs
    setNewName("");
    setNewDay("");
    setNewMonth("");
    setNewYear("");
    setNewRelation("friend");
    setNewNote("");
    setShowAddForm(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    const d = parseInt(editDay);
    const m = parseInt(editMonth);
    const y = parseInt(editYear);

    if (!editName.trim() || isNaN(d) || isNaN(m)) {
      alert(lang === "bn" ? "দয়া করে নাম এবং সঠিক জন্মতারিখ লিখুন!" : "Please fill name and correct birthday!");
      return;
    }

    if (d < 1 || d > 31 || m < 1 || m > 12) {
      alert(lang === "bn" ? "ভুল তারিখ প্রদান করা হয়েছে" : "Invalid date ranges provided");
      return;
    }

    const updated = savedList.map((item) => {
      if (item.id === editTarget.id) {
        return {
          ...item,
          name: editName,
          day: d,
          month: m,
          year: isNaN(y) || y < 1 ? undefined : y,
          relation: editRelation,
          note: editNote,
          synced: false // Mark unsynced since details changed
        };
      }
      return item;
    });

    updateSavedList(updated);
    setEditTarget(null);
  };

  const handleDeleteListItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(lang === "bn" ? "আপনি কি এই জন্মদিনের তথ্যটি মুছে ফেলতে চান?" : "Are you sure you want to delete this birthday?")) {
      const updated = savedList.filter((item) => item.id !== id);
      updateSavedList(updated);
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Triggers synchronization for a specific person
  const executeSyncEvent = async () => {
    if (!syncTarget || !token) return;

    setSyncing(true);
    setSyncSuccessResult(null);

    const targetDay = syncTarget.day;
    const targetMonth = syncTarget.month;

    const formattedMonth = String(targetMonth).padStart(2, '0');
    const formattedDay = String(targetDay).padStart(2, '0');
    
    const currentYear = new Date().getFullYear();
    const eventStartDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
    
    const startDateObj = new Date(currentYear, targetMonth - 1, targetDay);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 1);

    const endYearStr = endDateObj.getFullYear();
    const endMonthStr = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const endDayStr = String(endDateObj.getDate()).padStart(2, '0');
    const eventEndDate = `${endYearStr}-${endMonthStr}-${endDayStr}`;

    const summaryText = lang === "bn" 
      ? `🎂 জন্মবার্ষিকী: ${syncTarget.name} (${getRelationLabel(syncTarget.relation, "bn")})`
      : `🎂 Birthday: ${syncTarget.name} (${getRelationLabel(syncTarget.relation, "en")})`;

    let descriptionText = "";
    if (lang === "bn") {
      descriptionText = `ক্রনিকল বয়স ও কালপঞ্জি ক্যানভাস অ্যাপের সহায়তায় সংরক্ষিত হয়েছে।\n`;
      if (syncTarget.year) {
        descriptionText += `জন্ম সাল: ${syncTarget.year}\n`;
      }
      if (syncTarget.note) {
        descriptionText += `শুভেচ্ছা নোট: ${syncTarget.note}\n`;
      }
      descriptionText += `\n*এই ইমেইল নোটিফিকেশনটি স্বয়ংক্রিয়ভাবে আপনাকে স্মরণ করানোর জন্য পাঠানো হয়েছে।*`;
    } else {
      descriptionText = `Saved via Chronicle Age & Time Canvas.\n`;
      if (syncTarget.year) {
        descriptionText += `Birth Year: ${syncTarget.year}\n`;
      }
      if (syncTarget.note) {
        descriptionText += `Wishing note: ${syncTarget.note}\n`;
      }
      descriptionText += `\n*This automatic event has been synchronized to absolute reminder standards.*`;
    }

    const payload: CalendarEventPayload = {
      summary: summaryText,
      description: descriptionText,
      startDate: eventStartDate,
      endDate: eventEndDate,
      recurrenceRule: "RRULE:FREQ=YEARLY", // Everlasting annual trigger
      reminders: {
        emailOnDay,
        emailDayBefore,
        popupOnDay
      }
    };

    const result = await createCalendarEvent(token, payload);
    setSyncing(false);

    if (result.success) {
      setSyncSuccessResult({ link: result.link, name: syncTarget.name });
      
      // Update item state to synced
      const updated = savedList.map((item) => {
        if (item.id === syncTarget.id) {
          return { ...item, synced: true, syncedLink: result.link };
        }
        return item;
      });
      updateSavedList(updated);
    } else {
      alert((lang === "bn" ? "দুঃখিত, ক্যালেন্ডারে যুক্ত করা যায়নি: " : "Error syncing to calendar: ") + (result.error || ""));
    }
  };

  const getRelationLabel = (relation: SavedBirthday["relation"], targetLang: "bn" | "en") => {
    const labels = {
      friend: { bn: "🤝 বন্ধু", en: "🤝 Friend" },
      family: { bn: "👨‍👩‍👦 পরিবার", en: "👨‍👩‍👦 Family" },
      special: { bn: "💖 জীবনসঙ্গী/বিশেষ কেউ", en: "💖 Special Person" },
      colleague: { bn: "💼 সহকর্মী", en: "💼 Colleague" },
      other: { bn: "✨ অন্যান্য", en: "✨ Other" },
    };
    return labels[relation][targetLang];
  };

  const getRelationBadgeColor = (relation: SavedBirthday["relation"]) => {
    switch (relation) {
      case "friend": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "family": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "special": return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
      case "colleague": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className="bg-surface/85 backdrop-blur-md border border-text-muted/10 p-5 sm:p-7 rounded-2xl shadow-xl flex flex-col gap-6 mt-6 max-w-full">
      
      {/* Widget Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif italic font-black text-xl text-text-main leading-tight">
              {lang === "bn" ? "জন্মদিন খাতা ও রিমাইন্ডার" : "Birthday Book & Reminders"}
            </h3>
            <span className="text-[10px] sm:text-xs text-text-muted">
              {lang === "bn" ? "কারও জন্মদিন আর কোনোদিন ভুলবেন না!" : "Never forget anyone's birthday ever again!"}
            </span>
          </div>
        </div>

        {/* User Session Controller */}
        {user ? (
          <div className="flex items-center gap-3 self-center sm:self-auto">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-accent/5 border border-accent/10">
              {user.photoURL ? (
                <img src={user.photoURL} alt="U" referrerPolicy="no-referrer" className="w-5.5 h-5.5 rounded-full border border-accent/20" />
              ) : (
                <div className="w-5.5 h-5.5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold">
                  {user.displayName ? user.displayName[0] : "U"}
                </div>
              )}
              <span className="text-[11px] font-bold text-text-main max-w-[80px] sm:max-w-[120px] truncate leading-none">
                {user.displayName}
              </span>
            </div>
            <button 
              onClick={handleLogout} 
              title={lang === "bn" ? "সাইন আউট" : "Sign Out"}
              className="p-1.5 rounded-lg border border-text-muted/15 hover:bg-red-500/10 hover:border-red-500/30 text-text-muted hover:text-red-500 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
            
            {/* Profile Icon button */}
            <button
              onClick={() => setShowCalendarHub(true)}
              title={lang === "bn" ? "গুগল ক্যালেন্ডার কাজের কেন্দ্র" : "Google Calendar Hub"}
              className="p-1.5 rounded-lg border border-accent/20 bg-accent/5 hover:bg-accent hover:text-white text-accent transition-all cursor-pointer flex items-center justify-center"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="P" referrerPolicy="no-referrer" className="w-3.5 h-3.5 rounded-full" />
              ) : (
                <CalendarDays className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            disabled={authLoading}
            className="flex items-center justify-center gap-2 pl-3 pr-4 py-1.5 bg-accent hover:bg-accent/90 text-white font-sans font-semibold text-xs rounded-xl transition-all duration-300 hover:shadow-md disabled:opacity-50 cursor-pointer mx-auto sm:mx-0 self-center sm:self-auto"
          >
            {authLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 block flex-shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
            )}
            <span className="font-bold">
              {lang === "bn" ? "গুগল একাউন্ট সিঙ্ক করুন" : "Connect Google Account"}
            </span>
          </button>
        )}
      </div>

      {/* Feature Guide Banner */}
      <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-text-muted">
        <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-text-main">
            {lang === "bn" ? "এটি কিভাবে কাজ করে ও কিভাবে জিমেইলে সেটাপ করবেন?" : "How does this work with Gmail setup?"}
          </p>
          <p>
            {lang === "bn" 
              ? "গুগল ক্যালেন্ডারের নিজস্ব নোটিফিকেশন সিস্টেম ব্যবহার করে কোনো সার্ভার ছাড়াই জিমেইলে অটো ইমেইল সিঙ্ক করা যায়। আপনার গুগল ক্যালেন্ডারে যুক্ত করা জন্মদিনের নিচে যেকোনো শুভেচ্ছা নোট বা উপহারের রিমাইন্ডার লিখে রাখলে, ক্যালেন্ডার স্বয়ংক্রিয়ভাবে জন্মদিনে সকাল ৯টায় আপনাকে রিমাইন্ডার ইমেইল পাঠিয়ে দেবে।" 
              : "Google Calendar has a built-in automated reminder system that delivers notifications straight to your Gmail Inbox without needing any costly database setup. Any greeting cards, lists or alarm options will be delivered precisely as a native email message."}
          </p>
        </div>
      </div>

      {/* Primary Birthday Book Dashboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            {lang === "bn" ? "আপনার সংরক্ষিত তালিকা" : "Your Saved Birthdays List"}
          </h4>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-accent/10 border border-accent/25 hover:bg-accent hover:text-white transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className={`w-3.5 h-3.5 transition-transform duration-300 ${showAddForm ? 'rotate-45' : ''}`} />
            {lang === "bn" ? "নতুন নাম যোগ করুন" : "Add Target Person"}
          </button>
        </div>

        {/* Floating / Sliding Form to Add Birthday */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddNewBirthday}
              className="bg-background/40 border border-text-muted/10 p-5 rounded-xl overflow-hidden shadow-inner flex flex-col gap-4"
            >
              <h4 className="font-serif italic font-black text-sm text-text-main pb-2 border-b border-text-muted/5">
                🖊️ {lang === "bn" ? "নতুন ব্যক্তির বিবরণ পূরণ করুন" : "Fill Person Details"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                    {lang === "bn" ? "পূর্ণ নাম" : "Full Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={lang === "bn" ? "যেমন: আকাশ রহমান" : "e.g. Liam Smith"}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Date specs */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                    {lang === "bn" ? "জন্ম তারিখ (দিন / মাস / বছর)" : "Birth Date (Day / Month / Year)"} *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      max={31}
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      placeholder={lang === "bn" ? "দিন (e.g. ১২)" : "Day"}
                      className="px-2 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main text-center focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      value={newMonth}
                      onChange={(e) => setNewMonth(e.target.value)}
                      placeholder={lang === "bn" ? "মাস (e.g. ৫)" : "Month"}
                      className="px-2 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main text-center focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      min={1900}
                      max={new Date().getFullYear()}
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      placeholder={lang === "bn" ? " বছর (ঐচ্ছিক)" : "Year (opt)"}
                      className="px-2 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main text-center focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Relation choosing */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                    {lang === "bn" ? "সম্পর্ক" : "Relationship"}
                  </label>
                  <select
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value as SavedBirthday["relation"])}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main focus:outline-none focus:border-accent"
                  >
                    <option value="friend">{lang === "bn" ? "🤝 বন্ধু" : "Friend"}</option>
                    <option value="family">{lang === "bn" ? "👨‍👩‍👦 পরিবার" : "Family"}</option>
                    <option value="special">{lang === "bn" ? "💖 বিশেষ কেউ/জীবনসঙ্গী" : "Special Someone"}</option>
                    <option value="colleague">{lang === "bn" ? "💼 সহকর্মী" : "Colleague"}</option>
                    <option value="other">{lang === "bn" ? "✨ অন্যান্য" : "Other"}</option>
                  </select>
                </div>

                {/* Wishing greeting card reminder notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                    {lang === "bn" ? "শুভেচ্ছা বার্তা বা গিফট নোটিফিকেশন নোট" : "Greeting Notification Message Note"}
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={lang === "bn" ? "যেমন: ফোনে উইশ করবি, ট্রিট আদায় করিস!" : "e.g. Call them on WhatsApp at 9AM!"}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2 rounded-xl bg-accent hover:bg-accent/95 shadow-md text-white font-bold text-xs font-serif italic transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {lang === "bn" ? "এই ব্যক্তিকে খাতায় যোগ করুন" : "Save to Birthday Book"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Sync configuration modal popover */}
      <AnimatePresence>
        {syncTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="w-full max-w-md bg-surface border border-accent/25 rounded-2xl p-5 sm:p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setSyncTarget(null);
                  setSyncSuccessResult(null);
                }}
                className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-text-main hover:bg-background transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-text-muted/10 pb-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-serif italic font-black text-lg text-text-main">
                    {lang === "bn" ? "গুগল ক্যালেন্ডার রিমাইন্ডার সেটাপ" : "Google Calendar Alarm Setup"}
                  </h4>
                  <span className="text-xs text-text-muted">
                    {lang === "bn" ? `${syncTarget.name} এর জন্মদিনের জন্য ইমেইল রিমাইন্ডার` : `Gmail notification scheduler for ${syncTarget.name}`}
                  </span>
                </div>
              </div>

              {/* Status or Options Panel */}
              {!syncSuccessResult ? (
                <div className="space-y-4">
                  {/* Review Event Preview */}
                  <div className="bg-background/60 p-3 rounded-lg border border-text-muted/10 text-xs text-text-muted space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-bold text-text-main">{lang === "bn" ? "ইভেন্টের নাম:" : "Event Title:"}</span>
                      <span>🎂 {syncTarget.name} {lang === "bn" ? "এর জন্মবার্ষিকী" : "Anniversary"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-text-main">{lang === "bn" ? "তারিখ:" : "Day of Year:"}</span>
                      <span>📅 {translateNumber(syncTarget.day, lang)}/{translateNumber(syncTarget.month, lang)} ({lang === "bn" ? "বার্ষিক" : "Annual Recurring"})</span>
                    </div>
                    {syncTarget.note && (
                      <div className="border-t border-text-muted/5 pt-1.5 mt-1 text-[11px] font-mono">
                        <span className="font-bold block text-[10px] text-accent uppercase">{lang === "bn" ? "শুভেচ্ছা বার্তা (ইমেইলের ডেসক্রিপশনে থাকবে):" : "Greeting Note in Email Body:"}</span>
                        {syncTarget.note}
                      </div>
                    )}
                  </div>

                  {/* Gmail Reminders customization */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono font-bold uppercase text-text-muted block pb-1 border-b border-text-muted/5">
                      📬 {lang === "bn" ? "জিমেইল ইমেইল নোটিফিকেশন অপশনস" : "Gmail Automation Options"}
                    </label>

                    {/* Email Day Before */}
                    <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background/40 border border-transparent hover:border-text-muted/5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={emailDayBefore}
                        onChange={(e) => setEmailDayBefore(e.target.checked)}
                        className="w-4 h-4 accent-accent cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold block text-text-main">{lang === "bn" ? "১ দিন আগে এডভান্স ইমেইল অ্যালার্ম" : "1 Day Before Email Alert"}</span>
                        <span className="text-[10px] text-text-muted">{lang === "bn" ? "জন্মদিনের আগের দিন সকাল ৯টায় ইমেইল পাবেন" : "Get a smart email alert 1 day ahead at 9:00 AM"}</span>
                      </div>
                    </label>

                    {/* Email On Birthday Day */}
                    <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background/40 border border-transparent hover:border-text-muted/5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={emailOnDay}
                        onChange={(e) => setEmailOnDay(e.target.checked)}
                        className="w-4 h-4 accent-accent cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold block text-text-main">{lang === "bn" ? "সঠিক জন্মদিনে সকাল ৯টায় ইমেইল" : "Exactly on Birthday Email Alarm"}</span>
                        <span className="text-[10px] text-text-muted">{lang === "bn" ? "সঠিক সময়ে উপহার বা শুভকামনা পাঠাতে ভুল হবে না" : "Send greeting exact day morning at 9:00 AM"}</span>
                      </div>
                    </label>

                    {/* Pop-up Alarm */}
                    <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background/40 border border-transparent hover:border-text-muted/5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={popupOnDay}
                        onChange={(e) => setPopupOnDay(e.target.checked)}
                        className="w-4 h-4 accent-accent cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold block text-text-main">{lang === "bn" ? "ডিভাইস পপআপ নোটিফিকেশন" : "Direct Device Popup Alert"}</span>
                        <span className="text-[10px] text-text-muted">{lang === "bn" ? "মোবাইল ও কম্পিউটারের সাধারণ পুশ নোটিফিকেশন" : "Push popup notification on connected devices"}</span>
                      </div>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setSyncTarget(null)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border border-text-muted/15 hover:bg-background text-text-muted font-sans cursor-pointer"
                    >
                      {lang === "bn" ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      onClick={executeSyncEvent}
                      disabled={syncing}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-accent hover:bg-accent/95 shadow-md shadow-accent/20 text-white font-sans flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {syncing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5" />
                      )}
                      {lang === "bn" ? "সিঙ্ক কনফার্ম করুন" : "Confirm Sync"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-4 flex flex-col items-center animate-fade-in">
                  <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 animate-pulse" />
                  </div>
                  
                  <div className="space-y-1">
                    <h5 className="font-serif italic font-black text-base text-text-main">
                      {lang === "bn" ? "অভিনন্দন! সিঙ্ক্রোনাইজড" : "Successfully Synced!"}
                    </h5>
                    <p className="text-xs text-text-muted max-w-xs">
                      {lang === "bn"
                        ? `${syncSuccessResult.name} এর জন্মদিনের জন্য বার্ষিক ইমেইল নোটিফিকেশন কনফিগার করা হয়েছে। এখন গুগল গুগল ক্যালেন্ডার স্বয়ংক্রিয়ভাবে আপনাকে সময়মতো মেইল পাঠাবে।`
                        : `Annual perpetual alarms configured for ${syncSuccessResult.name}. Your primary Calendar has scheduled the reminder emails safely.`}
                    </p>
                  </div>

                  {syncSuccessResult.link && (
                    <a
                      href={syncSuccessResult.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-accent bg-accent/5 border border-accent/15 hover:bg-accent/15 rounded-xl transition-all pointer-events-auto cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {lang === "bn" ? "ক্যালেন্ডার ইভেন্টটি দেখুন ↗" : "View Live Calendar Event ↗"}
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setSyncTarget(null);
                      setSyncSuccessResult(null);
                    }}
                    className="w-full mt-2 py-2 text-xs rounded-xl bg-background border border-text-muted/15 text-text-main font-bold hover:bg-surface/50 transition-colors pointer-events-auto cursor-pointer"
                  >
                    {lang === "bn" ? "বন্ধ করুন" : "Close"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* Edit Birthday Modal */}
      <AnimatePresence>
        {editTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="w-full max-w-md bg-surface border border-accent/25 rounded-2xl p-5 sm:p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="absolute top-4 right-4 p-1 rounded-full text-text-muted hover:text-text-main hover:bg-background transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-text-muted/10 pb-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif italic font-black text-lg text-text-main">
                    {lang === "bn" ? "জন্মদিনের তথ্য পরিবর্তন" : "Edit Birthday Entry"}
                  </h4>
                  <span className="text-xs text-text-muted">
                    {lang === "bn" ? "বিবরণ আপডেট করুন" : "Update saved birthday details"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {/* Full name input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                    {lang === "bn" ? "পূর্ণ নাম" : "Full Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Day Month Year values */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                    {lang === "bn" ? "জন্ম তারিখ (দিন / মাস / বছর)" : "Birth Date (Day / Month / Year)"} *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      max={31}
                      value={editDay}
                      onChange={(e) => setEditDay(e.target.value)}
                      placeholder={lang === "bn" ? "দিন" : "Day"}
                      className="px-2 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main text-center focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      value={editMonth}
                      onChange={(e) => setEditMonth(e.target.value)}
                      placeholder={lang === "bn" ? "মাস" : "Month"}
                      className="px-2 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main text-center focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      min={1900}
                      max={new Date().getFullYear()}
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      placeholder={lang === "bn" ? " বছর (ঐচ্ছিক)" : "Year (opt)"}
                      className="px-2 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main text-center focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* Relation dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                    {lang === "bn" ? "সম্পর্ক" : "Relationship"}
                  </label>
                  <select
                    value={editRelation}
                    onChange={(e) => setEditRelation(e.target.value as SavedBirthday["relation"])}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main focus:outline-none focus:border-accent"
                  >
                    <option value="friend">{lang === "bn" ? "🤝 বন্ধু" : "Friend"}</option>
                    <option value="family">{lang === "bn" ? "👨‍👩‍👦 পরিবার" : "Family"}</option>
                    <option value="special">{lang === "bn" ? "💖 বিশেষ কেউ/জীবনসঙ্গী" : "Special Someone"}</option>
                    <option value="colleague">{lang === "bn" ? "💼 সহকর্মী" : "Colleague"}</option>
                    <option value="other">{lang === "bn" ? "✨ অন্যান্য" : "Other"}</option>
                  </select>
                </div>

                {/* Custom wishing note */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-text-muted">
                    {lang === "bn" ? "শুভেচ্ছা বার্তা বা রিমাইন্ডার নোট" : "Greeting Message / Note"}
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder={lang === "bn" ? "যেমন: ফোনে উইশ করবি, ট্রিট আদায় করিস!" : "e.g. Call them on WhatsApp at 9AM!"}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-text-muted/15 bg-surface text-text-main focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Action CTA triggers */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(null)}
                    className="flex-1 py-2 text-xs font-bold border border-text-muted/15 hover:bg-background text-text-muted font-sans rounded-xl cursor-pointer"
                  >
                    {lang === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold bg-accent hover:bg-accent/95 shadow-md shadow-accent/20 text-white font-sans rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {lang === "bn" ? "সংরক্ষণ করুন" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Calendar Sync & Profile Hub Modal Overlay */}
      <AnimatePresence>
        {showCalendarHub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-[120] flex items-center justify-center p-4 pointer-events-auto shadow-inner"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="w-full max-w-lg bg-surface border border-accent/25 rounded-2xl p-5 sm:p-6 shadow-2xl relative max-h-[85vh] flex flex-col gap-4 overflow-hidden"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowCalendarHub(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-text-muted hover:text-text-main hover:bg-background transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 border-b border-text-muted/10 pb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif italic font-black text-lg text-text-main">
                    {lang === "bn" ? "গুগল ক্যালেন্ডার ও প্রোফাইল হাব" : "Google Calendar & Profile Hub"}
                  </h4>
                  <span className="text-xs text-text-muted">
                    {lang === "bn" ? "আপনার সুরক্ষিত ক্যালেন্ডার সিঙ্ক ব্যবস্থা" : "Secure automated visual scheduler control center"}
                  </span>
                </div>
              </div>

              {/* User profile details & Go to Google Calendar link */}
              {user && (
                <div className="bg-background/40 border border-text-muted/10 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="U" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-accent/25" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                        {user.displayName ? user.displayName[0] : "P"}
                      </div>
                    )}
                    <div className="text-left leading-tight">
                      <span className="block font-bold text-text-main text-sm font-sans">{user.displayName}</span>
                      <span className="block text-[10px] text-text-muted font-mono">{user.email}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => window.open("https://calendar.google.com", "_blank")}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/90 transition-all shadow-sm cursor-pointer border border-transparent hover:border-accent"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {lang === "bn" ? "গুগল ক্যালেন্ডার খুলুন" : "Open Google Calendar"}
                  </button>
                </div>
              )}

              {/* Tab Selector */}
              <div className="flex border-b border-text-muted/10">
                <button
                  type="button"
                  onClick={() => setActiveHubTab("sync")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    activeHubTab === "sync"
                      ? "border-accent text-accent"
                      : "border-transparent text-text-muted hover:text-text-main"
                  }`}
                >
                  {lang === "bn" ? "ক্যালেন্ডার সিঙ্ক তালিকা" : "Calendar Sync List"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHubTab("android")}
                  className={`flex-1 py-1.5 text-center text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeHubTab === "android"
                      ? "border-accent text-accent"
                      : "border-transparent text-text-muted hover:text-text-main"
                  }`}
                >
                  <span>{lang === "bn" ? "অ্যান্ড্রয়েড অ্যাপ গাইড 📱" : "Android App Guide 📱"}</span>
                </button>
              </div>

              {/* Tab Content */}
              {activeHubTab === "sync" ? (
                /* Birthdays lists to sync */
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left">
                  <div className="flex items-center justify-between border-b border-text-muted/5 pb-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-text-muted tracking-wider">
                      {lang === "bn" ? "জন্মদিন তালিকা সিঙ্ক করুন" : "Saved Birthday Sync Actions"}
                    </span>
                    <span className="text-[10px] font-mono text-accent font-bold">
                      {translateNumber(savedList.length, lang)} {lang === "bn" ? "টি মোট" : "total"}
                    </span>
                  </div>

                  {savedList.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-6 italic font-sans">
                      {lang === "bn" ? "কোনো জন্মদিন সংরক্ষিত নেই।" : "No birthdays saved yet!"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {savedList.map((person) => (
                        <div
                          key={person.id}
                          className="bg-background/25 hover:bg-background/45 border border-text-muted/10 p-3 rounded-xl flex items-center justify-between gap-3 text-left"
                        >
                          <div className="space-y-1">
                            <span className="block text-xs font-bold text-text-main leading-tight">{person.name}</span>
                            <span className="block text-[10px] text-text-muted font-mono">
                              📅 {translateNumber(person.day, lang)}/{translateNumber(person.month, lang)}
                            </span>
                          </div>

                          {/* Edit, Delete, and Sync triggers */}
                          <div className="flex items-center gap-1.5 ml-auto flex-nowrap">
                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setEditTarget(person);
                                setEditName(person.name);
                                setEditDay(person.day.toString());
                                setEditMonth(person.month.toString());
                                setEditYear(person.year ? person.year.toString() : "");
                                setEditRelation(person.relation);
                                setEditNote(person.note);
                              }}
                              className="p-1 px-1.5 rounded-lg border border-text-muted/10 text-text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                              title={lang === "bn" ? "তথ্য পরিবর্তন করুন" : "Edit Birthday Details"}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDeleteListItem(person.id, e)}
                              className="p-1 px-1.5 rounded-lg border border-red-500/10 text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title={lang === "bn" ? "মুছে ফেলুন" : "Delete"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {person.synced && person.syncedLink && (
                              <a
                                href={person.syncedLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-[9px] font-bold border border-text-muted/15 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-all flex items-center gap-0.5"
                                title={lang === "bn" ? "গুগল ক্যালেন্ডারে ইভেন্টটি দেখুন" : "View calendar event"}
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                {lang === "bn" ? "ইভেন্ট" : "Event"}
                              </a>
                            )}
                            {user ? (
                              <button
                                onClick={() => {
                                  setSyncTarget(person);
                                }}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                                  person.synced
                                    ? "bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20"
                                    : "bg-accent hover:bg-accent/90 text-white shadow-sm"
                                }`}
                              >
                                {person.synced ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    {lang === "bn" ? "সিঙ্কড" : "Synced"}
                                  </>
                                ) : (
                                  <>
                                    <Calendar className="w-3 h-3" />
                                    {lang === "bn" ? "সিঙ্ক করুন" : "Sync"}
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-[9px] text-text-muted italic px-1">
                                {lang === "bn" ? "সিঙ্ক করতে লগইন" : "Login to Sync"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Android App Guide Tab */
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-left scrollbar-thin scrollbar-thumb-accent">
                  <div className="space-y-1.5">
                    <h5 className="font-sans font-bold text-xs text-accent">
                      {lang === "bn" ? "📱 কীভাবে মোবাইল অ্যাপে লগইন কাজ করবে?" : "📱 How Google Login works inside Mobile Apps?"}
                    </h5>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {lang === "bn" 
                        ? "গুগল সিকিউরিটি পলিসির কারণে সাধারণ অ্যান্ড্রয়েড 'WebView' সরাসরি গুগল অ্যাকাউন্ট কানেক্ট করতে দেয় না (Disallowed User-Agent এরর দেয়)। এটি সমাধান করতে আমরা ব্যাকএন্ডে স্বয়ংক্রিয়ভাবে 'রুট-লিঙ্ক রিডাইরেক্ট' (Redirect Auth) সিস্টেম সেটআপ করেছি।"
                        : "Due to Google security protocols, basic Android 'WebView' wrappers block embedded authentication popups directly (throwing standard user-agent restrictions). To resolve code hurdles, we have seamlessly deployed automatic 'OAuth Redirect Auth' detection."
                      }
                    </p>
                    <p className="text-[11px] text-text-muted leading-relaxed font-bold">
                      {lang === "bn"
                        ? "আপনার অ্যান্ড্রয়েড স্টুডিও কোডে শুধু নিচের ৪টি চমৎকার লাইন ও কনভিগারেশন যোগ করে নিলেই আপনার মোবাইল অ্যাপটি ১ সেকেন্ডে সুন্দরভাবে সচল হয়ে যাবে!"
                        : "To finalize integration, simply declare these standard web-to-mobile properties in Android Studio for full operations."
                      }
                    </p>
                  </div>

                  {/* Code Block Selector Tabs */}
                  <div className="flex items-center gap-2 border-b border-text-muted/10 pb-1.5">
                    <button
                      type="button"
                      onClick={() => setAndroidLang("kotlin")}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                        androidLang === "kotlin" 
                          ? "bg-accent/15 text-accent border border-accent/20" 
                          : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      Kotlin (MainActivity.kt)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAndroidLang("java")}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                        androidLang === "java" 
                          ? "bg-accent/15 text-accent border border-accent/20" 
                          : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      Java (MainActivity.java)
                    </button>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const kotlinCode = `// Android WebView configuration in Kotlin
val myWebView: WebView = findViewById(R.id.webview)
val settings = myWebView.settings

// 1. Enable JS and Storage (Mandatory)
settings.javaScriptEnabled = true
settings.domStorageEnabled = true

// 2. Enable multiple windows & navigation callbacks
settings.supportMultipleWindows()
settings.javaScriptCanOpenWindowsAutomatically = true

// 3. Set a standard desktop-compatible browser User Agent to bypass google blocks
val chromeUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
settings.userAgentString = chromeUA

// 4. Set WebViewClient to process oauth redirects inside the webview instead of external browsers
myWebView.webViewClient = object : WebViewClient() {
    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        if (url != null && (url.startsWith("https://") || url.startsWith("http://"))) {
            view?.loadUrl(url)
            return true
        }
        return false
    }
}`;

                        const javaCode = `// Android WebView configuration in Java
WebView myWebView = findViewById(R.id.webview);
WebSettings settings = myWebView.getSettings();

// 1. Enable JS & HTML5 Database Storage (Essential)
settings.setJavaScriptEnabled(true);
settings.setDomStorageEnabled(true);

// 2. Enable redirection windows & popup allowance
settings.setSupportMultipleWindows(true);
settings.setJavaScriptCanOpenWindowsAutomatically(true);

// 3. Bypass user-agent blocks by declaring mobile Chrome string
String chromeUA = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
settings.setUserAgentString(chromeUA);

// 4. Force social credential routing within the WebView 
myWebView.setWebViewClient(new WebViewClient() {
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        if (url != null && (url.startsWith("https://") || url.startsWith("http://"))) {
            view.loadUrl(url);
            return true;
        }
        return false;
    }
});`;
                        const codeToCopy = androidLang === "kotlin" ? kotlinCode : javaCode;
                        navigator.clipboard.writeText(codeToCopy);
                        setCodeCopied(true);
                        setTimeout(() => setCodeCopied(false), 2000);
                      }}
                      className="ml-auto text-[10px] font-bold text-accent flex items-center gap-1 cursor-pointer bg-accent/5 hover:bg-accent/15 px-2.5 py-1 rounded"
                    >
                      <Copy className="w-3 h-3" />
                      {codeCopied ? (lang === "bn" ? "কপি হয়েছে!" : "Copied!") : (lang === "bn" ? "কোড কপি করুন" : "Copy Code")}
                    </button>
                  </div>

                  {/* Rendered Monospace Codeblock */}
                  <div className="bg-background/90 border border-text-muted/10 p-3.5 rounded-xl max-h-48 overflow-y-auto overflow-x-auto relative">
                    <pre className="text-[10px] font-mono text-text-main leading-tight whitespace-pre">
                      {androidLang === "kotlin" ? (
                        <>
                          <span className="text-emerald-500">// Configure Android WebView settings (Kotlin)</span>{"\n"}
                          <span className="text-pink-500">val</span> myWebView: WebView = findViewById(R.id.webview){"\n"}
                          <span className="text-pink-500">val</span> settings = myWebView.settings{"\n"}
                          {"\n"}
                          <span className="text-emerald-500">// 1. Enable JS & local databases (Must have)</span>{"\n"}
                          settings.javaScriptEnabled = <span className="text-blue-500">true</span>{"\n"}
                          settings.domStorageEnabled = <span className="text-blue-500">true</span>{"\n"}
                          {"\n"}
                          <span className="text-emerald-500">// 2. Configure redirects</span>{"\n"}
                          settings.supportMultipleWindows(){"\n"}
                          settings.javaScriptCanOpenWindowsAutomatically = <span className="text-blue-500">true</span>{"\n"}
                          {"\n"}
                          <span className="text-emerald-500">// 3. Custom User-Agent to bypass Google blocks</span>{"\n"}
                          <span className="text-pink-500">val</span> chromeUA = <span className="text-amber-500">"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"</span>{"\n"}
                          settings.userAgentString = chromeUA{"\n"}
                          {"\n"}
                          <span className="text-emerald-500">// 4. Run authentication redirects inside the app</span>{"\n"}
                          myWebView.webViewClient = <span className="text-pink-500">object</span> : WebViewClient() {"{"}{"\n"}
                          {"    "}<span className="text-pink-500">override fun</span> shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {"{"}{"\n"}
                          {"        "}<span className="text-pink-500">if</span> (url != <span className="text-blue-500">null</span> && (url.startsWith(<span className="text-amber-500">"https://"</span>) || url.startsWith(<span className="text-amber-500">"http://"</span>))) {"{"}{"\n"}
                          {"            "}view?.loadUrl(url){"\n"}
                          {"            "}<span className="text-pink-500">return</span> <span className="text-blue-500">true</span>{"\n"}
                          {"        "}{"}"}{"\n"}
                          {"        "}<span className="text-pink-500">return</span> <span className="text-blue-500">false</span>{"\n"}
                          {"    "}{"}"}{"\n"}
                          {"}"}
                        </>
                      ) : (
                        <>
                          <span className="text-emerald-500">// Configure WebView settings (Java)</span>{"\n"}
                          WebView myWebView = findViewById(R.id.webview);{"\n"}
                          WebSettings settings = myWebView.getSettings();{"\n"}
                          {"\n"}
                          <span className="text-emerald-500">// 1. Enable standard services (Required)</span>{"\n"}
                          settings.setJavaScriptEnabled(<span className="text-blue-500">true</span>);{"\n"}
                          settings.setDomStorageEnabled(<span className="text-blue-500">true</span>);{"\n"}
                          {"\n"}
                          <span className="text-emerald-500">// 2. Configure screen popup permissions</span>{"\n"}
                          settings.setSupportMultipleWindows(<span className="text-blue-500">true</span>);{"\n"}
                          settings.setJavaScriptCanOpenWindowsAutomatically(<span className="text-blue-500">true</span>);{"\n"}
                          {"\n"}
                          <span className="text-emerald-500">// 3. Override standard user-agent string</span>{"\n"}
                          String chromeUA = <span className="text-amber-500">"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"</span>;{"\n"}
                          settings.setUserAgentString(chromeUA);{"\n"}
                          {"\n"}
                          <span className="text-emerald-500">// 4. Set Custom client to hold redirects</span>{"\n"}
                          myWebView.setWebViewClient(<span className="text-pink-500">new</span> WebViewClient() {"{"}{"\n"}
                          {"    "}@Override{"\n"}
                          {"    "}<span className="text-pink-500">public boolean</span> shouldOverrideUrlLoading(WebView view, String url) {"{"}{"\n"}
                          {"        "}<span className="text-pink-500">if</span> (url != <span className="text-blue-500">null</span> && (url.startsWith(<span className="text-amber-500">"https://"</span>) || url.startsWith(<span className="text-amber-500">"http://"</span>))) {"{"}{"\n"}
                          {"            "}view.loadUrl(url);{"\n"}
                          {"            "}<span className="text-pink-500">return</span> <span className="text-blue-500">true</span>;{"\n"}
                          {"        "}{"}"}{"\n"}
                          {"        "}<span className="text-pink-500">return</span> <span className="text-blue-500">false</span>;{"\n"}
                          {"    "}{"}"}{"\n"}
                          {"}"});
                        </>
                      )}
                    </pre>
                  </div>

                  <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 flex gap-2 sm:gap-3 text-[10px] leading-relaxed text-text-muted select-none">
                    <span className="text-accent text-sm mt-[-2px]">💡</span>
                    <div>
                      {lang === "bn" ? (
                        <span>
                          <strong>প্রো-টিপ:</strong> অ্যান্ড্রয়েড অ্যাপ তৈরিতে আপনি Google recommended <strong>Chrome Custom Tabs</strong> লাইব্রেরি ব্যবহার করলে ইউজার-এজেন্ট রিস্ট্রিকশন নিয়ে একদম কোনো সমস্যাই থাকবে না আর লগইন সবসময় ১০০% মসৃণভাবে সম্পন্ন হবে।
                        </span>
                      ) : (
                        <span>
                          <strong>Pro-Tip:</strong> Using <strong>Chrome Custom Tabs</strong> on Android guarantees security compatibility out of the box and delivers an ultra-smooth performance with no User-Agent bypasses required!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Close trigger footer */}
              <button
                type="button"
                onClick={() => setShowCalendarHub(false)}
                className="w-full py-2.5 bg-background border border-text-muted/15 hover:bg-surface text-text-main rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {lang === "bn" ? "বন্ধ করুন" : "Close Hub"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
