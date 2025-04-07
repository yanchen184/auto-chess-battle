/**
 * Game logic utilities for executing card actions
 */

import { AllCards } from '../models/card';

/**
 * Calculate new position after movement
 * @param {Object} currentPosition - Current position {row, col}
 * @param {string} playerRole - 'host' or 'guest' (affects direction)
 * @param {Object} card - Movement card being played
 * @param {Array} board - Game board state
 * @returns {Object|null} - New position or null if move is invalid
 */
export const calculateMovement = (currentPosition, playerRole, card, board) => {
  if (!currentPosition || !card || card.type !== 'movement') return null;
  
  const { row, col } = currentPosition;
  const { direction, range } = card;
  
  // Convert relative direction to absolute based on player role
  // Host is on the left side (facing right), Guest is on the right side (facing left)
  const getAbsoluteDirection = (relativeDirection) => {
    if (playerRole === 'host') {
      // Host is facing right, so forward = right, backward = left, etc.
      switch (relativeDirection) {
        case 'forward': return 'right';
        case 'backward': return 'left';
        case 'left': return 'up';
        case 'right': return 'down';
        default: return relativeDirection;
      }
    } else {
      // Guest is facing left, so forward = left, backward = right, etc.
      switch (relativeDirection) {
        case 'forward': return 'left';
        case 'backward': return 'right';
        case 'left': return 'down';
        case 'right': return 'up';
        default: return relativeDirection;
      }
    }
  };
  
  const absoluteDirection = getAbsoluteDirection(direction);
  
  // Calculate new position based on direction and range
  let newRow = row;
  let newCol = col;
  
  switch (absoluteDirection) {
    case 'up':
      newRow -= range;
      break;
    case 'down':
      newRow += range;
      break;
    case 'left':
      newCol -= range;
      break;
    case 'right':
      newCol += range;
      break;
    default:
      return null;
  }
  
  // Check if new position is valid (within board bounds and not occupied)
  if (
    newRow < 0 || newRow >= 5 ||
    newCol < 0 || newCol >= 5 ||
    board[newRow][newCol].occupied
  ) {
    return null;
  }
  
  return { row: newRow, col: newCol };
};

/**
 * Calculate attack pattern and impacted cells
 * @param {Object} attackerPosition - Position of the attacking player {row, col}
 * @param {string} attackerRole - 'host' or 'guest' (affects pattern orientation)
 * @param {Object} card - Attack card being played
 * @returns {Array} - Array of cells affected by the attack {row, col}
 */
export const calculateAttackPattern = (attackerPosition, attackerRole, card) => {
  if (!attackerPosition || !card || card.type !== 'attack' || !card.pattern) {
    return [];
  }
  
  const { row, col } = attackerPosition;
  const pattern = card.pattern;
  const affectedCells = [];
  
  // Convert pattern to affected cells based on attacker position and role
  for (let i = 0; i < pattern.length; i++) {
    for (let j = 0; j < pattern[i].length; j++) {
      if (pattern[i][j]) {
        let cellRow, cellCol;
        
        if (attackerRole === 'host') {
          // Host faces right, so pattern is oriented from left to right
          cellRow = row + (i - 1); // -1 to center pattern on player (row 1 of pattern)
          cellCol = col + (j - 1) + 1; // Center horizontally, +1 to put pattern in front
        } else {
          // Guest faces left, so pattern is mirrored
          cellRow = row + (i - 1); // -1 to center pattern on player
          cellCol = col - (j - 1) - 1; // Center horizontally, -1 to put pattern in front
        }
        
        // Check if cell is within board bounds
        if (cellRow >= 0 && cellRow < 5 && cellCol >= 0 && cellCol < 5) {
          affectedCells.push({ row: cellRow, col: cellCol });
        }
      }
    }
  }
  
  return affectedCells;
};

/**
 * Process an attack card action
 * @param {Object} gameState - Current game state
 * @param {string} attackerId - Player ID performing the attack
 * @param {string} cardId - ID of the attack card used
 * @returns {Object} - Updated game state after attack
 */
export const processAttack = (gameState, attackerId, cardId) => {
  // Clone game state to avoid direct mutations
  const newGameState = JSON.parse(JSON.stringify(gameState));
  
  // Get players
  const attackerPlayer = newGameState.players[attackerId];
  const defenderPlayer = Object.values(newGameState.players).find(p => p.id !== attackerId);
  
  if (!attackerPlayer || !defenderPlayer) return newGameState;
  
  // Get attack card
  const card = AllCards[cardId];
  if (!card || card.type !== 'attack') return newGameState;
  
  // Reduce attacker's mana
  attackerPlayer.mana = Math.max(0, attackerPlayer.mana - card.manaCost);
  
  // Get attacker role
  const attackerRole = attackerId === Object.keys(newGameState.players)[0] ? 'host' : 'guest';
  
  // Calculate attack pattern
  const affectedCells = calculateAttackPattern(attackerPlayer.position, attackerRole, card);
  
  // Check if defender is in affected cells
  const defenderHit = affectedCells.some(cell => 
    defenderPlayer.position.row === cell.row && 
    defenderPlayer.position.col === cell.col
  );
  
  // Apply damage if defender is hit
  if (defenderHit) {
    defenderPlayer.health = Math.max(0, defenderPlayer.health - card.damage);
    
    // Check if defender is defeated
    if (defenderPlayer.health <= 0) {
      newGameState.status = 'finished';
      newGameState.winner = attackerId;
    }
  }
  
  return newGameState;
};

/**
 * Process a movement card action
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player ID performing the movement
 * @param {string} cardId - ID of the movement card used
 * @returns {Object} - Updated game state after movement
 */
export const processMovement = (gameState, playerId, cardId) => {
  // Clone game state to avoid direct mutations
  const newGameState = JSON.parse(JSON.stringify(gameState));
  
  // Get player
  const player = newGameState.players[playerId];
  if (!player) return newGameState;
  
  // Get movement card
  const card = AllCards[cardId];
  if (!card || card.type !== 'movement') return newGameState;
  
  // Reduce player's mana
  player.mana = Math.max(0, player.mana - card.manaCost);
  
  // Get player role
  const playerRole = playerId === Object.keys(newGameState.players)[0] ? 'host' : 'guest';
  
  // Calculate new position
  const newPosition = calculateMovement(player.position, playerRole, card, newGameState.board);
  
  // Update player position if move is valid
  if (newPosition) {
    // Clear current cell
    const currentCell = newGameState.board[player.position.row][player.position.col];
    currentCell.occupied = false;
    currentCell.playerId = null;
    
    // Update new cell
    const newCell = newGameState.board[newPosition.row][newPosition.col];
    newCell.occupied = true;
    newCell.playerId = playerId;
    
    // Update player position
    player.position = newPosition;
  }
  
  return newGameState;
};

/**
 * Process an action card (move or attack)
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player ID performing the action
 * @param {string} cardId - ID of the card used
 * @returns {Object} - Updated game state after action
 */
export const processCardAction = (gameState, playerId, cardId) => {
  const card = AllCards[cardId];
  if (!card) return gameState;
  
  if (card.type === 'movement') {
    return processMovement(gameState, playerId, cardId);
  } else if (card.type === 'attack') {
    return processAttack(gameState, playerId, cardId);
  }
  
  return gameState;
};
