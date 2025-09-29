import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Скроллим к началу страницы при изменении маршрута
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Используем instant вместо smooth для мгновенного перехода
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;