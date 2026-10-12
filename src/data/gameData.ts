import {
  Card,
  ClassType,
  Enemy,
  MapNode,
  MapNodeType,
  NeowBlessing,
  Potion,
  Relic,
  SpireEvent,
  StatusMap,
} from '../types/game';

export const EMPTY_STATUS: StatusMap = {
  strength: 0,
  dexterity: 0,
  focus: 0,
  vulnerable: 0,
  weak: 0,
  poison: 0,
  burn: 0,
  thorns: 0,
  metallicize: 0,
  ritual: 0,
  retainBlock: 0,
  swordMastery: 0,
  infiniteBlades: 0,
  shivBonus: 0,
  afterImage: 0,
  feelNoPain: 0,
  darkEmbrace: 0,
  rupture: 0,
  loopOrb: 0,
  stormPower: 0,
  noxiousFumes: 0,
  envenom: 0,
  thousandCuts: 0,
};

export interface ClassMeta {
  id: ClassType;
  name: string;
  title: string;
  maxHp: number;
  startingGold: number;
  mechanicName: string;
  mechanicDesc: string;
  archetypes: { name: string; desc: string }[];
  description: string;
  starterRelicId: string;
  themeColor: string;
}

export const CHARACTER_CLASSES: Record<ClassType, ClassMeta> = {
  warrior: {
    id: 'warrior',
    name: '铁卫剑圣',
    title: '力量倍增 · 壁垒盾猛 · 消耗拥抱 · 卖血狂战',
    maxHp: 82,
    startingGold: 100,
    mechanicName: '【力量重刃】·【壁垒盾猛】·【消耗拥抱】·【卖血狂战】',
    mechanicDesc:
      '四大成熟商业构筑体系：通过《突破极限》翻倍力量配合《千钧重刃》5倍力量收益；依靠《钢铁壁垒》+《固若金汤》叠百甲打出《全身撞击》；以《无惧疼痛》+《黑暗之拥》+《恶魔之火》构建消耗引擎；或用《撕裂血咒》+《死神收割》卖血吸血永动。',
    archetypes: [
      { name: '💪 力量重刃流', desc: '《活动肌肉》《恶魔形态》《突破极限》指数翻倍力量，用5倍力量加成的《千钧重刃》或《旋风连斩》瞬间清场。' },
      { name: '🛡️ 壁垒盾猛流', desc: '《钢铁壁垒》保留护甲、《固若金汤》护盾翻倍，配合0费《全身撞击》造成等同于护甲的百点巨额伤害。' },
      { name: '🔥 消耗拥抱流', desc: '开启《无惧疼痛》（消耗得甲）与《黑暗之拥》（消耗抽牌），用《重振精神》《恶魔之火》烧光手牌秒杀强敌。' },
      { name: '🩸 卖血狂战流', desc: '激活《撕裂血咒》（自残加力量），用《血祭神坛》《御血狂斩》高频爆发，再靠《死神收割》群体吸血回满。' },
    ],
    description:
      '身披黑曜重甲的百战铁卫。拥有力量倍增、壁垒重甲、卡牌消耗与沸血自残四大经典商业级构筑引擎。',
    starterRelicId: 'burning_blood',
    themeColor: 'red',
  },
  mage: {
    id: 'mage',
    name: '星界秘法师',
    title: '集中多球 · 零费爪击 · 暗核蓄爆 · 雷暴能力',
    maxHp: 72,
    startingGold: 105,
    mechanicName: '【元素集中】·【零费爪击】·【暗核蓄爆】·【雷暴能力】',
    mechanicDesc:
      '四大成熟商业构筑体系：叠加《偏差认知》高额集中强化充能球；围绕0费成长卡《雷光爪击》与《万物一心》群体召回0费牌无限连打；用《循环回路》养大【暗物质球】双倍激发秒杀首领；或靠《雷暴引擎》打出能力牌自动召雷。',
    archetypes: [
      { name: '🔮 集中多球流', desc: '《偏差认知》《元素共鸣》大幅提升集中，配合《极寒冰川》《弹幕齐射》《元素超载》攻防一体。' },
      { name: '🐾 零费爪击流', desc: '每次打出0费《雷光爪击》全场爪击伤害永久暴涨，再用《万物一心》把弃牌堆所有0费牌全部捞回手牌！' },
      { name: '🌑 暗核蓄爆流', desc: '通过《虚空暗核》与《循环回路》每回合高速叠高暗影球伤害，用《双重激发》打出毁天灭地的单点核爆。' },
      { name: '⚡ 雷暴能力流', desc: '开启《雷暴引擎》后每打出一张能力牌自动生成雷霆球，配合《双倍能量》倾泻无尽雷罚。' },
    ],
    description:
      '掌控星界法则的秘法学者。驾驭集中法球、0费万物一心爪击、暗物质蓄爆与能力雷暴四大构筑体系。',
    starterRelicId: 'cracked_core',
    themeColor: 'cyan',
  },
  assassin: {
    id: 'assassin',
    name: '暗影刺客',
    title: '小刀风暴 · 催化毒爆 · 弃牌赌徒 · 残影千刃',
    maxHp: 75,
    startingGold: 115,
    mechanicName: '【小刀风暴】·【催化毒爆】·【弃牌赌徒】·【残影千刃】',
    mechanicDesc:
      '四大成熟商业构筑体系：《精准投掷》+《无限刃舞》+《刀刃之舞》一回合倾泻十把高伤0费飞刀触发《绝命终结技》；用《毒雾弥漫》+《剧毒催化剂》三倍叠毒配合《瘟疫尸爆》融化首领；或靠《计算下注》全手牌洗牌联动《千刀万剐》《残影化形》。',
    archetypes: [
      { name: '🗡️ 小刀风暴流', desc: '《精准投掷》大幅强化0费飞刀，配合《刀刃之舞》《无限刃舞》一回合打出十余张牌，接《绝命终结技》斩杀。' },
      { name: '☠️ 催化毒爆流', desc: '《毒雾弥漫》《弹跳毒瓶》叠毒，用《剧毒催化剂+》使毒层直接变为3倍，再以《致命毒爆》瞬间引爆。' },
      { name: '🎲 弃牌赌徒流', desc: '利用0费《计算下注》弃掉全手牌并重抽等量新牌，瞬间刷满连击点并触发《肾上腺素》高速过牌。' },
      { name: '🌑 残影千刃流', desc: '同时开启《残影化形》（出牌得甲）、《千刀万剐》（出牌全体AOE）与《涂毒之刃》，出牌即攻防一体。' },
    ],
    description:
      '行走于深渊暗影中的诡道猎手。精通0费飞刀风暴、三倍催化毒爆、全手牌换牌赌徒与残影千刃四大流派。',
    starterRelicId: 'ring_of_snake',
    themeColor: 'emerald',
  },
};

export const NEOW_BLESSINGS: NeowBlessing[] = [
  {
    id: 'neow_max_hp',
    title: '【古鲸的生命赐福】',
    subtitle: '稳健体魄强化',
    description: '最大生命值永久 +12，并立即回复全部生命。',
    iconType: 'holy_grail',
    effect: 'max_hp',
  },
  {
    id: 'neow_gold',
    title: '【古鲸的黄金秘宝】',
    subtitle: '充裕开局资金',
    description: '立即获得 +100 枚金币，可在黑市商店尽情采购。',
    iconType: 'relic_marbles',
    effect: 'gold',
  },
  {
    id: 'neow_upgrade_two',
    title: '【古鲸的淬炼神恩】',
    subtitle: '开局牌组精炼',
    description: '立即随机升级你初始牌组中的 2 张卡牌！',
    iconType: 'heavy_blade',
    effect: 'upgrade_two',
  },
  {
    id: 'neow_rare_card',
    title: '【古鲸的禁忌秘籍】',
    subtitle: '核心流派抢先成型',
    description: '立即获得 1 张本职业专属的【稀有金色卡牌】加入牌组！',
    iconType: 'scroll',
    effect: 'rare_card',
  },
  {
    id: 'neow_blood_relic',
    title: '【古鲸的鲜血契约】',
    subtitle: '高风险高回报',
    description: '失去 10 点当前生命值，立即获得 1 件强力【稀有遗物】！',
    iconType: 'relic_philosopher',
    effect: 'free_relic_hp_cost',
  },
];

export const RELICS_POOL: Relic[] = [
  // 初始伴生遗物
  {
    id: 'burning_blood',
    name: '燃烧之血',
    tier: 'starter',
    description: '在每场战斗胜利结束时，自动回复 8 点生命值。',
    flavorText: '不屈铁卫体内流淌着永不熄灭的滚烫战血。',
    iconType: 'relic_burning_blood',
    price: 150,
    classSpecific: 'warrior',
  },
  {
    id: 'cracked_core',
    name: '裂隙魔核',
    tier: 'starter',
    description: '在每场战斗开始时，自动生成 1 枚【雷霆充能球】。',
    flavorText: '跳动着星界电弧的神秘高塔核心碎片。',
    iconType: 'relic_cracked_core',
    price: 150,
    classSpecific: 'mage',
  },
  {
    id: 'ring_of_snake',
    name: '毒蛇指环',
    tier: 'starter',
    description: '在每场战斗首回合额外抽 1 张牌，并对所有敌人施加 3 层【剧毒】。',
    flavorText: '由远古剧毒魔蛇獠牙雕琢而成的翠绿指环。',
    iconType: 'relic_ring_snake',
    price: 150,
    classSpecific: 'assassin',
  },
  // 通用与进阶遗物
  {
    id: 'vajra',
    name: '金刚杵',
    tier: 'common',
    description: '在每场战斗开始时，获得 2 点【力量】（所有攻击伤害+2）。',
    flavorText: '蕴含雷霆千钧之力的古老镀金法器。',
    iconType: 'relic_vajra',
    price: 140,
  },
  {
    id: 'oddly_smooth_stone',
    name: '光滑奇石',
    tier: 'common',
    description: '在每场战斗开始时，获得 2 点【敏捷】（所有卡牌格挡+2）。',
    flavorText: '历经岁月冲刷，触感温润如玉的奇异鹅卵石。',
    iconType: 'relic_smooth_stone',
    price: 140,
  },
  {
    id: 'anchor',
    name: '远古船锚',
    tier: 'common',
    description: '在每场战斗的第一回合开始时，自动获得 12 点【格挡】。',
    flavorText: '即便身处高塔之巅，它依然稳如泰山。',
    iconType: 'relic_anchor',
    price: 135,
  },
  {
    id: 'lantern',
    name: '幽魂提灯',
    tier: 'common',
    description: '在每场战斗的第一回合开始时，额外获得 1 点【能量】。',
    flavorText: '幽蓝的冥火在提灯中静静燃烧，照亮前路。',
    iconType: 'relic_lantern',
    price: 145,
  },
  {
    id: 'bronze_scales',
    name: '青铜龙鳞',
    tier: 'common',
    description: '战斗开始时获得 4 点【荆棘】（受到攻击时反弹 4 点伤害）。',
    flavorText: '锋利的青铜鳞片令任何胆敢近身的敌人付出代价。',
    iconType: 'relic_scales',
    price: 130,
  },
  {
    id: 'orichalcum',
    name: '山铜护符',
    tier: 'common',
    description: '如果你在回合结束时没有任何格挡，自动获得 7 点【格挡】。',
    flavorText: '失落亚特兰蒂斯锻造的不朽护身符。',
    iconType: 'relic_orichalcum',
    price: 135,
  },
  {
    id: 'bag_of_marbles',
    name: '弹珠袋',
    tier: 'common',
    description: '每场战斗开始时，对所有敌人施加 2 层【易伤】（受到伤害+50%）。',
    flavorText: '哪怕最凶猛的魔物，踩到弹珠也会重心不稳。',
    iconType: 'relic_marbles',
    price: 140,
  },
  {
    id: 'shuriken_relic',
    name: '疾风手里剑',
    tier: 'uncommon',
    description: '每当你在一回合内打出第 3 张牌时，自动获得 1 点【力量】！',
    flavorText: '越战越勇，攻势如疾风骤雨般连绵不绝。',
    iconType: 'shuriken',
    price: 165,
  },
  {
    id: 'kunai_relic',
    name: '暗影苦无',
    tier: 'uncommon',
    description: '每当你在一回合内打出第 3 张牌时，自动获得 1 点【敏捷】！',
    flavorText: '攻守兼备的忍者秘器，身法随刀光而动。',
    iconType: 'dagger',
    price: 165,
  },
  {
    id: 'data_disk',
    name: '星界法典',
    tier: 'uncommon',
    description: '每场战斗开始时，获得 2 点【集中】（充能球被动与激发效果+2）并抽 1 张牌。',
    flavorText: '记载着高阶星辰运转轨迹的水晶残页。',
    iconType: 'arcane_eye',
    price: 160,
  },
  {
    id: 'meat_on_bone',
    name: '龙骨烤肉',
    tier: 'uncommon',
    description: '战斗结束时，若你的生命值低于或等于 50%，额外回复 12 点生命值。',
    flavorText: '香气四溢的魔兽烤肉，绝境求生的最佳补给。',
    iconType: 'blood',
    price: 155,
  },
  {
    id: 'ice_cream',
    name: '永恒冰晶护符',
    tier: 'rare',
    description: '每场战斗开始时，自动获得 4 点【金属化】（每回合结束自动+4格挡）。',
    flavorText: '永不融化的极北寒晶，时刻凝结出坚冰护盾。',
    iconType: 'relic_ice_cream',
    price: 185,
  },
  // 首领专属质变遗物 (Boss Relics)
  {
    id: 'cursed_key',
    name: '星辰王冠',
    tier: 'boss',
    description: '【首领遗物】每回合最大能量 +1（变为 4 点能量），每场战斗开始时额外抽 1 张牌！',
    flavorText: '历代尖塔君王佩戴的璀璨冠冕，蕴含无穷魔力。',
    iconType: 'relic_boss_crown',
    price: 260,
    energyBonus: 1,
  },
  {
    id: 'philosopher_stone',
    name: '贤者之石',
    tier: 'boss',
    description: '【首领遗物】每回合最大能量 +1（变为 4 点能量），战斗开始时自身额外获得 1 点力量！',
    flavorText: '炼金术的终极造物，将凡铁化作神兵。',
    iconType: 'relic_philosopher',
    price: 260,
    energyBonus: 1,
  },
  {
    id: 'demon_heart',
    name: '绯红龙心结晶',
    tier: 'boss',
    description: '【首领遗物】每场战斗开始时获得 3 点【力量】、3 点【敏捷】与 2 点【集中】！',
    flavorText: '跳动着远古巨龙本源之力的绯红宝石。',
    iconType: 'demon_crown',
    price: 250,
  },
];

export const POTIONS_POOL: Potion[] = [
  {
    id: 'potion_heal',
    name: '生命灵药',
    description: '立即回复 20 点生命值。',
    color: 'bg-red-700 border-red-300',
    price: 50,
    effectType: 'heal',
    value: 20,
  },
  {
    id: 'potion_energy',
    name: '能量秘药',
    description: '本回合立即获得 2 点能量。',
    color: 'bg-amber-600 border-yellow-200',
    price: 50,
    effectType: 'energy',
    value: 2,
  },
  {
    id: 'potion_block',
    name: '铁壁药剂',
    description: '立即获得 16 点格挡。',
    color: 'bg-sky-700 border-sky-300',
    price: 45,
    effectType: 'block',
    value: 16,
  },
  {
    id: 'potion_strength',
    name: '狂暴药剂',
    description: '本场战斗获得 3 点力量。',
    color: 'bg-orange-700 border-orange-300',
    price: 55,
    effectType: 'strength',
    value: 3,
  },
  {
    id: 'potion_poison',
    name: '剧毒魔瓶',
    description: '对所有敌人施加 7 层剧毒。',
    color: 'bg-emerald-700 border-emerald-300',
    price: 50,
    effectType: 'poison_all',
    value: 7,
  },
  {
    id: 'potion_draw',
    name: '疾风抽牌药水',
    description: '立即抽 3 张牌。',
    color: 'bg-indigo-700 border-indigo-300',
    price: 50,
    effectType: 'draw',
    value: 3,
  },
  {
    id: 'potion_focus',
    name: '星辉集中药剂',
    description: '本场战斗获得 3 点【集中】与 2 点【敏捷】。',
    color: 'bg-cyan-700 border-cyan-300',
    price: 55,
    effectType: 'focus',
    value: 3,
  },
];

