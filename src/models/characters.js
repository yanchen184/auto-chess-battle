/**
 * 角色基礎數據與定義
 */

// 遊戲中可選的角色
const Characters = [
  {
    id: 'warrior',
    name: '戰士',
    description: '強大的近戰戰士，擅長承受傷害並近身攻擊',
    health: 120,
    mana: 80,
    cardPool: [
      'move_forward_1',
      'move_forward_2',
      'move_backward_1',
      'move_left_1',
      'move_right_1',
      'attack_straight_line',
      'attack_sweep',
      'attack_bash'
    ],
    avatar: '⚔️',
    color: '#ff6b6b'
  },
  {
    id: 'mage',
    name: '法師',
    description: '強大的遠程法師，擅長使用魔法造成大範圍傷害',
    health: 80,
    mana: 120,
    cardPool: [
      'move_forward_1',
      'move_backward_1',
      'move_left_1',
      'move_right_1',
      'attack_fireball',
      'attack_frost_nova',
      'attack_lightning',
      'attack_meteor'
    ],
    avatar: '🔮',
    color: '#4dabf7'
  },
  {
    id: 'rogue',
    name: '盜賊',
    description: '敏捷的刺客，擅長快速移動和精準打擊',
    health: 90,
    mana: 100,
    cardPool: [
      'move_forward_1',
      'move_forward_2',
      'move_backward_1',
      'move_backward_2',
      'move_left_1',
      'move_right_1',
      'attack_backstab',
      'attack_fan_of_knives',
      'attack_poison_strike'
    ],
    avatar: '🗡️',
    color: '#38d9a9'
  }
];

/**
 * 根據角色ID獲取角色信息
 * @param {string} characterId - 角色ID
 * @returns {Object|undefined} - 角色對象或undefined（如果未找到）
 */
export const getCharacterById = (characterId) => {
  return Characters.find(character => character.id === characterId);
};

/**
 * 獲取所有可用角色列表
 * @returns {Array} - 角色對象數組
 */
export const getAllCharacters = () => {
  return Characters;
};

export default Characters;