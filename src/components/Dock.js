import React from 'react';
import { Home, Upload, Settings, LogOut, Sun, Moon } from 'lucide-react';
import './Dock.css';

const Dock = ({ onNavigate, onThemeToggle, onLogout, isDarkTheme, currentPage }) => {
  const dockItems = [
    { id: 'home', icon: Home, label: 'Home', action: () => onNavigate('home') },
    { id: 'upload', icon: Upload, label: 'Upload', action: () => onNavigate('upload') },
    { id: 'settings', icon: Settings, label: 'Settings', action: () => onNavigate('settings') },
  ];

  return (
    <div className="dock-container">
      <div className="dock">
        {dockItems.map((item) => (
          <div
            key={item.id}
            className={`dock-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={item.action}
            title={item.label}
          >
            <item.icon size={24} />
          </div>
        ))}
        
        <div className="dock-separator" />
        
        <div
          className="dock-item"
          onClick={onThemeToggle}
          title="Toggle Theme"
        >
          {isDarkTheme ? <Sun size={24} /> : <Moon size={24} />}
        </div>
        
        <div
          className="dock-item logout"
          onClick={onLogout}
          title="Logout"
        >
          <LogOut size={24} />
        </div>
      </div>
    </div>
  );
};

export default Dock;