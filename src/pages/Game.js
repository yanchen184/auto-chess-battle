import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';
import GameBoard from '../components/game/GameBoard';
import PlayerStatus from '../components/game/PlayerStatus';
import CardSelection from '../components/game/CardSelection';
import { AttackPatternLarge } from '../components/game/AttackPatternDisplay';
import { 
  getGame, 
  subscribeToGame, 
  subscribeToGameDoc, 
  drawCardsForPlayer,
  selectCards,
  executeRound,
  isValidMove,
  calculateAttackEffect,
  checkGameOver
} from '../services/gameService';

// Styled Components
const GameContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: white;
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
`;

const GameId = styled.div`
  background-color: #2a2a2a;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CopyButton = styled.button`
  background-color: #4dabf7;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background-color: #3b8de0;
  }
`;

const GameLayout = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  gap: 20px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
`;

const PlayerColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const CentralColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const GameStatus = styled.div`
  background-color: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
`;

const RoundCounter = styled.div`
  font-size: 1.2rem;
  margin-bottom: 10px;
`;

const StatusMessage = styled.div`
  font-size: 1rem;
  color: ${({ color }) => color || 'white'};
`;

const Timer = styled.div`
  font-size: 1.5rem;
  margin-top: 10px;
  font-weight: bold;
`;

const ActionButton = styled.button`
  background-color: ${({ disabled, color }) => disabled ? '#868e96' : color || '#4dabf7'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: bold;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  margin-top: 15px;
  width: 100%;
  
  &:hover {
    background-color: ${({ disabled, color }) => 
      disabled ? '#868e96' : color ? `${color}dd` : '#3b8de0'};
  }
`;

const GameOverModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background-color: #2a2a2a;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
  max-width: 500px;
  width: 90%;
`;

const WinnerTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 20px;
  color: ${({ color }) => color || '#4dabf7'};
`;

