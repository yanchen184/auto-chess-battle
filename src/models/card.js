/**
 * Card model definitions
 */

// Movement cards
const MovementCards = {
  // Forward movement
  move_forward_1: {
    id: 'move_forward_1',
    name: '前進1格',
    type: 'movement',
    description: '向前移動1格',
    manaCost: 10,
    range: 1,
    direction: 'forward'
  },
  move_forward_2: {
    id: 'move_forward_2',
    name: '前進2格',
    type: 'movement',
    description: '向前移動2格',
    manaCost: 15,
    range: 2,
    direction: 'forward'
  },
  
  // Backward movement
  move_backward_1: {
    id: 'move_backward_1',
    name: '後退1格',
    type: 'movement',
    description: '向後移動1格',
    manaCost: 10,
    range: 1,
    direction: 'backward'
  },
  move_backward_2: {
    id: 'move_backward_2',
    name: '後退2格',
    type: 'movement',
    description: '向後移動2格',
    manaCost: 15,
    range: 2,
    direction: 'backward'
  },
  
  // Left movement
  move_left_1: {
    id: 'move_left_1',
    name: '左移1格',
    type: 'movement',
    description: '向左移動1格',
    manaCost: 10,
    range: 1,
    direction: 'left'
  },
  move_left_2: {
    id: 'move_left_2',
    name: '左移2格',
    type: 'movement',
    description: '向左移動2格',
    manaCost: 15,
    range: 2,
    direction: 'left'
  },
  
  // Right movement
  move_right_1: {
    id: 'move_right_1',
    name: '右移1格',
    type: 'movement',
    description: '向右移動1格',
    manaCost: 10,
    range: 1,
    direction: 'right'
  },
  move_right_2: {
    id: 'move_right_2',
    name: '右移2格',
    type: 'movement',
    description: '向右移動2格',
    manaCost: 15,
    range: 2,
    direction: 'right'
  }
};

// Attack cards
const AttackCards = {
  // Warrior attacks
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
    ] // Only cells with 1 are active attack areas
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
    ]
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
    ]
  },
  
  // Mage attacks
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
    ]
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
    ]
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
    ]
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
    ]
  },
  
  // Rogue attacks
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
    ]
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
    ]
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
    ]
  }
};

// Combine all cards
const AllCards = {
  ...MovementCards,
  ...AttackCards
};

/**
 * Get all cards for a character based on their card pool
 * @param {Array} cardPool - Array of card IDs
 * @returns {Array} - Array of card objects
 */
export const getCharacterCards = (cardPool) => {
  return cardPool.map(cardId => AllCards[cardId]);
};

/**
 * Draw random cards from a character's card pool
 * @param {Array} cardPool - Array of card IDs
 * @param {number} count - Number of cards to draw
 * @returns {Array} - Array of card objects
 */
export const drawRandomCards = (cardPool, count) => {
  const shuffled = [...cardPool].sort(() => 0.5 - Math.random());
  const selectedIds = shuffled.slice(0, count);
  return selectedIds.map(cardId => AllCards[cardId]);
};

export { MovementCards, AttackCards, AllCards };
