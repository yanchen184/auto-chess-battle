import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { getAllCharacters } from '../models/characters';
import { createGame, joinGame } from '../services/gameService';

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 20px;
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  color: #555;
  margin-bottom: 30px;
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const CharacterCard = styled.div`
  background-color: ${({ selected, theme }) => (selected ? theme : '#fff')};
  color: ${({ selected }) => (selected ? '#fff' : '#333')};
  border: 2px solid ${({ theme }) => theme};
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Avatar = styled.div`
  font-size: 3rem;
  margin-bottom: 10px;
`;

const CharacterName = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 10px;
`;

const CharacterDescription = styled.p`
  margin-bottom: 15px;
`;

const Stats = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.span`
  font-size: 1.2rem;
  font-weight: bold;
`;

const StatLabel = styled.span`
  font-size: 0.9rem;
  color: ${({ selected }) => (selected ? '#eee' : '#777')};
`;

const GameOptions = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 500px;
  margin: 0 auto;
  gap: 15px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  background-color: ${({ disabled, theme }) => (disabled ? '#ccc' : theme || '#4dabf7')};
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ disabled, theme }) => (disabled ? '#ccc' : theme ? theme + 'dd' : '#339af0')};
  }
`;

const ErrorMessage = styled.p`
  color: #e03131;
  margin-top: 10px;
`;

const CharacterSelect = () => {
  const navigate = useNavigate();
  const { 
    currentPlayer, 
    selectCharacter, 
    selectedCharacter,
    setCurrentGame
  } = useGame();
  
  const [characters, setCharacters] = useState([]);
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 載入角色資料
  useEffect(() => {
    setCharacters(getAllCharacters());
    
    // 從 localStorage 獲取玩家名稱
    if (currentPlayer?.name) {
      setPlayerName(currentPlayer.name);
    }
  }, [currentPlayer]);
  
  // 選擇角色
  const handleSelectCharacter = (character) => {
    selectCharacter(character);
  };
  
  // 創建遊戲
  const handleCreateGame = async () => {
    if (!selectedCharacter) {
      setError('請選擇一個角色');
      return;
    }
    
    if (!playerName.trim()) {
      setError('請輸入玩家名稱');
      return;
    }
    
    if (!currentPlayer) {
      setError('用戶身份驗證失敗，請重新整理頁面');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const game = await createGame({
        creatorId: currentPlayer.id,
        creatorName: playerName,
        creatorCharacter: selectedCharacter.id
      });
      
      setCurrentGame(game);
      navigate(`/game/${game.id}`);
    } catch (error) {
      console.error('創建遊戲錯誤:', error);
      setError('創建遊戲失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 加入遊戲
  const handleJoinGame = async () => {
    if (!selectedCharacter) {
      setError('請選擇一個角色');
      return;
    }
    
    if (!playerName.trim()) {
      setError('請輸入玩家名稱');
      return;
    }
    
    if (!gameId.trim()) {
      setError('請輸入遊戲ID');
      return;
    }
    
    if (!currentPlayer) {
      setError('用戶身份驗證失敗，請重新整理頁面');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const game = await joinGame(gameId, {
        playerId: currentPlayer.id,
        playerName: playerName,
        playerCharacter: selectedCharacter.id
      });
      
      setCurrentGame(game);
      navigate(`/game/${game.id}`);
    } catch (error) {
      console.error('加入遊戲錯誤:', error);
      setError('加入遊戲失敗，請檢查遊戲ID是否正確');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <PageContainer>
      <Title>選擇你的角色</Title>
      <Subtitle>每個角色都有獨特的能力和卡牌</Subtitle>
      
      <CharacterGrid>
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            onClick={() => handleSelectCharacter(character)}
            selected={selectedCharacter?.id === character.id}
            theme={character.color}
          >
            <Avatar>{character.avatar}</Avatar>
            <CharacterName>{character.name}</CharacterName>
            <CharacterDescription>{character.description}</CharacterDescription>
            <Stats>
              <Stat>
                <StatValue>❤️ {character.health}</StatValue>
                <StatLabel selected={selectedCharacter?.id === character.id}>生命值</StatLabel>
              </Stat>
              <Stat>
                <StatValue>🔮 {character.mana}</StatValue>
                <StatLabel selected={selectedCharacter?.id === character.id}>魔力值</StatLabel>
              </Stat>
            </Stats>
          </CharacterCard>
        ))}
      </CharacterGrid>
      
      <GameOptions>
        <Input
          type="text"
          placeholder="輸入你的名稱"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        
        <Button 
          onClick={handleCreateGame}
          disabled={isLoading || !selectedCharacter || !playerName || !currentPlayer}
          theme={selectedCharacter?.color}
        >
          {isLoading ? '處理中...' : '創建新遊戲'}
        </Button>
        
        <Input
          type="text"
          placeholder="輸入遊戲ID加入現有遊戲"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
        />
        
        <Button 
          onClick={handleJoinGame}
          disabled={isLoading || !selectedCharacter || !playerName || !gameId || !currentPlayer}
          theme={selectedCharacter?.color}
        >
          {isLoading ? '處理中...' : '加入遊戲'}
        </Button>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </GameOptions>
    </PageContainer>
  );
};

export default CharacterSelect;