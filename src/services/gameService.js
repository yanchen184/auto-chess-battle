import { 
  doc, 
  collection, 
  addDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { ref, set, onValue, update, get } from 'firebase/database';
import { db, realtimeDb } from '../firebase/config';
import { getCardById } from '../models/cards';
import { getCharacterById } from '../models/characters';

/**
 * 遊戲服務模組 - 處理遊戲狀態相關的Firebase操作
 */

// Firestore集合名稱
const GAMES_COLLECTION = 'games';
const GAME_MOVES_COLLECTION = 'game_moves';
const GAME_HISTORY_COLLECTION = 'game_history';

// 創建新遊戲
export const createGame = async (gameData) => {
  try {
    // 基本遊戲資料
    const gameRef = await addDoc(collection(db, GAMES_COLLECTION), {
      creatorId: gameData.creatorId,
      creatorName: gameData.creatorName,
      creatorCharacter: gameData.creatorCharacter,
      status: 'waiting', // 等待對手加入
      winner: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 獲取創建的遊戲資料
    const gameSnapshot = await getDoc(gameRef);
    const game = {
      id: gameRef.id,
      ...gameSnapshot.data()
    };
    
    // 創建實時遊戲狀態
    const rtGameRef = ref(realtimeDb, `games/${gameRef.id}`);
    const characterData = getCharacterById(gameData.creatorCharacter);
    
    await set(rtGameRef, {
      id: gameRef.id,
      status: 'waiting',
      players: {
        [gameData.creatorId]: {
          id: gameData.creatorId,
          name: gameData.creatorName,
          character: gameData.creatorCharacter,
          characterData: characterData,
          position: { x: 0, y: 2 }, // 左側中間位置
          health: characterData.health,
          mana: characterData.mana,
          selectedCards: [],
          isReady: false
        }
      },
      currentRound: 0,
      roundStartTime: null,
      boardState: initBoardState(),
      moveHistory: [],
      lastUpdate: Date.now()
    });
    
    return game;
  } catch (error) {
    console.error('創建遊戲錯誤:', error);
    throw error;
  }
};

// 加入現有遊戲
export const joinGame = async (gameId, playerData) => {
  try {
    // 檢查遊戲是否存在
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const gameSnapshot = await getDoc(gameRef);
    
    if (!gameSnapshot.exists()) {
      throw new Error('遊戲不存在');
    }
    
    const gameData = gameSnapshot.data();
    
    // 檢查遊戲狀態
    if (gameData.status !== 'waiting') {
      throw new Error('遊戲已開始或已結束');
    }
    
    // 檢查是否已經加入過遊戲
    if (gameData.creatorId === playerData.playerId) {
      throw new Error('你已經加入了這個遊戲');
    }
    
    // 更新Firestore中的遊戲資料
    await updateDoc(gameRef, {
      opponentId: playerData.playerId,
      opponentName: playerData.playerName,
      opponentCharacter: playerData.playerCharacter,
      status: 'ready', // 遊戲準備開始
      updatedAt: serverTimestamp()
    });
    
    // 更新實時資料庫中的遊戲狀態
    const rtGameRef = ref(realtimeDb, `games/${gameId}`);
    const characterData = getCharacterById(playerData.playerCharacter);
    
    // 添加第二個玩家並更新遊戲狀態
    await update(rtGameRef, {
      status: 'ready',
      [`players.${playerData.playerId}`]: {
        id: playerData.playerId,
        name: playerData.playerName,
        character: playerData.playerCharacter,
        characterData: characterData,
        position: { x: 4, y: 2 }, // 右側中間位置
        health: characterData.health,
        mana: characterData.mana,
        selectedCards: [],
        isReady: false
      },
      lastUpdate: Date.now()
    });
    
    // 獲取更新後的遊戲資料
    const updatedGameSnapshot = await getDoc(gameRef);
    return {
      id: gameId,
      ...updatedGameSnapshot.data()
    };
  } catch (error) {
    console.error('加入遊戲錯誤:', error);
    throw error;
  }
};

// 獲取遊戲資料
export const getGame = async (gameId) => {
  try {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const gameSnapshot = await getDoc(gameRef);
    
    if (!gameSnapshot.exists()) {
      throw new Error('遊戲不存在');
    }
    
    return {
      id: gameId,
      ...gameSnapshot.data()
    };
  } catch (error) {
    console.error('獲取遊戲錯誤:', error);
    throw error;
  }
};

// 監聽遊戲狀態變化
export const subscribeToGame = (gameId, callback) => {
  const rtGameRef = ref(realtimeDb, `games/${gameId}`);
  return onValue(rtGameRef, (snapshot) => {
    const gameData = snapshot.val();
    if (gameData) {
      callback(gameData);
    }
  });
};

// 監聽Firestore遊戲文檔變化
export const subscribeToGameDoc = (gameId, callback) => {
  const gameRef = doc(db, GAMES_COLLECTION, gameId);
  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    }
  });
};