export const ALL_CARDS: Omit<Card, 'uid'>[] = [
  // ==================== 衍生专属卡牌 (Token) ====================
  {
    id: 'shiv',
    name: '飞刀',
    classType: 'token',
    type: 'attack',
    rarity: 'starter',
    cost: 0,
    target: 'single',
    archetypeTag: '千刃飞刀流',
    buildStage: 'early',
    description: '造成 4 点伤害。消耗。',
    upgradedDescription: '造成 7 点伤害。消耗。',
    effects: { damage: 4 },
    upgradedEffects: { damage: 7 },
    exhaust: true,
    spriteType: 'shuriken',
  },

  // ==================== 铁卫剑圣 (Warrior · 四大完整成型流派) ====================
  {
    id: 'w_strike',
    name: '打击',
    classType: 'warrior',
    type: 'attack',
    rarity: 'starter',
    cost: 1,
    target: 'single',
    archetypeTag: '力量剑意流',
    buildStage: 'early',
    description: '造成 6 点伤害，获得 1 层【剑意】。',
    upgradedDescription: '造成 9 点伤害，获得 2 层【剑意】。',
    effects: { damage: 6, swordIntent: 1 },
    upgradedEffects: { damage: 9, swordIntent: 2 },
    spriteType: 'sword',
    price: 45,
  },
  {
    id: 'w_defend',
    name: '防御',
    classType: 'warrior',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    target: 'self',
    archetypeTag: '壁垒盾猛流',
    buildStage: 'early',
    description: '获得 5 点格挡。',
    upgradedDescription: '获得 8 点格挡。',
    effects: { block: 5 },
    upgradedEffects: { block: 8 },
    spriteType: 'shield',
    price: 45,
  },
  {
    id: 'w_bash',
    name: '痛击',
    classType: 'warrior',
    type: 'attack',
    rarity: 'starter',
    cost: 2,
    target: 'single',
    archetypeTag: '沸血狂战流',
    buildStage: 'early',
    description: '造成 8 点伤害，施加 2 层【易伤】。',
    upgradedDescription: '造成 11 点伤害，施加 3 层【易伤】。',
    effects: { damage: 8, vulnerable: 2 },
    upgradedEffects: { damage: 11, vulnerable: 3 },
    spriteType: 'heavy_blade',
    price: 60,
  },
  {
    id: 'w_iron_wave',
    name: '铁斩波',
    classType: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '壁垒盾猛流',
    buildStage: 'early',
    description: '获得 5 点格挡，造成 5 点伤害，获得 1 层【剑意】。',
    upgradedDescription: '获得 8 点格挡，造成 8 点伤害，获得 2 层【剑意】。',
    effects: { block: 5, damage: 5, swordIntent: 1 },
    upgradedEffects: { block: 8, damage: 8, swordIntent: 2 },
    spriteType: 'shield_slam',
    price: 55,
  },
  {
    id: 'w_cleave',
    name: '顺劈斩',
    classType: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'all',
    archetypeTag: '力量剑意流',
    buildStage: 'early',
    description: '对所有敌人造成 8 点伤害，获得 2 层【剑意】。',
    upgradedDescription: '对所有敌人造成 11 点伤害，获得 3 层【剑意】。',
    effects: { damage: 8, swordIntent: 2 },
    upgradedEffects: { damage: 11, swordIntent: 3 },
    spriteType: 'whirlwind',
    price: 60,
  },
  {
    id: 'w_twin_strike',
    name: '疾风双斩',
    classType: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '力量剑意流',
    buildStage: 'early',
    description: '造成 5 点伤害 2 次（享受双倍力量与剑意加成），获得 2 层【剑意】。',
    upgradedDescription: '造成 7 点伤害 2 次（享受双倍力量与剑意加成），获得 3 层【剑意】。',
    effects: { damage: 5, hits: 2, swordIntent: 2 },
    upgradedEffects: { damage: 7, hits: 2, swordIntent: 3 },
    spriteType: 'sword',
    price: 60,
  },
  {
    id: 'w_sword_aura',
    name: '剑气护体',
    classType: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    archetypeTag: '力量剑意流',
    buildStage: 'early',
    description: '获得 7 点格挡，凝聚 3 层【剑意】。',
    upgradedDescription: '获得 10 点格挡，凝聚 5 层【剑意】。',
    effects: { block: 7, swordIntent: 3 },
    upgradedEffects: { block: 10, swordIntent: 5 },
    spriteType: 'war_banner',
    price: 58,
  },
  {
    id: 'w_shrug',
    name: '耸肩无视',
    classType: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    archetypeTag: '壁垒盾猛流',
    buildStage: 'early',
    description: '获得 8 点格挡，抽 1 张牌。',
    upgradedDescription: '获得 11 点格挡，抽 2 张牌。',
    effects: { block: 8, draw: 1 },
    upgradedEffects: { block: 11, draw: 2 },
    spriteType: 'iron_fortress',
    price: 60,
  },
  {
    id: 'w_flame_barrier',
    name: '烈焰铁障',
    classType: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    archetypeTag: '壁垒盾猛流',
    buildStage: 'early',
    description: '获得 9 点【格挡】与 3 点【荆棘】反伤。',
    upgradedDescription: '获得 13 点【格挡】与 5 点【荆棘】反伤。',
    effects: { block: 9, thornsGain: 3 },
    upgradedEffects: { block: 13, thornsGain: 5 },
    spriteType: 'iron_fortress',
    price: 62,
  },
  {
    id: 'w_true_grit',
    name: '百战坚毅',
    classType: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    archetypeTag: '灰烬消耗流',
    buildStage: 'early',
    description: '获得 8 点【格挡】，【消耗】手牌中 1 张其他牌并抽 1 张牌。',
    upgradedDescription: '获得 11 点【格挡】，【消耗】手牌中 1 张其他牌并抽 2 张牌。',
    effects: { block: 8, exhaustOneRandomOtherCard: true, draw: 1 },
    upgradedEffects: { block: 11, exhaustOneRandomOtherCard: true, draw: 2 },
    spriteType: 'shield',
    price: 58,
  },
  {
    id: 'w_burning_pact',
    name: '灰烬契约',
    classType: 'warrior',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '灰烬消耗流',
    buildStage: 'mid',
    description: '【消耗】手牌中 1 张其他牌，立即获得 1 点能量并抽 2 张牌！',
    upgradedDescription: '【消耗】手牌中 1 张其他牌，立即获得 2 点能量并抽 3 张牌！',
    effects: { exhaustOneRandomOtherCard: true, energyGain: 1, draw: 2 },
    upgradedEffects: { exhaustOneRandomOtherCard: true, energyGain: 2, draw: 3 },
    spriteType: 'dark_orb',
    price: 76,
  },
  {
    id: 'w_blood_strike',
    name: '沸血狂斩',
    classType: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '沸血狂战流',
    buildStage: 'early',
    description: '失去 2 点生命，造成 11 点伤害，永久获得 1 点【力量】。',
    upgradedDescription: '失去 2 点生命，造成 15 点伤害，永久获得 2 点【力量】。',
    effects: { selfHpLoss: 2, damage: 11, strength: 1 },
    upgradedEffects: { selfHpLoss: 2, damage: 15, strength: 2 },
    spriteType: 'crimson_scythe',
    price: 60,
  },
  {
    id: 'w_body_slam',
    name: '全身撞击',
    classType: 'warrior',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    upgradedCost: 0,
    target: 'single',
    archetypeTag: '壁垒盾猛流',
    buildStage: 'mid',
    description: '造成等同于你当前【格挡值】的伤害。',
    upgradedDescription: '费用变为 0。造成等同于你当前【格挡值】的伤害。',
    effects: { damage: 0, damageEqualsBlock: true },
    upgradedEffects: { damage: 0, damageEqualsBlock: true },
    spriteType: 'shield_slam',
    price: 75,
    comboSynergy: {
      partnerArchetype: '壁垒盾猛流',
      effectDesc: '【流派连携】：牌组含壁垒护甲卡时，撞击伤害额外 +6！',
      bonusDamage: 6,
    },
  },
  {
    id: 'w_sword_storm',
    name: '万剑归宗',
    classType: 'warrior',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    target: 'single',
    archetypeTag: '力量剑意流',
    buildStage: 'mid',
    description: '造成 10 点基础伤害，并消耗所有【剑意】，每层额外造成 4 点伤害！',
    upgradedDescription: '造成 14 点基础伤害，并消耗所有【剑意】，每层额外造成 6 点伤害！',
    effects: { damage: 10, consumeSwordIntentMultiplier: 4 },
    upgradedEffects: { damage: 14, consumeSwordIntentMultiplier: 6 },
    spriteType: 'heavy_blade',
    price: 85,
  },
  {
    id: 'w_bloodletting',
    name: '血祭狂暴',
    classType: 'warrior',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    archetypeTag: '沸血狂战流',
    buildStage: 'mid',
    description: '失去 3 点生命，立即获得 2 点能量、2 点【力量】并抽 1 张牌！',
    upgradedDescription: '失去 2 点生命，立即获得 2 点能量、3 点【力量】并抽 2 张牌！',
    effects: { selfHpLoss: 3, energyGain: 2, strength: 2, draw: 1 },
    upgradedEffects: { selfHpLoss: 2, energyGain: 2, strength: 3, draw: 2 },
    spriteType: 'blood',
    price: 78,
  },
  {
    id: 'w_whirlwind',
    name: '旋风烈斩',
    classType: 'warrior',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    target: 'all',
    archetypeTag: '力量剑意流',
    buildStage: 'mid',
    description: '对所有敌人造成 5 点伤害 3 次（享受 3 倍力量与剑意加成）！',
    upgradedDescription: '对所有敌人造成 7 点伤害 3 次（享受 3 倍力量与剑意加成）！',
    effects: { damage: 5, hits: 3 },
    upgradedEffects: { damage: 7, hits: 3 },
    spriteType: 'whirlwind',
    price: 82,
  },
  {
    id: 'w_inflame',
    name: '燃烧战意',
    classType: 'warrior',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '力量剑意流',
    buildStage: 'mid',
    description: '【能力】永久获得 2 点【力量】与 3 层【剑意】。消耗。',
    upgradedDescription: '【能力】永久获得 4 点【力量】与 5 层【剑意】。消耗。',
    effects: { strength: 2, swordIntent: 3 },
    upgradedEffects: { strength: 4, swordIntent: 5 },
    exhaust: true,
    spriteType: 'war_banner',
    price: 80,
  },
  {
    id: 'w_entrench',
    name: '固若金汤',
    classType: 'warrior',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '壁垒盾猛流',
    buildStage: 'mid',
    description: '先获得 6 点格挡，随后使你当前的【格挡值】直接翻倍！',
    upgradedDescription: '先获得 9 点格挡，随后使你当前的【格挡值】直接翻倍！',
    effects: { block: 6, doubleBlock: true },
    upgradedEffects: { block: 9, doubleBlock: true },
    spriteType: 'iron_fortress',
    price: 80,
  },
  {
    id: 'w_limit_break',
    name: '突破极限',
    classType: 'warrior',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    archetypeTag: '力量剑意流',
    buildStage: 'late',
    description: '先获得 1 点力量，随后使你当前的【力量】与【剑意】双双翻倍！消耗。',
    upgradedDescription: '先获得 2 点力量，随后使你当前的【力量】与【剑意】双双翻倍！（不消耗）',
    effects: { strength: 1, doubleStrength: true },
    upgradedEffects: { strength: 2, doubleStrength: true },
    exhaust: true,
    spriteType: 'demon_crown',
    price: 115,
  },
  {
    id: 'w_barricade',
    name: '钢铁壁垒',
    classType: 'warrior',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    upgradedCost: 1,
    target: 'self',
    archetypeTag: '壁垒盾猛流',
    buildStage: 'late',
    description: '【能力】获得 12 点格挡，且每回合结束保留最多 30 点未消耗的格挡！消耗。',
    upgradedDescription: '【能力】费用变为 1。获得 16 点格挡，每回合结束保留最多 45 点格挡！消耗。',
    effects: { block: 12, retainBlock: 30 },
    upgradedEffects: { block: 16, retainBlock: 45 },
    exhaust: true,
    spriteType: 'iron_fortress',
    price: 120,
  },
  {
    id: 'w_sword_god',
    name: '剑神降临',
    classType: 'warrior',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    archetypeTag: '力量剑意流',
    buildStage: 'late',
    description: '【能力】立即获得 4 层【剑意】，且每回合开始自动获得 3 层【剑意】与 1 点力量！消耗。',
    upgradedDescription: '【能力】立即获得 6 层【剑意】，且每回合开始自动获得 5 层【剑意】与 2 点力量！消耗。',
    effects: { swordIntent: 4, swordMastery: 3, ritualPlayer: 1 },
    upgradedEffects: { swordIntent: 6, swordMastery: 5, ritualPlayer: 2 },
    exhaust: true,
    spriteType: 'war_banner',
    price: 125,
  },
  {
    id: 'w_blood_slash',
    name: '嗜血斩',
    classType: 'warrior',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'single',
    archetypeTag: '沸血狂战流',
    buildStage: 'late',
    description: '造成 14 点伤害，回复 8 点生命值并获得 2 点【力量】。消耗。',
    upgradedDescription: '造成 19 点伤害，回复 12 点生命值并获得 3 点【力量】。消耗。',
    effects: { damage: 14, heal: 8, strength: 2 },
    upgradedEffects: { damage: 19, heal: 12, strength: 3 },
    exhaust: true,
    spriteType: 'blood',
    price: 110,
  },
  {
    id: 'w_bludgeon',
    name: '重锤粉碎',
    classType: 'warrior',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'single',
    archetypeTag: '沸血狂战流',
    buildStage: 'late',
    description: '造成 28 点毁天灭地的巨额伤害！',
    upgradedDescription: '造成 38 点毁天灭地的巨额伤害！',
    effects: { damage: 28 },
    upgradedEffects: { damage: 38 },
    spriteType: 'heavy_blade',
    price: 115,
  },
  {
    id: 'w_flex',
    name: '活动肌肉',
    classType: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    target: 'self',
    archetypeTag: '力量剑意流',
    buildStage: 'early',
    description: '获得 2 点【力量】与 2 层【剑意】，抽 1 张牌。',
    upgradedDescription: '获得 4 点【力量】与 3 层【剑意】，抽 1 张牌。',
    effects: { strength: 2, swordIntent: 2, draw: 1 },
    upgradedEffects: { strength: 4, swordIntent: 3, draw: 1 },
    spriteType: 'war_banner',
    price: 55,
  },
  {
    id: 'w_heavy_blade',
    name: '千钧重刃',
    classType: 'warrior',
    type: 'attack',
    rarity: 'common',
    cost: 2,
    target: 'single',
    archetypeTag: '力量剑意流',
    buildStage: 'early',
    description: '造成 14 点伤害。【力量】与【剑意】在本牌上生效 3 倍！',
    upgradedDescription: '造成 14 点伤害。【力量】与【剑意】在本牌上生效 5 倍！',
    effects: { damage: 14, strengthMultiplier: 3 },
    upgradedEffects: { damage: 14, strengthMultiplier: 5 },
    spriteType: 'heavy',
    price: 68,
    comboSynergy: {
      partnerArchetype: '力量剑意流',
      effectDesc: '【流派连携】：牌组含力量卡牌时，重刃伤害额外 +8！',
      bonusDamage: 8,
    },
  },
  {
    id: 'w_feel_no_pain',
    name: '无惧疼痛',
    classType: 'warrior',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '灰烬消耗流',
    buildStage: 'mid',
    description: '【能力】立即获得 5 点格挡，且每当有卡牌被【消耗】时自动获得 4 点格挡！消耗。',
    upgradedDescription: '【能力】立即获得 8 点格挡，且每当有卡牌被【消耗】时自动获得 6 点格挡！消耗。',
    effects: { feelNoPain: 4, block: 5 },
    upgradedEffects: { feelNoPain: 6, block: 8 },
    exhaust: true,
    spriteType: 'iron_fortress',
    price: 82,
  },
  {
    id: 'w_dark_embrace',
    name: '黑暗之拥',
    classType: 'warrior',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    upgradedCost: 0,
    target: 'self',
    archetypeTag: '灰烬消耗流',
    buildStage: 'mid',
    description: '【能力】立即抽 1 张牌，且每当有卡牌被【消耗】时自动抽 1 张牌！消耗。',
    upgradedDescription: '费用变为 0。【能力】立即抽 1 张牌，且每当有卡牌被【消耗】时自动抽 1 张牌！消耗。',
    effects: { darkEmbrace: 1, draw: 1 },
    upgradedEffects: { darkEmbrace: 1, draw: 1 },
    exhaust: true,
    spriteType: 'dark_orb',
    price: 88,
  },
  {
    id: 'w_second_wind',
    name: '重振精神',
    classType: 'warrior',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '灰烬消耗流',
    buildStage: 'mid',
    description: '【消耗】手牌中所有非攻击牌，每消耗 1 张获得 7 点格挡（保底 +7 格挡）！',
    upgradedDescription: '【消耗】手牌中所有非攻击牌，每消耗 1 张获得 10 点格挡（保底 +10 格挡）！',
    effects: { block: 7, exhaustSkillsForBlock: 7 },
    upgradedEffects: { block: 10, exhaustSkillsForBlock: 10 },
    spriteType: 'shield',
    price: 78,
  },
  {
    id: 'w_fiend_fire',
    name: '恶魔之火',
    classType: 'warrior',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'single',
    archetypeTag: '灰烬消耗流',
    buildStage: 'late',
    description: '【消耗】手牌中所有其他牌，基础造成 10 点伤害，每消耗 1 张额外攻击 1 次（每次 10 点）！消耗。',
    upgradedDescription: '【消耗】手牌中所有其他牌，基础造成 14 点伤害，每消耗 1 张额外攻击 1 次（每次 14 点）！消耗。',
    effects: { damage: 10, exhaustOtherHandForDamage: 10 },
    upgradedEffects: { damage: 14, exhaustOtherHandForDamage: 14 },
    exhaust: true,
    spriteType: 'fireball',
    price: 120,
  },
  {
    id: 'w_rupture',
    name: '撕裂血咒',
    classType: 'warrior',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '沸血狂战流',
    buildStage: 'mid',
    description: '【能力】立即获得 2 点力量，且每当你从卡牌中失去生命时永久获得 2 点【力量】！消耗。',
    upgradedDescription: '【能力】立即获得 3 点力量，且每当你从卡牌中失去生命时永久获得 3 点【力量】！消耗。',
    effects: { rupture: 2, strength: 2 },
    upgradedEffects: { rupture: 3, strength: 3 },
    exhaust: true,
    spriteType: 'blood',
    price: 80,
  },
  {
    id: 'w_hemokinesis',
    name: '御血狂斩',
    classType: 'warrior',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'single',
    archetypeTag: '沸血狂战流',
    buildStage: 'mid',
    description: '失去 2 点生命，造成 16 点高额伤害并抽 1 张牌！',
    upgradedDescription: '失去 2 点生命，造成 22 点高额伤害并抽 1 张牌！',
    effects: { selfHpLoss: 2, damage: 16, draw: 1 },
    upgradedEffects: { selfHpLoss: 2, damage: 22, draw: 1 },
    spriteType: 'crimson_scythe',
    price: 75,
  },
  {
    id: 'w_reaper',
    name: '死神收割',
    classType: 'warrior',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'all',
    archetypeTag: '沸血狂战流',
    buildStage: 'late',
    description: '对所有敌人造成 6 点伤害（受力量与剑意加成），回复等同于未格挡伤害总量的生命值！消耗。',
    upgradedDescription: '对所有敌人造成 9 点伤害（受力量与剑意加成），回复等同于未格挡伤害总量的生命值！消耗。',
    effects: { damage: 6, lifestealDamage: true },
    upgradedEffects: { damage: 9, lifestealDamage: true },
    exhaust: true,
    spriteType: 'crimson_scythe',
    price: 125,
  },

  // ==================== 星界秘法师 (Mage · 四大完整成型流派) ====================
  {
    id: 'm_strike',
    name: '奥术飞弹',
    classType: 'mage',
    type: 'attack',
    rarity: 'starter',
    cost: 1,
    target: 'single',
    archetypeTag: '零费爪击流',
    buildStage: 'early',
    description: '造成 6 点伤害。',
    upgradedDescription: '造成 9 点伤害。',
    effects: { damage: 6 },
    upgradedEffects: { damage: 9 },
    spriteType: 'lightning',
    price: 45,
  },
  {
    id: 'm_defend',
    name: '魔力护盾',
    classType: 'mage',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    target: 'self',
    archetypeTag: '集中多球流',
    buildStage: 'early',
    description: '获得 5 点格挡。',
    upgradedDescription: '获得 8 点格挡。',
    effects: { block: 5 },
    upgradedEffects: { block: 8 },
    spriteType: 'shield',
    price: 45,
  },
  {
    id: 'm_zap',
    name: '雷电呼唤',
    classType: 'mage',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    upgradedCost: 0,
    target: 'self',
    archetypeTag: '暗核雷暴流',
    buildStage: 'early',
    description: '生成 1 枚【雷霆充能球】，并获得 4 点格挡。',
    upgradedDescription: '费用变为 0。生成 1 枚【雷霆充能球】，并获得 6 点格挡。',
    effects: { channelOrb: 'lightning', block: 4 },
    upgradedEffects: { channelOrb: 'lightning', block: 6 },
    spriteType: 'lightning',
    price: 55,
  },
  {
    id: 'm_fire_bolt',
    name: '烈焰火球',
    classType: 'mage',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '烈焰灼烧流',
    buildStage: 'early',
    description: '造成 7 点伤害，对目标施加 3 层【灼烧】并生成 1 枚【烈焰充能球】。',
    upgradedDescription: '造成 10 点伤害，对目标施加 5 层【灼烧】并生成 1 枚【烈焰充能球】。',
    effects: { damage: 7, burn: 3, channelOrb: 'fire' },
    upgradedEffects: { damage: 10, burn: 5, channelOrb: 'fire' },
    spriteType: 'fireball',
    price: 60,
  },
  {
    id: 'm_melter',
    name: '熔核爆破',
    classType: 'mage',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '烈焰灼烧流',
    buildStage: 'early',
    description: '瞬间击碎目标所有【格挡】，造成 9 点伤害，施加 3 层【灼烧】并立即引爆 1 次目标【灼烧】伤害！',
    upgradedDescription: '瞬间击碎目标所有【格挡】，造成 13 点伤害，施加 5 层【灼烧】并立即引爆 1 次目标【灼烧】伤害！',
    effects: { damage: 9, burn: 3, shatterEnemyBlock: true, detonateBurn: true },
    upgradedEffects: { damage: 13, burn: 5, shatterEnemyBlock: true, detonateBurn: true },
    spriteType: 'fireball',
    price: 64,
  },
  {
    id: 'm_cold_snap',
    name: '寒霜新星',
    classType: 'mage',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '集中多球流',
    buildStage: 'early',
    description: '造成 6 点伤害，生成 1 枚【寒霜充能球】。',
    upgradedDescription: '造成 9 点伤害，生成 1 枚【寒霜充能球】并获得 3 点格挡。',
    effects: { damage: 6, channelOrb: 'frost' },
    upgradedEffects: { damage: 9, block: 3, channelOrb: 'frost' },
    spriteType: 'frost',
    price: 60,
  },
  {
    id: 'm_dark_orb',
    name: '暗物质凝结',
    classType: 'mage',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    archetypeTag: '暗核雷暴流',
    buildStage: 'early',
    description: '获得 7 点格挡，生成 1 枚【暗物质球】并立即催化全暗核蓄力 1 次！',
    upgradedDescription: '获得 10 点格挡，生成 1 枚【暗物质球】，立即催化全暗核蓄力并抽 1 张牌！',
    effects: { block: 7, channelOrb: 'dark', triggerDarkPassive: true },
    upgradedEffects: { block: 10, channelOrb: 'dark', triggerDarkPassive: true, draw: 1 },
    spriteType: 'black_hole',
    price: 62,
  },
  {
    id: 'm_beam_cell',
    name: '零度射线',
    classType: 'mage',
    type: 'attack',
    rarity: 'common',
    cost: 0,
    target: 'single',
    archetypeTag: '零费爪击流',
    buildStage: 'early',
    description: '造成 4 点伤害，施加 1 层【易伤】与 1 层【虚弱】。',
    upgradedDescription: '造成 7 点伤害，施加 2 层【易伤】与 2 层【虚弱】。',
    effects: { damage: 4, vulnerable: 1, weak: 1 },
    upgradedEffects: { damage: 7, vulnerable: 2, weak: 2 },
    spriteType: 'glacier_crystal',
    price: 58,
  },
  {
    id: 'm_arcane_barrage',
    name: '奥术弹幕',
    classType: 'mage',
    type: 'attack',
    rarity: 'common',
    cost: 0,
    target: 'single',
    archetypeTag: '零费爪击流',
    buildStage: 'early',
    description: '造成 4 点伤害 2 次，抽 1 张牌。',
    upgradedDescription: '造成 6 点伤害 2 次，抽 1 张牌。',
    effects: { damage: 4, hits: 2, draw: 1 },
    upgradedEffects: { damage: 6, hits: 2, draw: 1 },
    spriteType: 'arcane_eye',
    price: 62,
  },
  {
    id: 'm_glacier',
    name: '极寒冰川',
    classType: 'mage',
    type: 'skill',
    rarity: 'uncommon',
    cost: 2,
    target: 'self',
    archetypeTag: '集中多球流',
    buildStage: 'mid',
    description: '获得 9 点格挡，生成 2 枚【寒霜充能球】，抽 1 张牌。',
    upgradedDescription: '获得 13 点格挡，生成 2 枚【寒霜充能球】，抽 2 张牌。',
    effects: { block: 9, channelOrb: 'frost', channelOrbCount: 2, draw: 1 },
    upgradedEffects: { block: 13, channelOrb: 'frost', channelOrbCount: 2, draw: 2 },
    spriteType: 'glacier_crystal',
    price: 78,
  },
  {
    id: 'm_capacitor',
    name: '星轨扩容矩阵',
    classType: 'mage',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '集中多球流',
    buildStage: 'mid',
    description: '【能力】充能球槽位上限 +2（最高6槽），并立即生成 2 枚【寒霜充能球】！消耗。',
    upgradedDescription: '【能力】充能球槽位上限 +2，获得 1 点【集中】，并立即生成 3 枚【寒霜充能球】！消耗。',
    effects: { orbSlotGain: 2, channelOrb: 'frost', channelOrbCount: 2 },
    upgradedEffects: { orbSlotGain: 2, focus: 1, channelOrb: 'frost', channelOrbCount: 3 },
    exhaust: true,
    spriteType: 'arcane_eye',
    price: 84,
  },
  {
    id: 'm_chain_lightning',
    name: '连锁闪电',
    classType: 'mage',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'all',
    archetypeTag: '暗核雷暴流',
    buildStage: 'early',
    description: '对所有敌人造成 7 点伤害，生成 1 枚【雷霆充能球】。',
    upgradedDescription: '对所有敌人造成 11 点伤害，生成 2 枚【雷霆充能球】。',
    effects: { damage: 7, channelOrb: 'lightning' },
    upgradedEffects: { damage: 11, channelOrb: 'lightning', channelOrbCount: 2 },
    spriteType: 'lightning',
    price: 65,
  },
  {
    id: 'm_dualcast',
    name: '双重激发',
    classType: 'mage',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    upgradedCost: 0,
    target: 'self',
    archetypeTag: '暗核雷暴流',
    buildStage: 'mid',
    description: '立即激发你最前方充能球的效果 2 次！',
    upgradedDescription: '费用变为 0。立即激发你最前方充能球的效果 2 次并抽 1 张牌！',
    effects: { evokeFirstOrbTwice: true },
    upgradedEffects: { evokeFirstOrbTwice: true, draw: 1 },
    spriteType: 'arcane_eye',
    price: 78,
  },
  {
    id: 'm_arcane_burst',
    name: '元素超载引爆',
    classType: 'mage',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'all',
    archetypeTag: '烈焰灼烧流',
    buildStage: 'mid',
    description: '立即激发并引爆你所有的【充能球】，对全体敌人施加 3 层【灼烧】并抽 1 张牌！',
    upgradedDescription: '立即激发并引爆你所有的【充能球】，对全体敌人施加 5 层【灼烧】并抽 2 张牌！',
    effects: { evokeAllOrbs: true, burn: 3, draw: 1 },
    upgradedEffects: { evokeAllOrbs: true, burn: 5, draw: 2 },
    spriteType: 'meteor_star',
    price: 85,
  },
  {
    id: 'm_defragment',
    name: '元素共鸣',
    classType: 'mage',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '集中多球流',
    buildStage: 'mid',
    description: '【能力】获得 2 点【集中】（所有充能球被动与激发数值+2），生成 1 枚随机球。消耗。',
    upgradedDescription: '【能力】获得 3 点【集中】（所有充能球被动与激发数值+3），生成 2 枚随机球。消耗。',
    effects: { focus: 2, channelOrb: 'random' },
    upgradedEffects: { focus: 3, channelOrb: 'random', channelOrbCount: 2 },
    exhaust: true,
    spriteType: 'arcane_eye',
    price: 88,
  },
  {
    id: 'm_turbo',
    name: '奥术涌动',
    classType: 'mage',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    archetypeTag: '零费爪击流',
    buildStage: 'mid',
    description: '立即获得 2 点能量，抽 1 张牌。消耗。',
    upgradedDescription: '立即获得 2 点能量，抽 2 张牌。消耗。',
    effects: { energyGain: 2, draw: 1 },
    upgradedEffects: { energyGain: 2, draw: 2 },
    exhaust: true,
    spriteType: 'scroll',
    price: 80,
  },
  {
    id: 'm_scrape',
    name: '零式跃迁',
    classType: 'mage',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'single',
    archetypeTag: '零费爪击流',
    buildStage: 'mid',
    description: '造成 8 点伤害，抽 3 张牌，手牌中每有 1 张 0 费牌额外获得 3 点格挡并令全场爪击伤害 +1！',
    upgradedDescription: '造成 11 点伤害，抽 4 张牌，手牌中每有 1 张 0 费牌额外获得 4 点格挡并令全场爪击伤害 +2！',
    effects: { damage: 8, draw: 3, zeroCostDrawSynergy: true, clawScaling: 1 },
    upgradedEffects: { damage: 11, draw: 4, zeroCostDrawSynergy: true, clawScaling: 2 },
    spriteType: 'lightning',
    price: 78,
  },
  {
    id: 'm_black_hole',
    name: '黑洞坍缩',
    classType: 'mage',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'all',
    archetypeTag: '暗核雷暴流',
    buildStage: 'late',
    description: '对所有敌人造成 16 点伤害，生成 2 枚【暗物质球】并立即催化所有暗物质球被动 2 次！',
    upgradedDescription: '对所有敌人造成 22 点伤害，生成 2 枚【暗物质球】，催化所有暗核被动 2 次并抽 1 张牌！',
    effects: { damage: 16, channelOrb: 'dark', channelOrbCount: 2, triggerDarkPassive: true },
    upgradedEffects: { damage: 22, channelOrb: 'dark', channelOrbCount: 2, triggerDarkPassive: true, draw: 1 },
    spriteType: 'black_hole',
    price: 118,
  },
  {
    id: 'm_arcane_core',
    name: '星界魔导核心',
    classType: 'mage',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    target: 'self',
    archetypeTag: '集中多球流',
    buildStage: 'late',
    description: '【能力】充能槽上限 +1，获得 3 点【集中】与 2 点【敏捷】，并立即生成 2 枚随机充能球！消耗。',
    upgradedDescription: '【能力】充能槽上限 +2，获得 5 点【集中】与 3 点【敏捷】，并立即生成 3 枚随机充能球！消耗。',
    effects: { orbSlotGain: 1, focus: 3, dexterity: 2, channelOrb: 'random', channelOrbCount: 2 },
    upgradedEffects: { orbSlotGain: 2, focus: 5, dexterity: 3, channelOrb: 'random', channelOrbCount: 3 },
    exhaust: true,
    spriteType: 'arcane_eye',
    price: 125,
  },
  {
    id: 'm_meteor',
    name: '星界陨石雨',
    classType: 'mage',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'all',
    archetypeTag: '烈焰灼烧流',
    buildStage: 'late',
    description: '对所有敌人造成 19 点伤害，施加 4 层【灼烧】与 2 层【易伤】，立即引爆全场【灼烧】并生成 2 枚【烈焰球】！',
    upgradedDescription: '对所有敌人造成 26 点伤害，施加 6 层【灼烧】与 3 层【易伤】，立即引爆全场【灼烧】并生成 2 枚【烈焰球】！',
    effects: { damage: 19, burn: 4, vulnerable: 2, detonateBurn: true, channelOrb: 'fire', channelOrbCount: 2 },
    upgradedEffects: { damage: 26, burn: 6, vulnerable: 3, detonateBurn: true, channelOrb: 'fire', channelOrbCount: 2 },
    spriteType: 'meteor_star',
    price: 115,
  },
  {
    id: 'm_claw',
    name: '雷光爪击',
    classType: 'mage',
    type: 'attack',
    rarity: 'common',
    cost: 0,
    target: 'single',
    archetypeTag: '零费爪击流',
    buildStage: 'early',
    description: '造成 5 点伤害。本场战斗所有【雷光爪击】伤害永久 +2！',
    upgradedDescription: '造成 7 点伤害。本场战斗所有【雷光爪击】伤害永久 +3！',
    effects: { damage: 5, clawScaling: 2 },
    upgradedEffects: { damage: 7, clawScaling: 3 },
    spriteType: 'lightning',
    price: 58,
  },
  {
    id: 'm_all_for_one',
    name: '万物一心',
    classType: 'mage',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'single',
    archetypeTag: '零费爪击流',
    buildStage: 'late',
    description: '造成 12 点伤害，将弃牌堆中所有 0 费卡牌全部召回手牌！',
    upgradedDescription: '造成 17 点伤害，将弃牌堆中所有 0 费卡牌全部召回手牌！',
    effects: { damage: 12, recallZeroCostFromDiscard: true },
    upgradedEffects: { damage: 17, recallZeroCostFromDiscard: true },
    spriteType: 'meteor_star',
    price: 120,
  },
  {
    id: 'm_barrage',
    name: '弹幕齐射',
    classType: 'mage',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '集中多球流',
    buildStage: 'early',
    description: '基础造成 5 点伤害，每拥有 1 枚充能球额外攻击 1 次（每次 5 点）！',
    upgradedDescription: '基础造成 7 点伤害，每拥有 1 枚充能球额外攻击 1 次（每次 7 点）！',
    effects: { damage: 5, damagePerOrb: 1 },
    upgradedEffects: { damage: 7, damagePerOrb: 1 },
    spriteType: 'arcane_eye',
    price: 64,
  },
  {
    id: 'm_biased_cog',
    name: '偏差认知',
    classType: 'mage',
    type: 'power',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    archetypeTag: '集中多球流',
    buildStage: 'late',
    description: '【能力】立即获得 +4 点【集中】，并生成 1 枚【雷霆球】！消耗。',
    upgradedDescription: '【能力】立即获得 +6 点【集中】，并生成 1 枚【雷霆球】！消耗。',
    effects: { focus: 4, channelOrb: 'lightning' },
    upgradedEffects: { focus: 6, channelOrb: 'lightning' },
    exhaust: true,
    spriteType: 'arcane_eye',
    price: 118,
  },
  {
    id: 'm_loop',
    name: '循环回路',
    classType: 'mage',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '暗核雷暴流',
    buildStage: 'mid',
    description: '【能力】立即催化暗物质球蓄力，且每回合开始时你的首枚充能球额外触发 1 次被动！消耗。',
    upgradedDescription: '【能力】立即催化暗物质球蓄力，且每回合开始时你的首枚充能球额外触发 2 次被动！消耗。',
    effects: { loopOrbPassive: 1, triggerDarkPassive: true },
    upgradedEffects: { loopOrbPassive: 2, triggerDarkPassive: true },
    exhaust: true,
    spriteType: 'dark_orb',
    price: 85,
  },
  {
    id: 'm_storm',
    name: '雷暴引擎',
    classType: 'mage',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '暗核雷暴流',
    buildStage: 'mid',
    description: '【能力】立即生成 1 枚【雷霆球】，且每当你打出能力牌时自动生成 1 枚【雷霆球】！消耗。',
    upgradedDescription: '【能力】立即生成 1 枚【雷霆球】，且每当你打出能力牌时自动生成 2 枚【雷霆球】！消耗。',
    effects: { stormPower: 1, channelOrb: 'lightning' },
    upgradedEffects: { stormPower: 2, channelOrb: 'lightning' },
    exhaust: true,
    spriteType: 'lightning',
    price: 86,
  },
  {
    id: 'm_double_energy',
    name: '双倍能量',
    classType: 'mage',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    upgradedCost: 0,
    target: 'self',
    archetypeTag: '暗核雷暴流',
    buildStage: 'mid',
    description: '将你当前的剩余能量直接翻倍，并抽 1 张牌！消耗。',
    upgradedDescription: '费用变为 0。将你当前的剩余能量直接翻倍，并抽 2 张牌！消耗。',
    effects: { doubleEnergy: true, draw: 1 },
    upgradedEffects: { doubleEnergy: true, draw: 2 },
    exhaust: true,
    spriteType: 'scroll',
    price: 82,
  },
  {
    id: 'm_fire_breath',
    name: '烈焰烙印',
    classType: 'mage',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'all',
    archetypeTag: '烈焰灼烧流',
    buildStage: 'mid',
    description: '对所有敌人施加 6 层【灼烧】，并生成 1 枚【烈焰充能球】！',
    upgradedDescription: '对所有敌人施加 9 层【灼烧】，并生成 2 枚【烈焰充能球】！',
    effects: { burn: 6, channelOrb: 'fire', channelOrbCount: 1 },
    upgradedEffects: { burn: 9, channelOrb: 'fire', channelOrbCount: 2 },
    spriteType: 'fireball',
    price: 78,
  },

  // ==================== 暗影刺客 (Assassin · 四大完整成型流派) ====================
  {
    id: 'a_strike',
    name: '迅捷刺击',
    classType: 'assassin',
    type: 'attack',
    rarity: 'starter',
    cost: 1,
    target: 'single',
    archetypeTag: '千刃飞刀流',
    buildStage: 'early',
    description: '造成 6 点伤害。',
    upgradedDescription: '造成 9 点伤害。',
    effects: { damage: 6 },
    upgradedEffects: { damage: 9 },
    spriteType: 'dagger',
    price: 45,
  },
  {
    id: 'a_defend',
    name: '残影闪避',
    classType: 'assassin',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    target: 'self',
    archetypeTag: '残影千刃流',
    buildStage: 'early',
    description: '获得 5 点格挡。',
    upgradedDescription: '获得 8 点格挡。',
    effects: { block: 5 },
    upgradedEffects: { block: 8 },
    spriteType: 'shadow_cloak',
    price: 45,
  },
  {
    id: 'a_blade_dance',
    name: '刀扇之舞',
    classType: 'assassin',
    type: 'skill',
    rarity: 'starter',
    cost: 1,
    target: 'self',
    archetypeTag: '千刃飞刀流',
    buildStage: 'early',
    description: '向手牌中添加 2 张 0 费【飞刀】。',
    upgradedDescription: '向手牌中添加 3 张 0 费【飞刀】。',
    effects: { addShivs: 2 },
    upgradedEffects: { addShivs: 3 },
    spriteType: 'fan_of_knives',
    price: 60,
  },
  {
    id: 'a_backstab',
    name: '暗影背刺',
    classType: 'assassin',
    type: 'attack',
    rarity: 'common',
    cost: 0,
    target: 'single',
    archetypeTag: '千刃飞刀流',
    buildStage: 'early',
    description: '造成 8 点伤害，额外获得 2 点【连击】。消耗。',
    upgradedDescription: '造成 12 点伤害，额外获得 3 点【连击】。消耗。',
    effects: { damage: 8, comboGain: 2 },
    upgradedEffects: { damage: 12, comboGain: 3 },
    exhaust: true,
    spriteType: 'dagger',
    price: 58,
  },
  {
    id: 'a_backflip',
    name: '灵巧后空翻',
    classType: 'assassin',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    archetypeTag: '残影千刃流',
    buildStage: 'early',
    description: '获得 6 点格挡，抽 2 张牌。',
    upgradedDescription: '获得 9 点格挡，抽 2 张牌。',
    effects: { block: 6, draw: 2 },
    upgradedEffects: { block: 9, draw: 2 },
    spriteType: 'shadow_cloak',
    price: 58,
  },
  {
    id: 'a_escape_plan',
    name: '脱身残影',
    classType: 'assassin',
    type: 'skill',
    rarity: 'common',
    cost: 0,
    target: 'self',
    archetypeTag: '残影千刃流',
    buildStage: 'early',
    description: '获得 4 点格挡，抽 1 张牌，并获得 1 层【残影化形】（每出1牌+1格挡）！消耗。',
    upgradedDescription: '获得 7 点格挡，抽 2 张牌，并获得 1 层【残影化形】（每出1牌+1格挡）！消耗。',
    effects: { block: 4, draw: 1, afterImage: 1 },
    upgradedEffects: { block: 7, draw: 2, afterImage: 1 },
    exhaust: true,
    spriteType: 'shadow_cloak',
    price: 62,
  },
  {
    id: 'a_dagger_throw',
    name: '掠影投刃',
    classType: 'assassin',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '弃牌赌徒流',
    buildStage: 'early',
    description: '造成 9 点伤害，抽 2 张牌并战术弃置 1 张手牌，获得 4 点格挡与 2 点【连击】！',
    upgradedDescription: '造成 12 点伤害，抽 2 张牌并战术弃置 1 张手牌，获得 7 点格挡与 3 点【连击】！',
    effects: { damage: 9, draw: 2, discardOneCard: true, block: 4, comboGain: 2 },
    upgradedEffects: { damage: 12, draw: 2, discardOneCard: true, block: 7, comboGain: 3 },
    spriteType: 'dagger',
    price: 60,
  },
  {
    id: 'a_eviscerate',
    name: '剔骨连斩',
    classType: 'assassin',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'single',
    archetypeTag: '弃牌赌徒流',
    buildStage: 'mid',
    description: '造成 6 点伤害 3 次！本回合每弃置过 1 张牌，每次命中额外 +2 伤害！',
    upgradedDescription: '造成 8 点伤害 3 次！本回合每弃置过 1 张牌，每次命中额外 +3 伤害！',
    effects: { damage: 6, hits: 3, damageBonusPerDiscarded: 2 },
    upgradedEffects: { damage: 8, hits: 3, damageBonusPerDiscarded: 3 },
    spriteType: 'crimson_scythe',
    price: 82,
  },
  {
    id: 'a_deadly_poison',
    name: '致命涂毒',
    classType: 'assassin',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '催化毒爆流',
    buildStage: 'early',
    description: '对目标施加 5 层【剧毒】，获得 4 点格挡。',
    upgradedDescription: '对目标施加 8 层【剧毒】，获得 6 点格挡。',
    effects: { poison: 5, block: 4 },
    upgradedEffects: { poison: 8, block: 6 },
    spriteType: 'poison',
    price: 55,
  },
  {
    id: 'a_poison_stab',
    name: '淬毒穿刺',
    classType: 'assassin',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '催化毒爆流',
    buildStage: 'early',
    description: '造成 6 点伤害，施加 4 层【剧毒】。',
    upgradedDescription: '造成 9 点伤害，施加 6 层【剧毒】。',
    effects: { damage: 6, poison: 4 },
    upgradedEffects: { damage: 9, poison: 6 },
    spriteType: 'venom_skull',
    price: 60,
  },
  {
    id: 'a_cloak_dagger',
    name: '斗篷与匕首',
    classType: 'assassin',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    archetypeTag: '千刃飞刀流',
    buildStage: 'early',
    description: '获得 6 点格挡，向手牌中添加 1 张 0 费【飞刀】。',
    upgradedDescription: '获得 8 点格挡，向手牌中添加 2 张 0 费【飞刀】。',
    effects: { block: 6, addShivs: 1 },
    upgradedEffects: { block: 8, addShivs: 2 },
    spriteType: 'shadow_cloak',
    price: 60,
  },
  {
    id: 'a_crippling_cloud',
    name: '瘟疫毒雾',
    classType: 'assassin',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'all',
    archetypeTag: '催化毒爆流',
    buildStage: 'mid',
    description: '对所有敌人施加 5 层【剧毒】与 2 层【虚弱】。消耗。',
    upgradedDescription: '对所有敌人施加 8 层【剧毒】与 3 层【虚弱】。消耗。',
    effects: { poison: 5, weak: 2 },
    upgradedEffects: { poison: 8, weak: 3 },
    exhaust: true,
    spriteType: 'venom_skull',
    price: 78,
  },
  {
    id: 'a_venom_blast',
    name: '致命毒爆',
    classType: 'assassin',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'single',
    archetypeTag: '催化毒爆流',
    buildStage: 'mid',
    description: '造成 6 点基础伤害，并立即引爆触发 1 次目标当前【剧毒】层数的等额伤害！',
    upgradedDescription: '造成 10 点基础伤害，先施加 3 层剧毒，再立即引爆触发目标当前【剧毒】伤害！',
    effects: { damage: 6, detonatePoison: true },
    upgradedEffects: { damage: 10, poison: 3, detonatePoison: true },
    spriteType: 'venom_skull',
    price: 85,
  },
  {
    id: 'a_corpse_explosion',
    name: '瘟疫尸爆',
    classType: 'assassin',
    type: 'skill',
    rarity: 'rare',
    cost: 2,
    target: 'single',
    archetypeTag: '催化毒爆流',
    buildStage: 'late',
    description: '对目标施加 7 层【剧毒】，并立即引爆该目标全身【剧毒】层数，对【所有敌人】造成等额剧毒爆炸伤害！消耗。',
    upgradedDescription: '对目标施加 10 层【剧毒】，并立即引爆该目标全身【剧毒】层数，对【所有敌人】造成等额剧毒爆炸伤害！消耗。',
    effects: { poison: 7, detonatePoisonAll: true },
    upgradedEffects: { poison: 10, detonatePoisonAll: true },
    exhaust: true,
    spriteType: 'venom_skull',
    price: 120,
  },
  {
    id: 'a_accuracy',
    name: '精准投掷',
    classType: 'assassin',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '千刃飞刀流',
    buildStage: 'mid',
    description: '【能力】本场战斗所有【飞刀】造成的伤害永久 +4！并立即获得 1 张飞刀。消耗。',
    upgradedDescription: '【能力】本场战斗所有【飞刀】造成的伤害永久 +6！并立即获得 2 张飞刀。消耗。',
    effects: { shivBonus: 4, addShivs: 1 },
    upgradedEffects: { shivBonus: 6, addShivs: 2 },
    exhaust: true,
    spriteType: 'shuriken',
    price: 82,
  },
  {
    id: 'a_infinite_blades',
    name: '无限刃舞',
    classType: 'assassin',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '千刃飞刀流',
    buildStage: 'mid',
    description: '【能力】每个回合开始时自动向手牌添加 1 张【飞刀】，且立即获得 2 张飞刀。消耗。',
    upgradedDescription: '【能力】每个回合开始时自动向手牌添加 2 张【飞刀】，且立即获得 3 张飞刀。消耗。',
    effects: { infiniteBlades: 1, addShivs: 2 },
    upgradedEffects: { infiniteBlades: 2, addShivs: 3 },
    exhaust: true,
    spriteType: 'fan_of_knives',
    price: 85,
  },
  {
    id: 'a_storm_of_steel',
    name: '千刃风暴',
    classType: 'assassin',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    archetypeTag: '千刃飞刀流',
    buildStage: 'late',
    description: '本场战斗所有【飞刀】伤害永久 +2，立即向手牌添加 3 张 0 费【飞刀】并获得 2 点【连击】！消耗。',
    upgradedDescription: '本场战斗所有【飞刀】伤害永久 +3，立即向手牌添加 4 张 0 费【飞刀】并获得 3 点【连击】！消耗。',
    effects: { shivBonus: 2, addShivs: 3, comboGain: 2 },
    upgradedEffects: { shivBonus: 3, addShivs: 4, comboGain: 3 },
    exhaust: true,
    spriteType: 'fan_of_knives',
    price: 115,
  },
  {
    id: 'a_finisher',
    name: '绝命终结技',
    classType: 'assassin',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'single',
    archetypeTag: '千刃飞刀流',
    buildStage: 'mid',
    description: '造成 7 点基础伤害，并消耗所有【连击点】，每点连击额外造成 5 点伤害！',
    upgradedDescription: '造成 10 点基础伤害，并消耗所有【连击点】，每点连击额外造成 7 点伤害！',
    effects: { damage: 7, consumeComboDamage: 5 },
    upgradedEffects: { damage: 10, consumeComboDamage: 7 },
    spriteType: 'dagger',
    price: 80,
  },
  {
    id: 'a_catalyst',
    name: '剧毒催化剂',
    classType: 'assassin',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    upgradedCost: 0,
    target: 'single',
    archetypeTag: '催化毒爆流',
    buildStage: 'mid',
    description: '先施加 3 层【剧毒】，随后使目标的【剧毒】层数翻倍！消耗。',
    upgradedDescription: '费用变为 0。先施加 5 层【剧毒】，随后使目标的【剧毒】层数翻倍！消耗。',
    effects: { poison: 3, doublePoison: true },
    upgradedEffects: { poison: 5, doublePoison: true },
    exhaust: true,
    spriteType: 'poison',
    price: 85,
  },
  {
    id: 'a_after_image',
    name: '残影化形',
    classType: 'assassin',
    type: 'power',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    archetypeTag: '残影千刃流',
    buildStage: 'late',
    description: '【能力】立即获得 5 点格挡，且每当你打出一张牌自动获得 2 点【格挡】！消耗。',
    upgradedDescription: '【能力】立即获得 8 点格挡，且每当你打出一张牌自动获得 3 点【格挡】！消耗。',
    effects: { afterImage: 2, block: 5 },
    upgradedEffects: { afterImage: 3, block: 8 },
    exhaust: true,
    spriteType: 'shadow_cloak',
    price: 118,
  },
  {
    id: 'a_adrenaline',
    name: '肾上腺素',
    classType: 'assassin',
    type: 'skill',
    rarity: 'rare',
    cost: 0,
    target: 'self',
    archetypeTag: '弃牌赌徒流',
    buildStage: 'late',
    description: '获得 1 点能量，抽 2 张牌，获得 2 点【连击】。消耗。',
    upgradedDescription: '获得 2 点能量，抽 3 张牌，获得 3 点【连击】。消耗。',
    effects: { energyGain: 1, draw: 2, comboGain: 2 },
    upgradedEffects: { energyGain: 2, draw: 3, comboGain: 3 },
    exhaust: true,
    spriteType: 'blood',
    price: 110,
  },
  {
    id: 'a_noxious_fumes',
    name: '毒雾弥漫',
    classType: 'assassin',
    type: 'power',
    rarity: 'uncommon',
    cost: 1,
    target: 'all',
    archetypeTag: '催化毒爆流',
    buildStage: 'mid',
    description: '【能力】立即对所有敌人施加 2 层剧毒，且每回合自动对所有敌人施加 2 层【剧毒】！消耗。',
    upgradedDescription: '【能力】立即对所有敌人施加 3 层剧毒，且每回合自动对所有敌人施加 3 层【剧毒】！消耗。',
    effects: { poison: 2, noxiousFumes: 2 },
    upgradedEffects: { poison: 3, noxiousFumes: 3 },
    exhaust: true,
    spriteType: 'poison',
    price: 84,
  },
  {
    id: 'a_envenom',
    name: '涂毒之刃',
    classType: 'assassin',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    upgradedCost: 1,
    target: 'self',
    archetypeTag: '催化毒爆流',
    buildStage: 'late',
    description: '【能力】每当你通过攻击造成伤害时，额外对目标施加 2 层【剧毒】！消耗。',
    upgradedDescription: '费用变为 1。【能力】每次攻击命中额外对目标施加 3 层【剧毒】！消耗。',
    effects: { envenom: 2 },
    upgradedEffects: { envenom: 3 },
    exhaust: true,
    spriteType: 'venom_skull',
    price: 112,
  },
  {
    id: 'a_thousand_cuts',
    name: '千刀万剐',
    classType: 'assassin',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    upgradedCost: 1,
    target: 'self',
    archetypeTag: '残影千刃流',
    buildStage: 'late',
    description: '【能力】每当你打出 1 张卡牌，自动对所有敌人造成 2 点穿刺伤害！消耗。',
    upgradedDescription: '费用变为 1。【能力】每当你打出 1 张卡牌，自动对所有敌人造成 3 点穿刺伤害！消耗。',
    effects: { thousandCuts: 2 },
    upgradedEffects: { thousandCuts: 3 },
    exhaust: true,
    spriteType: 'fan_of_knives',
    price: 118,
  },
  {
    id: 'a_calculated_gamble',
    name: '计算下注',
    classType: 'assassin',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    archetypeTag: '弃牌赌徒流',
    buildStage: 'mid',
    description: '弃掉手牌中所有其他牌，抽取等量的卡牌，每弃 1 张获得 1 点【连击】与 2 点格挡！消耗。',
    upgradedDescription: '弃掉手牌中所有其他牌，抽取等量 +1 张卡牌，每弃 1 张获得 1 点【连击】与 3 点格挡（不消耗）！',
    effects: { calculatedGamble: true, comboGain: 1 },
    upgradedEffects: { calculatedGamble: true, draw: 1, comboGain: 2 },
    exhaust: true,
    spriteType: 'scroll',
    price: 78,
  },

  // ==================== 中立通用传奇卡牌 (Neutral · 4张万金油桥梁卡) ====================
  {
    id: 'n_apothecary',
    name: '圣光治愈',
    classType: 'neutral',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'self',
    archetypeTag: '通用战术',
    buildStage: 'mid',
    description: '回复 8 点生命值，获得 5 点格挡。消耗。',
    upgradedDescription: '回复 12 点生命值，获得 8 点格挡。消耗。',
    effects: { heal: 8, block: 5 },
    upgradedEffects: { heal: 12, block: 8 },
    exhaust: true,
    spriteType: 'holy_grail',
    price: 75,
  },
  {
    id: 'n_battle_trance',
    name: '战术专注',
    classType: 'neutral',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    archetypeTag: '通用战术',
    buildStage: 'mid',
    description: '抽 2 张牌，获得 4 点格挡。',
    upgradedDescription: '抽 3 张牌，获得 6 点格挡。',
    effects: { draw: 2, block: 4 },
    upgradedEffects: { draw: 3, block: 6 },
    spriteType: 'scroll',
    price: 75,
  },
  {
    id: 'n_shockwave',
    name: '震荡冲击波',
    classType: 'neutral',
    type: 'skill',
    rarity: 'uncommon',
    cost: 1,
    target: 'all',
    archetypeTag: '通用战术',
    buildStage: 'mid',
    description: '对所有敌人施加 2 层【易伤】与 2 层【虚弱】，抽 1 张牌。消耗。',
    upgradedDescription: '对所有敌人施加 4 层【易伤】与 4 层【虚弱】，抽 1 张牌。消耗。',
    effects: { vulnerable: 2, weak: 2, draw: 1 },
    upgradedEffects: { vulnerable: 4, weak: 4, draw: 1 },
    exhaust: true,
    spriteType: 'whirlwind',
    price: 85,
  },
  {
    id: 'n_ancient_armor',
    name: '远古龙鳞甲',
    classType: 'neutral',
    type: 'power',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    archetypeTag: '通用战术',
    buildStage: 'late',
    description: '【能力】获得 4 点【金属化】（每回合末+4格挡）与 3 点【荆棘】反伤。消耗。',
    upgradedDescription: '【能力】获得 6 点【金属化】（每回合末+6格挡）与 5 点【荆棘】反伤。消耗。',
    effects: { metallicizeGain: 4, thornsGain: 3 },
    upgradedEffects: { metallicizeGain: 6, thornsGain: 5 },
    exhaust: true,
    spriteType: 'iron_fortress',
    price: 105,
  },
  {
    id: 'w_battle_cry',
    name: '狂怒战吼',
    classType: 'warrior',
    type: 'skill',
    rarity: 'common',
    cost: 1,
    target: 'self',
    archetypeTag: '沸血狂战流',
    buildStage: 'early',
    description: '失去 2 点生命，抽 2 张牌，获得 2 点【力量】。',
    upgradedDescription: '失去 2 点生命，抽 3 张牌，获得 3 点【力量】。',
    effects: { selfHpLoss: 2, draw: 2, strength: 2 },
    upgradedEffects: { selfHpLoss: 2, draw: 3, strength: 3 },
    spriteType: 'war_banner',
    price: 55,
  },
  {
    id: 'w_shield_counter',
    name: '巨盾反击',
    classType: 'warrior',
    type: 'attack',
    rarity: 'uncommon',
    cost: 1,
    target: 'single',
    archetypeTag: '壁垒盾猛流',
    buildStage: 'mid',
    description: '造成伤害等于当前【格挡值】的 50%，并施加 2 层【易伤】。',
    upgradedDescription: '造成伤害等于当前【格挡值】的 80%，并施加 3 层【易伤】。',
    effects: { damage: 0, damageEqualsBlock: true, vulnerable: 2 },
    upgradedEffects: { damage: 0, damageEqualsBlock: true, vulnerable: 3 },
    spriteType: 'shield_slam',
    price: 70,
  },
  {
    id: 'w_earthquake',
    name: '裂地撼地斩',
    classType: 'warrior',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'all',
    archetypeTag: '力量剑意流',
    buildStage: 'late',
    description: '对所有敌人造成 16 点伤害。若目标带有【易伤】则伤害翻倍！',
    upgradedDescription: '对所有敌人造成 22 点伤害。若目标带有【易伤】则伤害翻倍！',
    effects: { damage: 16 },
    upgradedEffects: { damage: 22 },
    spriteType: 'heavy',
    price: 110,
  },
  {
    id: 'w_berserk_fury',
    name: '战神狂热',
    classType: 'warrior',
    type: 'power',
    rarity: 'rare',
    cost: 2,
    upgradedCost: 1,
    target: 'self',
    archetypeTag: '沸血狂战流',
    buildStage: 'late',
    description: '【能力】每当你从卡牌中失去生命时，获得 1 点能量与 1 层【力量】。',
    upgradedDescription: '费用变为 1。【能力】每当你从卡牌中失去生命时，获得 1 点能量与 1 层【力量】。',
    effects: { rupture: 2, strength: 2 },
    upgradedEffects: { rupture: 3, strength: 3 },
    exhaust: true,
    spriteType: 'blood',
    price: 120,
  },
  {
    id: 'm_astral_storm',
    name: '星界风暴',
    classType: 'mage',
    type: 'attack',
    rarity: 'uncommon',
    cost: 2,
    target: 'all',
    archetypeTag: '集中多球流',
    buildStage: 'mid',
    description: '对所有敌人攻击 3 次（每次 5 点伤害），每有一个充能球伤害额外 +3。',
    upgradedDescription: '对所有敌人攻击 3 次（每次 7 点伤害），每有一个充能球伤害额外 +4。',
    effects: { damage: 5, hits: 3, damagePerOrb: 3 },
    upgradedEffects: { damage: 7, hits: 3, damagePerOrb: 4 },
    spriteType: 'lightning',
    price: 80,
  },
  {
    id: 'm_zero_overload',
    name: '零式超载',
    classType: 'mage',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    archetypeTag: '零费爪击流',
    buildStage: 'mid',
    description: '抽 2 张牌。本回合你打出的下一张 0 费卡牌伤害或效果翻倍！',
    upgradedDescription: '抽 3 张牌。本回合你打出的下一张 0 费卡牌伤害或效果翻倍！',
    effects: { draw: 2 },
    upgradedEffects: { draw: 3 },
    spriteType: 'scroll',
    price: 85,
  },
  {
    id: 'm_dark_singularity',
    name: '黑暗奇点',
    classType: 'mage',
    type: 'attack',
    rarity: 'rare',
    cost: 2,
    target: 'all',
    archetypeTag: '暗核蓄爆流',
    buildStage: 'late',
    description: '激发所有充能球，并对全体敌人造成等同于暗核数量 × 15 点的暗影爆炸！',
    upgradedDescription: '激发所有充能球，并对全体敌人造成等同于暗核数量 × 22 点的暗影爆炸！',
    effects: { damage: 15, evokeAllOrbs: true },
    upgradedEffects: { damage: 22, evokeAllOrbs: true },
    spriteType: 'dark_orb',
    price: 130,
  },
  {
    id: 'm_lightning_array',
    name: '雷霆法阵',
    classType: 'mage',
    type: 'power',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    archetypeTag: '雷暴能力流',
    buildStage: 'late',
    description: '【能力】每当你生成任何充能球时，对随机敌人释放一道 6 点伤害的闪电！消耗。',
    upgradedDescription: '【能力】每当你生成任何充能球时，对随机敌人释放一道 9 点伤害的闪电！消耗。',
    effects: { stormPower: 6 },
    upgradedEffects: { stormPower: 9 },
    exhaust: true,
    spriteType: 'lightning',
    price: 115,
  },
  {
    id: 'a_shadow_strike',
    name: '影袭连击',
    classType: 'assassin',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '小刀风暴流',
    buildStage: 'early',
    description: '造成 9 点伤害，获得 1 个连击点。若当前连击点 >= 3 则造成双倍伤害！',
    upgradedDescription: '造成 13 点伤害，获得 1 个连击点。若当前连击点 >= 3 则造成双倍伤害！',
    effects: { damage: 9, comboGain: 1 },
    upgradedEffects: { damage: 13, comboGain: 1 },
    spriteType: 'dagger',
    price: 55,
  },
  {
    id: 'a_venom_pierce',
    name: '毒刃穿刺',
    classType: 'assassin',
    type: 'attack',
    rarity: 'common',
    cost: 1,
    target: 'single',
    archetypeTag: '催化毒爆流',
    buildStage: 'early',
    description: '造成 8 点伤害，施加 4 层【中毒】。',
    upgradedDescription: '造成 11 点伤害，施加 6 层【中毒】。',
    effects: { damage: 8, poison: 4 },
    upgradedEffects: { damage: 11, poison: 6 },
    spriteType: 'shuriken',
    price: 55,
  },
  {
    id: 'a_fatal_gamble',
    name: '致命赌局',
    classType: 'assassin',
    type: 'skill',
    rarity: 'uncommon',
    cost: 0,
    target: 'self',
    archetypeTag: '弃牌赌徒流',
    buildStage: 'mid',
    description: '弃掉所有手牌，抽取等量手牌 + 1 张。',
    upgradedDescription: '弃掉所有手牌，抽取等量手牌 + 2 张，且费用为 0。',
    effects: { calculatedGamble: true, draw: 1 },
    upgradedEffects: { calculatedGamble: true, draw: 2 },
    spriteType: 'scroll',
    price: 75,
  },
  {
    id: 'a_shadow_clone',
    name: '影分身幻象',
    classType: 'assassin',
    type: 'skill',
    rarity: 'rare',
    cost: 1,
    target: 'self',
    archetypeTag: '残影千刃流',
    buildStage: 'late',
    description: '获得 10 点格挡。向手牌添加 2 张 0 费【飞刀】。消耗。',
    upgradedDescription: '获得 14 点格挡。向手牌添加 3 张 0 费【飞刀】。消耗。',
    effects: { block: 10, addShivs: 2 },
    upgradedEffects: { block: 14, addShivs: 3 },
    exhaust: true,
    spriteType: 'shuriken',
    price: 110,
  },
];

