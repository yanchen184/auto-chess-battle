import { db, realtimeDb } from './config';
import { 
  collection, addDoc, doc, getDoc, updateDoc, 
  query, where, getDocs, serverTimestamp, setDoc
} from 'firebase/firestore';
import { 
  ref, set, onValue, off, update, get, remove,
  onDisconnect, push, child, onChildAdded, onChildChanged, onChildRemoved
} from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * 創建新遊戲
 * @param {Object} hostPlayer - 主機玩家信息
 * @returns {string} - 遊戲ID
 */
export const createGame = async (hostPlayer) => {
  try {
    const gameId = uuidv4();
    const gameRef = doc(db, 'games', gameId);
    
    // 在 Firestore 中初始化遊戲
    await setDoc(gameRef, {
      id: gameId,
      hostPlayer: {
        id: hostPlayer.id,
        name: hostPlayer.name,
        character: hostPlayer.character?.id || null
      },
      guestPlayer: null,
      status: 'waiting',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      winner: null,
      currentRound: 0
    });
    
    // 在 Realtime Database 中初始化遊戲狀態
    await set(ref(realtimeDb, `games/${gameId}`), {
      board: initializeBoard(),
      players: {
        [hostPlayer.id]: {
          id: hostPlayer.id,
          name: hostPlayer.name,
          character: hostPlayer.character,
          position: getStartPosition('host'),
          health: hostPlayer.character?.health || 100,
          mana: hostPlayer.character?.mana || 100,
          selectedCards: [],
          ready: false,
          isHost: true
        }
      },
      status: 'waiting',
      currentRound: 0,
      turnActions: [],
      actionIndex: 0,
      lastUpdate: Date.now()
    });
    
    // 設置斷線清理
    const playerStatusRef = ref(realtimeDb, `games/${gameId}/players/${hostPlayer.id}/online`);
    await set(playerStatusRef, true);
    onDisconnect(playerStatusRef).set(false);
    
    return gameId;
  } catch (error) {
    console.error('創建遊戲錯誤:', error);
    throw error;
  }
};

/**
 * 加入現有遊戲
 * @param {string} gameId - 遊戲ID
 * @param {Object} guestPlayer - 訪客玩家信息
 * @returns {boolean} - 成功狀態
 */
export const joinGame = async (gameId, guestPlayer) => {
  try {
    // 檢查遊戲是否存在
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    if (!gameSnapshot.exists()) {
      throw new Error('找不到遊戲');
    }
    
    const gameData = gameSnapshot.val();
    if (gameData.status !== 'waiting') {
      throw new Error('遊戲已經開始或已結束');
    }
    
    // 檢查訪客是否已在遊戲中
    const playersSnapshot = await get(ref(realtimeDb, `games/${gameId}/players`));
    const playersData = playersSnapshot.val();
    const existingPlayers = Object.values(playersData || {});
    if (existingPlayers.length >= 2) {
      throw new Error('遊戲已滿');
    }
    
    // 更新 Firestore 遊戲文檔
    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      guestPlayer: {
        id: guestPlayer.id,
        name: guestPlayer.name,
        character: guestPlayer.character?.id || null
      },
      status: 'ready',
      updatedAt: serverTimestamp()
    });
    
    // 更新 Realtime Database
    const playerData = {
      id: guestPlayer.id,
      name: guestPlayer.name,
      character: guestPlayer.character,
      position: getStartPosition('guest'),
      health: guestPlayer.character?.health || 100,
      mana: guestPlayer.character?.mana || 100,
      selectedCards: [],
      ready: false,
      isHost: false,
      online: true
    };
    
    await update(ref(realtimeDb, `games/${gameId}/players/${guestPlayer.id}`), playerData);
    await update(ref(realtimeDb, `games/${gameId}`), { 
      status: 'ready',
      lastUpdate: Date.now()
    });
    
    // 設置斷線清理
    const playerStatusRef = ref(realtimeDb, `games/${gameId}/players/${guestPlayer.id}/online`);
    onDisconnect(playerStatusRef).set(false);
    
    return true;
  } catch (error) {
    console.error('加入遊戲錯誤:', error);
    throw error;
  }
};

