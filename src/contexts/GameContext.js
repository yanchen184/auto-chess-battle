import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { signInAnonymously } from 'firebase/auth';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [currentGame, setCurrentGame] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 處理匿名身份驗證
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        // 嘗試從本地存儲獲取用戶數據
        const storedUser = localStorage.getItem('gameUser');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentPlayer(parsedUser);
        } else {
          // 如果沒有本地存儲的用戶，創建一個匿名用戶
          const userCredential = await signInAnonymously(auth);
          const newUser = {
            id: userCredential.user.uid,
            isAnonymous: true
          };
          setCurrentPlayer(newUser);
          localStorage.setItem('gameUser', JSON.stringify(newUser));
        }
      } catch (error) {
        console.error('身份驗證錯誤:', error);
        setError('身份驗證失敗。請刷新頁面重試。');
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    // 監聽身份驗證狀態變更
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && currentPlayer) {
        // 用戶登出
        setCurrentPlayer(null);
        localStorage.removeItem('gameUser');
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // 處理玩家設置
  const updatePlayerName = (name) => {
    if (!currentPlayer) return;
    
    const updatedPlayer = {
      ...currentPlayer,
      name
    };
    
    setCurrentPlayer(updatedPlayer);
    localStorage.setItem('gameUser', JSON.stringify(updatedPlayer));
  };
  
  // 處理角色選擇
  const selectCharacter = (character) => {
    setSelectedCharacter(character);
    
    // 如果玩家對象存在，則更新玩家的角色
    if (currentPlayer) {
      const updatedPlayer = {
        ...currentPlayer,
        character
      };
      
      setCurrentPlayer(updatedPlayer);
      localStorage.setItem('gameUser', JSON.stringify(updatedPlayer));
    }
  };
  
  // 重置遊戲狀態
  const resetGame = () => {
    setCurrentGame(null);
    setSelectedCharacter(null);
  };
  
  // 提供上下文值
  const value = {
    currentGame,
    setCurrentGame,
    currentPlayer,
    setCurrentPlayer,
    selectedCharacter,
    setSelectedCharacter,
    loading,
    error,
    updatePlayerName,
    selectCharacter,
    resetGame
  };
  
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
