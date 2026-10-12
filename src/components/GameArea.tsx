import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ALL_CARDS,
  CHARACTER_CLASSES,
  createEncounter,
  EMPTY_STATUS,
  evaluateDeckBuildMaturity,
  generateSmartCardRewards,
  generateSpireMap,
  getStarterDeck,
  instantiateCard,
  NEOW_BLESSINGS,
  POTIONS_POOL,
  RECOMMENDED_ARCHETYPE_COMBOS,
  RELICS_POOL,
  SPIRE_EVENTS,
} from '../data/gameData';
import {
  Card,
  ClassType,
  Enemy,
  GameEventChoice,
  MapNode,
  MapNodeType,
  NeowBlessing,
  Orb,
  OrbType,
  Potion,
  Relic,
  SpireEvent,
  StatusMap,
} from '../types/game';
import { sound } from '../utils/sound';
import CardComponent from './CardComponent';
import {
  CardPixelArt,
  CardStackWidget,
  CharacterSprite,
  CombatBackgroundPixelElements,
  DynamicStatusBar,
  EnemySprite,
  FloatingStatusPopups,
  MapNodeSprite,
  OrbVisualSprite,
  ParticleCanvas,
  PotionBottleSprite,
  RelicPixelArt,
  ScreenTransitionOverlay,
  SpireStormBackdrop,
  STATUS_DISPLAY_ORDER,
  StatusPixelIcon,
  StatusPopupItem,
  TreasureChestSprite,
  VfxBurst,
} from './PixelSprites';

interface GameAreaProps {
  playerClass: ClassType;
  ascension: number;
  playerName?: string;
  onExitToMenu: () => void;
  onRecordRunEnd?: (
    victory: boolean,
    floor: number,
    act: number,
    deckSize: number,
    relicCount: number
  ) => void;
}

