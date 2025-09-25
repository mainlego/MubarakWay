import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNashids } from '../store/slices/nashidsSlice';
import NashidCard from '../components/NashidCard';
import { ArrowLeft, Folder, Mic, Moon } from 'lucide-react';

const Nashids = () => {
  const dispatch = useDispatch();
  const { nashids, loading } = useSelector(state => state.nashids);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    dispatch(fetchNashids());
  }, [dispatch]);

  const categories = [
    { id: 'all', name: 'Все', icon: Folder },
    { id: 'spiritual', name: 'По категориям', icon: Folder },
    { id: 'family', name: 'По исполнителям', icon: Mic },
    { id: 'gratitude', name: 'По тематике', icon: Moon }
  ];

  const filteredNashids = selectedCategory === 'all'
    ? nashids
    : nashids.filter(nashid => nashid.category === selectedCategory);

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка нашидов...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(/src/assets/images/background_nashidi_1.jpg)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-green-400" />
            </button>
            <h1 className="text-2xl font-bold text-white">Нашиды</h1>
          </div>
          <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v9.28l-2.64-2.64-1.42 1.42L12 15.12l4.06-4.06-1.42-1.42L12 12.28V3z"/>
              <path d="M19 17v2H5v-2h14z"/>
            </svg>
          </button>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-white/30 backdrop-blur-sm border border-white/20'
                    : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                }`}
              >
                <IconComponent className="w-5 h-5 text-white" />
                <span className="text-white font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Nashids List */}
        <div className="space-y-4">
          {filteredNashids.map(nashid => (
            <NashidCard key={nashid.id} nashid={nashid} />
          ))}
        </div>

        {/* Bottom Message */}
        <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
          <p className="text-white text-sm text-center">
            Я послушам заново тыко и подпокс
            принимeslisъю сътова? эскую вистанник
            и персональных уроки
          </p>
        </div>
      </div>
    </div>
  );
};

export default Nashids;