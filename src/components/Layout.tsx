import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database,
  Swords, 
  FolderHeart, 
  Sparkles, 
  Award,
  LogOut, 
  User, 
  ChevronRight
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Catalog', to: '/dokkan', icon: Database },
    { name: 'Team Builder', to: '/dokkan/team', icon: Swords },
    { name: 'My Box', to: '/dokkan/box', icon: FolderHeart },
    { name: 'Linking Partners', to: '/dokkan/partners', icon: Sparkles },
    { name: 'Upgrade Advisor', to: '/dokkan/advisor', icon: Award },
  ];

  // Mobile navigation has 5 essential tabs (Apple HIG recommendation)
  const mobileNavigation = [
    { name: 'Hub', to: '/', icon: LayoutDashboard },
    { name: 'Catalog', to: '/dokkan', icon: Database },
    { name: 'Team', to: '/dokkan/team', icon: Swords },
    { name: 'Box', to: '/dokkan/box', icon: FolderHeart },
    { name: 'Advisor', to: '/dokkan/advisor', icon: Award },
  ];

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
          {navigation.map((item) => (
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. Mobile Top Navbar (md-hidden) */}
        <header className="md:hidden h-16 bg-[#161F30]/80 backdrop-blur-lg border-b border-[#23324C] flex items-center justify-between px-4 z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B0F19] border border-[#23324C]/60 flex items-center justify-center p-0.5 shadow-md">
              <img src={logoImg} className="w-full h-full object-contain rounded-md" alt="Successor Logo" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Successor
            </span>
          </div>

          {/* Quick Sign Out for Mobile */}
          <button
            onClick={signOut}
            title="Logout"
            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </header>

        {/* 3. Desktop Top Header (md only) */}
        <header className="hidden md:flex h-16 bg-[#161F30]/40 backdrop-blur-md border-b border-[#23324C] items-center justify-between px-8 z-10">
          <h2 className="text-lg font-bold text-white tracking-wide">
            Private Dashboard
          </h2>
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
            <span>Global Status: <span className="text-green-500 font-bold">Online</span></span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </header>

        {/* 4. Page Router Mount */}
        {/* We use pb-24 on mobile so that contents don't get cut off by the floating bottom tab bar */}
        <main className="flex-1 overflow-y-auto bg-[#0B0F19] relative pb-24 md:pb-0">
          <Outlet />
        </main>

        {/* 5. Mobile Bottom Floating Tab Bar (md-hidden) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
          <nav className="ios-tab-bar pointer-events-auto">
            <div className="ios-tab-inner">
              {mobileNavigation.map((item) => {
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
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};
