export type ClassType = 'warrior' | 'mage' | 'assassin';

export type CardType = 'attack' | 'skill' | 'power';
export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare';
export type CardTarget = 'single' | 'all' | 'self';

export type OrbType = 'fire' | 'frost' | 'lightning' | 'dark';

export interface CardEffect {
  damage?: number;
  hits?: number;
  block?: number;
  draw?: number;
  energyGain?: number;
  selfHpLoss?: number;
  heal?: number;
  // Status applications to target or self
  vulnerable?: number;
  weak?: number;
  poison?: number;
  burn?: number;
  strength?: number;
  dexterity?: number;
  focus?: number; // 法师：元素集中（提高所有充能球被动与激发数值）
  thornsGain?: number; // 荆棘反伤
  metallicizeGain?: number; // 回合末固定护甲
  // Permanent combat powers
  retainBlock?: number; // 钢铁壁垒：回合切换时不清空全部格挡（保留上限）
  ritualPlayer?: number; // 恶魔形态：每回合开始获得力量
  swordMastery?: number; // 剑神降临：每回合开始获得剑意
  infiniteBlades?: number; // 无限刃舞：每回合开始自动生成飞刀
  shivBonus?: number; // 精准投掷：所有飞刀伤害永久提高
  afterImage?: number; // 残影化形：每打出一张牌获得格挡
  // Commercial Archetype Powers (Ironclad / Defect / Silent)
  feelNoPain?: number; // 无惧疼痛：每消耗1张牌获得格挡
  darkEmbrace?: number; // 黑暗之拥：每消耗1张牌抽牌
  rupture?: number; // 撕裂：每从卡牌失去生命获得力量
  loopOrbPassive?: number; // 循环回路：回合末首个充能球额外触发被动
  stormPower?: number; // 雷暴引擎：每打出能力牌自动生成雷电球
  noxiousFumes?: number; // 毒雾弥漫：每回合对全体敌人施加中毒
  envenom?: number; // 涂毒之刃：每次攻击命中附加中毒
  thousandCuts?: number; // 千刀万剐：每打出一张牌对全体敌人造成伤害
  // Class unique mechanics & commercial finishers
  swordIntent?: number; // 铁卫：剑意（每层使攻击额外+1伤害，可被终结技消耗）
  consumeSwordIntentMultiplier?: number; // 消耗所有剑意，每层造成X点伤害
  strengthMultiplier?: number; // 重刃：力量在该牌上生效N倍（3倍/5倍）
  exhaustOtherHandForDamage?: number; // 恶魔之火：消耗所有其他手牌，每张造成X点伤害
  exhaustSkillsForBlock?: number; // 重振精神：消耗手牌所有非攻击牌，每张获得X格挡
  lifestealDamage?: boolean; // 死神收割：根据造成的伤害恢复等量生命
  damageEqualsBlock?: boolean; // 全身撞击：造成等同于当前格挡值的伤害
  doubleBlock?: boolean; // 巩固：翻倍当前格挡
  doubleStrength?: boolean; // 突破极限：使当前力量翻倍
  channelOrb?: OrbType | 'random'; // 法师：生成充能球
  channelOrbCount?: number; // 生成充能球数量（默认1）
  evokeAllOrbs?: boolean; // 法师：激发所有充能球
  evokeFirstOrbTwice?: boolean; // 法师：双重激发首枚充能球
  clawScaling?: number; // 雷光爪击：本场战斗所有爪击伤害永久+X
  recallZeroCostFromDiscard?: boolean; // 万物一心：将弃牌堆中所有0费牌召回手牌
  damagePerOrb?: number; // 弹幕齐射：每有一个充能球攻击1次
  triggerDarkPassive?: boolean; // 漆黑暗核：立即触发所有暗核蓄能
  doubleEnergy?: boolean; // 双倍能量：当前能量翻倍
  comboGain?: number; // 刺客：额外连击点
  consumeComboDamage?: number; // 刺客：消耗全部连击，每点造成额外伤害
  addShivs?: number; // 刺客：向手牌添加0费【飞刀】
  doublePoison?: boolean; // 催化剂：使目标中毒层数翻倍
  triplePoison?: boolean; // 催化剂+：使目标中毒层数变为3倍
  detonatePoison?: boolean; // 尸爆术：立即引爆并结算一次目标当前剧毒层数的伤害
  damagePerCardPlayedThisTurn?: boolean; // 终结技：本回合每打出过1张牌攻击1次
  calculatedGamble?: boolean; // 计算下注：弃掉所有其他手牌并抽取等量卡牌
  exhaustOneRandomOtherCard?: boolean; // 百战坚毅/灰烬契约：消耗手牌中1张其他牌触发消耗引擎
  orbSlotGain?: number; // 星轨扩容矩阵：增加充能球槽位上限
  shatterEnemyBlock?: boolean; // 熔核爆破：瞬间击碎目标所有格挡
  detonateBurn?: number | boolean; // 熔核爆破：立即引爆触发一次目标当前灼烧层数的伤害
  detonatePoisonAll?: boolean; // 瘟疫尸爆：立即引爆目标剧毒并对所有敌人造成等额伤害
  discardOneCard?: boolean; // 掠影投刃：战术弃置1张手牌并触发弃牌收益
  damageBonusPerDiscarded?: number; // 剔骨连斩：本回合每弃置过1张牌额外增加伤害
  zeroCostDrawSynergy?: boolean; // 零式跃迁：根据手牌0费卡数量获得额外护甲与爪击增幅
  costReducedByDiscardsThisTurn?: boolean;
  hitsPerOrb?: number;
  hitsPerAttackPlayed?: number;
  exhaustHandSkills?: boolean;
  blockPerExhausted?: number;
  loopOrb?: number;
}

