import React, { useState, useEffect } from 'react';
import CardComponent from './components/CardComponent';
import ErrorBoundary from './components/ErrorBoundary';
import GameArea from './components/GameArea';
import {
  CardPixelArt,
  CharacterSprite,
  EnemySprite,
  ParticleCanvas,
  RelicPixelArt,
  ScreenTransitionOverlay,
  SpireStormBackdrop,
  VfxBurst,
} from './components/PixelSprites';
import {
  ALL_CARDS,
  CHARACTER_CLASSES,
  getStarterDeck,
  instantiateCard,
  RECOMMENDED_ARCHETYPE_COMBOS,
  RELICS_POOL,
} from './data/gameData';
import { ClassType, RunHistoryRecord } from './types/game';
import { sound } from './utils/sound';
import { AlchemyLab } from './components/alchemy/AlchemyLab';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'select' | 'compendium' | 'game'>('title');
  const [selectedClass, setSelectedClass] = useState<ClassType>('warrior');
  const [ascension, setAscension] = useState<number>(0);
  const [compendiumFilter, setCompendiumFilter] = useState<'all' | ClassType | 'neutral'>('all');
  const [selectedComboId, setSelectedComboId] = useState<string | null>('warrior_strength');
  const [onlyShowComboCards, setOnlyShowComboCards] = useState<boolean>(false);
  const [showUpgradedInCompendium, setShowUpgradedInCompendium] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [demoVfx, setDemoVfx] = useState<'slash' | 'fire' | 'poison' | null>(null);
  const [demoDamagePopup, setDemoDamagePopup] = useState<string | null>(null);

  const [runHistory, setRunHistory] = useState<RunHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pixel_spire_history_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    try {
      return localStorage.getItem('pixel_spire_player_name') || 'jiaoxue';
    } catch {
      return 'jiaoxue';
    }
  });
  const [editingPlayerName, setEditingPlayerName] = useState<boolean>(false);
  const [ascensionEnabled, setAscensionEnabled] = useState<boolean>(false);
  const [showDeckPreviewModal, setShowDeckPreviewModal] = useState<boolean>(false);
  const [activeTitleModal, setActiveTitleModal] = useState<
    'stats' | 'settings' | 'alchemy' | null
  >(null);
  const [statsTab, setStatsTab] = useState<'history' | 'achievements'>('history');
  const [selectedAchievement, setSelectedAchievement] = useState<{
    title: string;
    className: string;
    desc: string;
    reward: string;
    unlocked: boolean;
    icon: string;
  } | null>(null);

  const [alchemyEssence, setAlchemyEssence] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pixel_spire_alchemy_essence');
      return saved ? parseInt(saved, 10) : 150;
    } catch {
      return 150;
    }
  });

  const [craftedArchive, setCraftedArchive] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pixel_spire_alchemy_archive');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCraftingAnimation, setIsCraftingAnimation] = useState<boolean>(false);
  const [craftingPopupItem, setCraftingPopupItem] = useState<{
    title: string;
    desc: string;
    icon: string;
    type: string;
  } | null>(null);

  const [alchemySubTab, setAlchemySubTab] = useState<'craft' | 'furnace' | 'codex' | 'lab' | 'tree'>('craft');
  const [alchemyShards, setAlchemyShards] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pixel_spire_alchemy_shards');
      return saved ? parseInt(saved, 10) : 80;
    } catch {
      return 80;
    }
  });
  const [alchemyCraftCount, setAlchemyCraftCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pixel_spire_alchemy_craft_count');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [labPerks, setLabPerks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('pixel_spire_lab_perks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [discoveredRecipes, setDiscoveredRecipes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pixel_spire_discovered_recipes');
      return saved ? JSON.parse(saved) : ['recipe_basic', 'recipe_elite', 'recipe_relic', 'recipe_potion'];
    } catch {
      return ['recipe_basic', 'recipe_elite', 'recipe_relic', 'recipe_potion'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pixel_spire_discovered_recipes', JSON.stringify(discoveredRecipes));
      localStorage.setItem('pixel_spire_alchemy_essence', alchemyEssence.toString());
      localStorage.setItem('pixel_spire_alchemy_shards', alchemyShards.toString());
      localStorage.setItem('pixel_spire_alchemy_craft_count', alchemyCraftCount.toString());
      localStorage.setItem('pixel_spire_lab_perks', JSON.stringify(labPerks));
    } catch {}
  }, [discoveredRecipes, alchemyEssence, alchemyShards, alchemyCraftCount, labPerks]);

  const ALL_ALCHEMY_RECIPES = [
    {
      id: 'recipe_basic',
      name: '基础重组配方',
      icon: '🧪',
      cost: 40,
      desc: '重组低级碎片，产出1张精良随机卡牌与30金币。',
      rewardTitle: '精良战技卡牌',
      rewardDesc: '获得一张随机职业精良级卡牌 + 30 金币奖励！',
      isSecret: false,
    },
    {
      id: 'recipe_elite',
      name: '精英秘典萃取',
      icon: '📖',
      cost: 100,
      desc: '萃取深渊精英之力，产出1张职业核心高阶战技卡牌。',
      rewardTitle: '精英核心秘典',
      rewardDesc: '解锁并掌握一张高阶流派核心卡牌！',
      isSecret: false,
    },
    {
      id: 'recipe_relic',
      name: '远古遗物铸造',
      icon: '👑',
      cost: 250,
      desc: '凝聚魔塔禁忌力量，铸造随机传说级强力远古遗物。',
      rewardTitle: '远古传说遗物',
      rewardDesc: '获得永久战力加成的魔塔远古传家宝遗物！',
      isSecret: false,
    },
    {
      id: 'recipe_potion',
      name: '元素圣水补给',
      icon: '⚱️',
      cost: 30,
      desc: '炼制生命之泉精华，为下一次远征提供圣水补给与祝福。',
      rewardTitle: '元素圣水与祝福',
      rewardDesc: '获得远征生命药水与金币补给包！',
      isSecret: false,
    },
    {
      id: 'recipe_secret_void',
      name: '虚空裂隙卷轴 (隐藏配方)',
      icon: '📜',
      cost: 350,
      desc: '以虚空风暴之力撕裂时空，合成全职业禁忌终结技与双倍魔晶石。',
      rewardTitle: '虚空禁忌卷轴',
      rewardDesc: '觉醒全职业隐藏终结技，战斗力突破极限！',
      isSecret: true,
      fuzzyHint: '？？？ (隐藏高级配方)：需在魔塔深渊累计合成达 3 次以上，并积累 350 点魔晶石方能感应其存在……',
    },
    {
      id: 'recipe_secret_king',
      name: '黄金王座圣杯 (隐藏配方)',
      icon: '🏆',
      cost: 500,
      desc: '铸造传说中的魔塔君王圣杯，赋予每局远征永久金币加成与神圣护盾。',
      rewardTitle: '君王不朽圣杯',
      rewardDesc: '获得魔塔至高君王祝福：初始自带圣盾与丰厚金币！',
      isSecret: true,
      fuzzyHint: '？？？ (隐藏稀有配方)：需达成任意职业通关成就，并在炼金工坊中成功完成基础与精英重组后解锁……',
    },
    {
      id: 'recipe_secret_dragon',
      name: '熔火龙心之核 (隐藏配方)',
      icon: '🔥',
      cost: 400,
      desc: '融合远古巨龙之怒，赋予攻击卡牌额外的群体烈焰灼烧伤害。',
      rewardTitle: '熔火龙心护符',
      rewardDesc: '每次出牌附带烈焰灼烧特效，横扫一切敌人！',
      isSecret: true,
      fuzzyHint: '？？？ (隐藏传奇配方)：相传需在炽热的火山关卡击败过火焰领主，且炼金工坊等级达到宗师方可窥其真容……',
    },
  ];

  useEffect(() => {
    try {
      localStorage.setItem('pixel_spire_alchemy_essence', alchemyEssence.toString());
    } catch {}
  }, [alchemyEssence]);

  useEffect(() => {
    try {
      localStorage.setItem('pixel_spire_alchemy_archive', JSON.stringify(craftedArchive));
    } catch {}
  }, [craftedArchive]);

  // Classic Slay-the-Spire 20-Level Ascension Descriptions
  const ASCENSION_DESCRIPTIONS: Record<number, string> = {
    0: '0. 标准尖塔远征模式（未开启进阶挑战）。',
    1: '1. 精英敌人出现得更加频繁。',
    2: '2. 普通敌人的伤害更高。',
    3: '3. 精英敌人的伤害更高。',
    4: '4. Boss敌人的伤害更高。',
    5: '5. Boss战后生命恢复减少。',
    6: '6. 开始远征时处于受伤状态（生命值 -10%）。',
    7: '7. 普通敌人的生命值更高。',
    8: '8. 精英敌人的生命值更高。',
    9: '9. Boss敌人的生命值更高。',
    10: '10. 进阶之灾：远征开始时牌组加入诅咒负担。',
    11: '11. 战斗奖励中的药水掉率降低。',
    12: '12. 强化卡牌出现的概率降低。',
    13: '13. Boss奖励的金币数量减少。',
    14: '14. 最大生命值上限略微降低。',
    15: '15. 随机叙事事件的选择风险更加严苛。',
    16: '16. 商店商品的价格上调 10%。',
    17: '17. 普通敌人拥有更凶猛的行动意图与连段。',
    18: '18. 精英敌人拥有更强大的狂暴增益。',
    19: '19. Boss二阶段狂暴觉醒获得额外力量与护甲。',
    20: '20. 双重首领决战：终焉王座的终极试炼。',
  };

  // Global Black Curtain Transition State
  const [screenTransition, setScreenTransition] = useState<{
    active: boolean;
    title: string;
    subtitle: string;
    iconType: string;
  }>({
    active: false,
    title: '',
    subtitle: '',
    iconType: 'sword',
  });

  const navigateWithCurtain = (
    target: 'title' | 'select' | 'compendium' | 'game',
    title: string,
    subtitle = '',
    iconType = 'sword'
  ) => {
    if (target === gameState && target !== 'game') return;
    sound.playClick();
    setScreenTransition({ active: true, title, subtitle, iconType });
    setTimeout(() => {
      setGameState(target);
    }, 240);
    setTimeout(() => {
      setScreenTransition((prev) => ({ ...prev, active: false }));
    }, 520);
  };

  const toggleMute = () => {
    sound.muted = !muted;
    setMuted(!muted);
  };

  const handleStartGame = (cls: ClassType) => {
    sound.playVictory();
    setSelectedClass(cls);
    const info = CHARACTER_CLASSES[cls];
    navigateWithCurtain(
      'game',
      `${info.name} · 踏入尖塔`,
      '',
      cls === 'warrior' ? 'heavy_blade' : cls === 'mage' ? 'arcane_eye' : 'dagger'
    );
  };

  const handleRecordRunEnd = (
    victory: boolean,
    floor: number,
    act: number,
    deckSize: number,
    relicCount: number
  ) => {
    const newRec: RunHistoryRecord = {
      id: Math.random().toString(36).slice(2, 9),
      date: new Date().toLocaleDateString('zh-CN'),
      playerClass: selectedClass,
      ascension: ascensionEnabled ? Math.max(1, ascension) : 0,
      reachedFloor: floor,
      reachedAct: act,
      victory,
      deckSize,
      relicCount,
    };
    const updated = [newRec, ...runHistory].slice(0, 12);
    setRunHistory(updated);
    try {
      localStorage.setItem('pixel_spire_history_v2', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const triggerSkillDemo = (cls: ClassType, customLabel?: string) => {
    if (cls === 'warrior') {
      sound.playAttack();
      setDemoVfx('slash');
      setDemoDamagePopup(customLabel || '⚔️ -46!');
    } else if (cls === 'mage') {
      sound.playPower();
      setDemoVfx('fire');
      setDemoDamagePopup(customLabel || '🔮 -42!');
    } else {
      sound.playAttack();
      setDemoVfx('poison');
      setDemoDamagePopup(customLabel || '🗡️ -48!');
    }
    setTimeout(() => {
      setDemoVfx(null);
      setDemoDamagePopup(null);
    }, 850);
  };

  const activeClassInfo = CHARACTER_CLASSES[selectedClass];
  const starterRelic = RELICS_POOL.find((r) => r.id === activeClassInfo.starterRelicId);
  const starterDeckPreview = getStarterDeck(selectedClass);

  const highestFloor = runHistory.reduce((max, r) => Math.max(max, r.reachedFloor), 0);
  const totalVictories = runHistory.filter((r) => r.victory).length;

  const activeCombo =
    RECOMMENDED_ARCHETYPE_COMBOS.find((c) => c.id === selectedComboId) || null;

  const filteredCompendiumCards = ALL_CARDS.filter((c) => {
    if (c.classType === 'token') return false;
    const passClass =
      compendiumFilter === 'all' ? true : c.classType === compendiumFilter;
    if (!passClass) return false;
    if (onlyShowComboCards && activeCombo) {
      return (
        activeCombo.coreCardIds.includes(c.id) ||
        activeCombo.supportCardIds.includes(c.id)
      );
    }
    return true;
  }).sort((a, b) => {
    if (!activeCombo) return 0;
    const rank = (cardId: string) =>
      activeCombo.coreCardIds.includes(cardId)
        ? 0
        : activeCombo.supportCardIds.includes(cardId)
        ? 1
        : 2;
    return rank(a.id) - rank(b.id);
  });

  // Our Game's 3 Playable Hero Classes Display Data
  const stsHeroMeta: Record<
    ClassType,
    {
      stsName: string;
      loreLine1: string;
      loreLine2: string;
      relicName: string;
      relicPrefix: string;
      relicNumber: string;
      relicSuffix: string;
      portraitImg: string;
      bgGradient: string;
      accentGlow: string;
    }
  > = {
    warrior: {
      stsName: CHARACTER_CLASSES.warrior.name,
      loreLine1: '不屈铁甲军团的传奇剑圣。',
      loreLine2: '在浴血搏杀中凝聚剑意，以狂暴力量粉碎高塔强敌。',
      relicName: starterRelic?.name || '燃烧之血',
      relicPrefix: '在每场战斗结束时，自动回复 ',
      relicNumber: '8',
      relicSuffix: ' 点生命。',
      portraitImg: '/src/assets/images/warrior_avatar_1791767701481.jpg',
      bgGradient:
        'radial-gradient(circle at 38% 42%, rgba(165, 28, 20, 0.72) 0%, rgba(75, 10, 10, 0.88) 45%, rgba(6, 4, 8, 0.98) 85%)',
      accentGlow: 'rgba(239, 68, 68, 0.55)',
    },
    assassin: {
      stsName: CHARACTER_CLASSES.assassin.name,
      loreLine1: '潜行于暗影迷雾中的致命刺客。',
      loreLine2: '擅长以零费飞刀连击与剧毒催化将猎物无声抹杀。',
      relicName: starterRelic?.name || '暗影指环',
      relicPrefix: '在每场战斗开始时，额外抽取 ',
      relicNumber: '2',
      relicSuffix: ' 张牌并获 1 连击点。',
      portraitImg: '/src/assets/images/assassin_avatar_hd_1791769529332.jpg',
      bgGradient:
        'radial-gradient(circle at 38% 42%, rgba(16, 115, 68, 0.65) 0%, rgba(8, 48, 32, 0.9) 45%, rgba(4, 8, 6, 0.98) 85%)',
      accentGlow: 'rgba(16, 185, 129, 0.55)',
    },
    mage: {
      stsName: CHARACTER_CLASSES.mage.name,
      loreLine1: '掌控元素法则的星界秘法学者。',
      loreLine2: '通过引导烈焰、寒霜、雷霆与暗影法球释放毁灭共鸣。',
      relicName: starterRelic?.name || '奥术核心',
      relicPrefix: '在每场战斗开始时，自动生成 ',
      relicNumber: '1',
      relicSuffix: ' 枚闪电充能球。',
      portraitImg: '/src/assets/images/mage_avatar_1791767724266.jpg',
      bgGradient:
        'radial-gradient(circle at 38% 42%, rgba(20, 95, 160, 0.68) 0%, rgba(10, 35, 75, 0.9) 45%, rgba(4, 6, 14, 0.98) 85%)',
      accentGlow: 'rgba(56, 189, 248, 0.55)',
    },
  };

  const currentStsHero = stsHeroMeta[selectedClass];
  const effectiveAscension = ascensionEnabled ? Math.max(1, ascension || 1) : 0;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col select-none relative overflow-x-hidden">
      {/* 全局黑幕渐入渐出过场 */}
      <ScreenTransitionOverlay
        active={screenTransition.active}
        title={screenTransition.title}
        subtitle={screenTransition.subtitle}
        iconType={screenTransition.iconType}
      />

      {/* ==================== 1. 开始游戏主界面 (丰富主封面特效：动态云海+塔顶雷暴金涡+魂火粒子交互+3D立体金字) ==================== */}
      {gameState === 'title' && (
        <div className="relative flex-1 min-h-screen w-full overflow-hidden flex flex-col justify-between">
          {/* 全景动态尖塔风暴云海 + 体积圣光 + 雷电裂隙 + 110粒子交互画布 */}
          <SpireStormBackdrop variant="title" />

          {/* 顶部左侧：玩家档案石刻徽章 (jiaoxue / 点击编辑) + 右上角音效控制 */}
          <div className="relative z-20 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5 group">
              {/* 尖塔石质浮雕徽章 */}
              <div
                onClick={() => {
                  sound.playClick();
                  setEditingPlayerName(true);
                }}
                className="w-12 h-13 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 border-2 border-amber-400/80 rounded-b-xl flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.4)] cursor-pointer hover:scale-105 hover:border-yellow-300 transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-slate-950 stroke-amber-300 stroke-[1.6] drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                  <polygon points="12,2 16,9 12,15 8,9" />
                  <polygon points="6,13 9,17 6,21 3,17" />
                  <polygon points="18,13 21,17 18,21 15,17" />
                </svg>
              </div>

              {editingPlayerName ? (
                <div className="flex items-center gap-1.5 bg-slate-950/95 border-2 border-amber-400 px-2.5 py-1 shadow-[0_0_16px_rgba(251,191,36,0.4)]">
                  <input
                    type="text"
                    value={playerName}
                    maxLength={14}
                    autoFocus
                    onChange={(e) => setPlayerName(e.target.value)}
                    onBlur={() => {
                      setEditingPlayerName(false);
                      try {
                        localStorage.setItem(
                          'pixel_spire_player_name',
                          playerName.trim() || 'jiaoxue'
                        );
                      } catch {
                        // ignore
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingPlayerName(false);
                        try {
                          localStorage.setItem(
                            'pixel_spire_player_name',
                            playerName.trim() || 'jiaoxue'
                          );
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    className="w-28 bg-transparent text-amber-300 font-bold text-sm focus:outline-none"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setEditingPlayerName(true);
                  }}
                  className="text-left cursor-pointer"
                >
                  <div className="text-base font-black text-amber-300 tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]">
                    {playerName || 'jiaoxue'}
                  </div>
                  <div className="text-xs font-bold text-sky-300/90 group-hover:text-sky-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]">
                    点击编辑
                  </div>
                </button>
              )}
            </div>

            {/* 右上角静音小开关 */}
            <button
              type="button"
              onClick={toggleMute}
              className="px-3.5 py-1.5 pixel-btn-slate text-xs font-black text-amber-200 cursor-pointer flex items-center gap-1.5"
            >
              <span>{muted ? '🔇 静音' : '🔊 音效'}</span>
            </button>
          </div>

          {/* 画面正中央：纯中文金色立体艺术主标题 Logo「像素尖塔」(带法阵背光、悬浮黄晶与动态摇曳幽蓝魂火) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative flex flex-col items-center select-none -mt-6 animate-float-slow">
              {/* 标题背后：暗金与幽蓝双层呼吸星芒法阵光晕 */}
              <div
                className="absolute -inset-x-24 -inset-y-14 rounded-full blur-2xl opacity-75 animate-pulse-glow"
                style={{
                  background:
                    'radial-gradient(circle, rgba(251,191,36,0.32) 0%, rgba(56,189,248,0.18) 48%, transparent 75%)',
                }}
              />

              {/* 标题背后：精细几何星盘剑纹装饰 */}
              <svg
                viewBox="0 0 500 260"
                className="absolute -inset-x-20 -inset-y-8 w-[calc(100%+160px)] h-[calc(100%+64px)] opacity-55"
              >
                <defs>
                  <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
                    <stop offset="50%" stopColor="#fde047" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* 贯穿水平金芒线 */}
                <line x1="10" y1="130" x2="490" y2="130" stroke="url(#crestGold)" strokeWidth="2.5" />
                <polygon points="250,8 262,130 250,252 238,130" fill="#fde047" opacity="0.28" />
                <circle
                  cx="250"
                  cy="130"
                  r="102"
                  fill="none"
                  stroke="#fde047"
                  strokeWidth="1.5"
                  strokeDasharray="10 8"
                  opacity="0.45"
                />
                <circle
                  cx="250"
                  cy="130"
                  r="76"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeDasharray="6 10"
                  opacity="0.4"
                />
              </svg>

              {/* 英文名字大字：MAOTA，下方魔塔小字 */}
              <div className="flex flex-col items-center relative z-10">
                <span
                  className="text-7xl sm:text-8xl md:text-[120px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-50 via-amber-300 to-amber-600 uppercase"
                  style={{
                    filter:
                      'drop-shadow(0 5px 0 #1c1917) drop-shadow(0 -2.5px 0 #1c1917) drop-shadow(4px 0 0 #1c1917) drop-shadow(-4px 0 0 #1c1917) drop-shadow(0 14px 28px rgba(0,0,0,0.92)) drop-shadow(0 0 22px rgba(251,191,36,0.45))',
                  }}
                >
                  MAOTA
                </span>
                <span
                  className="text-xl sm:text-2xl font-bold tracking-[0.4em] text-amber-200/90 mt-1 uppercase"
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 10px rgba(251,191,36,0.5)',
                  }}
                >
                  魔塔
                </span>
              </div>
            </div>
          </div>

          {/* 左下角：纵向燕尾绸带暗金主菜单 (悬停展开红金燕尾底衬与圣剑金芒) */}
          <div className="relative z-20 pl-8 sm:pl-14 md:pl-22 pb-14 pt-24 flex flex-col items-start gap-2.5">
            {[
              {
                label: '开始游戏',
                onClick: () =>
                  navigateWithCurtain('select', '选择登塔英雄', '', 'heavy_blade'),
              },
              {
                label: '百科大全',
                onClick: () =>
                  navigateWithCurtain(
                    'compendium',
                    '百科大全 · 卡牌图鉴与流派推荐',
                    '',
                    'scroll'
                  ),
              },
              {
                label: '推荐流派',
                onClick: () => {
                  setOnlyShowComboCards(true);
                  navigateWithCurtain(
                    'compendium',
                    '三大职业 · 推荐流派构筑组合',
                    '',
                    'scroll'
                  );
                },
              },
              {
                label: '炼金工坊',
                onClick: () => {
                  sound.playClick();
                  setActiveTitleModal('alchemy');
                },
              },
              {
                label: '统计内容',
                onClick: () => {
                  sound.playClick();
                  setActiveTitleModal('stats');
                },
              },
              {
                label: '设定',
                onClick: () => {
                  sound.playClick();
                  setActiveTitleModal('settings');
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onMouseEnter={() => sound.playHover()}
                onClick={item.onClick}
                className="group relative flex items-center gap-3 pl-4 pr-12 py-1.5 text-xl sm:text-2xl font-black text-slate-100 hover:text-amber-200 tracking-wider transition-all duration-150 hover:translate-x-3 cursor-pointer"
                style={{
                  textShadow:
                    '0 2px 0 #000, 0 -2px 0 #000, 2px 0 0 #000, -2px 0 0 #000, 0 4px 12px rgba(0,0,0,0.95)',
                }}
              >
                {/* 悬停浮现的燕尾暗红金边绸带底衬 */}
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none spire-ribbon-crimson"
                />
                <span className="relative z-10 w-4 text-amber-300 text-base opacity-0 group-hover:opacity-100 transition-all drop-shadow-[0_0_8px_#fde047]">
                  ⚔
                </span>
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 主菜单附加弹窗：统计内容 / 设定 */}
          {activeTitleModal && (
            <div
              onClick={() => setActiveTitleModal(null)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl pixel-panel-gold p-6 space-y-4 text-slate-100"
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h3 className="text-xl font-black text-amber-300">
                    {activeTitleModal === 'stats'
                      ? '📊 统计内容 · 远征战绩档案'
                      : activeTitleModal === 'alchemy'
                      ? '⚗️ 炼金工坊 · 元素重组与遗物铸造'
                      : '⚙️ 游戏设定'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTitleModal(null)}
                    className="px-3 py-1 bg-red-900 hover:bg-red-800 border border-red-400 text-xs font-black cursor-pointer"
                  >
                    ✕ 关闭
                  </button>
                </div>

                {activeTitleModal === 'stats' && (
                  <div className="space-y-4">
                    {/* 标签页切换：战绩档案 vs 职业成就 */}
                    <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                      <button
                        type="button"
                        onClick={() => { sound.playClick(); setStatsTab('history'); }}
                        className={`px-3 py-1 text-xs font-black border cursor-pointer transition ${
                          statsTab === 'history'
                            ? 'bg-amber-400 text-slate-950 border-white'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        📊 远征战绩档案
                      </button>
                      <button
                        type="button"
                        onClick={() => { sound.playClick(); setStatsTab('achievements'); }}
                        className={`px-3 py-1 text-xs font-black border cursor-pointer transition ${
                          statsTab === 'achievements'
                            ? 'bg-amber-400 text-slate-950 border-white'
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        🏆 职业成就勋章
                      </button>
                    </div>

                    {statsTab === 'history' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 bg-slate-950 border border-slate-700">
                            <div className="text-xs text-slate-400">总远征场次</div>
                            <div className="text-2xl font-black text-amber-300 font-mono">
                              {runHistory.length}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-950 border border-slate-700">
                            <div className="text-xs text-slate-400">累计通关次数</div>
                            <div className="text-2xl font-black text-emerald-400 font-mono">
                              {totalVictories}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-950 border border-slate-700">
                            <div className="text-xs text-slate-400">最高抵达层数</div>
                            <div className="text-2xl font-black text-cyan-300 font-mono">
                              {highestFloor} / 45F
                            </div>
                          </div>
                        </div>
                        {runHistory.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950 border border-slate-800">
                            暂无历史攀登记录，点击「开始游戏」踏入魔塔吧！
                          </div>
                        ) : (
                          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                            {runHistory.map((r) => (
                              <div
                                key={r.id}
                                className="p-2.5 bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                              >
                                <span className="font-black text-amber-300">
                                  {CHARACTER_CLASSES[r.playerClass]?.name || r.playerClass} · 进阶{r.ascension}
                                </span>
                                <span className="text-slate-300 font-mono">
                                  第{r.reachedAct}幕 · {r.reachedFloor}F (套牌{r.deckSize}张)
                                </span>
                                <span
                                  className={`font-black ${
                                    r.victory ? 'text-emerald-400' : 'text-red-400'
                                  }`}
                                >
                                  {r.victory ? '🏆 通关' : '💀 陨落'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {statsTab === 'achievements' && (
                      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                        {(['warrior', 'mage', 'assassin'] as ClassType[]).map((cls) => {
                          const clsInfo = CHARACTER_CLASSES[cls];
                          const clsRuns = runHistory.filter((r) => r.playerClass === cls);
                          const clsVictories = clsRuns.filter((r) => r.victory).length;
                          const clsMaxFloor = clsRuns.reduce((m, r) => Math.max(m, r.reachedFloor), 0);

                          const achievements = [
                            {
                              id: `${cls}_pioneer`,
                              title: `${clsInfo.name} · 登塔先驱`,
                              icon: '🛡️',
                              unlocked: clsRuns.length >= 1,
                              desc: `首次使用【${clsInfo.name}】踏入魔塔开始远征。`,
                              reward: '解锁该职业基础成就勋章与特权徽记',
                            },
                            {
                              id: `${cls}_hunter`,
                              title: `${clsInfo.name} · 深渊猎手`,
                              icon: '⚔️',
                              unlocked: clsMaxFloor >= 6 || clsRuns.length >= 3,
                              desc: `使用【${clsInfo.name}】在远征中累计攀登至 6 层以上或游玩 3 次以上。`,
                              reward: '精通战技：初始套牌战力加成',
                            },
                            {
                              id: `${cls}_master`,
                              title: `${clsInfo.name} · 流派宗师`,
                              icon: '📖',
                              unlocked: clsVictories >= 1 || clsMaxFloor >= 15,
                              desc: `使用【${clsInfo.name}】成功达成核心流派成型并挺进至第 15 层。`,
                              reward: '奥术觉醒：高级专属卡牌解锁',
                            },
                            {
                              id: `${cls}_lord`,
                              title: `${clsInfo.name} · 魔塔主宰`,
                              icon: '👑',
                              unlocked: clsVictories >= 1,
                              desc: `使用【${clsInfo.name}】成功击败最终首领赢得魔塔远征胜利！`,
                              reward: '不朽传奇：魔塔至高荣耀王座',
                            },
                          ];

                          return (
                            <div key={cls} className="space-y-2 bg-slate-950/90 border border-slate-800 p-3">
                              <div className="flex items-center justify-between text-xs font-black text-amber-300 border-b border-slate-800 pb-1.5">
                                <span>{clsInfo.name} 职业成就</span>
                                <span className="font-mono text-[11px] text-slate-400">
                                  已达成: {achievements.filter((a) => a.unlocked).length} / {achievements.length}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {achievements.map((ach) => (
                                  <button
                                    key={ach.id}
                                    type="button"
                                    onClick={() => {
                                      sound.playClick();
                                      setSelectedAchievement({
                                        title: ach.title,
                                        className: clsInfo.name,
                                        desc: ach.desc,
                                        reward: ach.reward,
                                        unlocked: ach.unlocked,
                                        icon: ach.icon,
                                      });
                                    }}
                                    className={`p-2.5 border text-left flex items-center gap-2.5 cursor-pointer transition hover:scale-[1.02] relative overflow-hidden ${
                                      ach.unlocked
                                        ? 'bg-amber-950/40 border-amber-400/80 text-amber-200 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                                        : 'bg-slate-900/60 border-slate-700/60 text-slate-500 opacity-60'
                                    }`}
                                  >
                                    {ach.unlocked && (
                                      <>
                                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35">
                                          <div className="absolute -inset-full bg-gradient-to-r from-transparent via-amber-200/80 to-transparent animate-gold-shimmer" />
                                        </div>
                                        <div className="absolute -top-6 -right-6 w-12 h-12 bg-amber-400/20 rounded-full blur-md animate-pulse pointer-events-none" />
                                      </>
                                    )}
                                    <span className="text-xl p-1 bg-black/40 border border-current/30 rounded shrink-0 relative z-10">
                                      {ach.icon}
                                    </span>
                                    <div className="flex flex-col min-w-0 relative z-10">
                                      <span className="text-[11px] font-black truncate">
                                        {ach.title.split(' · ')[1]}
                                      </span>
                                      <span className={`text-[10px] font-bold ${ach.unlocked ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {ach.unlocked ? '✓ 已达成' : '🔒 未解锁'}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTitleModal === 'alchemy' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between border-b border-slate-700 pb-2 gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => { sound.playClick(); setAlchemySubTab('craft'); }}
                          className={`px-2.5 py-1 text-xs font-black border cursor-pointer transition ${
                            alchemySubTab === 'craft'
                              ? 'bg-amber-400 text-slate-950 border-white shadow-[0_2px_0_#000]'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                          }`}
                        >
                          ⚗️ 铸造舱
                        </button>
                        <button
                          type="button"
                          onClick={() => { sound.playClick(); setAlchemySubTab('furnace'); }}
                          className={`px-2.5 py-1 text-xs font-black border cursor-pointer transition ${
                            alchemySubTab === 'furnace'
                              ? 'bg-amber-400 text-slate-950 border-white shadow-[0_2px_0_#000]'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                          }`}
                        >
                          ♻️ 熔炉
                        </button>
                        <button
                          type="button"
                          onClick={() => { sound.playClick(); setAlchemySubTab('codex'); }}
                          className={`px-2.5 py-1 text-xs font-black border cursor-pointer transition ${
                            alchemySubTab === 'codex'
                              ? 'bg-amber-400 text-slate-950 border-white shadow-[0_2px_0_#000]'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                          }`}
                        >
                          📖 图鉴 ({discoveredRecipes.length}/{ALL_ALCHEMY_RECIPES.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => { sound.playClick(); setAlchemySubTab('lab'); }}
                          className={`px-2.5 py-1 text-xs font-black border cursor-pointer transition ${
                            alchemySubTab === 'lab'
                              ? 'bg-amber-400 text-slate-950 border-white shadow-[0_2px_0_#000]'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                          }`}
                        >
                          🧪 研究所
                        </button>
                        <button
                          type="button"
                          onClick={() => { sound.playClick(); setAlchemySubTab('tree'); }}
                          className={`px-2.5 py-1 text-xs font-black border cursor-pointer transition ${
                            alchemySubTab === 'tree'
                              ? 'bg-amber-400 text-slate-950 border-white shadow-[0_2px_0_#000]'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50'
                          }`}
                        >
                          🌳 合成树
                        </button>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs bg-slate-950 px-2.5 py-1 border border-amber-500/40">
                        <span className="text-amber-300">💎 {alchemyEssence}</span>
                        <span className="text-slate-500">|</span>
                        <span className="text-cyan-300">🧪 {alchemyShards}</span>
                      </div>
                    </div>

                    {alchemySubTab === 'craft' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-slate-950 p-3 border border-amber-500/60 shadow-[0_4px_0_#000]">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl p-1 bg-amber-950/60 border border-amber-400 rounded">⚗️</span>
                            <div>
                              <div className="text-xs text-amber-300 font-bold">上古炼金铸造舱 · 熟练度 Lv.{Math.floor(alchemyCraftCount / 3) + 1}</div>
                              <div className="text-[11px] text-slate-300">已成功合成 {alchemyCraftCount} 件稀有战利品（每次合成消耗降低 2%）</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setAlchemySubTab('furnace');
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-[0_2px_0_#000]"
                          >
                            ➕ 前往熔炉补充资源
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                          {ALL_ALCHEMY_RECIPES.map((recipe) => {
                            const isDiscovered = discoveredRecipes.includes(recipe.id);
                            const discount = Math.floor(alchemyCraftCount * 2);
                            const finalCost = Math.max(20, Math.floor(recipe.cost * (1 - discount / 100)));
                            return (
                              <div
                                key={recipe.id}
                                className="p-3 bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-amber-400 transition shadow-[0_2px_0_#000]"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition pointer-events-none" />
                                <div className="flex items-start gap-2.5 relative z-10">
                                  <span className="text-2xl p-1.5 bg-slate-900 border border-amber-500/40 rounded">
                                    {recipe.icon}
                                  </span>
                                  <div className="space-y-1">
                                    <div className="text-xs font-black text-amber-300 flex items-center justify-between gap-2">
                                      <span>{recipe.name}</span>
                                      <span className="font-mono text-amber-400">{finalCost} 💎</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-tight">
                                      {isDiscovered ? recipe.desc : '🔒 未解锁秘方，可在图鉴或研究所中参悟发掘。'}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={alchemyEssence < finalCost}
                                  onClick={() => {
                                    if (alchemyEssence < finalCost) return;
                                    setAlchemyEssence((prev) => prev - finalCost);
                                    setAlchemyCraftCount((prev) => prev + 1);
                                    sound.playClick();
                                    setIsCraftingAnimation(true);
                                    setCraftedArchive((prev) => [recipe.rewardTitle, ...prev]);
                                    if (!discoveredRecipes.includes(recipe.id)) {
                                      setDiscoveredRecipes((prev) => [...prev, recipe.id]);
                                    }

                                    setTimeout(() => {
                                      setIsCraftingAnimation(false);
                                      sound.playUpgrade();
                                      setCraftingPopupItem({
                                        title: recipe.rewardTitle,
                                        desc: recipe.rewardDesc,
                                        icon: recipe.icon,
                                        type: recipe.name,
                                      });
                                    }, 1600);
                                  }}
                                  className={`w-full py-1.5 text-xs font-black cursor-pointer transition shadow-[0_2px_0_#000] relative z-10 ${
                                    alchemyEssence >= finalCost
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                  }`}
                                >
                                  {alchemyEssence >= finalCost ? '✨ 开始炼金铸造' : '🔒 魔晶石不足'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {alchemySubTab === 'furnace' && (
                      <div className="space-y-3">
                        <div className="text-xs text-slate-300 bg-slate-900/90 p-3 border border-slate-700 space-y-1">
                          <div className="font-black text-amber-300">♻️ 分解与元素熔炉说明</div>
                          <p>消耗远征残片或金币，通过高温炉火提炼出高纯度【魔晶石 (💎)】与【炼金残片 (🧪)】。</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between shadow-[0_2px_0_#000]">
                            <div className="space-y-1">
                              <div className="text-xs font-black text-amber-300">💎 提炼魔晶石</div>
                              <p className="text-[11px] text-slate-400">消耗 40 炼金残片，提炼出 50 枚魔晶石。</p>
                            </div>
                            <button
                              type="button"
                              disabled={alchemyShards < 40}
                              onClick={() => {
                                if (alchemyShards < 40) return;
                                setAlchemyShards((prev) => prev - 40);
                                setAlchemyEssence((prev) => prev + 50);
                                sound.playClick();
                              }}
                              className={`w-full py-2 text-xs font-black cursor-pointer shadow-[0_2px_0_#000] ${
                                alchemyShards >= 40 ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              ⚡ 提取魔晶石 (+50 💎)
                            </button>
                          </div>

                          <div className="p-4 bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between shadow-[0_2px_0_#000]">
                            <div className="space-y-1">
                              <div className="text-xs font-black text-cyan-300">🧪 残片聚能提纯</div>
                              <p className="text-[11px] text-slate-400">注入 30 枚魔晶石，聚能获得 45 枚炼金残片。</p>
                            </div>
                            <button
                              type="button"
                              disabled={alchemyEssence < 30}
                              onClick={() => {
                                if (alchemyEssence < 30) return;
                                setAlchemyEssence((prev) => prev - 30);
                                setAlchemyShards((prev) => prev + 45);
                                sound.playClick();
                              }}
                              className={`w-full py-2 text-xs font-black cursor-pointer shadow-[0_2px_0_#000] ${
                                alchemyEssence >= 30 ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              ✨ 聚能残片 (+45 🧪)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {alchemySubTab === 'codex' && (
                      <div className="space-y-3">
                        <div className="text-xs text-slate-300 bg-slate-900/90 p-2.5 border border-slate-700">
                          📖 配方图鉴：记录了魔塔流传至今的上古残片。未解锁的隐藏配方悬停可查看模糊提示。
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                          {ALL_ALCHEMY_RECIPES.map((recipe) => {
                            const isDiscovered = discoveredRecipes.includes(recipe.id);
                            return (
                              <div
                                key={recipe.id}
                                title={!isDiscovered ? recipe.fuzzyHint : undefined}
                                className={`p-3 border flex flex-col justify-between gap-3 relative transition shadow-[0_2px_0_#000] ${
                                  isDiscovered
                                    ? 'bg-slate-950 border-amber-500/70 text-slate-100'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-500'
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className={`text-2xl p-1.5 rounded border ${isDiscovered ? 'bg-amber-950/40 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                                    {isDiscovered ? recipe.icon : '❓'}
                                  </span>
                                  <div className="space-y-1">
                                    <div className="text-xs font-black flex items-center justify-between">
                                      <span className={isDiscovered ? 'text-amber-300' : 'text-slate-400'}>
                                        {isDiscovered ? recipe.name : '？？？ (隐藏秘方)'}
                                      </span>
                                      <span className="font-mono text-amber-400">{recipe.cost} 💎</span>
                                    </div>
                                    <p className={`text-[11px] leading-tight ${isDiscovered ? 'text-slate-300' : 'text-slate-500 italic'}`}>
                                      {isDiscovered ? recipe.desc : recipe.fuzzyHint}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 border ${isDiscovered ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                    {isDiscovered ? '✓ 已掌握' : '🔒 未解锁'}
                                  </span>
                                  {!isDiscovered && alchemyEssence >= recipe.cost && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAlchemyEssence((prev) => prev - recipe.cost);
                                        sound.playUpgrade();
                                        setDiscoveredRecipes((prev) => [...prev, recipe.id]);
                                        setCraftedArchive((prev) => [recipe.rewardTitle, ...prev]);
                                        setCraftingPopupItem({
                                          title: recipe.rewardTitle,
                                          desc: recipe.rewardDesc,
                                          icon: recipe.icon,
                                          type: recipe.name,
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] cursor-pointer shadow-[0_2px_0_#000]"
                                    >
                                      ⚡ 参悟解锁
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {alchemySubTab === 'lab' && (
                      <div className="space-y-3">
                        <div className="text-xs text-slate-300 bg-slate-900/90 p-3 border border-slate-700">
                          🧪 炼金研究所：研究上古秘术，永久提升远征时的炼金效率与战斗被动加成。
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: 'perk_resonance', name: '魔能共鸣增幅', desc: '所有炼金铸造成本永久降低 15%。', cost: 120, icon: '⚡' },
                            { id: 'perk_catalyst', name: '催化提取专家', desc: '分解提取获得的魔晶石数量额外 +50%。', cost: 150, icon: '💎' },
                          ].map((perk) => {
                            const unlocked = labPerks[perk.id];
                            return (
                              <div key={perk.id} className="p-3 bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3 shadow-[0_2px_0_#000]">
                                <div className="flex items-start gap-2.5">
                                  <span className="text-2xl p-1.5 bg-slate-900 border border-amber-500/40 rounded">{perk.icon}</span>
                                  <div className="space-y-1">
                                    <div className="text-xs font-black text-amber-300 flex items-center justify-between">
                                      <span>{perk.name}</span>
                                      <span className="font-mono text-amber-400">{perk.cost} 💎</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-tight">{perk.desc}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  disabled={unlocked || alchemyEssence < perk.cost}
                                  onClick={() => {
                                    if (unlocked || alchemyEssence < perk.cost) return;
                                    setAlchemyEssence((prev) => prev - perk.cost);
                                    setLabPerks((prev) => ({ ...prev, [perk.id]: true }));
                                    sound.playUpgrade();
                                  }}
                                  className={`w-full py-1.5 text-xs font-black cursor-pointer shadow-[0_2px_0_#000] ${
                                    unlocked
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 cursor-default'
                                      : alchemyEssence >= perk.cost
                                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                  }`}
                                >
                                  {unlocked ? '✓ 已激活研究所秘术' : alchemyEssence >= perk.cost ? '⚡ 研究激活' : '🔒 魔晶石不足'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {alchemySubTab === 'tree' && (
                      <AlchemyLab
                        recipes={ALL_ALCHEMY_RECIPES}
                        discoveredRecipes={discoveredRecipes}
                        alchemyEssence={alchemyEssence}
                        alchemyShards={alchemyShards}
                        alchemyCraftCount={alchemyCraftCount}
                        onCraftRecipe={(recipeId) => {
                          const recipe = ALL_ALCHEMY_RECIPES.find((r) => r.id === recipeId);
                          if (!recipe) return;
                          const discount = Math.floor(alchemyCraftCount * 2);
                          const finalCost = Math.max(20, Math.floor(recipe.cost * (1 - discount / 100)));
                          if (alchemyEssence < finalCost) return;
                          setAlchemyEssence((prev) => prev - finalCost);
                          setAlchemyCraftCount((prev) => prev + 1);
                          sound.playClick();
                          setIsCraftingAnimation(true);
                          setCraftedArchive((prev) => [recipe.rewardTitle, ...prev]);
                          if (!discoveredRecipes.includes(recipe.id)) {
                            setDiscoveredRecipes((prev) => [...prev, recipe.id]);
                          }
                          setTimeout(() => {
                            setIsCraftingAnimation(false);
                            sound.playUpgrade();
                            setCraftingPopupItem({
                              title: recipe.rewardTitle,
                              desc: recipe.rewardDesc,
                              icon: recipe.icon,
                              type: recipe.name,
                            });
                          }, 1600);
                        }}
                        onUnlockRecipe={(recipeId) => {
                          const recipe = ALL_ALCHEMY_RECIPES.find((r) => r.id === recipeId);
                          if (!recipe || alchemyEssence < recipe.cost) return;
                          setAlchemyEssence((prev) => prev - recipe.cost);
                          sound.playUpgrade();
                          setDiscoveredRecipes((prev) => [...prev, recipe.id]);
                          setCraftedArchive((prev) => [recipe.rewardTitle, ...prev]);
                          setCraftingPopupItem({
                            title: recipe.rewardTitle,
                            desc: recipe.rewardDesc,
                            icon: recipe.icon,
                            type: recipe.name,
                          });
                        }}
                        sound={sound}
                      />
                    )}
                  </div>
                )}

                {/* 成就详情弹窗 (当点击任意成就卡片时弹出) */}
                {selectedAchievement && (
                  <div
                    onClick={() => setSelectedAchievement(null)}
                    className="fixed inset-y-0 inset-x-0 z-60 bg-black/85 flex items-center justify-center p-4"
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-sm pixel-panel-gold p-6 space-y-4 text-slate-100 text-center flex flex-col items-center"
                    >
                      <div className="relative">
                        {selectedAchievement.unlocked && (
                          <div className="absolute inset-0 -m-4 rounded-full border-2 border-amber-400/60 animate-particle-burst pointer-events-none" />
                        )}
                        <div className="w-16 h-16 rounded-full bg-amber-950 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(251,191,36,0.5)] relative z-10">
                          {selectedAchievement.icon}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          {selectedAchievement.className} · 职业成就勋章
                        </div>
                        <h4 className="text-lg font-black text-yellow-300">
                          {selectedAchievement.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300 bg-slate-950 p-3 border border-slate-800 leading-relaxed w-full text-left">
                        📌 成就条件：{selectedAchievement.desc}
                      </p>
                      <p className="text-xs text-emerald-300 bg-emerald-950/40 p-2.5 border border-emerald-500/50 font-bold w-full text-left">
                        🎁 解锁奖励：{selectedAchievement.reward}
                      </p>
                      <div className="pt-2 flex items-center justify-between w-full">
                        <span className={`text-xs font-black px-2.5 py-1 border ${selectedAchievement.unlocked ? 'bg-emerald-950 border-emerald-400 text-emerald-300' : 'bg-slate-900 border-slate-600 text-slate-400'}`}>
                          {selectedAchievement.unlocked ? '✓ 状态：已达成解锁' : '🔒 状态：尚未达成'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedAchievement(null)}
                          className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-[0_3px_0_#000]"
                        >
                          确定
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTitleModal === 'settings' && (
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800">
                      <span>🔊 8-Bit 复古合成器音效</span>
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="px-4 py-1.5 pixel-btn-amber text-xs font-black text-slate-950 cursor-pointer"
                      >
                        {muted ? '已静音 (点击开启)' : '开启中 (点击静音)'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800">
                      <span>👤 远征冒险者名称</span>
                      <span className="font-mono font-bold text-amber-300">
                        {playerName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 2. 选择角色界面 (1:1 还原截图2 铁甲战士全屏立绘 + 底部四枚石刻徽章 + 进阶等级 + 返回/启程绸带) ==================== */}
      {gameState === 'select' && (
        <div
          className="relative flex-1 min-h-screen w-full overflow-hidden flex flex-col justify-between select-none"
          style={{ background: currentStsHero.bgGradient }}
        >
          {/* 1. 右侧大幅全屏英雄特写背景立绘 (65% 右侧区域大幅立绘 + 左侧深色渐变融合，1:1还原截图2构图) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              key={selectedClass}
              src={currentStsHero.portraitImg}
              alt={currentStsHero.stsName}
              className="absolute right-0 top-0 h-full w-full md:w-[74%] object-cover object-center scale-105 transition-all duration-500"
              referrerPolicy="no-referrer"
            />
            {/* 左侧暗黑渐变遮罩，让左侧文字区域如截图2一样深邃清晰，右侧自然过渡到巨幅角色面具/立绘 */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(5,4,8,0.97) 0%, rgba(18,7,9,0.88) 32%, rgba(45,10,12,0.35) 58%, rgba(0,0,0,0.08) 100%)',
              }}
            />
            {/* 上下边缘暗角 */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 22%, transparent 72%, rgba(0,0,0,0.82) 100%)',
              }}
            />
          </div>

          {/* 火星/奥术/翠毒飘升粒子特效 */}
          <ParticleCanvas
            theme={
              selectedClass === 'warrior'
                ? 'ember'
                : selectedClass === 'mage'
                ? 'arcane'
                : 'emerald'
            }
          />

          {/* 2. 左侧中部：英雄名称 + 生命/金币 + 两行背景描述 + 初始遗物 (严格按照截图2左侧排版，无杂乱背景框) */}
          <div className="relative z-20 my-auto pl-8 sm:pl-16 md:pl-28 pr-6 pt-12 pb-32 max-w-2xl flex flex-col items-start">
            {/* 角色大标题 (金色衬线体，如截图2「铁甲战士」) */}
            <h1
              className="text-5xl sm:text-6xl font-bold text-amber-300 tracking-wide mb-3"
              style={{
                textShadow: '0 4px 10px rgba(0,0,0,0.95), 0 2px 0 #000',
              }}
            >
              {currentStsHero.stsName}
            </h1>

            {/* 生命与金币行 (❤️ 生命: 80/80   💰 金币: 99) */}
            <div
              className="flex items-center gap-6 text-base sm:text-lg font-bold mb-5"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
            >
              <div className="flex items-center gap-1.5 text-red-400">
                <span className="text-lg">❤️</span>
                <span>
                  生命: {activeClassInfo.maxHp}/{activeClassInfo.maxHp}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-300">
                <span className="text-lg">💰</span>
                <span>金币: {activeClassInfo.startingGold}</span>
              </div>
            </div>

            {/* 角色两行背景介绍 */}
            <div
              className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed mb-6 space-y-0.5"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
            >
              <p>{currentStsHero.loreLine1}</p>
              <p>{currentStsHero.loreLine2}</p>
            </div>

            {/* 初始遗物展示 (左侧火焰/遗物图标 + 右侧两行文字，数值为天蓝色) */}
            {starterRelic && (
              <div
                className="flex items-start gap-3.5 mb-5"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
              >
                <div className="w-11 h-11 flex items-center justify-center shrink-0 drop-shadow-[0_0_10px_rgba(251,191,36,0.65)]">
                  <RelicPixelArt iconType={starterRelic.iconType} className="w-10 h-10" />
                </div>
                <div className="text-sm sm:text-base leading-snug">
                  <div className="font-bold text-amber-200">
                    {currentStsHero.relicName}
                  </div>
                  <div className="font-bold text-slate-100 mt-0.5">
                    {currentStsHero.relicPrefix}
                    <span className="text-sky-400 font-black">
                      {currentStsHero.relicNumber}
                    </span>
                    {currentStsHero.relicSuffix}
                  </div>
                </div>
              </div>
            )}

            {/* 轻量辅助按钮：预览初始套牌 / 查看职业推荐流派 (不破坏原版干净视觉，点击弹窗查看) */}
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowDeckPreviewModal(true);
                }}
                className="px-3 py-1 bg-black/55 hover:bg-black/80 border border-amber-400/50 hover:border-amber-300 text-xs font-bold text-amber-200 rounded transition cursor-pointer"
              >
                🃏 查看初始套牌 ({starterDeckPreview.length}张)
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setCompendiumFilter(selectedClass);
                  const firstCombo = RECOMMENDED_ARCHETYPE_COMBOS.find(
                    (c) => c.classType === selectedClass
                  );
                  setSelectedComboId(firstCombo ? firstCombo.id : 'warrior_strength');
                  navigateWithCurtain(
                    'compendium',
                    `${currentStsHero.stsName} · 推荐流派构筑`,
                    '',
                    'scroll'
                  );
                }}
                className="px-3 py-1 bg-black/55 hover:bg-black/80 border border-sky-400/50 hover:border-sky-300 text-xs font-bold text-sky-200 rounded transition cursor-pointer"
              >
                ✨ 查看推荐流派组合
              </button>
            </div>
          </div>

          {/* 3. 底部中央：三大真实可选职业石刻浮雕方块按钮 + 进阶等级切换栏 */}
          <div className="relative z-20 w-full pb-6 flex flex-col items-center gap-3">
            {/* 三枚方形石雕徽章按钮 (仅对应我们游戏真实存在的三大职业：狂怒铁卫 / 暗影刺客 / 星界秘法) */}
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              {(
                [
                  {
                    id: 'warrior',
                    title: CHARACTER_CLASSES.warrior.name,
                    cls: 'warrior' as ClassType,
                  },
                  {
                    id: 'assassin',
                    title: CHARACTER_CLASSES.assassin.name,
                    cls: 'assassin' as ClassType,
                  },
                  {
                    id: 'mage',
                    title: CHARACTER_CLASSES.mage.name,
                    cls: 'mage' as ClassType,
                  },
                ]
              ).map((tab) => {
                const isSelected = selectedClass === tab.cls;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    title={tab.title}
                    onMouseEnter={() => sound.playHover()}
                    onClick={() => {
                      sound.playClick();
                      setSelectedClass(tab.cls);
                    }}
                    className={`w-20 h-20 sm:w-24 sm:h-24 relative flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 scale-105 shadow-[0_0_25px_rgba(253,224,71,0.95),0_6px_14px_rgba(0,0,0,0.9)] ring-2 ring-yellow-200'
                        : 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 opacity-85 hover:opacity-100 hover:scale-105 shadow-[0_6px_14px_rgba(0,0,0,0.85)]'
                    }`}
                    style={{
                      borderTop: isSelected ? '5px solid #f8fafc' : '5px solid #94a3b8',
                      borderLeft: isSelected ? '5px solid #e2e8f0' : '5px solid #64748b',
                      borderRight: isSelected ? '5px solid #475569' : '5px solid #1e293b',
                      borderBottom: isSelected ? '5px solid #334155' : '5px solid #0f172a',
                    }}
                  >
                    {/* 石刻纹章 SVG */}
                    {tab.id === 'warrior' && (
                      <svg viewBox="0 0 64 64" className="w-14 h-14 fill-none stroke-slate-800 stroke-[3.5]">
                        <path d="M14,38 C16,20 30,12 46,16 C40,22 44,28 50,30 C44,36 38,48 22,48 C18,44 14,42 14,38 Z" />
                        <path d="M24,28 L38,24 L32,36 Z" fill="#1e293b" />
                        <path d="M18,24 L28,16 M22,44 L36,40" />
                      </svg>
                    )}
                    {tab.id === 'assassin' && (
                      <svg viewBox="0 0 64 64" className="w-14 h-14 fill-none stroke-slate-800 stroke-[3.5]">
                        <path d="M16,24 C12,14 22,12 28,20 L46,18 C52,24 48,38 38,44 L22,46 L16,38 Z" />
                        <circle cx="34" cy="28" r="3.5" fill="#1e293b" />
                        <path d="M22,46 L18,52 M30,45 L28,52 M38,44 L38,50" />
                      </svg>
                    )}
                    {tab.id === 'mage' && (
                      <svg viewBox="0 0 64 64" className="w-14 h-14 fill-none stroke-slate-800 stroke-[3.5]">
                        <circle cx="30" cy="30" r="14" />
                        <circle cx="26" cy="26" r="3" fill="#1e293b" />
                        <circle cx="35" cy="28" r="2.5" fill="#1e293b" />
                        <path d="M40,20 C48,26 48,40 42,48 M20,42 L26,50 L36,48" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 进阶等级选择行 (☑ 进阶   ◀ 等级 X ▶ + 下方进阶说明文字) */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <div
                className="flex items-center gap-6 text-base sm:text-lg font-bold"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
              >
                {/* 进阶复选框 */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setAscensionEnabled((v) => !v);
                    if (!ascensionEnabled && ascension === 0) {
                      setAscension(1);
                    }
                  }}
                  className="flex items-center gap-2 text-amber-300 hover:text-yellow-200 cursor-pointer"
                >
                  <span className="w-5 h-5 border-2 border-amber-400 bg-black/70 flex items-center justify-center text-xs text-amber-300 font-black">
                    {ascensionEnabled ? '✓' : ''}
                  </span>
                  <span>进阶</span>
                </button>

                {/* 左右箭头切换等级 */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAscensionEnabled(true);
                      setAscension((a) => Math.max(1, (a || 1) - 1));
                    }}
                    className="text-amber-400 hover:text-yellow-200 text-lg px-1 cursor-pointer"
                  >
                    ◀
                  </button>
                  <span className="text-sky-300 font-bold min-w-[72px] text-center">
                    等级 {ascensionEnabled ? ascension || 1 : 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAscensionEnabled(true);
                      setAscension((a) => Math.min(20, (a || 1) + 1));
                    }}
                    className="text-amber-400 hover:text-yellow-200 text-lg px-1 cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* 进阶等级具体效果文字 */}
              <div
                className="text-xs sm:text-sm font-bold text-slate-100 tracking-wide"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.95)' }}
              >
                {ASCENSION_DESCRIPTIONS[ascensionEnabled ? ascension || 1 : 0]}
              </div>
            </div>
          </div>

          {/* 4. 左下角：「返回」暗红绸带按钮 */}
          <button
            type="button"
            onMouseEnter={() => sound.playHover()}
            onClick={() => navigateWithCurtain('title', '返回主菜单', '', 'war_banner')}
            className="fixed bottom-12 left-0 z-30 group cursor-pointer flex items-center"
          >
            <div
              className="pl-8 pr-12 py-2.5 bg-gradient-to-r from-red-950 via-red-900 to-red-800 border-y-2 border-r-2 border-amber-500/80 shadow-[0_6px_16px_rgba(0,0,0,0.9)] group-hover:pl-10 transition-all"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 86% 50%, 100% 100%, 0 100%)',
              }}
            >
              <span
                className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-amber-200 tracking-widest"
                style={{ textShadow: '0 2px 4px #000' }}
              >
                返回
              </span>
            </div>
          </button>

          {/* 5. 右下角：「启程」青蓝绸带按钮 */}
          <button
            type="button"
            onMouseEnter={() => sound.playHover()}
            onClick={() => handleStartGame(selectedClass)}
            className="fixed bottom-12 right-0 z-30 group cursor-pointer flex items-center"
          >
            <div
              className="pl-12 pr-9 py-2.5 bg-gradient-to-l from-cyan-900 via-sky-800 to-teal-700 border-y-2 border-l-2 border-amber-400/90 shadow-[0_6px_16px_rgba(0,0,0,0.9)] group-hover:pr-11 transition-all"
              style={{
                clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)',
              }}
            >
              <span
                className="text-lg sm:text-xl font-bold text-amber-200 group-hover:text-white tracking-widest"
                style={{ textShadow: '0 2px 4px #000' }}
              >
                启程
              </span>
            </div>
          </button>

          {/* 初始套牌预览弹窗 */}
          {showDeckPreviewModal && (
            <div
              onClick={() => setShowDeckPreviewModal(false)}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl pixel-panel-gold p-5 space-y-4 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <span className="text-lg font-black text-amber-300">
                    🃏 {currentStsHero.stsName} · 初始牌组预览 ({starterDeckPreview.length}张)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDeckPreviewModal(false)}
                    className="px-3 py-1 bg-red-900 border border-red-400 text-xs font-black cursor-pointer"
                  >
                    ✕ 关闭
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 py-2">
                  {starterDeckPreview.map((c) => (
                    <CardComponent key={c.uid} card={c} playable={true} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== 3. 三大职业【卡牌推荐组合】展示界面 & 高亮卡牌图鉴 (主封面风暴云海与石刻金框风格) ==================== */}
      {/* ==================== 3. 商业级游戏图鉴与百科大典 (Grimoire Codex & Encyclopedia) ==================== */}
      {gameState === 'compendium' && (
        <div className="relative flex-1 min-h-screen w-full overflow-x-hidden">
          {/* 延续主封面的尖塔风暴云海与余烬魂火背景 */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <SpireStormBackdrop variant="ui" />
          </div>

          <div className="relative z-10 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8 pb-24">
            {/* 顶部装饰性游戏级法典封面框 */}
            <div className="relative p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(251,191,36,0.15)] flex flex-col gap-6">
              {/* 四角金色符文饰边 */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-amber-300" />
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-amber-300" />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-amber-300" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-amber-300" />

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onMouseEnter={() => sound.playHover()}
                    onClick={() => navigateWithCurtain('title', '像素尖塔', '', 'war_banner')}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-950 to-rose-900 border border-amber-400/70 text-xs sm:text-sm font-black text-amber-100 hover:text-yellow-200 tracking-widest cursor-pointer shadow-[0_2px_0_#000] hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span>◀</span> 返回封面
                  </button>
                  <button
                    type="button"
                    onMouseEnter={() => sound.playHover()}
                    onClick={() => navigateWithCurtain('select', '选择登塔英雄', '', 'heavy_blade')}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-950 to-blue-900 border border-amber-400/70 text-xs sm:text-sm font-black text-amber-200 hover:text-white tracking-widest cursor-pointer shadow-[0_2px_0_#000] hover:scale-105 transition-all flex items-center gap-2"
                  >
                    选角出战 <span>▶</span>
                  </button>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-2xl">📖</span>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-300 to-amber-500 uppercase drop-shadow-md">
                        魔塔大典 · 构筑图鉴与战术残卷
                      </h2>
                      <p className="text-[11px] text-amber-200/80 font-bold">
                        GRIMOIRE OF THE SPIRE · 记录了各路英雄登塔必修的绝学秘法与核心流派组合
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playForgeUpgrade();
                      setShowUpgradedInCompendium((u) => !u);
                    }}
                    className={`px-4 py-2 text-xs font-black border-2 cursor-pointer shadow-[0_2px_0_#000] transition-all flex items-center gap-1.5 ${
                      showUpgradedInCompendium
                        ? 'bg-emerald-400 text-slate-950 border-white shadow-[0_0_15px_rgba(52,211,153,0.8)]'
                        : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/80 hover:bg-emerald-900'
                    }`}
                  >
                    <span>{showUpgradedInCompendium ? '✨ 已启用强化版(+)' : '⚒️ 预览强化版(+)'}</span>
                  </button>
                </div>
              </div>

              {/* 职业筛选大Tab栏 (仿游戏主菜单标签页) */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: 'all', label: '⚔️ 全职业大典', defaultCombo: 'warrior_strength' },
                    { key: 'warrior', label: '🛡️ 铁卫剑圣 (Warrior)', defaultCombo: 'warrior_strength' },
                    { key: 'mage', label: '🔮 星界法师 (Mage)', defaultCombo: 'mage_burn' },
                    { key: 'assassin', label: '🗡️ 暗影刺客 (Assassin)', defaultCombo: 'assassin_poison' },
                    { key: 'neutral', label: '📜 中立通用残卷', defaultCombo: null },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setCompendiumFilter(tab.key);
                      if (tab.defaultCombo) {
                        setSelectedComboId(tab.defaultCombo);
                      }
                    }}
                    className={`px-4 py-2 text-xs font-black border-2 cursor-pointer transition-all shadow-[0_3px_0_#000] ${
                      compendiumFilter === tab.key
                        ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-slate-950 border-white shadow-[0_0_20px_rgba(251,191,36,0.7)] scale-105 z-10'
                        : 'bg-slate-950/90 text-slate-300 border-slate-700 hover:border-amber-400/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ==================== 三大职业流派矩阵与成型圣物展示台 ==================== */}
            <div className="relative p-6 bg-slate-950/95 border-2 border-amber-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-6">
              <ParticleCanvas
                theme={
                  activeCombo?.classType === 'mage'
                    ? 'arcane'
                    : activeCombo?.classType === 'assassin'
                    ? 'emerald'
                    : 'ember'
                }
              />

              {/* 顶部：12大成熟流派快速选择矩阵 */}
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black shadow-[0_2px_0_#000]">
                      ★ 官方推荐毕业构筑矩阵
                    </span>
                    <span className="text-xs font-bold text-amber-200/90">
                      点击下方任意流派，大典将为您展开三阶段成型路线与核心卡牌联动链路：
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedComboId && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setOnlyShowComboCards((prev) => !prev);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-black border-2 cursor-pointer shadow-[0_2px_0_#000] ${
                          onlyShowComboCards
                            ? 'bg-cyan-400 text-slate-950 border-white'
                            : 'bg-slate-900 text-cyan-300 border-cyan-400'
                        }`}
                      >
                        {onlyShowComboCards ? '🔍 当前专注该流派核心' : '🌟 全图鉴高亮对比'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedComboId(selectedComboId ? null : 'warrior_strength');
                        setOnlyShowComboCards(false);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-black border-2 cursor-pointer shadow-[0_2px_0_#000] ${
                        !selectedComboId
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {selectedComboId ? '✕ 关闭流派高亮' : '✨ 开启流派高亮'}
                    </button>
                  </div>
                </div>

                {/* 三大职业 12 个流派卡片网格 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {(['warrior', 'mage', 'assassin'] as ClassType[]).map((clsKey) => {
                    const clsMeta = CHARACTER_CLASSES[clsKey];
                    const combosForClass = RECOMMENDED_ARCHETYPE_COMBOS.filter(
                      (c) => c.classType === clsKey
                    );
                    const borderAccent =
                      clsKey === 'warrior'
                        ? 'border-red-500/60 bg-red-950/25'
                        : clsKey === 'mage'
                        ? 'border-cyan-500/60 bg-cyan-950/25'
                        : 'border-emerald-500/60 bg-emerald-950/25';

                    return (
                      <div
                        key={clsKey}
                        className={`p-4 border-2 ${borderAccent} flex flex-col gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.6)]`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2.5">
                            <CharacterSprite classType={clsKey} size="sm" animated={false} />
                            <span className="text-xs font-black text-amber-300">
                              {clsMeta.name} · 核心战术流派
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400/80 bg-slate-900 px-2 py-0.5 border border-slate-700">
                            4 套成型构筑
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {combosForClass.map((combo) => {
                            const isSelected = selectedComboId === combo.id;
                            return (
                              <button
                                key={combo.id}
                                type="button"
                                onClick={() => {
                                  sound.playClick();
                                  setSelectedComboId(combo.id);
                                  if (
                                    compendiumFilter !== 'all' &&
                                    compendiumFilter !== clsKey
                                  ) {
                                    setCompendiumFilter(clsKey);
                                  }
                                }}
                                className={`px-3 py-2.5 text-left border-2 transition-all cursor-pointer flex flex-col gap-1 shadow-[0_2px_0_#000] ${
                                  isSelected
                                    ? 'bg-amber-400 text-slate-950 border-white shadow-[0_0_18px_rgba(251,191,36,0.9)] scale-105 z-10'
                                    : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-amber-400/80 hover:bg-slate-900'
                                }`}
                              >
                                <span className="text-xs font-black truncate">
                                  {combo.title}
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    isSelected ? 'text-slate-950' : 'text-amber-400/90'
                                  }`}
                                >
                                  难度 {combo.difficulty} · {combo.shortTag}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 当前选中流派的【战术大殿与三阶段路线图】 */}
              {activeCombo && (
                <div className="relative z-10 bg-slate-950 border-2 border-amber-400 p-6 flex flex-col gap-6 shadow-2xl">
                  {/* 顶部：流派详细标题、运作机制与毕业圣物 */}
                  <div className="flex flex-wrap items-start justify-between gap-6 border-b border-amber-500/30 pb-5">
                    <div className="flex items-start gap-4 max-w-3xl">
                      <div className="w-16 h-16 shrink-0 bg-slate-900 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                        <CardPixelArt
                          spriteType={activeCombo.coreCardIds[0] || 'sword'}
                          className="w-12 h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-2xl font-black text-amber-300 tracking-wide">
                            {activeCombo.title}
                          </h3>
                          <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-xs font-black shadow-[0_2px_0_#000]">
                            难度：{activeCombo.difficulty}
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-900 border border-yellow-400/60 text-xs font-bold text-yellow-200">
                            ★ 毕业核心 {activeCombo.coreCardIds.length} 张 · ✦ 协同组件 {activeCombo.supportCardIds.length} 张
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-2.5 border border-slate-800">
                          <strong className="text-amber-300">⚙️ 核心战术运转回路：</strong>
                          {activeCombo.coreLoop}
                        </p>
                      </div>
                    </div>

                    {/* 毕业圣物徽章 */}
                    <div className="flex flex-col gap-2 bg-slate-900/90 border border-amber-500/50 p-3 min-w-[260px]">
                      <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <span>👑</span> 毕业圣物契合推荐：
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {(activeCombo.keyRelicIds || []).map((rId) => {
                          const rel = RELICS_POOL.find((r) => r.id === rId);
                          if (!rel) return null;
                          return (
                            <div
                              key={rel.id}
                              title={`${rel.name}：${rel.description}`}
                              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 border border-amber-400/80 shadow-[0_2px_0_#000] cursor-help"
                            >
                              <RelicPixelArt iconType={rel.iconType} className="w-5 h-5" />
                              <span className="text-xs font-bold text-amber-200">
                                {rel.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 三阶段成型路线图 (Act 1 -> Act 2 -> Act 3) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900/90 border-2 border-sky-500/50 text-xs font-bold text-slate-200 leading-relaxed shadow-[0_2px_0_#000]">
                      <div className="text-sky-300 font-black mb-1.5 flex items-center gap-1.5 text-sm">
                        <span>🌱</span> 第一阶段 · 前期过渡抓牌 (Act 1)
                      </div>
                      <div>{activeCombo.earlyStage}</div>
                    </div>
                    <div className="p-4 bg-slate-900/90 border-2 border-purple-500/50 text-xs font-bold text-slate-200 leading-relaxed shadow-[0_2px_0_#000]">
                      <div className="text-purple-300 font-black mb-1.5 flex items-center gap-1.5 text-sm">
                        <span>⚡</span> 第二阶段 · 中期核心引擎 (Act 2)
                      </div>
                      <div>{activeCombo.midStage}</div>
                    </div>
                    <div className="p-4 bg-slate-900/90 border-2 border-amber-500/50 text-xs font-bold text-slate-200 leading-relaxed shadow-[0_2px_0_#000]">
                      <div className="text-amber-300 font-black mb-1.5 flex items-center gap-1.5 text-sm">
                        <span>👑</span> 第三阶段 · 后期毕业终结 (Act 3)
                      </div>
                      <div>{activeCombo.lateStage}</div>
                    </div>
                  </div>

                  {/* 核心卡牌连击链展示 (Visual Core Card Synergy Chain) */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                        <span>⚡</span> 【{activeCombo.title}】必抓核心卡牌联动链路：
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 py-5 px-3 bg-slate-900/80 border-2 border-amber-500/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                      {activeCombo.coreCardIds.map((cardId, idx) => {
                        const inst = instantiateCard(cardId, showUpgradedInCompendium);
                        return (
                          <React.Fragment key={cardId}>
                            <div className="hover:scale-105 transition-transform">
                              <CardComponent
                                card={inst}
                                compact={true}
                                playable={true}
                                highlightRole="core"
                                highlightBadgeText={`${activeCombo.shortTag}核心`}
                              />
                            </div>
                            {idx < activeCombo.coreCardIds.length - 1 && (
                              <div className="flex flex-col items-center">
                                <span className="text-amber-400 font-black text-2xl animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                                  ➔
                                </span>
                                <span className="text-[10px] text-amber-300 font-bold">联动</span>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ==================== 全卡牌图鉴陈列大殿 (Card Codex Gallery) ==================== */}
            <div className="p-6 bg-slate-950 border-2 border-amber-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/40 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🃏</span>
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-amber-300">
                      图鉴卡牌陈列馆 ({filteredCompendiumCards.length} 张秘籍)
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeCombo ? `当前正高亮显示【${activeCombo.title}】核心卡牌与协同组件` : '显示当前筛选条件下的所有可用卡牌'}
                    </p>
                  </div>
                </div>

                {activeCombo && (
                  <div className="flex items-center gap-4 text-xs font-bold bg-slate-900 px-3 py-1.5 border border-amber-500/40">
                    <span className="flex items-center gap-1.5 text-yellow-300">
                      <span className="w-3.5 h-3.5 bg-amber-400 border border-white inline-block shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
                      ★ 流派核心卡 ({activeCombo.coreCardIds.length})
                    </span>
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span className="w-3.5 h-3.5 bg-cyan-400 border border-white inline-block shadow-[0_0_6px_rgba(56,189,248,0.9)]" />
                      ✦ 流派协同组件 ({activeCombo.supportCardIds.length})
                    </span>
                  </div>
                )}
              </div>

              {/* 卡牌网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center pt-2">
                {filteredCompendiumCards.map((cardTemplate) => {
                  const isCore = Boolean(
                    activeCombo?.coreCardIds.includes(cardTemplate.id)
                  );
                  const isSupport = Boolean(
                    activeCombo?.supportCardIds.includes(cardTemplate.id)
                  );
                  const role: 'core' | 'support' | 'dimmed' | null = !activeCombo
                    ? null
                    : isCore
                    ? 'core'
                    : isSupport
                    ? 'support'
                    : 'dimmed';

                  return (
                    <div key={cardTemplate.id} className="transition-transform hover:-translate-y-1">
                      <CardComponent
                        card={instantiateCard(cardTemplate.id, showUpgradedInCompendium)}
                        compact={false}
                        playable={true}
                        highlightRole={role}
                        highlightBadgeText={
                          activeCombo
                            ? isCore
                              ? `${activeCombo.shortTag}核心`
                              : isSupport
                              ? `${activeCombo.shortTag}组件`
                              : undefined
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ==================== 遗物徽章陈列殿堂 (Relics Vault) ==================== */}
            <div className="p-6 bg-slate-950 border-2 border-amber-500/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] space-y-6">
              <div className="flex items-center gap-3 border-b border-amber-500/40 pb-4">
                <span className="text-2xl">👑</span>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-amber-300">
                    上古遗物殿堂 ({RELICS_POOL.length} 枚神器)
                  </h3>
                  <p className="text-xs text-slate-400">
                    登塔途中可收集的传说圣物与战利品徽章
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {RELICS_POOL.map((relic) => {
                  const isRelicRecommended = Boolean(
                    activeCombo?.keyRelicIds?.includes(relic.id)
                  );
                  return (
                    <div
                      key={relic.id}
                      className={`p-4 bg-slate-900/90 border-2 transition-all flex flex-col items-center text-center gap-2.5 shadow-[0_4px_10px_rgba(0,0,0,0.7)] ${
                        isRelicRecommended
                          ? 'border-yellow-300 ring-4 ring-amber-400/80 shadow-[0_0_25px_rgba(250,204,21,0.75)] -translate-y-1 bg-slate-900'
                          : 'border-slate-700 hover:border-amber-400/80 hover:bg-slate-900/95'
                      }`}
                    >
                      {isRelicRecommended && activeCombo && (
                        <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black shadow-[0_2px_0_#000]">
                          ★ {activeCombo.shortTag}毕业圣物
                        </span>
                      )}
                      <div className="p-2 bg-slate-950 border border-amber-500/50 shadow-inner">
                        <RelicPixelArt iconType={relic.iconType} className="w-10 h-10" />
                      </div>
                      <div className="font-black text-xs text-amber-300">{relic.name}</div>
                      <div className="text-[10px] text-slate-300 leading-snug">
                        {relic.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. 游戏主舞台 ==================== */}
      {gameState === 'game' && (
        <main className="flex-1 flex flex-col min-h-screen">
          <ErrorBoundary
            onResetToMenu={() =>
              navigateWithCurtain('select', '返回角色选择', '', 'war_banner')
            }
          >
            <GameArea
              playerName={playerName}
              playerClass={selectedClass}
              ascension={effectiveAscension}
              onRecordRunEnd={handleRecordRunEnd}
              onExitToMenu={() =>
                navigateWithCurtain('select', '返回角色选择', '', 'war_banner')
              }
            />
          </ErrorBoundary>
        </main>
      )}

      {/* 炼金合成施法动画演示遮罩层 */}
      {isCraftingAnimation && (
        <div className="fixed inset-0 z-70 bg-black/90 flex flex-col items-center justify-center p-4 space-y-6 animate-fade-in relative overflow-hidden">
          {/* 全屏金色光芒粒子扩散波纹 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 rounded-full bg-amber-400/35 animate-alchemy-gold-diffusion" />
            <div className="absolute w-72 h-72 rounded-full bg-yellow-300/40 animate-alchemy-gold-diffusion" style={{ animationDelay: '0.25s' }} />
            <div className="absolute w-48 h-48 rounded-full bg-amber-200/50 animate-alchemy-gold-diffusion" style={{ animationDelay: '0.5s' }} />
          </div>

          <div className="relative w-32 h-32 flex items-center justify-center z-10">
            {/* 旋转魔法阵 / 炼金炉火光 */}
            <div className="absolute inset-0 rounded-full border-4 border-amber-400/40 border-t-amber-300 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-yellow-300/60 border-b-yellow-400 animate-ping opacity-60" />
            <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-xl animate-pulse-glow" />
            <span className="text-5xl relative z-10 animate-bounce">⚗️</span>
          </div>
          <div className="text-center space-y-2 z-10">
            <h3 className="text-xl font-black text-yellow-300 tracking-wider animate-pulse">
              ✨ 炼金阵法启动中 · 元素与符文重组...
            </h3>
            <p className="text-xs text-amber-200 font-mono">
              正在融合远征残片与魔晶石能量，即将诞生稀有战利品！
            </p>
          </div>
          <div className="w-64 h-2 bg-slate-900 border border-slate-700 rounded-full overflow-hidden z-10">
            <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400 animate-pulse w-full" />
          </div>
        </div>
      )}

      {/* 炼金成功奖励揭晓弹窗 */}
      {craftingPopupItem && (
        <div
          onClick={() => setCraftingPopupItem(null)}
          className="fixed inset-0 z-75 bg-black/85 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm pixel-panel-gold p-6 space-y-4 text-slate-100 text-center flex flex-col items-center relative overflow-hidden animate-card-float-rotate shadow-[0_0_50px_rgba(251,191,36,0.4)]"
          >
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-amber-200/90 to-transparent animate-gold-shimmer" />
            </div>
            <div className="relative z-10">
              <div className="absolute inset-0 -m-4 rounded-full border-2 border-amber-400/70 animate-particle-burst pointer-events-none" />
              <div className="w-16 h-16 rounded-full bg-amber-950 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-[0_0_24px_rgba(251,191,36,0.7)] relative z-10">
                {craftingPopupItem.icon}
              </div>
            </div>
            <div className="space-y-1 relative z-10">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                ⚗️ 炼金工坊 · 合成大成功！
              </div>
              <h4 className="text-lg font-black text-yellow-300">
                {craftingPopupItem.title}
              </h4>
            </div>
            <p className="text-xs text-slate-300 bg-slate-950 p-3 border border-slate-800 leading-relaxed w-full text-left relative z-10">
              🎁 战利品说明：{craftingPopupItem.desc}
            </p>
            <div className="pt-2 flex items-center justify-between w-full relative z-10">
              <span className="text-xs font-black px-2.5 py-1 border bg-emerald-950 border-emerald-400 text-emerald-300">
                ✓ 已收录至远征背包与图鉴
              </span>
              <button
                type="button"
                onClick={() => setCraftingPopupItem(null)}
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow-[0_3px_0_#000]"
              >
                收下
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
