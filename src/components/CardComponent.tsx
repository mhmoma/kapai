import React from 'react';
import { Card } from '../types/game';
import { CardPixelArt, UpgradeParticleBurst } from './PixelSprites';

interface CardComponentProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  playable?: boolean;
  computedDamage?: number;
  computedBlock?: number;
  computedHits?: number;
  compact?: boolean;
  priceTag?: number;
  fanAngle?: number;
  fanOffsetY?: number;
  isJustUpgraded?: boolean;
  showUpgradePreview?: boolean;
  isJittering?: boolean;
  springManaged?: boolean;
  isDragging?: boolean;
  isReadyToRelease?: boolean;
  highlightRole?: 'core' | 'support' | 'dimmed' | null;
  highlightBadgeText?: string;
  ownedInDeckCount?: number;
}

export default function CardComponent({
  card,
  onClick,
  disabled = false,
  playable = true,
  computedDamage,
  computedBlock,
  computedHits,
  compact = false,
  priceTag,
  fanAngle = 0,
  fanOffsetY = 0,
  isJustUpgraded = false,
  showUpgradePreview = false,
  isJittering = false,
  springManaged = false,
  isDragging = false,
  isReadyToRelease = false,
  highlightRole = null,
  highlightBadgeText,
  ownedInDeckCount,
}: CardComponentProps) {
  const activeEffects = card.upgraded ? card.upgradedEffects : card.effects;
  const activeDesc = card.upgraded ? card.upgradedDescription : card.description;

  const baseDamage = card.effects.damage;
  const upgDamage = card.upgradedEffects.damage;
  const baseBlock = card.effects.block;
  const upgBlock = card.upgradedEffects.block;
  const upgradedCost =
    card.upgradedCost !== undefined ? card.upgradedCost : card.cost;

  const displayDamage =
    computedDamage !== undefined ? computedDamage : activeEffects.damage;
  const displayBlock =
    computedBlock !== undefined ? computedBlock : activeEffects.block;
  const displayHits =
    computedHits !== undefined ? computedHits : activeEffects.hits;

  const typeBadge =
    card.type === 'attack' ? '攻击' : card.type === 'skill' ? '技能' : '能力';

  const stageTagLabel =
    card.buildStage === 'late'
      ? '③毕业'
      : card.buildStage === 'mid'
      ? '②引擎'
      : card.buildStage === 'early' && card.rarity !== 'starter'
      ? '①过渡'
      : null;

  const cardBodyGradient =
    card.type === 'attack'
      ? 'from-stone-900 via-zinc-950 to-stone-950'
      : card.type === 'skill'
      ? 'from-stone-900 via-zinc-950 to-stone-950'
      : 'from-stone-900 via-zinc-950 to-stone-950';

  const artWindowAura =
    card.type === 'attack'
      ? 'from-rose-950/40 via-stone-900/60 to-stone-950 border-rose-900/60'
      : card.type === 'skill'
      ? 'from-indigo-950/40 via-stone-900/60 to-stone-950 border-indigo-900/60'
      : 'from-amber-950/40 via-stone-900/60 to-stone-950 border-amber-900/60';

  const outerFrameStyle = isReadyToRelease
    ? 'border-amber-400 ring-2 ring-amber-500/60 shadow-[0_20px_40px_rgba(0,0,0,0.9),0_0_24px_rgba(245,158,11,0.4)]'
    : isDragging
    ? 'border-amber-500/80 ring-1 ring-amber-400/40 shadow-[0_24px_42px_rgba(0,0,0,0.95),0_0_20px_rgba(217,119,6,0.35)]'
    : isJustUpgraded
    ? 'border-emerald-600 shadow-[0_14px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(16,185,129,0.4)]'
    : highlightRole === 'core'
    ? 'border-amber-500/90 ring-2 ring-amber-500/40 shadow-[0_12px_24px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.3)]'
    : highlightRole === 'support'
    ? 'border-indigo-400/80 ring-1 ring-indigo-500/30 shadow-[0_10px_20px_rgba(0,0,0,0.9)]'
    : card.upgraded
    ? 'border-emerald-700/80 shadow-[0_10px_20px_rgba(0,0,0,0.85)]'
    : card.classType === "warrior" ? "border-red-800/80 shadow-[0_12px_24px_rgba(0,0,0,0.9)]" : card.classType === "mage" ? "border-purple-800/80 shadow-[0_12px_24px_rgba(0,0,0,0.9)]" : card.classType === "assassin" ? "border-green-800/80 shadow-[0_12px_24px_rgba(0,0,0,0.9)]" : "border-stone-700/80 shadow-[0_10px_20px_rgba(0,0,0,0.85)]"
    ? 'border-amber-600/80 shadow-[0_12px_24px_rgba(0,0,0,0.9)]'
    : card.rarity === 'uncommon'
    ? 'border-sky-700/70 shadow-[0_10px_20px_rgba(0,0,0,0.85)]'
    : 'border-stone-700/80 shadow-[0_10px_20px_rgba(0,0,0,0.85)]';

  const interactiveClass =
    playable && !disabled
      ? springManaged
        ? isDragging
          ? 'cursor-grabbing'
          : 'hover:border-amber-400 hover:shadow-[0_18px_32px_rgba(0,0,0,0.95),0_0_18px_rgba(217,119,6,0.25)] cursor-grab active:cursor-grabbing'
        : 'hover:-translate-y-2 hover:scale-105 hover:z-40 hover:border-amber-400 hover:shadow-[0_20px_36px_rgba(0,0,0,0.95),0_0_20px_rgba(217,119,6,0.3)] cursor-pointer active:translate-y-0'
      : 'opacity-60 cursor-not-allowed';

  const roleWrapperClass =
    highlightRole === 'core'
      ? '-translate-y-2 z-20'
      : highlightRole === 'support'
      ? '-translate-y-1 z-10'
      : highlightRole === 'dimmed'
      ? 'opacity-35 scale-95 saturate-50 hover:opacity-100 hover:scale-105 hover:saturate-100'
      : '';

  return (
    <div
      style={
        !springManaged && (fanAngle !== 0 || fanOffsetY !== 0)
          ? {
              transform: `translateY(${fanOffsetY}px) rotate(${fanAngle}deg)`,
            }
          : undefined
      }
      className={`relative flex flex-col items-center ${
        springManaged ? '' : 'transition-all duration-150'
      } ${isJittering ? 'animate-pixel-card-jitter' : ''} ${roleWrapperClass}`}
    >
      {/* 拖拽至释放区时的顶部高亮提示标签 */}
      {isDragging && (
        <div
          className={`mb-1.5 px-3 py-0.5 border-2 text-[10px] font-black tracking-wider whitespace-nowrap shadow-[0_3px_0_#000] ${
            isReadyToRelease
              ? 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 text-slate-950 border-white shadow-[0_0_18px_rgba(250,204,21,0.95)] animate-pulse'
              : 'bg-slate-950/95 text-amber-300 border-amber-400/80'
          }`}
        >
          {isReadyToRelease ? '⚡ 松开鼠标释放卡牌' : '⬆️ 上拖至战场释放'}
        </div>
      )}

      {/* 升级成功时的径向像素粒子爆发 */}
      <UpgradeParticleBurst active={isJustUpgraded} />

      {/* 流派核心/协同组件高亮顶冠徽章 */}
      {highlightRole === 'core' && !isDragging && (
        <div className="mb-1.5 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-slate-950 border-2 border-white text-[10px] font-black tracking-wider shadow-[0_3px_0_#000,0_0_16px_rgba(250,204,21,0.9)] animate-bounce">
          ★ {highlightBadgeText || '流派核心'}
        </div>
      )}
      {highlightRole === 'support' && !isDragging && (
        <div className="mb-1.5 px-2 py-0.5 bg-cyan-950 text-cyan-200 border border-cyan-300 text-[10px] font-black tracking-wide shadow-[0_2px_0_#000]">
          ✦ {highlightBadgeText || '流派组件'}
        </div>
      )}

      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`relative group bg-gradient-to-b ${cardBodyGradient} border-[3px] ${outerFrameStyle} ${
          compact ? 'w-38 h-54 p-2' : 'w-44 h-64 p-2.5'
        } flex flex-col justify-between text-center ${
          springManaged ? 'transition-shadow duration-150' : 'transition-all duration-150'
        } select-none ${interactiveClass} ${
          isJustUpgraded ? 'animate-card-upgrade-flash z-40' : ''
        }`}
      >
        {/* 流派核心金色呼吸流光层 */}
        {highlightRole === 'core' && (
          <div className="absolute inset-0 z-20 bg-gradient-to-tr from-amber-400/20 via-transparent to-yellow-200/25 animate-pulse pointer-events-none" />
        )}
        {/* 升级瞬间全卡面流光闪烁层 */}
        {isJustUpgraded && (
          <div className="absolute inset-0 z-30 bg-gradient-to-tr from-emerald-400/40 via-yellow-200/50 to-emerald-300/35 animate-pulse pointer-events-none" />
        )}

        {/* Pixel Card Background Texture */}
        <img
          src="/src/assets/images/pixel_card_back_1791767688276.jpg"
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-40 transition-opacity pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
          referrerPolicy="no-referrer"
        />

        {/* Top-Left 3D Floating Energy Crystal Orb */}
        <div
          className={`absolute -top-2.5 -left-2.5 z-30 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black font-mono border-2 shadow-[2px_3px_0px_#000] ${
            isJustUpgraded
              ? 'bg-emerald-400 text-slate-950 border-yellow-200 animate-stat-upgrade-pulse'
              : playable
              ? 'bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 text-slate-950 border-white'
              : 'bg-slate-900 text-red-400 border-red-500'
          }`}
        >
          {showUpgradePreview && !card.upgraded && upgradedCost !== card.cost
            ? `${card.cost}➔${upgradedCost}`
            : card.cost}
        </div>

        {/* Top-Right Rarity, Archetype & Build Stage Gem */}
        <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-0.5 bg-slate-950/95 border border-slate-600 px-1.5 py-0.5 text-[9px] font-bold text-amber-200">
          <span>{card.archetypeTag || typeBadge}</span>
          {stageTagLabel && (
            <span
              className={`ml-0.5 px-1 rounded-[2px] text-[8px] font-black ${
                card.buildStage === 'late'
                  ? 'bg-amber-400 text-slate-950'
                  : card.buildStage === 'mid'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              {stageTagLabel}
            </span>
          )}
        </div>

        {/* HUGE Center Pixel Art Illustration Window (Takes 58% of card!) */}
        <div
          className={`relative z-10 mt-2 w-full ${
            compact ? 'h-26' : 'h-32'
          } bg-radial ${artWindowAura} border-2 flex items-center justify-center overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.85)]`}
        >
          {/* Glowing Pixel Halo behind artwork */}
          <div className="absolute w-20 h-20 rounded-full bg-white/10 blur-md group-hover:scale-125 transition-transform" />

          <div className="relative z-10 group-hover:scale-115 transition-transform duration-200 drop-shadow-[0_4px_0_rgba(0,0,0,0.9)]">
            <CardPixelArt
              spriteType={card.id || card.spriteType}
              className={compact ? 'w-16 h-16' : 'w-20 h-20'}
            />
          </div>

          {/* Floating Visual Damage / Block Badges directly on the Art Frame */}
          <div className="absolute bottom-1 inset-x-1.5 z-20 flex items-center justify-between pointer-events-none">
            {displayDamage !== undefined || activeEffects.damageEqualsBlock ? (
              <span
                className={`px-1.5 py-0.5 bg-red-950/95 border border-red-400 text-xs font-black font-mono shadow-[2px_2px_0_#000] ${
                  isJustUpgraded
                    ? 'text-yellow-200 animate-stat-upgrade-pulse'
                    : showUpgradePreview && !card.upgraded && upgDamage !== baseDamage
                    ? 'text-emerald-300'
                    : 'text-red-200'
                }`}
              >
                {showUpgradePreview &&
                !card.upgraded &&
                baseDamage !== undefined &&
                upgDamage !== undefined &&
                upgDamage !== baseDamage
                  ? `⚔️${baseDamage}➔${upgDamage}`
                  : `⚔️${displayDamage ?? 0}`}
                {displayHits && displayHits > 1 ? `x${displayHits}` : ''}
              </span>
            ) : (
              <span />
            )}

            {displayBlock !== undefined ? (
              <span
                className={`px-1.5 py-0.5 bg-sky-950/95 border border-sky-300 text-xs font-black font-mono shadow-[2px_2px_0_#000] ${
                  isJustUpgraded
                    ? 'text-emerald-300 animate-stat-upgrade-pulse'
                    : showUpgradePreview && !card.upgraded && upgBlock !== baseBlock
                    ? 'text-emerald-300'
                    : 'text-sky-200'
                }`}
              >
                {showUpgradePreview &&
                !card.upgraded &&
                baseBlock !== undefined &&
                upgBlock !== undefined &&
                upgBlock !== baseBlock
                  ? `🛡️${baseBlock}➔${upgBlock}`
                  : `🛡️${displayBlock}`}
              </span>
            ) : (
              <span />
            )}
          </div>
        </div>

        {/* Ornate Ribbon Name Banner */}
        {/* Ornate Ribbon Name Banner */}
        <div
          className={`relative z-20 -mt-1.5 w-full py-1 px-2 border-y-2 ${
            card.upgraded || isJustUpgraded
              ? "bg-emerald-950 border-emerald-400 text-emerald-200"
              : card.classType === "warrior" 
                ? "bg-[var(--color-deep-crimson)] border-[var(--color-ancient-gold)] text-white" 
                : card.classType === "mage" 
                ? "bg-[var(--color-ember-orange)] border-[var(--color-ancient-gold)] text-slate-950" 
                : card.classType === "assassin" 
                ? "bg-emerald-800 border-[var(--color-ancient-gold)] text-white" 
                : "bg-slate-900 border-slate-500 text-white"
          } shadow-[0_2px_0_#000] flex items-center justify-center gap-1`}
        >
          <span className="text-xs font-black tracking-wide truncate">
            {card.name}
            {card.upgraded ? "+" : showUpgradePreview ? " ➔ +" : ""}
            {card.upgraded ? '+' : showUpgradePreview ? ' ➔ +' : ''}
          </span>
        </div>

        {/* Concise Visual Effect Box */}
        <div className="relative z-10 flex-1 flex items-center justify-center w-full bg-slate-950/90 border border-slate-800 px-1.5 py-1 mt-1">
          <p
            className={`text-[10px] leading-tight line-clamp-2 font-bold ${
              isJustUpgraded
                ? 'text-yellow-200'
                : card.upgraded
                ? 'text-emerald-200'
                : 'text-slate-200'
            }`}
          >
            {showUpgradePreview && !card.upgraded
              ? card.upgradedDescription
              : activeDesc}
          </p>
        </div>
      </button>

      {priceTag !== undefined && (
        <div className="mt-1.5 px-3 py-0.5 bg-slate-950 border-2 border-amber-400 text-xs font-black text-amber-300 font-mono shadow-[2px_2px_0_#000]">
          💰 {priceTag}
        </div>
      )}

      {ownedInDeckCount !== undefined && ownedInDeckCount > 0 && (
        <div className="mt-1 px-2.5 py-0.5 bg-emerald-950 border border-emerald-400 text-[10px] font-black text-emerald-300 font-mono shadow-[2px_2px_0_#000]">
          ✓ 已入牌组 ×{ownedInDeckCount}
        </div>
      )}
    </div>
  );
}
