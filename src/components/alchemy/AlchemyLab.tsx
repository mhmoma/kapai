import React, { useState } from 'react';

interface AlchemyRecipe {
  id: string;
  name: string;
  cost: number;
  desc: string;
  icon: string;
  category: string;
  materials: string[];
  fuzzyHint: string;
  bonusEffect: string;
}

interface AlchemyLabProps {
  recipes: AlchemyRecipe[];
  discoveredRecipes: string[];
  alchemyEssence: number;
  alchemyShards: number;
  alchemyCraftCount: number;
  onCraftRecipe: (recipeId: string) => void;
  onUnlockRecipe: (recipeId: string) => void;
  sound: { playClick: () => void; playVictory?: () => void };
}

export const AlchemyLab: React.FC<AlchemyLabProps> = ({
  recipes,
  discoveredRecipes,
  alchemyEssence,
  alchemyShards,
  alchemyCraftCount,
  onCraftRecipe,
  onUnlockRecipe,
  sound,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(recipes[0]?.id || null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const selectedRecipe = recipes.find((r) => r.id === selectedNodeId) || recipes[0];
  const isSelectedDiscovered = selectedRecipe ? discoveredRecipes.includes(selectedRecipe.id) : false;

  // Base materials definitions for Layer 1
  const baseMaterials = [
    { id: 'mat_fragment', name: '炼金残片', icon: '🧪', type: '基础通货', count: alchemyShards, desc: '通过分解多余卡牌或炼金炉转化获得。' },
    { id: 'mat_gem', name: '魔晶石', icon: '💎', type: '核心能量', count: alchemyEssence, desc: '远征深渊与击败塔顶首领的珍贵结晶。' },
    { id: 'mat_scroll', name: '残破卷轴', icon: '📜', type: '远征掉落', count: Math.floor(alchemyCraftCount * 1.5 + 2), desc: '上古秘术残页，蕴含无限构筑可能。' },
  ];

  // Split recipes into tier 2 (intermediate) and tier 3 (legendary core)
  const tier2Recipes = recipes.slice(0, 3);
  const tier3Recipes = recipes.slice(3);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="text-xs text-slate-300 pixel-panel-gold p-3.5 flex items-center justify-between border border-amber-500/40 shadow-lg">
        <div>
          <div className="font-black text-amber-300 text-sm flex items-center gap-2">
            <span>⚡ 交互式上古合成树图谱</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              SVG 动态链路引擎
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            点击任意节点可查看详细配方、聚焦合成路径。已点亮节点绽放光辉，未解锁节点受法术结界庇护。
          </p>
        </div>
        <div className="font-mono text-xs text-amber-400 bg-slate-950 px-3 py-1.5 border border-amber-500/50 rounded shadow-inner flex items-center gap-2">
          <span>连通度:</span>
          <span className="text-amber-200 font-bold">{discoveredRecipes.length} / {recipes.length}</span>
        </div>
      </div>

      {/* Main Interactive SVG Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SVG Canvas Tree (2 Cols) */}
        <div className="lg:col-span-2 p-4 bg-slate-950 border-2 border-slate-800 rounded-lg relative overflow-hidden min-h-[520px] flex flex-col items-center justify-between shadow-[inset_0_0_30px_rgba(0,0,0,0.9)]">
          {/* Background Grid Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

          {/* SVG Connecting Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="goldFlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Connecting lines from Base Materials (Layer 1) to Tier 2 Recipes */}
            {tier2Recipes.map((_, idx) => {
              const startX = 85 + idx * 160;
              const startY = 85;
              const endX = 110 + idx * 175;
              const endY = 220;
              const isFocused = selectedNodeId === tier2Recipes[idx].id || hoveredNodeId === tier2Recipes[idx].id;
              const isDisc = discoveredRecipes.includes(tier2Recipes[idx].id);

              return (
                <g key={`path-t1-t2-${idx}`}>
                  <path
                    d={`M ${startX} ${startY} C ${startX} ${startY + 65}, ${endX} ${endY - 65}, ${endX} ${endY}`}
                    stroke={isFocused ? '#fde047' : isDisc ? '#fbbf24' : '#334155'}
                    strokeWidth={isFocused ? 3.5 : 2}
                    strokeDasharray={isDisc ? 'none' : '4,4'}
                    fill="none"
                    filter={isFocused ? 'url(#glow)' : undefined}
                    className={isDisc ? 'transition-all duration-300' : 'opacity-40'}
                  />
                  {/* Energy particle flow on discovered nodes */}
                  {isDisc && (
                    <circle r="3" fill="#fef08a" filter="url(#glow)">
                      <animateMotion
                        dur={`${2.2 + idx * 0.4}s`}
                        repeatCount="indefinite"
                        path={`M ${startX} ${startY} C ${startX} ${startY + 65}, ${endX} ${endY - 65}, ${endX} ${endY}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Connecting lines from Tier 2 Recipes to Tier 3 Legendary Cores */}
            {tier3Recipes.map((tier3, idx) => {
              const parentIdx = idx % tier2Recipes.length;
              const startX = 110 + parentIdx * 175;
              const startY = 290;
              const endX = 150 + idx * 210;
              const endY = 430;
              const isFocused = selectedNodeId === tier3.id || hoveredNodeId === tier3.id;
              const isDisc = discoveredRecipes.includes(tier3.id);

              return (
                <g key={`path-t2-t3-${idx}`}>
                  <path
                    d={`M ${startX} ${startY} C ${startX} ${startY + 70}, ${endX} ${endY - 70}, ${endX} ${endY}`}
                    stroke={isFocused ? '#fde047' : isDisc ? '#f59e0b' : '#1e293b'}
                    strokeWidth={isFocused ? 4 : 2}
                    strokeDasharray={isDisc ? 'none' : '5,5'}
                    fill="none"
                    filter={isFocused ? 'url(#glow)' : undefined}
                  />
                  {isDisc && (
                    <circle r="3.5" fill="#fef08a" filter="url(#glow)">
                      <animateMotion
                        dur="2.8s"
                        repeatCount="indefinite"
                        path={`M ${startX} ${startY} C ${startX} ${startY + 70}, ${endX} ${endY - 70}, ${endX} ${endY}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* LAYER 1: Base Materials */}
          <div className="relative z-10 w-full flex justify-around items-center px-6 pt-2">
            {baseMaterials.map((mat) => {
              const isSelected = selectedNodeId === mat.id;
              return (
                <div
                  key={mat.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedNodeId(mat.id);
                  }}
                  onMouseEnter={() => setHoveredNodeId(mat.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className={`group cursor-pointer flex flex-col items-center p-2 rounded-lg transition transform hover:scale-110 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                      : 'bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-900 border border-cyan-500/60 flex items-center justify-center text-2xl shadow-inner animate-pulse">
                    {mat.icon}
                  </div>
                  <span className="text-xs font-bold text-cyan-300 mt-1">{mat.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">数量: {mat.count}</span>
                </div>
              );
            })}
          </div>

          {/* LAYER 2: Intermediate Recipes */}
          <div className="relative z-10 w-full flex justify-center gap-6 py-2">
            {tier2Recipes.map((recipe) => {
              const isDiscovered = discoveredRecipes.includes(recipe.id);
              const isSelected = selectedNodeId === recipe.id;

              return (
                <div
                  key={recipe.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedNodeId(recipe.id);
                  }}
                  onMouseEnter={() => setHoveredNodeId(recipe.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className={`relative cursor-pointer w-36 p-3 rounded-lg border flex flex-col items-center text-center transition transform hover:scale-105 ${
                    isSelected
                      ? 'bg-slate-900 border-2 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.6)] scale-105'
                      : isDiscovered
                      ? 'bg-slate-900/90 border-amber-500/80 text-amber-200 shadow-[0_4px_15px_rgba(0,0,0,0.8)]'
                      : 'bg-slate-950/70 border-slate-800 text-slate-500'
                  }`}
                >
                  {/* Unlocked / Locked semi-transparent mask for un-discovered */}
                  {!isDiscovered && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center z-20 border border-slate-700/50">
                      <span className="text-xl mb-1">🔒</span>
                      <span className="text-[10px] font-bold text-slate-400">未感应锁定</span>
                    </div>
                  )}

                  <span className="text-2xl mb-1 p-1.5 bg-slate-950 rounded border border-slate-700 shadow-inner">
                    {recipe.icon}
                  </span>
                  <span className="text-xs font-black truncate w-full">{recipe.name}</span>
                  <span className="text-[10px] font-mono text-amber-400 mt-0.5">{recipe.cost} 💎</span>
                  <span
                    className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-bold ${
                      isDiscovered
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {isDiscovered ? '✓ 已连通' : '待合成'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* LAYER 3: Legendary Core Artifacts */}
          <div className="relative z-10 w-full flex justify-center gap-6 pb-2">
            {tier3Recipes.map((recipe) => {
              const isDiscovered = discoveredRecipes.includes(recipe.id);
              const isSelected = selectedNodeId === recipe.id;

              return (
                <div
                  key={recipe.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedNodeId(recipe.id);
                  }}
                  onMouseEnter={() => setHoveredNodeId(recipe.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className={`relative cursor-pointer w-40 p-3 rounded-lg border flex flex-col items-center text-center transition transform hover:scale-105 ${
                    isSelected
                      ? 'bg-amber-950/90 border-2 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.8)] scale-105'
                      : isDiscovered
                      ? 'bg-gradient-to-b from-amber-950/90 to-slate-950 border-amber-300 text-amber-100 shadow-[0_4px_20px_rgba(0,0,0,0.9)]'
                      : 'bg-slate-950/80 border-slate-800 text-slate-600'
                  }`}
                >
                  {/* Unlocked / Locked semi-transparent mask for un-discovered */}
                  {!isDiscovered && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] rounded-lg flex flex-col items-center justify-center z-20 border border-slate-800">
                      <span className="text-2xl mb-1">🔒</span>
                      <span className="text-[10px] font-bold text-amber-500/80">传说封印</span>
                    </div>
                  )}

                  <div className="absolute -top-2.5 px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded uppercase shadow">
                    传说核心
                  </div>

                  <span className="text-3xl mb-1 p-1.5 bg-slate-900 rounded border border-amber-500/50 shadow-inner">
                    {isDiscovered ? recipe.icon : '❓'}
                  </span>
                  <span className="text-xs font-black truncate w-full">
                    {isDiscovered ? recipe.name : '？？？ 隐藏核心'}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 mt-0.5">{recipe.cost} 💎</span>
                  <span
                    className={`text-[9px] mt-1 px-1.5 py-0.5 rounded font-bold ${
                      isDiscovered
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {isDiscovered ? '🌟 完美掌握' : '🔒 待图鉴参悟'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Inspection & Details Panel */}
        <div className="pixel-panel p-4 flex flex-col justify-between space-y-4 border border-amber-500/40">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
              <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>📜</span> 节点参悟与合成指引
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 border border-cyan-500/30">
                {selectedRecipe ? selectedRecipe.category : '基础模块'}
              </span>
            </div>

            {selectedRecipe ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-slate-900/90 p-3 rounded border border-slate-700">
                  <div className="w-14 h-14 rounded bg-slate-950 border-2 border-amber-400/80 flex items-center justify-center text-3xl shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                    {isSelectedDiscovered ? selectedRecipe.icon : selectedRecipe.icon ? '✨' : selectedRecipe.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-amber-200">
                      {isSelectedDiscovered ? selectedRecipe.name : selectedRecipe.name || '基础原料节点'}
                    </h4>
                    <p className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                      消耗成本: {selectedRecipe.cost || 0} 💎
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    <span className="font-bold text-amber-300">效果说明：</span>
                    {isSelectedDiscovered ? selectedRecipe.desc : selectedRecipe.fuzzyHint}
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-800 pt-2">
                    <span className="font-bold text-cyan-300">连携增益：</span>
                    {selectedRecipe.bonusEffect || '携带同流派卡牌时激活额外暴击或法术穿透。'}
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded border border-slate-700 space-y-1.5">
                  <div className="text-[10px] text-amber-300 font-bold uppercase">合成所需低级材料：</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecipe.materials?.map((mat, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-950 text-cyan-300 border border-cyan-500/30 rounded">
                        • {mat}
                      </span>
                    )) || (
                      <span className="text-[10px] text-slate-400">基础通货，无需前置合成。</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12 text-xs">
                点击左侧任意合成树节点查看详情与路径指引。
              </div>
            )}
          </div>

          {/* Action Button */}
          <div>
            {selectedRecipe && !['mat_fragment', 'mat_gem', 'mat_scroll'].includes(selectedRecipe.id) && (
              <button
                disabled={!isSelectedDiscovered && alchemyEssence < selectedRecipe.cost}
                onClick={() => {
                  sound.playClick();
                  if (isSelectedDiscovered) {
                    onCraftRecipe(selectedRecipe.id);
                  } else {
                    onUnlockRecipe(selectedRecipe.id);
                  }
                }}
                className={`w-full py-2.5 px-4 rounded text-xs font-black shadow-lg transition transform active:scale-95 ${
                  isSelectedDiscovered
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-200'
                    : alchemyEssence >= selectedRecipe.cost
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border border-cyan-300'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isSelectedDiscovered
                  ? '✨ 再次锻造此核心战利品'
                  : alchemyEssence >= selectedRecipe.cost
                  ? `⚡ 参悟解锁此配方 (${selectedRecipe.cost} 💎)`
                  : '🔒 魔晶石不足无法参悟'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
