import React from 'react';

export default function Logo({ className = "w-10 h-10", size = "normal" }: { className?: string, size?: "large" | "normal" }) {
  const containerClasses = size === "large" 
    ? "w-24 h-24 p-2 bg-white rounded-3xl shadow-xl shadow-eco-100 mb-6 border border-slate-50 overflow-hidden flex items-center justify-center" 
    : "w-10 h-10 bg-white dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-700 p-1";

  const textClasses = size === "large" ? "text-eco-500 font-bold text-2xl" : "text-eco-500 font-bold text-sm";

  return (
    <div className={containerClasses + " " + className}>
      <img 
        src="gw_logo.png" 
        alt="GreenWalks" 
        className="w-full h-full object-contain" 
        onError={(e) => {
          // If the direct path fails, try the absolute reference path used in some envs
          const target = e.target as HTMLImageElement;
          if (!target.src.includes('/_/')) {
            target.src = 'gw_logo.png';
          } else {
            // If all image paths fail, show the SVG fallback
            target.style.display = 'none';
            target.parentElement!.innerHTML = `<div class="${textClasses}">GW</div>`;
          }
        }} 
      />
    </div>
  );
}