/**
 * 訂閱遊戲狀態更新
 * @param {string} gameId - 遊戲ID
 * @param {Function} callback - 狀態更新時的回調函數
 * @returns {Function} - 取消訂閱函數
 */
export const subscribeToGame = (gameId, callback) => {
  const gameRef = ref(realtimeDb, `games/${gameId}`);
  
  onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  // 返回取消訂閱函數
  return () => off(gameRef);
};

/**
 * 選擇卡牌並做好準備
 * @param {string} gameId - 遊戲ID
 * @param {string} playerId - 玩家ID
 * @param {Array} selectedCards - 選擇的卡牌ID數組
 * @returns {boolean} - 成功狀態
 */
export const selectCards = async (gameId, playerId, selectedCards) => {
  try {
    // 更新玩家的選擇卡牌和準備狀態
    await update(ref(realtimeDb, `games/${gameId}/players/${playerId}`), {
      selectedCards,
      ready: true
    });
    
    // 檢查所有玩家是否都準備好了
    const playersSnapshot = await get(ref(realtimeDb, `games/${gameId}/players`));
    const players = playersSnapshot.val();
    
    const allPlayersReady = Object.values(players).every(player => player.ready);
    
    if (allPlayersReady) {
      // 所有玩家都準備好了，開始執行回合
      await startTurnExecution(gameId);
    }
    
    return true;
  } catch (error) {
    console.error('選擇卡牌錯誤:', error);
    throw error;
  }
};

/**
 * 開始執行回合
 * @param {string} gameId - 遊戲ID
 */
const startTurnExecution = async (gameId) => {
  try {
    // 獲取遊戲數據
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    const gameData = gameSnapshot.val();
    
    // 更新遊戲狀態為執行中
    await update(ref(realtimeDb, `games/${gameId}`), {
      status: 'executing',
      lastUpdate: Date.now()
    });
    
    // 獲取所有玩家
    const players = gameData.players;
    const playerIds = Object.keys(players);
    
    // 創建回合動作序列
    const turnActions = [];
    
    // 每位玩家最多3張卡牌
    for (let i = 0; i < 3; i++) {
      // 添加所有玩家的第i張卡牌
      for (const playerId of playerIds) {
        const player = players[playerId];
        if (player.selectedCards[i]) {
          turnActions.push({
            playerId,
            cardId: player.selectedCards[i],
            sequence: turnActions.length
          });
        }
      }
    }
    
    // 更新回合動作
    await update(ref(realtimeDb, `games/${gameId}`), {
      turnActions,
      actionIndex: 0
    });
    
    // 如果有動作，執行第一個
    if (turnActions.length > 0) {
      setTimeout(() => executeTurnAction(gameId, 0), 1000);
    } else {
      // 沒有動作，直接結束回合
      await finishTurn(gameId);
    }
  } catch (error) {
    console.error('開始回合執行錯誤:', error);
    throw error;
  }
};

/**
 * 執行單個回合動作
 * @param {string} gameId - 遊戲ID
 * @param {number} actionIndex - 當前動作索引
 */
