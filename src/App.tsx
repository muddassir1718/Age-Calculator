/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { calculateAge, isFutureDate, isValidDate } from "./utils/dateUtils";
import { FireworksCanvas } from "./components/FireworksCanvas";
import { ZodiacThemeBackground, ZodiacElement } from "./components/ZodiacThemeBackground";
import { BirthdayGreetingOverlay } from "./components/BirthdayGreetingOverlay";
import { CalendarSyncWidget } from "./components/CalendarSyncWidget";
import { 
  Moon, 
  Sun, 
  Paintbrush, 
  Globe, 
  Sparkles, 
  Calendar, 
  Activity, 
  Check, 
  RotateCcw,
  Smile,
  Compass,
  Hourglass,
  Clock,
  Heart
} from "lucide-react";

interface ResultType {
  years: number | null;
  months: number | null;
  days: number | null;
}

interface ErrorsType {
  startDay: string;
  startMonth: string;
  startYear: string;
  endDay: string;
  endMonth: string;
  endYear: string;
}

// Accent Colors preset definition
const ACCENT_COLORS = [
  { name: "Purple", value: "#E314EB", titleBn: "বেগুনি", titleEn: "Regal Purple" },
  { name: "Crimson", value: "#D11A2A", titleBn: "লাল", titleEn: "Crimson Red" },
  { name: "Forest", value: "#4DDBEB", titleBn: "সবুজ", titleEn: "Forest Green" },
  { name: "Ocean", value: "#0077B6", titleBn: "নীল", titleEn: "Ocean Blue" },
  { name: "Sienna", value: "#D95D39", titleBn: "কমলা", titleEn: "Sienna Orange" }
];

// English and Bengali dictionary for localization
const LANGUAGES = {
  en: {
    title: "Editorial Age & Time Canvas",
    subtitle: "Precise date range calculation, seasonal milestones & cosmic bio-metrics",
    day: "Day",
    month: "Month",
    year: "Year",
    yearsUnit: "years",
    monthsUnit: "months",
    daysUnit: "days",
    calculate: "Calculate Difference",
    errors: {
      required: "Required",
      validDay: "Must be a valid day",
      validMonth: "Must be a valid month",
      pastYear: "Must be in the past",
      validDate: "Must be a valid date",
      endBeforeStart: "End date must be after Start date",
    },
    bornOn: "Start Day was",
    zodiac: "Zodiac Sign",
    nextBirthday: "Next Birthday in",
    totalStats: "Life, Nature & Cosmic Milestones",
    daysLived: "days lived",
    hoursLived: "hours lived",
    weeksLived: "weeks lived",
    heartbeats: "estimated heartbeats",
    customization: "Theme Customizer",
    accentColor: "Accent Color",
    bgMotionToggle: "Motion Background",
    wcag: "WCAG 2.1 AA Compliant",
    daysCount: "days",
    monthsCount: "months",
    reset: "Reset fields",
    themeMode: "Appearance",
    light: "Light",
    dark: "Dark",
    system: "System",
    
    // New Manual Date & Life calculation tags
    calcMode: "Calculation Mode",
    untilToday: "Age/Time until Today",
    customRange: "Custom Range (Two Dates)",
    startDateLabel: "Start Date (Date A)",
    endDateLabel: "End Date (Date B)",
    
    // Derived stats titles
    eidFitr: "Ramadan Eids (Eid-ul-Fitr)",
    eidAdha: "Qurbani Eids (Eid-ul-Adha)",
    earthOrbit: "Earth's Orbital Voyage",
    sleepHrs: "Estimated sleep time",
    respirations: "Breaths taken",
    fullMoons: "Full Moons witnessed",
    sunsets: "Sunrises & Sunsets",
    seasonsSection: "Bangladesh Seasons Experienced",
    times: "times",
    hours: "hours",
    millionKm: "million km",
    
    // Bengali Seasons Translation
    summer: "Summer (গ্রীষ্ম)",
    rainy: "Rainy (বর্ষা)",
    autumn: "Autumn (শরৎ)",
    lateAutumn: "Late Autumn (হেমন্ত)",
    winter: "Winter (শীত)",
    spring: "Spring (বসন্ত)"
  },
  bn: {
    title: "সম্পাদকীয় সময় ও বয়স ক্যানভাস",
    subtitle: "যেকোনো দুটি নির্দিষ্ট তারিখের মধ্যকার নিঁখুত ব্যবধান, ঋতুধারা ও মহাজাগতিক প্রাণ-পরিসংখ্যান",
    day: "দিন",
    month: "মাস",
    year: "বছর",
    yearsUnit: "বছর",
    monthsUnit: "মাস",
    daysUnit: "দিন",
    calculate: "হিসাব করুন",
    errors: {
      required: "তথ্য আবশ্যক",
      validDay: "সঠিক দিন লিখুন",
      validMonth: "সঠিক মাস লিখুন",
      pastYear: "অতীতের বছর লিখুন",
      validDate: "তারিখটি নিখুঁত নয়",
      endBeforeStart: "শেষের তারিখটি শুরুর তারিখের পরে হতে হবে",
    },
    bornOn: "শুরুর দিনটি ছিল",
    zodiac: "রাশিফল (Zodiac)",
    nextBirthday: "পরবর্তী জন্মদিন মূলত",
    totalStats: "অতিক্রান্ত জীবন, প্রকৃতি ও মহাজাগতিক মাইলফলক",
    daysLived: "দিন অতিবাহিত",
    hoursLived: "ঘণ্টা অতিবাহিত",
    weeksLived: "সপ্তাহ অতিবাহিত",
    heartbeats: "হৃদস্পন্দন স্পন্দিত",
    customization: "থিম কাস্টমাইজ",
    accentColor: "প্রধান আকর্ষণ রং",
    bgMotionToggle: "ব্যাকগ্রাউন্ড মোশন",
    wcag: "WCAG ২.১ এএ স্ট্যান্ডার্ড",
    daysCount: "দিন",
    monthsCount: "মাস",
    reset: "সব মুছুন",
    themeMode: "চেহারা",
    light: "লাইট",
    dark: "ডার্ক",
    system: "সিস্টেম",

    // New Manual Date & Life calculation tags
    calcMode: "ক্যালকুলেশনের ধরণ",
    untilToday: "আজকের দিন পর্যন্ত (সাধারণ বয়স)",
    customRange: "নির্দিষ্ট দুটি তারিখের পার্থক্য",
    startDateLabel: "শুরুর তারিখ (তারিখ ক)",
    endDateLabel: "শেষের তারিখ (তারিখ খ)",

    // Derived stats titles
    eidFitr: "রোজার ঈদ অতিক্রান্ত",
    eidAdha: "কোরবানির ঈদ অতিক্রান্ত",
    earthOrbit: "মহাকাশে পৃথিবীর ভ্রমণ দূরত্ব",
    sleepHrs: "ঘুমিয়ে সময় কাটিয়েছেন",
    respirations: "শ্বাস-প্রশ্বাস অতিক্রান্ত",
    fullMoons: "পূর্ণিমা দর্শন করেছেন",
    sunsets: "সূর্যোদয় ও সূর্যাস্ত দর্শন",
    seasonsSection: "বাংলাদেশি ঋতুচক্রের স্বাদ পেয়েছেন",
    times: "বার",
    hours: "ঘণ্টা",
    millionKm: "নিযুত কি.মি. (মহাশূন্যে)",

    // Bengali Seasons Translation
    summer: "গ্রীষ্মকাল (গ্রীষ্ম)",
    rainy: "বর্ষাকাল (বর্ষা)",
    autumn: "শরৎকাল (শরৎ)",
    lateAutumn: "হেমন্তকাল (হেমন্ত)",
    winter: "শীতকাল (শীত)",
    spring: "বসন্তকাল (বসন্ত)"
  }
};

