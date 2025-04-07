import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';
import { subscribeToGame, selectCards } from '../firebase/gameService';
import { drawRandomCards } from '../models/card';
import GameBoard from '../components/GameBoard';
import CardSelection from '../components/CardSelection';
import PlayerStatus from '../components/PlayerStatus';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding: 10px;
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 20px;
`;

const GameContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  flex: 1;
`;

const StatusMessage = styled.div`
  color: #61dafb;
  font-size: 1.2rem;
  margin: 20px 0;
  text-align: center;
`;

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { currentPlayer, selectedCharacter, currentGame, setCurrentGame } = useGame();
  
  const [gameState, setGameState] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [opponentState, setOpponentState] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [turnPhase, setTurnPhase] = useState('waiting'); // waiting, selection, execution
  
  // Check if player info exists
  useEffect(() => {
    if (!currentPlayer || !selectedCharacter) {
      navigate('/');
    }
  }, [currentPlayer, selectedCharacter, navigate]);
  
  // Subscribe to game updates
  useEffect(() => {
    if (!gameId || !currentPlayer) return;
    
    // Set current game
    setCurrentGame({ id: gameId });
    
    // Subscribe to real-time game updates
    const unsubscribe = subscribeToGame(gameId, (gameData) => {
      if (!gameData) {
        // Game not found
        navigate('/');
        return;
      }
      
      setGameState(gameData);
      
      // Update player and opponent states
      if (gameData.players) {
        const players = Object.values(gameData.players);
        const currentPlayerState = players.find(p => p.id === currentPlayer.id);
        const opponentPlayerState = players.find(p => p.id !== currentPlayer.id);
        
        setPlayerState(currentPlayerState);
        setOpponentState(opponentPlayerState);
        
        // Update turn phase based on game status
        if (gameData.status === 'waiting') {
          setTurnPhase('waiting');
        } else if (gameData.status === 'ready' && !currentPlayerState.ready) {
          setTurnPhase('selection');
          // Draw new cards if needed
          if (availableCards.length === 0) {
            const drawnCards = drawRandomCards(currentPlayerState.character.cardPool, 10);
            setAvailableCards(drawnCards);
          }
        } else if (gameData.status === 'executing') {
          setTurnPhase('execution');
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [gameId, currentPlayer, setCurrentGame, navigate]);
  
  // Handle card selection
  const handleCardSelect = (card) => {
    if (selectedCards.length < 3 && !selectedCards.some(c => c.id === card.id)) {
      setSelectedCards([...selectedCards, card]);
    }
  };
  
  // Handle card deselection
  const handleCardDeselect = (cardIndex) => {
    setSelectedCards(selectedCards.filter((_, index) => index !== cardIndex));
  };
  
  // Handle confirming card selection
  const handleConfirmSelection = async () => {
    if (selectedCards.length !== 3) return;
    
    try {
      await selectCards(gameId, currentPlayer.id, selectedCards.map(card => card.id));
      // Clear selected cards (they'll be shown in the game board)
      setSelectedCards([]);
      // Clear available cards (new ones will be drawn next round)
      setAvailableCards([]);
    } catch (error) {
      console.error('Error confirming card selection:', error);
    }
  };
  
  // Render loading state
  if (!gameState || !playerState) {
    return (
      <GameContainer>
        <StatusMessage>載入遊戲中...</StatusMessage>
      </GameContainer>
    );
  }
  
  // Render waiting for opponent state
  if (gameState.status === 'waiting') {
    return (
      <GameContainer>
        <StatusMessage>
          等待對手加入...<br />
          遊戲ID: {gameId}<br />
          (將此ID分享給你的對手)
        </StatusMessage>
      </GameContainer>
    );
  }
  
  return (
    <GameContainer>
      <GameHeader>
        {playerState && <PlayerStatus player={playerState} isCurrentPlayer={true} />}
        {opponentState && <PlayerStatus player={opponentState} isCurrentPlayer={false} />}
      </GameHeader>
      
      <GameContent>
        {/* Game Board */}
        <GameBoard 
          gameState={gameState} 
          playerState={playerState}
          opponentState={opponentState}
          currentPlayerId={currentPlayer.id}
        />
        
        {/* Card Selection UI */}
        {turnPhase === 'selection' && (
          <CardSelection 
            availableCards={availableCards}
            selectedCards={selectedCards}
            onCardSelect={handleCardSelect}
            onCardDeselect={handleCardDeselect}
            onConfirm={handleConfirmSelection}
            playerMana={playerState.mana}
          />
        )}
        
        {/* Turn Phase Status */}
        {turnPhase === 'execution' && (
          <StatusMessage>回合執行中...</StatusMessage>
        )}
        
        {turnPhase === 'waiting' && opponentState && (
          <StatusMessage>等待對手準備...</StatusMessage>
        )}
      </GameContent>
    </GameContainer>
  );
};

export default Game;