type RoomView =
  | 'blessing'
  | 'map'
  | 'combat'
  | 'reward'
  | 'boss_reward'
  | 'rest'
  | 'treasure'
  | 'shop'
  | 'event'
  | 'victory'
  | 'gameover';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function GameArea({
  playerClass,
  ascension,
  playerName = '冒险者',
  onExitToMenu,
  onRecordRunEnd,
}: GameAreaProps) {
  const classInfo = CHARACTER_CLASSES[playerClass];
  const starterRelic =
    RELICS_POOL.find((r) => r.id === classInfo.starterRelicId) || RELICS_POOL[0];

  // Persistent Multi-Act Run State
  const [roomView, setRoomView] = useState<RoomView>('blessing');
  const [currentAct, setCurrentAct] = useState<number>(1);
  const [mapFloors, setMapFloors] = useState<MapNode[][]>(() => generateSpireMap(1));
  const [currentFloor, setCurrentFloor] = useState<number>(0);
  const [actFloor, setActFloor] = useState<number>(0);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [activeNodeType, setActiveNodeType] = useState<'combat' | 'elite' | 'boss'>('combat');

  // Black Curtain Transition State
  const [transitionInfo, setTransitionInfo] = useState<{
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

  const triggerRoomTransition = (
    nextView: RoomView,
    title: string,
    subtitle: string,
    iconType = 'sword',
    onMidTransition?: () => void
  ) => {
    setTransitionInfo({ active: true, title, subtitle, iconType });
    setTimeout(() => {
      if (onMidTransition) onMidTransition();
      setRoomView(nextView);
    }, 240);
    setTimeout(() => {
      setTransitionInfo((prev) => ({ ...prev, active: false }));
    }, 520);
  };

  const [maxHp, setMaxHp] = useState<number>(classInfo.maxHp);
  const [hp, setHp] = useState<number>(classInfo.maxHp);
  const [gold, setGold] = useState<number>(classInfo.startingGold);
  const [deck, setDeck] = useState<Card[]>(() => getStarterDeck(playerClass));
  const [relics, setRelics] = useState<Relic[]>([starterRelic]);
  const [potions, setPotions] = useState<Potion[]>([POTIONS_POOL[0], POTIONS_POOL[1]]);
  const [blessingsOffered] = useState<NeowBlessing[]>(() =>
    shuffleArray(NEOW_BLESSINGS).slice(0, 3)
  );

  // Combat State
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [selectedEnemyIdx, setSelectedEnemyIdx] = useState<number>(0);
  const [drawPile, setDrawPile] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [exhaustPile, setExhaustPile] = useState<Card[]>([]);
  const [playerBlock, setPlayerBlock] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(3);
  const [cardsPlayedThisTurn, setCardsPlayedThisTurn] = useState<number>(0);
  const [playerStatuses, setPlayerStatuses] = useState<StatusMap>({ ...EMPTY_STATUS });
  const [turn, setTurn] = useState<'player' | 'enemy'>('player');
  const [turnNumber, setTurnNumber] = useState<number>(1);

  // Class Specific & Commercial Archetype Combat Mechanics
  const [swordIntent, setSwordIntent] = useState<number>(0);
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [maxOrbSlots, setMaxOrbSlots] = useState<number>(3);
  const [comboPoints, setComboPoints] = useState<number>(0);
  const [clawBonus, setClawBonus] = useState<number>(0);
  const [attacksPlayedThisTurn, setAttacksPlayedThisTurn] = useState<number>(0);
  const [cardsDiscardedThisTurn, setCardsDiscardedThisTurn] = useState<number>(0);
  const [lockedArchetypeComboId, setLockedArchetypeComboId] = useState<string | null>(null);
  const [rerollsUsedThisReward, setRerollsUsedThisReward] = useState<number>(0);

  // Reward / Boss Reward / Rest / Shop / Event State
  const [rewardCards, setRewardCards] = useState<Card[]>([]);
  const [rewardGold, setRewardGold] = useState<number>(0);
  const [rewardRelic, setRewardRelic] = useState<Relic | null>(null);
  const [rewardPotion, setRewardPotion] = useState<Potion | null>(null);
  const [cardPicked, setCardPicked] = useState<boolean>(false);
  const [bossRelicChoices, setBossRelicChoices] = useState<Relic[]>([]);
  const [bossRelicPicked, setBossRelicPicked] = useState<boolean>(false);

  const [shopCards, setShopCards] = useState<Card[]>([]);
  const [shopRelic, setShopRelic] = useState<Relic | null>(null);
  const [shopPotion, setShopPotion] = useState<Potion | null>(null);
  const [cardRemovedInShop, setCardRemovedInShop] = useState<boolean>(false);

  const [currentEvent, setCurrentEvent] = useState<SpireEvent>(SPIRE_EVENTS[0]);
  const [eventOutcome, setEventOutcome] = useState<string | null>(null);

  // Narrative Event Modal State (triggered on non-normal-combat map nodes)
  const [narrativeEventModal, setNarrativeEventModal] = useState<{
    active: boolean;
    event: SpireEvent;
    sourceNode: MapNode;
    outcome: string | null;
    draftCards: Card[];
    rewardedCard: Card | null;
    rewardedRelic: Relic | null;
  } | null>(null);

  // Treasure Chest Room State
  const [chestOpened, setChestOpened] = useState<boolean>(false);
  const [chestGold, setChestGold] = useState<number>(0);
  const [chestRelic, setChestRelic] = useState<Relic | null>(null);
  const [chestCard, setChestCard] = useState<Card | null>(null);
  const [hoveredMapNode, setHoveredMapNode] = useState<MapNode | null>(null);

  // Dynamic Combat VFX & Floating Damage Popup State
  const [enemyVfx, setEnemyVfx] = useState<{
    idx: number;
    type: 'slash' | 'fire' | 'frost' | 'lightning' | 'poison' | 'shield';
    text: string;
  } | null>(null);

  // Enhanced Commercial Combat Choreography, Projectiles & Staged Enemy Phase State
  const [playerUnitAnim, setPlayerUnitAnim] = useState<
    'idle' | 'attack_lunge' | 'cast_spell' | 'shield_up' | 'hit_recoil'
  >('idle');
  const [enemyUnitAnimMap, setEnemyUnitAnimMap] = useState<
    Record<number, 'idle' | 'windup' | 'attack_lunge' | 'cast_spell' | 'shield_up' | 'hit_recoil'>
  >({});
  const [activeActingEnemyIdx, setActiveActingEnemyIdx] = useState<number | null>(null);
  const [arenaHitShake, setArenaHitShake] = useState<'none' | 'light' | 'heavy'>('none');
  const [arenaProjectileVfx, setArenaProjectileVfx] = useState<{
    id: number;
    direction: 'player_to_enemy' | 'enemy_to_player';
    style:
      | 'slash_wave'
      | 'fireball'
      | 'frost_lance'
      | 'lightning_bolt'
      | 'venom_dagger'
      | 'dark_beam'
      | 'abyss_claw';
    label: string;
    targetEnemyIdx?: number;
  } | null>(null);
  const [playerImpactVfx, setPlayerImpactVfx] = useState<{
    id: number;
    type: 'damage' | 'block' | 'heal' | 'buff' | 'debuff';
    text: string;
    subtext?: string;
  } | null>(null);
  const [enemyTurnStepBanner, setEnemyTurnStepBanner] = useState<{
    stepIndex: number;
    totalSteps: number;
    actorName: string;
    actionTitle: string;
    actionDetail: string;
    actionType: 'attack' | 'defend' | 'buff' | 'debuff' | 'attack_debuff' | 'attack_defend' | 'orb_phase' | 'status_dot';
    phaseState: 'windup' | 'impact';
  } | null>(null);

  // Slay-the-Spire Style Large Centered Turn Transition Banner ('Player Turn' / 'Enemy Turn')
  const [turnPhaseBanner, setTurnPhaseBanner] = useState<{
    id: number;
    phase: 'player' | 'enemy';
    turnNum: number;
    titleCn: string;
    titleEn: string;
    subtitle: string;
  } | null>(null);
  const turnBannerTimerRef = useRef<number | null>(null);

  const triggerTurnPhaseBanner = (
    phase: 'player' | 'enemy',
    turnNum: number,
    customSubtitle?: string,
    durationMs: number = 1250
  ) => {
    if (turnBannerTimerRef.current) {
      window.clearTimeout(turnBannerTimerRef.current);
    }
    if (phase === 'player') {
      sound.playPlayerTurn();
    } else {
      sound.playEnemyTurn();
    }
    setTurnPhaseBanner({
      id: Date.now() + Math.random(),
      phase,
      turnNum,
      titleCn: phase === 'player' ? '玩家回合' : '敌人回合',
      titleEn: phase === 'player' ? 'Player Turn' : 'Enemy Turn',
      subtitle:
        customSubtitle ||
        (phase === 'player'
          ? `第 ${turnNum} 回合 · 能量已充能 · 抽牌阶段`
          : `第 ${turnNum} 回合 · 敌方正准备发动攻势`),
    });
    turnBannerTimerRef.current = window.setTimeout(() => {
      setTurnPhaseBanner(null);
    }, durationMs);
  };

  // Boss Multi-Phase Berserk Transition State (Triggered when Boss HP drops <= 50%)
  const [bossBerserkActive, setBossBerserkActive] = useState<boolean>(false);
  const [bossTransitioning, setBossTransitioning] = useState<boolean>(false);
  const [bossTransitionBanner, setBossTransitionBanner] = useState<{
    name: string;
    berserkName: string;
    quote: string;
    spriteType: string;
    buffsText: string;
  } | null>(null);

  // Check and trigger Boss Phase 2 Berserk Awakening when any Boss HP drops to <= 50%
  const checkAndTriggerBossBerserk = (candidateEnemies: Enemy[]): Enemy[] => {
    let newlyTriggered = false;
    let bannerPayload: {
      name: string;
      berserkName: string;
      quote: string;
      spriteType: string;
      buffsText: string;
    } | null = null;

    const updated = candidateEnemies.map((en) => {
      const halfHp = Math.floor(en.maxHp * 0.5);
      if (
        en.tier === 'boss' &&
        en.hp > 0 &&
        en.hp <= halfHp &&
        (en.phase || 1) === 1
      ) {
        newlyTriggered = true;
        const nextStatuses = { ...en.statuses };
        const buffs = en.berserkBuffs || {
          strength: 3,
          metallicize: 4,
          thorns: 2,
          blockGain: 15,
        };
        const buffParts: string[] = [];

        if (buffs.strength) {
          nextStatuses.strength += buffs.strength;
          buffParts.push(`力量 +${buffs.strength}`);
        }
        if (buffs.metallicize) {
          nextStatuses.metallicize += buffs.metallicize;
          buffParts.push(`金属化 +${buffs.metallicize}`);
        }
        if (buffs.thorns) {
          nextStatuses.thorns += buffs.thorns;
          buffParts.push(`荆棘 +${buffs.thorns}`);
        }
        if (buffs.ritual) {
          nextStatuses.ritual += buffs.ritual;
          buffParts.push(`仪式 +${buffs.ritual}`);
        }
        const addedBlock = buffs.blockGain || 0;
        if (addedBlock > 0) {
          buffParts.push(`狂暴护甲 +${addedBlock}`);
        }

        const awakenedName = en.berserkName || `${en.name} [狂暴]`;
        bannerPayload = {
          name: en.name,
          berserkName: awakenedName,
          quote:
            en.berserkQuote ||
            '“凡人，你彻底激怒了深渊之主……感受二阶段毁灭狂潮吧！！”',
          spriteType: en.spriteType,
          buffsText: buffParts.join(' · '),
        };

        return {
          ...en,
          phase: 2 as const,
          name: awakenedName,
          title: en.berserkTitle || en.title,
          block: en.block + addedBlock,
          statuses: nextStatuses,
          intents:
            en.berserkIntents && en.berserkIntents.length > 0
              ? en.berserkIntents
              : en.intents,
          intentIndex: 0,
        };
      }
      return en;
    });

    if (newlyTriggered && bannerPayload) {
      sound.playBossBerserkRoar();
      setBossBerserkActive(true);
      setBossTransitioning(true);
      setBossTransitionBanner(bannerPayload);
      window.setTimeout(() => {
        setBossTransitioning(false);
      }, 1350);
      window.setTimeout(() => {
        setBossTransitionBanner(null);
      }, 3300);
    }

    return updated;
  };

  // Card Upgrade Animation & Stat Delta Feedback State
  const [upgradingCardUid, setUpgradingCardUid] = useState<string | null>(null);
  const [upgradedCardSummary, setUpgradedCardSummary] = useState<{
    card: Card;
    oldDamage?: number;
    newDamage?: number;
    oldBlock?: number;
    newBlock?: number;
    oldCost: number;
    newCost: number;
  } | null>(null);
  const [showUpgradeDeltaPreview, setShowUpgradeDeltaPreview] = useState<boolean>(true);

  // Hand Spring Physics, Entry/Exit Trajectory & Pixel Jitter State
  const [hoveredHandIdx, setHoveredHandIdx] = useState<number | null>(null);
  const [handJitterActive, setHandJitterActive] = useState<boolean>(false);
  const [drawPileRecoil, setDrawPileRecoil] = useState<boolean>(false);
  const [discardPileRecoil, setDiscardPileRecoil] = useState<boolean>(false);
  const cardExitModeMapRef = useRef<Record<string, 'play' | 'discard' | 'exhaust'>>({});
  const newlyDrawnOrderMapRef = useRef<Record<string, number>>({});
  const jitterTimerRef = useRef<number | null>(null);

  const triggerHandMotionFeedback = (
    kind: 'draw' | 'discard' | 'play_and_draw',
    drawnCards: Card[] = []
  ) => {
    drawnCards.forEach((c, idx) => {
      newlyDrawnOrderMapRef.current[c.uid] = idx;
    });

    if (jitterTimerRef.current) {
      window.clearTimeout(jitterTimerRef.current);
    }
    setHandJitterActive(false);
    window.requestAnimationFrame(() => {
      setHandJitterActive(true);
    });
    jitterTimerRef.current = window.setTimeout(() => {
      setHandJitterActive(false);
    }, 250);

    if (kind === 'draw' || kind === 'play_and_draw') {
      sound.playCardDraw();
      setDrawPileRecoil(true);
      window.setTimeout(() => setDrawPileRecoil(false), 340);
    }
    if (kind === 'discard' || kind === 'play_and_draw') {
      if (kind === 'discard') sound.playCardDiscard();
      setDiscardPileRecoil(true);
      window.setTimeout(() => setDiscardPileRecoil(false), 340);
    }
  };

  // Dynamic Buff/Debuff Bouncy Floating Popups & Delta Tracker
  const [statusPopups, setStatusPopups] = useState<StatusPopupItem[]>([]);
  const prevStatusSnapshotRef = useRef<{
    player: StatusMap;
    enemies: Record<string, StatusMap>;
  }>({
    player: { ...EMPTY_STATUS },
    enemies: {},
  });

  useEffect(() => {
    if (roomView !== 'combat') return;

    const generated: StatusPopupItem[] = [];
    const prevPlayer = prevStatusSnapshotRef.current.player;
    let playerStagger = 0;

    STATUS_DISPLAY_ORDER.forEach((key) => {
      const oldVal = prevPlayer[key] || 0;
      const newVal = playerStatuses[key] || 0;
      if (newVal > oldVal) {
        generated.push({
          id: `p_${key}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          targetId: 'player',
          statusKey: key,
          delta: newVal - oldVal,
          prevVal: oldVal,
          newVal,
          staggerIdx: playerStagger++,
        });
      }
    });

    const nextEnemiesMap: Record<string, StatusMap> = {};
    enemies.forEach((enemy) => {
      const prevEn =
        prevStatusSnapshotRef.current.enemies[enemy.uid] || EMPTY_STATUS;
      let enemyStagger = 0;

      if (enemy.hp > 0) {
        STATUS_DISPLAY_ORDER.forEach((key) => {
          const oldVal = prevEn[key] || 0;
          const newVal = enemy.statuses[key] || 0;
          if (newVal > oldVal) {
            generated.push({
              id: `e_${enemy.uid}_${key}_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 6)}`,
              targetId: enemy.uid,
              statusKey: key,
              delta: newVal - oldVal,
              prevVal: oldVal,
              newVal,
              staggerIdx: enemyStagger++,
            });
          }
        });
      }

      nextEnemiesMap[enemy.uid] = { ...enemy.statuses };
    });

    prevStatusSnapshotRef.current = {
      player: { ...playerStatuses },
      enemies: nextEnemiesMap,
    };

    if (generated.length > 0) {
      const addedIds = new Set(generated.map((g) => g.id));
      setStatusPopups((prev) => [...prev, ...generated]);
      const timer = window.setTimeout(() => {
        setStatusPopups((prev) => prev.filter((item) => !addedIds.has(item.id)));
      }, 1450);
      return () => window.clearTimeout(timer);
    }
  }, [playerStatuses, enemies, roomView]);

  // Modal & Map Overlay State
  const [modalMode, setModalMode] = useState<
    null | 'deck' | 'draw' | 'discard' | 'exhaust' | 'upgrade' | 'remove' | 'compendium'
  >(null);
  const [showMapOverlay, setShowMapOverlay] = useState<boolean>(false);
  const [highlightedLegendType, setHighlightedLegendType] = useState<MapNodeType | null>(null);
  const mapScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the parchment map so the current/next reachable floor is centered in view (climbing bottom-to-top like Slay the Spire)
  useEffect(() => {
    if (roomView !== 'map' && !showMapOverlay) return;
    const scrollToCurrentFloor = () => {
      const container = mapScrollContainerRef.current;
      if (!container) return;
      const targetActFloor = Math.min(15, Math.max(1, actFloor + 1));
      const bottomPx = (targetActFloor - 1) * 70 + 20;
      const nodeYFromTop = 1240 - bottomPx - 28;
      const desiredScrollTop = Math.max(
        0,
        nodeYFromTop - container.clientHeight * 0.65
      );
      container.scrollTo({
        top: desiredScrollTop,
        behavior: 'smooth',
      });
    };
    const timer = window.setTimeout(scrollToCurrentFloor, 40);
    return () => window.clearTimeout(timer);
  }, [roomView, showMapOverlay, actFloor, currentAct]);

  const [soundMuted, setSoundMuted] = useState<boolean>(() => sound.isMuted());
  const [inRunComboId, setInRunComboId] = useState<string | null>(() => {
    const first = RECOMMENDED_ARCHETYPE_COMBOS.find(
      (c) => c.classType === playerClass
    );
    return first ? first.id : 'warrior_strength';
  });

  // Live Build Maturity Evaluation across all 12 canonical archetypes
  const buildMaturity = useMemo(
    () => evaluateDeckBuildMaturity(deck, playerClass, lockedArchetypeComboId),
    [deck, playerClass, lockedArchetypeComboId]
  );

  // Drag-to-Play Card State & Click-Suppression Ref
  const [dragCardState, setDragCardState] = useState<{
    card: Card;
    isReadyToRelease: boolean;
    targetEnemyIdx: number | null;
  } | null>(null);
  const lastDragEndTimeRef = useRef<number>(0);

  const detectHoveredEnemyIdx = (clientX: number, clientY: number): number | null => {
    if (typeof document === 'undefined') return null;
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
      const btn = (el as HTMLElement).closest?.('[data-enemy-idx]');
      if (btn) {
        const idx = Number(btn.getAttribute('data-enemy-idx'));
        if (!Number.isNaN(idx) && enemies[idx] && enemies[idx].hp > 0) {
          return idx;
        }
      }
    }
    const enemyBtns = document.querySelectorAll('[data-enemy-idx]');
    let closestIdx: number | null = null;
    let closestDist = 115;
    enemyBtns.forEach((node) => {
      const idx = Number(node.getAttribute('data-enemy-idx'));
      if (Number.isNaN(idx) || !enemies[idx] || enemies[idx].hp <= 0) return;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - cx, clientY - cy);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    return closestIdx;
  };

  const hasRelic = (relicId: string) => relics.some((r) => r.id === relicId);

  const computedMaxEnergy =
    3 + relics.reduce((acc, r) => acc + (r.energyBonus || 0), 0);

  const createOrbObject = (type: OrbType): Orb => {
    if (type === 'fire') {
      return { id: Math.random().toString(), type: 'fire', name: '烈焰', passiveValue: 4, evokeValue: 9 };
    }
    if (type === 'frost') {
      return { id: Math.random().toString(), type: 'frost', name: '寒霜', passiveValue: 3, evokeValue: 7 };
    }
    if (type === 'dark') {
      return { id: Math.random().toString(), type: 'dark', name: '暗核', passiveValue: 6, evokeValue: 12 };
    }
    return { id: Math.random().toString(), type: 'lightning', name: '雷霆', passiveValue: 3, evokeValue: 10 };
  };

  // Apply Neow Blessing
  const handleChooseBlessing = (blessing: NeowBlessing) => {
    sound.playPower();
    if (blessing.effect === 'max_hp') {
      setMaxHp((m) => m + 12);
      setHp((h) => h + 12);
    } else if (blessing.effect === 'gold') {
      setGold((g) => g + 100);
    } else if (blessing.effect === 'upgrade_two') {
      setDeck((prev) => {
        const copy = [...prev];
        const indices = shuffleArray(copy.map((_, i) => i)).slice(0, 2);
        return copy.map((c, idx) =>
          indices.includes(idx)
            ? {
                ...c,
                upgraded: true,
                cost: c.upgradedCost !== undefined ? c.upgradedCost : c.cost,
              }
            : c
        );
      });
    } else if (blessing.effect === 'rare_card') {
      const rarePool = ALL_CARDS.filter(
        (c) => c.classType === playerClass && c.rarity === 'rare'
      );
      if (rarePool.length > 0) {
        const picked = shuffleArray(rarePool)[0];
        setDeck((prev) => [...prev, instantiateCard(picked.id)]);
      }
    } else if (blessing.effect === 'free_relic_hp_cost') {
      setHp((h) => Math.max(1, h - 10));
      const unowned = RELICS_POOL.filter(
        (r) => !relics.some((o) => o.id === r.id) && !r.classSpecific && r.tier !== 'boss'
      );
      if (unowned.length > 0) {
        setRelics((prev) => [...prev, shuffleArray(unowned)[0]]);
      }
    }

    triggerRoomTransition('map', '第一幕 · 幽暗地牢', '选择起始路线节点', 'war_banner');
  };

  // Start a Combat Encounter
  const startCombat = (nodeType: 'combat' | 'elite' | 'boss', globalFloor: number) => {
    sound.playClick();
    setActiveNodeType(nodeType);
    const spawnedEnemies = createEncounter(globalFloor, nodeType, ascension);

    const initStatuses: StatusMap = { ...EMPTY_STATUS };
    let initBlock = 0;
    let initEnergy = computedMaxEnergy;
    const initOrbs: Orb[] = [];

    if (hasRelic('vajra')) initStatuses.strength += 2;
    if (hasRelic('philosopher_stone')) initStatuses.strength += 1;
    if (hasRelic('oddly_smooth_stone')) initStatuses.dexterity += 2;
    if (hasRelic('data_disk')) initStatuses.focus += 2;
    if (hasRelic('demon_heart')) {
      initStatuses.strength += 3;
      initStatuses.dexterity += 3;
      initStatuses.focus += 2;
    }
    if (hasRelic('ice_cream')) initStatuses.metallicize += 4;
    if (hasRelic('anchor')) initBlock += 12;
    if (hasRelic('lantern')) initEnergy += 1;
    if (hasRelic('bronze_scales')) initStatuses.thorns += 4;
    if (hasRelic('cracked_core')) initOrbs.push(createOrbObject('lightning'));
    if (hasRelic('bag_of_marbles')) {
      spawnedEnemies.forEach((e) => {
        e.statuses.vulnerable += 2;
      });
    }
    if (hasRelic('ring_of_snake')) {
      spawnedEnemies.forEach((e) => {
        e.statuses.poison += 3;
      });
    }

    // Apply Passive Archetype Resonance Bonuses (流派小成 / 毕业宗师被动共鸣)
    const activeTier = buildMaturity.primary.resonanceTier;
    const primaryComboId = buildMaturity.primary.combo.id;
    let initSwordIntent = 0;
    let initComboPoints = 0;
    let initOrbSlots = 3;

    if (activeTier >= 1) {
      if (primaryComboId === 'warrior_strength') {
        initSwordIntent += activeTier >= 2 ? 3 : 2;
        if (activeTier >= 2) initStatuses.strength += 2;
      } else if (primaryComboId === 'warrior_fortress') {
        initStatuses.metallicize += activeTier >= 2 ? 4 : 3;
        if (activeTier >= 2) initStatuses.retainBlock += 12;
      } else if (primaryComboId === 'warrior_exhaust') {
        initBlock += 6;
        if (activeTier >= 2) initStatuses.feelNoPain += 2;
      } else if (primaryComboId === 'warrior_blood') {
        initStatuses.strength += activeTier >= 2 ? 2 : 1;
        if (activeTier >= 2) initStatuses.rupture += 1;
      } else if (primaryComboId === 'mage_orb') {
        initOrbs.push(createOrbObject('frost'));
        if (activeTier >= 2) {
          initStatuses.focus += 1;
          initOrbSlots += 1;
        }
      } else if (primaryComboId === 'mage_thunder') {
        initOrbs.push(createOrbObject('lightning'));
        if (activeTier >= 2) initStatuses.stormPower += 1;
      } else if (primaryComboId === 'mage_claw') {
        initBlock += 4;
        if (activeTier >= 2) initEnergy += 1;
      } else if (primaryComboId === 'mage_burn') {
        spawnedEnemies.forEach((e) => {
          e.statuses.burn += activeTier >= 2 ? 5 : 3;
          if (activeTier >= 2) e.statuses.vulnerable += 1;
        });
      } else if (primaryComboId === 'assassin_poison') {
        spawnedEnemies.forEach((e) => {
          e.statuses.poison += activeTier >= 2 ? 4 : 3;
        });
        if (activeTier >= 2) initStatuses.noxiousFumes += 2;
      } else if (primaryComboId === 'assassin_shiv') {
        initStatuses.shivBonus += activeTier >= 2 ? 2 : 1;
      } else if (primaryComboId === 'assassin_discard') {
        initComboPoints += activeTier >= 2 ? 3 : 2;
        if (activeTier >= 2) initEnergy += 1;
      } else if (primaryComboId === 'assassin_phantom') {
        initStatuses.afterImage += 1;
        if (activeTier >= 2) initStatuses.thousandCuts += 2;
      }
    }

    const shuffled = shuffleArray(deck.map((c) => ({ ...c })));
    const extraDraw =
      (hasRelic('ring_of_snake') ? 1 : 0) +
      (hasRelic('data_disk') ? 1 : 0) +
      (hasRelic('cursed_key') ? 1 : 0) +
      (activeTier >= 1 && (primaryComboId === 'mage_claw' || primaryComboId === 'assassin_discard') ? 1 : 0);
    const initialDrawCount = 5 + extraDraw;
    const initialHand = shuffled.slice(0, initialDrawCount);
    const remainingDraw = shuffled.slice(initialDrawCount);

    if (activeTier >= 2 && primaryComboId === 'assassin_shiv') {
      initialHand.push(instantiateCard('shiv'));
    }

    cardExitModeMapRef.current = {};
    newlyDrawnOrderMapRef.current = {};
    initialHand.forEach((c, idx) => {
      newlyDrawnOrderMapRef.current[c.uid] = idx;
    });

    // Reset status snapshot before applying initial combat statuses so starting Relic Buffs/Debuffs bounce up!
    prevStatusSnapshotRef.current = {
      player: { ...EMPTY_STATUS },
      enemies: Object.fromEntries(
        spawnedEnemies.map((e) => [e.uid, { ...EMPTY_STATUS }])
      ),
    };
    setStatusPopups([]);

    setEnemies(spawnedEnemies);
    setSelectedEnemyIdx(0);
    setHoveredHandIdx(null);
    setBossBerserkActive(false);
    setBossTransitioning(false);
    setBossTransitionBanner(null);
    setHand(initialHand);
    setDrawPile(remainingDraw);
    setDiscardPile([]);
    setExhaustPile([]);
    setPlayerBlock(initBlock);
    setEnergy(initEnergy);
    setCardsPlayedThisTurn(0);
    setAttacksPlayedThisTurn(0);
    setCardsDiscardedThisTurn(0);
    setMaxOrbSlots(initOrbSlots);
    setClawBonus(activeTier >= 2 && primaryComboId === 'mage_claw' ? 2 : 0);
    setPlayerStatuses(initStatuses);
    setSwordIntent(initSwordIntent);
    setOrbs(initOrbs);
    setComboPoints(initComboPoints);
    setTurn('player');
    setTurnNumber(1);
    setTurnPhaseBanner(null);
    setTimeout(() => {
      const resonanceSuffix =
        activeTier >= 2
          ? ` · 【${(buildMaturity.primary.combo.title || buildMaturity.primary.combo.name).replace(/^[^\s]+\s/, '')}】宗师共鸣已激活`
          : activeTier === 1
          ? ` · 【${(buildMaturity.primary.combo.title || buildMaturity.primary.combo.name).replace(/^[^\s]+\s/, '')}】初成共鸣已激活`
          : '';
      triggerTurnPhaseBanner(
        'player',
        1,
        `第 1 回合 · 战斗开始${resonanceSuffix}`,
        1300
      );
      triggerHandMotionFeedback('draw', initialHand);
    }, 360);

    const transitionTitle =
      nodeType === 'boss'
        ? `首领决战 · ${spawnedEnemies[0]?.name}`
        : nodeType === 'elite'
        ? `精英强敌 · 第 ${globalFloor} 层`
        : `遭遇战斗 · 第 ${globalFloor} 层`;

    triggerRoomTransition(
      'combat',
      transitionTitle,
      '',
      nodeType === 'boss' ? 'demon_crown' : 'sword'
    );
  };

  // Proceed to the actual room destination after map selection or narrative event modal completion
  const proceedToNodeDestination = (node: MapNode) => {
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      startCombat(node.type, node.floor);
    } else if (node.type === 'rest') {
      sound.playHeal();
      triggerRoomTransition('rest', '🔥 篝火营地', '', 'fireball');
    } else if (node.type === 'treasure') {
      sound.playCoin();
      const unownedRelics = RELICS_POOL.filter(
        (r) =>
          !relics.some((owned) => owned.id === r.id) &&
          !r.classSpecific &&
          r.tier !== 'boss'
      );
      const rareCards = ALL_CARDS.filter(
        (c) =>
          (c.classType === playerClass || c.classType === 'neutral') &&
          (c.rarity === 'rare' || c.rarity === 'uncommon')
      );
      setChestOpened(false);
      setChestGold(55 + Math.floor(Math.random() * 40));
      setChestRelic(
        unownedRelics.length > 0 ? shuffleArray(unownedRelics)[0] : RELICS_POOL[3]
      );
      setChestCard(
        rareCards.length > 0
          ? instantiateCard(shuffleArray(rareCards)[0].id, true)
          : null
      );
      triggerRoomTransition('treasure', '👑 黄金宝箱房', '', 'holy_grail');
    } else if (node.type === 'shop') {
      sound.playCoin();
      const smartShopCards = generateSmartCardRewards(
        deck,
        playerClass,
        currentFloor,
        'shop',
        lockedArchetypeComboId,
        5
      );
      const availableRelics = RELICS_POOL.filter(
        (r) =>
          !relics.some((owned) => owned.id === r.id) &&
          !r.classSpecific &&
          r.tier !== 'boss'
      );
      const pickedRelic =
        availableRelics.length > 0 ? shuffleArray(availableRelics)[0] : null;
      const pickedPotion = shuffleArray(POTIONS_POOL)[0];

      setShopCards(smartShopCards);
      setShopRelic(pickedRelic);
      setShopPotion(pickedPotion);
      setCardRemovedInShop(false);
      triggerRoomTransition('shop', '💰 黑市商人', '', 'scroll');
    } else if (node.type === 'event') {
      setRoomView('map');
    }
  };

  // Enter a node on the Spire Map following authentic Slay the Spire room rules:
  // - combat / elite / boss -> Directly enter Combat
  // - rest -> Directly enter Campfire Rest Site (Heal or Upgrade Card)
  // - shop -> Directly enter Merchant Shop
  // - treasure -> Directly enter Mid-Act Treasure Chest Room (Floor 9)
  // - event (?) -> Trigger Unknown Room (Narrative Event Modal)
  const handleSelectMapNode = (node: MapNode) => {
    if (node.actFloor !== actFloor + 1) return;
    if (currentNodeId) {
      const prevFloorNodes = mapFloors[actFloor - 1] || [];
      const prevNode = prevFloorNodes.find((n) => n.id === currentNodeId);
      if (prevNode && !prevNode.connections.includes(node.id)) return;
    }

    setMapFloors((prev) =>
      prev.map((row) =>
        row.map((n) => (n.id === node.id ? { ...n, completed: true } : n))
      )
    );
    setActFloor(node.actFloor);
    setCurrentFloor(node.floor);
    setCurrentNodeId(node.id);

    if (node.type !== 'event') {
      proceedToNodeDestination(node);
      return;
    }

    // '?' Unknown Event Room
    sound.playClick();
    const pickedEvent = shuffleArray(SPIRE_EVENTS)[0];
    setCurrentEvent(pickedEvent);
    setEventOutcome(null);
    setNarrativeEventModal({
      active: true,
      event: pickedEvent,
      sourceNode: node,
      outcome: null,
      draftCards: [],
      rewardedCard: null,
      rewardedRelic: null,
    });
  };

  // Handle branching choice selection inside the Narrative Event Modal
  const handleSelectNarrativeModalChoice = (choice: GameEventChoice) => {
    if (!narrativeEventModal) return;
    if (
      choice.goldChange &&
      choice.goldChange < 0 &&
      gold < Math.abs(choice.goldChange)
    ) {
      return;
    }

    sound.playClick();
    let updatedMaxHp = maxHp;
    if (choice.maxHpChange) {
      updatedMaxHp = Math.max(12, maxHp + choice.maxHpChange);
      setMaxHp(updatedMaxHp);
    }
    if (choice.hpChange) {
      if (choice.hpChange < 0) sound.playAttack();
      else sound.playHeal();
      setHp((h) => Math.max(1, Math.min(updatedMaxHp, h + choice.hpChange!)));
    }
    if (choice.goldChange) {
      sound.playCoin();
      setGold((g) => Math.max(0, g + choice.goldChange!));
    }
    if (choice.removeRandomCard && deck.length > 5) {
      setDeck((prev) => prev.slice(1));
    }

    let grantedCard: Card | null = null;
    let grantedRelic: Relic | null = null;
    let generatedDraft: Card[] = [];

    if (
      choice.upgradeRandomCard &&
      !choice.gainRandomCard &&
      !choice.gainRareCard
    ) {
      const upgradableIndices = deck
        .map((c, idx) => (!c.upgraded ? idx : -1))
        .filter((idx) => idx !== -1);
      if (upgradableIndices.length > 0) {
        sound.playForgeUpgrade();
        const pickIdx =
          upgradableIndices[
            Math.floor(Math.random() * upgradableIndices.length)
          ];
        const targetCard = deck[pickIdx];
        const newCost =
          targetCard.upgradedCost !== undefined
            ? targetCard.upgradedCost
            : targetCard.cost;
        const upgradedInstance: Card = {
          ...targetCard,
          upgraded: true,
          cost: newCost,
        };
        setDeck((prev) =>
          prev.map((c, i) => (i === pickIdx ? upgradedInstance : c))
        );
        grantedCard = upgradedInstance;
      }
    }

    if (choice.gainRelic) {
      sound.playPower();
      const unowned = RELICS_POOL.filter(
        (r) =>
          !relics.some((o) => o.id === r.id) &&
          !r.classSpecific &&
          r.tier !== 'boss'
      );
      if (unowned.length > 0) {
        const pickedRelic = shuffleArray(unowned)[0];
        setRelics((prev) => [...prev, pickedRelic]);
        grantedRelic = pickedRelic;
      }
    }

    if (choice.gainRareCard) {
      sound.playPower();
      const rarePool = ALL_CARDS.filter(
        (c) => c.classType === playerClass && c.rarity === 'rare'
      );
      const picked = shuffleArray(rarePool)[0];
      if (picked) {
        const inst = instantiateCard(
          picked.id,
          Boolean(choice.upgradeRandomCard)
        );
        setDeck((prev) => [...prev, inst]);
        grantedCard = inst;
      }
    } else if (choice.gainRandomCard) {
      sound.playCardDraw();
      const pool = ALL_CARDS.filter(
        (c) => c.classType === playerClass && c.rarity !== 'starter'
      );
      const picked = shuffleArray(pool)[0];
      if (picked) {
        const inst = instantiateCard(
          picked.id,
          Boolean(choice.upgradeRandomCard)
        );
        setDeck((prev) => [...prev, inst]);
        grantedCard = inst;
      }
    }

    if (choice.cardDraftReward) {
      const pool = shuffleArray(
        ALL_CARDS.filter(
          (c) => c.classType === playerClass && c.rarity !== 'starter'
        )
      ).slice(0, 3);
      generatedDraft = pool.map((c) =>
        instantiateCard(c.id, Math.random() < 0.35)
      );
    }

    setNarrativeEventModal((prev) =>
      prev
        ? {
            ...prev,
            outcome: choice.outcomeText,
            draftCards: generatedDraft,
            rewardedCard: grantedCard,
            rewardedRelic: grantedRelic,
          }
        : null
    );
  };

  const handlePickNarrativeDraftCard = (card: Card) => {
    sound.playCardDraw();
    setDeck((prev) => [...prev, card]);
    setNarrativeEventModal((prev) =>
      prev
        ? {
            ...prev,
            draftCards: [],
            rewardedCard: card,
          }
        : null
    );
  };

  const handleCloseNarrativeModalAndProceed = () => {
    if (!narrativeEventModal) return;
    const targetNode = narrativeEventModal.sourceNode;
    setNarrativeEventModal(null);
    if (targetNode.type !== 'event') {
      proceedToNodeDestination(targetNode);
    }
  };

  // Compute dynamic card cost, damage, hits & block (with full 12-archetype scaling)
  const getEffectiveCardCost = (card: Card): number => {
    const fx = card.upgraded ? card.upgradedEffects : card.effects;
    let c = card.cost;
    if (fx.costReducedByDiscardsThisTurn) {
      c = Math.max(0, c - cardsDiscardedThisTurn);
    }
    return c;
  };

  const computeCardHits = (card: Card): number => {
    const fx = card.upgraded ? card.upgradedEffects : card.effects;
    let hits = fx.hits || 1;
    if (fx.hitsPerOrb) {
      hits = Math.max(1, orbs.length);
    }
    if (fx.hitsPerAttackPlayed) {
      hits = Math.max(1, attacksPlayedThisTurn + 1);
    }
    return hits;
  };

  const hasDeckArchetype = (archetype: string): boolean => {
    return deck.some((c) => c.archetypeTag === archetype);
  };

  const computeCardDamage = (card: Card, targetEnemy?: Enemy): number => {
    const fx = card.upgraded ? card.upgradedEffects : card.effects;
    let base = fx.damage || 0;
    if (card.id === 'shiv') {
      base += playerStatuses.shivBonus;
      if (hasRelic('wrist_blade')) base += 4;
    } else if (getEffectiveCardCost(card) === 0 && hasRelic('wrist_blade')) {
      base += 4;
    }
    if (fx.clawScaling) {
      base += clawBonus;
    }
    if (fx.damagePerOrb) {
      base += fx.damagePerOrb * orbs.length;
    }
    if (fx.damageEqualsBlock) {
      base = playerBlock;
    }
    if (fx.consumeSwordIntentMultiplier) {
      base += swordIntent * fx.consumeSwordIntentMultiplier;
    }
    if (fx.consumeComboDamage) {
      base += comboPoints * fx.consumeComboDamage;
    }
    if (fx.exhaustOtherHandForDamage) {
      const otherHandCount = hand.filter((h) => h.uid !== card.uid).length;
      base = Math.max(1, otherHandCount) * fx.exhaustOtherHandForDamage;
    }
    if (fx.detonatePoison && targetEnemy) {
      base += targetEnemy.statuses.poison;
    }
    if (fx.detonateBurn && targetEnemy) {
      base += targetEnemy.statuses.burn * (typeof fx.detonateBurn === 'number' ? fx.detonateBurn : 1);
    }
    let synergyDmg = 0;
    if (card.comboSynergy && card.comboSynergy.bonusDamage && card.comboSynergy.partnerArchetype) {
      if (hasDeckArchetype(card.comboSynergy.partnerArchetype)) {
        synergyDmg = card.comboSynergy.bonusDamage;
      }
    }
    const strMult = fx.strengthMultiplier || 1;
    let total =
      base +
      playerStatuses.strength * strMult +
      (playerClass === 'warrior' ? swordIntent : 0) +
      synergyDmg;
    if (playerStatuses.weak > 0) {
      total = Math.floor(total * 0.75);
    }
    if (targetEnemy && targetEnemy.statuses.vulnerable > 0) {
      const vulnMult = hasRelic('paper_phrog') ? 1.75 : 1.5;
      total = Math.floor(total * vulnMult);
    }
    return Math.max(0, total);
  };

  const computeCardBlock = (card: Card): number => {
    const fx = card.upgraded ? card.upgradedEffects : card.effects;
    let synergyBlk = 0;
    if (card.comboSynergy && card.comboSynergy.bonusBlock && card.comboSynergy.partnerArchetype) {
      if (hasDeckArchetype(card.comboSynergy.partnerArchetype)) {
        synergyBlk = card.comboSynergy.bonusBlock;
      }
    }
    if (fx.exhaustSkillsForBlock) {
      const nonAttackCount = hand.filter(
        (h) => h.uid !== card.uid && h.type !== 'attack'
      ).length;
      const perCard = Math.max(0, fx.exhaustSkillsForBlock + playerStatuses.dexterity);
      return nonAttackCount * perCard + synergyBlk;
    }
    if (fx.block === undefined && synergyBlk === 0) return 0;
    return Math.max(0, (fx.block || 0) + playerStatuses.dexterity + synergyBlk);
  };

  // Trigger Victory
  const handleCombatVictory = (currentHp: number) => {
    sound.playVictory();
    let finalHp = currentHp;
    if (hasRelic('burning_blood')) {
      finalHp = Math.min(maxHp, finalHp + 8);
    }
    if (hasRelic('meat_on_bone') && finalHp <= maxHp * 0.5) {
      finalHp = Math.min(maxHp, finalHp + 12);
    }

    if (activeNodeType === 'boss') {
      if (currentAct >= 3) {
        setHp(finalHp);
        if (onRecordRunEnd) {
          onRecordRunEnd(true, currentFloor, currentAct, deck.length, relics.length);
        }
        triggerRoomTransition('victory', '👑 荣耀通关 · 45层制霸', '', 'demon_crown');
        return;
      }

      const healedHp = Math.min(maxHp, finalHp + Math.round((maxHp - finalHp) * 0.75));
      setHp(healedHp);
      setGold((g) => g + 100);

      const bossRelics = RELICS_POOL.filter(
        (r) => r.tier === 'boss' && !relics.some((owned) => owned.id === r.id)
      );
      const fallbackRelics = RELICS_POOL.filter(
        (r) => !relics.some((owned) => owned.id === r.id) && !r.classSpecific
      );
      setBossRelicChoices(
        shuffleArray([...bossRelics, ...fallbackRelics]).slice(0, 3)
      );
      setBossRelicPicked(false);

      const smartBossCards = generateSmartCardRewards(
        deck,
        playerClass,
        currentFloor,
        'boss',
        lockedArchetypeComboId,
        3
      );
      setRewardCards(smartBossCards);
      setRerollsUsedThisReward(0);
      setCardPicked(false);
      setRoomView('boss_reward');
      return;
    }

    setHp(finalHp);

    const goldEarned =
      activeNodeType === 'elite'
        ? 55 + Math.floor(Math.random() * 25)
        : 28 + Math.floor(Math.random() * 18);
    setRewardGold(goldEarned);
    setGold((g) => g + goldEarned);

    const drafted = generateSmartCardRewards(
      deck,
      playerClass,
      currentFloor,
      activeNodeType === 'elite' ? 'elite' : 'combat',
      lockedArchetypeComboId,
      3
    );
    setRewardCards(drafted);
    setRerollsUsedThisReward(0);
    setCardPicked(false);

    if (activeNodeType === 'elite') {
      const unownedRelics = RELICS_POOL.filter(
        (r) =>
          !relics.some((owned) => owned.id === r.id) &&
          !r.classSpecific &&
          r.tier !== 'boss'
      );
      setRewardRelic(unownedRelics.length > 0 ? shuffleArray(unownedRelics)[0] : null);
    } else {
      setRewardRelic(null);
    }

    setRewardPotion(Math.random() < 0.55 ? shuffleArray(POTIONS_POOL)[0] : null);
    setRoomView('reward');
  };

  // Proceed to Next Act
  const handleProceedToNextAct = () => {
    const nextAct = currentAct + 1;
    const actTitle =
      nextAct === 2 ? '第二幕 · 星界秘境 (16F-30F)' : '第三幕 · 绯红王座 (31F-45F)';
    triggerRoomTransition(
      'map',
      actTitle,
      '',
      nextAct === 2 ? 'arcane_eye' : 'demon_crown',
      () => {
        setCurrentAct(nextAct);
        setActFloor(0);
        setCurrentNodeId(null);
        setMapFloors(generateSpireMap(nextAct));
      }
    );
  };

  // Play a Card from Hand (supports both Click-to-Play and Drag-to-Play with optional target override)
  const handlePlayCard = (card: Card, targetOverrideIdx?: number) => {
    const effectiveCost = getEffectiveCardCost(card);
    if (turn !== 'player' || energy < effectiveCost) return;

    const fx = card.upgraded ? card.upgradedEffects : card.effects;
    const aliveEnemies = enemies.filter((e) => e.hp > 0);
    if (aliveEnemies.length === 0) return;

    const preferredIdx =
      targetOverrideIdx !== undefined &&
      targetOverrideIdx !== null &&
      enemies[targetOverrideIdx] &&
      enemies[targetOverrideIdx].hp > 0
        ? targetOverrideIdx
        : selectedEnemyIdx;

    if (preferredIdx !== selectedEnemyIdx && enemies[preferredIdx]?.hp > 0) {
      setSelectedEnemyIdx(preferredIdx);
    }

    const validTargetIdx =
      enemies[preferredIdx] && enemies[preferredIdx].hp > 0
        ? preferredIdx
        : enemies.findIndex((e) => e.hp > 0);

    const nextEnemies = enemies.map((e) => ({
      ...e,
      statuses: { ...e.statuses },
    }));

    let nextBlock = playerBlock;
    let nextHp = hp;
    let nextEnergy = energy - effectiveCost;
    const nextStatuses = { ...playerStatuses };
    let nextSwordIntent = swordIntent;
    let nextCombo = comboPoints;
    let nextOrbs = [...orbs];
    let nextMaxOrbSlots = maxOrbSlots;
    let nextDiscardedThisTurn = cardsDiscardedThisTurn;
    const nextPlayedCount = cardsPlayedThisTurn + 1;
    let nextAttacksPlayed = attacksPlayedThisTurn;

    if (card.type === 'attack') {
      nextAttacksPlayed += 1;
      setAttacksPlayedThisTurn(nextAttacksPlayed);
      if (hasRelic('nunchaku') && nextAttacksPlayed % 4 === 0) {
        nextEnergy += 1;
      }
    }

    if (card.type === 'power' && hasRelic('mummified_hand')) {
      nextEnergy += 1;
    }

    if (fx.orbSlotGain) {
      nextMaxOrbSlots = Math.min(6, nextMaxOrbSlots + fx.orbSlotGain);
      setMaxOrbSlots(nextMaxOrbSlots);
    }

    if (fx.selfHpLoss) {
      nextHp = Math.max(1, nextHp - fx.selfHpLoss);
      // Rupture (撕裂血管): Gain Strength whenever you lose HP from a card
      if (nextStatuses.rupture > 0) {
        nextStatuses.strength += nextStatuses.rupture;
      }
      if (hasRelic('red_skull') && nextHp <= maxHp * 0.5) {
        nextStatuses.strength += 1;
      }
    }

    if (nextStatuses.afterImage > 0) {
      nextBlock += nextStatuses.afterImage;
    }

    // Thousand Cuts (凌迟千刃): Deal damage to ALL enemies whenever any card is played
    if (nextStatuses.thousandCuts > 0) {
      nextEnemies.forEach((en) => {
        if (en.hp <= 0) return;
        let cutDmg = nextStatuses.thousandCuts;
        if (en.block > 0) {
          const abs = Math.min(en.block, cutDmg);
          en.block -= abs;
          cutDmg -= abs;
        }
        en.hp = Math.max(0, en.hp - cutDmg);
      });
    }

    if (nextPlayedCount % 3 === 0) {
      if (hasRelic('shuriken_relic')) nextStatuses.strength += 1;
      if (hasRelic('kunai_relic')) nextStatuses.dexterity += 1;
    }

    if (fx.block !== undefined) {
      sound.playBlock();
      const gainedBlock = computeCardBlock(card);
      nextBlock += gainedBlock;
    }
    if (fx.doubleBlock) {
      sound.playBlock();
      nextBlock *= 2;
    }

    const snakePoisonBonus = hasRelic('snecko_skull') ? 1 : 0;

    const applyDebuffsTo = (idx: number) => {
      const target = nextEnemies[idx];
      if (!target || target.hp <= 0) return;
      if (fx.shatterEnemyBlock) {
        target.block = 0;
      }
      if (fx.vulnerable) target.statuses.vulnerable += fx.vulnerable;
      if (fx.weak) target.statuses.weak += fx.weak;
      if (fx.poison) target.statuses.poison += fx.poison + snakePoisonBonus;
      if (fx.burn) target.statuses.burn += fx.burn;
      if (fx.doublePoison) target.statuses.poison *= 2;
      if (fx.triplePoison) target.statuses.poison *= 3;
    };

    if (card.target === 'all') {
      nextEnemies.forEach((_, idx) => applyDebuffsTo(idx));
    } else if (validTargetIdx >= 0) {
      applyDebuffsTo(validTargetIdx);
    }

    let nextHand = hand.filter((c) => c.uid !== card.uid);
    let nextDraw = [...drawPile];
    let nextDiscard = [...discardPile];
    const nextExhaust = [...exhaustPile];

    let exhaustBonusDraws = 0;
    const onCardExhausted = (exhaustedCard: Card) => {
      nextExhaust.push(exhaustedCard);
      if (nextStatuses.feelNoPain > 0) {
        nextBlock += nextStatuses.feelNoPain;
      }
      if (nextStatuses.darkEmbrace > 0) {
        exhaustBonusDraws += nextStatuses.darkEmbrace;
      }
      if (hasRelic('charons_ashes')) {
        nextEnemies.forEach((en) => {
          if (en.hp <= 0) return;
          let ashDmg = 3;
          if (en.block > 0) {
            const abs = Math.min(en.block, ashDmg);
            en.block -= abs;
            ashDmg -= abs;
          }
          en.hp = Math.max(0, en.hp - ashDmg);
        });
      }
    };

    const onCardDiscarded = (discardedCard: Card) => {
      cardExitModeMapRef.current[discardedCard.uid] = 'discard';
      nextDiscard.push(discardedCard);
      nextDiscardedThisTurn += 1;
      if (hasRelic('tough_bandages')) {
        nextBlock += 3;
      }
      if (hasRelic('tingsha')) {
        const living = nextEnemies.filter((e) => e.hp > 0);
        if (living.length > 0) {
          const target = living[Math.floor(Math.random() * living.length)];
          let tingDmg = 3;
          if (target.block > 0) {
            const abs = Math.min(target.block, tingDmg);
            target.block -= abs;
            tingDmg -= abs;
          }
          target.hp = Math.max(0, target.hp - tingDmg);
        }
      }
      // Reflex / Tactician style discard synergy
      if (discardedCard.id === 'a_dagger_throw' || discardedCard.archetypeTag === '弃牌赌徒流') {
        nextCombo += 1;
      }
    };

    // Second Wind (重振精神): Exhaust all non-Attack cards in hand and gain Block for each
    if (fx.exhaustSkillsForBlock || fx.exhaustHandSkills) {
      const nonAttacks = nextHand.filter((c) => c.type !== 'attack');
      const blockPerCard = Math.max(
        0,
        (fx.exhaustSkillsForBlock || fx.blockPerExhausted || 6) + nextStatuses.dexterity
      );
      nonAttacks.forEach((na) => {
        cardExitModeMapRef.current[na.uid] = 'exhaust';
        onCardExhausted(na);
      });
      nextHand = nextHand.filter((c) => c.type === 'attack');
      nextBlock += nonAttacks.length * blockPerCard;
    }

    // Fiend Fire (恶魔之火): Exhaust all other cards in hand and deal massive damage per card
    let fiendFireCount = 0;
    if (fx.exhaustOtherHandForDamage) {
      const others = [...nextHand];
      fiendFireCount = Math.max(1, others.length);
      others.forEach((oc) => {
        cardExitModeMapRef.current[oc.uid] = 'exhaust';
        onCardExhausted(oc);
      });
      nextHand = [];
    }

    // True Grit / Burning Pact (百战坚毅 / 灰烬契约): Exhaust 1 card in hand (prioritizes starter strikes/defends)
    if (fx.exhaustOneRandomOtherCard && nextHand.length > 0) {
      const starterIdx = nextHand.findIndex((c) => c.rarity === 'starter');
      const pickIdx =
        starterIdx !== -1 ? starterIdx : Math.floor(Math.random() * nextHand.length);
      const [exhaustedTarget] = nextHand.splice(pickIdx, 1);
      if (exhaustedTarget) {
        cardExitModeMapRef.current[exhaustedTarget.uid] = 'exhaust';
        onCardExhausted(exhaustedTarget);
      }
    }

    if (
      fx.damage !== undefined ||
      fx.damageEqualsBlock ||
      fx.detonatePoison ||
      fx.detonateBurn ||
      fx.exhaustOtherHandForDamage
    ) {
      sound.playAttack();
      let hits = fx.hits || 1;
      if (fx.hitsPerOrb) {
        hits = Math.max(1, nextOrbs.length);
      }
      if (fx.hitsPerAttackPlayed) {
        hits = Math.max(1, nextAttacksPlayed);
      }
      if (fx.exhaustOtherHandForDamage) {
        hits = fiendFireCount;
      }
      const targetIndices =
        card.target === 'all'
          ? nextEnemies.map((_, idx) => idx).filter((idx) => nextEnemies[idx].hp > 0)
          : [validTargetIdx];

      let totalDealtToPrimary = 0;
      for (let h = 0; h < hits; h++) {
        targetIndices.forEach((idx) => {
          const enemy = nextEnemies[idx];
          if (!enemy || enemy.hp <= 0) return;
          let dmg = fx.exhaustOtherHandForDamage
            ? Math.max(
                0,
                fx.exhaustOtherHandForDamage +
                  nextStatuses.strength +
                  (playerClass === 'warrior' ? nextSwordIntent : 0)
              )
            : computeCardDamage(card, enemy);

          if (fx.exhaustOtherHandForDamage) {
            if (nextStatuses.weak > 0) dmg = Math.floor(dmg * 0.75);
            if (enemy.statuses.vulnerable > 0) {
              dmg = Math.floor(dmg * (hasRelic('paper_phrog') ? 1.75 : 1.5));
            }
          }

          totalDealtToPrimary += dmg;
          if (enemy.block > 0) {
            const absorbed = Math.min(enemy.block, dmg);
            enemy.block -= absorbed;
            dmg -= absorbed;
          }
          const hpBefore = enemy.hp;
          enemy.hp = Math.max(0, enemy.hp - dmg);
          const unblockedDealt = hpBefore - enemy.hp;

          // Envenom (涂毒之刃): Apply poison when attack deals unblocked damage
          if (unblockedDealt > 0 && card.type === 'attack' && nextStatuses.envenom > 0) {
            enemy.statuses.poison += nextStatuses.envenom + snakePoisonBonus;
          }
          // Reaper / Blood Strike (死神收割 / 嗜血狂斩): Heal HP equal to unblocked damage dealt
          if (fx.lifestealDamage && unblockedDealt > 0) {
            nextHp = Math.min(maxHp, nextHp + Math.min(unblockedDealt, 16));
          }
        });
      }

      // Claw (零式撕裂爪): Permanently increase all Claw cards' damage this combat
      if (fx.clawScaling) {
        setClawBonus((prev) => prev + fx.clawScaling!);
      }

      const vfxKind =
        card.spriteType === 'fireball' || card.spriteType === 'meteor_star' || fx.burn || fx.detonateBurn
          ? 'fire'
          : card.spriteType === 'frost' || card.spriteType === 'glacier_crystal'
          ? 'frost'
          : card.spriteType === 'lightning'
          ? 'lightning'
          : card.spriteType === 'poison' || card.spriteType === 'venom_skull' || fx.poison || fx.detonatePoison
          ? 'poison'
          : 'slash';

      const projStyle =
        vfxKind === 'fire'
          ? 'fireball'
          : vfxKind === 'frost'
          ? 'frost_lance'
          : vfxKind === 'lightning'
          ? 'lightning_bolt'
          : vfxKind === 'poison' || playerClass === 'assassin'
          ? 'venom_dagger'
          : 'slash_wave';

      setPlayerUnitAnim(playerClass === 'mage' ? 'cast_spell' : 'attack_lunge');
      setArenaProjectileVfx({
        id: Date.now() + Math.random(),
        direction: 'player_to_enemy',
        style: projStyle,
        label: `${card.name}${hits > 1 ? ` x${hits}` : ''}`,
        targetEnemyIdx: validTargetIdx,
      });
      setEnemyUnitAnimMap((prev) => ({ ...prev, [validTargetIdx]: 'hit_recoil' }));
      setArenaHitShake(totalDealtToPrimary >= 16 ? 'heavy' : 'light');

      setEnemyVfx({
        idx: validTargetIdx,
        type: vfxKind,
        text: `-${totalDealtToPrimary}`,
      });
      window.setTimeout(() => {
        setPlayerUnitAnim('idle');
        setArenaProjectileVfx(null);
        setArenaHitShake('none');
        setEnemyUnitAnimMap((prev) => ({ ...prev, [validTargetIdx]: 'idle' }));
      }, 480);
      setTimeout(() => setEnemyVfx(null), 700);
    } else if (fx.poison || fx.doublePoison || fx.triplePoison || fx.detonatePoisonAll) {
      if (fx.detonatePoisonAll && validTargetIdx >= 0 && nextEnemies[validTargetIdx]) {
        const primaryPoison = nextEnemies[validTargetIdx].statuses.poison;
        if (primaryPoison > 0) {
          nextEnemies.forEach((en) => {
            if (en.hp <= 0) return;
            let blastDmg = primaryPoison;
            if (en.block > 0) {
              const abs = Math.min(en.block, blastDmg);
              en.block -= abs;
              blastDmg -= abs;
            }
            en.hp = Math.max(0, en.hp - blastDmg);
          });
        }
      }
      setPlayerUnitAnim('cast_spell');
      setArenaProjectileVfx({
        id: Date.now() + Math.random(),
        direction: 'player_to_enemy',
        style: 'venom_dagger',
        label: card.name,
        targetEnemyIdx: validTargetIdx,
      });
      setEnemyUnitAnimMap((prev) => ({ ...prev, [validTargetIdx]: 'hit_recoil' }));
      setEnemyVfx({
        idx: validTargetIdx,
        type: 'poison',
        text: fx.triplePoison
          ? '☠️剧毒x3'
          : fx.doublePoison
          ? '☠️剧毒x2'
          : fx.detonatePoisonAll
          ? '💥尸爆连锁'
          : `+${(fx.poison || 0) + snakePoisonBonus}☠️`,
      });
      window.setTimeout(() => {
        setPlayerUnitAnim('idle');
        setArenaProjectileVfx(null);
        setEnemyUnitAnimMap((prev) => ({ ...prev, [validTargetIdx]: 'idle' }));
      }, 460);
      setTimeout(() => setEnemyVfx(null), 700);
    } else if (fx.block !== undefined || fx.doubleBlock || fx.exhaustSkillsForBlock || fx.heal) {
      setPlayerUnitAnim('shield_up');
      const blkVal = fx.doubleBlock ? nextBlock : computeCardBlock(card);
      setPlayerImpactVfx({
        id: Date.now(),
        type: fx.heal ? 'heal' : 'block',
        text: fx.heal ? `+${fx.heal} 生命恢复` : `+${blkVal} 护甲加持`,
        subtext: card.name,
      });
      window.setTimeout(() => {
        setPlayerUnitAnim('idle');
        setPlayerImpactVfx(null);
      }, 620);
    } else if (card.type === 'power' || fx.channelOrb || fx.strength || fx.focus || fx.dexterity) {
      setPlayerUnitAnim('cast_spell');
      setPlayerImpactVfx({
        id: Date.now(),
        type: 'buff',
        text: `⚡ ${card.name}`,
        subtext: '能力法阵已激活',
      });
      window.setTimeout(() => {
        setPlayerUnitAnim('idle');
        setPlayerImpactVfx(null);
      }, 650);
    }

    if (fx.consumeSwordIntentMultiplier) nextSwordIntent = 0;
    if (fx.consumeComboDamage) nextCombo = 0;

    if (fx.strength) {
      sound.playPower();
      nextStatuses.strength += fx.strength;
    }
    if (fx.doubleStrength) {
      sound.playPower();
      nextStatuses.strength *= 2;
    }
    if (fx.dexterity) {
      sound.playPower();
      nextStatuses.dexterity += fx.dexterity;
    }
    if (fx.focus) {
      sound.playPower();
      nextStatuses.focus += fx.focus;
    }
    if (fx.thornsGain) nextStatuses.thorns += fx.thornsGain;
    if (fx.metallicizeGain) nextStatuses.metallicize += fx.metallicizeGain;
    if (fx.retainBlock) nextStatuses.retainBlock += fx.retainBlock;
    if (fx.ritualPlayer) nextStatuses.ritual += fx.ritualPlayer;
    if (fx.swordMastery) nextStatuses.swordMastery += fx.swordMastery;
    if (fx.infiniteBlades) nextStatuses.infiniteBlades += fx.infiniteBlades;
    if (fx.shivBonus) nextStatuses.shivBonus += fx.shivBonus;
    if (fx.afterImage) nextStatuses.afterImage += fx.afterImage;
    if (fx.feelNoPain) nextStatuses.feelNoPain += fx.feelNoPain;
    if (fx.darkEmbrace) nextStatuses.darkEmbrace += fx.darkEmbrace;
    if (fx.rupture) nextStatuses.rupture += fx.rupture;
    if (fx.loopOrb) nextStatuses.loopOrb += fx.loopOrb;
    if (fx.stormPower) nextStatuses.stormPower += fx.stormPower;
    if (fx.noxiousFumes) nextStatuses.noxiousFumes += fx.noxiousFumes;
    if (fx.envenom) nextStatuses.envenom += fx.envenom;
    if (fx.thousandCuts) nextStatuses.thousandCuts += fx.thousandCuts;

    if (fx.heal) {
      sound.playHeal();
      nextHp = Math.min(maxHp, nextHp + fx.heal);
    }
    if (fx.energyGain) nextEnergy += fx.energyGain;
    if (fx.doubleEnergy) nextEnergy = Math.min(99, nextEnergy * 2);
    if (fx.swordIntent) nextSwordIntent += fx.swordIntent;

    if (playerClass === 'assassin' && !fx.consumeComboDamage) {
      nextCombo += 1 + (fx.comboGain || 0);
    } else if (fx.comboGain) {
      nextCombo += fx.comboGain;
    }

    const triggerEvokeOrb = (orb: Orb) => {
      const effectiveEvoke = Math.max(0, orb.evokeValue + nextStatuses.focus);
      if (orb.type === 'frost') {
        nextBlock += effectiveEvoke;
      } else {
        const aliveIndices = nextEnemies
          .map((_, i) => i)
          .filter((i) => nextEnemies[i].hp > 0);
        if (aliveIndices.length > 0) {
          let tIdx = aliveIndices[0];
          if (orb.type === 'dark') {
            tIdx = aliveIndices.reduce((minI, curI) =>
              nextEnemies[curI].hp < nextEnemies[minI].hp ? curI : minI
            );
          }
          let dmg = effectiveEvoke;
          const en = nextEnemies[tIdx];
          if (en.block > 0) {
            const abs = Math.min(en.block, dmg);
            en.block -= abs;
            dmg -= abs;
          }
          en.hp = Math.max(0, en.hp - dmg);
        }
      }
    };

    // Storm Power (雷暴引擎): Whenever you play a Power card, channel Lightning
    if (card.type === 'power' && nextStatuses.stormPower > 0) {
      for (let s = 0; s < nextStatuses.stormPower; s++) {
        const newLightning = createOrbObject('lightning');
        if (nextOrbs.length >= nextMaxOrbSlots) {
          triggerEvokeOrb(nextOrbs[0]);
          nextOrbs = [...nextOrbs.slice(1), newLightning];
        } else {
          nextOrbs.push(newLightning);
        }
      }
    }

    if (fx.evokeFirstOrbTwice && nextOrbs.length > 0) {
      sound.playPower();
      const firstOrb = nextOrbs[0];
      triggerEvokeOrb(firstOrb);
      triggerEvokeOrb(firstOrb);
      nextOrbs = nextOrbs.slice(1);
    }

    if (fx.channelOrb) {
      sound.playPower();
      const count = fx.channelOrbCount || 1;
      for (let c = 0; c < count; c++) {
        const orbType: OrbType =
          fx.channelOrb === 'random'
            ? (['fire', 'frost', 'lightning', 'dark'][
                Math.floor(Math.random() * 4)
              ] as OrbType)
            : fx.channelOrb;
        const newOrb = createOrbObject(orbType);
        if (nextOrbs.length >= nextMaxOrbSlots) {
          const oldest = nextOrbs[0];
          triggerEvokeOrb(oldest);
          nextOrbs = [...nextOrbs.slice(1), newOrb];
        } else {
          nextOrbs.push(newOrb);
        }
      }
    }

    // Trigger Dark Orb Passive immediately (漆黑暗核)
    if (fx.triggerDarkPassive) {
      nextOrbs.forEach((o) => {
        if (o.type === 'dark') {
          o.evokeValue += Math.max(0, o.passiveValue + nextStatuses.focus);
        }
      });
    }

    if (fx.evokeAllOrbs && nextOrbs.length > 0) {
      sound.playPower();
      nextOrbs.forEach((o) => triggerEvokeOrb(o));
      nextOrbs = [];
    }

    // Calculated Gamble / Storm of Steel: Discard entire hand
    let gambleDraws = 0;
    let stormOfSteelShivs = 0;
    if (fx.calculatedGamble && nextHand.length > 0) {
      if (card.id === 'a_storm_of_steel') {
        stormOfSteelShivs = nextHand.length + (card.upgraded ? 1 : 0);
      } else {
        gambleDraws = nextHand.length;
      }
      nextHand.forEach((c) => onCardDiscarded(c));
      nextHand = [];
    }

    const stopsExhaust =
      (card.id === 'w_limit_break' || card.id === 'a_calculated_gamble') &&
      card.upgraded;
    const willExhaust = Boolean(card.exhaust && !stopsExhaust);
    cardExitModeMapRef.current[card.uid] = willExhaust ? 'exhaust' : 'play';

    if (willExhaust) {
      onCardExhausted(card);
    } else {
      nextDiscard.push(card);
    }

    const newlyDrawn: Card[] = [];

    // All For One (万物归一): Return all 0-cost cards from discard pile to hand
    if (fx.recallZeroCostFromDiscard) {
      const zeroCostInDiscard = nextDiscard.filter(
        (c) => c.uid !== card.uid && c.cost === 0
      );
      nextDiscard = nextDiscard.filter(
        (c) => c.uid === card.uid || c.cost !== 0
      );
      zeroCostInDiscard.forEach((zc) => {
        if (nextHand.length < 10) {
          nextHand.push(zc);
          newlyDrawn.push(zc);
        } else {
          nextDiscard.push(zc);
        }
      });
    }

    const totalDrawCount = (fx.draw || 0) + exhaustBonusDraws + gambleDraws;
    if (totalDrawCount > 0) {
      for (let i = 0; i < totalDrawCount; i++) {
        if (nextDraw.length === 0 && nextDiscard.length > 0) {
          nextDraw = shuffleArray(nextDiscard);
          nextDiscard = [];
        }
        if (nextDraw.length > 0) {
          const drawnCard = nextDraw[0];
          nextHand.push(drawnCard);
          newlyDrawn.push(drawnCard);
          nextDraw = nextDraw.slice(1);
          if (fx.zeroCostDrawSynergy && drawnCard.cost === 0) {
            nextBlock += card.upgraded ? 4 : 3;
          }
        }
      }
    }

    // Discard 1 card after drawing (Acrobatics / Dagger Throw)
    if (fx.discardOneCard && nextHand.length > 0) {
      const starterIdx = nextHand.findIndex((c) => c.rarity === 'starter');
      const pickIdx =
        starterIdx !== -1 ? starterIdx : nextHand.length - 1;
      const [discardedTarget] = nextHand.splice(pickIdx, 1);
      if (discardedTarget) {
        onCardDiscarded(discardedTarget);
      }
    }

    const totalShivsToAdd = (fx.addShivs || 0) + stormOfSteelShivs;
    if (totalShivsToAdd > 0) {
      for (let i = 0; i < totalShivsToAdd; i++) {
        const shivCard = instantiateCard('shiv');
        nextHand.push(shivCard);
        newlyDrawn.push(shivCard);
      }
    }

    setHoveredHandIdx(null);
    triggerHandMotionFeedback(
      newlyDrawn.length > 0 ? 'play_and_draw' : 'discard',
      newlyDrawn
    );

    const checkedEnemies = checkAndTriggerBossBerserk(nextEnemies);

    setEnemies(checkedEnemies);
    setPlayerBlock(nextBlock);
    setHp(nextHp);
    setEnergy(nextEnergy);
    setCardsPlayedThisTurn(nextPlayedCount);
    setCardsDiscardedThisTurn(nextDiscardedThisTurn);
    setPlayerStatuses(nextStatuses);
    setSwordIntent(nextSwordIntent);
    setComboPoints(nextCombo);
    setOrbs(nextOrbs);
    setHand(nextHand);
    setDrawPile(nextDraw);
    setDiscardPile(nextDiscard);
    setExhaustPile(nextExhaust);

    if (checkedEnemies.every((e) => e.hp <= 0)) {
      setTimeout(() => handleCombatVictory(nextHp), 350);
    }
  };

  // Use a Potion in Combat
  const handleUsePotion = (potion: Potion, idx: number) => {
    if (roomView !== 'combat' || turn !== 'player') return;
    sound.playHeal();
    setPotions((prev) => prev.filter((_, i) => i !== idx));

    if (potion.effectType === 'heal') {
      setHp((h) => Math.min(maxHp, h + potion.value));
    } else if (potion.effectType === 'energy') {
      setEnergy((e) => e + potion.value);
    } else if (potion.effectType === 'block') {
      setPlayerBlock((b) => b + potion.value);
    } else if (potion.effectType === 'strength') {
      setPlayerStatuses((s) => ({ ...s, strength: s.strength + potion.value }));
    } else if (potion.effectType === 'focus') {
      setPlayerStatuses((s) => ({
        ...s,
        focus: s.focus + potion.value,
        dexterity: s.dexterity + 2,
      }));
    } else if (potion.effectType === 'draw') {
      let nextDraw = [...drawPile];
      let nextDiscard = [...discardPile];
      const nextHand = [...hand];
      const drawnFromPotion: Card[] = [];
      for (let i = 0; i < potion.value; i++) {
        if (nextDraw.length === 0 && nextDiscard.length > 0) {
          nextDraw = shuffleArray(nextDiscard);
          nextDiscard = [];
        }
        if (nextDraw.length > 0) {
          const c = nextDraw[0];
          nextHand.push(c);
          drawnFromPotion.push(c);
          nextDraw = nextDraw.slice(1);
        }
      }
      triggerHandMotionFeedback('draw', drawnFromPotion);
      setHand(nextHand);
      setDrawPile(nextDraw);
      setDiscardPile(nextDiscard);
    } else if (potion.effectType === 'poison_all') {
      setEnemies((prev) =>
        prev.map((e) =>
          e.hp > 0
            ? { ...e, statuses: { ...e.statuses, poison: e.statuses.poison + potion.value } }
            : e
        )
      );
    }
  };

  // End Player Turn & Execute Staged Multi-Step Enemy Phase Choreography
  const handleEndTurn = () => {
    if (turn !== 'player') return;
    sound.playClick();
    setHoveredHandIdx(null);
    setTurn('enemy');

    // Immediately sweep all remaining hand cards into the Discard Pile with Spring Physics
    hand.forEach((c) => {
      cardExitModeMapRef.current[c.uid] = c.id === 'shiv' ? 'exhaust' : 'discard';
    });
    const endTurnDiscardPile = [
      ...discardPile,
      ...hand.filter((c) => c.id !== 'shiv'),
    ];
    if (hand.length > 0) {
      triggerHandMotionFeedback('discard');
    }
    setHand([]);
    setDiscardPile(endTurnDiscardPile);

    let currentBlock = playerBlock;
    let currentHp = hp;
    const localPlayerStatuses = { ...playerStatuses };
    let nextEnemies = enemies.map((e) => ({
      ...e,
      statuses: { ...e.statuses },
    }));
    const updatedOrbs = orbs.map((o) => ({ ...o }));

    const waitMs = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const executeStagedEnemyPhase = async () => {
      // Phase 0: End-of-Turn Armor & Mage Elemental Orbs Resonance
      if (localPlayerStatuses.metallicize > 0) {
        currentBlock += localPlayerStatuses.metallicize;
      }
      if (hasRelic('orichalcum') && currentBlock === 0) {
        currentBlock += 7;
      }
      setPlayerBlock(currentBlock);

      if (updatedOrbs.length > 0) {
        setEnemyTurnStepBanner({
          stepIndex: 0,
          totalSteps: nextEnemies.filter((e) => e.hp > 0).length,
          actorName: '星界法球矩阵',
          actionTitle: `触发 ${updatedOrbs.length} 枚元素充能球回合结算`,
          actionDetail: '自动释放元素轰击与冰霜护盾',
          actionType: 'orb_phase',
          phaseState: 'impact',
        });
        setPlayerUnitAnim('cast_spell');

        updatedOrbs.forEach((orb) => {
          const effectivePassive = Math.max(
            0,
            orb.passiveValue + localPlayerStatuses.focus
          );
          if (orb.type === 'frost') {
            currentBlock += effectivePassive;
            setPlayerBlock(currentBlock);
          } else if (orb.type === 'dark') {
            orb.evokeValue += effectivePassive;
          } else {
            const aliveIdx = nextEnemies.findIndex((e) => e.hp > 0);
            if (aliveIdx !== -1) {
              let dmg = effectivePassive;
              const en = nextEnemies[aliveIdx];
              if (en.block > 0) {
                const abs = Math.min(en.block, dmg);
                en.block -= abs;
                dmg -= abs;
              }
              en.hp = Math.max(0, en.hp - dmg);
              setArenaProjectileVfx({
                id: Date.now() + Math.random(),
                direction: 'player_to_enemy',
                style: orb.type === 'fire' ? 'fireball' : 'lightning_bolt',
                label: `元素法球 -${effectivePassive}`,
                targetEnemyIdx: aliveIdx,
              });
              setEnemyVfx({
                idx: aliveIdx,
                type: orb.type === 'fire' ? 'fire' : 'lightning',
                text: `-${effectivePassive}`,
              });
            }
          }
        });
        setOrbs(updatedOrbs);
        nextEnemies = checkAndTriggerBossBerserk(nextEnemies);
        setEnemies([...nextEnemies]);
        await waitMs(480);
        setArenaProjectileVfx(null);
        setEnemyVfx(null);
        setPlayerUnitAnim('idle');
      }

      if (nextEnemies.every((e) => e.hp <= 0)) {
        setEnemyTurnStepBanner(null);
        setActiveActingEnemyIdx(null);
        setEnemies(nextEnemies);
        setTimeout(() => handleCombatVictory(currentHp), 300);
        return;
      }

      // Display Slay-the-Spire style Large Centered 'Enemy Turn / 敌人回合' Banner before enemies act
      triggerTurnPhaseBanner(
        'enemy',
        turnNumber,
        `第 ${turnNumber} 回合 · 敌方行动阶段`,
        1100
      );
      await waitMs(880);

      const livingEnemyIndices = nextEnemies
        .map((_, idx) => idx)
        .filter((idx) => nextEnemies[idx].hp > 0);

      // Sequential Enemy Phase: Each enemy goes through DoT -> Windup/Cast -> Attack/Spell Projectile -> Impact
      for (let stepIdx = 0; stepIdx < livingEnemyIndices.length; stepIdx++) {
        const eIdx = livingEnemyIndices[stepIdx];
        const enemy = nextEnemies[eIdx];
        if (!enemy || enemy.hp <= 0) continue;

        setActiveActingEnemyIdx(eIdx);
        enemy.block = 0;
        setEnemies([...nextEnemies]);

        // Sub-step 1: Poison & Burn DoT Settlement
        if (enemy.statuses.poison > 0 || enemy.statuses.burn > 0) {
          const pDmg = enemy.statuses.poison + enemy.statuses.burn;
          setEnemyTurnStepBanner({
            stepIndex: stepIdx + 1,
            totalSteps: livingEnemyIndices.length,
            actorName: enemy.name,
            actionTitle: '持续异常状态发作',
            actionDetail: [
              enemy.statuses.poison > 0 ? `剧毒 -${enemy.statuses.poison}` : '',
              enemy.statuses.burn > 0 ? `灼烧 -${enemy.statuses.burn}` : '',
            ]
              .filter(Boolean)
              .join(' · '),
            actionType: 'status_dot',
            phaseState: 'impact',
          });
          sound.playHit();
          enemy.hp = Math.max(0, enemy.hp - pDmg);
          if (enemy.statuses.poison > 0) {
            enemy.statuses.poison = Math.max(0, enemy.statuses.poison - 1);
          }
          if (enemy.statuses.burn > 0) {
            enemy.statuses.burn = Math.max(0, enemy.statuses.burn - 1);
          }
          setEnemyUnitAnimMap((prev) => ({ ...prev, [eIdx]: 'hit_recoil' }));
          setEnemyVfx({
            idx: eIdx,
            type: enemy.statuses.burn > 0 ? 'fire' : 'poison',
            text: `-${pDmg}`,
          });
          nextEnemies = checkAndTriggerBossBerserk(nextEnemies);
          setEnemies([...nextEnemies]);
          await waitMs(500);
          setEnemyVfx(null);
          setEnemyUnitAnimMap((prev) => ({ ...prev, [eIdx]: 'idle' }));

          if (nextEnemies[eIdx].hp <= 0) {
            continue;
          }
        }

        const currentEnemy = nextEnemies[eIdx];
        const intent =
          currentEnemy.intents[
            currentEnemy.intentIndex % currentEnemy.intents.length
          ];
        const isAttackIntent = Boolean(intent.damage && intent.damage > 0);

        // Sub-step 2: Enemy Wind-Up / Spell Chant Preparation
        setEnemyUnitAnimMap((prev) => ({
          ...prev,
          [eIdx]: isAttackIntent ? 'windup' : 'cast_spell',
        }));
        setEnemyTurnStepBanner({
          stepIndex: stepIdx + 1,
          totalSteps: livingEnemyIndices.length,
          actorName: currentEnemy.name,
          actionTitle: isAttackIntent ? '蓄力锁定中...' : '吟唱战技秘术...',
          actionDetail: intent.label,
          actionType: intent.type,
          phaseState: 'windup',
        });
        await waitMs(460);

        // Sub-step 3: Execute Block / Attack / Spell Buff / Curse Debuff with full VFX
        setEnemyTurnStepBanner({
          stepIndex: stepIdx + 1,
          totalSteps: livingEnemyIndices.length,
          actorName: currentEnemy.name,
          actionTitle: intent.label,
          actionDetail: isAttackIntent
            ? '发动凶猛攻势！'
            : intent.block
            ? `构筑防御壁垒 +${intent.block}`
            : '施放秘术效果！',
          actionType: intent.type,
          phaseState: 'impact',
        });

        if (intent.block) {
          sound.playBlock();
          currentEnemy.block += intent.block;
          setEnemyUnitAnimMap((prev) => ({ ...prev, [eIdx]: 'shield_up' }));
          setEnemyVfx({
            idx: eIdx,
            type: 'shield',
            text: `+${intent.block}🛡️`,
          });
          setEnemies([...nextEnemies]);
          await waitMs(480);
          setEnemyVfx(null);
        }

        if (intent.damage) {
          sound.playAttack();
          const hits = intent.hits || 1;
          let totalRaw = 0;
          let totalAbsorbed = 0;
          let totalUnblocked = 0;

          setEnemyUnitAnimMap((prev) => ({ ...prev, [eIdx]: 'attack_lunge' }));
          setArenaProjectileVfx({
            id: Date.now() + Math.random(),
            direction: 'enemy_to_player',
            style: currentEnemy.tier === 'boss' ? 'dark_beam' : 'abyss_claw',
            label: `${intent.label}`,
            targetEnemyIdx: eIdx,
          });

          for (let h = 0; h < hits; h++) {
            let dmg = intent.damage + currentEnemy.statuses.strength;
            if (currentEnemy.statuses.weak > 0) {
              dmg = Math.floor(dmg * 0.75);
            }
            if (localPlayerStatuses.vulnerable > 0) {
              dmg = Math.floor(dmg * 1.5);
            }
            dmg = Math.max(0, dmg);
            totalRaw += dmg;

            if (currentBlock > 0) {
              const absorbed = Math.min(currentBlock, dmg);
              currentBlock -= absorbed;
              dmg -= absorbed;
              totalAbsorbed += absorbed;
            }
            currentHp = Math.max(0, currentHp - dmg);
            totalUnblocked += dmg;

            if (localPlayerStatuses.thorns > 0) {
              currentEnemy.hp = Math.max(
                0,
                currentEnemy.hp - localPlayerStatuses.thorns
              );
            }
          }

          if (totalUnblocked > 0) {
            sound.playHit();
          } else {
            sound.playBlock();
          }

          setHp(currentHp);
          setPlayerBlock(currentBlock);
          setPlayerUnitAnim(totalUnblocked > 0 ? 'hit_recoil' : 'shield_up');
          setArenaHitShake(
            totalUnblocked >= 14 ? 'heavy' : totalRaw > 0 ? 'light' : 'none'
          );
          setPlayerImpactVfx({
            id: Date.now(),
            type: totalUnblocked > 0 ? 'damage' : 'block',
            text:
              totalUnblocked > 0
                ? `-${totalUnblocked} HP`
                : `🛡️ 完美格挡 (${totalAbsorbed})`,
            subtext:
              totalUnblocked > 0 && totalAbsorbed > 0
                ? `护甲抵消了 ${totalAbsorbed} 点伤害`
                : `${currentEnemy.name} 攻击命中`,
          });

          if (localPlayerStatuses.thorns > 0) {
            setEnemyVfx({
              idx: eIdx,
              type: 'slash',
              text: `-${localPlayerStatuses.thorns * hits} 荆棘`,
            });
          }

          nextEnemies = checkAndTriggerBossBerserk(nextEnemies);
          setEnemies([...nextEnemies]);
          await waitMs(680);
          setArenaProjectileVfx(null);
          setPlayerImpactVfx(null);
          setEnemyVfx(null);
          setPlayerUnitAnim('idle');
          setArenaHitShake('none');
        }

        if (intent.statusName && intent.statusAmount) {
          if (intent.type === 'buff') {
            sound.playPower();
            setEnemyUnitAnimMap((prev) => ({ ...prev, [eIdx]: 'cast_spell' }));
            currentEnemy.statuses[intent.statusName] += intent.statusAmount;
            setEnemyVfx({
              idx: eIdx,
              type: 'fire',
              text: `⚡ ${intent.label}`,
            });
            setEnemies([...nextEnemies]);
            await waitMs(520);
            setEnemyVfx(null);
          } else {
            sound.playHit();
            setEnemyUnitAnimMap((prev) => ({ ...prev, [eIdx]: 'cast_spell' }));
            if (!intent.damage) {
              setArenaProjectileVfx({
                id: Date.now() + Math.random(),
                direction: 'enemy_to_player',
                style: 'dark_beam',
                label: intent.label,
                targetEnemyIdx: eIdx,
              });
            }
            localPlayerStatuses[intent.statusName] += intent.statusAmount;
            setPlayerStatuses({ ...localPlayerStatuses });
            setPlayerUnitAnim('hit_recoil');
            setPlayerImpactVfx({
              id: Date.now(),
              type: 'debuff',
              text: `⚠️ ${intent.label}`,
              subtext: `${currentEnemy.name} 施加减益诅咒`,
            });
            await waitMs(560);
            setArenaProjectileVfx(null);
            setPlayerImpactVfx(null);
            setPlayerUnitAnim('idle');
          }
        }

        if (currentEnemy.hp > 0) {
          if (currentEnemy.statuses.metallicize > 0) {
            currentEnemy.block += currentEnemy.statuses.metallicize;
          }
          if (currentEnemy.statuses.ritual > 0) {
            currentEnemy.statuses.strength += currentEnemy.statuses.ritual;
          }
          if (currentEnemy.statuses.vulnerable > 0) {
            currentEnemy.statuses.vulnerable -= 1;
          }
          if (currentEnemy.statuses.weak > 0) {
            currentEnemy.statuses.weak -= 1;
          }
          currentEnemy.intentIndex =
            (currentEnemy.intentIndex + 1) % currentEnemy.intents.length;
        }

        setEnemyUnitAnimMap((prev) => ({ ...prev, [eIdx]: 'idle' }));
        setEnemies([...nextEnemies]);
        await waitMs(200);

        if (currentHp <= 0) {
          break;
        }
      }

      setActiveActingEnemyIdx(null);
      setEnemyTurnStepBanner(null);

      const checkedAfterTurn = checkAndTriggerBossBerserk(nextEnemies);
      setEnemies(checkedAfterTurn);
      setHp(currentHp);

      if (currentHp <= 0) {
        if (onRecordRunEnd) {
          onRecordRunEnd(
            false,
            currentFloor,
            currentAct,
            deck.length,
            relics.length
          );
        }
        triggerRoomTransition('gameover', '💀 登塔陨落', '', 'venom_skull');
        return;
      }

      if (checkedAfterTurn.every((e) => e.hp <= 0)) {
        handleCombatVictory(currentHp);
        return;
      }

      const retained =
        localPlayerStatuses.retainBlock > 0
          ? Math.min(currentBlock, localPlayerStatuses.retainBlock)
          : 0;

      // Loop Orb (循环回路): Trigger rightmost orb's passive at start of turn
      let loopExtraBlock = 0;
      if (localPlayerStatuses.loopOrb > 0 && updatedOrbs.length > 0) {
        const firstOrb = updatedOrbs[0];
        const effVal = Math.max(
          0,
          firstOrb.passiveValue + localPlayerStatuses.focus
        );
        for (let l = 0; l < localPlayerStatuses.loopOrb; l++) {
          if (firstOrb.type === 'frost') {
            loopExtraBlock += effVal;
          } else if (firstOrb.type === 'dark') {
            firstOrb.evokeValue += effVal;
          } else {
            const aliveEn = checkedAfterTurn.find((e) => e.hp > 0);
            if (aliveEn) {
              let dmg = effVal;
              if (aliveEn.block > 0) {
                const abs = Math.min(aliveEn.block, dmg);
                aliveEn.block -= abs;
                dmg -= abs;
              }
              aliveEn.hp = Math.max(0, aliveEn.hp - dmg);
            }
          }
        }
        setOrbs([...updatedOrbs]);
      }

      // Noxious Fumes (致命毒雾): Apply poison to all enemies at start of turn
      if (localPlayerStatuses.noxiousFumes > 0) {
        const snakeBonus = hasRelic('snecko_skull') ? 1 : 0;
        checkedAfterTurn.forEach((en) => {
          if (en.hp > 0) {
            en.statuses.poison += localPlayerStatuses.noxiousFumes + snakeBonus;
          }
        });
        setEnemies([...checkedAfterTurn]);
      }

      const nextTurnNum = turnNumber + 1;
      setPlayerBlock(retained + loopExtraBlock);
      setEnergy(computedMaxEnergy);
      setCardsPlayedThisTurn(0);
      setAttacksPlayedThisTurn(0);
      setCardsDiscardedThisTurn(0);
      setTurnNumber(nextTurnNum);

      if (localPlayerStatuses.swordMastery > 0) {
        setSwordIntent((s) => s + localPlayerStatuses.swordMastery);
      }

      setPlayerStatuses({
        ...localPlayerStatuses,
        strength: localPlayerStatuses.strength + localPlayerStatuses.ritual,
        vulnerable: Math.max(0, localPlayerStatuses.vulnerable - 1),
        weak: Math.max(0, localPlayerStatuses.weak - 1),
      });

      let nextDiscard = [...endTurnDiscardPile];
      let nextDraw = [...drawPile];
      const newHand: Card[] = [];

      for (let i = 0; i < 5; i++) {
        if (nextDraw.length === 0 && nextDiscard.length > 0) {
          nextDraw = shuffleArray(nextDiscard);
          nextDiscard = [];
        }
        if (nextDraw.length > 0) {
          newHand.push(nextDraw[0]);
          nextDraw = nextDraw.slice(1);
        }
      }

      if (localPlayerStatuses.infiniteBlades > 0) {
        for (let s = 0; s < localPlayerStatuses.infiniteBlades; s++) {
          newHand.push(instantiateCard('shiv'));
        }
      }

      setTurn('player');
      // Display Slay-the-Spire style Large Centered 'Player Turn / 玩家回合' Banner & chime
      triggerTurnPhaseBanner(
        'player',
        nextTurnNum,
        `第 ${nextTurnNum} 回合 · 能量已充能 · 抽牌阶段`,
        1250
      );
      await waitMs(340);

      triggerHandMotionFeedback('draw', newHand);
      setHand(newHand);
      setDrawPile(nextDraw);
      setDiscardPile(nextDiscard);
    };

    executeStagedEnemyPhase();
  };

  // Event Choice Execution
  const handleSelectEventChoice = (choice: GameEventChoice) => {
    if (choice.goldChange && choice.goldChange < 0 && gold < Math.abs(choice.goldChange)) {
      return;
    }
    sound.playClick();
    if (choice.maxHpChange) {
      setMaxHp((m) => m + choice.maxHpChange!);
    }
    if (choice.hpChange) {
      setHp((h) => Math.max(1, Math.min(maxHp + (choice.maxHpChange || 0), h + choice.hpChange!)));
    }
    if (choice.goldChange) {
      setGold((g) => Math.max(0, g + choice.goldChange!));
    }
    if (choice.removeRandomCard && deck.length > 5) {
      setDeck((prev) => prev.slice(1));
    }
    if (choice.upgradeRandomCard) {
      const upgradableIndices = deck
        .map((c, idx) => (!c.upgraded ? idx : -1))
        .filter((idx) => idx !== -1);
      if (upgradableIndices.length > 0) {
        sound.playForgeUpgrade();
        const pickIdx = upgradableIndices[Math.floor(Math.random() * upgradableIndices.length)];
        const targetCard = deck[pickIdx];
        const newCost =
          targetCard.upgradedCost !== undefined
            ? targetCard.upgradedCost
            : targetCard.cost;
        const upgradedInstance: Card = {
          ...targetCard,
          upgraded: true,
          cost: newCost,
        };
        setDeck((prev) =>
          prev.map((c, i) => (i === pickIdx ? upgradedInstance : c))
        );
        setUpgradingCardUid(upgradedInstance.uid);
        setUpgradedCardSummary({
          card: upgradedInstance,
          oldDamage: targetCard.effects.damage,
          newDamage: targetCard.upgradedEffects.damage,
          oldBlock: targetCard.effects.block,
          newBlock: targetCard.upgradedEffects.block,
          oldCost: targetCard.cost,
          newCost,
        });
      }
    }
    if (choice.gainRelic) {
      const unowned = RELICS_POOL.filter(
        (r) => !relics.some((o) => o.id === r.id) && !r.classSpecific && r.tier !== 'boss'
      );
      if (unowned.length > 0) {
        setRelics((prev) => [...prev, shuffleArray(unowned)[0]]);
      }
    }
    if (choice.gainRandomCard) {
      const pool = ALL_CARDS.filter(
        (c) => c.classType === playerClass && c.rarity !== 'starter'
      );
      const picked = shuffleArray(pool)[0];
      if (picked) {
        setDeck((prev) => [...prev, instantiateCard(picked.id, Boolean(choice.upgradeRandomCard))]);
      }
    }
    setEventOutcome(choice.outcomeText);
  };

  const selectedEnemy = enemies[selectedEnemyIdx] || enemies.find((e) => e.hp > 0);
  const actNameLabel =
    currentAct === 1
      ? '第一幕·地牢'
      : currentAct === 2
      ? '第二幕·星界'
      : '第三幕·王座';

  return (
    <div className="w-full min-h-screen bg-[#0c1017] flex flex-col select-none relative overflow-x-hidden">
      {/* 全局延续主封面的尖塔风暴云海与余烬魂火背景 (非战斗界面全景呈现) */}
      {roomView !== 'combat' && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <SpireStormBackdrop variant={roomView === 'map' || showMapOverlay ? 'map' : 'ui'} />
        </div>
      )}

      {/* 全局黑幕渐入渐出过场动画 */}
      <ScreenTransitionOverlay
        active={transitionInfo.active}
        title={transitionInfo.title}
        subtitle={transitionInfo.subtitle}
        iconType={transitionInfo.iconType}
      />

      {/* ==================== 顶部暗黑石刻金边状态栏 + 悬浮遗物排 (TOP STATUS BAR + RELIC STRIP) ==================== */}
      <div className="sticky top-0 z-40 w-full flex flex-col pointer-events-none">
        {/* 第一行：主封面同款石刻金边状态栏 */}
        <header className="pointer-events-auto w-full h-13 bg-gradient-to-b from-[#2a3640] via-[#1c252c] to-[#12171d] border-b-2 border-[#b89b72]/80 px-4 flex items-center justify-between gap-2 shadow-[0_6px_18px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(254,240,138,0.22)]">
          {/* 左侧：主封面同款石刻尖塔徽章 + 玩家名 + 职业名 + 生命值 + 金币 + 3个药水栏位 */}
          <div className="flex items-center gap-3.5 md:gap-5">
            {/* 玩家石刻徽章与昵称 */}
            <div className="flex items-center gap-2.5 pr-1">
              <div className="w-8 h-9 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 border border-amber-400/80 rounded-b-lg flex items-center justify-center shadow-[0_3px_6px_rgba(0,0,0,0.8)] shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-slate-950 stroke-amber-300 stroke-[1.6]">
                  <polygon points="12,2 16,9 12,15 8,9" />
                  <polygon points="6,13 9,17 6,21 3,17" />
                  <polygon points="18,13 21,17 18,21 15,17" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-base md:text-lg font-black text-amber-300 tracking-wide drop-shadow-[0_2px_2px_#000]">
                  {playerName}
                </span>
                <span className="text-xs font-bold text-sky-200/90 hidden sm:inline drop-shadow-[0_1px_2px_#000]">
                  · {classInfo.name}
                </span>
              </div>
            </div>

            {/* 生命值 (红心 + 当前/上限) */}
            <div className="flex items-center gap-1.5" title="当前生命值 / 最大生命值">
              <div className="relative w-6 h-6 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-[0_2px_3px_#000]">
                  <path
                    d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2.3 0 4 1.2 5 3 1-1.8 2.7-3 5-3 4 0 6.5 4 4.5 8-2.5 4.5-9.5 9-9.5 9z"
                    fill="#ef4444"
                    stroke="#450a0a"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="font-mono font-black text-base md:text-lg text-[#f87171] tracking-tight drop-shadow-[0_2px_2px_#000]">
                {hp}/{maxHp}
              </span>
            </div>

            {/* 金币袋 + 数量 */}
            <div className="flex items-center gap-1.5" title="持有金币">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-[0_2px_3px_#000]">
                  <path
                    d="M9 4h6l-1 3h-4L9 4zm-3 5c0-1 2-2 6-2s6 1 6 2c2 3 3 7 1 10-1.5 2-4.5 2-7 2s-5.5 0-7-2c-2-3-1-7 1-10z"
                    fill="#eab308"
                    stroke="#422006"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <span className="font-mono font-black text-base md:text-lg text-[#facc15] drop-shadow-[0_2px_2px_#000]">
                {gold}
              </span>
            </div>

            {/* 药水腰带（3个槽位） */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700/80">
              {[0, 1, 2].map((slotIdx) => {
                const pot = potions[slotIdx];
                if (!pot) {
                  return (
                    <div
                      key={slotIdx}
                      title="空药水栏位"
                      className="w-8 h-8 rounded-full bg-[#11161d] border border-[#334155]/70 flex items-center justify-center opacity-50 shadow-inner"
                    >
                      <div className="w-3.5 h-3.5 rounded-full border border-dashed border-slate-600" />
                    </div>
                  );
                }
                return (
                  <button
                    key={`${pot.id}_${slotIdx}`}
                    type="button"
                    onClick={() => handleUsePotion(pot, slotIdx)}
                    className="group relative w-8 h-8 rounded-full bg-[#141c24] border border-emerald-400/80 hover:border-yellow-300 hover:scale-110 transition flex items-center justify-center cursor-pointer shadow-[0_2px_4px_#000]"
                  >
                    <PotionBottleSprite effectType={pot.effectType} className="w-6 h-6" />
                    <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-2 w-52 p-2.5 bg-[#0f141c] border-2 border-emerald-400 text-xs text-slate-200 z-50 shadow-2xl pointer-events-none text-left">
                      <div className="font-black text-emerald-300">{pot.name}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        {pot.description}
                      </div>
                      <div className="text-[10px] text-amber-300 mt-1 font-bold">
                        {roomView === 'combat' ? '点击立即饮用' : '可在战斗中点击使用'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 中央：当前攀登层数 + 幕次名称 + 进阶等级 */}
          <div className="hidden lg:flex items-center gap-5">
            <div className="flex items-center gap-1.5" title="当前所在层数">
              <svg viewBox="0 0 24 24" className="w-6 h-6 drop-shadow-[0_2px_2px_#000]">
                <path
                  d="M4 18h4v-4h4v-4h4V6h4v14H4v-2z"
                  fill="#94a3b8"
                  stroke="#0f172a"
                  strokeWidth="1.8"
                />
              </svg>
              <span className="font-mono font-black text-lg text-[#f1f5f9] drop-shadow-[0_2px_2px_#000]">
                {Math.max(1, currentFloor)}
              </span>
              <span className="text-xs font-bold text-[#cbd5e1] ml-1">
                ({actNameLabel})
              </span>
            </div>

            {ascension > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 bg-red-950/60 border border-amber-500/60 rounded"
                title={`当前进阶等级 ${ascension}`}
              >
                <span className="text-sm">🔥</span>
                <span className="font-mono font-black text-sm text-amber-300">
                  {ascension}
                </span>
              </div>
            )}
          </div>

          {/* 右侧：流派成型度雷达 + 流派图鉴 + 地图卷轴按钮 + 牌组数量徽章 + 音效与设置退出 */}
          <div className="flex items-center gap-2.5">
            {/* 实时构筑成熟度与共鸣阶段徽章 (点击打开流派图鉴并定位当前成型路线) */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setInRunComboId(buildMaturity.primary.combo.id);
                setModalMode('compendium');
              }}
              title={`${buildMaturity.primary.combo.title} · ${buildMaturity.primary.stageLabel}\n${buildMaturity.primary.resonanceBonusText}\n点击查看成型路线与缺失核心卡`}
              className={`hidden md:flex items-center gap-2 px-2.5 py-1 border text-xs font-black cursor-pointer transition shadow-[0_2px_4px_#000] ${
                buildMaturity.primary.resonanceTier >= 2
                  ? 'bg-gradient-to-r from-amber-950 via-yellow-900/80 to-amber-950 border-yellow-300 text-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                  : buildMaturity.primary.resonanceTier === 1
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200'
                  : 'bg-[#17202b] border-slate-600 text-slate-300 hover:border-amber-400/70'
              }`}
            >
              <span>
                {buildMaturity.primary.resonanceTier >= 2
                  ? '👑'
                  : buildMaturity.primary.resonanceTier === 1
                  ? '⚡'
                  : '🧭'}
              </span>
              <span className="truncate max-w-[115px]">
                {buildMaturity.primary.combo.shortTag}
              </span>
              <span className="px-1.5 py-0.2 bg-black/60 border border-current/40 font-mono text-[10px]">
                {buildMaturity.primary.score}%
              </span>
            </button>

            {/* 流派组合 & 图鉴快捷按钮 */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setInRunComboId(buildMaturity.primary.combo.id);
                setModalMode('compendium');
              }}
              title="查看职业流派推荐组合与卡牌图鉴"
              className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] border border-amber-400/70 text-xs font-black text-amber-300 flex items-center gap-1 cursor-pointer transition shadow-[0_2px_4px_#000]"
            >
              <span>📖</span>
              <span className="hidden sm:inline">流派图鉴</span>
            </button>

            {/* 地图切换按钮 (点击可在任意界面展开/收起羊皮纸地图) */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                if (roomView === 'map') return;
                setShowMapOverlay((prev) => !prev);
              }}
              title="查看尖塔路线地图"
              className={`relative w-9 h-9 rounded flex items-center justify-center border transition cursor-pointer ${
                roomView === 'map' || showMapOverlay
                  ? 'bg-amber-500/20 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                  : 'bg-[#1a222d] hover:bg-[#263140] border-slate-600'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zm6-2v14m6-12v14"
                  fill="#d6b887"
                  stroke="#3b2614"
                  strokeWidth="2"
                />
              </svg>
            </button>

            {/* 牌组图标 + 右下角数字角标 */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setModalMode('deck');
              }}
              title={`查看当前牌组 (${deck.length} 张)`}
              className="relative w-10 h-9 rounded bg-[#1a222d] hover:bg-[#263140] border border-slate-600 hover:border-amber-300 flex items-center justify-center cursor-pointer transition"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <rect x="4" y="4" width="12" height="16" rx="1.5" fill="#7c2d12" stroke="#fde047" strokeWidth="1.5" />
                <rect x="8" y="2" width="12" height="16" rx="1.5" fill="#b91c1c" stroke="#fef08a" strokeWidth="1.5" />
              </svg>
              <span className="absolute -bottom-1 -right-1 px-1 min-w-[18px] h-[18px] rounded-full bg-slate-950 border border-amber-400 font-mono font-black text-[11px] text-white flex items-center justify-center shadow">
                {deck.length}
              </span>
            </button>

            {/* 静音切换 */}
            <button
              type="button"
              onClick={() => {
                const next = sound.toggleMute();
                setSoundMuted(next);
              }}
              title={soundMuted ? '开启音效' : '静音'}
              className="w-9 h-9 rounded bg-[#1a222d] hover:bg-[#263140] border border-slate-600 flex items-center justify-center text-sm cursor-pointer transition"
            >
              {soundMuted ? '🔇' : '🔊'}
            </button>

            {/* 齿轮设置 / 返回主界面 */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onExitToMenu();
              }}
              title="返回主界面"
              className="w-9 h-9 rounded bg-[#1a222d] hover:bg-red-950/80 border border-slate-600 hover:border-red-400 flex items-center justify-center cursor-pointer transition"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.5 4c0-.5-.1-1-.2-1.5l2-1.6-2-3.4-2.4 1c-.8-.6-1.7-1.1-2.7-1.5L14.8 2h-5.6l-.4 3c-1 .4-1.9.9-2.7 1.5l-2.4-1-2 3.4 2 1.6c-.1.5-.2 1-.2 1.5s.1 1 .2 1.5l-2 1.6 2 3.4 2.4-1c.8.6 1.7 1.1 2.7 1.5l.4 3h5.6l.4-3c1-.4 1.9-.9 2.7-1.5l2.4 1 2-3.4-2-1.6c.1-.5.2-1 .2-1.5z"
                  fill="#cbd5e1"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* 第二行：左上角悬浮遗物图标栏 */}
        <div className="pointer-events-auto px-4 pt-1.5 flex flex-wrap items-center gap-2">
          {relics.map((relic) => (
            <div
              key={relic.id}
              className="group relative w-10 h-10 rounded-full bg-[#131820]/90 border-2 border-[#786242] hover:border-amber-300 hover:scale-110 flex items-center justify-center cursor-help transition-all shadow-[0_4px_8px_rgba(0,0,0,0.85)]"
            >
              <RelicPixelArt iconType={relic.iconType} className="w-7 h-7" />
              <div className="hidden group-hover:block absolute left-0 top-full mt-2 w-60 p-3 bg-[#0f141c] border-2 border-amber-400 text-xs text-slate-200 z-50 shadow-2xl pointer-events-none">
                <div className="font-black text-amber-300 mb-1 text-sm">{relic.name}</div>
                <div className="text-xs text-slate-300 leading-relaxed">{relic.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== 0. 视觉塔罗牌式【古鲸赐福】三选一 (NEOW BLESSING) ==================== */}
      {roomView === 'blessing' && !showMapOverlay && (
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          <div className="relative w-full max-w-5xl pixel-panel-gold p-8 overflow-hidden flex flex-col items-center justify-center gap-7 min-h-[540px]">
            <ParticleCanvas theme="arcane" />

            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span className="px-4 py-1 bg-slate-950/90 border-2 border-cyan-400 text-xs font-black text-cyan-300 tracking-widest">
                🐋 远古巨鲸【涅奥】的开局秘宝
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-wider spire-title-gold">
                选择 1 项命运赐福开启高塔征程
              </h2>
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-8">
              {blessingsOffered.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleChooseBlessing(b)}
                  className="group relative w-56 h-80 bg-gradient-to-b from-indigo-950 via-slate-950 to-slate-950 border-[3px] border-amber-400 hover:border-yellow-200 hover:-translate-y-4 hover:scale-105 transition-all p-4 flex flex-col items-center justify-between cursor-pointer shadow-[0_12px_0_#020617,0_0_30px_rgba(251,191,36,0.35)]"
                >
                  <div className="w-full py-1 bg-slate-900 border border-amber-400/60 text-xs font-black text-amber-300">
                    {b.title}
                  </div>

                  <div className="w-32 h-32 rounded-full bg-radial from-cyan-500/30 via-purple-900/20 to-slate-950 border-2 border-cyan-400/70 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[inset_0_0_24px_rgba(0,0,0,0.9)]">
                    <CardPixelArt spriteType={b.iconType} className="w-20 h-20" />
                  </div>

                  <div className="w-full p-2.5 bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-300 leading-snug">
                    {b.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 1. 复古羊皮纸卷轴尖塔地图 + 右侧图例框 (PARCHMENT MAP VIEW & OVERLAY) ==================== */}
      {(roomView === 'map' || showMapOverlay) && (
        <div className="relative z-10 flex-1 w-full flex justify-center items-start px-4 py-3 overflow-hidden">
          {/* 布局容器：中央羊皮纸长卷 + 右侧图例与流派导航 */}
          <div className="relative w-full max-w-[1260px] flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
            {/* 中央：复古羊皮纸地图长卷 (Aged Parchment Scroll) */}
            <div
              ref={mapScrollContainerRef}
              className="relative w-full max-w-[780px] h-[calc(100vh-116px)] min-h-[600px] overflow-y-auto overflow-x-hidden rounded-sm shadow-[0_25px_70px_rgba(0,0,0,0.95),inset_0_0_60px_rgba(92,64,35,0.45)] border-x-[10px] border-y-[6px] border-[#61472c]"
              style={{
                background:
                  'linear-gradient(90deg, #b89b72 0%, #d8c29d 10%, #e4d2b4 50%, #d8c29d 90%, #b3956b 100%)',
              }}
            >
              {/* 羊皮纸内部总高度画布 (15层 + 顶部首领徽章，自下而上攀登) */}
              <div className="relative w-full h-[1240px]">
                {/* 羊皮纸复古纹理网格与暗角 */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-25"
                  style={{
                    backgroundImage:
                      'radial-gradient(#6b4c2b 0.75px, transparent 0.75px), radial-gradient(#85623c 0.75px, #e4d2b4 0.75px)',
                    backgroundSize: '28px 28px',
                    backgroundPosition: '0 0, 14px 14px',
                  }}
                />

                {/* 羊皮纸顶部信息：幕数标题与快捷滚回当前层/挑战首领按钮 */}
                <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-2.5 bg-[#cbb289]/95 border-b-2 border-[#7c5e3c] shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-base text-[#2d1e10] tracking-wider">
                      📜 {actNameLabel} · 攀登路线卷轴（自下而上：第 {(currentAct - 1) * 15 + 1} ➔ {currentAct * 15} 层）
                    </span>
                    <span className="hidden sm:inline px-2 py-0.5 bg-[#3d2916] text-[#f5e6cc] text-[11px] font-bold rounded-sm">
                      当前进度：{actFloor}/15 层
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        const container = mapScrollContainerRef.current;
                        if (!container) return;
                        const targetActFloor = Math.min(15, Math.max(1, actFloor + 1));
                        const bottomPx = (targetActFloor - 1) * 70 + 20;
                        const nodeYFromTop = 1240 - bottomPx - 28;
                        container.scrollTo({
                          top: Math.max(0, nodeYFromTop - container.clientHeight * 0.65),
                          behavior: 'smooth',
                        });
                      }}
                      className="px-2.5 py-1 bg-[#3d2816] hover:bg-[#5c3d22] border border-[#26170c] text-xs font-black text-[#f5e6cc] rounded-sm cursor-pointer shadow transition"
                    >
                      📍 定位当前层
                    </button>

                    {roomView === 'map' && !showMapOverlay && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          const bossFloor = currentAct * 15;
                          setActFloor(15);
                          setCurrentFloor(bossFloor);
                          startCombat('boss', bossFloor);
                        }}
                        className="px-3 py-1 bg-[#7f1d1d] hover:bg-[#991b1b] border border-[#3d0d0d] text-xs font-black text-[#fef08a] rounded-sm cursor-pointer shadow transition"
                      >
                        👑 直入本幕首领战
                      </button>
                    )}
                  </div>
                </div>

                {/* 羊皮纸顶部：本幕终极 Boss 炭笔手绘巨型纹章 */}
                <div className="relative z-10 pt-5 pb-2 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-[#cfb68c] border-[3px] border-[#3d2816] shadow-[inset_0_0_18px_rgba(61,40,22,0.5)] flex items-center justify-center">
                    <MapNodeSprite type="boss" className="w-14 h-14" />
                  </div>
                  <span className="mt-1 text-xs font-black text-[#3d2816] tracking-widest">
                    【第 {currentAct} 幕守关首领 · 第 {currentAct * 15} 层】
                  </span>
                </div>

                {/* SVG 炭笔虚线路径网 (连接 15 层所有节点) */}
                <svg
                  viewBox="0 0 1000 1120"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 bottom-0 w-full h-[1120px] pointer-events-none"
                >
                  {mapFloors.map((floorNodes, fIdx) => {
                    const nextFloorNodes = mapFloors[fIdx + 1] || [];
                    const y1 = 1120 - (fIdx * 70 + 48);
                    const y2 = 1120 - ((fIdx + 1) * 70 + 48);

                    return floorNodes.map((fromNode) => {
                      const x1 = fromNode.xPercent * 10;
                      return fromNode.connections.map((targetId) => {
                        const toNode = nextFloorNodes.find((n) => n.id === targetId);
                        if (!toNode) return null;
                        const x2 = toNode.xPercent * 10;

                        const isTraversed = fromNode.completed && toNode.completed;
                        const isAvailableNext =
                          fromNode.id === currentNodeId &&
                          toNode.actFloor === actFloor + 1;
                        const isHoveredPath =
                          hoveredMapNode?.id === fromNode.id ||
                          hoveredMapNode?.id === toNode.id;

                        const strokeColor = isTraversed
                          ? '#1f140b'
                          : isAvailableNext
                          ? '#b91c1c'
                          : isHoveredPath
                          ? '#92400e'
                          : '#6e563d';

                        return (
                          <line
                            key={`${fromNode.id}->${toNode.id}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={strokeColor}
                            strokeWidth={isTraversed || isAvailableNext ? 4.5 : 2.8}
                            strokeDasharray={isTraversed ? undefined : '9 7'}
                            strokeLinecap="round"
                          />
                        );
                      });
                    });
                  })}
                </svg>

                {/* 15层手绘墨迹地图节点 */}
                <div className="absolute inset-x-0 bottom-0 w-full h-[1120px]">
                  {mapFloors.map((floorNodes, fIdx) => {
                    const floorInAct = fIdx + 1;
                    const globalFloorNum = (currentAct - 1) * 15 + floorInAct;
                    const bottomPx = fIdx * 70 + 20;
                    const isNextFloor = floorInAct === actFloor + 1;

                    const nodeTypeShortBadge: Record<
                      MapNodeType,
                      { text: string; style: string; ring: string }
                    > = {
                      combat: {
                        text: '普通敌',
                        style: 'bg-[#2b1d12] text-[#f5e6cc] border-[#5c4023]',
                        ring: 'border-[#4a3520]',
                      },
                      event: {
                        text: '事件 ?',
                        style: 'bg-[#4c1d95] text-[#f3e8ff] border-[#a855f7]',
                        ring: 'border-[#6b21a8]',
                      },
                      elite: {
                        text: '💀精英',
                        style: 'bg-[#7f1d1d] text-[#fef08a] border-[#ef4444]',
                        ring: 'border-[#991b1b]',
                      },
                      rest: {
                        text: '🔥营地',
                        style: 'bg-[#14532d] text-[#dcfce7] border-[#22c55e]',
                        ring: 'border-[#15803d]',
                      },
                      shop: {
                        text: '💰商店',
                        style: 'bg-[#713f12] text-[#fef08a] border-[#eab308]',
                        ring: 'border-[#a16207]',
                      },
                      treasure: {
                        text: '📦宝箱',
                        style: 'bg-[#78350f] text-[#fde047] border-[#facc15]',
                        ring: 'border-[#b45309]',
                      },
                      boss: {
                        text: '👑首领',
                        style: 'bg-[#450a0a] text-[#fde047] border-[#ef4444]',
                        ring: 'border-[#7f1d1d]',
                      },
                    };

                    return (
                      <React.Fragment key={floorInAct}>
                        {/* 杀戮尖塔标志性特殊层横幅提示：第1层起点、第9层固定宝箱层、第14层Boss前固定篝火层 */}
                        {(floorInAct === 1 || floorInAct === 9 || floorInAct === 14) && (
                          <div
                            style={{ bottom: `${bottomPx + 24}px` }}
                            className="absolute inset-x-16 border-b border-dashed border-[#8c6d49]/70 pointer-events-none flex justify-end pr-2"
                          >
                            <span className="px-2 py-0.5 bg-[#d5be97]/90 text-[#4a3219] text-[10px] font-black tracking-wider">
                              {floorInAct === 1 && '▲ 登塔起点 · 第 1 层固定普通敌'}
                              {floorInAct === 9 && '★ 第 9 层 · 中期固定秘宝层'}
                              {floorInAct === 14 && '🔥 第 14 层 · 首领前固定篝火营地'}
                            </span>
                          </div>
                        )}

                        {/* 左侧羊皮纸手写层数刻度 */}
                        <div
                          style={{ bottom: `${bottomPx + 14}px` }}
                          className={`absolute left-3 px-2 py-0.5 text-xs font-mono font-black rounded-sm ${
                            isNextFloor
                              ? 'bg-[#7f1d1d] text-[#fef08a] border border-[#3d0d0d] shadow'
                              : 'text-[#5c442c]'
                          }`}
                        >
                          {globalFloorNum}F
                        </div>

                        {floorNodes.map((node) => {
                          let reachable = false;
                          if (roomView === 'map' && !showMapOverlay && isNextFloor) {
                            if (!currentNodeId) {
                              reachable = true;
                            } else {
                              const prevFloor = mapFloors[actFloor - 1] || [];
                              const prevNode = prevFloor.find((n) => n.id === currentNodeId);
                              reachable = prevNode
                                ? prevNode.connections.includes(node.id)
                                : true;
                            }
                          }

                          const isCurrentHere = node.id === currentNodeId;
                          const isLegendHighlighted =
                            highlightedLegendType !== null &&
                            node.type === highlightedLegendType;
                          const badgeMeta = nodeTypeShortBadge[node.type];

                          return (
                            <button
                              key={node.id}
                              type="button"
                              disabled={!reachable}
                              onMouseEnter={() => setHoveredMapNode(node)}
                              onMouseLeave={() => setHoveredMapNode(null)}
                              onClick={() => {
                                if (!reachable) return;
                                setShowMapOverlay(false);
                                handleSelectMapNode(node);
                              }}
                              style={{
                                left: `${node.xPercent}%`,
                                bottom: `${bottomPx}px`,
                                transform: 'translateX(-50%)',
                              }}
                              className={`group absolute z-10 w-13 h-13 rounded-full flex items-center justify-center transition-all ${
                                isLegendHighlighted
                                  ? 'bg-[#fef08a] border-[3px] border-[#b91c1c] scale-125 shadow-[0_0_20px_rgba(185,28,28,0.85)]'
                                  : node.completed
                                  ? 'bg-[#b89b72] border-[3.5px] border-[#26170c] shadow-[0_2px_6px_rgba(0,0,0,0.4)]'
                                  : reachable
                                  ? 'bg-[#fdf6e7] border-[3.5px] border-[#b91c1c] hover:scale-125 shadow-[0_0_18px_rgba(185,28,28,0.8)] cursor-pointer animate-bounce'
                                  : `bg-[#ead8b8] border-2 ${badgeMeta.ring} opacity-90 cursor-default`
                              }`}
                            >
                              <MapNodeSprite
                                type={node.type}
                                className={node.type === 'boss' ? 'w-9 h-9' : 'w-7 h-7'}
                              />

                              {/* 底部清晰节点类型微章，一眼区分普通怪/事件?/精英/营地/商店/宝箱 */}
                              <span
                                className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-1.5 py-[1px] text-[9px] font-black whitespace-nowrap border rounded-xs leading-tight shadow-xs ${badgeMeta.style}`}
                              >
                                {badgeMeta.text}
                              </span>

                              {/* 已踏足节点的炭笔圆圈勾号 */}
                              {node.completed && (
                                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#26170c] text-[#f5e6cc] text-[10px] font-black flex items-center justify-center">
                                  ✓
                                </span>
                              )}

                              {/* 当前英雄所在位置手绘标记 */}
                              {isCurrentHere && (
                                <span className="absolute -right-3 -top-2.5 px-1.5 py-0.5 bg-[#991b1b] text-[#fef08a] font-black text-[10px] border border-[#f5e6cc] shadow">
                                  📍当前
                                </span>
                              )}

                              {/* 悬停节点说明签 */}
                              <span className="hidden group-hover:block absolute -top-11 whitespace-nowrap px-2.5 py-1 bg-[#26170c] border border-[#b89b72] text-[11px] font-bold text-[#f5e6cc] z-30 pointer-events-none shadow-lg">
                                {node.name} · {node.subtitle}
                              </span>
                            </button>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 右侧：羊皮纸【图例】框 + 本局流派构筑进度 (Right-Side Legend & Archetype Box) */}
            <div className="w-full lg:w-64 flex flex-col gap-4 shrink-0">
              {/* 羊皮纸图例面板 */}
              <div
                className="w-full p-5 rounded-sm border-[4px] border-[#61472c] shadow-[0_14px_34px_rgba(0,0,0,0.85),inset_0_0_24px_rgba(92,64,35,0.35)] flex flex-col gap-3"
                style={{
                  background:
                    'linear-gradient(180deg, #dfd0b5 0%, #d4be98 50%, #c4aa80 100%)',
                }}
              >
                <h3 className="text-center text-lg font-black text-[#2d1e10] tracking-widest border-b-2 border-[#8c6d49] pb-2">
                  图例
                </h3>

                <div className="flex flex-col gap-2">
                  {(
                    [
                      { type: 'combat' as MapNodeType, label: '普通敌人', desc: '卡牌+金币奖励' },
                      { type: 'event' as MapNodeType, label: '未知事件 (?)', desc: '随机奇遇抉择' },
                      { type: 'elite' as MapNodeType, label: '精英敌人', desc: '6层起·必掉遗物' },
                      { type: 'rest' as MapNodeType, label: '休息处', desc: '回血或升级卡牌' },
                      { type: 'shop' as MapNodeType, label: '商店', desc: '买卡/遗物/删牌' },
                      { type: 'treasure' as MapNodeType, label: '财宝', desc: '第9层固定宝箱' },
                    ] as const
                  ).map((item) => {
                    const isActive = highlightedLegendType === item.type;
                    const countInAct = mapFloors
                      .flat()
                      .filter((n) => n.type === item.type).length;
                    return (
                      <div
                        key={item.type}
                        onMouseEnter={() => setHighlightedLegendType(item.type)}
                        onMouseLeave={() => setHighlightedLegendType(null)}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-sm cursor-pointer transition ${
                          isActive
                            ? 'bg-[#b89b72] border border-[#3d2816] translate-x-1'
                            : 'hover:bg-[#cbb289]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#fdf6e7] border border-[#5c4023] flex items-center justify-center shrink-0">
                            <MapNodeSprite type={item.type} className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-[#2d1e10] leading-tight">
                              {item.label}
                            </span>
                            <span className="text-[10px] font-bold text-[#5c4023] leading-tight">
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 bg-[#3d2816]/15 border border-[#7c5e3c] text-[10px] font-mono font-black text-[#2d1e10]">
                          {countInAct}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] font-bold text-[#5c4023] text-center pt-1 border-t border-[#8c6d49]/60">
                  悬停图标可在地图上高亮对应节点
                </div>
              </div>

              {/* 右下：当前职业流派推荐组合速查 */}
              <div
                className="w-full p-4 rounded-sm border-[3px] border-[#61472c] shadow-[0_10px_28px_rgba(0,0,0,0.8)] flex flex-col gap-2.5"
                style={{
                  background:
                    'linear-gradient(180deg, #27201c 0%, #1a1512 100%)',
                }}
              >
                <div className="text-xs font-black text-amber-300 tracking-wider border-b border-amber-500/30 pb-1.5 flex items-center justify-between">
                  <span>📖 本职业推荐流派</span>
                  <span className="text-[10px] text-slate-400">点击查看</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {RECOMMENDED_ARCHETYPE_COMBOS.filter(
                    (combo) => combo.classType === playerClass
                  ).map((combo) => {
                    const coreOwnedCount = deck.filter((c) =>
                      combo.coreCardIds.includes(c.id)
                    ).length;
                    const supportOwnedCount = deck.filter((c) =>
                      combo.supportCardIds.includes(c.id)
                    ).length;
                    return (
                      <button
                        key={combo.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setInRunComboId(combo.id);
                          setModalMode('compendium');
                        }}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/90 hover:bg-amber-950/60 border border-slate-700 hover:border-amber-400 text-xs transition cursor-pointer"
                      >
                        <span className="font-black text-amber-200 truncate">
                          {combo.name}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-950 border border-amber-400/50 font-mono font-black text-emerald-300 text-[10px]">
                          核心{coreOwnedCount}·组件{supportOwnedCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 左下角：返回燕尾绸带按钮 */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              if (showMapOverlay) {
                setShowMapOverlay(false);
              } else {
                onExitToMenu();
              }
            }}
            className="fixed left-0 bottom-7 z-40 pl-6 pr-10 py-3 bg-gradient-to-r from-[#7f1d1d] via-[#991b1b] to-[#b91c1c] hover:from-[#991b1b] hover:to-[#dc2626] border-y-2 border-r-2 border-amber-400 text-amber-100 font-black text-base tracking-widest shadow-[0_8px_24px_rgba(0,0,0,0.9)] cursor-pointer transition-transform hover:translate-x-1"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 88% 50%, 100% 100%, 0 100%)',
            }}
          >
            {showMapOverlay ? '◀ 返回房间' : '◀ 返回主菜单'}
          </button>
        </div>
      )}

      {/* ==================== 2. 经典高塔开放式地牢战斗舞台 (OPEN CHAMBER COMBAT STAGE + BOTTOM FANNED HAND) ==================== */}
      {roomView === 'combat' && !showMapOverlay && (
        <div
          className={`relative flex-1 w-full min-h-[calc(100vh-100px)] overflow-hidden flex flex-col justify-between transition-all duration-500 ${
            bossTransitioning
              ? 'animate-boss-quake animate-boss-crimson-flash'
              : arenaHitShake === 'heavy'
              ? 'animate-boss-quake'
              : arenaHitShake === 'light'
              ? 'translate-x-[3px] -translate-y-[2px]'
              : bossBerserkActive
              ? 'boss-berserk-arena-filter'
              : ''
          }`}
        >
          {/* 全屏高塔石柱地牢背景 + 地面石砖舞台线 */}
          <img
            src="/src/assets/images/battle_arena_bg_1791769558962.jpg"
            alt="高塔战斗地牢"
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ${
              bossBerserkActive
                ? 'opacity-80 sepia-[0.55] saturate-[2.4] -hue-rotate-30 contrast-125 scale-105'
                : 'opacity-70'
            }`}
            style={{ imageRendering: 'pixelated' }}
            referrerPolicy="no-referrer"
          />

          {/* 暗黑石柱环境渐变与底部石板地面 */}
          <div
            className={`absolute inset-0 pointer-events-none transition-colors duration-700 ${
              bossBerserkActive
                ? 'bg-gradient-to-t from-[#1a0508] via-[#2b0910]/35 to-[#0d0407]/80'
                : 'bg-gradient-to-t from-[#090d14] via-[#111926]/30 to-[#0a0e16]/75'
            }`}
          />
          {/* 角色站立的石砖地面台面 */}
          <div
            className="absolute inset-x-0 bottom-0 h-[270px] pointer-events-none border-t-2 border-[#2d3848]/70"
            style={{
              background:
                'linear-gradient(180deg, rgba(24,32,44,0.78) 0%, rgba(12,17,25,0.96) 55%, rgba(7,10,15,1) 100%)',
            }}
          />

          {/* 动态像素战场背景元素（苍月/血月、古塔石柱/狱火图腾柱、熔岩地刺） */}
          <CombatBackgroundPixelElements
            isBossEncounter={enemies.some((e) => e.tier === 'boss')}
            isBossBerserk={bossBerserkActive}
            act={currentAct}
          />

          <ParticleCanvas
            theme={
              bossBerserkActive
                ? 'crimson_berserk'
                : playerClass === 'warrior'
                ? 'ember'
                : playerClass === 'mage'
                ? 'arcane'
                : 'emerald'
            }
          />

          {/* 杀戮尖塔风格：回合切换大型居中像素横幅动画 (Player Turn / Enemy Turn Fade-In & Fade-Out Banner) */}
          <AnimatePresence>
            {turnPhaseBanner && (
              <motion.div
                key={turnPhaseBanner.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeInOut' }}
                className="absolute inset-x-0 top-[38%] -translate-y-1/2 z-50 pointer-events-none flex items-center justify-center"
              >
                {/* 全宽暗黑渐变横幅底衬 */}
                <motion.div
                  initial={{ scaleY: 0.55, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  exit={{ scaleY: 0.75, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full py-6 md:py-8 relative flex flex-col items-center justify-center overflow-hidden ${
                    turnPhaseBanner.phase === 'player'
                      ? 'bg-gradient-to-r from-transparent via-[#091326]/95 to-transparent shadow-[0_0_70px_rgba(245,158,11,0.35)]'
                      : 'bg-gradient-to-r from-transparent via-[#28060c]/95 to-transparent shadow-[0_0_70px_rgba(220,38,38,0.45)]'
                  }`}
                >
                  {/* 顶部与底部向外延展的像素金边/血色分割线 */}
                  <motion.div
                    initial={{ scaleX: 0.15, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 1.15, opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute top-0 inset-x-12 md:inset-x-32 h-[3px] ${
                      turnPhaseBanner.phase === 'player'
                        ? 'bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_16px_#fbbf24]'
                        : 'bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_16px_#ef4444]'
                    }`}
                  />
                  <motion.div
                    initial={{ scaleX: 0.15, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 1.15, opacity: 0 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute bottom-0 inset-x-12 md:inset-x-32 h-[3px] ${
                      turnPhaseBanner.phase === 'player'
                        ? 'bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_16px_#fbbf24]'
                        : 'bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_16px_#ef4444]'
                    }`}
                  />

                  {/* 内层像素细线装饰 */}
                  <div
                    className={`absolute top-1.5 inset-x-24 md:inset-x-48 h-[1px] ${
                      turnPhaseBanner.phase === 'player'
                        ? 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-red-400/50 to-transparent'
                    }`}
                  />
                  <div
                    className={`absolute bottom-1.5 inset-x-24 md:inset-x-48 h-[1px] ${
                      turnPhaseBanner.phase === 'player'
                        ? 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent'
                        : 'bg-gradient-to-r from-transparent via-red-400/50 to-transparent'
                    }`}
                  />

                  {/* 核心居中大型像素文字与徽章动画 */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.82, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.08, y: -8 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 flex flex-col items-center gap-1.5 px-6"
                  >
                    {/* 顶部回合计数角标 */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rotate-45 border ${
                          turnPhaseBanner.phase === 'player'
                            ? 'bg-amber-300 border-yellow-100 shadow-[0_0_8px_#fbbf24]'
                            : 'bg-red-500 border-red-200 shadow-[0_0_8px_#ef4444]'
                        }`}
                      />
                      <span
                        className={`text-[11px] md:text-xs font-black tracking-[0.35em] uppercase font-mono ${
                          turnPhaseBanner.phase === 'player'
                            ? 'text-amber-300'
                            : 'text-red-300'
                        }`}
                      >
                        TURN {turnPhaseBanner.turnNum} · 第 {turnPhaseBanner.turnNum} 回合
                      </span>
                      <span
                        className={`w-2 h-2 rotate-45 border ${
                          turnPhaseBanner.phase === 'player'
                            ? 'bg-amber-300 border-yellow-100 shadow-[0_0_8px_#fbbf24]'
                            : 'bg-red-500 border-red-200 shadow-[0_0_8px_#ef4444]'
                        }`}
                      />
                    </div>

                    {/* 主视觉：像素图标 + Player Turn / Enemy Turn 大型双语像素字体 */}
                    <div className="flex items-center gap-4 md:gap-6 my-0.5">
                      <div
                        className={`p-2 border-2 shadow-[0_4px_0_#000] ${
                          turnPhaseBanner.phase === 'player'
                            ? 'bg-amber-950/90 border-amber-400'
                            : 'bg-red-950/90 border-red-500'
                        }`}
                      >
                        <CardPixelArt
                          spriteType={
                            turnPhaseBanner.phase === 'player' ? 'sword' : 'venom_skull'
                          }
                          className="w-8 h-8 md:w-10 md:h-10"
                        />
                      </div>

                      <div className="flex flex-col items-center">
                        <div
                          className={`text-3xl md:text-5xl font-black tracking-[0.22em] uppercase font-mono leading-none ${
                            turnPhaseBanner.phase === 'player'
                              ? 'text-amber-100'
                              : 'text-red-100'
                          }`}
                          style={{
                            textShadow:
                              turnPhaseBanner.phase === 'player'
                                ? '0 4px 0 #000, 0 -2px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 0 28px rgba(251,191,36,0.9)'
                                : '0 4px 0 #000, 0 -2px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 0 32px rgba(239,68,68,0.95)',
                          }}
                        >
                          {turnPhaseBanner.titleEn}
                        </div>
                        <div
                          className={`mt-1.5 text-lg md:text-2xl font-black tracking-[0.4em] ${
                            turnPhaseBanner.phase === 'player'
                              ? 'text-amber-300'
                              : 'text-red-400'
                          }`}
                          style={{
                            textShadow: '0 2px 0 #000, 0 0 14px rgba(0,0,0,0.95)',
                          }}
                        >
                          — {turnPhaseBanner.titleCn} —
                        </div>
                      </div>

                      <div
                        className={`p-2 border-2 shadow-[0_4px_0_#000] ${
                          turnPhaseBanner.phase === 'player'
                            ? 'bg-amber-950/90 border-amber-400'
                            : 'bg-red-950/90 border-red-500'
                        }`}
                      >
                        <CardPixelArt
                          spriteType={
                            turnPhaseBanner.phase === 'player' ? 'shield' : 'demon_crown'
                          }
                          className="w-8 h-8 md:w-10 md:h-10"
                        />
                      </div>
                    </div>

                    {/* 底部副标题提示 */}
                    <div
                      className={`mt-1 px-4 py-0.5 border text-[11px] md:text-xs font-bold tracking-widest ${
                        turnPhaseBanner.phase === 'player'
                          ? 'bg-slate-950/85 border-amber-400/60 text-amber-200/95'
                          : 'bg-black/85 border-red-500/60 text-red-200/95'
                      }`}
                    >
                      {turnPhaseBanner.subtitle}
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 敌方阶段分步播报横幅 (Staged Enemy Action Choreography Banner) */}
          <AnimatePresence>
            {enemyTurnStepBanner && (
              <motion.div
                key={`${enemyTurnStepBanner.actorName}-${enemyTurnStepBanner.stepIndex}-${enemyTurnStepBanner.phaseState}`}
                initial={{ opacity: 0, y: -22, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className="absolute top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
              >
                <div
                  className={`px-5 py-2 border-2 shadow-[0_8px_28px_rgba(0,0,0,0.95)] flex items-center gap-3.5 ${
                    enemyTurnStepBanner.phaseState === 'windup'
                      ? 'bg-amber-950/95 border-amber-400 text-amber-200'
                      : enemyTurnStepBanner.actionType === 'attack' ||
                        enemyTurnStepBanner.actionType === 'attack_debuff'
                      ? 'bg-red-950/95 border-red-400 text-red-100'
                      : enemyTurnStepBanner.actionType === 'defend'
                      ? 'bg-sky-950/95 border-sky-400 text-sky-100'
                      : 'bg-purple-950/95 border-purple-400 text-purple-100'
                  }`}
                >
                  <span className="px-2 py-0.5 bg-black/75 border border-current text-[10px] font-black tracking-widest uppercase">
                    {enemyTurnStepBanner.stepIndex > 0
                      ? `敌方行动 ${enemyTurnStepBanner.stepIndex}/${enemyTurnStepBanner.totalSteps}`
                      : '法球共鸣'}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black tracking-wider text-white">
                        {enemyTurnStepBanner.actorName}
                      </span>
                      <span className="text-xs font-extrabold text-amber-300">
                        · {enemyTurnStepBanner.actionTitle}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-bold">
                      {enemyTurnStepBanner.actionDetail}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 跨战场飞弹 / 剑气 / 法术光束轨迹层 (Cross-Arena Attack & Spell Projectile Layer) */}
          <AnimatePresence>
            {arenaProjectileVfx && (
              <motion.div
                key={arenaProjectileVfx.id}
                initial={{
                  opacity: 0,
                  x:
                    arenaProjectileVfx.direction === 'player_to_enemy'
                      ? -210
                      : 210,
                  y:
                    arenaProjectileVfx.direction === 'player_to_enemy'
                      ? 15
                      : -10,
                  scale: 0.65,
                }}
                animate={{
                  opacity: [0, 1, 1, 0.9],
                  x:
                    arenaProjectileVfx.direction === 'player_to_enemy'
                      ? 185
                      : -185,
                  y: 0,
                  scale: [0.75, 1.25, 1.1],
                }}
                exit={{ opacity: 0, scale: 1.45 }}
                transition={{ duration: 0.36, ease: 'easeOut' }}
                className="absolute top-[36%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none flex items-center gap-2"
              >
                <div
                  className={`px-4 py-2 border-2 flex items-center gap-2.5 ${
                    arenaProjectileVfx.style === 'fireball'
                      ? 'bg-orange-950/95 border-orange-400 text-orange-200 shadow-[0_0_35px_rgba(249,115,22,0.95)]'
                      : arenaProjectileVfx.style === 'frost_lance'
                      ? 'bg-cyan-950/95 border-cyan-300 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.95)]'
                      : arenaProjectileVfx.style === 'lightning_bolt'
                      ? 'bg-amber-950/95 border-yellow-300 text-yellow-100 shadow-[0_0_35px_rgba(250,204,21,0.95)]'
                      : arenaProjectileVfx.style === 'venom_dagger'
                      ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200 shadow-[0_0_35px_rgba(16,185,129,0.95)]'
                      : arenaProjectileVfx.style === 'dark_beam' ||
                        arenaProjectileVfx.style === 'abyss_claw'
                      ? 'bg-rose-950/95 border-red-500 text-red-200 shadow-[0_0_38px_rgba(239,68,68,0.95)]'
                      : 'bg-red-950/95 border-amber-400 text-amber-200 shadow-[0_0_32px_rgba(245,158,11,0.9)]'
                  }`}
                >
                  <span className="text-xl">
                    {arenaProjectileVfx.style === 'fireball'
                      ? '🔥'
                      : arenaProjectileVfx.style === 'frost_lance'
                      ? '❄️'
                      : arenaProjectileVfx.style === 'lightning_bolt'
                      ? '⚡'
                      : arenaProjectileVfx.style === 'venom_dagger'
                      ? '🗡️'
                      : arenaProjectileVfx.style === 'dark_beam'
                      ? '☄️'
                      : arenaProjectileVfx.style === 'abyss_claw'
                      ? '🩸'
                      : '⚔️'}
                  </span>
                  <span className="text-xs font-black tracking-widest uppercase">
                    {arenaProjectileVfx.label}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boss 二阶段狂暴转场全屏戏剧横幅 */}
          <AnimatePresence>
            {bossTransitionBanner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.75, y: -30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className="
                  absolute inset-x-6 top-14 z-50 pointer-events-none
                  p-4 bg-gradient-to-r from-red-950/98 via-rose-950/98 to-red-950/98
                  border-4 border-yellow-300 shadow-[0_0_60px_rgba(239,68,68,1),0_10px_0_#000]
                  flex flex-col md:flex-row items-center justify-between gap-4
                "
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-900 border-2 border-yellow-300 animate-bounce">
                    <CardPixelArt spriteType="demon_crown" className="w-12 h-12" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-yellow-300 text-red-950 text-[10px] font-black uppercase tracking-widest">
                        ⚠️ 首领二阶段 · 血量低于 50% 狂暴觉醒
                      </span>
                      <span className="text-xs font-black text-red-300 font-mono">
                        [ 战场环境已异变为猩红血狱 ]
                      </span>
                    </div>
                    <div className="text-lg md:text-xl font-black text-yellow-200 mt-1 drop-shadow-[2px_2px_0_#000]">
                      🔥 {bossTransitionBanner.berserkName}
                    </div>
                    <div className="text-xs font-bold text-red-100 italic mt-0.5">
                      {bossTransitionBanner.quote}
                    </div>
                  </div>
                </div>
                {bossTransitionBanner.buffsText && (
                  <div className="px-3.5 py-2 bg-black/80 border-2 border-red-400 text-xs font-black text-amber-300 font-mono whitespace-nowrap">
                    ⚡ 狂暴增益：{bossTransitionBanner.buffsText}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 顶部中央：回合视觉横幅 + Boss阶段状态指示 */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
            <div
              className={`px-5 py-1 border text-xs font-black tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.85)] ${
                turn === 'player'
                  ? bossBerserkActive
                    ? 'bg-red-950/90 border-yellow-300 text-yellow-200'
                    : 'bg-slate-950/85 border-amber-400/80 text-amber-300'
                  : 'bg-red-950/95 border-red-400 text-red-200 animate-pulse'
              }`}
            >
              {turn === 'player'
                ? `第 ${turnNumber} 回合 · 出牌阶段`
                : '⚠️ 敌方行动阶段 (依次蓄力与施法)'}
            </div>

            {enemies.some(
              (e) =>
                e.tier === 'boss' &&
                e.hp > 0 &&
                (e.phase || 1) === 1 &&
                e.hp > Math.floor(e.maxHp * 0.5)
            ) && (
              <button
                type="button"
                onClick={() => {
                  sound.playAttack();
                  const next = enemies.map((e) =>
                    e.tier === 'boss'
                      ? { ...e, hp: Math.floor(e.maxHp * 0.48) }
                      : e
                  );
                  setEnemies(checkAndTriggerBossBerserk(next));
                }}
                className="px-3 py-1 bg-red-950/90 hover:bg-red-800 border border-red-400 text-[11px] font-black text-amber-200 shadow cursor-pointer transition flex items-center gap-1.5"
                title="将首领血量压至50%以下，立即触发二阶段狂暴转场震屏与血月背景异变！"
              >
                <span>🩸 压制首领至 &lt;50% 血量 (触发二阶段狂暴)</span>
              </button>
            )}
          </div>

          {/* 中央对决舞台：左侧英雄平台 vs 右侧怪物平台（站在石砖舞台地面上） */}
          <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-end px-10 md:px-20 pb-3">
            {/* 左侧：英雄战斗立绘 + 环绕充能球/剑意/飞刀视觉特效 */}
            <div className="flex flex-col items-center justify-end relative">
              {/* 英雄受击/格挡/施法高光飘字 */}
              <AnimatePresence>
                {playerImpactVfx && (
                  <motion.div
                    key={playerImpactVfx.id}
                    initial={{ opacity: 0, y: 16, scale: 0.75 }}
                    animate={{ opacity: 1, y: -18, scale: 1.08 }}
                    exit={{ opacity: 0, y: -36, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                    className="absolute -top-10 z-40 pointer-events-none flex flex-col items-center"
                  >
                    <div
                      className={`px-3.5 py-1.5 border-2 font-black text-sm tracking-wider shadow-[0_6px_20px_rgba(0,0,0,0.95)] whitespace-nowrap ${
                        playerImpactVfx.type === 'damage'
                          ? 'bg-red-950/95 border-red-400 text-red-200'
                          : playerImpactVfx.type === 'block'
                          ? 'bg-sky-950/95 border-sky-300 text-sky-200'
                          : playerImpactVfx.type === 'heal'
                          ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
                          : playerImpactVfx.type === 'debuff'
                          ? 'bg-purple-950/95 border-purple-400 text-purple-200'
                          : 'bg-amber-950/95 border-amber-400 text-amber-200'
                      }`}
                    >
                      {playerImpactVfx.text}
                    </div>
                    {playerImpactVfx.subtext && (
                      <span className="mt-0.5 px-2 py-0.5 bg-black/85 text-[10px] font-bold text-slate-300 border border-slate-700 whitespace-nowrap">
                        {playerImpactVfx.subtext}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 法师：环绕在头顶弧线的视觉充能球 (OrbVisualSprite，支持星轨扩容至最多6槽位) */}
              {playerClass === 'mage' && (
                <div className="flex flex-wrap items-center justify-center gap-3 mb-3 min-h-[52px]">
                  {Array.from({ length: maxOrbSlots }).map((_, slot) => {
                    const orb = orbs[slot];
                    if (!orb) {
                      return (
                        <div
                          key={slot}
                          className="w-10 h-10 rounded-full border-2 border-dashed border-cyan-500/40 bg-slate-950/50 flex items-center justify-center text-[10px] text-cyan-500/50"
                        >
                          ◯
                        </div>
                      );
                    }
                    return (
                      <OrbVisualSprite
                        key={orb.id}
                        type={orb.type}
                        passiveVal={orb.passiveValue + playerStatuses.focus}
                        evokeVal={orb.evokeValue + playerStatuses.focus}
                      />
                    );
                  })}
                </div>
              )}

              {/* 铁卫：环绕头顶的视觉剑意飞剑 */}
              {playerClass === 'warrior' && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-red-950/90 border border-red-400 shadow-[0_0_16px_rgba(239,68,68,0.6)]">
                  <CardPixelArt spriteType="sword" className="w-5 h-5" />
                  <span className="text-xs font-black font-mono text-amber-300">
                    剑意 x{swordIntent} (攻击+{swordIntent})
                  </span>
                </div>
              )}

              {/* 刺客：环绕头顶的视觉连击飞刀 */}
              {playerClass === 'assassin' && (
                <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-emerald-950/90 border border-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.6)]">
                  <CardPixelArt spriteType="shuriken" className="w-5 h-5" />
                  <span className="text-xs font-black font-mono text-emerald-300">
                    连击 x{comboPoints}
                  </span>
                </div>
              )}

              {/* 英雄立绘 + 动态攻击冲刺/施法光环/格挡光罩 + 地面投影 */}
              <motion.div
                animate={
                  playerUnitAnim === 'attack_lunge'
                    ? { x: [0, 75, -8, 0], scale: [1, 1.14, 1], rotate: [0, 6, 0] }
                    : playerUnitAnim === 'cast_spell'
                    ? { y: [0, -18, 0], scale: [1, 1.12, 1] }
                    : playerUnitAnim === 'shield_up'
                    ? { scale: [1, 1.09, 1] }
                    : playerUnitAnim === 'hit_recoil'
                    ? { x: [0, -24, 14, -8, 0], rotate: [0, -8, 5, 0] }
                    : { x: 0, y: 0, scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.36, ease: 'easeOut' }}
                className={`relative flex flex-col items-center p-1.5 rounded-xl transition-all ${
                  dragCardState &&
                  dragCardState.isReadyToRelease &&
                  dragCardState.card.target === 'self'
                    ? 'ring-4 ring-cyan-300/90 bg-cyan-950/35 shadow-[0_0_38px_rgba(56,189,248,0.85)] scale-105'
                    : ''
                }`}
              >
                {dragCardState &&
                  dragCardState.isReadyToRelease &&
                  dragCardState.card.target === 'self' && (
                    <div className="absolute -top-7 z-30 px-2.5 py-0.5 bg-cyan-950 border border-cyan-300 text-[10px] font-black text-cyan-200 whitespace-nowrap shadow-[0_3px_0_#000] animate-bounce">
                      ✨ 松手加持英雄
                    </div>
                  )}
                {playerUnitAnim === 'cast_spell' && (
                  <div className="absolute -inset-4 border-2 border-amber-400/80 bg-amber-500/15 rounded-full animate-ping pointer-events-none" />
                )}
                {playerUnitAnim === 'shield_up' && (
                  <div className="absolute -inset-4 border-4 border-sky-400/90 bg-sky-500/20 rounded-full animate-pulse pointer-events-none" />
                )}
                {playerUnitAnim === 'hit_recoil' && (
                  <div className="absolute -inset-3 bg-red-600/35 border-2 border-red-500 animate-ping pointer-events-none" />
                )}
                <FloatingStatusPopups
                  popups={statusPopups.filter((p) => p.targetId === 'player')}
                />
                <CharacterSprite classType={playerClass} size="xl" />
                <div className="w-36 h-4 -mt-2 rounded-full bg-black/65 blur-[2px]" />
              </motion.div>

              {/* 英雄脚下紧凑型血条 + 护盾徽章 */}
              <div className="mt-2 flex items-center gap-1.5">
                {playerBlock > 0 && (
                  <div className="px-2 py-0.5 bg-sky-950 border-2 border-sky-300 rounded text-xs font-black font-mono text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.85)] flex items-center gap-1">
                    <span>🛡️</span>
                    <span>{playerBlock}</span>
                  </div>
                )}
                <div className="w-44 h-4 bg-[#1a0f12] border-2 border-[#090c10] rounded-full relative overflow-hidden shadow-[0_3px_6px_rgba(0,0,0,0.9)]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      playerBlock > 0
                        ? 'bg-gradient-to-r from-sky-600 to-cyan-400'
                        : 'bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#ef4444]'
                    }`}
                    style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black font-mono text-white drop-shadow-[0_1px_2px_#000]">
                    {hp}/{maxHp}
                  </span>
                </div>
              </div>

              {/* 英雄动态像素图标状态栏 (DynamicStatusBar) */}
              <DynamicStatusBar statuses={playerStatuses} />
            </div>

            {/* 右侧：敌方怪物阵列（头顶悬浮纯视觉意图图标 + 地面阴影 + 血条 + 动态状态栏） */}
            <div className="flex flex-wrap items-end justify-center gap-6">
              {enemies.map((enemy, idx) => {
                const isAlive = enemy.hp > 0;
                const isSelected = idx === selectedEnemyIdx && isAlive;
                const isActingNow = activeActingEnemyIdx === idx && isAlive;
                const unitMotion = enemyUnitAnimMap[idx] || 'idle';
                const nextIntent =
                  enemy.intents[enemy.intentIndex % enemy.intents.length];
                const isBeingHit = enemyVfx?.idx === idx;
                const enemyPopups = statusPopups.filter(
                  (p) => p.targetId === enemy.uid
                );
                const isEnemyBerserk =
                  enemy.tier === 'boss' && (enemy.phase === 2 || bossBerserkActive);
                const isDragTargeted =
                  isAlive &&
                  Boolean(
                    dragCardState &&
                      dragCardState.isReadyToRelease &&
                      (dragCardState.card.target === 'all' ||
                        (dragCardState.card.target === 'single' &&
                          (dragCardState.targetEnemyIdx ?? selectedEnemyIdx) === idx))
                  );

                return (
                  <motion.button
                    key={enemy.uid}
                    type="button"
                    data-enemy-idx={idx}
                    disabled={!isAlive}
                    onClick={() => setSelectedEnemyIdx(idx)}
                    animate={
                      unitMotion === 'windup'
                        ? { x: [0, 14, 18], y: [0, -8, -10], scale: [1, 1.08, 1.1] }
                        : unitMotion === 'attack_lunge'
                        ? { x: [18, -95, 10, 0], scale: [1.1, 1.22, 1] }
                        : unitMotion === 'cast_spell'
                        ? { y: [0, -20, 0], scale: [1, 1.15, 1] }
                        : unitMotion === 'shield_up'
                        ? { scale: [1, 1.1, 1] }
                        : unitMotion === 'hit_recoil'
                        ? { x: [0, 24, -14, 8, 0], rotate: [0, 8, -5, 0] }
                        : { x: 0, y: 0, scale: 1, rotate: 0 }
                    }
                    transition={{ duration: 0.36, ease: 'easeOut' }}
                    className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                      !isAlive
                        ? 'opacity-15 scale-90 pointer-events-none'
                        : isDragTargeted
                        ? 'scale-110 ring-4 ring-amber-300 bg-red-950/40 drop-shadow-[0_0_32px_rgba(239,68,68,0.95)] cursor-pointer'
                        : isActingNow
                        ? 'scale-110 drop-shadow-[0_0_28px_rgba(251,191,36,0.95)] cursor-pointer'
                        : isSelected
                        ? 'scale-105 drop-shadow-[0_0_20px_rgba(250,204,21,0.65)] cursor-pointer'
                        : 'opacity-90 hover:opacity-100 cursor-pointer'
                    }`}
                  >
                    {isDragTargeted && (
                      <div className="absolute -top-7 z-40 px-2.5 py-0.5 bg-red-950 border-2 border-yellow-300 text-[10px] font-black text-yellow-200 whitespace-nowrap shadow-[0_3px_0_#000] animate-bounce">
                        🎯 松手命中此目标
                      </div>
                    )}
                    {/* 怪物头顶弹跳式 Buff/Debuff 像素图标动态数值飘字 */}
                    {isAlive && <FloatingStatusPopups popups={enemyPopups} />}

                    {/* 受击特效与飘字 */}
                    {isBeingHit && (
                      <>
                        <VfxBurst type={enemyVfx.type} />
                        <div className="absolute -top-8 z-40 px-3 py-1 bg-red-950 border-2 border-yellow-300 text-base font-black font-mono text-yellow-300 animate-float-damage">
                          {enemyVfx.text}
                        </div>
                      </>
                    )}

                    {/* 头顶悬浮视觉意图徽章 */}
                    {isAlive && (
                      <div
                        title={nextIntent.label}
                        className={`mb-1 px-3 py-1 rounded border-2 shadow-[0_4px_8px_rgba(0,0,0,0.85)] flex items-center gap-1.5 animate-bounce ${
                          isActingNow
                            ? 'bg-amber-950 border-yellow-300'
                            : isEnemyBerserk
                            ? 'bg-red-950/95 border-red-400'
                            : 'bg-[#11161f]/95 border-amber-400/80'
                        }`}
                      >
                        {isEnemyBerserk && (
                          <span className="text-[10px] font-black text-yellow-300">
                            🔥狂暴
                          </span>
                        )}
                        {nextIntent.damage ? (
                          <span className="text-base font-black font-mono text-red-400 flex items-center gap-1">
                            <span>⚔️</span>
                            <span>
                              {nextIntent.damage + enemy.statuses.strength}
                              {nextIntent.hits && nextIntent.hits > 1
                                ? `x${nextIntent.hits}`
                                : ''}
                            </span>
                          </span>
                        ) : null}
                        {nextIntent.block ? (
                          <span className="text-base font-black font-mono text-sky-300">
                            🛡️{nextIntent.block}
                          </span>
                        ) : null}
                        {nextIntent.statusName ? (
                          <span className="text-xs font-black text-purple-300 flex items-center gap-1">
                            <StatusPixelIcon
                              statusKey={nextIntent.statusName}
                              className="w-3.5 h-3.5"
                            />
                            <span>
                              {nextIntent.statusAmount
                                ? `+${nextIntent.statusAmount}`
                                : nextIntent.label}
                            </span>
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* 怪物本体 + 脚底投影 */}
                    <div className="relative flex flex-col items-center">
                      {unitMotion === 'cast_spell' && (
                        <div className="absolute -inset-3 border-2 border-purple-400 bg-purple-500/20 rounded-full animate-ping z-20 pointer-events-none" />
                      )}
                      {unitMotion === 'shield_up' && (
                        <div className="absolute -inset-3 border-4 border-sky-400 bg-sky-500/20 rounded-full animate-pulse z-20 pointer-events-none" />
                      )}
                      <EnemySprite
                        spriteType={enemy.spriteType}
                        tier={enemy.tier}
                        isHit={isBeingHit}
                        isBerserk={isEnemyBerserk}
                      />
                      <div className="w-36 h-4 -mt-2 rounded-full bg-black/65 blur-[2px]" />
                      {enemies.filter((e) => e.hp > 0).length > 1 && isSelected && (
                        <div className="absolute -top-2 -left-2 z-20 px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] border border-white">
                          🎯锁定
                        </div>
                      )}
                    </div>

                    {/* 怪物血条与名字 (Boss包含 50% 狂暴分界线刻度) */}
                    <div className="mt-1 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5">
                        {enemy.block > 0 && (
                          <span className="px-1.5 py-0.5 bg-sky-950 border border-sky-300 rounded text-xs font-black font-mono text-sky-200">
                            🛡️{enemy.block}
                          </span>
                        )}
                        <div className="w-44 h-4 bg-[#1a0f12] border-2 border-[#090c10] rounded-full relative overflow-hidden shadow-[0_3px_6px_rgba(0,0,0,0.9)]">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isEnemyBerserk
                                ? 'bg-gradient-to-r from-red-700 via-rose-500 to-yellow-400 animate-pulse'
                                : 'bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#f97316]'
                            }`}
                            style={{
                              width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`,
                            }}
                          />
                          {enemy.tier === 'boss' && (
                            <div
                              className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-yellow-300 z-10 shadow-[0_0_6px_#fde047]"
                              title="50% 血量狂暴觉醒阈值"
                            />
                          )}
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black font-mono text-white drop-shadow-[0_1px_2px_#000] z-20">
                            {enemy.hp}/{enemy.maxHp}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-black tracking-wide drop-shadow-[0_2px_2px_#000] ${
                          isEnemyBerserk ? 'text-red-300' : 'text-slate-200'
                        }`}
                      >
                        {enemy.name}
                      </span>
                    </div>

                    {/* 怪物动态像素图标状态栏 (DynamicStatusBar) */}
                    <DynamicStatusBar statuses={enemy.statuses} />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 底部前景：左抽牌堆 + 悬浮3D法力球 + 中央扇形手牌弧线 + 右侧结束回合石板按钮与弃牌堆 */}
          <div className="relative z-20 px-6 pb-3 pt-1 flex items-end justify-between gap-4">
            {/* 左下角：立体抽牌摞 + 悬浮 3D 能量水晶球 */}
            <div className="relative flex items-end gap-4 shrink-0 pb-1">
              <div className={drawPileRecoil ? 'animate-pile-recoil' : ''}>
                <CardStackWidget
                  count={drawPile.length}
                  label="抽牌堆"
                  color="amber"
                  onClick={() => setModalMode('draw')}
                />
              </div>

              {/* 巨型多层金属环 3D 能量水晶球 */}
              <div
                title={`当前可用能量 ${energy}/${computedMaxEnergy}`}
                className="relative -translate-y-4 w-20 h-20 rounded-full p-1.5 bg-gradient-to-b from-[#d6b887] via-[#785937] to-[#3b2816] border-[3px] border-[#f5e6cc] shadow-[0_0_32px_rgba(245,158,11,0.8),0_8px_20px_rgba(0,0,0,0.95)] flex items-center justify-center"
              >
                <div className="w-full h-full rounded-full bg-radial from-[#fef08a] via-[#f97316] to-[#7c2d12] border-2 border-[#fde047] flex flex-col items-center justify-center shadow-inner">
                  <span className="text-2xl font-black font-mono text-white drop-shadow-[0_2px_4px_#000] leading-none">
                    {energy}/{computedMaxEnergy}
                  </span>
                </div>
              </div>
            </div>

            {/* 中央：Spring Physics 弹性物理扇形手牌区（支持拖动释放 & 点击释放） */}
            <div className="relative flex-1 flex flex-col items-center justify-end min-h-[268px] overflow-visible">
              {/* 拖拽卡牌时的战场释放引导横幅 */}
              <AnimatePresence>
                {dragCardState && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.92 }}
                    transition={{ duration: 0.15 }}
                    className={`mb-1 px-5 py-1 border-2 text-xs font-black tracking-wider shadow-[0_6px_16px_rgba(0,0,0,0.95)] pointer-events-none z-50 ${
                      dragCardState.isReadyToRelease
                        ? 'bg-gradient-to-r from-amber-950 via-red-950 to-amber-950 border-yellow-300 text-yellow-200 shadow-[0_0_25px_rgba(250,204,21,0.75)]'
                        : 'bg-slate-950/90 border-amber-500/60 text-amber-200/90'
                    }`}
                  >
                    {dragCardState.isReadyToRelease
                      ? dragCardState.card.target === 'single'
                        ? `🎯 松开鼠标释放【${dragCardState.card.name}】 ➔ 目标：${
                            enemies[dragCardState.targetEnemyIdx ?? selectedEnemyIdx]?.name || '敌方单位'
                          }`
                        : dragCardState.card.target === 'all'
                        ? `💥 松开鼠标对【全体敌人】释放【${dragCardState.card.name}】`
                        : `✨ 松开鼠标释放【${dragCardState.card.name}】`
                      : `⬆️ 向上拖动【${dragCardState.card.name}】至战场或敌人身上松开释放（拖回手牌取消）`}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative w-full h-[258px] flex items-center justify-center overflow-visible">
                <AnimatePresence mode="popLayout">
                  {hand.map((card, idx) => {
                    const effectiveCost = getEffectiveCardCost(card);
                    const displayCard =
                      effectiveCost !== card.cost ? { ...card, cost: effectiveCost } : card;
                    const canPlay = turn === 'player' && energy >= effectiveCost;
                    const total = hand.length;
                    const mid = (total - 1) / 2;
                    const offset = idx - mid;
                    const isHovered = hoveredHandIdx === idx;
                    const isDraggingThis = dragCardState?.card.uid === card.uid;
                    const isReadyThis = Boolean(isDraggingThis && dragCardState?.isReadyToRelease);

                    // Dynamic horizontal spread based on hand size
                    const baseSpacing =
                      total <= 4
                        ? 136
                        : total <= 6
                        ? 114
                        : total <= 8
                        ? 92
                        : 74;

                    // Neighbor spread when a card in hand is hovered
                    const neighborPushX =
                      hoveredHandIdx === null || isHovered || dragCardState !== null
                        ? 0
                        : idx < hoveredHandIdx
                        ? -32
                        : 32;

                    const targetX = offset * baseSpacing + neighborPushX;
                    const targetY =
                      isHovered || isDraggingThis
                        ? -52
                        : Math.abs(offset) * Math.abs(offset) * 3.2 + Math.abs(offset) * 5 + 14;
                    const targetRotate = isHovered || isDraggingThis ? 0 : offset * 4.8;
                    const targetScale = isDraggingThis ? 1.12 : isHovered ? 1.2 : 1;

                    // Staggered entry delay when multiple cards are drawn together
                    const staggerIndex = newlyDrawnOrderMapRef.current[card.uid] ?? 0;
                    const isTokenShiv = card.id === 'shiv';

                    // Entry coordinates: from bottom-left Draw Pile (or from Hero for generated Shivs)
                    const initialVariant = isTokenShiv
                      ? {
                          opacity: 0,
                          x: -160,
                          y: -110,
                          rotate: -75,
                          scale: 0.25,
                        }
                      : {
                          opacity: 0,
                          x: -420,
                          y: 72,
                          rotate: -36,
                          scale: 0.24,
                        };

                    const targetEnemyForPreview =
                      isDraggingThis &&
                      dragCardState?.targetEnemyIdx !== null &&
                      dragCardState?.targetEnemyIdx !== undefined &&
                      enemies[dragCardState.targetEnemyIdx]
                        ? enemies[dragCardState.targetEnemyIdx]
                        : selectedEnemy;

                    return (
                      <motion.div
                        key={card.uid}
                        layout={!isDraggingThis}
                        custom={card.uid}
                        initial={initialVariant}
                        animate={{
                          opacity: 1,
                          x: targetX,
                          y: targetY,
                          rotate: targetRotate,
                          scale: targetScale,
                        }}
                        exit="exit"
                        variants={{
                          exit: (uid: string) => {
                            const exitMode =
                              cardExitModeMapRef.current[uid] || 'discard';
                            if (exitMode === 'exhaust') {
                              return {
                                opacity: 0,
                                x: targetX * 0.4,
                                y: -175,
                                rotate: -18,
                                scale: 0.14,
                                filter: 'brightness(2.6) contrast(1.4)',
                                transition: {
                                  type: 'spring',
                                  stiffness: 320,
                                  damping: 24,
                                },
                              };
                            }
                            if (exitMode === 'play') {
                              return {
                                opacity: 0,
                                x: 340,
                                y: -95,
                                rotate: 24,
                                scale: 0.28,
                                filter: 'brightness(1.65)',
                                transition: {
                                  type: 'spring',
                                  stiffness: 380,
                                  damping: 25,
                                },
                              };
                            }
                            // Default: sweep into bottom-right Discard Pile
                            return {
                              opacity: 0,
                              x: 420,
                              y: 68,
                              rotate: 38,
                              scale: 0.22,
                              transition: {
                                type: 'spring',
                                stiffness: 390,
                                damping: 27,
                              },
                            };
                          },
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 26,
                          mass: 0.82,
                          delay: staggerIndex * 0.035,
                        }}
                        onAnimationComplete={() => {
                          if (newlyDrawnOrderMapRef.current[card.uid] !== undefined) {
                            delete newlyDrawnOrderMapRef.current[card.uid];
                          }
                        }}
                        onMouseEnter={() => {
                          if (!dragCardState) setHoveredHandIdx(idx);
                        }}
                        onMouseLeave={() => {
                          if (!dragCardState) {
                            setHoveredHandIdx((prev) => (prev === idx ? null : prev));
                          }
                        }}
                        style={{
                          position: 'absolute',
                          zIndex: isDraggingThis ? 90 : isHovered ? 60 : 10 + idx,
                        }}
                      >
                        <motion.div
                          drag={canPlay}
                          dragSnapToOrigin={true}
                          dragElastic={0.08}
                          dragMomentum={false}
                          whileDrag={{ scale: 1.06, rotate: 0 }}
                          onDragStart={() => {
                            if (!canPlay) return;
                            sound.playHover();
                            setHoveredHandIdx(idx);
                            setDragCardState({
                              card,
                              isReadyToRelease: false,
                              targetEnemyIdx:
                                card.target === 'single' ? selectedEnemyIdx : null,
                            });
                          }}
                          onDrag={(event, info) => {
                            if (!canPlay) return;
                            const ptr = event as MouseEvent | TouchEvent | PointerEvent;
                            let clientX = info.point.x;
                            let clientY = info.point.y;
                            if ('clientX' in ptr && typeof ptr.clientX === 'number') {
                              clientX = ptr.clientX;
                              clientY = ptr.clientY;
                            } else if ('touches' in ptr && ptr.touches.length > 0) {
                              clientX = ptr.touches[0].clientX;
                              clientY = ptr.touches[0].clientY;
                            }
                            const hoveredEnemy = detectHoveredEnemyIdx(clientX, clientY);
                            if (hoveredEnemy !== null && hoveredEnemy !== selectedEnemyIdx) {
                              setSelectedEnemyIdx(hoveredEnemy);
                            }
                            const ready = info.offset.y < -75 || hoveredEnemy !== null;
                            const effectiveTarget =
                              card.target === 'single'
                                ? hoveredEnemy !== null
                                  ? hoveredEnemy
                                  : enemies[selectedEnemyIdx]?.hp > 0
                                  ? selectedEnemyIdx
                                  : enemies.findIndex((e) => e.hp > 0)
                                : null;

                            setDragCardState((prev) => {
                              if (
                                prev &&
                                prev.card.uid === card.uid &&
                                prev.isReadyToRelease === ready &&
                                prev.targetEnemyIdx === effectiveTarget
                              ) {
                                return prev;
                              }
                              return {
                                card,
                                isReadyToRelease: ready,
                                targetEnemyIdx: effectiveTarget,
                              };
                            });
                          }}
                          onDragEnd={(event, info) => {
                            const draggedDist = Math.hypot(info.offset.x, info.offset.y);
                            if (draggedDist > 10) {
                              lastDragEndTimeRef.current = Date.now();
                            }
                            const ptr = event as MouseEvent | TouchEvent | PointerEvent;
                            let clientX = info.point.x;
                            let clientY = info.point.y;
                            if ('clientX' in ptr && typeof ptr.clientX === 'number') {
                              clientX = ptr.clientX;
                              clientY = ptr.clientY;
                            } else if (
                              'changedTouches' in ptr &&
                              ptr.changedTouches.length > 0
                            ) {
                              clientX = ptr.changedTouches[0].clientX;
                              clientY = ptr.changedTouches[0].clientY;
                            }
                            const hoveredEnemy = detectHoveredEnemyIdx(clientX, clientY);
                            const shouldPlay =
                              canPlay && (info.offset.y < -75 || hoveredEnemy !== null);
                            const targetIdxToUse =
                              hoveredEnemy !== null
                                ? hoveredEnemy
                                : dragCardState?.targetEnemyIdx ?? selectedEnemyIdx;

                            setDragCardState(null);
                            setHoveredHandIdx(null);

                            if (shouldPlay) {
                              handlePlayCard(card, targetIdxToUse);
                            }
                          }}
                        >
                          <CardComponent
                            card={displayCard}
                            playable={canPlay}
                            disabled={turn !== 'player'}
                            springManaged
                            isDragging={isDraggingThis}
                            isReadyToRelease={isReadyThis}
                            isJittering={handJitterActive && !isHovered && !isDraggingThis}
                            computedDamage={
                              card.effects.damage !== undefined ||
                              card.effects.damageEqualsBlock ||
                              card.effects.exhaustOtherHandForDamage !== undefined ||
                              card.effects.detonatePoison ||
                              card.effects.detonateBurn !== undefined
                                ? computeCardDamage(card, targetEnemyForPreview)
                                : undefined
                            }
                            computedBlock={
                              card.effects.block !== undefined ||
                              card.effects.exhaustSkillsForBlock !== undefined
                                ? computeCardBlock(card)
                                : undefined
                            }
                            computedHits={computeCardHits(card)}
                            onClick={() => {
                              if (Date.now() - lastDragEndTimeRef.current < 220) return;
                              handlePlayCard(card);
                            }}
                          />
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* 右下角：立体青石【结束回合】按钮 + 消耗堆徽章 + 实体弃牌摞 */}
            <div className="flex flex-col items-end gap-3 shrink-0 pb-1">
              <button
                type="button"
                disabled={turn !== 'player'}
                onClick={handleEndTurn}
                className={`px-7 py-2.5 rounded border-2 font-black text-base tracking-widest transition-all shadow-[0_6px_16px_rgba(0,0,0,0.9)] ${
                  turn === 'player'
                    ? 'bg-gradient-to-b from-[#2b5868] via-[#1d3e4a] to-[#132932] hover:from-[#366f82] hover:to-[#1d3e4a] border-[#d6b887] text-[#f5e6cc] cursor-pointer hover:scale-105'
                    : 'bg-slate-900 border-slate-700 text-slate-500 opacity-60 cursor-not-allowed'
                }`}
              >
                {turn === 'player' ? '结束回合' : '敌方回合'}
              </button>

              <div className="flex items-end gap-3">
                {exhaustPile.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModalMode('exhaust')}
                    title="点击查看已消耗卡牌"
                    className="px-2.5 py-1.5 bg-purple-950/90 hover:bg-purple-900 border-2 border-purple-400 rounded text-xs font-black text-purple-200 flex items-center gap-1 cursor-pointer shadow"
                  >
                    <span>🔥消耗</span>
                    <span className="font-mono">{exhaustPile.length}</span>
                  </button>
                )}

                <div className={discardPileRecoil ? 'animate-pile-recoil' : ''}>
                  <CardStackWidget
                    count={discardPile.length}
                    label="弃牌堆"
                    color="slate"
                    onClick={() => setModalMode('discard')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 3. 视觉化战利品三选一 + 智能流派成型导航 (REWARD VIEW) ==================== */}
      {roomView === 'reward' && !showMapOverlay && (
        <div className="relative z-10 w-full max-w-5xl mx-auto p-6">
          <div className="pixel-panel-gold p-6 flex flex-col items-center gap-5">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <h2 className="text-2xl md:text-3xl font-black tracking-wider spire-title-gold">
                🏆 战斗胜利 · 战利品馈赠
              </h2>
              <span className="px-3 py-1 bg-slate-950 border-2 border-yellow-400 text-sm font-black font-mono text-yellow-300">
                💰 +{rewardGold}
              </span>
            </div>

            {/* 流派构筑成熟度与定向抓牌导航横幅 */}
            <div className="w-full max-w-4xl bg-slate-950/95 border-2 border-amber-400/80 p-3.5 flex flex-col gap-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[11px] font-black">
                    🧭 当前成型路线：{buildMaturity.primary.combo.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-black border ${
                      buildMaturity.primary.resonanceTier >= 2
                        ? 'bg-yellow-950 border-yellow-300 text-yellow-200'
                        : buildMaturity.primary.resonanceTier === 1
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-600 text-slate-300'
                    }`}
                  >
                    {buildMaturity.primary.stageLabel}（成型度 {buildMaturity.primary.score}%）
                  </span>
                </div>

                {/* 切换/锁定目标流派按钮组 */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">
                    🎯 锁定构筑路线：
                  </span>
                  {buildMaturity.allClassRoutes.map((route) => {
                    const isLocked = lockedArchetypeComboId === route.combo.id;
                    const isPrimary = buildMaturity.primary.combo.id === route.combo.id;
                    return (
                      <button
                        key={route.combo.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setLockedArchetypeComboId(isLocked ? null : route.combo.id);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-black border cursor-pointer transition ${
                          isLocked
                            ? 'bg-amber-400 text-slate-950 border-white shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                            : isPrimary
                            ? 'bg-amber-950/80 text-amber-200 border-amber-400/70'
                            : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {isLocked ? '🔒 ' : ''}
                        {route.combo.shortTag} ({route.matchedCount})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 成型进度条与下一阶段核心卡提示 */}
              <div className="w-full h-2 bg-slate-900 border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${buildMaturity.primary.score}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-emerald-300 font-bold">
                  {buildMaturity.primary.resonanceBonusText}
                </span>
                {buildMaturity.primary.missingCoreNames.length > 0 && (
                  <span className="text-amber-200 font-bold">
                    🔥 待补齐毕业核心：
                    {buildMaturity.primary.missingCoreNames.join(' / ')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {rewardRelic && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playCoin();
                    setRelics((prev) => [...prev, rewardRelic]);
                    setRewardRelic(null);
                  }}
                  className="px-5 py-3 bg-slate-950 hover:bg-amber-950 border-2 border-amber-400 text-xs text-amber-200 font-black flex items-center gap-3 cursor-pointer shadow-[0_6px_0_#000]"
                >
                  <RelicPixelArt iconType={rewardRelic.iconType} className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-sm text-amber-300">领取遗物：{rewardRelic.name}</div>
                    <div className="text-[11px] text-slate-300">{rewardRelic.description}</div>
                  </div>
                </button>
              )}

              {rewardPotion && (
                <button
                  type="button"
                  onClick={() => {
                    if (potions.length < 3) {
                      sound.playCoin();
                      setPotions((prev) => [...prev, rewardPotion]);
                      setRewardPotion(null);
                    }
                  }}
                  className="px-5 py-3 bg-slate-950 hover:bg-emerald-950 border-2 border-emerald-400 text-xs text-emerald-200 font-black flex items-center gap-3 cursor-pointer shadow-[0_6px_0_#000]"
                >
                  <PotionBottleSprite effectType={rewardPotion.effectType} className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-sm text-emerald-300">领取药水：{rewardPotion.name}</div>
                    <div className="text-[11px] text-slate-300">{rewardPotion.description}</div>
                  </div>
                </button>
              )}
            </div>

            {!cardPicked ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex flex-wrap justify-center gap-7 py-2">
                  {rewardCards.map((card) => {
                    const primaryCombo = buildMaturity.primary.combo;
                    const isPrimaryCore = primaryCombo.coreCardIds.includes(card.id);
                    const isPrimarySupport =
                      primaryCombo.supportCardIds.includes(card.id) ||
                      card.archetypeTag === primaryCombo.shortTag;
                    const matchedOtherCombo = RECOMMENDED_ARCHETYPE_COMBOS.find(
                      (c) =>
                        c.classType === playerClass &&
                        c.id !== primaryCombo.id &&
                        c.coreCardIds.includes(card.id)
                    );
                    const highlightRole: 'core' | 'support' | null = isPrimaryCore
                      ? 'core'
                      : isPrimarySupport || matchedOtherCombo
                      ? 'support'
                      : null;
                    const highlightBadgeText = isPrimaryCore
                      ? `★ ${primaryCombo.shortTag}毕业核心`
                      : isPrimarySupport
                      ? `✦ ${primaryCombo.shortTag}契合组件`
                      : matchedOtherCombo
                      ? `⚡ ${matchedOtherCombo.shortTag}核心`
                      : undefined;

                    return (
                      <CardComponent
                        key={card.uid}
                        card={card}
                        playable={true}
                        highlightRole={highlightRole}
                        highlightBadgeText={highlightBadgeText}
                        ownedInDeckCount={deck.filter((d) => d.id === card.id).length}
                        onClick={() => {
                          sound.playCoin();
                          setDeck((prev) => [...prev, card]);
                          setCardPicked(true);
                        }}
                      />
                    );
                  })}
                </div>

                {/* 构筑定向重随按钮：免费重随1次，第2次消耗25金币 */}
                {rerollsUsedThisReward < 2 && (
                  <button
                    type="button"
                    disabled={rerollsUsedThisReward === 1 && gold < 25}
                    onClick={() => {
                      const cost = rerollsUsedThisReward === 0 ? 0 : 25;
                      if (gold < cost) return;
                      sound.playCardDraw();
                      if (cost > 0) setGold((g) => g - cost);
                      setRerollsUsedThisReward((r) => r + 1);
                      setRewardCards(
                        generateSmartCardRewards(
                          deck,
                          playerClass,
                          currentFloor,
                          activeNodeType === 'elite' ? 'elite' : 'combat',
                          lockedArchetypeComboId,
                          3
                        )
                      );
                    }}
                    className="px-4 py-1.5 bg-indigo-950 hover:bg-indigo-900 disabled:opacity-40 border border-cyan-400 text-xs font-black text-cyan-200 cursor-pointer transition shadow-[0_3px_0_#000]"
                  >
                    {rerollsUsedThisReward === 0
                      ? `🎲 定向重随候选卡牌（免费 1 次 · 优先【${buildMaturity.primary.combo.shortTag}】组件）`
                      : `🎲 再次定向重随（消耗 💰25）`}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-base font-black text-emerald-400 py-4">
                ✓ 新卡牌已收入牌组！当前【{buildMaturity.primary.combo.shortTag}】成型度：{buildMaturity.primary.score}%
              </div>
            )}

            <button
              type="button"
              onMouseEnter={() => sound.playHover()}
              onClick={() => {
                sound.playClick();
                triggerRoomTransition('map', actNameLabel, '', 'war_banner');
              }}
              className="pl-12 pr-9 py-3 spire-ribbon-teal text-amber-200 hover:text-white font-black text-base tracking-widest cursor-pointer transition-transform hover:translate-x-1"
            >
              继续前进 ▶
            </button>
          </div>
        </div>
      )}

      {/* ==================== 3B. 首领王座秘宝殿 (BOSS REWARD VIEW) ==================== */}
      {roomView === 'boss_reward' && !showMapOverlay && (
        <div className="relative z-10 w-full max-w-5xl mx-auto p-6">
          <div className="pixel-panel-gold p-8 flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-wider spire-title-gold">
              👑 首领讨伐成功 · 选择首领遗物与流派毕业金卡
            </h2>

            {!bossRelicPicked ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
                {bossRelicChoices.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => {
                      sound.playPower();
                      setRelics((prev) => [...prev, rel]);
                      setBossRelicPicked(true);
                    }}
                    className="p-5 bg-slate-950/90 border-2 border-amber-400 hover:border-yellow-200 hover:-translate-y-2 transition flex flex-col items-center gap-3 cursor-pointer shadow-[0_8px_0_#000]"
                  >
                    <RelicPixelArt iconType={rel.iconType} className="w-12 h-12" />
                    <div className="font-black text-amber-300 text-base">{rel.name}</div>
                    <p className="text-xs text-slate-200">{rel.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm font-black text-emerald-400">
                ✓ 首领遗物已刻印！
              </div>
            )}

            {!cardPicked ? (
              <div className="flex flex-wrap justify-center gap-7 py-2">
                {rewardCards.map((card) => {
                  const primaryCombo = buildMaturity.primary.combo;
                  const isPrimaryCore = primaryCombo.coreCardIds.includes(card.id);
                  const isPrimarySupport =
                    primaryCombo.supportCardIds.includes(card.id) ||
                    card.archetypeTag === primaryCombo.shortTag;
                  return (
                    <CardComponent
                      key={card.uid}
                      card={card}
                      playable={true}
                      highlightRole={
                        isPrimaryCore ? 'core' : isPrimarySupport ? 'support' : null
                      }
                      highlightBadgeText={
                        isPrimaryCore
                          ? `★ ${primaryCombo.shortTag}毕业核心`
                          : isPrimarySupport
                          ? `✦ ${primaryCombo.shortTag}组件`
                          : undefined
                      }
                      ownedInDeckCount={deck.filter((d) => d.id === card.id).length}
                      onClick={() => {
                        sound.playCoin();
                        setDeck((prev) => [...prev, card]);
                        setCardPicked(true);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-sm font-black text-emerald-400">
                ✓ 稀有金卡已收入牌组！
              </div>
            )}

            <button
              type="button"
              onMouseEnter={() => sound.playHover()}
              onClick={handleProceedToNextAct}
              className="pl-12 pr-9 py-3.5 spire-ribbon-teal text-amber-200 hover:text-white font-black text-base tracking-widest cursor-pointer transition-transform hover:translate-x-1"
            >
              🚪 踏入第 {currentAct + 1} 幕 ▶
            </button>
          </div>
        </div>
      )}

      {/* ==================== 4. 视觉卡牌式篝火营地 (REST SITE VIEW) ==================== */}
      {roomView === 'rest' && !showMapOverlay && (
        <div className="relative z-10 w-full max-w-5xl mx-auto p-6">
          <div className="pixel-panel-gold p-8 flex flex-col items-center justify-center gap-8 min-h-[500px]">
            <h2 className="text-3xl md:text-4xl font-black tracking-wider spire-title-gold">
              🔥 篝火营地 · 休整或锻造
            </h2>

            <div className="flex flex-wrap justify-center gap-10">
              <button
                type="button"
                onMouseEnter={() => sound.playHover()}
                onClick={() => {
                  sound.playHeal();
                  const healAmt = Math.round(maxHp * 0.35);
                  setHp((h) => Math.min(maxHp, h + healAmt));
                  triggerRoomTransition('map', actNameLabel, '', 'holy_grail');
                }}
                className="group w-60 h-76 bg-slate-950/90 border-[3px] border-emerald-500 hover:border-emerald-300 hover:-translate-y-3 transition-all p-5 flex flex-col items-center justify-between cursor-pointer shadow-[0_10px_0_#000,0_0_24px_rgba(16,185,129,0.25)]"
              >
                <span className="text-lg font-black text-emerald-400">💤 围炉休整</span>
                <div className="w-28 h-28 rounded-full bg-emerald-950/60 border-2 border-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CardPixelArt spriteType="holy_grail" className="w-16 h-16" />
                </div>
                <span className="px-3 py-1 bg-emerald-950 border border-emerald-400 text-sm font-black font-mono text-emerald-200">
                  ❤️ +{Math.round(maxHp * 0.35)} 生命
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => sound.playHover()}
                onClick={() => {
                  sound.playClick();
                  setUpgradingCardUid(null);
                  setUpgradedCardSummary(null);
                  setModalMode('upgrade');
                }}
                className="group w-60 h-76 bg-slate-950/90 border-[3px] border-amber-400 hover:border-yellow-200 hover:-translate-y-3 transition-all p-5 flex flex-col items-center justify-between cursor-pointer shadow-[0_10px_0_#000,0_0_24px_rgba(251,191,36,0.25)]"
              >
                <span className="text-lg font-black text-amber-400">⚒️ 铁砧锻造</span>
                <div className="w-28 h-28 rounded-full bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CardPixelArt spriteType="heavy_blade" className="w-16 h-16" />
                </div>
                <span className="px-3 py-1 bg-amber-950 border border-amber-400 text-sm font-black text-amber-200">
                  ✨ 永久升级 1 张卡牌
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4B. 宝箱房间 (TREASURE ROOM VIEW) ==================== */}
      {roomView === 'treasure' && !showMapOverlay && (
        <div className="relative z-10 w-full max-w-5xl mx-auto p-6">
          <div className="pixel-panel-gold p-8 flex flex-col items-center justify-center gap-6 min-h-[500px]">
            <h2 className="text-3xl md:text-4xl font-black tracking-wider spire-title-gold">
              👑 黄金宝箱房
            </h2>

            <button
              type="button"
              onClick={() => {
                if (!chestOpened) {
                  sound.playVictory();
                  setChestOpened(true);
                }
              }}
              className="flex flex-col items-center gap-3 p-4 bg-slate-950 border-2 border-amber-400 hover:scale-105 transition cursor-pointer"
            >
              <TreasureChestSprite opened={chestOpened} />
              <span className="text-xs font-black text-amber-300">
                {chestOpened ? '✓ 宝箱已开启' : '▶ 点击开启宝箱'}
              </span>
            </button>

            {chestOpened && (
              <div className="flex flex-wrap items-center justify-center gap-6 py-2">
                {chestGold > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playCoin();
                      setGold((g) => g + chestGold);
                      setChestGold(0);
                    }}
                    className="px-5 py-3 bg-slate-950 border-2 border-yellow-400 text-sm font-black text-yellow-300 cursor-pointer shadow-[0_6px_0_#000]"
                  >
                    💰 +{chestGold} 金币
                  </button>
                )}

                {chestRelic && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playCoin();
                      setRelics((prev) => [...prev, chestRelic]);
                      setChestRelic(null);
                    }}
                    className="px-5 py-3 bg-slate-950 border-2 border-amber-400 text-xs font-black text-amber-200 cursor-pointer flex items-center gap-3 shadow-[0_6px_0_#000]"
                  >
                    <RelicPixelArt iconType={chestRelic.iconType} className="w-8 h-8" />
                    <span>{chestRelic.name}</span>
                  </button>
                )}

                {chestCard && (
                  <CardComponent
                    card={chestCard}
                    compact={true}
                    playable={true}
                    onClick={() => {
                      sound.playCoin();
                      setDeck((prev) => [...prev, chestCard]);
                      setChestCard(null);
                    }}
                  />
                )}
              </div>
            )}

            <button
              type="button"
              onMouseEnter={() => sound.playHover()}
              onClick={() => triggerRoomTransition('map', actNameLabel, '', 'war_banner')}
              className="pl-12 pr-9 py-2.5 spire-ribbon-teal text-amber-200 hover:text-white font-black text-sm tracking-widest cursor-pointer transition-transform hover:translate-x-1"
            >
              继续前进 ▶
            </button>
          </div>
        </div>
      )}

      {/* ==================== 5. 视觉地毯式黑市商店 (SHOP VIEW) ==================== */}
      {roomView === 'shop' && !showMapOverlay && (
        <div className="relative z-10 w-full max-w-5xl mx-auto p-6">
          <div className="pixel-panel-gold p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-amber-500/40 pb-3">
              <h2 className="text-2xl md:text-3xl font-black tracking-wider spire-title-gold">
                💰 黑市行商（持有 💰{gold}）
              </h2>
              <button
                type="button"
                onMouseEnter={() => sound.playHover()}
                onClick={() => triggerRoomTransition('map', actNameLabel, '', 'war_banner')}
                className="pl-10 pr-7 py-2 spire-ribbon-teal text-amber-200 hover:text-white font-black text-xs sm:text-sm tracking-widest cursor-pointer transition-transform hover:translate-x-1"
              >
                离开商店 ▶
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 py-2">
              {shopCards.map((card) => {
                const price = card.price || 60;
                const canAfford = gold >= price;
                const primaryCombo = buildMaturity.primary.combo;
                const isPrimaryCore = primaryCombo.coreCardIds.includes(card.id);
                const isPrimarySupport =
                  primaryCombo.supportCardIds.includes(card.id) ||
                  card.archetypeTag === primaryCombo.shortTag;
                return (
                  <CardComponent
                    key={card.uid}
                    card={card}
                    playable={canAfford}
                    disabled={!canAfford}
                    priceTag={price}
                    highlightRole={
                      isPrimaryCore ? 'core' : isPrimarySupport ? 'support' : null
                    }
                    highlightBadgeText={
                      isPrimaryCore
                        ? `★ ${primaryCombo.shortTag}核心`
                        : isPrimarySupport
                        ? `✦ ${primaryCombo.shortTag}组件`
                        : undefined
                    }
                    ownedInDeckCount={deck.filter((d) => d.id === card.id).length}
                    onClick={() => {
                      if (gold < price) return;
                      sound.playCoin();
                      setGold((g) => g - price);
                      setDeck((prev) => [...prev, card]);
                      setShopCards((prev) => prev.filter((c) => c.uid !== card.uid));
                    }}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-amber-500/30">
              {shopRelic && (
                <button
                  type="button"
                  disabled={gold < shopRelic.price}
                  onClick={() => {
                    sound.playCoin();
                    setGold((g) => g - shopRelic.price);
                    setRelics((prev) => [...prev, shopRelic]);
                    setShopRelic(null);
                  }}
                  className="p-4 bg-slate-950/90 border-2 border-amber-400 hover:border-yellow-200 disabled:opacity-40 flex items-center gap-3 cursor-pointer transition"
                >
                  <RelicPixelArt iconType={shopRelic.iconType} className="w-10 h-10 shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-black text-amber-300">
                      {shopRelic.name}（💰{shopRelic.price}）
                    </div>
                    <div className="text-xs text-slate-300">{shopRelic.description}</div>
                  </div>
                </button>
              )}

              {shopPotion && (
                <button
                  type="button"
                  disabled={gold < shopPotion.price || potions.length >= 3}
                  onClick={() => {
                    sound.playCoin();
                    setGold((g) => g - shopPotion.price);
                    setPotions((prev) => [...prev, shopPotion]);
                    setShopPotion(null);
                  }}
                  className="p-4 bg-slate-950/90 border-2 border-emerald-400 hover:border-emerald-200 disabled:opacity-40 flex items-center gap-3 cursor-pointer transition"
                >
                  <PotionBottleSprite effectType={shopPotion.effectType} className="w-10 h-10 shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-black text-emerald-300">
                      {shopPotion.name}（💰{shopPotion.price}）
                    </div>
                    <div className="text-xs text-slate-300">{shopPotion.description}</div>
                  </div>
                </button>
              )}

              <button
                type="button"
                disabled={gold < 50 || cardRemovedInShop || deck.length <= 5}
                onClick={() => {
                  sound.playClick();
                  setModalMode('remove');
                }}
                className="p-4 bg-slate-950/90 border-2 border-rose-500 hover:border-rose-300 disabled:opacity-40 flex items-center gap-3 cursor-pointer transition"
              >
                <CardPixelArt spriteType="fireball" className="w-10 h-10 shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-black text-rose-400">
                    卡牌销毁（💰50）
                  </div>
                  <div className="text-xs text-slate-300">
                    {cardRemovedInShop ? '已使用' : '永久移除 1 张卡牌'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 6. 奇遇事件 (EVENT VIEW) ==================== */}
      {roomView === 'event' && !showMapOverlay && (
        <div className="relative z-10 w-full max-w-4xl mx-auto p-6">
          <div className="pixel-panel-gold p-8 max-w-2xl mx-auto flex flex-col items-center gap-5">
            <CardPixelArt spriteType="arcane_eye" className="w-14 h-14" />
            <h2 className="text-2xl md:text-3xl font-black tracking-wider spire-title-gold">
              ❓ {currentEvent.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 text-center max-w-lg leading-relaxed">
              {currentEvent.description}
            </p>

            {!eventOutcome ? (
              <div className="flex flex-col gap-3 w-full">
                {currentEvent.choices.map((ch, idx) => {
                  const cantAfford =
                    ch.goldChange && ch.goldChange < 0 && gold < Math.abs(ch.goldChange);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={Boolean(cantAfford)}
                      onClick={() => handleSelectEventChoice(ch)}
                      className="p-3.5 bg-slate-950/90 hover:bg-indigo-950/60 disabled:opacity-40 border-2 border-amber-400/75 hover:border-yellow-300 text-left transition cursor-pointer"
                    >
                      <div className="text-sm font-black text-amber-300">
                        ▶ {ch.label || ch.text}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 w-full">
                <div className="p-4 bg-emerald-950/40 border border-emerald-400 text-sm font-bold text-emerald-200 text-center w-full">
                  {eventOutcome}
                </div>

                {upgradedCardSummary && (
                  <CardComponent
                    card={upgradedCardSummary.card}
                    playable={true}
                    isJustUpgraded={true}
                  />
                )}

                <button
                  type="button"
                  onMouseEnter={() => sound.playHover()}
                  onClick={() => {
                    setUpgradingCardUid(null);
                    setUpgradedCardSummary(null);
                    triggerRoomTransition('map', actNameLabel, '', 'war_banner');
                  }}
                  className="pl-12 pr-9 py-2.5 spire-ribbon-teal text-amber-200 hover:text-white font-black text-xs sm:text-sm tracking-widest cursor-pointer transition-transform hover:translate-x-1"
                >
                  继续前进 ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== 7. 通关与战败画面 ==================== */}
      {(roomView === 'victory' || roomView === 'gameover') && !showMapOverlay && (
        <div className="relative z-10 w-full max-w-3xl mx-auto p-6">
          <div className="pixel-panel-gold p-8 text-center max-w-lg mx-auto flex flex-col items-center gap-5">
            <CardPixelArt
              spriteType={roomView === 'victory' ? 'demon_crown' : 'venom_skull'}
              className="w-20 h-20"
            />
            <h2
              className={`text-3xl md:text-4xl font-black tracking-wider ${
                roomView === 'victory' ? 'spire-title-gold' : 'text-red-500 drop-shadow-[0_3px_0_#000]'
              }`}
            >
              {roomView === 'victory' ? '👑 荣耀通关！' : '💀 登塔陨落'}
            </h2>
            <div className="text-xs text-amber-200 font-mono bg-slate-950/90 px-4 py-2 border border-amber-500/40">
              层数：{currentFloor}/45F · 牌组：{deck.length}张 · 遗物：{relics.length}件
            </div>
            <button
              type="button"
              onMouseEnter={() => sound.playHover()}
              onClick={onExitToMenu}
              className="pl-10 pr-12 py-3 spire-ribbon-crimson text-amber-200 hover:text-white font-black text-sm tracking-widest cursor-pointer"
            >
              ◀ 返回角色选择
            </button>
          </div>
        </div>
      )}

      {/* ==================== 牌组 / 流派推荐组合图鉴 / 锻造升级 / 移除卡牌 弹窗 ==================== */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="pixel-panel-gold max-w-6xl w-full max-h-[90vh] flex flex-col p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-amber-400">
                  {modalMode === 'compendium' && '📖 三大职业【卡牌推荐组合】与全图鉴'}
                  {modalMode === 'deck' && `🃏 当前牌组 (${deck.length})`}
                  {modalMode === 'draw' && `🎴 抽牌堆 (${drawPile.length})`}
                  {modalMode === 'discard' && `♻️ 弃牌堆 (${discardPile.length})`}
                  {modalMode === 'exhaust' && `🔥 消耗堆 (${exhaustPile.length})`}
                  {modalMode === 'upgrade' &&
                    (upgradedCardSummary
                      ? `✨【${upgradedCardSummary.card.name}+】升级完成！`
                      : '⚒️ 点击 1 张卡牌进行锻造升级')}
                  {modalMode === 'remove' && '🔥 点击 1 张卡牌永久销毁'}
                </h3>

                {(modalMode === 'deck' || modalMode === 'compendium') && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setModalMode('deck')}
                      className={`px-2.5 py-1 text-xs font-black border cursor-pointer ${
                        modalMode === 'deck'
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      🃏 我的牌组 ({deck.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalMode('compendium')}
                      className={`px-2.5 py-1 text-xs font-black border cursor-pointer ${
                        modalMode === 'compendium'
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      📖 卡牌推荐组合 & 图鉴
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {modalMode === 'upgrade' && !upgradedCardSummary && (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeDeltaPreview((p) => !p)}
                    className="px-3 py-1 bg-emerald-950 border border-emerald-400 text-xs font-bold text-emerald-200 cursor-pointer"
                  >
                    {showUpgradeDeltaPreview ? '🔍 数值预览：开' : '🔍 数值预览：关'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const wasUpgraded = Boolean(upgradedCardSummary);
                    setUpgradingCardUid(null);
                    setUpgradedCardSummary(null);
                    setModalMode(null);
                    if (wasUpgraded) {
                      triggerRoomTransition('map', actNameLabel, '', 'war_banner');
                    }
                  }}
                  className="px-4 py-1.5 pixel-btn-slate text-xs font-bold text-white cursor-pointer"
                >
                  {upgradedCardSummary ? '返回地图 ▶' : '关闭 ✕'}
                </button>
              </div>
            </div>

            {/* 当处于【流派组合图鉴】或【我的牌组】时，顶部显示12大流派成型路线图与定向锁定功能 */}
            {(modalMode === 'compendium' || modalMode === 'deck') && (
              <div className="mb-4 p-3.5 bg-slate-950 border-2 border-amber-400/70 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-black text-amber-300 mr-1">
                      ★ 选择流派查看三阶段成型路线：
                    </span>
                    {RECOMMENDED_ARCHETYPE_COMBOS.map((combo) => {
                      const isSelected = inRunComboId === combo.id;
                      const isLocked = lockedArchetypeComboId === combo.id;
                      const isMyClass = combo.classType === playerClass;
                      return (
                        <button
                          key={combo.id}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setInRunComboId(isSelected ? null : combo.id);
                          }}
                          className={`px-2.5 py-1 text-xs font-black border transition cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 border-white shadow-[0_0_12px_rgba(250,204,21,0.8)]'
                              : isMyClass
                              ? 'bg-slate-900 text-amber-200 border-amber-500/60 hover:border-yellow-300'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          {isLocked ? '🔒 ' : ''}
                          {combo.title}
                        </button>
                      );
                    })}
                  </div>

                  {inRunComboId && (
                    <button
                      type="button"
                      onClick={() => setInRunComboId(null)}
                      className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-300 cursor-pointer"
                    >
                      ✕ 取消高亮
                    </button>
                  )}
                </div>

                {(() => {
                  const activeGuide = RECOMMENDED_ARCHETYPE_COMBOS.find(
                    (c) => c.id === inRunComboId
                  );
                  if (!activeGuide) return null;
                  const isMyClassGuide = activeGuide.classType === playerClass;
                  const isCurrentlyLocked = lockedArchetypeComboId === activeGuide.id;
                  const routeStats = buildMaturity.allClassRoutes.find(
                    (r) => r.combo.id === activeGuide.id
                  );

                  return (
                    <div className="p-3 bg-slate-900/90 border border-amber-400/40 flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-amber-300">
                            {activeGuide.title}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black">
                            上手难度：{activeGuide.difficulty}
                          </span>
                          {routeStats && (
                            <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-400 text-[10px] font-black text-cyan-200">
                              {routeStats.stageLabel} · 成型度 {routeStats.score}%（已拥有核心 {routeStats.coreOwnedCount}/{activeGuide.coreCardIds.length}）
                            </span>
                          )}
                        </div>

                        {isMyClassGuide && (
                          <button
                            type="button"
                            onClick={() => {
                              sound.playPower();
                              setLockedArchetypeComboId(
                                isCurrentlyLocked ? null : activeGuide.id
                              );
                            }}
                            className={`px-3 py-1 text-xs font-black border cursor-pointer transition ${
                              isCurrentlyLocked
                                ? 'bg-amber-400 text-slate-950 border-white shadow-[0_0_10px_rgba(250,204,21,0.8)]'
                                : 'bg-indigo-950 hover:bg-indigo-900 text-cyan-200 border-cyan-400'
                            }`}
                          >
                            {isCurrentlyLocked
                              ? '🔒 已锁定为本局目标路线（战利品优先掉落此流派）'
                              : '🎯 锁定为本局目标路线（定向提升此流派掉率）'}
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-amber-100/90 font-bold bg-slate-950/80 px-3 py-1.5 border-l-2 border-amber-400">
                        ⚙️ 运转逻辑：{activeGuide.coreLoop}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="px-2.5 py-2 bg-slate-950 border-l-2 border-sky-400 text-[11px] font-bold text-slate-200">
                          <div className="text-sky-300 font-black mb-0.5">
                            🌱 第一阶段 · 前期过渡组件
                          </div>
                          <div>{activeGuide.earlyStage}</div>
                        </div>
                        <div className="px-2.5 py-2 bg-slate-950 border-l-2 border-purple-400 text-[11px] font-bold text-slate-200">
                          <div className="text-purple-300 font-black mb-0.5">
                            ⚡ 第二阶段 · 中期核心引擎
                          </div>
                          <div>{activeGuide.midStage}</div>
                        </div>
                        <div className="px-2.5 py-2 bg-slate-950 border-l-2 border-amber-400 text-[11px] font-bold text-slate-200">
                          <div className="text-amber-300 font-black mb-0.5">
                            👑 第三阶段 · 后期毕业终结
                          </div>
                          <div>{activeGuide.lateStage}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {modalMode === 'upgrade' && upgradedCardSummary && (
              <div className="mb-4 p-3 bg-emerald-950/80 border-2 border-emerald-400 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold">
                  <span className="text-amber-300">
                    ⚒️ {upgradedCardSummary.card.name} ➔ {upgradedCardSummary.card.name}+
                  </span>
                  {upgradedCardSummary.oldDamage !== undefined &&
                    upgradedCardSummary.newDamage !== undefined &&
                    upgradedCardSummary.oldDamage !== upgradedCardSummary.newDamage && (
                      <span className="px-2 py-0.5 bg-slate-950 border border-red-400 text-red-300">
                        ⚔️{upgradedCardSummary.oldDamage}➔{upgradedCardSummary.newDamage}
                      </span>
                    )}
                  {upgradedCardSummary.oldBlock !== undefined &&
                    upgradedCardSummary.newBlock !== undefined &&
                    upgradedCardSummary.oldBlock !== upgradedCardSummary.newBlock && (
                      <span className="px-2 py-0.5 bg-slate-950 border border-sky-400 text-sky-300">
                        🛡️{upgradedCardSummary.oldBlock}➔{upgradedCardSummary.newBlock}
                      </span>
                    )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setUpgradingCardUid(null);
                    setUpgradedCardSummary(null);
                    setModalMode(null);
                    triggerRoomTransition('map', actNameLabel, '', 'war_banner');
                  }}
                  className="px-5 py-1.5 pixel-btn-amber text-slate-950 font-black text-xs cursor-pointer"
                >
                  ✨ 完成锻造 ▶
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-wrap justify-center gap-6 py-6 px-2">
              {(() => {
                const activeGuide =
                  modalMode === 'compendium' || modalMode === 'deck'
                    ? RECOMMENDED_ARCHETYPE_COMBOS.find((c) => c.id === inRunComboId) ||
                      null
                    : null;

                const rawCards: Card[] =
                  modalMode === 'compendium'
                    ? ALL_CARDS.filter((c) => c.classType !== 'token')
                        .sort((a, b) => {
                          if (!activeGuide) return 0;
                          const rank = (id: string) =>
                            activeGuide.coreCardIds.includes(id)
                              ? 0
                              : activeGuide.supportCardIds.includes(id)
                              ? 1
                              : 2;
                          return rank(a.id) - rank(b.id);
                        })
                        .map((c) => instantiateCard(c.id))
                    : modalMode === 'deck'
                    ? deck
                    : modalMode === 'draw'
                    ? drawPile
                    : modalMode === 'discard'
                    ? discardPile
                    : modalMode === 'exhaust'
                    ? exhaustPile
                    : modalMode === 'upgrade'
                    ? deck.filter((c) => !c.upgraded || c.uid === upgradingCardUid)
                    : deck;

                return rawCards.map((card) => {
                  const isThisJustUpgraded = card.uid === upgradingCardUid;
                  const isCore = Boolean(
                    activeGuide?.coreCardIds.includes(card.id)
                  );
                  const isSupport = Boolean(
                    activeGuide?.supportCardIds.includes(card.id)
                  );
                  const highlightRole: 'core' | 'support' | 'dimmed' | null =
                    !activeGuide
                      ? null
                      : isCore
                      ? 'core'
                      : isSupport
                      ? 'support'
                      : modalMode === 'compendium'
                      ? 'dimmed'
                      : null;

                  const ownedCount =
                    modalMode === 'compendium'
                      ? deck.filter((d) => d.id === card.id).length
                      : undefined;

                  return (
                    <CardComponent
                      key={card.uid}
                      card={card}
                      compact={false}
                      playable={true}
                      isJustUpgraded={isThisJustUpgraded}
                      highlightRole={highlightRole}
                      highlightBadgeText={
                        activeGuide
                          ? isCore
                            ? `${activeGuide.shortTag}核心`
                            : isSupport
                            ? `${activeGuide.shortTag}组件`
                            : undefined
                          : undefined
                      }
                      ownedInDeckCount={ownedCount}
                      showUpgradePreview={
                        modalMode === 'upgrade' &&
                        showUpgradeDeltaPreview &&
                        !card.upgraded
                      }
                      onClick={() => {
                        if (modalMode === 'upgrade') {
                          if (upgradingCardUid) return;
                          sound.playForgeUpgrade();
                          const newCost =
                            card.upgradedCost !== undefined
                              ? card.upgradedCost
                              : card.cost;
                          const upgradedCard: Card = {
                            ...card,
                            upgraded: true,
                            cost: newCost,
                          };
                          setDeck((prev) =>
                            prev.map((c) => (c.uid === card.uid ? upgradedCard : c))
                          );
                          setUpgradingCardUid(card.uid);
                          setUpgradedCardSummary({
                            card: upgradedCard,
                            oldDamage: card.effects.damage,
                            newDamage: card.upgradedEffects.damage,
                            oldBlock: card.effects.block,
                            newBlock: card.upgradedEffects.block,
                            oldCost: card.cost,
                            newCost,
                          });
                        } else if (modalMode === 'remove') {
                          sound.playCoin();
                          setGold((g) => g - 50);
                          setDeck((prev) => prev.filter((c) => c.uid !== card.uid));
                          setCardRemovedInShop(true);
                          setModalMode(null);
                        }
                      }}
                    />
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 随机高塔叙事事件模态框 (NARRATIVE EVENT MODAL ON NON-COMBAT MAP NODES) ==================== */}
      <AnimatePresence>
        {narrativeEventModal && narrativeEventModal.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.88, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 16, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="relative w-full max-w-4xl pixel-panel-gold p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            >
              <ParticleCanvas theme="arcane" />

              {/* 顶部：节点类型与随机叙事标题 */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-500/40 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_16px_rgba(34,211,238,0.45)]">
                    <MapNodeSprite
                      type={narrativeEventModal.sourceNode.type}
                      className="w-7 h-7"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-indigo-950 border border-cyan-400 text-[11px] font-black text-cyan-300">
                        ✦ 随机高塔叙事奇遇 · 第 {narrativeEventModal.sourceNode.floor} 层
                      </span>
                      <span className="px-2 py-0.5 bg-slate-900 border border-amber-400/60 text-[11px] font-bold text-amber-300">
                        目标节点：{narrativeEventModal.sourceNode.name}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-amber-300 mt-1 drop-shadow-[0_2px_0_#000]">
                      {narrativeEventModal.event.title}
                    </h3>
                  </div>
                </div>

                {/* 当前生命与金币状态速览 */}
                <div className="flex items-center gap-2 text-xs font-mono font-black">
                  <span className="px-2.5 py-1 bg-slate-950 border border-red-500 text-red-400">
                    ❤️ {hp}/{maxHp}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-950 border border-amber-400 text-yellow-300">
                    💰 {gold}
                  </span>
                </div>
              </div>

              {/* 中部：左侧像素叙事插画 + 右侧剧情描述与分支抉择 */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* 左侧：巨型像素奇遇插画 */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-950 border-2 border-cyan-400/60 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)]">
                  <div className="w-32 h-32 rounded-full bg-radial from-indigo-500/30 via-slate-900 to-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_24px_rgba(251,191,36,0.3)]">
                    <CardPixelArt
                      spriteType={narrativeEventModal.event.iconType || 'arcane_eye'}
                      className="w-20 h-20"
                    />
                  </div>
                  <span className="mt-3 text-xs font-black text-cyan-300 tracking-wider">
                    【命运分支抉择】
                  </span>
                </div>

                {/* 右侧：叙事文本 + 分支选择 / 结果反馈 */}
                <div className="md:col-span-8 flex flex-col gap-4">
                  <div className="p-4 bg-slate-950/95 border-2 border-slate-700 text-sm text-slate-200 leading-relaxed font-medium shadow-inner">
                    {narrativeEventModal.event.description}
                  </div>

                  {!narrativeEventModal.outcome ? (
                    <div className="flex flex-col gap-2.5">
                      {narrativeEventModal.event.choices.map((choice, cIdx) => {
                        const cantAfford =
                          choice.goldChange !== undefined &&
                          choice.goldChange < 0 &&
                          gold < Math.abs(choice.goldChange);

                        return (
                          <button
                            key={cIdx}
                            type="button"
                            disabled={cantAfford}
                            onClick={() => handleSelectNarrativeModalChoice(choice)}
                            className={`w-full text-left p-3.5 border-2 transition-all flex flex-col gap-1.5 ${
                              cantAfford
                                ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-slate-900/95 hover:bg-indigo-950/90 border-amber-400/80 hover:border-yellow-300 hover:translate-x-1 cursor-pointer shadow-[0_4px_0_#020617]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-amber-300 text-sm">
                                ▶ {choice.label}
                              </span>
                              {cantAfford && (
                                <span className="text-[11px] font-bold text-red-400">
                                  金币不足
                                </span>
                              )}
                            </div>

                            {/* 视觉化收益/代价标签徽章 */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black">
                              {choice.hpChange !== undefined && choice.hpChange < 0 && (
                                <span className="px-2 py-0.5 bg-red-950 border border-red-500 text-red-300">
                                  💔 生命 {choice.hpChange}
                                </span>
                              )}
                              {choice.hpChange !== undefined && choice.hpChange > 0 && (
                                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300">
                                  ❤️ 恢复 +{choice.hpChange} HP
                                </span>
                              )}
                              {choice.maxHpChange !== undefined && (
                                <span
                                  className={`px-2 py-0.5 border ${
                                    choice.maxHpChange > 0
                                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                                      : 'bg-red-950 border-red-500 text-red-300'
                                  }`}
                                >
                                  🩸 最大生命{' '}
                                  {choice.maxHpChange > 0
                                    ? `+${choice.maxHpChange}`
                                    : choice.maxHpChange}
                                </span>
                              )}
                              {choice.goldChange !== undefined && (
                                <span
                                  className={`px-2 py-0.5 border ${
                                    choice.goldChange > 0
                                      ? 'bg-amber-950 border-amber-400 text-yellow-300'
                                      : 'bg-red-950 border-red-500 text-red-300'
                                  }`}
                                >
                                  💰 金币{' '}
                                  {choice.goldChange > 0
                                    ? `+${choice.goldChange}`
                                    : choice.goldChange}
                                </span>
                              )}
                              {choice.cardDraftReward && (
                                <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-200">
                                  🎁 卡牌奖励（三选一构筑卡）
                                </span>
                              )}
                              {choice.gainRareCard && (
                                <span className="px-2 py-0.5 bg-amber-950 border border-yellow-400 text-yellow-200">
                                  🌟 获得稀有职业卡
                                </span>
                              )}
                              {choice.gainRandomCard && (
                                <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-400 text-indigo-200">
                                  🃏 获得随机职业卡
                                </span>
                              )}
                              {choice.upgradeRandomCard && (
                                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-400 text-emerald-200">
                                  ⚒️ 随机升级卡牌
                                </span>
                              )}
                              {choice.gainRelic && (
                                <span className="px-2 py-0.5 bg-purple-950 border border-purple-400 text-purple-200">
                                  👑 获得随机圣物遗物
                                </span>
                              )}
                              {choice.removeRandomCard && (
                                <span className="px-2 py-0.5 bg-sky-950 border border-sky-400 text-sky-200">
                                  🔥 精简移除 1 张卡牌
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* 叙事结果反馈框 */}
                      <div className="p-4 bg-emerald-950/50 border-2 border-emerald-400 text-emerald-200 text-sm font-bold leading-relaxed">
                        ✨ {narrativeEventModal.outcome}
                      </div>

                      {/* 若触发三选一卡牌奖励，在模态框内直接展示3张卡牌供玩家挑选 */}
                      {narrativeEventModal.draftCards.length > 0 && (
                        <div className="p-4 bg-slate-950 border-2 border-cyan-400 flex flex-col items-center gap-3">
                          <span className="text-xs font-black text-cyan-300">
                            🎁 请从以下 3 张流派卡牌中挑选 1 张加入你的牌组：
                          </span>
                          <div className="flex flex-wrap items-center justify-center gap-4">
                            {narrativeEventModal.draftCards.map((dCard) => (
                              <CardComponent
                                key={dCard.uid}
                                card={dCard}
                                compact={true}
                                playable={true}
                                onClick={() => handlePickNarrativeDraftCard(dCard)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 展示获得的单张卡牌或遗物 */}
                      {(narrativeEventModal.rewardedCard ||
                        narrativeEventModal.rewardedRelic) && (
                        <div className="flex flex-wrap items-center justify-center gap-6 p-3 bg-slate-950/90 border border-amber-400/60">
                          {narrativeEventModal.rewardedCard && (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-xs font-black text-amber-300">
                                🃏 已加入牌组 / 升华完成：
                              </span>
                              <CardComponent
                                card={narrativeEventModal.rewardedCard}
                                compact={true}
                                playable={false}
                              />
                            </div>
                          )}
                          {narrativeEventModal.rewardedRelic && (
                            <div className="flex items-center gap-3 p-3 bg-slate-900 border-2 border-purple-400">
                              <RelicPixelArt
                                iconType={narrativeEventModal.rewardedRelic.iconType}
                                className="w-12 h-12"
                              />
                              <div>
                                <div className="text-xs font-black text-purple-300">
                                  👑 获得遗物：{narrativeEventModal.rewardedRelic.name}
                                </div>
                                <div className="text-xs text-slate-300 mt-0.5">
                                  {narrativeEventModal.rewardedRelic.description}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleCloseNarrativeModalAndProceed}
                        className="self-end px-6 py-2.5 pixel-btn-amber text-slate-950 font-black text-sm cursor-pointer"
                      >
                        {narrativeEventModal.sourceNode.type === 'event'
                          ? '✨ 完成奇遇 · 返回尖塔地图 ▶'
                          : `✨ 继续前往【${narrativeEventModal.sourceNode.name}】 ▶`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
