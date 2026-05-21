import React, { useEffect, useRef } from "react";

export type ZodiacElement = "fire" | "earth" | "air" | "water" | "none";

interface ZodiacThemeBackgroundProps {
  element: ZodiacElement;
  enabled: boolean;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decaySpeed?: number;
  angle?: number;
  spinSpeed?: number;
  swayRange?: number;
  swaySpeed?: number;
  swayOffset?: number;
}

export const ZodiacThemeBackground: React.FC<ZodiacThemeBackgroundProps> = ({ element, enabled }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<AmbientParticle[]>([]);

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

    // Re-initialize particles pool when element changes
    particlesRef.current = [];

    const getColors = (el: ZodiacElement) => {
      switch (el) {
        case "fire":
          return ["rgba(255, 61, 0, 0.4)", "rgba(255, 152, 0, 0.4)", "rgba(255, 235, 59, 0.4)", "rgba(255, 110, 64, 0.35)"];
        case "earth":
          return ["rgba(76, 175, 80, 0.25)", "rgba(139, 195, 74, 0.25)", "rgba(205, 220, 57, 0.25)", "rgba(141, 110, 99, 0.25)"];
        case "air":
          return ["rgba(0, 188, 212, 0.25)", "rgba(0, 229, 255, 0.2)", "rgba(225, 190, 231, 0.22)", "rgba(179, 157, 219, 0.2)"];
        case "water":
          return ["rgba(33, 150, 243, 0.3)", "rgba(3, 169, 244, 0.25)", "rgba(0, 188, 212, 0.25)", "rgba(224, 247, 250, 0.22)"];
        default:
          return [];
      }
    };

    const spawnParticle = (w: number, h: number, colors: string[]) => {
      if (colors.length === 0) return;
      const col = colors[Math.floor(Math.random() * colors.length)];
      
      switch (element) {
        case "fire": {
          // Fire sparks rising upwards
          const size = Math.random() * 2.5 + 1.2;
          particlesRef.current.push({
            x: Math.random() * w,
            y: h + 10,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(Math.random() * 1.5 + 0.8),
            size,
            color: col,
            alpha: Math.random() * 0.6 + 0.3,
            swayRange: Math.random() * 1.5 + 0.5,
            swaySpeed: Math.random() * 0.02 + 0.01,
            swayOffset: Math.random() * Math.PI * 2
          });
          break;
        }
        case "earth": {
          // Earth leaves drifting gently downwards
          const size = Math.random() * 5 + 3;
          particlesRef.current.push({
            x: Math.random() * w,
            y: -10,
            vx: (Math.random() - 0.3) * 0.8,
            vy: Math.random() * 0.6 + 0.4,
            size,
            color: col,
            alpha: Math.random() * 0.5 + 0.3,
            angle: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.02,
            swayRange: Math.random() * 2.5 + 1.0,
            swaySpeed: Math.random() * 0.01 + 0.005,
            swayOffset: Math.random() * Math.PI * 2
          });
          break;
        }
        case "air": {
          // Quiet mist/bubbles floating dynamically side-to-side
          const size = Math.random() * 12 + 6;
          particlesRef.current.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() * 0.4 + 0.1),
            vy: (Math.random() - 0.5) * 0.3,
            size,
            color: col,
            alpha: Math.random() * 0.4 + 0.1,
            swayRange: Math.random() * 8 + 4,
            swaySpeed: Math.random() * 0.006 + 0.003,
            swayOffset: Math.random() * Math.PI * 2
          });
          break;
        }
        case "water": {
          // Sinking blue watery droplets
          const size = Math.random() * 2.2 + 1.0;
          particlesRef.current.push({
            x: Math.random() * w,
            y: -10,
            vx: (Math.random() - 0.5) * 0.3,
            vy: Math.random() * 1.8 + 1.2,
            size,
            color: col,
            alpha: Math.random() * 0.5 + 0.35,
            swayRange: Math.random() * 0.5 + 0.1,
            swaySpeed: 0.05,
            swayOffset: Math.random() * Math.PI * 2
          });
          break;
        }
      }
    };

    const maxParticles = element === "fire" ? 45 : element === "water" ? 50 : element === "earth" ? 35 : element === "air" ? 25 : 0;

    const loop = (timestamp: number) => {
      // Create a clean feedback with slight persistence glow trail
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!enabled || element === "none") {
        animationRef.current = requestAnimationFrame(loop);
        return;
      }

      const colors = getColors(element);

      // Populate particles pool if below limit
      if (particlesRef.current.length < maxParticles && Math.random() < 0.25) {
        spawnParticle(canvas.width, canvas.height, colors);
      }

      // Draw and simulate particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        // Frame updates based on specific elements
        if (element === "fire") {
          p.x += p.vx + Math.sin(timestamp * (p.swaySpeed || 0.01) + (p.swayOffset || 0)) * (p.swayRange || 0.5) * 0.25;
          p.y += p.vy;
          // Slowly decrease alpha toward top
          const progressY = p.y / canvas.height;
          p.alpha = Math.min(p.alpha, progressY * 0.8 + 0.05);

          if (p.y < -10 || p.alpha <= 0.01) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          // Draw floating embers
          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 4;
          ctx.shadowColor = p.color;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
        else if (element === "earth") {
          // Falling leaves
          p.x += p.vx + Math.sin(timestamp * (p.swaySpeed || 0.005) + (p.swayOffset || 0)) * (p.swayRange || 1) * 0.15;
          p.y += p.vy;
          if (p.angle !== undefined && p.spinSpeed !== undefined) {
            p.angle += p.spinSpeed;
          }

          if (p.y > canvas.height + 10 || p.x < -10 || p.x > canvas.width + 10) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          // Draw rotated leaves
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle || 0);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          // Minimal leaf stem detailing
          ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.lineTo(p.size, 0);
          ctx.stroke();
          ctx.restore();
        }
        else if (element === "air") {
          // Drifting floating gaseous bubbles helper
          p.x += p.vx;
          p.y += p.vy + Math.sin(timestamp * (p.swaySpeed || 0.002) + (p.swayOffset || 0)) * (p.swayRange || 1) * 0.05;

          if (p.x > canvas.width + p.size * 2) {
            p.x = -p.size * 1.5;
            p.y = Math.random() * canvas.height;
          }

          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        else if (element === "water") {
          // Sinking rain droplets
          p.x += p.vx;
          p.y += p.vy;

          if (p.y > canvas.height + 10) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          // Draw sleek raindrop vectors
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2.5);
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [element, enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{ opacity: 0.85 }}
    />
  );
};
