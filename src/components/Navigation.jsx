import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Music, Navigation2, Home } from 'lucide-react';

const Navigation = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Главная' },
    { to: '/library', icon: BookOpen, label: 'Библиотека' },
    { to: '/nashids', icon: Music, label: 'Нашиды' },
    { to: '/qibla', icon: Navigation2, label: 'Намаз' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-2 rounded-lg transition-colors touch-manipulation ${
                  isActive
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 active:bg-gray-100'
                }`
              }
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <IconComponent className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;