export interface ArchetypeComboGuide {
  id: string;
  classType: ClassType;
  archetypeTag: string;
  name: string;
  title?: string;
  shortTag: string;
  tierBadge: string;
  iconType: string;
  summary: string;
  comboSteps: string[];
  earlyCardIds: string[]; // ① 起手过渡卡 (Act 1 抓位)
  engineCardIds: string[]; // ② 核心引擎卡 (Act 1~2 联动核心)
  finisherCardIds: string[]; // ③ 毕业终结卡 (Act 2~3 质变决胜)
  coreCardIds: string[];
  supportCardIds: string[];
  recommendedRelicIds: string[];
  keyRelicIds?: string[];
  difficulty?: string;
  coreLoop?: string;
  earlyStage?: string;
  midStage?: string;
  lateStage?: string;
  resonanceTier1: {
    requiredCount: number;
    title: string;
    effectDesc: string;
  };
  resonanceTier2: {
    requiredCount: number;
    title: string;
    effectDesc: string;
  };
}

export const RECOMMENDED_ARCHETYPE_COMBOS: ArchetypeComboGuide[] = [
  // ==================== 铁卫剑圣 (Warrior · 四大成型路线) ====================
  {
    id: 'warrior_strength',
    classType: 'warrior',
    archetypeTag: '力量剑意流',
    name: '💪 狂暴力量剑意战',
    shortTag: '力量剑意',
    tierBadge: 'T0 极限倍增',
    iconType: 'heavy_blade',
    summary:
      '【成型路线】①前期抓《活动肌肉》《疾风双斩》《千钧重刃》快速叠剑意与多段伤害 ➔ ②中期补《燃烧战意》《万剑归宗》《旋风烈斩》建立群攻与单点爆发引擎 ➔ ③后期拿《突破极限+》将力量与剑意双双翻倍，配合5倍收益《千钧重刃+》一刀秒杀首领！',
    comboSteps: [
      '①【前期过渡】抓《活动肌肉》(0费+力量+剑意) +《疾风双斩》+《千钧重刃》稳过第一幕',
      '②【核心引擎】开启《燃烧战意》+《剑神降临》，每回合自动暴涨力量与剑意层数',
      '③【毕业成型】打出《突破极限+》令力量与剑意直接×2，接《千钧重刃+》(5倍加成)或《万剑归宗》一击必杀！',
    ],
    earlyCardIds: ['w_flex', 'w_twin_strike', 'w_heavy_blade', 'w_sword_aura', 'w_cleave'],
    engineCardIds: ['w_inflame', 'w_sword_storm', 'w_whirlwind'],
    finisherCardIds: ['w_limit_break', 'w_sword_god'],
    coreCardIds: ['w_limit_break', 'w_heavy_blade', 'w_inflame', 'w_flex', 'w_sword_god'],
    supportCardIds: ['w_twin_strike', 'w_sword_storm', 'w_whirlwind', 'w_sword_aura', 'n_shockwave'],
    recommendedRelicIds: ['vajra', 'shuriken_relic', 'philosopher_stone'],
    resonanceTier1: {
      requiredCount: 3,
      title: '⚔️ 剑心初成 (3阶共鸣)',
      effectDesc: '战斗开始时自动获得 +1【力量】与 +2【剑意】',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 万剑通神 (5阶毕业觉醒)',
      effectDesc: '战斗开始获得 +2【力量】与 +4【剑意】，且每打出 2 张攻击牌额外凝聚 +2【剑意】！',
    },
  },
  {
    id: 'warrior_barricade',
    classType: 'warrior',
    archetypeTag: '壁垒盾猛流',
    name: '🛡️ 不破壁垒盾猛战',
    shortTag: '壁垒盾猛',
    tierBadge: 'T0 攻防合一',
    iconType: 'iron_fortress',
    summary:
      '【成型路线】①前期抓《耸肩无视》《烈焰铁障》《铁斩波》构筑高甲反伤防线 ➔ ②中期拿核心《固若金汤》(护盾翻倍)与《全身撞击》(护盾等额伤害)实现盾猛斩杀 ➔ ③后期开启《钢铁壁垒》跨回合保留护甲，滚雪球叠至百盾碾压一切！',
    comboSteps: [
      '①【前期过渡】抓《耸肩无视》+《烈焰铁障》，高额护甲配合荆棘反伤无伤过渡',
      '②【核心引擎】打出《固若金汤》先得甲再将当前格挡直接 ×2，接 0 费《全身撞击+》反手秒怪',
      '③【毕业成型】架设《钢铁壁垒》令格挡跨回合永不消失，护盾越叠越高化身移动堡垒！',
    ],
    earlyCardIds: ['w_shrug', 'w_flame_barrier', 'w_iron_wave'],
    engineCardIds: ['w_entrench', 'w_body_slam'],
    finisherCardIds: ['w_barricade', 'n_ancient_armor'],
    coreCardIds: ['w_barricade', 'w_entrench', 'w_body_slam', 'w_shrug'],
    supportCardIds: ['w_flame_barrier', 'w_iron_wave', 'n_ancient_armor', 'w_feel_no_pain'],
    recommendedRelicIds: ['anchor', 'orichalcum', 'oddly_smooth_stone'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🛡️ 铁壁初成 (3阶共鸣)',
      effectDesc: '战斗开始时自动获得 +8【格挡】与 +2【金属化】',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 不朽神盾 (5阶毕业觉醒)',
      effectDesc: '战斗开始获得 +14【格挡】、+2【敏捷】与 +15 点跨回合【护甲保留】上限！',
    },
  },
  {
    id: 'warrior_exhaust',
    classType: 'warrior',
    archetypeTag: '灰烬消耗流',
    name: '🔥 恶魔火灰烬消耗战',
    shortTag: '灰烬消耗',
    tierBadge: 'T1 引擎永动',
    iconType: 'dark_orb',
    summary:
      '【成型路线】①前期抓《百战坚毅》主动消耗废牌精简牌库并抽牌得甲 ➔ ②中期架设《无惧疼痛》(消耗得甲)+《黑暗之拥》(消耗抽牌)+《重振精神》双永动引擎 ➔ ③后期打出《恶魔之火》献祭全手牌，一回合触发十余段烈焰轰击与百点护甲！',
    comboSteps: [
      '①【前期过渡】抓《百战坚毅》烧掉初始普通牌，边叠甲边精简牌库提高核心上手率',
      '②【核心引擎】开启《无惧疼痛》+《黑暗之拥》，配合《灰烬契约》《重振精神》消耗即抽牌叠盾',
      '③【毕业成型】满手牌时打出《恶魔之火》，每消耗 1 张手牌额外轰出 1 段高额毁灭烈焰！',
    ],
    earlyCardIds: ['w_true_grit'],
    engineCardIds: ['w_feel_no_pain', 'w_dark_embrace', 'w_second_wind', 'w_burning_pact'],
    finisherCardIds: ['w_fiend_fire'],
    coreCardIds: ['w_feel_no_pain', 'w_dark_embrace', 'w_second_wind', 'w_fiend_fire', 'w_burning_pact'],
    supportCardIds: ['w_true_grit', 'w_shrug', 'n_battle_trance', 'n_shockwave'],
    recommendedRelicIds: ['cursed_key', 'ice_cream', 'lantern'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🔥 灰烬初成 (3阶共鸣)',
      effectDesc: '战斗开始时自动获得 +2【无惧疼痛】（每消耗1张牌自动+2格挡）',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 烬灭魔神 (5阶毕业觉醒)',
      effectDesc: '战斗开始获得 +4【无惧疼痛】，且每当有卡牌被【消耗】时自动对随机敌人造成 5 点灰烬轰击伤害！',
    },
  },
  {
    id: 'warrior_blood',
    classType: 'warrior',
    archetypeTag: '沸血狂战流',
    name: '🩸 沸血死神狂战',
    shortTag: '沸血狂战',
    tierBadge: 'T1 狂战吸血',
    iconType: 'crimson_scythe',
    summary:
      '【成型路线】①前期抓《沸血狂斩》《痛击》以小额自残换取高伤与永久力量 ➔ ②中期开启《撕裂血咒》，每次打出 0 费《血祭狂暴》《御血狂斩》自残都自动暴涨力量与能量 ➔ ③后期以一张《死神收割》群体高伤吸血瞬间回满全额生命！',
    comboSteps: [
      '①【前期过渡】抓《沸血狂斩》配合初始遗物《燃烧之血》（战后回8血）无损自残叠力量',
      '②【核心引擎】开启《撕裂血咒》，打出 0 费《血祭狂暴》自残换取 +2能量与双倍力量成长',
      '③【毕业成型】高力量下打出《死神收割》，对全体敌人造成巨额伤害并等额吸满生命值！',
    ],
    earlyCardIds: ['w_blood_strike', 'w_bash'],
    engineCardIds: ['w_rupture', 'w_bloodletting', 'w_hemokinesis'],
    finisherCardIds: ['w_reaper', 'w_blood_slash', 'w_bludgeon'],
    coreCardIds: ['w_rupture', 'w_bloodletting', 'w_hemokinesis', 'w_reaper', 'w_blood_strike'],
    supportCardIds: ['w_blood_slash', 'w_bash', 'w_bludgeon', 'w_limit_break'],
    recommendedRelicIds: ['burning_blood', 'meat_on_bone', 'demon_heart'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🩸 沸血初成 (3阶共鸣)',
      effectDesc: '战斗开始自带 +1【撕裂血咒】（自残+1力量），战后额外回复 4 点生命',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 鲜血君王 (5阶毕业觉醒)',
      effectDesc: '战斗开始自带 +2【撕裂血咒】，且每次从卡牌失去生命时自动获得 +5【格挡】与 +1【剑意】！',
    },
  },

  // ==================== 星界秘法师 (Mage · 四大成型路线) ====================
  {
    id: 'mage_focus',
    classType: 'mage',
    archetypeTag: '集中多球流',
    name: '🔮 极寒集中多球法',
    shortTag: '集中多球',
    tierBadge: 'T0 冰雷矩阵',
    iconType: 'arcane_eye',
    summary:
      '【成型路线】①前期抓《寒霜新星》《弹幕齐射》快速铺球打多段伤害 ➔ ②中期拿《星轨扩容矩阵》(槽位上限+2)与《极寒冰川》《元素共鸣》撑起5~6球护盾矩阵 ➔ ③后期开启《偏差认知》《星界魔导核心》将集中堆至巅峰，每回合自动叠数十点格挡并用6段《弹幕齐射》轰杀全场！',
    comboSteps: [
      '①【前期过渡】抓《寒霜新星》+《弹幕齐射》，保持3枚充能球在场即可1费打出4段伤害',
      '②【核心引擎】开启《星轨扩容矩阵》突破槽位上限至5~6槽，用《极寒冰川》瞬间铺满寒霜球',
      '③【毕业成型】叠加《偏差认知+》+《星界魔导核心》高额集中，攻防全自动且《弹幕齐射》高達6~7段！',
    ],
    earlyCardIds: ['m_cold_snap', 'm_barrage'],
    engineCardIds: ['m_glacier', 'm_defragment', 'm_capacitor'],
    finisherCardIds: ['m_biased_cog', 'm_arcane_core'],
    coreCardIds: ['m_biased_cog', 'm_capacitor', 'm_glacier', 'm_defragment', 'm_barrage'],
    supportCardIds: ['m_arcane_core', 'm_cold_snap', 'm_zap', 'm_loop'],
    recommendedRelicIds: ['cracked_core', 'data_disk', 'demon_heart'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🔮 矩阵初成 (3阶共鸣)',
      effectDesc: '战斗开始时自动获得 +1【集中】并生成 1 枚【寒霜充能球】',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 星轨主宰 (5阶毕业觉醒)',
      effectDesc: '战斗开始充能球槽位上限 +1，自动获得 +2【集中】并生成 1 枚【寒霜球】与 1 枚【雷霆球】！',
    },
  },
  {
    id: 'mage_dark_storm',
    classType: 'mage',
    archetypeTag: '暗核雷暴流',
    name: '⚡ 暗核催化雷暴法',
    shortTag: '暗核雷暴',
    tierBadge: 'T0 首领核爆',
    iconType: 'black_hole',
    summary:
      '【成型路线】①前期抓《暗物质凝结》《连锁闪电》《雷电呼唤》铺设暗物质球与雷霆球 ➔ ②中期架设《循环回路》(每回合多次催化暗核蓄力)+《雷暴引擎》+《双重激发》 ➔ ③后期打出《黑洞坍缩》群体催化暗核，再用0费《双重激发+》双倍引爆暗物质球瞬秒首领！',
    comboSteps: [
      '①【前期过渡】打出《暗物质凝结》生成暗物质球并立即催化蓄力，攻守兼备',
      '②【核心引擎】开启《循环回路》与《雷暴引擎》，每回合开始自动多次翻滚暗物质球伤害',
      '③【毕业成型】用《黑洞坍缩》连催暗核至40+伤害，再打出0费《双重激发+》触发2次暗核轰击秒杀Boss！',
    ],
    earlyCardIds: ['m_dark_orb', 'm_chain_lightning', 'm_zap'],
    engineCardIds: ['m_loop', 'm_dualcast', 'm_storm', 'm_double_energy'],
    finisherCardIds: ['m_black_hole'],
    coreCardIds: ['m_loop', 'm_black_hole', 'm_dark_orb', 'm_dualcast', 'm_storm'],
    supportCardIds: ['m_double_energy', 'm_chain_lightning', 'm_zap', 'm_biased_cog'],
    recommendedRelicIds: ['cracked_core', 'data_disk', 'cursed_key'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🌑 暗核初成 (3阶共鸣)',
      effectDesc: '战斗开始时自动生成 1 枚【暗物质充能球】',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 奇点坍缩 (5阶毕业觉醒)',
      effectDesc: '战斗开始自动生成 1 枚高能【暗物质球】（初始激发伤害+8）并自带 +1【循环回路】！',
    },
  },
  {
    id: 'mage_claw',
    classType: 'mage',
    archetypeTag: '零费爪击流',
    name: '🐾 零费万象爪击法',
    shortTag: '零费爪击',
    tierBadge: 'T1 无限连弹',
    iconType: 'lightning',
    summary:
      '【成型路线】①前期抓0费《雷光爪击》《零度射线》《奥术弹幕》高频出牌叠爪击基础伤害 ➔ ②中期补《零式跃迁》(抽3~4张牌并按0费卡数量得甲增伤)与《奥术涌动》高速滤穿牌库 ➔ ③后期打出《万物一心》将弃牌堆所有0费牌瞬间全部召回手牌再抓一轮！',
    comboSteps: [
      '①【前期过渡】连续打出0费《雷光爪击》《零度射线》《奥术弹幕》，每爪令全场爪击永久+2/+3伤害',
      '②【核心引擎】打出《零式跃迁》大抽牌并触发0费护盾共鸣，快速将0费牌倾泻至弃牌堆',
      '③【毕业成型】打出《万物一心》把弃牌堆内所有0费牌全部捞回手牌，单回合狂抓十余爪！',
    ],
    earlyCardIds: ['m_claw', 'm_beam_cell', 'm_arcane_barrage'],
    engineCardIds: ['m_scrape', 'm_turbo'],
    finisherCardIds: ['m_all_for_one'],
    coreCardIds: ['m_claw', 'm_all_for_one', 'm_scrape', 'm_beam_cell', 'm_arcane_barrage'],
    supportCardIds: ['m_turbo', 'm_zap', 'n_battle_trance'],
    recommendedRelicIds: ['shuriken_relic', 'kunai_relic', 'lantern'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🐾 零式初成 (3阶共鸣)',
      effectDesc: '战斗开始时所有《雷光爪击》基础伤害永久 +3，首回合额外抽 1 张牌',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 万象归零 (5阶毕业觉醒)',
      effectDesc: '爪击初始伤害 +5，且每当你打出 0 费卡牌时自动获得 +2【格挡】（每第3张0费牌额外抽1张牌）！',
    },
  },
  {
    id: 'mage_burn',
    classType: 'mage',
    archetypeTag: '烈焰灼烧流',
    name: '🔥 烈焰熔核星陨法',
    shortTag: '烈焰灼烧',
    tierBadge: 'T0 破盾熔毁',
    iconType: 'meteor_star',
    summary:
      '【成型路线】①前期抓《烈焰火球》《熔核爆破》瞬间击碎敌方护盾并引爆灼烧层数 ➔ ②中期拿《烈焰烙印》《元素超载引爆》群体叠高灼烧并引爆全充能球 ➔ ③后期打出《星界陨石雨》群体高伤+易伤+全场灼烧连环引爆，瞬间融化一切强敌！',
    comboSteps: [
      '①【前期过渡】用《烈焰火球》叠灼烧，接《熔核爆破》无视敌方护盾并立即引爆1次灼烧伤害',
      '②【核心引擎】打出《烈焰烙印》+《元素超载引爆》，全体铺满灼烧同时引爆所有烈焰球',
      '③【毕业成型】释放《星界陨石雨》，全体造成巨额陨石伤害、施加易伤并立即引爆全场【灼烧】！',
    ],
    earlyCardIds: ['m_fire_bolt', 'm_melter'],
    engineCardIds: ['m_fire_breath', 'm_arcane_burst'],
    finisherCardIds: ['m_meteor'],
    coreCardIds: ['m_meteor', 'm_fire_breath', 'm_melter', 'm_fire_bolt', 'm_arcane_burst'],
    supportCardIds: ['m_biased_cog', 'm_defragment', 'm_double_energy', 'n_shockwave'],
    recommendedRelicIds: ['data_disk', 'cursed_key', 'bag_of_marbles'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🔥 熔核初成 (3阶共鸣)',
      effectDesc: '战斗开始时对所有敌人施加 4 层【灼烧】并生成 1 枚【烈焰充能球】',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 星陨炎帝 (5阶毕业觉醒)',
      effectDesc: '战斗开始全体施加 7 层【灼烧】+1 枚【烈焰球】，且你每次施加【灼烧】时层数额外 +2！',
    },
  },

  // ==================== 暗影刺客 (Assassin · 四大成型路线) ====================
  {
    id: 'assassin_poison',
    classType: 'assassin',
    archetypeTag: '催化毒爆流',
    name: '☠️ 瘟疫催化毒刺客',
    shortTag: '催化毒爆',
    tierBadge: 'T0 指数毒爆',
    iconType: 'venom_skull',
    summary:
      '【成型路线】①前期抓《致命涂毒》《淬毒穿刺》配合初始遗物《毒蛇指环》稳健叠毒 ➔ ②中期拿《毒雾弥漫》+《剧毒催化剂》(毒层直接翻倍)+《致命毒爆》(立即引爆毒伤) ➔ ③后期入手《瘟疫尸爆》与《涂毒之刃》，单目标引爆剧毒瞬间炸穿全体敌人！',
    comboSteps: [
      '①【前期过渡】利用《致命涂毒》《淬毒穿刺》边防边叠毒，无视敌方高额护盾',
      '②【核心引擎】开启《毒雾弥漫》全体叠毒，打出0费《剧毒催化剂+》令目标剧毒直接 ×2',
      '③【毕业成型】打出《致命毒爆》单点蒸发首领，或用《瘟疫尸爆》引爆剧毒炸穿全场所有敌人！',
    ],
    earlyCardIds: ['a_deadly_poison', 'a_poison_stab'],
    engineCardIds: ['a_catalyst', 'a_noxious_fumes', 'a_venom_blast', 'a_crippling_cloud'],
    finisherCardIds: ['a_corpse_explosion', 'a_envenom'],
    coreCardIds: ['a_catalyst', 'a_corpse_explosion', 'a_venom_blast', 'a_noxious_fumes', 'a_deadly_poison'],
    supportCardIds: ['a_envenom', 'a_crippling_cloud', 'a_poison_stab', 'a_backflip'],
    recommendedRelicIds: ['ring_of_snake', 'oddly_smooth_stone', 'orichalcum'],
    resonanceTier1: {
      requiredCount: 3,
      title: '☠️ 瘟疫初成 (3阶共鸣)',
      effectDesc: '战斗开始时额外对所有敌人施加 +4 层【剧毒】',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 厄运毒皇 (5阶毕业觉醒)',
      effectDesc: '战斗开始全体施加 +6 层【剧毒】，且你每次通过卡牌施加【剧毒】时层数额外 +2！',
    },
  },
  {
    id: 'assassin_shiv',
    classType: 'assassin',
    archetypeTag: '千刃飞刀流',
    name: '🗡️ 千刃飞刀风暴刺客',
    shortTag: '千刃飞刀',
    tierBadge: 'T0 暴雨连击',
    iconType: 'fan_of_knives',
    summary:
      '【成型路线】①前期抓《刀扇之舞》《斗篷与匕首》《暗影背刺》高频投掷0费飞刀攒连击 ➔ ②中期开启《精准投掷》(飞刀伤害+4/+6)与《无限刃舞》，接《绝命终结技》爆发 ➔ ③后期打出《千刃风暴》永久强化飞刀并瞬间塞满手牌，一回合十刀秒杀！',
    comboSteps: [
      '①【前期过渡】用《刀扇之舞》《斗篷与匕首》生成0费飞刀，快速叠加【连击点】',
      '②【核心引擎】开启《精准投掷+》与《无限刃舞+》，令每把0费飞刀变成10+伤害的致命利刃',
      '③【毕业成型】打出《千刃风暴》连射飞刀刷至10+连击，最后以《绝命终结技+》完成处决！',
    ],
    earlyCardIds: ['a_blade_dance', 'a_cloak_dagger', 'a_backstab'],
    engineCardIds: ['a_accuracy', 'a_infinite_blades', 'a_finisher'],
    finisherCardIds: ['a_storm_of_steel'],
    coreCardIds: ['a_accuracy', 'a_blade_dance', 'a_storm_of_steel', 'a_finisher', 'a_infinite_blades'],
    supportCardIds: ['a_cloak_dagger', 'a_backstab', 'a_after_image', 'a_thousand_cuts'],
    recommendedRelicIds: ['shuriken_relic', 'kunai_relic', 'vajra'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🗡️ 刃舞初成 (3阶共鸣)',
      effectDesc: '所有【飞刀】基础伤害永久 +2，战斗开始手牌额外获得 1 张 0 费【飞刀】',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 千刃剑圣 (5阶毕业觉醒)',
      effectDesc: '所有【飞刀】伤害永久 +4，且每打出 1 张【飞刀】自动获得 +1【格挡】与额外 +1【连击】！',
    },
  },
  {
    id: 'assassin_discard',
    classType: 'assassin',
    archetypeTag: '弃牌赌徒流',
    name: '🎲 诡道弃牌赌徒刺客',
    shortTag: '弃牌赌徒',
    tierBadge: 'T1 极速换牌',
    iconType: 'scroll',
    summary:
      '【成型路线】①前期抓《掠影投刃》攻击同时抽2弃1获取护甲与高连击 ➔ ②中期拿0费神卡《计算下注》(全手洗牌叠甲叠连击)与《剔骨连斩》(按本回合弃牌数大幅增伤3段斩) ➔ ③后期配合0费《肾上腺素+》单回合把整副牌库过穿，打出3段百伤《剔骨连斩》！',
    comboSteps: [
      '①【前期过渡】打出《掠影投刃》抽2弃1，触发战术弃牌护盾与连击收益',
      '②【核心引擎】打出0费《计算下注+》弃置全手牌并重抽等量+1张新牌，瞬间叠满护甲与弃牌计数',
      '③【毕业成型】用《肾上腺素+》提速后打出《剔骨连斩+》（享受高额弃牌增伤×3段）与《绝命终结技》！',
    ],
    earlyCardIds: ['a_dagger_throw'],
    engineCardIds: ['a_calculated_gamble', 'a_eviscerate'],
    finisherCardIds: ['a_adrenaline'],
    coreCardIds: ['a_calculated_gamble', 'a_eviscerate', 'a_adrenaline', 'a_dagger_throw'],
    supportCardIds: ['a_finisher', 'a_backflip', 'a_escape_plan', 'n_battle_trance'],
    recommendedRelicIds: ['ring_of_snake', 'cursed_key', 'lantern'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🎲 赌徒初成 (3阶共鸣)',
      effectDesc: '每当你通过卡牌效果弃置手牌时，每弃 1 张自动获得 +3【格挡】与 +1【连击】',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 命运千王 (5阶毕业觉醒)',
      effectDesc: '每次弃牌每张获得 +4【格挡】与 +1【连击】，并对随机敌人造成 4 点暗影飞刃伤害！',
    },
  },
  {
    id: 'assassin_phantom',
    classType: 'assassin',
    archetypeTag: '残影千刃流',
    name: '🌑 残影万刃领域刺客',
    shortTag: '残影千刃',
    tierBadge: 'T1 出牌即伤',
    iconType: 'shadow_cloak',
    summary:
      '【成型路线】①前期抓0费《脱身残影》(过牌+自带1层残影化形)与《灵巧后空翻》构筑高速过牌防线 ➔ ②中期补《战术专注》与0费飞刀/背刺组件提升单回合出牌频率 ➔ ③后期同时开启《残影化形+》与《千刀万剐+》，每打出1张牌自动叠甲并对全体敌人造成穿刺真伤！',
    comboSteps: [
      '①【前期过渡】打出0费《脱身残影》白嫖护甲、抽牌并提前激活1层【残影化形】',
      '②【核心引擎】搭配《灵巧后空翻》《战术专注》实现低费高频连续出牌',
      '③【毕业成型】开启《残影化形+》与《千刀万剐+》，每出1张牌自动获得高额格挡并清扫全场敌人！',
    ],
    earlyCardIds: ['a_escape_plan', 'a_backflip'],
    engineCardIds: ['n_battle_trance', 'a_cloak_dagger'],
    finisherCardIds: ['a_after_image', 'a_thousand_cuts'],
    coreCardIds: ['a_after_image', 'a_thousand_cuts', 'a_escape_plan', 'a_backflip'],
    supportCardIds: ['n_battle_trance', 'a_blade_dance', 'a_adrenaline', 'a_calculated_gamble'],
    recommendedRelicIds: ['kunai_relic', 'shuriken_relic', 'oddly_smooth_stone'],
    resonanceTier1: {
      requiredCount: 3,
      title: '🌑 残影初成 (3阶共鸣)',
      effectDesc: '战斗开始时自动获得 +1【残影化形】（每打1张牌自动+1格挡）',
    },
    resonanceTier2: {
      requiredCount: 5,
      title: '👑 万刃幻神 (5阶毕业觉醒)',
      effectDesc: '战斗开始自动获得 +2【残影化形】与 +2【千刀万剐】（每打1张牌自动+2格挡并对全体敌人造成2点伤害）！',
    },
  },
];

