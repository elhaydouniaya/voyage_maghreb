"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{ animationId: number | null; time: number }>({
    animationId: null,
    time: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      if (!ctx || !canvas) return;
      sceneRef.current.time += 0.01;
      const t = sceneRef.current.time;

      ctx.fillStyle = "#fef3e2";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vagues
      ctx.strokeStyle = "rgba(249, 115, 22, 0.18)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 5) {
          const y =
            canvas.height / 2 +
            Math.sin(x * 0.01 + t + i * 2) * 50 +
            Math.sin(x * 0.005 + t * 0.5) * 30;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Particules
      ctx.fillStyle = "rgba(249, 115, 22, 0.28)";
      for (let i = 0; i < 50; i++) {
        const x = (t * 20 + i * 50) % canvas.width;
        const y = Math.sin(t + i) * (canvas.height / 4) + canvas.height / 2;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      sceneRef.current.animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (sceneRef.current.animationId)
        cancelAnimationFrame(sceneRef.current.animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: "#fef3e2" }}
    />
  );
}