export interface Card {
  id: string;
  uid: string;
  name: string;
  classType: ClassType | 'neutral' | 'token';
  type: CardType;
  rarity: CardRarity;
  cost: number;
  upgraded?: boolean;
  upgradedCost?: number;
  target: CardTarget;
  archetypeTag?: string; // 构筑流派标签
  buildStage?: 'early' | 'mid' | 'late'; // 构筑成型阶段：起手铺垫 / 核心引擎 / 毕业终结
  description: string;
  upgradedDescription: string;
  effects: CardEffect;
  upgradedEffects: CardEffect;
  exhaust?: boolean; // 消耗词条
  spriteType: string;
  price?: number;
  comboSynergy?: {
    partnerArchetype: string;
    effectDesc: string;
    bonusDamage?: number;
    bonusBlock?: number;
    bonusDraw?: number;
  };
}

export interface StatusMap {
  strength: number;        // 力量：攻击伤害增减
  dexterity: number;       // 敏捷：护甲获取增减
  focus: number;           // 集中：充能球数值提升
  vulnerable: number;      // 脆弱：受到攻击伤害+50%
  weak: number;            // 虚弱：造成攻击伤害-25%
  poison: number;          // 中毒：回合开始受伤害并减1
  burn: number;            // 灼烧：回合开始受伤害
  thorns: number;          // 荆棘：被攻击时反弹伤害
  metallicize: number;     // 金属化：回合结束自动获得格挡
  ritual: number;          // 邪能仪式：每回合结束/开始获得力量
  retainBlock: number;     // 壁垒保留护甲值
  swordMastery: number;    // 每回合自动获得剑意
  infiniteBlades: number;  // 每回合自动获得飞刀数
  shivBonus: number;       // 飞刀额外伤害加成
  afterImage: number;      // 每打出一张牌获得的格挡值
  feelNoPain: number;      // 无惧疼痛：每消耗1张牌获得格挡
  darkEmbrace: number;     // 黑暗之拥：每消耗1张牌抽牌
  rupture: number;         // 撕裂：卖血自残时获得力量
  loopOrb: number;         // 循环回路：额外触发首枚充能球被动
  stormPower: number;      // 雷暴引擎：打出能力牌生成雷球
  noxiousFumes: number;    // 毒雾弥漫：每回合对全体敌人施加中毒
  envenom: number;         // 涂毒之刃：攻击附加中毒
  thousandCuts: number;    // 千刀万剐：每打出一张牌对全体造成伤害
}

