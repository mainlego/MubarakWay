import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock data for nashids
const mockNashids = [
  {
    id: 1,
    title: "يا قلب من حديد",
    titleTransliteration: "Ya Qalb Min Hadid",
    artist: "Fadil Muhammad",
    duration: "3:45",
    cover: "/src/assets/images/nashid1.svg",
    audioUrl: "/audio/nashid1.mp3",
    category: "spiritual"
  },
  {
    id: 2,
    title: "سوف أعود يا أمي",
    titleTransliteration: "Sauf A'ood Ya Ommi",
    artist: "Al-Baraah Group",
    duration: "4:20",
    cover: "/src/assets/images/nashid2.svg",
    audioUrl: "/audio/nashid2.mp3",
    category: "family"
  },
  {
    id: 3,
    title: "رحب بذه النعمه",
    titleTransliteration: "Rahib Bidhihi An-Ni'mah",
    artist: "Hamzah Adel",
    duration: "2:58",
    cover: "/src/assets/images/nashid3.jpg",
    audioUrl: "/audio/nashid3.mp3",
    category: "gratitude"
  },
  {
    id: 4,
    title: "Tala'al Badru 'Alayna",
    titleTransliteration: "Tala'al Badru 'Alayna",
    artist: "Zain",
    duration: "5:12",
    cover: "/src/assets/images/nashid4.jpg",
    audioUrl: "/audio/nashid4.mp3",
    category: "prophetic"
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
      state.currentPlaying = action.payload;
      state.isPlaying = true;
    },
    pauseNashid: (state) => {
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