// ============================================================================
// Build Maturity Evaluator & Smart Guided Card Draft Engine
// ============================================================================
export interface ArchetypeMaturityStatus {
  guide: ArchetypeComboGuide;
  combo: ArchetypeComboGuide;
  totalMatchingCards: number;
  matchedCount: number;
  nonStarterMatchingCards: number;
  earlyOwnedCount: number;
  engineOwnedCount: number;
  finisherOwnedCount: number;
  coreOwnedCount: number;
  tier1Active: boolean;
  tier2Active: boolean;
  resonanceTier: number;
  maturityPercent: number;
  score: number;
  stageLabel: string;
  nextRecommendedStage: 'early' | 'mid' | 'late';
  missingKeyCardIds: string[];
  missingCoreNames: string[];
  resonanceBonusText: string;
}

export function evaluateDeckBuildMaturity(
  deck: Card[],
  playerClass: ClassType,
  preferredComboId?: string | null
): {
  allClassBuilds: ArchetypeMaturityStatus[];
  allClassRoutes: ArchetypeMaturityStatus[];
  primaryBuild: ArchetypeMaturityStatus;
  primary: ArchetypeMaturityStatus;
  activeResonances: ArchetypeMaturityStatus[];
} {
  const classGuides = RECOMMENDED_ARCHETYPE_COMBOS.filter(
    (g) => g.classType === playerClass
  );

  const statuses: ArchetypeMaturityStatus[] = classGuides.map((guide) => {
    // Count non-starter cards + up to 2 starter cards that belong to this archetype
    const matchingDeckCards = deck.filter((c) => {
      if (c.rarity === 'starter') {
        return (
          c.archetypeTag === guide.archetypeTag &&
          c.id !== 'w_strike' &&
          c.id !== 'w_defend' &&
          c.id !== 'm_strike' &&
          c.id !== 'm_defend' &&
          c.id !== 'a_strike' &&
          c.id !== 'a_defend'
        );
      }
      return (
        c.archetypeTag === guide.archetypeTag ||
        guide.coreCardIds.includes(c.id) ||
        guide.earlyCardIds.includes(c.id) ||
        guide.engineCardIds.includes(c.id) ||
        guide.finisherCardIds.includes(c.id)
      );
    });

    const earlyOwnedCount = matchingDeckCards.filter(
      (c) => c.buildStage === 'early' || guide.earlyCardIds.includes(c.id)
    ).length;
    const engineOwnedCount = matchingDeckCards.filter(
      (c) => c.buildStage === 'mid' || guide.engineCardIds.includes(c.id)
    ).length;
    const finisherOwnedCount = matchingDeckCards.filter(
      (c) => c.buildStage === 'late' || guide.finisherCardIds.includes(c.id)
    ).length;
    const coreOwnedCount = matchingDeckCards.filter((c) => guide.coreCardIds.includes(c.id)).length;

    const totalMatchingCards = matchingDeckCards.length;
    const tier1Active = totalMatchingCards >= guide.resonanceTier1.requiredCount;
    const tier2Active = totalMatchingCards >= guide.resonanceTier2.requiredCount;
    const resonanceTier = tier2Active ? 2 : tier1Active ? 1 : 0;

    const maturityPercent = Math.min(
      100,
      Math.round((totalMatchingCards / guide.resonanceTier2.requiredCount) * 100)
    );

    const stageLabel = tier2Active
      ? '👑 5阶毕业成型'
      : tier1Active
      ? '⚙️ 3阶初成共鸣'
      : totalMatchingCards >= 1
      ? '🌱 构筑起步期'
      : '🧭 待定方向';

    const nextRecommendedStage: 'early' | 'mid' | 'late' =
      earlyOwnedCount < 2
        ? 'early'
        : engineOwnedCount < 2
        ? 'mid'
        : 'late';

    const ownedIds = new Set(deck.map((c) => c.id));
    const missingKeyCardIds = [
      ...guide.engineCardIds,
      ...guide.finisherCardIds,
      ...guide.earlyCardIds,
    ].filter((id) => !ownedIds.has(id));

    const missingCoreNames = missingKeyCardIds
      .slice(0, 3)
      .map((id) => ALL_CARDS.find((c) => c.id === id)?.name || id);

    const resonanceBonusText = tier2Active
      ? guide.resonanceTier2.effectDesc
      : tier1Active
      ? guide.resonanceTier1.effectDesc
      : guide.resonanceTier1.title;

    return {
      guide,
      combo: guide,
      totalMatchingCards,
      matchedCount: totalMatchingCards,
      nonStarterMatchingCards: matchingDeckCards.filter((c) => c.rarity !== 'starter').length,
      earlyOwnedCount,
      engineOwnedCount,
      finisherOwnedCount,
      coreOwnedCount,
      tier1Active,
      tier2Active,
      resonanceTier,
      maturityPercent,
      score: maturityPercent,
      stageLabel,
      nextRecommendedStage,
      missingKeyCardIds,
      missingCoreNames,
      resonanceBonusText,
    };
  });

  statuses.sort((a, b) => {
    if (preferredComboId) {
      if (a.guide.id === preferredComboId) return -1;
      if (b.guide.id === preferredComboId) return 1;
    }
    if (b.totalMatchingCards !== a.totalMatchingCards) {
      return b.totalMatchingCards - a.totalMatchingCards;
    }
    return b.finisherOwnedCount * 3 + b.engineOwnedCount * 2 - (a.finisherOwnedCount * 3 + a.engineOwnedCount * 2);
  });

  const primaryBuild = statuses[0];
  const activeResonances = statuses.filter((s) => s.tier1Active);

  return {
    allClassBuilds: statuses,
    allClassRoutes: statuses,
    primaryBuild,
    primary: primaryBuild,
    activeResonances,
  };
}