export type IntentType =
  | 'attack'
  | 'defend'
  | 'buff'
  | 'debuff'
  | 'attack_defend'
  | 'attack_debuff';

export interface EnemyIntent {
  type: IntentType;
  damage?: number;
  hits?: number;
  block?: number;
  statusName?: keyof StatusMap;
  statusAmount?: number;
  label: string;
}

export interface Enemy {
  id: string;
  uid: string;
  name: string;
  title?: string;
  tier: 'normal' | 'elite' | 'boss';
  maxHp: number;
  hp: number;
  block: number;
  statuses: StatusMap;
  intents: EnemyIntent[];
  intentIndex: number;
  spriteType: string;
  // Multi-phase Boss Berserk Transition (triggered at HP <= 50%)
  phase?: 1 | 2;
  berserkName?: string;
  berserkTitle?: string;
  berserkQuote?: string;
  berserkBuffs?: {
    strength?: number;
    metallicize?: number;
    thorns?: number;
    ritual?: number;
    blockGain?: number;
  };
  berserkIntents?: EnemyIntent[];
}

export type RelicTier = 'starter' | 'common' | 'uncommon' | 'rare' | 'boss';

export interface Relic {
  id: string;
  name: string;
  tier: RelicTier;
  description: string;
  flavorText: string;
  iconType: string;
  price: number;
  classSpecific?: ClassType;
  energyBonus?: number; // 首领遗物：每回合最大能量+1
}

export interface Potion {
  id: string;
  name: string;
  description: string;
  color: string;
  price: number;
  effectType:
    | 'heal'
    | 'energy'
    | 'block'
    | 'strength'
    | 'poison_all'
    | 'draw'
    | 'focus'
    | 'sword_intent';
  value: number;
}

export interface Orb {
  id: string;
  type: OrbType;
  name: string;
  passiveValue: number;
  evokeValue: number;
}

export type MapNodeType =
  | 'combat'
  | 'elite'
  | 'rest'
  | 'treasure'
  | 'shop'
  | 'event'
  | 'boss';

export interface MapNode {
  id: string;
  act: number;
  floor: number; // Global floor 1..45 (15 floors per Act x 3 Acts)
  actFloor: number; // Floor within act 1..15
  col: number;
  xPercent: number;
  type: MapNodeType;
  name: string;
  subtitle: string;
  completed: boolean;
  connections: string[];
}

export interface GameEventChoice {
  text: string;
  label?: string;
  subtext: string;
  outcomeText: string;
  hpChange?: number;
  maxHpChange?: number;
  goldChange?: number;
  upgradeRandomCard?: boolean;
  gainRelic?: boolean;
  gainRandomCard?: boolean;
  gainRareCard?: boolean;
  draftClassCard?: boolean;
  cardDraftReward?: boolean;
  removeRandomCard?: boolean;
}

export interface SpireEvent {
  id: string;
  title: string;
  iconType?: string;
  act?: number;
  description: string;
  choices: GameEventChoice[];
}

export interface NeowBlessing {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconType: string;
  effect: 'max_hp' | 'gold' | 'upgrade_two' | 'rare_card' | 'boss_swap_relic' | 'free_relic_hp_cost';
}

export interface RunHistoryRecord {
  id: string;
  date: string;
  playerClass: ClassType;
  ascension: number;
  reachedFloor: number;
  reachedAct: number;
  victory: boolean;
  deckSize: number;
  relicCount: number;
}