const executeTurnAction = async (gameId, actionIndex) => {
  try {
    // 獲取遊戲數據
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    const gameData = gameSnapshot.val();
    
    if (!gameData || !gameData.turnActions || gameData.turnActions.length <= actionIndex) {
      // 無效的動作索引，結束回合
      await finishTurn(gameId);
      return;
    }
    
    // 獲取當前動作
    const action = gameData.turnActions[actionIndex];
    
    // 更新當前動作索引
    await update(ref(realtimeDb, `games/${gameId}`), {
      actionIndex,
      currentAction: action,
      lastUpdate: Date.now()
    });
    
    // 執行動作
    const player = gameData.players[action.playerId];
    let actionResult = null;
    
    // 根據卡牌類型執行動作
    const cardSnapshot = await get(ref(realtimeDb, `games/${gameId}/cards/${action.cardId}`));
    let card = cardSnapshot.val();
    
    if (!card) {
      // 如果卡牌數據不在數據庫，從模型中獲取
      const { getCardById } = await import('../models/cards');
      card = getCardById(action.cardId);
    }
    
    if (!card) {
      console.error('找不到卡牌:', action.cardId);
      continueToNextAction(gameId, actionIndex);
      return;
    }
    
    // 減少玩家魔力
    await update(ref(realtimeDb, `games/${gameId}/players/${action.playerId}/mana`), 
      Math.max(0, player.mana - card.manaCost));
    
    if (card.type === 'movement') {
      // 移動卡牌
      actionResult = await executeMovementCard(gameId, action.playerId, card);
    } else if (card.type === 'attack') {
      // 攻擊卡牌
      actionResult = await executeAttackCard(gameId, action.playerId, card);
    }
    
    // 更新動作結果
    await update(ref(realtimeDb, `games/${gameId}/turnActions/${actionIndex}/result`), actionResult);
    
    // 延遲一段時間再執行下一個動作，用於動畫展示
    setTimeout(() => continueToNextAction(gameId, actionIndex), 1500);
  } catch (error) {
    console.error('執行回合動作錯誤:', error);
    continueToNextAction(gameId, actionIndex);
  }
};

/**
 * 繼續執行下一個動作
 * @param {string} gameId - 遊戲ID
 * @param {number} currentIndex - 當前動作索引
 */
const continueToNextAction = async (gameId, currentIndex) => {
  try {
    const nextIndex = currentIndex + 1;
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    const gameData = gameSnapshot.val();
    
    if (!gameData) {
      console.error('找不到遊戲數據');
      return;
    }
    
    if (nextIndex < gameData.turnActions.length) {
      // 執行下一個動作
      executeTurnAction(gameId, nextIndex);
    } else {
      // 所有動作執行完畢，結束回合
      finishTurn(gameId);
    }
  } catch (error) {
    console.error('繼續下一動作錯誤:', error);
    finishTurn(gameId);
  }
};

/**
 * 結束當前回合並準備下一回合
 * @param {string} gameId - 遊戲ID
 */
const finishTurn = async (gameId) => {
  try {
    // 獲取遊戲數據
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    const gameData = gameSnapshot.val();
    
    if (!gameData) {
      console.error('找不到遊戲數據');
      return;
    }
    
    // 重置玩家準備狀態並回復魔力
    const players = gameData.players;
    const playerUpdates = {};
    
    for (const playerId in players) {
      const player = players[playerId];
      playerUpdates[`${playerId}/ready`] = false;
      playerUpdates[`${playerId}/selectedCards`] = [];
      
      // 回復一半的魔力
      const maxMana = player.character?.mana || 100;
      const recoveryAmount = Math.floor(maxMana / 2);
      const newMana = Math.min(player.mana + recoveryAmount, maxMana);
      playerUpdates[`${playerId}/mana`] = newMana;
    }
    
    // 更新玩家狀態
    await update(ref(realtimeDb, `games/${gameId}/players`), playerUpdates);
    
    // 檢查勝負
    const playerIds = Object.keys(players);
    const alivePlayerIds = playerIds.filter(id => players[id].health > 0);
    
    if (alivePlayerIds.length <= 1) {
      // 遊戲結束
      const winnerId = alivePlayerIds[0] || null;
      await update(ref(realtimeDb, `games/${gameId}`), {
        status: 'finished',
        winner: winnerId,
        turnActions: [],
        actionIndex: 0,
        currentAction: null,
        lastUpdate: Date.now()
      });
      
      // 更新 Firestore 記錄
      const gameDocRef = doc(db, 'games', gameId);
      await updateDoc(gameDocRef, {
        status: 'finished',
        winner: winnerId,
        updatedAt: serverTimestamp()
      });
    } else {
      // 準備下一回合
      await update(ref(realtimeDb, `games/${gameId}`), {
        status: 'ready',
        currentRound: gameData.currentRound + 1,
        turnActions: [],
        actionIndex: 0,
        currentAction: null,
        lastUpdate: Date.now()
      });
    }
  } catch (error) {
    console.error('結束回合錯誤:', error);
    // 嘗試恢復到準備狀態
    update(ref(realtimeDb, `games/${gameId}`), {
      status: 'ready',
      turnActions: [],
      actionIndex: 0,
      currentAction: null,
      lastUpdate: Date.now()
    });
  }
};

