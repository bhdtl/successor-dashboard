import { X, Plus } from 'lucide-react';

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  price: number;
  xp: number; // Expected Points
  form: number; // Form factor e.g., 1.3, 0.9
  team: string;
  opponent: string;
  isHome: boolean;
  avatarColor?: string; // gradient bg styling
  isCaptain?: boolean;
  image?: string; // base64 or URL player photo
}

interface PlayerCardProps {
  player?: Player;
  positionLabel: 'GK' | 'DEF' | 'MID' | 'FWD';
  onRemove?: () => void;
  onClick?: () => void;
}

export function PlayerCard({ player, positionLabel, onRemove, onClick }: PlayerCardProps) {
  if (!player) {
    // Empty state card (dashed border, pink plus icon)
    return (
      <button
        onClick={onClick}
        className="w-24 h-32 xs:w-28 xs:h-36 sm:w-32 sm:h-40 rounded-2xl border-2 border-dashed border-white/10 bg-successor-card/45 backdrop-blur-md flex flex-col items-center justify-between p-3 hover:border-successor-mint/40 hover:bg-successor-card/65 transition-all duration-200 group focus:outline-none"
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-200">
            <Plus size={16} className="text-pink-400" />
          </div>
        </div>
        <div className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-full">
          <span className="text-[9px] font-black tracking-wider text-gray-400 group-hover:text-white transition-colors uppercase">
            {positionLabel}
          </span>
        </div>
      </button>
    );
  }

  // Populated state card
  const gradientBg = player.avatarColor || 'from-[#1e293b] to-[#0f172a]';

  return (
    <div
      className="w-24 h-32 xs:w-28 xs:h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden border border-white/10 bg-successor-card relative flex flex-col justify-between p-2 shadow-lg group hover:border-successor-mint/30 transition-all duration-300"
    >
      {/* Background Graphic Gradient representing team colors */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientBg} opacity-50 z-0`} />
      
      {/* Render player photo if available, otherwise fallback to name initials */}
      {player.image ? (
        <img 
          src={player.image} 
          alt={player.name} 
          className="absolute inset-0 w-full h-full object-cover z-10 brightness-95 group-hover:scale-[1.03] transition-transform duration-300"
        />
      ) : (
        <div className="absolute inset-x-0 bottom-4 top-2 flex items-end justify-center z-0 overflow-hidden">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center translate-y-2 group-hover:scale-105 transition-transform duration-300">
            <span className="text-white/20 font-black text-2xl uppercase">
              {player.name.substring(0, 2)}
            </span>
          </div>
        </div>
      )}

      {/* Top action row */}
      <div className="relative z-10 flex justify-between items-start w-full">
        {/* Status indicator (Green circle or Captain Badge) */}
        <div className="flex gap-1 items-center">
          {player.isCaptain ? (
            <div className="w-5 h-5 rounded-full bg-successor-mint text-black font-black text-[9px] flex items-center justify-center border border-black/20 shadow-sm" title="Captain">
              C
            </div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-successor-mint/20 border border-successor-mint flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-successor-mint" />
            </div>
          )}
        </div>

        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="w-5 h-5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black/60 transition-colors"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {/* Bottom info row */}
      <div className="relative z-10 w-full flex flex-col items-center gap-1">
        {/* Name pill */}
        <div className="w-full px-2 py-0.5 bg-black/60 border border-white/10 rounded-full backdrop-blur-md text-center shadow-md">
          <span className="text-[10px] sm:text-xs font-black text-white truncate block">
            {player.name}
          </span>
        </div>

        {/* Fixture details (e.g. NFO(A) or LEV(H)) */}
        <div className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.04] rounded-md text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase">
          {player.opponent} ({player.isHome ? 'H' : 'A'})
        </div>
      </div>
    </div>
  );
}
