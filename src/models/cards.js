/**
 * 卡牌基礎數據與定義
 */

// 移動卡牌
const MovementCards = {
  // 前進移動
  move_forward_1: {
    id: 'move_forward_1',
    name: '前進1格',
    type: 'movement',
    description: '向前移動1格',
    manaCost: 10,
    range: 1,
    direction: 'forward',
    color: '#4dabf7',
    icon: '⬆️'
  },
  move_forward_2: {
    id: 'move_forward_2',
    name: '前進2格',
    type: 'movement',
    description: '向前移動2格',
    manaCost: 15,
    range: 2,
    direction: 'forward',
    color: '#4dabf7',
    icon: '⏫'
  },
  
  // 後退移動
  move_backward_1: {
    id: 'move_backward_1',
    name: '後退1格',
    type: 'movement',
    description: '向後移動1格',
    manaCost: 10,
    range: 1,
    direction: 'backward',
    color: '#4dabf7',
    icon: '⬇️'
  },
  move_backward_2: {
    id: 'move_backward_2',
    name: '後退2格',
    type: 'movement',
    description: '向後移動2格',
    manaCost: 15,
    range: 2,
    direction: 'backward',
    color: '#4dabf7',
    icon: '⏬'
  },
  
  // 左移動
  move_left_1: {
    id: 'move_left_1',
    name: '左移1格',
    type: 'movement',
    description: '向左移動1格',
    manaCost: 10,
    range: 1,
    direction: 'left',
    color: '#4dabf7',
    icon: '⬅️'
  },
  move_left_2: {
    id: 'move_left_2',
    name: '左移2格',
    type: 'movement',
    description: '向左移動2格',
    manaCost: 15,
    range: 2,
    direction: 'left',
    color: '#4dabf7',
    icon: '⏪'
  },
  
  // 右移動
  move_right_1: {
    id: 'move_right_1',
    name: '右移1格',
    type: 'movement',
    description: '向右移動1格',
    manaCost: 10,
    range: 1,
    direction: 'right',
    color: '#4dabf7',
    icon: '➡️'
  },
  move_right_2: {
    id: 'move_right_2',
    name: '右移2格',
    type: 'movement',
    description: '向右移動2格',
    manaCost: 15,
    range: 2,
    direction: 'right',
    color: '#4dabf7',
    icon: '⏩'
  }
};

// 攻擊卡牌
const AttackCards = {
  // 戰士攻擊
  attack_straight_line: {
    id: 'attack_straight_line',
    name: '直線斬擊',
    type: 'attack',
    description: '在正前方直線範圍內造成傷害',
    manaCost: 25,
    damage: 30,
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 0, 0]
    ],
    color: '#ff6b6b',
    icon: '🗡️'
  },
  attack_sweep: {
    id: 'attack_sweep',
    name: '橫掃',
    type: 'attack',
    description: '在前方扇形範圍內造成傷害',
    manaCost: 30,
    damage: 25,
    pattern: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 0, 0]
    ],
    color: '#ff6b6b',
    icon: '⚔️'
  },
  attack_bash: {
    id: 'attack_bash',
    name: '猛擊',
    type: 'attack',
    description: '對正前方一格造成高傷害',
    manaCost: 20,
    damage: 40,
    pattern: [
      [0, 1, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    color: '#ff6b6b',
    icon: '🔨'
  },
  
  // 法師攻擊
  attack_fireball: {
    id: 'attack_fireball',
    name: '火球術',
    type: 'attack',
    description: '向前發射火球，造成中等傷害',
    manaCost: 25,
    damage: 35,
    pattern: [
      [0, 1, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    color: '#ff922b',
    icon: '🔥'
  },
  attack_frost_nova: {
    id: 'attack_frost_nova',
    name: '冰霜新星',
    type: 'attack',
    description: '對周圍所有格子造成傷害',
    manaCost: 40,
    damage: 20,
    pattern: [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1]
    ],
    color: '#74c0fc',
    icon: '❄️'
  },
  attack_lightning: {
    id: 'attack_lightning',
    name: '閃電鏈',
    type: 'attack',
    description: '發射閃電，造成直線傷害',
    manaCost: 35,
    damage: 30,
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0]
    ],
    color: '#da77f2',
    icon: '⚡'
  },
  attack_meteor: {
    id: 'attack_meteor',
    name: '隕石術',
    type: 'attack',
    description: '召喚隕石，造成大範圍傷害',
    manaCost: 50,
    damage: 45,
    pattern: [
      [1, 1, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#e67700',
    icon: '☄️'
  },
  
  // 盜賊攻擊
  attack_backstab: {
    id: 'attack_backstab',
    name: '背刺',
    type: 'attack',
    description: '對一格目標造成高傷害',
    manaCost: 25,
    damage: 45,
    pattern: [
      [0, 1, 0],
      [0, 0, 0],
      [0, 0, 0]
    ],
    color: '#94d82d',
    icon: '🗡️'
  },
  attack_fan_of_knives: {
    id: 'attack_fan_of_knives',
    name: '刀扇',
    type: 'attack',
    description: '對周圍敵人造成傷害',
    manaCost: 35,
    damage: 25,
    pattern: [
      [1, 1, 1],
      [1, 0, 1],
      [0, 0, 0]
    ],
    color: '#94d82d',
    icon: '🔪'
  },
  attack_poison_strike: {
    id: 'attack_poison_strike',
    name: '毒襲',
    type: 'attack',
    description: '對前方兩格造成傷害',
    manaCost: 30,
    damage: 30,
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 0, 0]
    ],
    color: '#66a80f',
    icon: '☠️'
  }
};

// 合併所有卡牌
const AllCards = {
  ...MovementCards,
  ...AttackCards
};

/**
 * 獲取角色的所有可用卡牌
 * @param {Array} cardPool - 卡牌ID數組
 * @returns {Array} - 卡牌對象數組
 */
export const getCharacterCards = (cardPool) => {
  if (!cardPool || !Array.isArray(cardPool)) return [];
  return cardPool.map(cardId => AllCards[cardId]).filter(Boolean);
};

/**
 * 從角色卡牌池中隨機抽取卡牌
 * @param {Array} cardPool - 卡牌ID數組
 * @param {number} count - 需要抽取的卡牌數量
 * @returns {Array} - 卡牌對象數組
 */
export const drawRandomCards = (cardPool, count = 10) => {
  if (!cardPool || !Array.isArray(cardPool) || cardPool.length === 0) return [];
  
  // 隨機排序卡牌池
  const shuffled = [...cardPool].sort(() => 0.5 - Math.random());
  
  // 選擇指定數量的卡牌
  const selectedIds = shuffled.slice(0, Math.min(count, cardPool.length));
  
  // 轉換為卡牌對象
  return selectedIds.map(cardId => AllCards[cardId]).filter(Boolean);
};

/**
 * 根據ID獲取卡牌
 * @param {string} cardId - 卡牌ID
 * @returns {Object|undefined} - 卡牌對象或undefined（如果未找到）
 */
export const getCardById = (cardId) => {
  return AllCards[cardId];
};

export { MovementCards, AttackCards, AllCards };