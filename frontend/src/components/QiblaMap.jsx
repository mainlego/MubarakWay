import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Координаты Каабы в Мекке
const MECCA_COORDS = [21.4225, 39.8261];

const QiblaMap = ({ userLocation, qiblaDirection }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!userLocation || !mapRef.current) return;

    // Инициализация карты (только один раз)
    if (!mapInstanceRef.current) {
      // iOS требует специальной настройки
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      mapInstanceRef.current = L.map(mapRef.current, {
        center: [userLocation.latitude, userLocation.longitude],
        zoom: 3,
        zoomControl: true,
        attributionControl: false,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: !isIOS, // Отключаем для iOS
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: isIOS ? true : false, // Включаем tap для iOS
        tapTolerance: isIOS ? 30 : 15, // Больше толерантность для iOS
        // iOS-специфичные опции
        ...(isIOS && {
          bounceAtZoomLimits: false,
          preferCanvas: true, // Лучше работает на iOS
          renderer: L.canvas({ tolerance: 5 })
        })
      });

      // Добавляем tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapInstanceRef.current);

      // Кастомная иконка для пользователя (синяя точка)
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative;">
            <div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
            <div style="position: absolute; top: 50%; left: 50%; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; transform: translate(-50%, -50%); animation: pulse 2s infinite;"></div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      // Кастомная иконка для Каабы
      const kaabaIcon = L.divIcon({
        className: 'custom-kaaba-marker',
        html: `
          <div style="position: relative;">
            <div style="font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">🕋</div>
            <div style="position: absolute; top: 50%; left: 50%; width: 48px; height: 48px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; transform: translate(-50%, -50%); animation: pulse 2s infinite;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Маркер пользователя
      const userMarker = L.marker(
        [userLocation.latitude, userLocation.longitude],
        { icon: userIcon }
      ).addTo(mapInstanceRef.current);

      userMarker.bindPopup(`
        <div style="text-align: center; padding: 4px;">
          <strong>Ваше местоположение</strong><br/>
          <small>${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}</small>
        </div>
      `);

      // Маркер Каабы
      const kaabaMarker = L.marker(MECCA_COORDS, { icon: kaabaIcon })
        .addTo(mapInstanceRef.current);

      kaabaMarker.bindPopup(`
        <div style="text-align: center; padding: 4px;">
          <strong>🕋 Кааба, Мекка</strong><br/>
          <small>21.4225°N, 39.8261°E</small>
        </div>
      `);

      // Группа слоев для маршрута
      routeLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }

    // Обновляем маршрут при изменении местоположения
    if (routeLayerRef.current && mapInstanceRef.current) {
      routeLayerRef.current.clearLayers();

      // Рисуем геодезическую линию (кривая на поверхности Земли)
      const userCoords = [userLocation.latitude, userLocation.longitude];

      // Создаем кривую линию (приближение большого круга)
      const steps = 100;
      const pathPoints = [];

      for (let i = 0; i <= steps; i++) {
        const fraction = i / steps;

        // Интерполяция по большому кругу (упрощенная версия)
        const lat = userCoords[0] + (MECCA_COORDS[0] - userCoords[0]) * fraction;
        const lng = userCoords[1] + (MECCA_COORDS[1] - userCoords[1]) * fraction;

        pathPoints.push([lat, lng]);
      }

      // Основная линия маршрута
      const routeLine = L.polyline(pathPoints, {
        color: '#22c55e',
        weight: 3,
        opacity: 0.8,
        dashArray: '10, 10',
        className: 'qibla-route'
      }).addTo(routeLayerRef.current);

      // Анимированная линия поверх основной
      const animatedLine = L.polyline(pathPoints, {
        color: '#22c55e',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10',
        dashOffset: '0',
        className: 'qibla-route-animated'
      }).addTo(routeLayerRef.current);

      // Добавляем стрелки направления вдоль маршрута
      const arrowSpacing = Math.floor(steps / 5); // 5 стрелок
      for (let i = arrowSpacing; i < steps; i += arrowSpacing) {
        const point = pathPoints[i];
        const nextPoint = pathPoints[Math.min(i + 5, steps)];

        // Вычисляем угол для стрелки
        const angle = Math.atan2(
          nextPoint[0] - point[0],
          nextPoint[1] - point[1]
        ) * 180 / Math.PI;

        L.marker(point, {
          icon: L.divIcon({
            className: 'route-arrow',
            html: `<div style="color: #22c55e; font-size: 20px; transform: rotate(${angle}deg);">➤</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(routeLayerRef.current);
      }

      // Расчет расстояния (формула гаверсинуса)
      const R = 6371; // Радиус Земли в км
      const lat1 = userCoords[0] * Math.PI / 180;
      const lat2 = MECCA_COORDS[0] * Math.PI / 180;
      const deltaLat = (MECCA_COORDS[0] - userCoords[0]) * Math.PI / 180;
      const deltaLng = (MECCA_COORDS[1] - userCoords[1]) * Math.PI / 180;

      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = Math.round(R * c);

      // Информационное окно с расстоянием
      const midPoint = pathPoints[Math.floor(steps / 2)];

      L.marker(midPoint, {
        icon: L.divIcon({
          className: 'distance-info',
          html: `
            <div style="
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              backdrop-filter: blur(10px);
            ">
              📏 ${distance.toLocaleString('ru-RU')} км<br/>
              🧭 ${Math.round(qiblaDirection || 0)}°
            </div>
          `,
          iconSize: [100, 40],
          iconAnchor: [50, 20]
        })
      }).addTo(routeLayerRef.current);

      // Подгоняем границы карты, чтобы показать весь маршрут
      const bounds = L.latLngBounds([userCoords, MECCA_COORDS]);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 10
      });

      // Принудительно обновляем размер карты после рендера
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();

          // iOS: принудительно активируем dragging
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          if (isIOS && mapInstanceRef.current.dragging) {
            mapInstanceRef.current.dragging.enable();

            // Дополнительный фикс для iOS - отключаем passive listeners
            const container = mapInstanceRef.current.getContainer();
            if (container) {
              container.addEventListener('touchstart', (e) => {
                // Не preventDefault для самой карты, чтобы жесты работали
              }, { passive: false });

              container.addEventListener('touchmove', (e) => {
                // Предотвращаем прокрутку страницы при драге карты
                if (e.touches.length === 1) {
                  e.preventDefault();
                }
              }, { passive: false });
            }
          }
        }
      }, 100);
    }
  }, [userLocation, qiblaDirection]);

  // Cleanup только при размонтировании компонента
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.5); }
          }

          @keyframes dash {
            to { stroke-dashoffset: -20; }
          }

          .qibla-route-animated {
            animation: dash 1s linear infinite;
          }

          .leaflet-container {
            font-family: inherit;
          }

          .custom-user-marker,
          .custom-kaaba-marker,
          .route-arrow,
          .distance-info {
            background: transparent !important;
            border: none !important;
          }

          .leaflet-popup-content-wrapper {
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 8px;
            backdrop-filter: blur(10px);
          }

          .leaflet-popup-tip {
            background: rgba(0, 0, 0, 0.8);
          }

          .leaflet-container {
            cursor: grab;
          }

          .leaflet-container.leaflet-drag-target {
            cursor: grabbing;
          }

          .leaflet-interactive {
            cursor: pointer;
          }

          /* Обеспечиваем правильную работу тач-событий */
          .leaflet-container,
          .leaflet-pane,
          .leaflet-tile-pane {
            touch-action: pan-x pan-y !important;
            user-select: none !important;
            -webkit-user-select: none !important;
          }

          /* Разрешаем все события для карты */
          .leaflet-container,
          .leaflet-container * {
            pointer-events: auto !important;
          }

          /* Убираем возможные конфликты */
          .leaflet-container * {
            -webkit-tap-highlight-color: transparent;
          }

          /* Drag handlers */
          .leaflet-container.leaflet-touch-drag {
            -ms-touch-action: pan-x pan-y;
            touch-action: pan-x pan-y;
          }

          .leaflet-container.leaflet-touch-zoom {
            -ms-touch-action: pinch-zoom;
            touch-action: pinch-zoom;
          }

          /* iOS-специфичные фиксы */
          @supports (-webkit-touch-callout: none) {
            .leaflet-container {
              -webkit-transform: translate3d(0, 0, 0);
              transform: translate3d(0, 0, 0);
              -webkit-overflow-scrolling: touch;
            }

            .leaflet-pane,
            .leaflet-tile-pane {
              -webkit-transform: translate3d(0, 0, 0);
              transform: translate3d(0, 0, 0);
            }

            /* Отключаем эластичное прокручивание Safari */
            .leaflet-container {
              overscroll-behavior: contain;
              -webkit-overscroll-behavior: contain;
            }

            /* Принудительное включение hardware acceleration */
            .leaflet-layer,
            .leaflet-control {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
              will-change: transform;
            }
          }
        `}
      </style>
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{
          minHeight: '400px',
          height: '100%',
          position: 'relative',
          zIndex: 1,
          touchAction: 'pan-x pan-y'
        }}
      />
    </>
  );
};

export default QiblaMap;