// 選擇卡牌
export const selectCards = async (gameId, playerId, cardIds) => {
  try {
    // 檢查參數
    if (!gameId || !playerId || !Array.isArray(cardIds)) {
      throw new Error('參數錯誤');
    }
    
    const rtGameRef = ref(realtimeDb, `games/${gameId}`);
    
    // 更新玩家選擇的卡牌和準備狀態
    await update(rtGameRef, {
      [`players.${playerId}.selectedCards`]: cardIds,
      [`players.${playerId}.isReady`]: true,
      lastUpdate: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('選擇卡牌錯誤:', error);
    throw error;
  }
};

// 執行回合
export const executeRound = async (gameId) => {
  try {
    const rtGameRef = ref(realtimeDb, `games/${gameId}`);
    
    // 獲取當前遊戲狀態
    const snapshot = await get(rtGameRef);
    if (!snapshot.exists()) {
      throw new Error('遊戲不存在');
    }
    
    const gameData = snapshot.val();
    const playerIds = Object.keys(gameData.players);
    
    if (playerIds.length !== 2) {
      throw new Error('需要兩名玩家');
    }
    
    // 更新遊戲狀態為執行中
    await update(rtGameRef, {
      status: 'executing',
      lastUpdate: Date.now()
    });
    
    // 處理所有移動卡牌
    const moves = [];
    const newBoardState = JSON.parse(JSON.stringify(gameData.boardState));
    
    // 重置棋盤上的玩家位置
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        newBoardState[y][x].playerId = null;
        newBoardState[y][x].entityType = null;
      }
    }
    
    // 第一步：執行所有玩家的移動
    for (const playerId of playerIds) {
      const player = gameData.players[playerId];
      const selectedCardIds = player.selectedCards || [];
      
      // 處理移動卡牌
      for (const cardId of selectedCardIds) {
        const card = getCardById(cardId);
        if (card && card.type === 'movement') {
          // 根據卡牌計算新位置
          const newPosition = calculateNewPosition(player.position, card, playerId === playerIds[0] ? 1 : 2);
          
          // 如果移動有效
          if (newPosition && isValidMove(newBoardState, player.position, card, playerId === playerIds[0] ? 1 : 2)) {
            // 記錄移動
            moves.push({
              type: 'move',
              playerId,
              cardId,
              from: player.position,
              to: newPosition,
              timestamp: Date.now()
            });
            
            // 更新玩家位置
            player.position = newPosition;
            
            // 更新魔力值
            player.mana = Math.max(0, player.mana - card.manaCost);
          }
        }
      }
      
      // 將玩家標記在棋盤上
      const { x, y } = player.position;
      newBoardState[y][x].playerId = playerId;
      newBoardState[y][x].entityType = 'player';
    }
    
    // 第二步：執行所有玩家的攻擊
    const attacks = [];
    
    for (const playerId of playerIds) {
      const player = gameData.players[playerId];
      const selectedCardIds = player.selectedCards || [];
      
      // 處理攻擊卡牌
      for (const cardId of selectedCardIds) {
        const card = getCardById(cardId);
        if (card && card.type === 'attack') {
          // 計算攻擊範圍和效果
          const affectedPositions = calculateAttackEffect(
            newBoardState, 
            player.position, 
            card, 
            playerId === playerIds[0] ? 1 : 2
          );
          
          // 如果攻擊有效
          if (affectedPositions.length > 0) {
            // 記錄攻擊
            attacks.push({
              type: 'attack',
              playerId,
              cardId,
              position: player.position,
              affectedPositions,
              timestamp: Date.now()
            });
            
            // 更新魔力值
            player.mana = Math.max(0, player.mana - card.manaCost);
            
            // 應用傷害
            for (const pos of affectedPositions) {
              const targetCell = newBoardState[pos.y][pos.x];
              if (targetCell.playerId && targetCell.playerId !== playerId) {
                // 受影響的玩家受到傷害
                const targetPlayer = gameData.players[targetCell.playerId];
                targetPlayer.health = Math.max(0, targetPlayer.health - card.damage);
              }
            }
          }
        }
      }
    }
    
    // 合併所有行動並按時間排序
    const allActions = [...moves, ...attacks].sort((a, b) => a.timestamp - b.timestamp);
    
    // 更新移動歷史
    const moveHistory = [...(gameData.moveHistory || []), {
      round: gameData.currentRound + 1,
      actions: allActions
    }];
    
    // 檢查遊戲是否結束
    const gameOverStatus = checkGameOver(gameData.players);
    
    // 更新遊戲狀態
    const updateData = {
      status: gameOverStatus.isOver ? 'finished' : 'ready',
      boardState: newBoardState,
      moveHistory,
      currentRound: gameData.currentRound + 1,
      lastUpdate: Date.now(),
      players: {}
    };
    
    // 重置所有玩家的準備狀態和選擇的卡牌
    for (const playerId of playerIds) {
      updateData.players[playerId] = {
        ...gameData.players[playerId],
        position: gameData.players[playerId].position, // 更新位置
        health: gameData.players[playerId].health, // 更新生命值
        mana: gameData.players[playerId].mana, // 更新魔力值
        selectedCards: [], // 清空選擇的卡牌
        isReady: false // 重置準備狀態
      };
    }
    
    // 如果遊戲結束，記錄勝利者
    if (gameOverStatus.isOver) {
      updateData.winner = gameOverStatus.winner;
      
      // 更新Firestore文檔
      const gameRef = doc(db, GAMES_COLLECTION, gameId);
      await updateDoc(gameRef, {
        status: 'finished',
        winner: gameOverStatus.winner,
        updatedAt: serverTimestamp()
      });
      
      // 記錄遊戲歷史
      await addDoc(collection(db, GAME_HISTORY_COLLECTION), {
        gameId,
        winner: gameOverStatus.winner,
        players: playerIds,
        totalRounds: gameData.currentRound + 1,
        endedAt: serverTimestamp()
      });
    }
    
    // 更新實時數據庫
    await update(rtGameRef, updateData);
    
    // 記錄回合移動
    await addDoc(collection(db, GAME_MOVES_COLLECTION), {
      gameId,
      roundNumber: gameData.currentRound + 1,
      moves: allActions,
      createdAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      actions: allActions, 
      isGameOver: gameOverStatus.isOver, 
      winner: gameOverStatus.winner 
    };
  } catch (error) {
    console.error('執行回合錯誤:', error);
    throw error;
  }
};

// 初始化棋盤狀態
const initBoardState = () => {
  const board = [];
  
  // 創建5x5的空棋盤
  for (let y = 0; y < 5; y++) {
    board[y] = [];
    for (let x = 0; x < 5; x++) {
      board[y][x] = {
        playerId: null,
        entityType: null
      };
    }
  }
  
  return board;
};

// 計算新位置
const calculateNewPosition = (currentPosition, card, playerNumber) => {
  if (!card || card.type !== 'movement') {
    return null;
  }
  
  const { x, y } = currentPosition;
  let newX = x;
  let newY = y;
  
  // 根據卡牌方向和玩家編號計算新位置
  // 玩家1從左側開始，方向是正常的
  // 玩家2從右側開始，方向是相反的
  switch (card.direction) {
    case 'forward':
      newY = playerNumber === 1 ? y + card.range : y - card.range;
      break;
    case 'backward':
      newY = playerNumber === 1 ? y - card.range : y + card.range;
      break;
    case 'left':
      newX = playerNumber === 1 ? x - card.range : x + card.range;
      break;
    case 'right':
      newX = playerNumber === 1 ? x + card.range : x - card.range;
      break;
    default:
      return null;
  }
  
  // 檢查邊界
  if (newX < 0 || newX >= 5 || newY < 0 || newY >= 5) {
    return null;
  }
  
  return { x: newX, y: newY };
};

// 獲取玩家抽牌
export const drawCardsForPlayer = (playerCharacterId, count = 10) => {
  try {
    // 獲取角色資料
    const character = getCharacterById(playerCharacterId);
    
    if (!character) {
      throw new Error('找不到角色資料');
    }
    
    // 隨機排序卡牌池
    const shuffledCardPool = [...character.cardPool].sort(() => 0.5 - Math.random());
    
    // 選擇指定數量的卡牌
    const selectedCardIds = shuffledCardPool.slice(0, Math.min(count, character.cardPool.length));
    
    // 轉換為卡牌對象
    const cards = selectedCardIds.map(cardId => getCardById(cardId)).filter(Boolean);
    
    return cards;
  } catch (error) {
    console.error('抽取卡牌錯誤:', error);
    throw error;
  }
};

// 判斷移動是否有效
export const isValidMove = (boardState, playerPosition, card, playerNumber) => {
  // 如果卡牌不是移動類型，則移動無效
  if (!card || card.type !== 'movement') {
    return false;
  }
  
  // 計算新位置
  const newPosition = calculateNewPosition(playerPosition, card, playerNumber);
  
  // 如果新位置超出邊界，則移動無效
  if (!newPosition) {
    return false;
  }
  
  // 檢查目標位置是否已被佔用
  if (boardState[newPosition.y][newPosition.x].playerId !== null) {
    return false;
  }
  
  return true;
};

// 計算攻擊範圍和效果
export const calculateAttackEffect = (boardState, playerPosition, card, playerNumber) => {
  if (!card || card.type !== 'attack' || !card.pattern) {
    return [];
  }
  
  const { x, y } = playerPosition;
  const affectedPositions = [];
  
  // 計算攻擊範圍內的所有位置
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      // 檢查攻擊模式中的這個位置是否有效
      // 根據玩家編號調整方向
      const patternY = playerNumber === 1 ? dy + 1 : 1 - dy;
      const patternX = playerNumber === 1 ? dx + 1 : 1 - dx;
      
      if (card.pattern[patternY] && card.pattern[patternY][patternX] === 1) {
        const targetX = x + dx;
        const targetY = y + dy;
        
        // 確保位置在棋盤範圍內
        if (targetX >= 0 && targetX < 5 && targetY >= 0 && targetY < 5) {
          // 檢查目標位置是否有實體
          const target = boardState[targetY][targetX];
          
          // 添加到受影響位置 (無論是否有敵人，都顯示攻擊範圍)
          affectedPositions.push({
            x: targetX,
            y: targetY,
            damage: card.damage,
            hit: target.playerId !== null && target.playerId !== playerPosition.id
          });
        }
      }
    }
  }
  
  return affectedPositions;
};

