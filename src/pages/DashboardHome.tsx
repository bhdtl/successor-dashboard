import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Swords, 
  Activity,
  Layers,
  CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const DashboardHome: React.FC = () => {
  const [stats, setStats] = useState({
    totalCharacters: 0,
    boxCount: 0,
    teamCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: charCount } = await supabase
          .from('dokkan_characters')
          .select('*', { count: 'exact', head: true });

        const { count: boxCount } = await supabase
          .from('dokkan_user_box')
          .select('*', { count: 'exact', head: true });

        const { count: teamCount } = await supabase
          .from('dokkan_user_teams')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalCharacters: charCount || 0,
          boxCount: boxCount || 0,
          teamCount: teamCount || 0,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 }
    })
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10 relative">
      {/* Background radial highlight */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header welcome banner */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
          Successor Hub
        </h1>
        <p className="text-gray-400 font-medium text-sm md:text-base">
          Welcome to your private suite of personal productivity & gaming tools.
        </p>
      </div>

      {/* Apps Launcher Section */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">My Applications</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* APP 1: DOKKAN BATTLE HELPER */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-[#161F30]/75 border border-[#23324C] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 group relative overflow-hidden"
          >
            {/* Ambient background glow */}
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-lg flex items-center gap-2">
                    Dokkan Battle Helper
                    <span className="text-[9px] font-black tracking-widest uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                      Active
                    </span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">Optimize teams, manage collection, find linking partners.</p>
                </div>
              </div>

              {/* Quick stats grid inside Dokkan App */}
              <div className="grid grid-cols-3 gap-3 bg-[#0B0F19]/40 border border-[#23324C]/40 p-4 rounded-2xl text-center">
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">Total Cards</p>
                  <p className="text-base font-black text-white mt-0.5">
                    {loading ? '...' : stats.totalCharacters.toLocaleString()}
                  </p>
                </div>
                <div className="border-x border-[#23324C]/60">
                  <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">In Box</p>
                  <p className="text-base font-black text-white mt-0.5">
                    {loading ? '...' : stats.boxCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-gray-500 tracking-wider">Teams</p>
                  <p className="text-base font-black text-white mt-0.5">
                    {loading ? '...' : stats.teamCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick module links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Catalog', to: '/dokkan' },
                { label: 'Team Builder', to: '/dokkan/team' },
                { label: 'My Box', to: '/dokkan/box' },
                { label: 'Partners', to: '/dokkan/partners' },
                { label: 'Advisor', to: '/dokkan/advisor' },
              ].map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="py-2 px-3 bg-[#1C283F]/50 hover:bg-blue-600 hover:text-white border border-[#23324C] hover:border-blue-500 text-[10px] font-bold text-center text-gray-300 rounded-xl transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* APP 2: TENNIS & BETTING SCANNER (COMING SOON) */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-[#161F30]/40 border border-[#23324C]/60 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            {/* Ambient background glow */}
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-lime-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-400 text-lg flex items-center gap-2">
                    Tennis & Betting Scanner
                    <span className="text-[9px] font-black tracking-widest uppercase bg-gray-800 text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">Integration of backhandtl analytics scanner dashboard.</p>
                </div>
              </div>

              {/* Teaser placeholder info */}
              <div className="bg-[#0B0F19]/20 border border-[#23324C]/20 p-4 rounded-2xl text-xs text-gray-500 leading-relaxed italic">
                Will aggregate matches list, live odds movements, neural network player predictions, and court database.
              </div>
            </div>

            <button
              disabled
              className="w-full py-2 px-3 bg-gray-900/40 border border-gray-800/50 text-[10px] font-bold text-center text-gray-600 rounded-xl cursor-not-allowed"
            >
              Scanner Locked
            </button>
          </motion.div>

          {/* APP 3: TASK MANAGER (PLACEHOLDER) */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-[#161F30]/40 border border-[#23324C]/60 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-400 text-lg flex items-center gap-2">
                    Personal Planner
                    <span className="text-[9px] font-black tracking-widest uppercase bg-gray-800 text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">Tasks, routines, and habit tracking for your daily schedule.</p>
                </div>
              </div>
            </div>

            <button
              disabled
              className="w-full py-2 px-3 bg-gray-900/40 border border-gray-800/50 text-[10px] font-bold text-center text-gray-600 rounded-xl cursor-not-allowed"
            >
              Planner Locked
            </button>
          </motion.div>

          {/* APP 4: FINANCIAL TRACKER (PLACEHOLDER) */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-[#161F30]/40 border border-[#23324C]/60 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-400 text-lg flex items-center gap-2">
                    Finances
                    <span className="text-[9px] font-black tracking-widest uppercase bg-gray-800 text-gray-500 border border-gray-700 px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">Tracks monthly expenses, investments, and net worth charts.</p>
                </div>
              </div>
            </div>

            <button
              disabled
              className="w-full py-2 px-3 bg-gray-900/40 border border-gray-800/50 text-[10px] font-bold text-center text-gray-600 rounded-xl cursor-not-allowed"
            >
              Finances Locked
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