export function generateSmartCardRewards(
  deck: Card[],
  playerClass: ClassType,
  floor: number,
  nodeType: 'combat' | 'elite' | 'boss' | 'shop',
  preferredComboId?: string | null,
  count = 3
): Card[] {
  const { primaryBuild, allClassBuilds } = evaluateDeckBuildMaturity(
    deck,
    playerClass,
    preferredComboId
  );
  const secondaryBuild = allClassBuilds[1] || primaryBuild;

  const validPool = ALL_CARDS.filter(
    (c) =>
      (c.classType === playerClass || c.classType === 'neutral') &&
      c.rarity !== 'starter' &&
      (nodeType === 'boss' ? c.rarity === 'rare' : true)
  );

  const ownedIdCounts: Record<string, number> = {};
  deck.forEach((c) => {
    ownedIdCounts[c.id] = (ownedIdCounts[c.id] || 0) + 1;
  });

  // Weight each candidate card according to floor progression & build maturity needs
  const pickedIds = new Set<string>();
  const result: Card[] = [];

  for (let slot = 0; slot < count; slot++) {
    const candidates = validPool.filter((c) => !pickedIds.has(c.id));
    if (candidates.length === 0) break;

    const weighted = candidates.map((c) => {
      let weight = 10;

      // Avoid flooding duplicates if player already has 2+ copies (except Claw!)
      const copies = ownedIdCounts[c.id] || 0;
      if (copies >= 2 && c.id !== 'm_claw') {
        weight *= 0.25;
      }

      // Slot 0: Heavily favor Primary Build's needed stage
      if (slot === 0) {
        const matchesPrimary =
          c.archetypeTag === primaryBuild.guide.archetypeTag ||
          primaryBuild.guide.coreCardIds.includes(c.id);
        if (matchesPrimary) {
          weight += 45;
          if (primaryBuild.missingKeyCardIds.includes(c.id)) {
            weight += 35;
          }
          if (c.buildStage === primaryBuild.nextRecommendedStage) {
            weight += 25;
          }
        }
      } else if (slot === 1) {
        // Slot 1: Favor Primary or Secondary Build Engine/Finisher
        const matchesPrimaryOrSec =
          c.archetypeTag === primaryBuild.guide.archetypeTag ||
          c.archetypeTag === secondaryBuild.guide.archetypeTag;
        if (matchesPrimaryOrSec) {
          weight += 28;
        }
        if (floor >= 6 && (c.buildStage === 'mid' || c.buildStage === 'late')) {
          weight += 20;
        }
      }

      // Rarity progression by floor & nodeType
      if (nodeType === 'elite') {
        if (c.rarity === 'rare') weight *= 2.2;
        if (c.rarity === 'uncommon') weight *= 1.6;
      } else if (floor <= 4) {
        if (c.rarity === 'common') weight *= 1.5;
        if (c.rarity === 'uncommon') weight *= 1.2;
        if (c.rarity === 'rare') weight *= 0.5;
      } else if (floor <= 15) {
        if (c.rarity === 'uncommon') weight *= 1.5;
        if (c.rarity === 'rare') weight *= 1.1;
      } else {
        if (c.rarity === 'rare') weight *= 1.8;
        if (c.rarity === 'uncommon') weight *= 1.5;
      }

      return { card: c, weight: Math.max(1, weight) };
    });

    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = weighted[0].card;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) {
        chosen = item.card;
        break;
      }
    }

    pickedIds.add(chosen.id);
    const upgradeChance =
      nodeType === 'boss'
        ? 0.4
        : nodeType === 'elite'
        ? 0.32
        : floor >= 16
        ? 0.35
        : 0.2;
    result.push(instantiateCard(chosen.id, Math.random() < upgradeChance));
  }

  return result;
}

