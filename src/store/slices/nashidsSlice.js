import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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
  async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockNashids), 500);
    });
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
      });
  }
});

export const { toggleFavorite, playNashid, pauseNashid, stopNashid, createPlaylist } = nashidsSlice.actions;
export default nashidsSlice.reducer;