// Zodiac Sign finder logic
function getZodiacSign(day: number, month: number, lang: 'en' | 'bn') {
  const zodiacs = [
    { nameEn: "Capricorn", nameBn: "মকর রাশি", start: [12, 22], end: [1, 19] },
    { nameEn: "Aquarius", nameBn: "কুম্ভ রাশি", start: [1, 20], end: [2, 18] },
    { nameEn: "Pisces", nameBn: "মীন রাশি", start: [2, 19], end: [3, 20] },
    { nameEn: "Aries", nameBn: "মেষ রাশি", start: [3, 21], end: [4, 19] },
    { nameEn: "Taurus", nameBn: "বৃষ রাশি", start: [4, 20], end: [5, 20] },
    { nameEn: "Gemini", nameBn: "মিথুন রাশি", start: [5, 21], end: [6, 20] },
    { nameEn: "Cancer", nameBn: "কর্কট রাশি", start: [6, 21], end: [7, 22] },
    { nameEn: "Leo", nameBn: "সিংহ রাশি", start: [7, 23], end: [8, 22] },
    { nameEn: "Virgo", nameBn: "কন্যা রাশি", start: [8, 23], end: [9, 22] },
    { nameEn: "Libra", nameBn: "তুলা রাশি", start: [9, 23], end: [10, 22] },
    { nameEn: "Scorpio", nameBn: "বৃশ্চিক রাশি", start: [10, 23], end: [11, 21] },
    { nameEn: "Sagittarius", nameBn: "ধনু রাশি", start: [11, 22], end: [12, 21] }
  ];

  const target = zodiacs.find(z => {
    const [startM, startD] = z.start;
    const [endM, endD] = z.end;
    if (month === startM && day >= startD) return true;
    if (month === endM && day <= endD) return true;
    return false;
  });

  const matched = target || zodiacs[0];
  return lang === 'en' ? matched.nameEn : matched.nameBn;
}

// Zodiac Sign finder logic in stable English
function getZodiacSignEnglish(day: number, month: number) {
  const zodiacs = [
    { nameEn: "Capricorn", start: [12, 22], end: [1, 19] },
    { nameEn: "Aquarius", start: [1, 20], end: [2, 18] },
    { nameEn: "Pisces", start: [2, 19], end: [3, 20] },
    { nameEn: "Aries", start: [3, 21], end: [4, 19] },
    { nameEn: "Taurus", start: [4, 20], end: [5, 20] },
    { nameEn: "Gemini", start: [5, 21], end: [6, 20] },
    { nameEn: "Cancer", start: [6, 21], end: [7, 22] },
    { nameEn: "Leo", start: [7, 23], end: [8, 22] },
    { nameEn: "Virgo", start: [8, 23], end: [9, 22] },
    { nameEn: "Libra", start: [9, 23], end: [10, 22] },
    { nameEn: "Scorpio", start: [10, 23], end: [11, 21] },
    { nameEn: "Sagittarius", start: [11, 22], end: [12, 21] }
  ];

  const target = zodiacs.find(z => {
    const [startM, startD] = z.start;
    const [endM, endD] = z.end;
    if (month === startM && day >= startD) return true;
    if (month === endM && day <= endD) return true;
    return false;
  });

  return (target || zodiacs[0]).nameEn;
}

// Next Birthday breakdown finder (relative to today or target endpoint)
function getNextBirthdayCountdown(day: number, month: number, baseDateInput?: Date) {
  const today = baseDateInput || new Date();
  const currentYear = today.getFullYear();
  let nextBD = new Date(currentYear, month - 1, day);
  
  if (nextBD < today) {
    nextBD.setFullYear(currentYear + 1);
  }
  
  let diffTime = nextBD.getTime() - today.getTime();
  let totalDiffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let months = Math.floor(totalDiffDays / 30);
  let days = totalDiffDays % 30;
  
  if (months === 12) {
    months = 0;
  }
  
  return { months, days, totalDays: totalDiffDays };
}

const triggerHapticFeedback = () => {
  if (navigator.vibrate) {
    navigator.vibrate(45);
  }
};

const AnimatedNumber = ({ value }: { value: number | null }) => {
  if (value === null) {
    return <span className="text-accent font-bold">--</span>;
  }

  return (
    <motion.span
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="text-accent font-black tracking-tighter"
    >
      <CountUp end={value} />
    </motion.span>
  );
};

const CountUp = ({ end }: { end: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const duration = 1200; 
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end]);

  return <>{count}</>;
};

