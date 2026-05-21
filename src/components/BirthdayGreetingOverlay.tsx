import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cake, Sparkles, Gift, X } from "lucide-react";

interface BirthdayGreetingOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  lang: "en" | "bn";
  zodiacName?: string;
  daysRemaining?: number;
}

const translateNumber = (num: number, lang: "en" | "bn"): string => {
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

export const BirthdayGreetingOverlay: React.FC<BirthdayGreetingOverlayProps> = ({
  isVisible,
  onClose,
  lang,
  zodiacName,
  daysRemaining,
}) => {
  // Auto close timer after 4.5 seconds for gentle reading
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="birthday-greeting-toast"
          initial={{ opacity: 0, y: 40, x: 20, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            x: 0, 
            scale: 1,
            transition: { type: "spring", stiffness: 120, damping: 14 }
          }}
          exit={{ 
            opacity: 0, 
            y: 20, 
            scale: 0.95, 
            transition: { duration: 0.25, ease: "easeInOut" } 
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] w-[calc(100vw-2rem)] max-w-sm pointer-events-auto select-none"
        >
          <div
            className="relative p-5 rounded-2xl bg-surface/90 backdrop-blur-md border border-accent/30 shadow-[0_10px_35px_rgba(var(--accent-rgb),0.12)] flex gap-4 items-center overflow-hidden"
          >
            {/* Soft accent background glow */}
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-accent/15 blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 p-1 rounded-full text-text-muted hover:text-accent hover:bg-accent/10 transition-colors pointer-events-auto cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Celebrating Icon with bounce */}
            <motion.div
              animate={{ 
                scale: [1, 1.08, 1],
                rotate: [0, -4, 4, 0]
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-tr from-accent to-pink-500 flex items-center justify-center shadow-md relative"
            >
              <Cake className="w-6 h-6 text-white" />
              <motion.div 
                className="absolute -top-1 -right-1 text-yellow-300"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Sparkles className="w-3 h-3 fill-current" />
              </motion.div>
            </motion.div>

            {/* Greeting Text Information */}
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase block mb-0.5">
                {lang === "bn" ? "জন্মদিনের শুভেচ্ছা!" : "Celebration!"}
              </span>
              <h3 className="font-serif italic font-black text-lg bg-gradient-to-r from-accent to-pink-500 bg-clip-text text-transparent leading-tight select-none truncate">
                {lang === "bn" ? "শুভ জন্মদিন!" : "Happy Birthday!"}
              </h3>
              <p className="text-text-muted text-[11px] font-medium leading-normal mt-1 line-clamp-2">
                {lang === "bn" 
                  ? "আপনার জীবন হোক মহাজাগতিক দীপ্তিতে আলোকময় ও অনাবিল আনন্দে ভরপুর।" 
                  : "Wishing you a stellar year ahead filled with alignment, harmony, and joy."}
              </p>

              {/* Petite Zodiac Badge & Countdown info */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                {zodiacName && (
                  <span className="text-[9px] font-mono tracking-wider font-bold uppercase text-accent/80 bg-accent/5 border border-accent/10 px-1.5 py-0.5 rounded">
                    {lang === "bn" ? `রাশিফল: ${zodiacName}` : `Zodiac: ${zodiacName}`}
                  </span>
                )}
                {daysRemaining !== undefined && (
                  <span className="text-[9px] font-mono tracking-wider font-bold uppercase text-pink-600 dark:text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <span>⏳</span>
                    <span>
                      {lang === "bn"
                        ? `বাকি: ${translateNumber(daysRemaining, lang)} দিন`
                        : `${daysRemaining} Days Left`}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
