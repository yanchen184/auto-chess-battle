import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import BaseCharacters from '../models/character';
import { useGame } from '../contexts/GameContext';
import { createGame, joinGame } from '../firebase/gameService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const Title = styled.h1`
  color: #61dafb;
  margin-bottom: 30px;
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  max-width: 900px;
  margin-bottom: 30px;
`;

const CharacterCard = styled.div`
  background-color: ${props => props.selected ? '#3a506b' : '#1a1d24'};
  border: 2px solid ${props => props.selected ? '#61dafb' : 'transparent'};
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
`;

const CharacterName = styled.h2`
  color: #61dafb;
  margin-bottom: 10px;
`;

const CharacterDescription = styled.p`
  color: #ffffff;
  margin-bottom: 15px;
`;

const CharacterStats = styled.div`
  display: flex;
  justify-content: space-between;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  color: #aaaaaa;
  font-size: 0.8rem;
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  color: #ffffff;
  font-weight: bold;
`;

const Button = styled.button`
  background-color: #61dafb;
  color: #282c34;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #4fa8d1;
  }
  
  &:disabled {
    background-color: #4a4a4a;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  color: #61dafb;
  font-size: 1.2rem;
  margin-top: 20px;
`;

const CharacterSelect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPlayer, setCurrentPlayer, setSelectedCharacter, setCurrentGame } = useGame();
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check if player info exists
  useEffect(() => {
    if (!currentPlayer) {
      navigate('/');
    }
  }, [currentPlayer, navigate]);
  
  // Handle character selection
  const handleSelectCharacter = (characterId) => {
    setSelectedCharacterId(characterId);
  };
  
  // Handle confirm selection and start/join game
  const handleConfirmSelection = async () => {
    if (!selectedCharacterId) {
      setError('請選擇一個角色');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Find selected character
      const character = BaseCharacters.find(char => char.id === selectedCharacterId);
      
      // Update player with character selection
      const updatedPlayer = {
        ...currentPlayer,
        character
      };
      
      setCurrentPlayer(updatedPlayer);
      setSelectedCharacter(character);
      
      let gameId;
      
      // If player is host, create a new game
      if (currentPlayer.isHost) {
        gameId = await createGame(updatedPlayer);
      } 
      // If player is guest, join existing game
      else {
        const existingGameId = location.state?.gameId;
        if (!existingGameId) {
          throw new Error('遊戲ID不存在');
        }
        
        await joinGame(existingGameId, updatedPlayer);
        gameId = existingGameId;
      }
      
      // Set current game ID and navigate to game page
      setCurrentGame({ id: gameId });
      navigate(`/game/${gameId}`);
      
    } catch (error) {
      console.error('Error in character selection:', error);
      setError(error.message || '發生錯誤，請重試');
      setIsLoading(false);
    }
  };
  
  return (
    <Container>
      <Title>選擇你的角色</Title>
      
      <CharacterGrid>
        {BaseCharacters.map(character => (
          <CharacterCard 
            key={character.id}
            selected={selectedCharacterId === character.id}
            onClick={() => handleSelectCharacter(character.id)}
          >
            <CharacterName>{character.name}</CharacterName>
            <CharacterDescription>{character.description}</CharacterDescription>
            <CharacterStats>
              <StatItem>
                <StatLabel>血量</StatLabel>
                <StatValue>{character.health}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>魔量</StatLabel>
                <StatValue>{character.mana}</StatValue>
              </StatItem>
            </CharacterStats>
          </CharacterCard>
        ))}
      </CharacterGrid>
      
      {error && <div style={{ color: '#ff6b6b', marginBottom: '15px' }}>{error}</div>}
      
      <Button 
        onClick={handleConfirmSelection}
        disabled={!selectedCharacterId || isLoading}
      >
        {isLoading ? '處理中...' : '確認選擇'}
      </Button>
      
      {isLoading && currentPlayer?.isHost && (
        <LoadingMessage>創建遊戲中，請稍等...</LoadingMessage>
      )}
      
      {isLoading && !currentPlayer?.isHost && (
        <LoadingMessage>加入遊戲中，請稍等...</LoadingMessage>
      )}
    </Container>
  );
};

export default CharacterSelect;