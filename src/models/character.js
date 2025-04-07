/**
 * Character model definitions
 */

// Base characters available in the game
const BaseCharacters = [
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
    ]
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
    ]
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
    ]
  }
];

export default BaseCharacters;
