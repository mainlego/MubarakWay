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
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [userLocation.latitude, userLocation.longitude],
        zoom: 3,
        zoomControl: true,
        attributionControl: false
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
    }

    // Cleanup при размонтировании
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation, qiblaDirection]);

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
        `}
      </style>
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: '400px' }}
      />
    </>
  );
};

export default QiblaMap;
