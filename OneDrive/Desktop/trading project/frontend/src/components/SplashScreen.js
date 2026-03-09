import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

export const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    // Show splash screen for 3 seconds then hide
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-container">
      <div className="splash-content">
        <svg 
          className="splash-logo" 
          viewBox="0 0 400 300" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left side - Lightning bolt shape */}
          <g className="logo-left-part">
            <polygon points="170,85 140,180 190,180 125,270 200,140 150,140" fill="white" />
          </g>
          
          {/* Right side - Triangle shape */}
          <g className="logo-right-part">
            <polygon points="200,85 330,85 380,200 330,200" fill="white" />
            <polygon points="210,200 280,200 210,270" fill="white" />
          </g>
        </svg>
        <h1 className="splash-text">FLY</h1>
      </div>
    </div>
  );
};
