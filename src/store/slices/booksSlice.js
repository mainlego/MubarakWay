import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock data for books
const mockBooks = [
  {
    id: 1,
    title: "Коран",
    author: "",
    description: "Священная книга мусульман",
    cover: "/src/assets/images/book1.svg",
    isPro: false,
    category: "religious"
  },
  {
    id: 2,
    title: "Сорок хадисов",
    author: "имам Ан-Навави",
    description: "Сборник основных хадисов Пророка Мухаммада ﷺ",
    cover: "/src/assets/images/book2.svg",
    isPro: false,
    category: "hadith"
  },
  {
    id: 3,
    title: "Путь к Аллаху",
    author: "Абу Ибрахим",
    description: "Духовный путь познания Всевышнего",
    cover: "/src/assets/images/book3.svg",
    isPro: false,
    category: "spiritual"
  },
  {
    id: 4,
    title: "40 уроков о вере",
    author: "Аль-Ассадай",
    description: "Фундаментальные основы исламской веры",
    cover: "/src/assets/images/book4.jpg",
    isPro: true,
    category: "education"
  },
  {
    id: 5,
    title: "Плоды деяний",
    author: "Ави Нафс",
    description: "О важности праведных поступков в исламе",
    cover: "/src/assets/images/book5.jpg",
    isPro: true,
    category: "spiritual"
  },
  {
    id: 6,
    title: "Основы вероучения",
    author: "",
    description: "Базовые принципы исламской веры",
    cover: "/src/assets/images/book6.jpg",
    isPro: true,
    category: "education"
  }
];

export const fetchBooks = createAsyncThunk(
  'books/fetchBooks',
  async () => {
    // Симуляция API запроса
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockBooks), 500);
    });
  }
);

const booksSlice = createSlice({
  name: 'books',
  initialState: {
    books: [],
    favorites: [],
    readingProgress: {},
    loading: false,
    error: null
  },
  reducers: {
    toggleFavorite: (state, action) => {
      const bookId = action.payload;
      if (state.favorites.includes(bookId)) {
        state.favorites = state.favorites.filter(id => id !== bookId);
      } else {
        state.favorites.push(bookId);
      }
    },
    updateReadingProgress: (state, action) => {
      const { bookId, progress } = action.payload;
      state.readingProgress[bookId] = progress;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload;
      })
      .addCase(fetchBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { toggleFavorite, updateReadingProgress } = booksSlice.actions;
export default booksSlice.reducer;