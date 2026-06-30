import React, { useState } from 'react';

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

export const DokkanCard = React.memo<DokkanCardProps>(({
  cardId,
  name,
  rarity,
  element,
  className = '',
  size = 'md',
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const [rarityError, setRarityError] = useState(false);
  const [typeError, setTypeError] = useState(false);

  const jpId = String(cardId).slice(0, -1) + '0';
  const cdnBase = 'https://cdn.dokkan.fyi';

  // Map rarity IDs to strings used in URL filenames
  const rarityMap: Record<number, string> = {
    1: 'n',
    2: 'r',
    3: 'ssr',
    4: 'ur',
    5: 'lr',
  };
  const rarityStr = rarityMap[rarity] || 'ssr';

  // Calculate type index (0: AGL, 1: TEQ, 2: INT, 3: STR, 4: PHY)
  const typeIndex = element % 10;

  // Determine frame rarity number: rarity <= 2 maps to 1 or 2, higher rarities map to 5 (gold metallic frame)
  const frameRarityNum = rarity <= 2 ? rarity : 5;

  // Asset URLs from cdn.dokkan.fyi
  const frameUrl = `${cdnBase}/assets/en/layout/en/image/character_thumb_bg/cha_base_0${typeIndex}_0${frameRarityNum}.png`;
  const portraitUrl = `${cdnBase}/assets/en/character/thumb/card_${jpId}_thumb/card_${jpId}_thumb.png`;
  
  // Type icon url logic
  const typeUrlIdx = rarity <= 2 ? `0${typeIndex}` : element;
  const typeUrl = `${cdnBase}/assets/en/layout/en/image/cha_type_icon_${typeUrlIdx}.png`;
  
  // Rarity badge url
  const rarityUrl = `${cdnBase}/assets/en/layout/en/image/cha_rare_sm_${rarityStr}.png`;

  // Scale factors based on sizes
  const scaleMap = {
    sm: 0.6,
    md: 0.8,
    lg: 1.0,
    xl: 1.25,
  };
  const scale = scaleMap[size] || 0.8;

  // Exact dimensions scaled based on dokkan.fyi Vue bundle styles
  const cardWidth = 100 * scale;
  const cardHeight = 115 * scale;
  const frameHeight = 100 * scale;
  const portraitWidth = 125 * scale;
  const typeIconSize = 48 * scale;
  const rarityBadgeSize = 60 * scale;

  return (
    <div
      onClick={onClick}
      style={{ width: `${cardWidth}px`, height: `${cardHeight}px` }}
      className={`relative select-none cursor-pointer shrink-0 transition-transform duration-200 hover:scale-[1.03] active:scale-95 ${className}`}
    >
      {/* 1. Card container absolute aligned to bottom */}
      <div 
        style={{ height: `${frameHeight}px` }}
        className="absolute bottom-0 left-0 w-full"
      >
        {/* Background card frame border base */}
        {!frameError ? (
          <img
            src={frameUrl}
            alt=""
            onError={() => setFrameError(true)}
            className="absolute bottom-0 left-0 w-full h-full object-contain pointer-events-none"
            draggable="false"
          />
        ) : (
          <div className="absolute bottom-0 left-0 w-full h-full bg-[#161F30] border border-[#23324C] clip-dokkan" />
        )}

        {/* 2. Character face portrait overlapping the frame (3D effect) */}
        <div
          style={{
            width: `${portraitWidth}px`,
            top: `${-17 * scale}px`,
            left: `${-12 * scale}px`,
          }}
          className="absolute z-10 pointer-events-none"
        >
          {!imgError ? (
            <img
              src={portraitUrl}
              alt={name}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-auto object-contain"
              draggable="false"
            />
          ) : (
            <div className="flex items-center justify-center font-black text-white text-[9px] uppercase tracking-tighter h-12 w-12 mx-auto pt-4">
              {name.substring(0, 3)}
            </div>
          )}
        </div>

        {/* Special glowing effect for LR cards */}
        {rarityStr === 'lr' && (
          <div 
            style={{
              width: `${frameHeight}px`,
              height: `${frameHeight}px`,
            }}
            className="absolute bottom-0 left-0 bg-[linear-gradient(135deg,rgba(252,211,77,0.1),rgba(239,68,68,0.15),rgba(236,72,153,0.15),rgba(6,182,212,0.1))] bg-[length:200%_200%] animate-lr-glow pointer-events-none mix-blend-screen clip-dokkan"
          />
        )}
      </div>

      {/* 3. Type Circle Badge overlay (Top Right) */}
      {!typeError && (
        <img
          src={typeUrl}
          alt=""
          onError={() => setTypeError(true)}
          style={{
            width: `${typeIconSize}px`,
            height: `${typeIconSize}px`,
            right: `${-19 * scale}px`,
            top: `${-17 * scale}px`,
          }}
          className="absolute z-20 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none"
          draggable="false"
        />
      )}

      {/* 4. Rarity Text Badge overlay (Bottom Left) */}
      {!rarityError && (
        <img
          src={rarityUrl}
          alt=""
          onError={() => setRarityError(true)}
          style={{
            width: `${rarityBadgeSize}px`,
            height: `${rarityBadgeSize}px`,
            bottom: `${-15 * scale}px`,
            left: `${-15 * scale}px`,
          }}
          className="absolute z-20 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none"
          draggable="false"
        />
      )}
    </div>
  );
});

DokkanCard.displayName = 'DokkanCard';
