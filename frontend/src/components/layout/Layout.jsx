import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = ({ children, activeTab, setActiveTab, banks, error }) => {
  const [theme, setTheme] = useState('dark');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const canvasRef = useRef(null);

  // Sync theme class to root html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Canvas particle background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.8 + 0.6;
        this.speedX = Math.random() * 0.3 - 0.15;
        this.speedY = Math.random() * 0.3 - 0.15;
        this.opacity = Math.random() * 0.6 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;

        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = theme === 'dark' 
          ? `rgba(0, 229, 255, ${this.opacity})` 
          : `rgba(139, 92, 246, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particleCount = 70;
    const particles = Array.from({ length: particleCount }, () => new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden relative bg-[#050816] text-[#f8fafc]">
      {/* Cybersecurity Grid Line Overlay */}
      <div className="cyber-grid" />
      
      {/* Floating Canvas Particles */}
      <canvas ref={canvasRef} className="particle-background" />

      {/* Top Bar Navigation */}
      <TopNav error={error} theme={theme} toggleTheme={toggleTheme} />

      {/* Main Container */}
      <div className="flex flex-grow overflow-hidden relative z-10">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          banks={banks} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Viewport content */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-7 relative scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="max-w-[1600px] mx-auto space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
};