let uidCounter = 1;
export function instantiateCard(cardId: string, upgraded = false): Card {
  const template = ALL_CARDS.find((c) => c.id === cardId) || ALL_CARDS[0];
  uidCounter += 1;
  const resolvedCost =
    upgraded && template.upgradedCost !== undefined
      ? template.upgradedCost
      : template.cost;
  return {
    ...template,
    uid: `${template.id}_${uidCounter}_${Math.random().toString(36).slice(2, 6)}`,
    upgraded,
    cost: resolvedCost,
  };
}

export function getStarterDeck(classType: ClassType): Card[] {
  if (classType === 'warrior') {
    return [
      instantiateCard('w_strike'),
      instantiateCard('w_strike'),
      instantiateCard('w_strike'),
      instantiateCard('w_strike'),
      instantiateCard('w_defend'),
      instantiateCard('w_defend'),
      instantiateCard('w_defend'),
      instantiateCard('w_defend'),
      instantiateCard('w_bash'),
      instantiateCard('w_iron_wave'),
    ];
  }
  if (classType === 'mage') {
    return [
      instantiateCard('m_strike'),
      instantiateCard('m_strike'),
      instantiateCard('m_strike'),
      instantiateCard('m_defend'),
      instantiateCard('m_defend'),
      instantiateCard('m_defend'),
      instantiateCard('m_defend'),
      instantiateCard('m_zap'),
      instantiateCard('m_fire_bolt'),
      instantiateCard('m_cold_snap'),
    ];
  }
  return [
    instantiateCard('a_strike'),
    instantiateCard('a_strike'),
    instantiateCard('a_strike'),
    instantiateCard('a_defend'),
    instantiateCard('a_defend'),
    instantiateCard('a_defend'),
    instantiateCard('a_defend'),
    instantiateCard('a_blade_dance'),
    instantiateCard('a_deadly_poison'),
    instantiateCard('a_finisher'),
  ];
}

