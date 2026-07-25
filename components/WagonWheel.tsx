"use client";
import React, { useRef } from 'react';

interface WagonWheelProps {
  runs: number;
  onSave: (angle: number, distance: number) => void;
  onCancel: () => void;
}

export default function WagonWheel({ runs, onSave, onCancel }: WagonWheelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleFieldClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const dx = x - centerX;
    const dy = y - centerY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const distance = Math.sqrt(dx * dx + dy * dy) / (rect.width / 2);

    onSave(angle, distance);
  };

  return (
    <div className="modal-overlay">
      <div className="wagon-wheel-card">
        <h3>{runs} Runs</h3>
        <p className="subtitle">Tap the ground to plot the shot</p>
        
        <div className="field-container">
          <svg 
            ref={svgRef}
            viewBox="0 0 300 300" 
            className="cricket-field"
            onClick={handleFieldClick}
          >
            {/* Modern Daylight Grass */}
            <circle cx="150" cy="150" r="145" fill="#34D399" />
            <circle cx="150" cy="150" r="140" fill="#10B981" />
            
            {/* 30 Yard Circle */}
            <circle cx="150" cy="150" r="80" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="6,6" opacity="0.5" />
            
            {/* The Pitch (Sand) */}
            <rect x="135" y="110" width="30" height="80" fill="#FDE68A" rx="4" />
            
            {/* Wickets & Crease */}
            <line x1="145" y1="115" x2="155" y2="115" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <line x1="145" y1="185" x2="155" y2="185" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <line x1="135" y1="125" x2="165" y2="125" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="135" y1="175" x2="165" y2="175" stroke="#FFFFFF" strokeWidth="1.5" />
          </svg>
        </div>

        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}