// 檢查遊戲是否結束
export const checkGameOver = (players) => {
  if (!players) return { isOver: false, winner: null };
  
  const playerIds = Object.keys(players);
  
  if (playerIds.length !== 2) return { isOver: false, winner: null };
  
  // 檢查玩家健康值
  for (const playerId of playerIds) {
    if (players[playerId].health <= 0) {
      // 返回勝利者ID
      const winnerId = playerIds.find(id => id !== playerId);
      return {
        isOver: true,
        winner: winnerId
      };
    }
  }
  
  return { isOver: false, winner: null };
};

// 獲取玩家最近的遊戲
export const getPlayerGames = async (playerId, status = 'all', limitCount = 10) => {
  try {
    // 構建查詢對象
    if (status === 'all') {
      // 查詢所有狀態的遊戲
      query(
        collection(db, GAMES_COLLECTION),
        where('players', 'array-contains', playerId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
    } else {
      // 查詢特定狀態的遊戲
      query(
        collection(db, GAMES_COLLECTION),
        where('players', 'array-contains', playerId),
        where('status', '==', status),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
    }
    
    // 這邊需要通過Cloud Functions實現，因為需要複雜查詢
    // 這是一個模擬返回
    return [];
  } catch (error) {
    console.error('獲取玩家遊戲錯誤:', error);
    throw error;
  }
};

// 獲取遊戲歷史
export const getGameHistory = async (gameId) => {
  try {
    // 構建查詢對象
    query(
      collection(db, GAME_MOVES_COLLECTION),
      where('gameId', '==', gameId),
      orderBy('roundNumber', 'asc')
    );
    
    // 這需要通過Cloud Functions實現，但這裡提供介面
    return [];
  } catch (error) {
    console.error('獲取遊戲歷史錯誤:', error);
    throw error;
  }
};