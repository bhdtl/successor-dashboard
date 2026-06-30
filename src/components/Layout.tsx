import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, Outlet } from 'react-router-dom';
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

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Dokkan Catalog', to: '/dokkan', icon: Database },
    { name: 'Team Builder', to: '/dokkan/team', icon: Swords },
    { name: 'My Card Box', to: '/dokkan/box', icon: FolderHeart },
    { name: 'Linking Partners', to: '/dokkan/partners', icon: Sparkles },
    { name: 'Upgrade Advisor', to: '/dokkan/advisor', icon: Award },
  ];

  return (
    <div className="flex h-screen bg-[#0B0F19] text-gray-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161F30] border-r border-[#23324C] flex flex-col z-20 shrink-0">
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
                `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1C283F] border border-transparent'
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
        {/* Top Header */}
        <header className="h-16 bg-[#161F30]/40 backdrop-blur-md border-b border-[#23324C] flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-bold text-white tracking-wide">
            Private Dashboard
          </h2>
          <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
            <span>Global Status: <span className="text-green-500 font-bold">Online</span></span>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </header>

        {/* Dynamic Page Router Mount */}
        <main className="flex-1 overflow-y-auto bg-[#0B0F19] relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
