import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Swords, FolderHeart, Sparkles, Database, ChevronRight } from 'lucide-react';
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
        // Fetch total characters count
        const { count: charCount } = await supabase
          .from('dokkan_characters')
          .select('*', { count: 'exact', head: true });

        // Fetch user box count
        const { count: boxCount } = await supabase
          .from('dokkan_user_box')
          .select('*', { count: 'exact', head: true });

        // Fetch user teams count
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
    <div className="p-8 max-w-6xl mx-auto space-y-10 relative">
      {/* Background radial highlight */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header welcome banner */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Welcome Back, Phina
        </h1>
        <p className="text-gray-400 font-medium">
          Here is your personal workstation status. Manage your box and build optimal teams.
        </p>
      </div>

      {/* Quick Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: 'Dokkan Characters', value: stats.totalCharacters, icon: Database, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { name: 'My Collected Box', value: stats.boxCount, icon: FolderHeart, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { name: 'Saved Teams', value: stats.teamCount, icon: Swords, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
        ].map((stat, i) => (
          <motion.div
            key={stat.name}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={`border rounded-2xl p-6 flex items-center justify-between shadow-lg bg-[#161F30]/40 backdrop-blur-sm ${stat.color.split(' ').slice(1).join(' ')}`}
          >
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{stat.name}</p>
              {loading ? (
                <div className="h-9 w-16 bg-gray-700/50 rounded-lg animate-pulse" />
              ) : (
                <p className="text-3xl font-extrabold text-white">{stat.value.toLocaleString()}</p>
              )}
            </div>
            <div className={`p-4 rounded-xl border ${stat.color}`}>
              <stat.icon className="w-6 h-6 shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tools Shortcuts Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white tracking-wide">Quick Tools Shortcuts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Dokkan Catalog',
              desc: 'Browse and search all 1,385+ cards. Sort by elements, rarities, categories, and links.',
              to: '/dokkan',
              icon: Database,
              color: 'from-blue-600 to-cyan-600',
            },
            {
              title: 'Card Box Manager',
              desc: 'Manage your owned characters, update their levels, potential percentages, and custom notes.',
              to: '/dokkan/box',
              icon: FolderHeart,
              color: 'from-emerald-600 to-teal-600',
            },
            {
              title: 'Linking Partner Finder',
              desc: 'Choose any card to instantly calculate and list its best linking partners based on shared link skills.',
              to: '/dokkan/partners',
              icon: Sparkles,
              color: 'from-purple-600 to-indigo-600',
            },
          ].map((tool, i) => (
            <motion.div
              key={tool.title}
              custom={i + 3}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-[#161F30]/60 border border-[#23324C] hover:border-gray-700 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-black/20 flex flex-col group"
            >
              <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <tool.icon className="w-5 h-5 text-gray-300" />
                    <h4 className="font-bold text-white text-lg">{tool.title}</h4>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{tool.desc}</p>
                </div>
                <Link
                  to={tool.to}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-wider"
                >
                  Open Tool
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
