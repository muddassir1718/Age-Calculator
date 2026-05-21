import React, { useEffect, useRef } from "react";

interface FireworksCanvasProps {
  activeToggle: number;
  accentColor: string;
  isDark: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  gravity: number;
  drag: number;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  exploded: boolean;
  trail: { x: number; y: number }[];
}

export const FireworksCanvas: React.FC<FireworksCanvasProps> = ({ activeToggle, accentColor, isDark }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const rocketsRef = useRef<Rocket[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Base colors for festive explosions depending on theme brightness
  const getFestiveColors = (accent: string, dark: boolean) => {
    if (dark) {
      return [
        accent,
        "#FFD700", // Gold
        "#FF3366", // Festive red-pink
        "#33CCFF", // Light cyan
        "#FF9933", // Orange
        "#9933FF", // Orchid violet
        "#FFFFFF"  // Bright white
      ];
    } else {
      return [
        accent,
        "#E60000", // Saturated rich crimson
        "#C58200", // Antique copper gold
        "#0088CC", // Vivid ceramic blue
        "#A300CC", // Royal plum violet
        "#00994D", // Forest emerald green
        "#111111"  // Contrast dark obsidian
      ];
    }
  };

  const spawnRocket = (width: number, height: number, colors: string[]) => {
    const x = Math.random() * (width - 100) + 50;
    const y = height + 10;
    const targetY = Math.random() * (height * 0.45) + height * 0.15; // explode in upper 15%-60%
    const vx = (Math.random() - 0.5) * 3;
    const vy = -(Math.random() * 5 + 10); // initial upward velocity
    const color = colors[Math.floor(Math.random() * colors.length)];

    rocketsRef.current.push({
      x,
      y,
      targetY,
      vx,
      vy,
      color,
      exploded: false,
      trail: []
    });
  };

  const explode = (x: number, y: number, color: string, colors: string[]) => {
    const count = Math.floor(Math.random() * 25) + 35; // 35 - 60 particles
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      const particleColor = Math.random() > 0.4 ? color : colors[Math.floor(Math.random() * colors.length)];
      
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: particleColor,
        alpha: 1.0,
        decay: Math.random() * 0.012 + 0.008, // fade out duration
        size: Math.random() * 2.2 + 1.2,
        gravity: 0.15,
        drag: 0.96
      });
    }

    // Add extra secondary sparkling dust
    const dustCount = 15;
    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isDark ? "#FFFFFF" : "#E60000",
        alpha: 0.9,
        decay: Math.random() * 0.02 + 0.015,
        size: 1.0,
        gravity: 0.08,
        drag: 0.98
      });
    }
  };

  useEffect(() => {
    if (activeToggle === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Trigger 3 to 5 rockets staggered slightly
    const colors = getFestiveColors(accentColor, isDark);
    const count = Math.floor(Math.random() * 3) + 3; // 3 to 5 rockets
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (canvasRef.current) {
          spawnRocket(canvasRef.current.width, canvasRef.current.height, colors);
        }
      }, i * 350); // staggered ascent
    }
  }, [activeToggle, accentColor, isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const colors = getFestiveColors(accentColor, isDark);

      // Handle rocket simulation
      for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
        const r = rocketsRef.current[i];
        r.x += r.vx;
        r.y += r.vy;
        
        // Decelerate slightly as it reaches zenith
        r.vy *= 0.98;

        // Keep trails
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 12) {
          r.trail.shift();
        }

        // Draw ascending engine glows
        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.5;
        if (r.trail.length > 1) {
          ctx.moveTo(r.trail[0].x, r.trail[0].y);
          for (let ti = 1; ti < r.trail.length; ti++) {
            ctx.lineTo(r.trail[ti].x, r.trail[ti].y);
          }
          ctx.stroke();
        }

        // Render sparkles near rocket tip
        ctx.beginPath();
        ctx.fillStyle = isDark ? "#FFFFFF" : "#111111";
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Expode checking
        if (r.vy >= -1.5 || r.y <= r.targetY) {
          explode(r.x, r.y, r.color, colors);
          rocketsRef.current.splice(i, 1);
        }
      }

      // Handle particle simulation
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        // Draw particles with fading glows
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        
        // Add subtle radial/halo support
        if (!isDark) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
        }
        
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra outlines inside light mode to look extra crisp and readable
        if (!isDark) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "rgba(0,0,0,0.12)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [accentColor, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-50 overflow-hidden"
      style={{ mixBlendMode: isDark ? "screen" : "normal" }}
    />
  );
};