// ============================================================================
// Multi-Act Commercial Enemy Encounter Factory (Act 1 ~ Act 3 + Ascension)
// ============================================================================
export function createEncounter(
  floor: number,
  type: 'combat' | 'elite' | 'boss',
  ascension = 0
): Enemy[] {
  // 15 floors per Act across 3 Acts (45 floors total)
  const act = Math.min(3, Math.ceil(floor / 15));
  const ascHpMult = 1 + ascension * 0.05;
  const ascDmgBonus = Math.floor((ascension + 1) / 3);
  const scale = (1 + (floor - 1) * 0.036) * ascHpMult;

  if (type === 'boss') {
    if (act === 1) {
      return [
        {
          id: 'boss_lich',
          uid: 'boss_act1',
          name: '第一幕首领 · 冥界骸骨暴君',
          title: '统御亡灵军团的死灵君主',
          tier: 'boss',
          maxHp: Math.round(145 * ascHpMult),
          hp: Math.round(145 * ascHpMult),
          block: 10,
          statuses: { ...EMPTY_STATUS, metallicize: 4 },
          spriteType: 'boss_lich',
          intentIndex: 0,
          phase: 1,
          berserkName: '第一幕首领 · 血狱狂骸暴君 [狂暴]',
          berserkTitle: '燃尽灵魂王座的二阶段暴走死神',
          berserkQuote: '“凡人！你竟敢击碎吾之白骨王冠……感受血狱深渊的狂怒吧！！”',
          berserkBuffs: {
            strength: 3,
            metallicize: 4,
            thorns: 2,
            blockGain: 15,
          },
          intents: [
            {
              type: 'attack_debuff',
              damage: 10 + ascDmgBonus,
              statusName: 'vulnerable',
              statusAmount: 2,
              label: `冥火斩 ${10 + ascDmgBonus} + 脆弱2`,
            },
            {
              type: 'attack_defend',
              damage: 8 + ascDmgBonus,
              block: 12,
              label: `白骨壁垒 ${8 + ascDmgBonus} + 12盾`,
            },
            {
              type: 'buff',
              statusName: 'strength',
              statusAmount: 3,
              block: 10,
              label: '亡者苏生 +3力量/10盾',
            },
            {
              type: 'attack',
              damage: 7 + ascDmgBonus,
              hits: 2,
              label: `夺魂双刃 ${7 + ascDmgBonus}x2`,
            },
          ],
          berserkIntents: [
            {
              type: 'attack',
              damage: 9 + ascDmgBonus,
              hits: 2,
              label: `【狂暴】血狱狂镰 ${9 + ascDmgBonus}x2`,
            },
            {
              type: 'attack_debuff',
              damage: 15 + ascDmgBonus,
              statusName: 'vulnerable',
              statusAmount: 2,
              label: `【狂暴】噬魂冥爆 ${15 + ascDmgBonus} + 脆弱2`,
            },
            {
              type: 'attack_defend',
              damage: 12 + ascDmgBonus,
              block: 16,
              label: `【狂暴】骸骨血障 ${12 + ascDmgBonus} + 16盾`,
            },
          ],
        },
      ];
    }
    if (act === 2) {
      return [
        {
          id: 'boss_archon',
          uid: 'boss_act2',
          name: '第二幕首领 · 星界奥术主宰',
          title: '操控虚空与星辰的古老神明',
          tier: 'boss',
          maxHp: Math.round(210 * ascHpMult),
          hp: Math.round(210 * ascHpMult),
          block: 15,
          statuses: { ...EMPTY_STATUS, ritual: 1 },
          spriteType: 'boss_archon',
          intentIndex: 0,
          phase: 1,
          berserkName: '第二幕首领 · 猩红奇点主宰 [狂暴]',
          berserkTitle: '法则崩坏后暴走的虚空神明',
          berserkQuote: '“星轨已然染血……全尖塔的奥术核心，尽数过载坍缩！！”',
          berserkBuffs: {
            strength: 4,
            ritual: 1,
            metallicize: 5,
            blockGain: 20,
          },
          intents: [
            {
              type: 'attack_debuff',
              damage: 12 + ascDmgBonus,
              statusName: 'weak',
              statusAmount: 2,
              label: `星辰脉冲 ${12 + ascDmgBonus} + 虚弱2`,
            },
            {
              type: 'attack',
              damage: 6 + ascDmgBonus,
              hits: 3,
              label: `奥术矩阵 ${6 + ascDmgBonus}x3`,
            },
            {
              type: 'buff',
              block: 16,
              statusName: 'strength',
              statusAmount: 3,
              label: '虚空折射 16盾/+3力量',
            },
            {
              type: 'attack',
              damage: 22 + ascDmgBonus,
              label: `超新星坍缩 ${22 + ascDmgBonus}`,
            },
          ],
          berserkIntents: [
            {
              type: 'attack',
              damage: 8 + ascDmgBonus,
              hits: 3,
              label: `【狂暴】猩红星陨矩阵 ${8 + ascDmgBonus}x3`,
            },
            {
              type: 'attack_debuff',
              damage: 18 + ascDmgBonus,
              statusName: 'vulnerable',
              statusAmount: 2,
              label: `【狂暴】维度撕裂 ${18 + ascDmgBonus} + 脆弱2`,
            },
            {
              type: 'attack',
              damage: 26 + ascDmgBonus,
              label: `【狂暴】终焉血色超新星 ${26 + ascDmgBonus}`,
            },
          ],
        },
      ];
    }
    // Act 3 Final Boss
    return [
      {
        id: 'boss_dragon',
        uid: 'boss_act3',
        name: '终焉首领 · 绯红魔龙皇',
        title: '盘踞尖塔之巅的远古灭世巨龙',
        tier: 'boss',
        maxHp: Math.round(285 * ascHpMult),
        hp: Math.round(285 * ascHpMult),
        block: 20,
        statuses: { ...EMPTY_STATUS, metallicize: 6, thorns: 2 },
        spriteType: 'boss_dragon',
        intentIndex: 0,
        phase: 1,
        berserkName: '终焉首领 · 灭世血焰狂龙皇 [狂暴]',
        berserkTitle: '逆鳞焚尽苍穹的终极二阶段古龙',
        berserkQuote: '“吼啊啊啊——！！触碰吾之逆鳞者，连同整座尖塔化为焦土吧！！”',
        berserkBuffs: {
          strength: 5,
          metallicize: 6,
          thorns: 3,
          blockGain: 25,
        },
        intents: [
          {
            type: 'attack_debuff',
            damage: 14 + ascDmgBonus,
            statusName: 'vulnerable',
            statusAmount: 2,
            label: `灭世龙息 ${14 + ascDmgBonus} + 脆弱2`,
          },
          {
            type: 'attack',
            damage: 8 + ascDmgBonus,
            hits: 2,
            label: `双翼烈焰狂斩 ${8 + ascDmgBonus}x2`,
          },
          {
            type: 'buff',
            block: 18,
            statusName: 'strength',
            statusAmount: 4,
            label: '逆鳞觉醒 18盾/+4力量',
          },
          {
            type: 'attack',
            damage: 26 + ascDmgBonus,
            label: `绯红终焉陨星 ${26 + ascDmgBonus}`,
          },
        ],
        berserkIntents: [
          {
            type: 'attack',
            damage: 10 + ascDmgBonus,
            hits: 3,
            label: `【狂暴】血焰三连龙爪 ${10 + ascDmgBonus}x3`,
          },
          {
            type: 'attack_debuff',
            damage: 22 + ascDmgBonus,
            statusName: 'vulnerable',
            statusAmount: 3,
            label: `【狂暴】焚天血龙吐息 ${22 + ascDmgBonus} + 脆弱3`,
          },
          {
            type: 'attack',
            damage: 32 + ascDmgBonus,
            label: `【狂暴】赤月坠落·终焉 ${32 + ascDmgBonus}`,
          },
        ],
      },
    ];
  }

  if (type === 'elite') {
    const eliteRoll = (floor + act) % 3;
    if (eliteRoll === 0) {
      return [
        {
          id: 'elite_demon',
          uid: 'elite_1',
          name: '精英 · 深渊狂魔领主',
          tier: 'elite',
          maxHp: Math.round(76 * scale),
          hp: Math.round(76 * scale),
          block: 0,
          statuses: { ...EMPTY_STATUS, ritual: 1 },
          spriteType: 'elite_demon',
          intentIndex: 0,
          intents: [
            { type: 'attack', damage: 10 + ascDmgBonus, label: `重劈 ${10 + ascDmgBonus}` },
            {
              type: 'attack_debuff',
              damage: 9 + ascDmgBonus,
              statusName: 'vulnerable',
              statusAmount: 2,
              label: `碎甲击 ${9 + ascDmgBonus} + 脆弱2`,
            },
            {
              type: 'attack',
              damage: 6 + ascDmgBonus,
              hits: 2,
              label: `狂暴连击 ${6 + ascDmgBonus}x2`,
            },
          ],
        },
      ];
    }
    if (eliteRoll === 1) {
      return [
        {
          id: 'elite_golem',
          uid: 'elite_2',
          name: '精英 · 发条泰坦魔像',
          tier: 'elite',
          maxHp: Math.round(82 * scale),
          hp: Math.round(82 * scale),
          block: 12,
          statuses: { ...EMPTY_STATUS, metallicize: 5, thorns: 2 },
          spriteType: 'clockwork_golem',
          intentIndex: 0,
          intents: [
            {
              type: 'attack_defend',
              damage: 9 + ascDmgBonus,
              block: 10,
              label: `齿轮重锤 ${9 + ascDmgBonus} + 10盾`,
            },
            {
              type: 'buff',
              statusName: 'strength',
              statusAmount: 3,
              block: 8,
              label: '蒸汽超载 +3力量/8盾',
            },
            {
              type: 'attack',
              damage: 16 + ascDmgBonus,
              label: `毁灭激光 ${16 + ascDmgBonus}`,
            },
          ],
        },
      ];
    }
    return [
      {
        id: 'elite_knight',
        uid: 'elite_3',
        name: '精英 · 骸骨审判官',
        tier: 'elite',
        maxHp: Math.round(70 * scale),
        hp: Math.round(70 * scale),
        block: 8,
        statuses: { ...EMPTY_STATUS, metallicize: 4 },
        spriteType: 'skeleton',
        intentIndex: 0,
        intents: [
          {
            type: 'attack_defend',
            damage: 9 + ascDmgBonus,
            block: 8,
            label: `盾击 ${9 + ascDmgBonus} + 格挡8`,
          },
          {
            type: 'buff',
            statusName: 'strength',
            statusAmount: 3,
            block: 6,
            label: '战吼 +3力量/6盾',
          },
          { type: 'attack', damage: 15 + ascDmgBonus, label: `处决斩 ${15 + ascDmgBonus}` },
        ],
      },
    ];
  }

  // Normal encounters varied by Act & Floor
  const roll = (floor + Math.floor(Math.random() * 5)) % 5;
  if (roll === 0) {
    return [
      {
        id: 'slime',
        uid: 'enemy_1',
        name: act === 1 ? '腐化史莱姆' : act === 2 ? '星界吞噬软泥' : '绯红熔岩巨怪',
        tier: 'normal',
        maxHp: Math.round(36 * scale),
        hp: Math.round(36 * scale),
        block: 0,
        statuses: { ...EMPTY_STATUS },
        spriteType: 'slime',
        intentIndex: 0,
        intents: [
          { type: 'attack', damage: 7 + ascDmgBonus, label: `撞击 ${7 + ascDmgBonus}` },
          {
            type: 'attack_debuff',
            damage: 5 + ascDmgBonus,
            statusName: 'weak',
            statusAmount: 1,
            label: `黏液喷射 ${5 + ascDmgBonus} + 虚弱1`,
          },
          { type: 'attack', damage: 10 + ascDmgBonus, label: `猛扑 ${10 + ascDmgBonus}` },
        ],
      },
    ];
  }
  if (roll === 1) {
    return [
      {
        id: 'cultist',
        uid: 'enemy_1',
        name: act === 1 ? '暗影邪教徒' : '深渊唤魔祭司',
        tier: 'normal',
        maxHp: Math.round(42 * scale),
        hp: Math.round(42 * scale),
        block: 0,
        statuses: { ...EMPTY_STATUS, ritual: 1 },
        spriteType: 'cultist',
        intentIndex: 0,
        intents: [
          { type: 'buff', statusName: 'strength', statusAmount: 2, label: '邪神吟唱 +2力量' },
          { type: 'attack', damage: 6 + ascDmgBonus, label: `暗影刺 ${6 + ascDmgBonus}` },
          { type: 'attack', damage: 9 + ascDmgBonus, label: `狂热斩 ${9 + ascDmgBonus}` },
        ],
      },
    ];
  }
  if (roll === 2) {
    return [
      {
        id: 'void_wraith',
        uid: 'enemy_1',
        name: '虚空噬魂幽灵',
        tier: 'normal',
        maxHp: Math.round(38 * scale),
        hp: Math.round(38 * scale),
        block: 6,
        statuses: { ...EMPTY_STATUS },
        spriteType: 'void_wraith',
        intentIndex: 0,
        intents: [
          {
            type: 'attack_debuff',
            damage: 6 + ascDmgBonus,
            statusName: 'vulnerable',
            statusAmount: 1,
            label: `幽冥侵蚀 ${6 + ascDmgBonus} + 脆弱1`,
          },
          { type: 'attack', damage: 5 + ascDmgBonus, hits: 2, label: `灵魂撕裂 ${5 + ascDmgBonus}x2` },
        ],
      },
    ];
  }
  if (roll === 3) {
    return [
      {
        id: 'skeleton',
        uid: 'enemy_1',
        name: '骸骨重装卫士',
        tier: 'normal',
        maxHp: Math.round(42 * scale),
        hp: Math.round(42 * scale),
        block: 6,
        statuses: { ...EMPTY_STATUS },
        spriteType: 'skeleton',
        intentIndex: 0,
        intents: [
          {
            type: 'attack_defend',
            damage: 6 + ascDmgBonus,
            block: 7,
            label: `举盾突刺 ${6 + ascDmgBonus} + 7盾`,
          },
          { type: 'attack', damage: 11 + ascDmgBonus, label: `重剑劈砍 ${11 + ascDmgBonus}` },
        ],
      },
    ];
  }
  // Dual encounter!
  return [
    {
      id: 'spider_1',
      uid: 'enemy_1',
      name: '剧毒魔蛛',
      tier: 'normal',
      maxHp: Math.round(25 * scale),
      hp: Math.round(25 * scale),
      block: 0,
      statuses: { ...EMPTY_STATUS },
      spriteType: 'spider',
      intentIndex: 0,
      intents: [
        { type: 'attack', damage: 5 + ascDmgBonus, label: `毒牙撕咬 ${5 + ascDmgBonus}` },
        {
          type: 'attack_defend',
          damage: 4 + ascDmgBonus,
          block: 5,
          label: `吐丝缠绕 ${4 + ascDmgBonus} + 5盾`,
        },
      ],
    },
    {
      id: 'slime_2',
      uid: 'enemy_2',
      name: '酸液史莱姆',
      tier: 'normal',
      maxHp: Math.round(27 * scale),
      hp: Math.round(27 * scale),
      block: 0,
      statuses: { ...EMPTY_STATUS },
      spriteType: 'slime',
      intentIndex: 0,
      intents: [
        {
          type: 'attack_debuff',
          damage: 4 + ascDmgBonus,
          statusName: 'vulnerable',
          statusAmount: 1,
          label: `酸液腐蚀 ${4 + ascDmgBonus} + 脆弱1`,
        },
        { type: 'attack', damage: 7 + ascDmgBonus, label: `酸液冲撞 ${7 + ascDmgBonus}` },
      ],
    },
  ];
}

