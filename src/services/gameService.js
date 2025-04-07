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
import { ref, set, onValue, update } from 'firebase/database';
import { db, realtimeDb } from '../firebase/config';
import { getCardById } from '../models/cards';
import { getCharacterById } from '../models/characters';

/**
 * 遊戲服務模組 - 處理遊戲狀態相關的Firebase操作
 */

// Firestore集合名稱
const GAMES_COLLECTION = 'games';
const GAME_MOVES_COLLECTION = 'game_moves';

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
    await set(rtGameRef, {
      id: gameRef.id,
      status: 'waiting',
      players: {
        [gameData.creatorId]: {
          id: gameData.creatorId,
          name: gameData.creatorName,
          character: gameData.creatorCharacter,
          characterData: getCharacterById(gameData.creatorCharacter),
          position: { x: 0, y: 2 }, // 左側中間位置
          health: getCharacterById(gameData.creatorCharacter).health,
          mana: getCharacterById(gameData.creatorCharacter).mana,
          selectedCards: [],
          isReady: false
        }
      },
      currentRound: 0,
      roundStartTime: null,
      boardState: initBoardState(),
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
    
    // 在Firestore中記錄回合移動
    const gameMoveRef = await addDoc(collection(db, GAME_MOVES_COLLECTION), {
      gameId,
      roundNumber: 0, // 會在處理函數中更新
      moves: [], // 會在處理函數中填充
      createdAt: serverTimestamp()
    });
    
    // 觸發雲函數來執行回合邏輯
    // 注意：實際整合時需要實現一個Firebase Cloud Function
    
    // 模擬執行回合邏輯
    await update(rtGameRef, {
      status: 'executing',
      lastUpdate: Date.now()
    });
    
    // 這裡可以添加一些本地的回合處理邏輯
    
    return true;
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
export const isValidMove = (boardState, playerPosition, card, playerId) => {
  // 實作移動驗證邏輯
  // 例如: 檢查是否超出邊界、是否被阻擋等
  
  // 這只是一個基本實現，實際需要根據具體遊戲規則完善
  if (!card || card.type !== 'movement') {
    return false;
  }
  
  const { x, y } = playerPosition;
  let newX = x;
  let newY = y;
  
  // 根據卡牌方向計算新位置
  switch (card.direction) {
    case 'forward':
      newY = playerId === 1 ? y + card.range : y - card.range;
      break;
    case 'backward':
      newY = playerId === 1 ? y - card.range : y + card.range;
      break;
    case 'left':
      newX = playerId === 1 ? x - card.range : x + card.range;
      break;
    case 'right':
      newX = playerId === 1 ? x + card.range : x - card.range;
      break;
    default:
      return false;
  }
  
  // 檢查邊界
  if (newX < 0 || newX >= 5 || newY < 0 || newY >= 5) {
    return false;
  }
  
  // 檢查目標位置是否已被佔用
  if (boardState[newY][newX].playerId !== null) {
    return false;
  }
  
  return true;
};

// 計算攻擊範圍和效果
export const calculateAttackEffect = (boardState, playerPosition, card, playerId) => {
  if (!card || card.type !== 'attack' || !card.pattern) {
    return [];
  }
  
  const { x, y } = playerPosition;
  const affectedPositions = [];
  
  // 計算攻擊範圍內的所有位置
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      // 檢查攻擊模式中的這個位置是否有效
      const patternY = playerId === 1 ? dy + 1 : 1 - dy;
      const patternX = playerId === 1 ? dx + 1 : 1 - dx;
      
      if (card.pattern[patternY] && card.pattern[patternY][patternX] === 1) {
        const targetX = x + dx;
        const targetY = y + dy;
        
        // 確保位置在棋盤範圍內
        if (targetX >= 0 && targetX < 5 && targetY >= 0 && targetY < 5) {
          // 如果位置有敵人，添加到受影響位置
          const target = boardState[targetY][targetX];
          if (target.playerId && target.playerId !== playerId) {
            affectedPositions.push({
              x: targetX,
              y: targetY,
              damage: card.damage
            });
          }
        }
      }
    }
  }
  
  return affectedPositions;
};

// 檢查遊戲是否結束
export const checkGameOver = (players) => {
  if (!players) return null;
  
  const playerIds = Object.keys(players);
  
  if (playerIds.length !== 2) return null;
  
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
    let gamesQuery;
    
    if (status === 'all') {
      gamesQuery = query(
        collection(db, GAMES_COLLECTION),
        where('players', 'array-contains', playerId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
    } else {
      gamesQuery = query(
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