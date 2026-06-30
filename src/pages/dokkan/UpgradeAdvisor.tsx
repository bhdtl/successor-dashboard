import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ELEMENT_MAP } from './DokkanCatalog';
import { DokkanCard } from '../../components/DokkanCard';
import { 
  Award, 
  TrendingUp, 
  Calendar, 
  Zap, 
  ChevronRight, 
  Loader,
  FolderHeart
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BoxItem {
  user_id: string;
  card_id: number;
  level: number;
  sa_level: number;
  potential_percentage: number;
  my_rating: number | null;
  my_notes: string | null;
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

export const UpgradeAdvisor: React.FC = () => {
  const { user } = useAuth();
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBox = async () => {
      if (!user) return;
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
        console.error('Error fetching advisor box:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBox();
  }, [user]);

  // Determine current day of week and which events are open
  const getDailyEvents = () => {
    const day = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const schedule = [
      { dayName: 'Sunday', openEvents: 'Super Class Growth & Awakening Events', type: 'Super' },
      { dayName: 'Monday', openEvents: 'AGL Type Growth & Awakening Events', type: 'AGL' },
      { dayName: 'Tuesday', openEvents: 'TEQ Type Growth & Awakening Events', type: 'TEQ' },
      { dayName: 'Wednesday', openEvents: 'INT Type Growth & Awakening Events', type: 'INT' },
      { dayName: 'Thursday', openEvents: 'STR Type Growth & Awakening Events', type: 'STR' },
      { dayName: 'Friday', openEvents: 'PHY Type Growth & Awakening Events', type: 'PHY' },
      { dayName: 'Saturday', openEvents: 'Extreme Class Growth & Awakening Events', type: 'Extreme' },
    ];

    return {
      today: schedule[day],
      fullSchedule: schedule
    };
  };

  const eventInfo = getDailyEvents();

  // Filter recommendations: characters that are not max potential
  const getUpgradeRecommendations = () => {
    const recs = boxItems
      .filter(item => item.potential_percentage < 100)
      .map(item => {
        // Calculate priority score
        // High rarity (LR=5) + High rating (1-10) gets highest priority
        const ratingScore = item.my_rating || 5;
        const rarityScore = item.character?.rarity || 3;
        const priorityScore = (rarityScore * 2) + ratingScore;

        let priorityLabel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (priorityScore >= 18) priorityLabel = 'CRITICAL';
        else if (priorityScore >= 14) priorityLabel = 'HIGH';
        else if (priorityScore < 10) priorityLabel = 'LOW';

        return {
          ...item,
          priorityScore,
          priorityLabel
        };
      });

    // Sort by priority score descending
    return recs.sort((a, b) => b.priorityScore - a.priorityScore);
  };

  const recommendations = getUpgradeRecommendations();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Award className="w-8 h-8 text-amber-500 animate-pulse" />
          Daily Guide & Upgrade Advisor
        </h1>
        <p className="text-gray-400 text-sm">
          Optimize your daily stamina. Identify top priority upgrades for your collected characters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Daily Events Tracker */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-indigo-400" />
            Daily Event Schedule
          </h3>

          <div className="bg-[#161F30] border border-[#23324C] rounded-3xl p-6 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />
            
            {/* Today highlight */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                Active Today
              </span>
              <h4 className="text-lg font-extrabold text-white">{eventInfo.today.dayName}</h4>
              <p className="text-sm text-gray-300 leading-relaxed font-semibold">
                {eventInfo.today.openEvents}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 pt-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>Tip: Farm Potential Orbs of this type today!</span>
              </div>
            </div>

            {/* Weekly list */}
            <div className="border-t border-[#23324C]/60 pt-4 space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Weekly Rotation</span>
              <div className="space-y-2 text-xs">
                {eventInfo.fullSchedule.map((sched) => {
                  const isToday = sched.dayName === eventInfo.today.dayName;
                  return (
                    <div 
                      key={sched.dayName} 
                      className={`flex justify-between items-center p-2 rounded-xl border transition-all ${
                        isToday 
                          ? 'bg-indigo-500/10 border-indigo-500/25 text-white font-bold' 
                          : 'bg-[#0B0F19]/40 border-transparent text-gray-400'
                      }`}
                    >
                      <span>{sched.dayName}</span>
                      <span className="text-[10px] font-bold text-gray-400 truncate max-w-[140px]">
                        {sched.type} Events
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right columns: Upgrade recommendations list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
            Upgrade Recommendations
          </h3>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-16 bg-[#161F30]/40 rounded-2xl border border-[#23324C] p-8 space-y-3">
                <FolderHeart className="w-12 h-12 text-gray-600 mx-auto" />
                <h3 className="text-md font-bold text-white">All Characters Upgraded!</h3>
                <p className="text-sm text-gray-400">
                  Awesome job! All the characters currently in your box are at 100% Potential system investment.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {recommendations.map((rec) => {
                  const char = rec.character;
                  const elInfo = ELEMENT_MAP[char.element] || { type: 'AGL', color: 'bg-gray-500', label: 'Unknown' };

                  const priorityColors = {
                    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/25',
                    HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                    MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
                    LOW: 'bg-gray-800 text-gray-400 border-transparent',
                  };

                  return (
                    <div
                      key={char.id}
                      className="bg-[#161F30]/75 border border-[#23324C] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Artwork thumbnail */}
                        <DokkanCard
                          cardId={char.id}
                          name={char.name}
                          rarity={char.rarity}
                          element={char.element}
                          size="sm"
                        />

                        {/* Info */}
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-gray-400 truncate leading-none">{char.subname}</p>
                          <p className="text-sm font-extrabold text-white truncate mt-0.5">{char.name}</p>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold text-white uppercase tracking-wider ${elInfo.color}`}>
                              {elInfo.type}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              Current Potential: <strong className="text-gray-300">{rec.potential_percentage}%</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Priority Tag & Go button */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-[#23324C]/60 pt-3 sm:pt-0">
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black border ${priorityColors[rec.priorityLabel]}`}>
                          {rec.priorityLabel} PRIORITY
                        </span>
                        
                        <Link
                          to="/dokkan/box"
                          className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-xs font-bold rounded-xl transition-all flex items-center gap-1"
                        >
                          Upgrade Info
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

