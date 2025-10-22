import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { nashidsAPI } from '../../services/api';

// Mock data for nashids
const mockNashids = [
  {
    id: 1,
    title: "يا قلب من حديد",
    titleTransliteration: "Ya Qalb Min Hadid",
    artist: "Fadil Muhammad",
    duration: "3:45",
    cover: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    audioUrl: "/audio/Nasheed_Azan_1.mp3",
    category: "spiritual"
  },
  {
    id: 2,
    title: "سوف أعود يا أمي",
    titleTransliteration: "Sauf A'ood Ya Ommi",
    artist: "Al-Baraah Group",
    duration: "4:20",
    cover: "https://images.unsplash.com/photo-1541963463532-d68292c34d19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    audioUrl: "/audio/Nasheed_Azan_1.mp3",
    category: "family"
  },
  {
    id: 3,
    title: "رحب بذه النعمه",
    titleTransliteration: "Rahib Bidhihi An-Ni'mah",
    artist: "Hamzah Adel",
    duration: "2:58",
    cover: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    audioUrl: "/audio/Nasheed_Azan_1.mp3",
    category: "gratitude"
  },
  {
    id: 4,
    title: "Tala'al Badru 'Alayna",
    titleTransliteration: "Tala'al Badru 'Alayna",
    artist: "Zain",
    duration: "5:12",
    cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    audioUrl: "/audio/Nasheed_Azan_1.mp3",
    category: "prophetic"
  },
  {
    id: 5,
    title: "الطريق إلى الجنة",
    titleTransliteration: "At-Tariq ila al-Jannah",
    artist: "Abu Ali",
    duration: "4:15",
    cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    audioUrl: "/audio/Nasheed_Azan_1.mp3",
    category: "spiritual"
  },
  {
    id: 6,
    title: "لا إله إلا الله",
    titleTransliteration: "La Ilaha Illa Allah",
    artist: "Ahmad Nashid",
    duration: "3:30",
    cover: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    audioUrl: "/audio/Nasheed_Azan_1.mp3",
    category: "tawhid"
  }
];

export const fetchNashids = createAsyncThunk(
  'nashids/fetchNashids',
  async (_, { rejectWithValue }) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL ||
        (typeof window !== 'undefined' && window.location.hostname === 'localhost'
          ? 'http://localhost:3001/api'
          : 'https://mubarakway-backend.onrender.com/api');

      console.log('[Nashids] Fetching from URL:', `${API_BASE_URL}/nashids`);

      const response = await fetch(`${API_BASE_URL}/nashids`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('[Nashids] Response status:', response.status);
      console.log('[Nashids] Response data:', data);

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch nashids');
      }

      const nashids = data.nashids.map(nashid => {
        // Validate nashidId exists
        if (!nashid.nashidId) {
          console.error('[Nashids] ⚠️ Nashid missing nashidId:', nashid.title, nashid._id);
          throw new Error(`Nashid "${nashid.title}" is missing nashidId field. Run migration script.`);
        }

        return {
          id: nashid.nashidId, // Use nashidId instead of _id for numeric ID
          title: nashid.title,
          titleTransliteration: nashid.titleTransliteration || nashid.title,
          artist: nashid.artist || 'Unknown Artist',
          duration: nashid.duration || '0:00',
          cover: nashid.coverImage || 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          audioUrl: nashid.audioUrl || '',
          category: nashid.category || 'spiritual',
          language: nashid.language || 'ar',
          releaseYear: nashid.releaseYear,
          accessLevel: nashid.accessLevel || 'free'
        };
      });

      console.log('[Nashids] Found', nashids.length, 'nashids from database');
      console.log('[Nashids] Mapped nashids:', nashids);
      console.log('[Nashids] Successfully returning', nashids.length, 'nashids from database');

      return nashids;
    } catch (error) {
      console.error('[Nashids] Fetch error:');
      console.error('[Nashids] Error name:', error.name);
      console.error('[Nashids] Error message:', error.message);
      console.error('[Nashids] Error stack:', error.stack);
      console.error('[Nashids] ⚠️ RETURNING ERROR - NO FALLBACK TO MOCK DATA');
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk для сохранения избранного в MongoDB
export const toggleFavoriteNashid = createAsyncThunk(
  'nashids/toggleFavorite',
  async ({ telegramId, nashidId }, { rejectWithValue }) => {
    try {
      console.log('[nashidsSlice] toggleFavoriteNashid called with:', { telegramId, nashidId });
      const response = await nashidsAPI.toggleFavorite(telegramId, nashidId);
      console.log('[nashidsSlice] API response:', response);
      console.log('[nashidsSlice] Returning:', { nashidId, favorites: response.favorites });
      return { nashidId, favorites: response.favorites };
    } catch (error) {
      console.error('[nashidsSlice] toggleFavoriteNashid error:', error);
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const nashidsSlice = createSlice({
  name: 'nashids',
  initialState: {
    nashids: [],
    favorites: [],
    playlists: [],
    currentPlaying: null,
    isPlaying: false,
    loading: false,
    error: null
  },
  reducers: {
    toggleFavorite: (state, action) => {
      const nashidId = action.payload;
      if (state.favorites.includes(nashidId)) {
        state.favorites = state.favorites.filter(id => id !== nashidId);
      } else {
        state.favorites.push(nashidId);
      }
    },
    // Загрузка избранного из MongoDB
    setFavorites: (state, action) => {
      state.favorites = action.payload;
    },
    playNashid: (state, action) => {
      console.log('Redux: playNashid called with', action.payload.title);
      state.currentPlaying = action.payload;
      state.isPlaying = true;
    },
    pauseNashid: (state) => {
      console.log('Redux: pauseNashid called');
      console.trace('pauseNashid call stack');
      state.isPlaying = false;
    },
    stopNashid: (state) => {
      state.currentPlaying = null;
      state.isPlaying = false;
    },
    createPlaylist: (state, action) => {
      const { name, nashids } = action.payload;
      const newPlaylist = {
        id: Date.now(),
        name,
        nashids,
        createdAt: new Date().toISOString()
      };
      state.playlists.push(newPlaylist);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNashids.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNashids.fulfilled, (state, action) => {
        state.loading = false;
        state.nashids = action.payload;
      })
      .addCase(fetchNashids.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Toggle favorite
      .addCase(toggleFavoriteNashid.pending, (state) => {
        console.log('[nashidsSlice] toggleFavoriteNashid.pending');
      })
      .addCase(toggleFavoriteNashid.fulfilled, (state, action) => {
        console.log('[nashidsSlice] toggleFavoriteNashid.fulfilled - payload:', action.payload);
        state.favorites = action.payload.favorites;
        console.log('[nashidsSlice] Updated favorites:', state.favorites);
      })
      .addCase(toggleFavoriteNashid.rejected, (state, action) => {
        console.error('[nashidsSlice] toggleFavoriteNashid.rejected:', action.payload);
      });
  }
});

export const { toggleFavorite, setFavorites, playNashid, pauseNashid, stopNashid, createPlaylist } = nashidsSlice.actions;
export default nashidsSlice.reducer;