export default function App() {
  const [calcMode, setCalcMode] = useState<'today' | 'custom'>('today');

  const [formData, setFormData] = useState({
    startDay: "",
    startMonth: "",
    startYear: "",
    endDay: String(new Date().getDate()),
    endMonth: String(new Date().getMonth() + 1),
    endYear: String(new Date().getFullYear()),
  });

  const [errors, setErrors] = useState({
    startDay: "",
    startMonth: "",
    startYear: "",
    endDay: "",
    endMonth: "",
    endYear: "",
  });

  const [results, setResults] = useState<ResultType>({
    years: null,
    months: null,
    days: null,
  });

  // Localized state persistence
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [accent, setAccent] = useState('#854DFF');
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [triggerCelebration, setTriggerCelebration] = useState(0);

  // Scroll detection for next birthday greeting overlay & fires
  const [showGreetingOverlay, setShowGreetingOverlay] = useState(false);
  const [hasTriggeredGreeting, setHasTriggeredGreeting] = useState(false);
  const nextBirthdayRef = useRef<HTMLDivElement | null>(null);

  const activeZodiacElement = useMemo<ZodiacElement>(() => {
    if (results.years === null || !formData.startDay || !formData.startMonth || !formData.startYear) {
      return "none";
    }
    const sd = parseInt(formData.startDay);
    const sm = parseInt(formData.startMonth);
    const sy = parseInt(formData.startYear);
    if (!isValidDate(sd, sm, sy)) return "none";

    const zodiacEn = getZodiacSignEnglish(sd, sm);
    const fire = ["Aries", "Leo", "Sagittarius"];
    const earth = ["Taurus", "Virgo", "Capricorn"];
    const air = ["Gemini", "Libra", "Aquarius"];
    const water = ["Pisces", "Cancer", "Scorpio"];

    if (fire.includes(zodiacEn)) return "fire";
    if (earth.includes(zodiacEn)) return "earth";
    if (air.includes(zodiacEn)) return "air";
    if (water.includes(zodiacEn)) return "water";
    return "none";
  }, [results.years, formData.startDay, formData.startMonth, formData.startYear]);

  // System theme checks
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemIsDark(media.matches);
    const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  // Trigger Birthday Greeting scrolling listener with intersection observer
  useEffect(() => {
    if (!nextBirthdayRef.current || results.years === null || hasTriggeredGreeting) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setHasTriggeredGreeting(true);
        // Pop multiple ascending festive firework flares
        setTriggerCelebration((prev) => prev + 1);
        setTimeout(() => {
          setTriggerCelebration((prev) => prev + 1);
        }, 350);
        setTimeout(() => {
          setTriggerCelebration((prev) => prev + 1);
        }, 650);
        
        // Show Full Screen Festive Overlay
        setShowGreetingOverlay(true);
      }
    }, {
      root: null,
      threshold: 0.1, // Trigger when 10% on screen
    });

    observer.observe(nextBirthdayRef.current);
    return () => {
      observer.disconnect();
    };
  }, [results.years, hasTriggeredGreeting]);

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemIsDark;
    return themeMode === 'dark';
  }, [themeMode, systemIsDark]);

  // Read items from localStorage
  useEffect(() => {
    const savedDate = localStorage.getItem("age-calculator-date-v2");
    // Fallback load from older key if available
    const oldSavedDate = localStorage.getItem("age-calculator-date");

    if (savedDate) {
      try {
        setFormData(JSON.parse(savedDate));
      } catch (e) {
        console.error("Failed parsing", e);
      }
    } else if (oldSavedDate) {
      try {
        const parsed = JSON.parse(oldSavedDate);
        setFormData(prev => ({
          ...prev,
          startDay: parsed.day || "",
          startMonth: parsed.month || "",
          startYear: parsed.year || "",
        }));
      } catch (e) {
        console.error("Failed parsing old format", e);
      }
    }

    const savedMode = localStorage.getItem("editorial-age-calc-mode");
    if (savedMode === "today" || savedMode === "custom") {
      setCalcMode(savedMode);
    }

    const savedLang = localStorage.getItem("editorial-age-lang");
    if (savedLang === "bn" || savedLang === "en") {
      setLang(savedLang);
    }

    const savedTheme = localStorage.getItem("editorial-age-theme-mode");
    if (savedTheme === "dark" || savedTheme === "light" || savedTheme === "system") {
      setThemeMode(savedTheme);
    }

    const savedAccent = localStorage.getItem("editorial-age-accent");
    if (savedAccent) {
      setAccent(savedAccent);
    }

    const savedMotion = localStorage.getItem("editorial-age-motion");
    if (savedMotion !== null) {
      setMotionEnabled(savedMotion === "true");
    }
  }, []);

  // Sync core CSS variables dynamically with document element so page body and layout behaves properly in dark/light mode
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--text-main", isDark ? "#F8F9FA" : "#141414");
    root.style.setProperty("--text-muted", isDark ? "#9EA2A6" : "#716F6F");
    root.style.setProperty("--bg", isDark ? "#0A0A0B" : "#F4F4F6");
    root.style.setProperty("--card-bg", isDark ? "#131315" : "#FFFFFF");
    
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark, accent]);

  const dict = useMemo(() => LANGUAGES[lang], [lang]);

  // Handle live calculation update on valid input changes
  useEffect(() => {
    const sd = parseInt(formData.startDay);
    const sm = parseInt(formData.startMonth);
    const sy = parseInt(formData.startYear);

    if (calcMode === 'today') {
      if (isValidDate(sd, sm, sy) && !isFutureDate(sd, sm, sy)) {
        setResults(calculateAge(sd, sm, sy));
      }
    } else {
      const ed = parseInt(formData.endDay);
      const em = parseInt(formData.endMonth);
      const ey = parseInt(formData.endYear);

      if (isValidDate(sd, sm, sy) && isValidDate(ed, em, ey)) {
        const start = new Date(sy, sm - 1, sd);
        const end = new Date(ey, em - 1, ed);
        if (start <= end) {
          setResults(calculateAge(sd, sm, sy, ed, em, ey));
        }
      }
    }
  }, [formData, calcMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value !== "" && !/^\d+$/.test(value)) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setHasTriggeredGreeting(false);
  };

  const validate = () => {
    const newErrors = {
      startDay: "",
      startMonth: "",
      startYear: "",
      endDay: "",
      endMonth: "",
      endYear: "",
    };
    let hasError = false;

    const sd = parseInt(formData.startDay);
    const sm = parseInt(formData.startMonth);
    const sy = parseInt(formData.startYear);

    // Validate Start Date fields
    if (!formData.startDay) { newErrors.startDay = dict.errors.required; hasError = true; }
    if (!formData.startMonth) { newErrors.startMonth = dict.errors.required; hasError = true; }
    if (!formData.startYear) { newErrors.startYear = dict.errors.required; hasError = true; }

    if (!hasError) {
      if (sd < 1 || sd > 31) { newErrors.startDay = dict.errors.validDay; hasError = true; }
      if (sm < 1 || sm > 12) { newErrors.startMonth = dict.errors.validMonth; hasError = true; }
      if (!isValidDate(sd, sm, sy)) { newErrors.startDay = dict.errors.validDate; hasError = true; }
      
      if (calcMode === 'today' && isFutureDate(sd, sm, sy)) {
        newErrors.startYear = dict.errors.pastYear;
        hasError = true;
      }
    }

    // Validate custom End Date fields if custom mode
    if (calcMode === 'custom') {
      let hasEndEmpty = false;
      if (!formData.endDay) { newErrors.endDay = dict.errors.required; hasEndEmpty = true; hasError = true; }
      if (!formData.endMonth) { newErrors.endMonth = dict.errors.required; hasEndEmpty = true; hasError = true; }
      if (!formData.endYear) { newErrors.endYear = dict.errors.required; hasEndEmpty = true; hasError = true; }

      if (!hasEndEmpty) {
        const ed = parseInt(formData.endDay);
        const em = parseInt(formData.endMonth);
        const ey = parseInt(formData.endYear);

        if (ed < 1 || ed > 31) { newErrors.endDay = dict.errors.validDay; hasError = true; }
        if (em < 1 || em > 12) { newErrors.endMonth = dict.errors.validMonth; hasError = true; }
        if (!isValidDate(ed, em, ey)) { newErrors.endDay = dict.errors.validDate; hasError = true; }

        if (!hasError) {
          const startDateFull = new Date(sy, sm - 1, sd);
          const endDateFull = new Date(ey, em - 1, ed);
          if (startDateFull > endDateFull) {
            newErrors.endYear = dict.errors.endBeforeStart;
            hasError = true;
          }
        }
      }
    }

    setErrors(newErrors);
    return !hasError;
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      triggerHapticFeedback();
      const sd = parseInt(formData.startDay);
      const sm = parseInt(formData.startMonth);
      const sy = parseInt(formData.startYear);
      
      let res;
      if (calcMode === 'today') {
        res = calculateAge(sd, sm, sy);
      } else {
        const ed = parseInt(formData.endDay);
        const em = parseInt(formData.endMonth);
        const ey = parseInt(formData.endYear);
        res = calculateAge(sd, sm, sy, ed, em, ey);
      }
      setResults(res);
      setTriggerCelebration((prev) => prev + 1);
      setHasTriggeredGreeting(false);

      // Persist state
      localStorage.setItem("age-calculator-date-v2", JSON.stringify(formData));
    } else {
      setResults({ years: null, months: null, days: null });
    }
  };

  const handleReset = () => {
    setFormData({
      startDay: "",
      startMonth: "",
      startYear: "",
      endDay: String(new Date().getDate()),
      endMonth: String(new Date().getMonth() + 1),
      endYear: String(new Date().getFullYear()),
    });
    setErrors({
      startDay: "",
      startMonth: "",
      startYear: "",
      endDay: "",
      endMonth: "",
      endYear: "",
    });
    setResults({ years: null, months: null, days: null });
    localStorage.removeItem("age-calculator-date-v2");
    setHasTriggeredGreeting(false);
    setShowGreetingOverlay(false);
    triggerHapticFeedback();
  };

  const handleModeSwitch = (mode: 'today' | 'custom') => {
    setCalcMode(mode);
    localStorage.setItem("editorial-age-calc-mode", mode);
    setResults({ years: null, months: null, days: null });
    triggerHapticFeedback();
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    localStorage.setItem("editorial-age-lang", nextLang);
    triggerHapticFeedback();
  };

  const updateAccent = (val: string) => {
    setAccent(val);
    localStorage.setItem("editorial-age-accent", val);
    triggerHapticFeedback();
  };

  const toggleMotion = () => {
    const nextMotion = !motionEnabled;
    setMotionEnabled(nextMotion);
    localStorage.setItem("editorial-age-motion", nextMotion ? "true" : "false");
    triggerHapticFeedback();
  };

  const updateThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    localStorage.setItem("editorial-age-theme-mode", mode);
    triggerHapticFeedback();
  };

  // Calculates enhanced traditional seasons and religious Eids/Cosmic statistics
  const derivedStats = useMemo(() => {
    if (results.years === null || !formData.startDay || !formData.startMonth || !formData.startYear) {
      return null;
    }

    const sd = parseInt(formData.startDay);
    const sm = parseInt(formData.startMonth);
    const sy = parseInt(formData.startYear);

    if (!isValidDate(sd, sm, sy)) return null;

    const startDate = new Date(sy, sm - 1, sd);
    
    // Set custom target endpoint date depending on calculation mode
    let endDateObj = new Date();
    if (calcMode === 'custom') {
      const ed = parseInt(formData.endDay);
      const em = parseInt(formData.endMonth);
      const ey = parseInt(formData.endYear);
      if (!isValidDate(ed, em, ey)) return null;
      endDateObj = new Date(ey, em - 1, ed);
    }

    if (startDate > endDateObj) return null;

    const birthDayName = (() => {
      const daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const daysBn = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
      return lang === 'en' ? daysEn[startDate.getDay()] : daysBn[startDate.getDay()];
    })();

    const zodiacSign = getZodiacSign(sd, sm, lang);
    const countdown = getNextBirthdayCountdown(sd, sm, endDateObj);

    // Compute basic intervals
    const diffMs = endDateObj.getTime() - startDate.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    // Math computations for Eids and Nature statistics
    const decimalYears = totalDays / 365.2425;
    
    // 1 Ramadan Eid & 1 Qurbani Eid per lunar year (354.36 days)
    const lunarFactor = 354.36;
    const estEidFitr = Math.max(0, Math.floor(totalDays / lunarFactor));
    const estEidAdha = Math.max(0, Math.floor(totalDays / lunarFactor));

    // Seasons in Bangladesh - 6 distinct seasons occur annually
    // Summer, Rainy, Autumn, Late Autumn, Winter, Spring
    const baseCycles = Math.max(0, Math.floor(decimalYears));
    
    // Calculate fractional month overlap for a more precise experience number
    const fraction = decimalYears - baseCycles;
    const getSeasonalOccurrence = (offsetMonth: number) => {
      // rough offset approximation based on starting month
      const startRelative = (sm + fraction * 12) % 12;
      return baseCycles + (startRelative >= offsetMonth ? 1 : 0);
    };

    const estSummer = getSeasonalOccurrence(4);    // Boishakh starts Apr/May (Month index 4approximate)
    const estRainy = getSeasonalOccurrence(6);     // Asharh starts Jun/July
    const estAutumn = getSeasonalOccurrence(8);    // Bhadra starts Aug/Sept
    const estLateAutumn = getSeasonalOccurrence(10); // Kartik starts Oct/Nov
    const estWinter = getSeasonalOccurrence(0);    // Poush starts Dec/Jan
    const estSpring = getSeasonalOccurrence(2);    // Falgun starts Feb/Mar

    // Unique cosmic stats
    const estHeartbeats = totalDays * 24 * 60 * 75; // average resting 75 bpm
    const estBreaths = totalDays * 24 * 60 * 16;     // average 16 breaths/min
    const estSleep = Math.floor(totalDays * 8);      // 8 hours deep restful sleep average
    const estFullMoons = Math.floor(totalDays / 29.53); // synodic month
    const estOrbitTravel = Math.floor(decimalYears * 940); // 940 million km around the sun annually
    const estSunrisesText = totalDays; // 1 sunrise per day

    return {
      bornDay: birthDayName,
      zodiac: zodiacSign,
      countdown,
      totalDays,
      totalWeeks,
      totalHours,
      estEidFitr,
      estEidAdha,
      estSummer,
      estRainy,
      estAutumn,
      estLateAutumn,
      estWinter,
      estSpring,
      estHeartbeats,
      estBreaths,
      estSleep,
      estFullMoons,
      estOrbitTravel,
      estSunrisesText
    };
  }, [results, formData, lang, calcMode]);

  // Style properties mapped dynamically
  const cssVariables = {
    "--accent": accent,
    "--error": "#FF5757",
    "--text-main": isDark ? "#F8F9FA" : "#141414",
    "--text-muted": isDark ? "#9EA2A6" : "#716F6F",
    "--bg": isDark ? "#0A0A0B" : "#F4F4F6",
    "--card-bg": isDark ? "#131315" : "#FFFFFF",
  } as React.CSSProperties;

  return (
    <div 
      style={cssVariables}
      className="min-h-screen w-full relative overflow-x-hidden flex flex-col justify-between transition-colors duration-500"
    >
      {/* Fireworks particles celebration canvas overlay */}
      <FireworksCanvas activeToggle={triggerCelebration} accentColor={accent} isDark={isDark} />

      {/* Birthday Greeting festive overlay triggers on scrolling nextBirthday card */}
      <BirthdayGreetingOverlay
        isVisible={showGreetingOverlay}
        onClose={() => setShowGreetingOverlay(false)}
        lang={lang}
        zodiacName={derivedStats?.zodiac}
        daysRemaining={derivedStats?.countdown?.totalDays}
      />

      {/* Zodiac interactive ambient particle background */}
      <ZodiacThemeBackground element={activeZodiacElement} enabled={motionEnabled} />

      {/* Background drifting glow circles with option to disable */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {motionEnabled && (
            <>
              <motion.div 
                className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full opacity-15 dark:opacity-10 blur-[80px] md:blur-[120px]"
                style={{ backgroundColor: accent }}
                animate={{
                  x: [0, 50, -30, 0],
                  y: [0, -40, 60, 0],
                  scale: [1, 1.15, 0.9, 1]
                }}
                transition={{
                  duration: 22,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div 
                className="absolute right-0 bottom-0 w-[250px] h-[250px] md:w-[500px] md:h-[500px] rounded-full opacity-10 dark:opacity-5 blur-[70px] md:blur-[100px]"
                style={{ backgroundColor: accent }}
                animate={{
                  x: [0, -60, 40, 0],
                  y: [0, 50, -40, 0],
                  scale: [1, 0.85, 1.15, 1]
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Top Header controls panel */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          <span className="font-serif italic font-black text-xl text-text-main">
            {lang === 'en' ? 'Chronicle Age Canvas' : 'ক্রনিকল কালপঞ্জি'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Bengali & English Toggle */}
          <motion.button
            onClick={toggleLanguage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-text-muted/20 hover:border-accent text-xs font-semibold bg-surface/50 hover:bg-surface text-text-main transition-all cursor-pointer shadow-sm hover:bg-accent/10 hover:text-accent"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
          </motion.button>

          {/* Theme & customizer toggle icon */}
          <motion.button
            onClick={() => {
              setShowSettings(!showSettings);
              triggerHapticFeedback();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2.5 rounded-full border border-text-muted/20 hover:border-accent text-text-main bg-surface/50 hover:bg-surface transition-all cursor-pointer hover:bg-accent/10 hover:text-accent ${showSettings ? 'border-accent bg-accent/20 ring-2 ring-accent/35 shadow-lg shadow-accent/15' : ''}`}
            aria-label={dict.customization}
            title={dict.customization}
          >
            <Paintbrush className="w-4 h-4 text-accent" />
          </motion.button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 py-4 flex-grow flex flex-col justify-center items-center z-10 pb-16">
        
        {/* Dynamic theme settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="w-full max-w-[740px] mb-8 overflow-hidden"
            >
              <div className="p-6 md:p-8 rounded-2xl bg-surface border border-text-muted/10 shadow-xl text-text-main flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-text-muted/10 pb-4">
                  <h3 className="font-serif font-black italic text-lg flex items-center gap-2 text-text-main">
                    <Paintbrush className="w-4 h-4 text-accent" />
                    {dict.customization}
                  </h3>
                  <motion.button 
                    onClick={() => setShowSettings(false)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs font-black text-text-muted hover:text-accent uppercase tracking-wider cursor-pointer px-2 py-1 rounded hover:bg-accent/5 transition-all"
                  >
                    {lang === 'en' ? 'Close' : 'বন্ধ করুন'}
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Color Preset Palette */}
                  <div className="flex flex-col gap-3">
                    <span id="accent-lbl" className="text-xs font-bold uppercase tracking-widest text-text-muted">
                      {dict.accentColor}
                    </span>
                    <div className="flex items-center gap-3.5 flex-wrap" role="radiogroup" aria-labelledby="accent-lbl">
                      {ACCENT_COLORS.map((col) => (
                        <motion.button
                          key={col.name}
                          onClick={() => updateAccent(col.value)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          style={{ backgroundColor: col.value }}
                          className={`w-10 h-10 rounded-full cursor-pointer relative transition-all flex items-center justify-center ${accent === col.value ? 'ring-4 ring-accent/35 scale-110 shadow-lg shadow-accent/25' : 'opacity-85 hover:opacity-100'}`}
                          title={lang === 'en' ? col.titleEn : col.titleBn}
                          aria-label={lang === 'en' ? col.titleEn : col.titleBn}
                        >
                          {accent === col.value && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Theme selection & Motion options */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                        {dict.themeMode}
                      </span>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-background rounded-xl border border-text-muted/10">
                        {(['light', 'dark', 'system'] as const).map((mode) => (
                          <motion.button
                            key={mode}
                            onClick={() => updateThemeMode(mode)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`py-1.5 md:py-2 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer flex items-center justify-center gap-1 border border-transparent ${themeMode === mode ? 'bg-accent text-white shadow-md shadow-accent/15' : 'text-text-muted hover:text-text-main hover:bg-accent/10 hover:border-accent/5'}`}
                          >
                            {mode === 'light' && <Sun className="w-3.5 h-3.5" />}
                            {mode === 'dark' && <Moon className="w-3.5 h-3.5" />}
                            {mode === 'system' && <Compass className="w-3.5 h-3.5" />}
                            <span>{dict[mode]}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-text-muted/10 pt-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                        {dict.bgMotionToggle}
                      </span>
                      <motion.button
                        onClick={toggleMotion}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative cursor-pointer ${motionEnabled ? "bg-accent" : "bg-text-muted/20"}`}
                        aria-label="Toggle motion background"
                      >
                        <motion.div 
                          className="w-4 h-4 rounded-full bg-white shadow-md"
                          layout
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          animate={{ x: motionEnabled ? 24 : 0 }}
                        />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calculation Mode Selector controls */}
        <div className="w-full max-w-[740px] mb-6">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-text-muted/80 px-1">
              {dict.calcMode}
            </span>
            <div className="grid grid-cols-2 p-1 bg-surface border border-text-muted/10 rounded-xl max-w-lg shadow-sm">
              <motion.button
                type="button"
                onClick={() => handleModeSwitch('today')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2.5 sm:py-3 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-transparent ${calcMode === 'today' ? 'bg-accent text-white shadow-md shadow-accent/15' : 'text-text-muted hover:text-text-main hover:bg-accent/10 hover:text-accent'}`}
              >
                <Clock className="w-4 h-4" />
                <span>{dict.untilToday}</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handleModeSwitch('custom')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2.5 sm:py-3 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-transparent ${calcMode === 'custom' ? 'bg-accent text-white shadow-md shadow-accent/15' : 'text-text-muted hover:text-text-main hover:bg-accent/10 hover:text-accent'}`}
              >
                <Calendar className="w-4 h-4" />
                <span>{dict.customRange}</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* The core design age sheet card */}
        <div 
          className="bg-surface w-full max-w-[740px] p-6 sm:p-10 md:p-14 rounded-2xl md:rounded-[24px_24px_200px_24px] shadow-2xl transition-all duration-500 hover:shadow-accent/5 flex flex-col justify-between relative border border-text-muted/5 font-sans"
        >
          {/* Subtle watermark in Bengali or English for an editorial look */}
          <div className="absolute top-4 left-6 sm:left-10 text-[9px] uppercase tracking-[0.3em] text-text-muted/40 font-mono select-none">
            {lang === 'en' ? 'ESTABLISHED 2026 / CHRONICLE' : 'ক্রনিকল সংস্করণ ২০২৬'}
          </div>

          <form onSubmit={handleCalculate} noValidate className="border-b border-[#DCDCDC]/70 dark:border-text-muted/20 pb-10">
            <h1 className="text-xl md:text-2xl font-serif italic text-text-main font-black tracking-tight mb-8 mt-4">
              {dict.title}
              <span className="block text-xs font-sans not-italic font-medium text-text-muted mt-1.5 leading-relaxed">
                {dict.subtitle}
              </span>
            </h1>

            {/* Date Picker Input Fields Section */}
            <div className="flex flex-col gap-8">
              
              {/* Start Date fields */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-accent font-mono block">
                  {calcMode === 'custom' ? dict.startDateLabel : dict.untilToday}
                </span>

                <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-[540px]">
                  <div className="flex flex-col gap-1.5">
                    <label 
                      htmlFor="startDay"
                      className={`text-[11px] font-bold tracking-[0.25em] uppercase transition-colors ${errors.startDay ? 'text-error font-extrabold' : 'text-text-muted'}`}
                    >
                      {dict.day}
                    </label>
                    <input
                      id="startDay"
                      name="startDay"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="DD"
                      value={formData.startDay}
                      onChange={handleChange}
                      className={`text-2xl md:text-3xl font-bold p-3 px-4 md:px-6 border rounded-lg bg-transparent text-text-main outline-none transition-all placeholder:text-text-muted/30 focus:border-accent ${errors.startDay ? 'border-error ring-1 ring-error/20' : 'border-[#DCDCDC] dark:border-text-muted/40'}`}
                      aria-invalid={!!errors.startDay}
                      aria-describedby="start-day-error"
                    />
                    <p id="start-day-error" className="text-[10px] italic text-error min-h-[1.2rem] leading-snug">
                      {errors.startDay}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label 
                      htmlFor="startMonth"
                      className={`text-[11px] font-bold tracking-[0.25em] uppercase transition-colors ${errors.startMonth ? 'text-error font-extrabold' : 'text-text-muted'}`}
                    >
                      {dict.month}
                    </label>
                    <input
                      id="startMonth"
                      name="startMonth"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="MM"
                      value={formData.startMonth}
                      onChange={handleChange}
                      className={`text-2xl md:text-3xl font-bold p-3 px-4 md:px-6 border rounded-lg bg-transparent text-text-main outline-none transition-all placeholder:text-text-muted/30 focus:border-accent ${errors.startMonth ? 'border-error ring-1 ring-error/20' : 'border-[#DCDCDC] dark:border-text-muted/40'}`}
                      aria-invalid={!!errors.startMonth}
                      aria-describedby="start-month-error"
                    />
                    <p id="start-month-error" className="text-[10px] italic text-error min-h-[1.2rem] leading-snug">
                      {errors.startMonth}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label 
                      htmlFor="startYear"
                      className={`text-[11px] font-bold tracking-[0.25em] uppercase transition-colors ${errors.startYear ? 'text-error font-extrabold' : 'text-text-muted'}`}
                    >
                      {dict.year}
                    </label>
                    <input
                      id="startYear"
                      name="startYear"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="YYYY"
                      value={formData.startYear}
                      onChange={handleChange}
                      className={`text-2xl md:text-3xl font-bold p-3 px-4 md:px-6 border rounded-lg bg-transparent text-text-main outline-none transition-all placeholder:text-text-muted/30 focus:border-accent ${errors.startYear ? 'border-error ring-1 ring-error/20' : 'border-[#DCDCDC] dark:border-text-muted/40'}`}
                      aria-invalid={!!errors.startYear}
                      aria-describedby="start-year-error"
                    />
                    <p id="start-year-error" className="text-[10px] italic text-error min-h-[1.2rem] leading-snug">
                      {errors.startYear}
                    </p>
                  </div>
                </div>
              </div>

              {/* End Date elements (Target range fields) rendered only if calculation range is Custom */}
              <AnimatePresence>
                {calcMode === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-3 border-t border-text-muted/10 pt-6 overflow-hidden"
                  >
                    <span className="text-xs font-extrabold uppercase tracking-widest text-accent font-mono block">
                      {dict.endDateLabel}
                    </span>

                    <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-[540px]">
                      <div className="flex flex-col gap-1.5">
                        <label 
                          htmlFor="endDay"
                          className={`text-[11px] font-bold tracking-[0.25em] uppercase transition-colors ${errors.endDay ? 'text-error font-extrabold' : 'text-text-muted'}`}
                        >
                          {dict.day}
                        </label>
                        <input
                          id="endDay"
                          name="endDay"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="DD"
                          value={formData.endDay}
                          onChange={handleChange}
                          className={`text-2xl md:text-3xl font-bold p-3 px-4 md:px-6 border rounded-lg bg-transparent text-text-main outline-none transition-all placeholder:text-text-muted/30 focus:border-accent ${errors.endDay ? 'border-error ring-1 ring-error/20' : 'border-[#DCDCDC] dark:border-text-muted/40'}`}
                          aria-invalid={!!errors.endDay}
                          aria-describedby="end-day-error"
                        />
                        <p id="end-day-error" className="text-[10px] italic text-error min-h-[1.2rem] leading-snug">
                          {errors.endDay}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label 
                          htmlFor="endMonth"
                          className={`text-[11px] font-bold tracking-[0.25em] uppercase transition-colors ${errors.endMonth ? 'text-error font-extrabold' : 'text-text-muted'}`}
                        >
                          {dict.month}
                        </label>
                        <input
                          id="endMonth"
                          name="endMonth"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="MM"
                          value={formData.endMonth}
                          onChange={handleChange}
                          className={`text-2xl md:text-3xl font-bold p-3 px-4 md:px-6 border rounded-lg bg-transparent text-text-main outline-none transition-all placeholder:text-text-muted/30 focus:border-accent ${errors.endMonth ? 'border-error ring-1 ring-error/20' : 'border-[#DCDCDC] dark:border-text-muted/40'}`}
                          aria-invalid={!!errors.endMonth}
                          aria-describedby="end-month-error"
                        />
                        <p id="end-month-error" className="text-[10px] italic text-error min-h-[1.2rem] leading-snug">
                          {errors.endMonth}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label 
                          htmlFor="endYear"
                          className={`text-[11px] font-bold tracking-[0.25em] uppercase transition-colors ${errors.endYear ? 'text-error font-extrabold' : 'text-text-muted'}`}
                        >
                          {dict.year}
                        </label>
                        <input
                          id="endYear"
                          name="endYear"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="YYYY"
                          value={formData.endYear}
                          onChange={handleChange}
                          className={`text-2xl md:text-3xl font-bold p-3 px-4 md:px-6 border rounded-lg bg-transparent text-text-main outline-none transition-all placeholder:text-text-muted/30 focus:border-accent ${errors.endYear ? 'border-error ring-1 ring-error/20' : 'border-[#DCDCDC] dark:border-text-muted/40'}`}
                          aria-invalid={!!errors.endYear}
                          aria-describedby="end-year-error"
                        />
                        <p id="end-year-error" className="text-[10px] italic text-error min-h-[1.2rem] leading-snug">
                          {errors.endYear}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Row featuring submit line & reset */}
            <div className="relative flex items-center mt-8 md:mt-12 h-16 md:h-24">
              <div className="flex-grow h-[1px] bg-[#DCDCDC]/70 dark:bg-text-muted/20"></div>
              
              <div className="absolute right-1/2 translate-x-1/2 md:right-0 md:translate-x-0 flex items-center gap-4">
                {(formData.startDay || formData.startMonth || formData.startYear) && (
                  <motion.button
                    type="button"
                    onClick={handleReset}
                    whileHover={{ scale: 1.08, rotate: -15 }}
                    whileTap={{ scale: 0.92 }}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full border border-text-muted/20 hover:border-accent/40 text-text-muted hover:text-accent bg-surface/80 hover:bg-accent/5 flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 group"
                    aria-label={dict.reset}
                    title={dict.reset}
                  >
                    <RotateCcw className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:rotate-[-45deg] text-accent" />
                  </motion.button>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.08, rotate: 5 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-accent hover:opacity-95 text-white flex items-center justify-center cursor-pointer shadow-lg hover:shadow-accent/40 transition-all duration-300 group relative border-2 border-white/10 overflow-hidden"
                  aria-label={dict.calculate}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <svg 
                    viewBox="0 0 46 44" 
                    className="w-8 h-8 md:w-11 md:h-11 transition-transform group-hover:scale-110"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M1 22.019C8.333 21.686 23 25.616 23 44M23 44V0M23 44C23 25.616 37.667 21.686 45 22.019" 
                      stroke="#FFF" 
                      strokeWidth="3.5" 
                      fill="none" 
                      fillRule="evenodd"
                    />
                  </svg>
                </motion.button>
              </div>
            </div>
          </form>

          {/* Primary Results Block (Classic italic Georgia setup - beautifully centered and mobile responsive) */}
          <div className="results flex flex-col items-center justify-center text-center py-8 md:py-12 gap-2 md:gap-4 w-full select-none">
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="result-line justify-center text-4xl min-[360px]:text-5xl sm:text-7xl md:text-8xl lg:text-[104px] leading-none tracking-tight transition-transform duration-300 w-full"
            >
              <AnimatedNumber value={results.years} />
              <span className="text-text-main font-bold select-none">{dict.yearsUnit}</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="result-line justify-center text-4xl min-[360px]:text-5xl sm:text-7xl md:text-8xl lg:text-[104px] leading-none tracking-tight transition-transform duration-300 w-full"
            >
              <AnimatedNumber value={results.months} />
              <span className="text-text-main font-bold select-none">{dict.monthsUnit}</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="result-line justify-center text-4xl min-[360px]:text-5xl sm:text-7xl md:text-8xl lg:text-[104px] leading-none tracking-tight transition-transform duration-300 w-full"
            >
              <AnimatedNumber value={results.days} />
              <span className="text-text-main font-bold select-none">{dict.daysUnit}</span>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Life & Seasons Statistics */}
        <AnimatePresence>
          {derivedStats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              className="w-full max-w-[740px] mt-8 flex flex-col gap-8"
            >
              <div className="bg-surface/85 backdrop-blur-md border border-text-muted/10 p-6 md:p-8 rounded-2xl shadow-xl flex flex-col gap-6">
                
                {/* Section Header */}
                <div className="flex items-center gap-2 border-b border-text-muted/10 pb-4">
                  <Smile className="w-5 h-5 text-accent animate-bounce" />
                  <h3 className="font-serif italic font-black text-xl text-text-main">
                    {lang === 'en' ? 'Astrological & Milestone Overview' : 'জ্যোতির্বিদ্যা ও মাইলফলক ওভারভিউ'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Birth weekday box */}
                  <div className="bg-background/60 p-4 rounded-xl border border-text-muted/5 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                      {dict.bornOn}
                    </span>
                    <span className="font-serif italic font-extrabold text-lg text-accent">
                      {derivedStats.bornDay}
                    </span>
                  </div>

                  {/* Zodiac banner */}
                  <div className="bg-background/60 p-4 rounded-xl border border-text-muted/5 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                      {dict.zodiac}
                    </span>
                    <span className="font-serif italic font-extrabold text-lg text-accent">
                      {derivedStats.zodiac}
                    </span>
                  </div>

                  {/* Next Birthday countdown */}
                  <div 
                    ref={nextBirthdayRef} 
                    className={`bg-background/60 col-span-2 p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden transition-all duration-700 hover:shadow-md ${
                      hasTriggeredGreeting 
                        ? "border-accent/40 shadow-[0_0_15px_rgba(133,77,255,0.15)] bg-accent/5" 
                        : "border-text-muted/5"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                      {dict.nextBirthday}
                    </span>
                    <div className="flex items-baseline gap-1.5 font-serif italic text-accent font-extrabold text-base">
                      {derivedStats.countdown.months > 0 && (
                        <>
                          <span className="text-xl font-black">{derivedStats.countdown.months}</span>
                          <span className="text-xs font-sans not-italic text-text-muted mr-1">
                            {dict.monthsCount}
                          </span>
                        </>
                      )}
                      <span className="text-xl font-black">{derivedStats.countdown.days}</span>
                      <span className="text-xs font-sans not-italic text-text-muted mr-1">
                        {dict.daysCount}
                      </span>
                      <span className="text-xs font-sans not-italic font-bold text-text-main ml-auto">
                        ({derivedStats.countdown.totalDays} {dict.daysCount})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Islamic Lunar Calendars Section (Eids) */}
                <div className="border-t border-text-muted/10 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-accent" />
                    {lang === 'en' ? 'Religious Festive Milestones (Islamic Lunar)' : 'ধর্মীয় বাৎসরিক উৎসব মাইলফলক (চন্দ্র পঞ্জিকা)'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-background/40 hover:bg-background/60 rounded-xl border border-text-muted/5 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-main">{dict.eidFitr}</span>
                        <span className="text-[10px] text-text-muted">{lang === 'en' ? '1st Shawwal celebrations' : 'পবিত্র শাওয়াল মাসের উৎসব'}</span>
                      </div>
                      <span className="font-serif italic font-black text-2xl text-accent">
                        {derivedStats.estEidFitr} <span className="text-xs font-sans not-italic text-text-main font-semibold">{dict.times}</span>
                      </span>
                    </div>

                    <div className="p-4 bg-background/40 hover:bg-background/60 rounded-xl border border-text-muted/5 flex items-center justify-between transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-main">{dict.eidAdha}</span>
                        <span className="text-[10px] text-text-muted">{lang === 'en' ? '10th Dhu al-Hijjah celebrations' : 'পবিত্র জিলহজ্জ মাসের রোমাঞ্চ'}</span>
                      </div>
                      <span className="font-serif italic font-black text-2xl text-accent">
                        {derivedStats.estEidAdha} <span className="text-xs font-sans not-italic text-text-main font-semibold">{dict.times}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bangladesh 6 Traditional Seasons Experienced */}
                <div className="border-t border-text-muted/10 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-extrabold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-accent" />
                    {dict.seasonsSection}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Summer */}
                    <div className="bg-background/40 p-3 rounded-lg border border-text-muted/5 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase block leading-relaxed">{dict.summer}</span>
                      <span className="font-serif italic font-black text-lg text-accent mt-1">{derivedStats.estSummer} {dict.times}</span>
                    </div>

                    {/* Rainy */}
                    <div className="bg-background/40 p-3 rounded-lg border border-text-muted/5 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase block leading-relaxed">{dict.rainy}</span>
                      <span className="font-serif italic font-black text-lg text-accent mt-1">{derivedStats.estRainy} {dict.times}</span>
                    </div>

                    {/* Autumn */}
                    <div className="bg-background/40 p-3 rounded-lg border border-text-muted/5 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase block leading-relaxed">{dict.autumn}</span>
                      <span className="font-serif italic font-black text-lg text-accent mt-1">{derivedStats.estAutumn} {dict.times}</span>
                    </div>

                    {/* Late Autumn */}
                    <div className="bg-background/40 p-3 rounded-lg border border-text-muted/5 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase block leading-relaxed">{dict.lateAutumn}</span>
                      <span className="font-serif italic font-black text-lg text-accent mt-1">{derivedStats.estLateAutumn} {dict.times}</span>
                    </div>

                    {/* Winter */}
                    <div className="bg-background/40 p-3 rounded-lg border border-text-muted/5 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase block leading-relaxed">{dict.winter}</span>
                      <span className="font-serif italic font-black text-lg text-accent mt-1">{derivedStats.estWinter} {dict.times}</span>
                    </div>

                    {/* Spring */}
                    <div className="bg-background/40 p-3 rounded-lg border border-text-muted/5 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-text-muted uppercase block leading-relaxed">{dict.spring}</span>
                      <span className="font-serif italic font-black text-lg text-accent mt-1">{derivedStats.estSpring} {dict.times}</span>
                    </div>
                  </div>
                </div>

                {/* General Bio and Environmental Metrics */}
                <div className="border-t border-text-muted/10 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                    <Hourglass className="w-3.5 h-3.5 text-accent" />
                    {dict.totalStats}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background/30 p-3 rounded-xl border border-text-muted/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{dict.daysLived}</span>
                      <span className="font-serif italic font-black text-lg text-text-main">{derivedStats.totalDays.toLocaleString()} <span className="text-xs font-sans not-italic text-text-muted">{dict.daysCount}</span></span>
                    </div>

                    <div className="bg-background/30 p-3 rounded-xl border border-text-muted/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{dict.weeksLived}</span>
                      <span className="font-serif italic font-black text-lg text-text-main">{derivedStats.totalWeeks.toLocaleString()} <span className="text-xs font-sans not-italic text-text-muted">{lang === 'en' ? 'weeks' : 'সপ্তাহ'}</span></span>
                    </div>

                    <div className="bg-background/30 p-3 rounded-xl border border-text-muted/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{dict.hoursLived}</span>
                      <span className="font-serif italic font-black text-base lg:text-lg text-text-main">{derivedStats.totalHours.toLocaleString()} <span className="text-xs font-sans not-italic text-text-muted">{dict.hours}</span></span>
                    </div>

                    <div className="bg-background/30 p-3 rounded-xl border border-text-muted/5 flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{dict.heartbeats}</span>
                        <span className="font-serif italic font-black text-base lg:text-lg text-text-main">{derivedStats.estHeartbeats.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Second row of bio statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                    {/* Breath taken */}
                    <div className="bg-background/30 p-3.5 rounded-xl border border-text-muted/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{dict.respirations}</span>
                      <span className="font-serif italic font-black text-base lg:text-lg text-text-main">{derivedStats.estBreaths.toLocaleString()}</span>
                    </div>

                    {/* Sleep hours */}
                    <div className="bg-background/30 p-3.5 rounded-xl border border-text-muted/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{dict.sleepHrs}</span>
                      <span className="font-serif italic font-black text-base lg:text-lg text-text-main">{derivedStats.estSleep.toLocaleString()} <span className="text-xs font-sans not-italic text-text-muted">{dict.hours}</span></span>
                    </div>

                    {/* Synodic full moons seen */}
                    <div className="bg-background/30 p-3.5 rounded-xl border border-text-muted/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{dict.fullMoons}</span>
                      <span className="font-serif italic font-black text-lg text-text-main">{derivedStats.estFullMoons.toLocaleString()} <span className="text-xs font-sans not-italic text-text-muted">{dict.times}</span></span>
                    </div>

                    {/* Planet earth journey */}
                    <div className="bg-background/30 p-3.5 rounded-xl border border-text-muted/5">
                      <span className="text-[10px] font-bold text-text-muted uppercase block mb-1">{dict.earthOrbit}</span>
                      <span className="font-serif italic font-black text-base text-text-main">{derivedStats.estOrbitTravel.toLocaleString()} <span className="text-[10px] font-sans not-italic text-text-muted block mt-0.5">{dict.millionKm}</span></span>
                    </div>
                  </div>
                </div>

              </div>
              <CalendarSyncWidget lang={lang} formData={formData} dict={dict} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Block */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-text-muted/10 flex flex-col md:flex-row items-center justify-between text-xs text-text-muted gap-4 z-10">
        <div className="flex flex-col gap-1 text-center md:text-left select-none">
          <p className="font-serif italic font-extrabold text-sm text-text-main tracking-wide">
            {lang === 'en' ? 'Web Developer Muddassir Billah' : 'ওয়েব ডেভেলপার মুদ্দাস্সির বিল্লাহ'}
          </p>
          <p className="font-sans font-semibold text-[11px] text-text-muted">
            {lang === 'en' ? 'Developer of Dream Cyber Security Limited' : 'ড্রিম সাইবার সিকিউরিটি লিমিটেডের ডেভলপার'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 opacity-65 font-mono tracking-wider uppercase text-[10px] select-none">
          <Calendar className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>{dict.wcag}</span>
        </div>
      </footer>
    </div>
  );
}