/**
 * 執行移動卡牌
 * @param {string} gameId - 遊戲ID
 * @param {string} playerId - 玩家ID
 * @param {Object} card - 卡牌對象
 * @returns {Object} - 動作結果
 */
const executeMovementCard = async (gameId, playerId, card) => {
  try {
    // 獲取遊戲數據
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    const gameData = gameSnapshot.val();
    
    // 獲取玩家和棋盤
    const player = gameData.players[playerId];
    const board = gameData.board;
    
    // 計算新位置
    const { row, col } = player.position;
    const isHost = player.isHost;
    
    // 根據卡牌方向和玩家方向計算移動
    let newRow = row;
    let newCol = col;
    
    // 計算絕對方向（考慮玩家朝向）
    switch (card.direction) {
      case 'forward':
        newCol += isHost ? card.range : -card.range;
        break;
      case 'backward':
        newCol += isHost ? -card.range : card.range;
        break;
      case 'left':
        newRow += isHost ? -card.range : card.range;
        break;
      case 'right':
        newRow += isHost ? card.range : -card.range;
        break;
      default:
        break;
    }
    
    // 檢查是否在邊界內
    if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) {
      return { success: false, reason: 'out_of_bounds' };
    }
    
    // 檢查目標位置是否已被佔用
    if (board[newRow][newCol].occupied) {
      return { success: false, reason: 'occupied' };
    }
    
    // 更新棋盤
    const updates = {};
    updates[`board/${row}/${col}/occupied`] = false;
    updates[`board/${row}/${col}/playerId`] = null;
    updates[`board/${newRow}/${newCol}/occupied`] = true;
    updates[`board/${newRow}/${newCol}/playerId`] = playerId;
    updates[`players/${playerId}/position`] = { row: newRow, col: newCol };
    
    await update(ref(realtimeDb, `games/${gameId}`), updates);
    
    return {
      success: true,
      type: 'movement',
      from: { row, col },
      to: { row: newRow, col: newCol }
    };
  } catch (error) {
    console.error('執行移動卡牌錯誤:', error);
    return { success: false, reason: 'error', message: error.message };
  }
};

/**
 * 執行攻擊卡牌
 * @param {string} gameId - 遊戲ID
 * @param {string} playerId - 玩家ID
 * @param {Object} card - 卡牌對象
 * @returns {Object} - 動作結果
 */
const executeAttackCard = async (gameId, playerId, card) => {
  try {
    // 獲取遊戲數據
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    const gameData = gameSnapshot.val();
    
    // 獲取玩家和棋盤
    const attacker = gameData.players[playerId];
    const board = gameData.board;
    
    // 計算攻擊範圍
    const attackPattern = calculateAttackPattern(attacker.position, attacker.isHost, card.pattern);
    
    // 檢查範圍內是否有其他玩家
    const hitPlayers = [];
    
    for (const pos of attackPattern) {
      const { row, col } = pos;
      
      // 檢查是否在邊界內
      if (row < 0 || row >= 5 || col < 0 || col >= 5) continue;
      
      // 檢查格子是否被佔用
      if (board[row][col].occupied) {
        const targetPlayerId = board[row][col].playerId;
        
        // 不攻擊自己
        if (targetPlayerId !== playerId) {
          hitPlayers.push({
            playerId: targetPlayerId,
            position: { row, col }
          });
        }
      }
    }
    
    // 對命中的玩家造成傷害
    for (const hit of hitPlayers) {
      const targetPlayer = gameData.players[hit.playerId];
      if (!targetPlayer) continue;
      
      // 計算傷害值
      const damage = card.damage;
      
      // 更新目標玩家血量
      const newHealth = Math.max(0, targetPlayer.health - damage);
      await update(ref(realtimeDb, `games/${gameId}/players/${hit.playerId}/health`), newHealth);
    }
    
    return {
      success: true,
      type: 'attack',
      pattern: attackPattern,
      hits: hitPlayers.map(hit => ({
        playerId: hit.playerId,
        position: hit.position,
        damage: card.damage
      }))
    };
  } catch (error) {
    console.error('執行攻擊卡牌錯誤:', error);
    return { success: false, reason: 'error', message: error.message };
  }
};