const WinnerAvatar = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
`;

/**
 * 遊戲頁面組件
 */
const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { currentPlayer, currentGame, setCurrentGame } = useGame();
  
  // 遊戲狀態
  const [gameState, setGameState] = useState(null);
  const [gameDoc, setGameDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 卡牌選擇
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  
  // 遊戲邏輯
  const [round, setRound] = useState(0);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [effectCells, setEffectCells] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  
  // 計時器
  const [timer, setTimer] = useState(null);
  
  // 初始化遊戲
  useEffect(() => {
    if (!gameId || !currentPlayer) {
      return;
    }
    
    const initGame = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 獲取遊戲數據
        const gameData = await getGame(gameId);
        setCurrentGame(gameData);
        
        // 監聽遊戲狀態
        const unsubscribeState = subscribeToGame(gameId, (data) => {
          setGameState(data);
          
          // 設置回合
          if (data.currentRound !== round) {
            setRound(data.currentRound);
          }
          
          // 檢查遊戲是否結束
          const gameOverStatus = checkGameOver(data.players);
          if (gameOverStatus.isOver) {
            setGameOver(true);
          }
        });
        
        // 監聽遊戲文檔
        const unsubscribeDoc = subscribeToGameDoc(gameId, (doc) => {
          setGameDoc(doc);
        });
        
        // 抽取可用卡牌
        if (gameData.creatorId === currentPlayer.id) {
          const cards = drawCardsForPlayer(gameData.creatorCharacter, 10);
          setAvailableCards(cards);
        } else if (gameData.opponentId === currentPlayer.id) {
          const cards = drawCardsForPlayer(gameData.opponentCharacter, 10);
          setAvailableCards(cards);
        }
        
        setLoading(false);
        
        return () => {
          unsubscribeState();
          unsubscribeDoc();
        };
      } catch (error) {
        console.error('初始化遊戲錯誤:', error);
        setError('載入遊戲失敗，請重試');
        setLoading(false);
      }
    };
    
    initGame();
  }, [gameId, currentPlayer, setCurrentGame]);
  
  // 當選擇卡牌時
  const handleSelectCard = (card) => {
    // 如果卡牌已選擇，則移除
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
      return;
    }
    
    // 如果已經選擇了3張卡，則不能再選
    if (selectedCards.length >= 3) {
      return;
    }
    
    // 添加卡牌到已選擇列表
    setSelectedCards([...selectedCards, card]);
  };
  
  // 確認卡牌選擇
  const handleConfirmSelection = async () => {
    if (!gameState || !currentPlayer || selectedCards.length === 0) {
      return;
    }
    
    try {
      // 將選擇的卡牌ID提交到服務器
      const cardIds = selectedCards.map(card => card.id);
      
      await selectCards(gameId, currentPlayer.id, cardIds);
    } catch (error) {
      console.error('確認卡牌選擇錯誤:', error);
      setError('提交卡牌選擇失敗，請重試');
    }
  };
  
  // 執行回合
  const handleExecuteRound = async () => {
    if (!gameState) {
      return;
    }
    
    try {
      await executeRound(gameId);
    } catch (error) {
      console.error('執行回合錯誤:', error);
      setError('執行回合失敗，請重試');
    }
  };
  
  // 複製遊戲ID
  const handleCopyGameId = () => {
    navigator.clipboard.writeText(gameId)
      .then(() => {
        alert('遊戲ID已複製到剪貼板');
      })
      .catch(err => {
        console.error('複製失敗:', err);
      });
  };
  
  // 返回首頁
  const handleBackToHome = () => {
    navigate('/');
  };
  
  // 重新開始遊戲
  const handlePlayAgain = () => {
    navigate('/character-select');
  };
  
  // 獲取當前玩家資訊
  const getCurrentPlayerInfo = () => {
    if (!gameState || !currentPlayer) {
      return null;
    }
    
    return gameState.players[currentPlayer.id];
  };
  
  // 獲取對手玩家資訊
  const getOpponentPlayerInfo = () => {
    if (!gameState || !currentPlayer) {
      return null;
    }
    
    // 找出非當前玩家的玩家
    const opponentId = Object.keys(gameState.players).find(id => id !== currentPlayer.id);
    
    if (!opponentId) {
      return null;
    }
    
    return gameState.players[opponentId];
  };
  
  // 獲取遊戲狀態信息
  const getGameStatusInfo = () => {
    if (!gameState) {
      return { message: '載入中...', color: 'white' };
    }
    
    const currentPlayerInfo = getCurrentPlayerInfo();
    
    switch (gameState.status) {
      case 'waiting':
        return { message: '等待對手加入...', color: '#aaaaaa' };
        
      case 'ready':
        if (currentPlayerInfo && !currentPlayerInfo.isReady) {
          return { message: '請選擇卡牌並確認', color: '#4dabf7' };
        } else {
          return { message: '等待對手選擇卡牌...', color: '#aaaaaa' };
        }
        
      case 'executing':
        return { message: '回合執行中...', color: '#f59f00' };
        
      case 'finished':
        const gameOverStatus = checkGameOver(gameState.players);
        if (gameOverStatus.isOver) {
          const winner = gameState.players[gameOverStatus.winner];
          if (gameOverStatus.winner === currentPlayer.id) {
            return { message: '恭喜你贏得了遊戲！', color: '#37b24d' };
          } else {
            return { message: `${winner.name} 贏得了遊戲！`, color: '#f03e3e' };
          }
        }
        return { message: '遊戲結束', color: '#aaaaaa' };
        
      default:
        return { message: '未知狀態', color: '#aaaaaa' };
    }
  };
  
  // 檢查是否所有玩家都已準備好
  const areAllPlayersReady = () => {
    if (!gameState || !gameState.players) {
      return false;
    }
    
    return Object.values(gameState.players).every(player => player.isReady);
  };
  
  // 渲染遊戲完結模態框
  const renderGameOverModal = () => {
    if (!gameOver || !gameState) {
      return null;
    }
    
    const gameOverStatus = checkGameOver(gameState.players);
    if (!gameOverStatus.isOver) {
      return null;
    }
    
    const winner = gameState.players[gameOverStatus.winner];
    const isCurrentPlayerWinner = gameOverStatus.winner === currentPlayer?.id;
    
    return (
      <GameOverModal>
        <ModalContent>
          <WinnerTitle color={winner.characterData?.color}>
            {isCurrentPlayerWinner ? '勝利！' : '失敗！'}
          </WinnerTitle>
          
          <WinnerAvatar>{winner.characterData?.avatar}</WinnerAvatar>
          
          <div style={{ marginBottom: '20px' }}>
            {isCurrentPlayerWinner ? 
              '恭喜你贏得了遊戲！' : 
              `${winner.name} 贏得了遊戲！`
            }
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <ActionButton 
              onClick={handlePlayAgain}
              color="#4dabf7"
            >
              再玩一次
            </ActionButton>
            
            <ActionButton 
              onClick={handleBackToHome}
              color="#868e96"
            >
              返回首頁
            </ActionButton>
          </div>
        </ModalContent>
      </GameOverModal>
    );
  };
  
  // 如果正在載入，顯示載入中
  if (loading) {
    return (
      <GameContainer>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          載入中...
        </div>
      </GameContainer>
    );
  }
  
  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return (
      <GameContainer>
        <div style={{ textAlign: 'center', padding: '50px', color: '#f03e3e' }}>
          {error}
          <div style={{ marginTop: '20px' }}>
            <ActionButton onClick={handleBackToHome}>
              返回首頁
            </ActionButton>
          </div>
        </div>
      </GameContainer>
    );
  }
  
  // 獲取遊戲狀態信息
  const statusInfo = getGameStatusInfo();
  const currentPlayerInfo = getCurrentPlayerInfo();
  const opponentPlayerInfo = getOpponentPlayerInfo();
  
  return (
    <GameContainer>
      <GameHeader>
        <Title>自走棋對戰</Title>
        <GameId>
          遊戲ID: {gameId}
          <CopyButton onClick={handleCopyGameId}>複製</CopyButton>
        </GameId>
      </GameHeader>
      
      <GameLayout>
        {/* 左側: 當前玩家狀態 */}
        <PlayerColumn>
          {currentPlayerInfo && (
            <PlayerStatus 
              player={currentPlayerInfo}
              isCurrentPlayer={true}
            />
          )}
          
          {selectedCard && selectedCard.type === 'attack' && (
            <AttackPatternLarge
              pattern={selectedCard.pattern}
              title={selectedCard.name}
              description={selectedCard.description}
              damage={selectedCard.damage}
              color={selectedCard.color}
            />
          )}
        </PlayerColumn>
        
        {/* 中間: 遊戲棋盤和狀態 */}
        <CentralColumn>
          <GameStatus>
            <RoundCounter>回合 {round}</RoundCounter>
            <StatusMessage color={statusInfo.color}>
              {statusInfo.message}
            </StatusMessage>
            {timer && <Timer>{timer}</Timer>}
          </GameStatus>
          
          {gameState && (
            <GameBoard
              boardState={gameState.boardState}
              player1={currentPlayerInfo}
              player2={opponentPlayerInfo}
              highlightedCells={highlightedCells}
              effectCells={effectCells}
              onCellClick={(x, y) => {
                // 處理移動或攻擊
              }}
              interactive={false}
            />
          )}
          
          {/* 回合執行按鈕 */}
          {gameState && areAllPlayersReady() && gameState.status === 'ready' && (
            <ActionButton 
              onClick={handleExecuteRound}
              color="#37b24d"
            >
              執行回合
            </ActionButton>
          )}
        </CentralColumn>
        
        {/* 右側: 對手玩家狀態 */}
        <PlayerColumn>
          {opponentPlayerInfo && (
            <PlayerStatus 
              player={opponentPlayerInfo}
              isCurrentPlayer={false}
            />
          )}
        </PlayerColumn>
      </GameLayout>
      
      {/* 卡牌選擇區 */}
      {currentPlayerInfo && gameState && gameState.status === 'ready' && (
        <CardSelection
          availableCards={availableCards}
          selectedCards={selectedCards}
          onSelectCard={handleSelectCard}
          onConfirmSelection={handleConfirmSelection}
          selectionConfirmed={currentPlayerInfo.isReady}
          player={currentPlayerInfo}
          maxSelections={3}
        />
      )}
      
      {/* 遊戲結束模態框 */}
      {renderGameOverModal()}
    </GameContainer>
  );
};

export default Game;
