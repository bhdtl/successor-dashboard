import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database,
  Swords, 
  FolderHeart, 
  Sparkles, 
  LogOut, 
  User, 
  ChevronRight,
  Grid,
  X,
  Activity,
  Layers,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSwitcher, setShowSwitcher] = useState(false);

  const desktopNavigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Catalog', to: '/dokkan', icon: Database },
    { name: 'Team Builder', to: '/dokkan/team', icon: Swords },
    { name: 'My Box', to: '/dokkan/box', icon: FolderHeart },
    { name: 'Linking Partners', to: '/dokkan/partners', icon: Sparkles },
  ];

  // Dynamic Mobile Tab Bar Navigation (High Revolution UI/UX)
  // Left 4 tabs are function tabs; Far right is the "Switcher" button.
  const isDokkanRoute = location.pathname.startsWith('/dokkan');

  const mobileTabs = isDokkanRoute 
    ? [
        { name: 'Catalog', to: '/dokkan', icon: Database },
        { name: 'Team', to: '/dokkan/team', icon: Swords },
        { name: 'Box', to: '/dokkan/box', icon: FolderHeart },
        { name: 'Partners', to: '/dokkan/partners', icon: Sparkles },
      ]
    : [
        { name: 'Hub', to: '/', icon: LayoutDashboard },
        { name: 'Catalog', to: '/dokkan', icon: Database },
        { name: 'Team', to: '/dokkan/team', icon: Swords },
        { name: 'Box', to: '/dokkan/box', icon: FolderHeart },
      ];

  const handleToolSwitch = (path: string) => {
    setShowSwitcher(false);
    navigate(path);
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-gray-200 overflow-hidden font-sans">
      {/* 1. Desktop Sidebar (md and up) */}
      <aside className="hidden md:flex w-64 bg-[#161F30] border-r border-[#23324C] flex-col z-20 shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#23324C]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0B0F19] border border-[#23324C]/60 flex items-center justify-center p-0.5 shadow-md shrink-0">
              <img src={logoImg} className="w-full h-full object-contain rounded-md" alt="Successor Logo" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Successor
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {desktopNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => 
                `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group border ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C283F] border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#23324C] bg-[#0E1522]">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
              <User className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-300 truncate">{user?.email || 'bh.dtl@web.de'}</p>
              <p className="text-[10px] text-gray-500 font-medium">Administrator</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* NO Top Header on Mobile - Content flows full screen for native app feel */}
        
        {/* Desktop Top Header (md only) */}
        <header className="hidden md:flex h-16 bg-[#161F30]/40 backdrop-blur-md border-b border-[#23324C] items-center justify-between px-8 z-10">
          <h2 className="text-lg font-bold text-white tracking-wide">
            Private Dashboard
          </h2>
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
            <span>Global Status: <span className="text-green-500 font-bold">Online</span></span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </header>

        {/* Page Router Mount - adjusted top safe area for mobile when header is removed */}
        <main className="flex-grow overflow-y-auto bg-[#0B0F19] relative pb-24 md:pb-0 pt-[env(safe-area-inset-top,12px)] md:pt-0">
          <Outlet />
        </main>

        {/* 2. Mobile Bottom Floating Tab Bar (md-hidden) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
          <nav className="ios-tab-bar pointer-events-auto">
            <div className="ios-tab-inner">
              {/* Function Tabs (Left 4 Items) */}
              {mobileTabs.map((item) => {
                const Icon = item.icon;
                const isActive = item.to === '/' 
                  ? location.pathname === '/' 
                  : location.pathname.startsWith(item.to);

                return (
                  <Link
                    key={item.name}
                    to={item.to}
                    className="ios-tab-item group relative"
                  >
                    <div className={`ios-tab-content relative z-10 ${isActive ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                      <span className="ios-tab-label">{item.name}</span>
                    </div>
                  </Link>
                );
              })}

              {/* 5th Tab Item: Tool Switcher Trigger (Far Right) */}
              <button
                onClick={() => setShowSwitcher(true)}
                className="ios-tab-item group relative"
              >
                <div className={`ios-tab-content relative z-10 ${showSwitcher ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <Grid size={20} strokeWidth={showSwitcher ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Tools</span>
                </div>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* 3. High Revolution Tool Switcher Overlay */}
      <AnimatePresence>
        {showSwitcher && (
          <>
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSwitcher(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            />

            {/* Bottom Sheet Card */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#161F30]/95 backdrop-blur-xl border-t border-[#23324C] rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto flex flex-col space-y-6 shadow-2xl"
            >
              {/* Drag indicator bar */}
              <div className="w-12 h-1.5 bg-gray-700/50 rounded-full mx-auto" />

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Switch Tool</h3>
                  <p className="text-xs text-gray-400 mt-1">Select an application to launch</p>
                </div>
                <button
                  onClick={() => setShowSwitcher(false)}
                  className="p-2 rounded-full bg-[#1C283F] border border-[#23324C] text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Apps List */}
              <div className="grid grid-cols-1 gap-3">
                {/* Dokkan Battle */}
                <button
                  onClick={() => handleToolSwitch('/dokkan')}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border text-left ${
                    isDokkanRoute
                      ? 'bg-blue-600/10 border-blue-500/35 text-white'
                      : 'bg-[#1C283F]/50 border-[#23324C] text-gray-300 hover:bg-[#1C283F]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      isDokkanRoute ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}>
                      <Swords size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm">Dokkan Battle Helper</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Active catalog, box and team optimizer</p>
                    </div>
                  </div>
                  {isDokkanRoute && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Active
                    </span>
                  )}
                </button>

                {/* Hub */}
                <button
                  onClick={() => handleToolSwitch('/')}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border text-left ${
                    location.pathname === '/'
                      ? 'bg-blue-600/10 border-blue-500/35 text-white'
                      : 'bg-[#1C283F]/50 border-[#23324C] text-gray-300 hover:bg-[#1C283F]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      location.pathname === '/' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}>
                      <LayoutDashboard size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm">Successor Hub</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Main application dashboard and portal</p>
                    </div>
                  </div>
                  {location.pathname === '/' && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Active
                    </span>
                  )}
                </button>

                {/* Tennis Scanner */}
                <div className="w-full p-4 rounded-2xl flex items-center justify-between border bg-[#1C283F]/20 border-[#23324C]/40 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-800/40 border border-gray-700/40 flex items-center justify-center text-gray-500">
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-gray-400">Tennis & Betting Scanner</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Odds scanner and value scout dashboard</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full border border-gray-700">
                    Locked
                  </span>
                </div>

                {/* Planner */}
                <div className="w-full p-4 rounded-2xl flex items-center justify-between border bg-[#1C283F]/20 border-[#23324C]/40 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-800/40 border border-gray-700/40 flex items-center justify-center text-gray-500">
                      <CheckSquare size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-gray-400">Personal Planner</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Task board and routine planner</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full border border-gray-700">
                    Soon
                  </span>
                </div>

                {/* Finances */}
                <div className="w-full p-4 rounded-2xl flex items-center justify-between border bg-[#1C283F]/20 border-[#23324C]/40 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-800/40 border border-gray-700/40 flex items-center justify-center text-gray-500">
                      <Layers size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-gray-400">Finances</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Expense logs and investment tracking</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full border border-gray-700">
                    Soon
                  </span>
                </div>
              </div>

              {/* User Logout at bottom of bottom sheet */}
              <div className="border-t border-[#23324C] pt-6 flex flex-col space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                    <User className="w-4.5 h-4.5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-300 truncate">{user?.email || 'bh.dtl@web.de'}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Administrator</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowSwitcher(false);
                    signOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
