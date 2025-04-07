// Game related Firebase functions
import { db, realtimeDb } from './config';
import { 
  collection, addDoc, doc, getDoc, updateDoc, setDoc,
  query, where, getDocs, serverTimestamp 
} from 'firebase/firestore';
import { ref, set, onValue, off, update } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new game session
 * @param {Object} hostPlayer - Host player info
 * @param {string} hostPlayer.id - Host player ID
 * @param {string} hostPlayer.name - Host player name
 * @param {Object} hostPlayer.character - Host player selected character
 * @returns {string} - Game ID
 */
export const createGame = async (hostPlayer) => {
  try {
    const gameId = uuidv4();
    const gameRef = doc(db, 'games', gameId);
    
    // Initialize game in Firestore
    await setDoc(gameRef, {
      id: gameId,
      hostPlayer: hostPlayer,
      guestPlayer: null,
      status: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      winner: null,
      currentTurn: 0,
    });
    
    // Initialize real-time game state
    await set(ref(realtimeDb, `games/${gameId}`), {
      board: initializeBoard(),
      players: {
        [hostPlayer.id]: {
          id: hostPlayer.id,
          name: hostPlayer.name,
          character: hostPlayer.character,
          position: getStartPosition('host'),
          health: hostPlayer.character.health,
          mana: hostPlayer.character.mana,
          selectedCards: [],
          ready: false,
        }
      },
      status: 'waiting',
      currentRound: 0,
      turnActions: [],
    });
    
    return gameId;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

/**
 * Join an existing game
 * @param {string} gameId - Game ID to join
 * @param {Object} guestPlayer - Guest player info
 * @returns {boolean} - Success status
 */
export const joinGame = async (gameId, guestPlayer) => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data();
    if (gameData.status !== 'waiting') {
      throw new Error('Game already started or finished');
    }
    
    // Update Firestore game document
    await updateDoc(gameRef, {
      guestPlayer: guestPlayer,
      status: 'ready',
      updatedAt: serverTimestamp(),
    });
    
    // Update real-time database
    const playerUpdate = {};
    playerUpdate[guestPlayer.id] = {
      id: guestPlayer.id,
      name: guestPlayer.name,
      character: guestPlayer.character,
      position: getStartPosition('guest'),
      health: guestPlayer.character.health,
      mana: guestPlayer.character.mana,
      selectedCards: [],
      ready: false,
    };
    
    await update(ref(realtimeDb, `games/${gameId}/players`), playerUpdate);
    await update(ref(realtimeDb, `games/${gameId}`), { status: 'ready' });
    
    return true;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time game updates
 * @param {string} gameId - Game ID to subscribe to
 * @param {function} callback - Callback function when game updates
 * @returns {function} - Unsubscribe function
 */
export const subscribeToGame = (gameId, callback) => {
  const gameRef = ref(realtimeDb, `games/${gameId}`);
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  // Return unsubscribe function
  return () => off(gameRef);
};

/**
 * Select cards for a turn
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @param {Array} selectedCards - Array of selected card IDs
 * @returns {boolean} - Success status
 */
export const selectCards = async (gameId, playerId, selectedCards) => {
  try {
    // Update player's selected cards
    await update(ref(realtimeDb, `games/${gameId}/players/${playerId}`), {
      selectedCards: selectedCards,
      ready: true,
    });
    
    // Check if both players are ready
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    const gameData = gameSnapshot.val();
    
    const allPlayersReady = Object.values(gameData.players).every(player => player.ready);
    
    if (allPlayersReady) {
      // Start turn execution
      await startTurnExecution(gameId, gameData);
    }
    
    return true;
  } catch (error) {
    console.error('Error selecting cards:', error);
    throw error;
  }
};

/**
 * Start executing a turn based on selected cards
 * @param {string} gameId - Game ID
 * @param {Object} gameData - Current game data
 */
const startTurnExecution = async (gameId, gameData) => {
  try {
    // Update game status to 'executing'
    await update(ref(realtimeDb, `games/${gameId}`), {
      status: 'executing',
    });
    
    // Get player IDs
    const playerIds = Object.keys(gameData.players);
    const hostId = playerIds[0];
    const guestId = playerIds[1];
    
    // Create turn actions sequence
    const turnActions = [];
    
    for (let i = 0; i < 3; i++) { // 3 cards per turn
      // Add host action
      if (gameData.players[hostId].selectedCards[i]) {
        turnActions.push({
          playerId: hostId,
          cardId: gameData.players[hostId].selectedCards[i],
          sequence: i * 2,
        });
      }
      
      // Add guest action
      if (gameData.players[guestId].selectedCards[i]) {
        turnActions.push({
          playerId: guestId,
          cardId: gameData.players[guestId].selectedCards[i],
          sequence: i * 2 + 1,
        });
      }
    }
    
    // Update turn actions
    await update(ref(realtimeDb, `games/${gameId}`), {
      turnActions: turnActions,
      currentActionIndex: 0,
    });
    
    // Execute first action
    await executeTurnAction(gameId, gameData, turnActions[0]);
    
  } catch (error) {
    console.error('Error starting turn execution:', error);
    throw error;
  }
};

/**
 * Execute a single turn action
 * @param {string} gameId - Game ID
 * @param {Object} gameData - Current game data
 * @param {Object} action - Action to execute
 */
const executeTurnAction = async (gameId, gameData, action) => {
  // This will be implemented to handle move and attack card logic
  // For now, just a placeholder
  console.log('Executing action:', action);
  
  // Continue with next action or finish turn
  await continueExecution(gameId);
};

/**
 * Continue turn execution with next action
 * @param {string} gameId - Game ID
 */
const continueExecution = async (gameId) => {
  try {
    // Get current game state
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    const gameData = gameSnapshot.val();
    
    const currentIndex = gameData.currentActionIndex;
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < gameData.turnActions.length) {
      // Execute next action
      await update(ref(realtimeDb, `games/${gameId}`), {
        currentActionIndex: nextIndex,
      });
      
      await executeTurnAction(gameId, gameData, gameData.turnActions[nextIndex]);
    } else {
      // Turn is complete, prepare for next turn
      await finishTurn(gameId, gameData);
    }
    
  } catch (error) {
    console.error('Error continuing execution:', error);
    throw error;
  }
};

/**
 * Finish the current turn and prepare for next
 * @param {string} gameId - Game ID
 * @param {Object} gameData - Current game data
 */
const finishTurn = async (gameId, gameData) => {
  try {
    // Reset player ready status
    const playerUpdates = {};
    Object.keys(gameData.players).forEach(playerId => {
      playerUpdates[`${playerId}/ready`] = false;
      playerUpdates[`${playerId}/selectedCards`] = [];
      
      // Restore some mana (half of max mana)
      const player = gameData.players[playerId];
      const maxMana = player.character.mana;
      const newMana = Math.min(player.mana + Math.floor(maxMana / 2), maxMana);
      playerUpdates[`${playerId}/mana`] = newMana;
    });
    
    // Update players
    await update(ref(realtimeDb, `games/${gameId}/players`), playerUpdates);
    
    // Update game status and increment round
    await update(ref(realtimeDb, `games/${gameId}`), {
      status: 'ready',
      currentRound: gameData.currentRound + 1,
      turnActions: [],
      currentActionIndex: null,
    });
    
  } catch (error) {
    console.error('Error finishing turn:', error);
    throw error;
  }
};

/**
 * Initialize the game board
 * @returns {Array} - 5x5 board grid
 */
const initializeBoard = () => {
  const board = [];
  for (let row = 0; row < 5; row++) {
    board[row] = [];
    for (let col = 0; col < 5; col++) {
      board[row][col] = {
        row,
        col,
        occupied: false,
        playerId: null,
      };
    }
  }
  return board;
};

/**
 * Get starting position based on player role
 * @param {string} role - 'host' or 'guest'
 * @returns {Object} - {row, col} position
 */
const getStartPosition = (role) => {
  if (role === 'host') {
    return { row: 2, col: 0 }; // Left middle
  } else {
    return { row: 2, col: 4 }; // Right middle
  }
};