/**
 * 計算攻擊範圍
 * @param {Object} position - 攻擊者位置
 * @param {boolean} isHost - 是否是主機玩家（影響方向）
 * @param {Array} pattern - 攻擊模式 3x3 矩陣
 * @returns {Array} - 受影響的格子位置數組
 */
const calculateAttackPattern = (position, isHost, pattern) => {
  const { row, col } = position;
  const result = [];
  
  // 遍歷 3x3 模式
  for (let i = 0; i < pattern.length; i++) {
    for (let j = 0; j < pattern[i].length; j++) {
      if (pattern[i][j]) {
        // 將相對位置轉換為絕對位置
        // 考慮玩家朝向和中心點
        let targetRow, targetCol;
        
        if (isHost) {
          // 主機玩家面向右側
          targetRow = row + (i - 1);
          targetCol = col + (j - 1);
        } else {
          // 訪客玩家面向左側
          targetRow = row + (i - 1);
          targetCol = col - (j - 1);
        }
        
        result.push({ row: targetRow, col: targetCol });
      }
    }
  }
  
  return result;
};

/**
 * 檢測遊戲是否存在
 * @param {string} gameId - 遊戲ID
 * @returns {boolean} - 遊戲是否存在
 */
export const checkGameExists = async (gameId) => {
  try {
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    return gameSnapshot.exists();
  } catch (error) {
    console.error('檢查遊戲錯誤:', error);
    return false;
  }
};

/**
 * 離開遊戲
 * @param {string} gameId - 遊戲ID
 * @param {string} playerId - 玩家ID
 */
export const leaveGame = async (gameId, playerId) => {
  try {
    // 檢查遊戲是否存在
    const gameSnapshot = await get(ref(realtimeDb, `games/${gameId}`));
    if (!gameSnapshot.exists()) return;
    
    const gameData = gameSnapshot.val();
    
    // 移除玩家狀態
    await update(ref(realtimeDb, `games/${gameId}/players/${playerId}`), {
      online: false
    });
    
    // 如果遊戲正在等待中，直接移除玩家
    if (gameData.status === 'waiting') {
      await remove(ref(realtimeDb, `games/${gameId}/players/${playerId}`));
    }
    
    // 如果所有玩家都離線，清理遊戲
    const playersSnapshot = await get(ref(realtimeDb, `games/${gameId}/players`));
    const players = playersSnapshot.val();
    
    if (!players || Object.values(players).every(p => !p.online)) {
      // 所有玩家都離線，標記遊戲為已結束
      await update(ref(realtimeDb, `games/${gameId}`), {
        status: 'finished',
        lastUpdate: Date.now()
      });
      
      // 更新 Firestore 記錄
      const gameDocRef = doc(db, 'games', gameId);
      await updateDoc(gameDocRef, {
        status: 'finished',
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('離開遊戲錯誤:', error);
  }
};

/**
 * 初始化遊戲棋盤
 * @returns {Array} - 5x5 棋盤格子
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
        playerId: null
      };
    }
  }
  
  return board;
};

/**
 * 獲取玩家起始位置
 * @param {string} role - 'host' 或 'guest'
 * @returns {Object} - {row, col} 位置
 */
const getStartPosition = (role) => {
  if (role === 'host') {
    return { row: 2, col: 0 }; // 左側中間
  } else {
    return { row: 2, col: 4 }; // 右側中間
  }
};
