import { createSlice } from '@reduxjs/toolkit';

const qiblaSlice = createSlice({
  name: 'qibla',
  initialState: {
    userLocation: null,
    qiblaDirection: null,
    prayerTimes: null,
    hijriDate: null,
    loading: false,
    error: null
  },
  reducers: {
    setUserLocation: (state, action) => {
      const { latitude, longitude } = action.payload;
      state.userLocation = { latitude, longitude };

      // Calculate Qibla direction (simplified calculation)
      const meccaLat = 21.4225;
      const meccaLng = 39.8262;
      const latRad1 = (latitude * Math.PI) / 180;
      const latRad2 = (meccaLat * Math.PI) / 180;
      const deltaLng = ((meccaLng - longitude) * Math.PI) / 180;
      const bearing = Math.atan2(
        Math.sin(deltaLng) * Math.cos(latRad2),
        Math.cos(latRad1) * Math.sin(latRad2) - Math.sin(latRad1) * Math.cos(latRad2) * Math.cos(deltaLng)
      );
      state.qiblaDirection = (bearing * 180) / Math.PI;

      // Mock prayer times for now
      state.prayerTimes = {
        fajr: '05:30',
        sunrise: '07:45',
        dhuhr: '13:20',
        asr: '16:45',
        maghrib: '19:30',
        isha: '21:15'
      };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const { setUserLocation, setLoading, setError } = qiblaSlice.actions;
export default qiblaSlice.reducer;