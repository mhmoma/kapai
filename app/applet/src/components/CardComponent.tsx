import React from 'react';
import { Card } from '../types/game';
import { CardPixelArt } from './PixelSprites';

interface CardComponentProps {
  card: Card;
  onClick: () => void;
  disabled?: boolean;
}

export const CardComponent: React.FC<CardComponentProps> = ({ card, onClick, disabled }) => {
  // Determine border and banner color based on class
  const borderColor = 
    card.classType === 'warrior' ? 'border-[var(--color-deep-crimson)]' :
    card.classType === 'mage' ? 'border-[var(--color-ember-orange)]' :
    'border-[var(--color-ancient-gold)]';

  const bannerColor = 
    card.classType === 'warrior' ? 'bg-[var(--color-deep-crimson)]' :
    card.classType === 'mage' ? 'bg-[var(--color-ember-orange)]' :
    'bg-[var(--color-ancient-gold-dark)]';

  return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`relative w-48 h-72 flex flex-col items-center bg-gradient-to-br from-[#2a2b30] to-[#1a1b1e] border-[6px] ${borderColor} transition-transform hover:scale-105 group ${disabled ? 'opacity-50' : ''}`}
        style={{
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)',
        }}
      >
        {/* Top Gloss Overlay */}
        <div 
          className="absolute inset-0 rounded-[6px] pointer-events-none opacity-0 group-hover:opacity-100 group-hover:animate-card-gloss-swipe"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
          }}
        />
      {/* 3D Cost Badge */}
      <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-[var(--color-deep-crimson)] border-4 border-white flex items-center justify-center text-white font-black text-xl z-50 shadow-[2px_4px_6px_rgba(0,0,0,0.6)]">
        {card.cost}
      </div>

      {/* Ribbon Banner */}
      <div 
        className={`w-[110%] mt-2 h-10 ${bannerColor} border-2 border-[var(--color-ancient-gold)] flex items-center justify-center text-white font-black text-sm z-40 shadow-[0_4px_4px_rgba(0,0,0,0.5)]`}
        style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)' }}
      >
        {card.name}
      </div>
      
      {/* Art Frame */}
      <div className="w-[90%] h-28 bg-[var(--color-rock-surface)] border-4 border-[var(--color-rock-border)] flex items-center justify-center mt-4 mb-2 overflow-hidden shadow-inner relative">
        {card.classType === 'warrior' ? (
          <img src="/src/assets/images/warrior_card_1791792767135.jpg" alt="Warrior" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : card.classType === 'mage' ? (
          <img src="/src/assets/images/mage_card_1791792780575.jpg" alt="Mage" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : card.classType === 'assassin' ? (
          <img src="/src/assets/images/assassin_card_1791792797689.jpg" alt="Assassin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <CardPixelArt spriteType={card.id || card.spriteType} className="w-20 h-20" />
        )}
      </div>

      {/* Description */}
      <div className="flex-1 w-[90%] bg-slate-950/80 p-2 text-slate-200 text-[10px] leading-tight text-center border-t-2 border-[var(--color-rock-border)] mt-auto mb-2">
        {card.description}
      </div>
    </button>
  );
};
