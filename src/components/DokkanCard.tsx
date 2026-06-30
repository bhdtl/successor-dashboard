import React, { useState } from 'react';
import { getDokkanThumbUrl } from '../lib/supabase';

interface DokkanCardProps {
  cardId: number | string;
  name: string;
  rarity: number;
  element: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: (e: React.MouseEvent) => void;
}

export const RARITY_MAP: Record<number, string> = {
  1: 'N',
  2: 'R',
  3: 'SSR',
  4: 'UR',
  5: 'LR',
};

export const DokkanCard: React.FC<DokkanCardProps> = ({
  cardId,
  name,
  rarity,
  element,
  className = '',
  size = 'md',
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [rarityError, setRarityError] = useState(false);
  const [typeError, setTypeError] = useState(false);

  const thumbUrl = getDokkanThumbUrl(cardId);

  const rarityMap: Record<number, string> = {
    1: 'n',
    2: 'r',
    3: 'ssr',
    4: 'ur',
    5: 'lr',
  };

  const rarityStr = rarityMap[rarity] || 'ssr';
  const rarityUrl = `https://enaskhebnjtktdfszdcb.supabase.co/storage/v1/object/public/assets/layout/en/image/character_folder/cha_rare_${rarityStr}.png`;
  const typeUrl = `https://enaskhebnjtktdfszdcb.supabase.co/storage/v1/object/public/assets/layout/en/image/character_folder/cha_type_icon_${element}.png`;

  // Size styling classes
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-28 h-28',
  };

  const badgeSizes = {
    sm: { type: 'w-5 h-5 top-[-1px] left-[-1px]', rarity: 'h-3.5 bottom-[-1px] right-[-1px]' },
    md: { type: 'w-7.5 h-7.5 top-[-3px] left-[-3px]', rarity: 'h-5 bottom-[-2px] right-[-2px]' },
    lg: { type: 'w-9 h-9 top-[-4px] left-[-4px]', rarity: 'h-6 bottom-[-3px] right-[-3px]' },
    xl: { type: 'w-10 h-10 top-[-5px] left-[-5px]', rarity: 'h-7 bottom-[-4px] right-[-4px]' },
  };

  // Rarity frame border colors/gradients
  const borderGradient = {
    n: 'bg-gradient-to-br from-gray-500 to-gray-700',
    r: 'bg-gradient-to-br from-amber-700 to-amber-900',
    ssr: 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    ur: 'bg-gradient-to-br from-amber-300 via-yellow-400 via-orange-400 to-red-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    lr: 'bg-[linear-gradient(135deg,#fcd34d,#ef4444,#ec4899,#06b6d4,#fcd34d)] bg-[length:200%_200%] animate-lr-glow shadow-[0_0_16px_rgba(236,72,153,0.6)]',
  }[rarityStr] || 'bg-gray-600';

  return (
    <div 
      onClick={onClick}
      className={`relative select-none cursor-pointer group shrink-0 ${sizeClasses[size]} ${className}`}
    >
      {/* Outer border container with beveled Dokkan clip-path */}
      <div className={`w-full h-full p-[2.5px] rounded-[10%] ${borderGradient} transition-transform duration-200 group-hover:scale-[1.03] active:scale-95 clip-dokkan`}>
        {/* Inner content container */}
        <div className="w-full h-full bg-[#0B0F19] clip-dokkan relative overflow-hidden flex items-center justify-center">
          {/* Character artwork */}
          {imgError ? (
            <div className="text-center font-black text-white text-[10px] uppercase truncate px-1">
              {name.substring(0, 3)}
            </div>
          ) : (
            <img
              src={thumbUrl}
              alt={name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-[108%] h-[108%] max-w-none object-cover"
            />
          )}

          {/* Glare effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>

      {/* Type badge overlay (Top Left) */}
      {!typeError && (
        <img
          src={typeUrl}
          alt="Type"
          onError={() => setTypeError(true)}
          className={`absolute z-10 ${badgeSizes[size].type} object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]`}
        />
      )}

      {/* Rarity text overlay (Bottom Right) */}
      {!rarityError && (
        <img
          src={rarityUrl}
          alt="Rarity"
          onError={() => setRarityError(true)}
          className={`absolute z-10 ${badgeSizes[size].rarity} object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]`}
        />
      )}
    </div>
  );
};