// ============================================================================
// Rich Commercial Narrative Events (Triggered via Modal on Non-Normal-Combat Nodes)
// ============================================================================
export const SPIRE_EVENTS: SpireEvent[] = [
  {
    id: 'event_altar',
    title: '远古血之祭坛',
    iconType: 'blood',
    description:
      '幽暗的尖塔走廊中央矗立着一座散发绯红微光的石质祭坛。祭坛凹槽中残留着古老铭文：“唯有鲜血可换取神明遗宝，唯有虔诚可得赐福。”',
    choices: [
      {
        text: '🩸【鲜血献祭】扣除 10 点生命值 ➔ 获得 1 件秘藏遗物',
        subtext: '以血换宝 · 构筑质变',
        outcomeText: '鲜血渗入石槽，祭坛中升起一件闪耀着古老魔力的秘宝遗物！',
        hpChange: -10,
        gainRelic: true,
      },
      {
        text: '🃏【血契战技】扣除 6 点生命值 ➔ 立即获得 1 张已升级的稀有职业卡',
        subtext: '获取满强化核心金卡',
        outcomeText: '绯红符文烙印在你的掌心，一式失传的本职稀有秘技涌入脑海！',
        hpChange: -6,
        gainRareCard: true,
        upgradeRandomCard: true,
      },
      {
        text: '🙏【虔诚祈祷】恢复 16 点生命值',
        subtext: '稳健恢复体力',
        outcomeText: '温暖的光芒笼罩了你，身上的伤口逐渐愈合。',
        hpChange: 16,
      },
    ],
  },
  {
    id: 'event_vampire_council',
    title: '猩红夜族议会',
    iconType: 'crimson_scythe',
    description:
      '五名身披丝绒长袍的夜族贵族在阴影中向你举杯：“登塔者，凡人的躯壳太过脆弱，喝下这杯圣血，加入永夜的盛宴吧。”',
    choices: [
      {
        text: '🍷【饮下圣血】扣除 8 点最大生命上限 ➔ 获得 1 件遗物 + 1 张稀有卡',
        subtext: '牺牲生命上限换取双重核心奖励',
        outcomeText: '滚烫的圣血重塑了你的经脉，夜族长老向你献上了宗族圣物与秘卷！',
        maxHpChange: -8,
        gainRelic: true,
        gainRareCard: true,
      },
      {
        text: '⚔️【拔剑震慑】扣除 8 点生命值 ➔ 搜刮 85 金币并获得 1 张职业卡',
        subtext: '强势劫掠夜族财宝',
        outcomeText: '你挥剑劈碎血酒杯，夜族贵族化作蝙蝠四散而逃，留下满地金币与秘籍！',
        hpChange: -8,
        goldChange: 85,
        gainRandomCard: true,
      },
      {
        text: '🛡️【冷漠拒绝】恢复 10 点生命，安然离开',
        subtext: '不受诱惑',
        outcomeText: '你紧握武器缓缓退出了大殿，趁隙调息恢复了体力。',
        hpChange: 10,
      },
    ],
  },
  {
    id: 'event_golden_idol',
    title: '黄金神像机关室',
    iconType: 'holy_grail',
    description:
      '石台之上摆放着一尊纯金打造的古老神像，而上方的穹顶悬挂着布满尖刺的滚石机关。一旦拿走神像，机关必将触发！',
    choices: [
      {
        text: '👑【强夺神像】扣除 12 点生命值 ➔ 获得 1 件遗物 + 60 金币',
        subtext: '硬抗滚石机关夺取神像',
        outcomeText: '滚石擦伤了你的肩膀，但你将黄金神像与机关暗格中的遗物一并收入囊中！',
        hpChange: -12,
        gainRelic: true,
        goldChange: 60,
      },
      {
        text: '🃏【拓印神像铭文】获得 1 张已升级的职业卡牌 + 升级牌组中 1 张牌',
        subtext: '零风险强化双卡',
        outcomeText: '你临摹了神像底座的古武铭文，未触碰机关便令两张卡牌获得了顿悟！',
        gainRandomCard: true,
        upgradeRandomCard: true,
      },
      {
        text: '🧹【清理碎石】移除牌组中 1 张初始旧牌 + 获得 35 金币',
        subtext: '精简卡组厚度',
        outcomeText: '你卸下沉重的冗余招式，并在石台缝隙中拾取了散落的金币。',
        removeRandomCard: true,
        goldChange: 35,
      },
    ],
  },
  {
    id: 'event_blacksmith',
    title: '迷途铸剑宗师',
    iconType: 'heavy',
    description:
      '一名满脸胡茬的矮人铁匠正围着便携熔炉敲打铁砧：“嘿，登塔者！让我看看你的战技与甲胄，老夫今天手痒得很！”',
    choices: [
      {
        text: '🔥【炉火潜修】扣除 7 点生命值 ➔ 获得 1 件遗物 + 随机升级 1 张卡牌',
        subtext: '协助拉风箱换取铁匠秘宝',
        outcomeText: '炙热的炉火灼伤了你的手臂，铁匠大笑着将镇店遗物与淬火战技交给了你！',
        hpChange: -7,
        gainRelic: true,
        upgradeRandomCard: true,
      },
      {
        text: '⚒️【名匠锻造】免费升级牌组中 1 张卡牌 + 获得 1 张职业新卡',
        subtext: '无损强化与扩充',
        outcomeText: '铁匠三两锤便让你的战技焕然一新，还赠予你一卷压箱底的剑谱！',
        upgradeRandomCard: true,
        gainRandomCard: true,
      },
      {
        text: '🍺【共饮麦酒】恢复 18 点生命值，最大生命值 +5',
        subtext: '大幅恢复并强健体魄',
        outcomeText: '醇厚的矮人烈性麦酒下肚，你的浑身气血瞬间充盈！',
        hpChange: 18,
        maxHpChange: 5,
      },
    ],
  },
  {
    id: 'event_library',
    title: '星界禁忌书库',
    iconType: 'scroll',
    description:
      '无数漂浮的古老魔导书在穹顶下静静盘旋。书桌前点着一盏幽蓝色的灵魂长明灯，翻阅禁书需要付出精神或鲜血的代价。',
    choices: [
      {
        text: '📖【强阅禁典】扣除 8 点生命值 ➔ 获得 1 张金色稀有卡 + 1 张进阶卡',
        subtext: '连获两张高阶职业构筑卡',
        outcomeText: '禁忌知识如洪流般冲入脑海，你一举掌握了两门强大的流派核心卡牌！',
        hpChange: -8,
        gainRareCard: true,
        gainRandomCard: true,
      },
      {
        text: '🔮【研读秘卷】获得 1 张职业卡牌并立即升级牌组中 1 张牌',
        subtext: '稳健构筑成长',
        outcomeText: '你将书卷中的奥义融会贯通，并顺手改良了现有的招式！',
        gainRandomCard: true,
        upgradeRandomCard: true,
      },
      {
        text: '🕯️【焚毁冗余】移除牌组中 1 张基础牌 + 恢复 14 点生命',
        subtext: '精简卡组并休整',
        outcomeText: '你在幽蓝烛火旁冥想片刻，摒弃了杂念，卡组运转更加行云流水。',
        removeRandomCard: true,
        hpChange: 14,
      },
    ],
  },
  {
    id: 'event_wheel',
    title: '地精命运轮盘',
    iconType: 'arcane_eye',
    description:
      '一名戴着高礼帽的绿皮地精拍打着巨大的黄金转盘：“来转一发吧！只要一点点鲜血或勇气，遗物、金卡、巨款统统带走！”',
    choices: [
      {
        text: '🎰【血注豪赌】扣除 9 点生命值 ➔ 必得 1 件遗物 + 50 金币',
        subtext: '高回报必中头奖',
        outcomeText: '指针稳稳停在金色头奖格！地精咬牙切齿地把遗物和钱袋递给了你！',
        hpChange: -9,
        gainRelic: true,
        goldChange: 50,
      },
      {
        text: '🃏【卡牌大奖】获得 1 张稀有卡牌 + 随机升级 1 张卡牌',
        subtext: '强化卡组核心上限',
        outcomeText: '轮盘迸发出耀眼金光，一张传说级卡牌飞入了你的牌匣！',
        gainRareCard: true,
        upgradeRandomCard: true,
      },
      {
        text: '💰【见好就收】直接领取 75 金币并恢复 8 点生命',
        subtext: '稳赚不赔',
        outcomeText: '你拿走了桌上的安慰奖金袋，心满意足地迈向下一层。',
        goldChange: 75,
        hpChange: 8,
      },
    ],
  },
];

// ============================================================================
// Authentic Slay the Spire Multi-Act Map Generator (Act 1..3, 15 Floors per Act)
// ============================================================================
const NODE_META: Record<MapNodeType, { names: string[]; subtitle: string }> = {
  combat: {
    names: ['幽暗回廊守卫', '魔物巡逻小队', '石室伏击战', '腐化兵营前哨', '炼金禁区守军'],
    subtitle: '普通敌人 · 击败敌军赢取卡牌与金币奖励',
  },
  elite: {
    names: ['深渊精英领主', '骸骨审判庭', '发条泰坦禁卫', '虚空执政官'],
    subtitle: '精英强敌 · 高风险高回报，击败必得 1 件遗物',
  },
  rest: {
    names: ['寂静篝火营地', '高塔避风港', '铁砧锻造火堆', '余烬休整点'],
    subtitle: '休息处 · 围炉恢复生命，或铁砧锻造升级卡牌',
  },
  treasure: {
    names: ['皇家秘宝库', '远古龙纹宝箱', '星界黄金密室'],
    subtitle: '中期财宝室 · 开启宝箱免费获取遗物与金币',
  },
  shop: {
    names: ['地精黑市商人', '星界行商集市', '诡秘地下商会'],
    subtitle: '黑市商店 · 购买卡牌、遗物、药水或精简牌组',
  },
  event: {
    names: ['未知事件 (?)', '星辉许愿回廊 (?)', '禁忌古书库 (?)', '猩红夜族议会 (?)', '地精命运轮盘 (?)'],
    subtitle: '未知区域 (?) · 触发随机奇遇事件、祭坛或试炼',
  },
  boss: {
    names: ['冥界骸骨王座', '星界奥术神殿', '绯红魔龙王座'],
    subtitle: '本幕守关首领 · 击败后领取首领遗物并踏入下一幕',
  },
};

export function generateSpireMap(act = 1): MapNode[][] {
  const FLOORS_PER_ACT = 15;
  const NUM_COLS = 7; // Authentic Slay the Spire 7-column grid (0..6)
  const NUM_PATHS = 6; // 6 path walkers climbing from Floor 1 to Floor 14
  const baseFloor = (act - 1) * FLOORS_PER_ACT;

  const pickNodeMeta = (type: MapNodeType, actNum: number) => {
    const info = NODE_META[type];
    if (type === 'boss') {
      const bossName = info.names[Math.min(2, actNum - 1)];
      return { name: bossName, subtitle: info.subtitle };
    }
    const name = info.names[Math.floor(Math.random() * info.names.length)];
    return { name, subtitle: info.subtitle };
  };

  // Track active grid cells and directed edges: edges[f] maps col -> Set of nextCol on floor f+1
  const activeColsPerFloor: Set<number>[] = Array.from(
    { length: FLOORS_PER_ACT },
    () => new Set<number>()
  );
  const edgesPerFloor: Map<number, Set<number>>[] = Array.from(
    { length: FLOORS_PER_ACT },
    () => new Map<number, Set<number>>()
  );

  const addEdge = (fIdx: number, fromCol: number, toCol: number) => {
    if (!edgesPerFloor[fIdx].has(fromCol)) {
      edgesPerFloor[fIdx].set(fromCol, new Set<number>());
    }
    edgesPerFloor[fIdx].get(fromCol)!.add(toCol);
  };

  const hasEdge = (fIdx: number, fromCol: number, toCol: number): boolean => {
    return edgesPerFloor[fIdx].get(fromCol)?.has(toCol) ?? false;
  };

  // Choose well-distributed starting columns on Floor 1 (3 to 4 distinct starting nodes)
  const startBuckets = [
    [0, 1],
    [2, 3],
    [4],
    [5, 6],
  ];
  const startCols: number[] = startBuckets.map(
    (b) => b[Math.floor(Math.random() * b.length)]
  );
  while (startCols.length < NUM_PATHS) {
    startCols.push(Math.floor(Math.random() * NUM_COLS));
  }

  // Trace 6 non-crossing paths from Floor 1 (fIdx = 0) up to Floor 14 (fIdx = 13)
  for (let p = 0; p < NUM_PATHS; p++) {
    let currCol = startCols[p];
    activeColsPerFloor[0].add(currCol);

    for (let fIdx = 0; fIdx < FLOORS_PER_ACT - 2; fIdx++) {
      const candidates: number[] = [];
      for (const delta of [-1, 0, 1]) {
        const nextCol = currCol + delta;
        if (nextCol < 0 || nextCol >= NUM_COLS) continue;

        // Slay the Spire Anti-Crossing Rule:
        // If moving left (delta === -1), ensure (currCol - 1) didn't move right to currCol
        if (delta === -1 && hasEdge(fIdx, currCol - 1, currCol)) continue;
        // If moving right (delta === 1), ensure (currCol + 1) didn't move left to currCol
        if (delta === 1 && hasEdge(fIdx, currCol + 1, currCol)) continue;

        candidates.push(nextCol);
      }

      const chosenNextCol =
        candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : currCol;

      activeColsPerFloor[fIdx + 1].add(chosenNextCol);
      addEdge(fIdx, currCol, chosenNextCol);
      currCol = chosenNextCol;
    }
  }

  // Floor 15 (fIdx = 14) is always the single Act Boss node at center column 3
  activeColsPerFloor[FLOORS_PER_ACT - 1].add(3);

  // Build initial node skeleton with organic parchment X positions
  const floors: MapNode[][] = [];
  const nodeByFloorAndCol: Map<string, MapNode> = new Map();

  for (let fIdx = 0; fIdx < FLOORS_PER_ACT; fIdx++) {
    const f = fIdx + 1;
    const sortedCols = Array.from(activeColsPerFloor[fIdx]).sort((a, b) => a - b);
    const row: MapNode[] = [];

    sortedCols.forEach((col, idxInRow) => {
      // Base X from 7-column grid (14% to 86%) + subtle hand-drawn parchment jitter
      const baseX = f === FLOORS_PER_ACT ? 50 : 14 + col * 12;
      const jitter =
        f === FLOORS_PER_ACT
          ? 0
          : (((f * 17 + col * 31 + act * 13) % 9) - 4) * 0.45;
      const xPercent = Math.max(11, Math.min(89, Number((baseX + jitter).toFixed(1))));

      const placeholderNode: MapNode = {
        id: `a${act}_f${f}_${col}`,
        act,
        floor: baseFloor + f,
        actFloor: f,
        col: idxInRow,
        xPercent,
        type: 'combat',
        name: '',
        subtitle: '',
        completed: false,
        connections: [],
      };
      row.push(placeholderNode);
      nodeByFloorAndCol.set(`${fIdx}_${col}`, placeholderNode);
    });

    floors.push(row);
  }

  // Wire connections between Floor fIdx and Floor fIdx + 1
  const parentsMap: Map<string, MapNode[]> = new Map();
  for (let fIdx = 0; fIdx < FLOORS_PER_ACT - 1; fIdx++) {
    if (fIdx === FLOORS_PER_ACT - 2) {
      // Floor 14 -> Floor 15 Boss
      const bossNode = floors[FLOORS_PER_ACT - 1][0];
      floors[fIdx].forEach((n) => {
        n.connections.push(bossNode.id);
        const list = parentsMap.get(bossNode.id) || [];
        list.push(n);
        parentsMap.set(bossNode.id, list);
      });
    } else {
      const edgeMap = edgesPerFloor[fIdx];
      edgeMap.forEach((targetCols, fromCol) => {
        const fromNode = nodeByFloorAndCol.get(`${fIdx}_${fromCol}`);
        if (!fromNode) return;
        Array.from(targetCols)
          .sort((a, b) => a - b)
          .forEach((toCol) => {
            const toNode = nodeByFloorAndCol.get(`${fIdx + 1}_${toCol}`);
            if (!toNode) return;
            if (!fromNode.connections.includes(toNode.id)) {
              fromNode.connections.push(toNode.id);
            }
            const pList = parentsMap.get(toNode.id) || [];
            if (!pList.includes(fromNode)) pList.push(fromNode);
            parentsMap.set(toNode.id, pList);
          });
      });
    }
  }

  // ==========================================================================
  // Authentic Slay the Spire Room Type Assignment Rules:
  // - Floor 1: 100% 'combat' (Normal Monster)
  // - Floor 9: 100% 'treasure' (Mid-Act Treasure Chest — ONLY floor with chests!)
  // - Floor 14: 100% 'rest' (Pre-Boss Campfire Rest Site)
  // - Floor 15: 100% 'boss' (Act Boss)
  // - Floors 2..5: NO 'elite' and NO 'rest' (only 'combat', 'event', 'shop')
  // - Floor 13: NO 'rest' (cannot precede Floor 14 Rest Site)
  // - Parent->Child Rule: 'elite', 'rest', 'shop' can NEVER connect to the same type
  // - Sibling Rule: Siblings sharing a parent avoid duplicate special types
  // ==========================================================================
  let shopCountInAct = 0;
  let eliteCountInAct = 0;
  let restCountInAct = 0;

  for (let fIdx = 0; fIdx < FLOORS_PER_ACT; fIdx++) {
    const f = fIdx + 1;
    const row = floors[fIdx];

    row.forEach((node, idxInRow) => {
      let chosenType: MapNodeType = 'combat';

      if (f === 1) {
        chosenType = 'combat';
      } else if (f === 9) {
        chosenType = 'treasure';
      } else if (f === 14) {
        chosenType = 'rest';
      } else if (f === 15) {
        chosenType = 'boss';
      } else {
        const parents = parentsMap.get(node.id) || [];
        const parentTypes = new Set<MapNodeType>(parents.map((p) => p.type));

        // Sibling types already assigned on this floor that share a parent with this node
        const siblingSpecialTypes = new Set<MapNodeType>();
        parents.forEach((p) => {
          p.connections.forEach((cid) => {
            if (cid === node.id) return;
            const sib = row.find((r) => r.id === cid);
            if (sib && sib.name !== '' && sib.type !== 'combat') {
              siblingSpecialTypes.add(sib.type);
            }
          });
        });

        const isAllowed = (candidate: MapNodeType): boolean => {
          if (candidate === 'treasure' || candidate === 'boss') return false;
          // Rule 1: No Elites or Rest Sites on Floors 1..5
          if (f <= 5 && (candidate === 'elite' || candidate === 'rest')) return false;
          // Rule 2: No Rest Sites on Floor 13 (right before Floor 14 Campfire)
          if (f === 13 && candidate === 'rest') return false;
          // Rule 3: No consecutive Elite, Rest, or Shop along any connected path
          if (
            (candidate === 'elite' || candidate === 'rest' || candidate === 'shop') &&
            parentTypes.has(candidate)
          ) {
            return false;
          }
          // Rule 4: Avoid duplicate special room types on siblings of the same parent
          if (
            (candidate === 'elite' || candidate === 'rest' || candidate === 'shop') &&
            siblingSpecialTypes.has(candidate)
          ) {
            return false;
          }
          // Rule 5: Cap shops at 2-3 per Act so map isn't flooded with shops
          if (candidate === 'shop' && shopCountInAct >= 3) return false;
          return true;
        };

        // Weighted roll matching Slay the Spire room probabilities
        // Ensure healthy presence of Elites on Floors 6, 10, 12 and Rest on Floors 7, 11
        const weightedPool: { type: MapNodeType; weight: number }[] = [
          { type: 'combat' as MapNodeType, weight: f <= 5 ? 54 : 45 },
          { type: 'event' as MapNodeType, weight: f <= 5 ? 36 : 23 },
          {
            type: 'elite' as MapNodeType,
            weight:
              f >= 6
                ? (f === 6 || f === 11 || f === 13) && eliteCountInAct < 4
                  ? 26
                  : 14
                : 0,
          },
          {
            type: 'rest' as MapNodeType,
            weight:
              f >= 6 && f <= 12
                ? (f === 7 || f === 12) && restCountInAct < 3
                  ? 24
                  : 12
                : 0,
          },
          {
            type: 'shop' as MapNodeType,
            weight: (f === 4 || f === 10) && shopCountInAct < 2 && idxInRow === 0 ? 18 : 6,
          },
        ].filter((entry) => entry.weight > 0 && isAllowed(entry.type as MapNodeType));

        const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
        if (totalWeight <= 0) {
          chosenType = 'combat';
        } else {
          let roll = Math.random() * totalWeight;
          chosenType = weightedPool[0].type;
          for (const item of weightedPool) {
            roll -= item.weight;
            if (roll <= 0) {
              chosenType = item.type;
              break;
            }
          }
        }
      }

      if (chosenType === 'shop') shopCountInAct++;
      if (chosenType === 'elite') eliteCountInAct++;
      if (chosenType === 'rest' && f < 14) restCountInAct++;

      const meta = pickNodeMeta(chosenType, act);
      node.type = chosenType;
      node.name = meta.name;
      node.subtitle = meta.subtitle;
    });
  }

  return floors;
}


