import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ELEMENT_MAP, RARITY_MAP } from './DokkanCatalog';
import { 
  FolderHeart, 
  Trash2, 
  Star, 
  Save, 
  TrendingUp,
  Loader,
  Search,
  BookOpen,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BoxItem {
  user_id: string;
  card_id: number;
  level: number;
  sa_level: number;
  potential_percentage: number;
  my_rating: number | null;
  my_notes: string | null;
  created_at: string;
  character: {
    id: number;
    name: string;
    subname: string;
    rarity: number;
    element: number;
    max_hp: number | null;
    max_atk: number | null;
    max_def: number | null;
  };
}

export const DokkanBox: React.FC = () => {
  const { user } = useAuth();
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected item for box editing modal
  const [editingItem, setEditingItem] = useState<BoxItem | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editPotential, setEditPotential] = useState(0);
  const [editRating, setEditRating] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchBoxItems();
  }, [user]);

  const fetchBoxItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dokkan_user_box')
        .select(`
          *,
          character:dokkan_characters(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) {
        setBoxItems(data as BoxItem[]);
      }
    } catch (err) {
      console.error('Error fetching box items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item: BoxItem) => {
    setEditingItem(item);
    setEditPotential(item.potential_percentage);
    setEditRating(item.my_rating);
    setEditNotes(item.my_notes || '');
  };

  const handleSaveEdit = async () => {
    if (!user || !editingItem) return;
    setSaveLoading(true);

    try {
      const { error } = await supabase
        .from('dokkan_user_box')
        .update({
          potential_percentage: editPotential,
          my_rating: editRating,
          my_notes: editNotes.trim() || null
        })
        .eq('user_id', user.id)
        .eq('card_id', editingItem.card_id);

      if (error) throw error;

      // Update state locally
      setBoxItems(prev => prev.map(item => 
        item.card_id === editingItem.card_id
          ? { ...item, potential_percentage: editPotential, my_rating: editRating, my_notes: editNotes }
          : item
      ));

      setEditingItem(null);
    } catch (err) {
      console.error('Error saving box details:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation();
    if (!user) return;

    if (!confirm('Are you sure you want to remove this character from your box?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('dokkan_user_box')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      if (error) throw error;
      setBoxItems(prev => prev.filter(item => item.card_id !== cardId));
    } catch (err) {
      console.error('Error deleting box item:', err);
    }
  };

  const filteredItems = boxItems.filter(item => 
    item.character?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.character?.subname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderHeart className="w-8 h-8 text-emerald-500" />
            My Collected Card Box
          </h1>
          <p className="text-gray-400 text-sm">
            Evaluate, rate, and track potential paths for the characters you own.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search owned cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161F30]/60 border border-[#23324C] focus:border-emerald-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all font-medium text-xs"
          />
        </div>
      </div>

      {/* Main card grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#161F30]/40 rounded-2xl border border-[#23324C] max-w-xl mx-auto p-8 space-y-4">
          <FolderHeart className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your Box is Empty</h3>
          <p className="text-sm text-gray-400">
            You haven't added any characters to your personal box yet. Go to the Catalog page to start collection building.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const char = item.character;
            if (!char) return null;

            const elInfo = ELEMENT_MAP[char.element] || { type: 'AGL', class: 'Super', color: 'bg-gray-500', border: 'border-gray-400', label: 'Unknown' };
            const thumbUrl = `${supabaseUrl}/storage/v1/object/public/character-thumbnails/card_${char.id}_thumb.png`;

            return (
              <motion.div
                key={char.id}
                onClick={() => handleOpenEdit(item)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                className="bg-[#161F30]/75 border border-[#23324C] hover:border-emerald-500/50 rounded-2xl p-5 flex gap-4 cursor-pointer relative overflow-hidden transition-all shadow-lg group"
              >
                {/* Typing color stripe side */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b ${
                  elInfo.class === 'Super' ? 'from-blue-500 to-emerald-500' : 'from-purple-500 to-red-500'
                }`} />

                {/* Left side: Artwork thumb */}
                <div className="w-20 h-20 rounded-xl bg-[#0B0F19] border border-[#23324C]/60 flex items-center justify-center p-1.5 shrink-0 relative">
                  <img
                    src={thumbUrl}
                    alt={char.name}
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 border border-gray-800 text-[8px] font-extrabold text-gray-300">
                    {RARITY_MAP[char.rarity]}
                  </span>
                </div>

                {/* Right side: Information */}
                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold text-white uppercase tracking-wider ${elInfo.color}`}>
                        {elInfo.label}
                      </span>
                      <button
                        onClick={(e) => handleDeleteItem(e, char.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded transition-all hover:bg-red-500/10 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400 truncate">{char.subname}</p>
                    <h4 className="font-extrabold text-sm text-white truncate leading-tight">{char.name}</h4>
                  </div>

                  {/* Box Stats footer (rating, potential) */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#23324C]/40">
                    {/* Potential percentage */}
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-black text-gray-300">
                        {item.potential_percentage === 100 ? 'Rainbow 🌈' : `${item.potential_percentage}%`}
                      </span>
                    </div>

                    {/* Custom rating stars */}
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-black text-white">
                        {item.my_rating !== null ? `${item.my_rating}/10` : 'Unrated'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Box Item details Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161F30] border border-[#23324C] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setEditingItem(null)}
                className="absolute top-4 right-4 bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-white p-2 rounded-xl transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 space-y-6">
                {/* Header Profile */}
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl bg-[#0B0F19] border border-[#23324C] flex items-center justify-center p-1 shrink-0">
                    <img
                      src={`${supabaseUrl}/storage/v1/object/public/character-thumbnails/card_${editingItem.card_id}_thumb.png`}
                      alt={editingItem.character?.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-400">{editingItem.character?.subname}</p>
                    <h3 className="text-lg font-extrabold text-white tracking-tight leading-tight">{editingItem.character?.name}</h3>
                  </div>
                </div>

                {/* Edit Fields */}
                <div className="space-y-4 pt-2">
                  {/* Potential investment */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Potential Path Investment</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[0, 55, 69, 79, 90, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setEditPotential(val)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            editPotential === val
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/15'
                              : 'bg-[#0B0F19]/60 text-gray-400 hover:text-gray-200 border-[#23324C] hover:bg-[#161F30]'
                          }`}
                        >
                          {val === 100 ? '100% 🌈' : `${val}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Evaluation Rating */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Your Evaluation Rating (1-10)</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all ${
                            editRating === star
                              ? 'bg-amber-500 text-white border-amber-400 shadow-md'
                              : 'bg-[#0B0F19]/60 text-gray-400 hover:text-gray-200 border-[#23324C]'
                          }`}
                        >
                          {star}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditRating(null)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-transparent text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Custom Notes */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Custom Strategy Notes</label>
                    <div className="relative">
                      <span className="absolute top-3 left-3 text-gray-500">
                        <BookOpen className="w-4 h-4" />
                      </span>
                      <textarea
                        rows={3}
                        placeholder="Write down optimal build paths, link partner reminders, or prioritizations..."
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F19]/60 border border-[#23324C] focus:border-emerald-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all font-medium text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal actions */}
                <div className="flex gap-3 justify-end pt-2 border-t border-[#23324C]/40">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-gray-300 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saveLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-600/10 flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveLoading ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Evaluation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sudscqbmhbpgmwibnkco.supabase.co';