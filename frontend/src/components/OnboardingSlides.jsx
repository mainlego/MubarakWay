import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, Music, Navigation2, Clock, Star, Sparkles } from 'lucide-react';

const OnboardingSlides = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const slides = [
    {
      id: 1,
      title: 'Ассаламу алейкум!',
      subtitle: 'Добро пожаловать в MubarakWay',
      description: 'Ваш духовный помощник и путеводитель в мире ислама',
      icon: Star,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      animation: 'pulse-glow',
      particles: true,
      pattern: 'islamic-pattern-1'
    },
    {
      id: 2,
      title: 'Библиотека знаний',
      subtitle: 'Исламская литература',
      description: 'Читайте Коран, хадисы и духовные книги с красивой читалкой',
      icon: BookOpen,
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      animation: 'book-open',
      particles: false,
      pattern: 'islamic-pattern-2'
    },
    {
      id: 3,
      title: 'Нашиды и духовность',
      subtitle: 'Религиозные песнопения',
      description: 'Слушайте нашиды, создавайте плейлисты и находите покой',
      icon: Music,
      gradient: 'from-blue-500 via-indigo-500 to-purple-500',
      animation: 'music-wave',
      particles: true,
      pattern: 'islamic-pattern-3'
    },
    {
      id: 4,
      title: 'Направление и время',
      subtitle: 'Кибла и намаз',
      description: 'Точное направление на Мекку и расписание молитв для вашего города',
      icon: Navigation2,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      animation: 'compass-spin',
      particles: false,
      pattern: 'islamic-pattern-4'
    },
    {
      id: 5,
      title: 'Начнем путь!',
      subtitle: 'Все готово',
      description: 'Присоединяйтесь к тысячам мусульман по всему миру',
      icon: Sparkles,
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      animation: 'sparkle',
      particles: true,
      pattern: 'islamic-pattern-5',
      isLast: true
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) {
      onComplete();
    } else {
      navigate('/');
    }
  };

  // Touch/drag handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(translateX) > 50) {
      if (translateX < 0 && currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else if (translateX > 0 && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      }
    }
    setTranslateX(0);
  };

  const currentSlideData = slides[currentSlide];
  const IconComponent = currentSlideData.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient} transition-all duration-700`}>
        {/* Islamic Pattern Overlay */}
        <div className={`absolute inset-0 opacity-10 ${currentSlideData.pattern}`} />

        {/* Particles */}
        {currentSlideData.particles && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className="relative h-full flex flex-col items-center justify-between p-6 sm:p-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Skip Button */}
        {!currentSlideData.isLast && (
          <button
            onClick={handleSkip}
            className="self-end text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            Пропустить
          </button>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md">
          {/* Icon with Animation */}
          <div className={`mb-8 relative ${currentSlideData.animation}`}>
            <div className="w-32 h-32 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center border-4 border-white/30 shadow-2xl">
              <IconComponent className="w-16 h-16 text-white" strokeWidth={1.5} />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse" />
          </div>

          {/* Text Content */}
          <div
            className="space-y-4 transition-all duration-500"
            style={{
              transform: `translateX(${translateX}px)`,
              opacity: isDragging ? 0.5 : 1
            }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white drop-shadow-lg">
              {currentSlideData.title}
            </h1>
            <h2 className="text-xl sm:text-2xl text-white/90 font-medium">
              {currentSlideData.subtitle}
            </h2>
            <p className="text-base sm:text-lg text-white/80 leading-relaxed px-4">
              {currentSlideData.description}
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="w-full max-w-md space-y-6">
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={handleNext}
            className="w-full bg-white text-gray-900 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            {currentSlideData.isLast ? (
              <>
                Начать
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </>
            ) : (
              <>
                Далее
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }

        .animate-float {
          animation: float linear infinite;
        }

        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        @keyframes book-open {
          0%, 100% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(15deg);
          }
        }

        .book-open {
          animation: book-open 2s ease-in-out infinite;
        }

        @keyframes music-wave {
          0%, 100% {
            transform: translateY(0px);
          }
          25% {
            transform: translateY(-5px);
          }
          75% {
            transform: translateY(5px);
          }
        }

        .music-wave {
          animation: music-wave 1.5s ease-in-out infinite;
        }

        @keyframes compass-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .compass-spin {
          animation: compass-spin 8s linear infinite;
        }

        @keyframes sparkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
        }

        .sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        /* Islamic Patterns */
        .islamic-pattern-1 {
          background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%);
        }

        .islamic-pattern-2 {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.05) 35px,
            rgba(255,255,255,0.05) 70px
          );
        }

        .islamic-pattern-3 {
          background-image: repeating-conic-gradient(
            from 0deg at 50% 50%,
            transparent 0deg,
            rgba(255,255,255,0.05) 30deg,
            transparent 60deg
          );
        }

        .islamic-pattern-4 {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }

        .islamic-pattern-5 {
          background-image: linear-gradient(30deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%, rgba(255,255,255,0.05)),
                            linear-gradient(150deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%, rgba(255,255,255,0.05));
          background-size: 60px 60px;
        }
      `}</style>
    </div>
  );
};

export default OnboardingSlides;
