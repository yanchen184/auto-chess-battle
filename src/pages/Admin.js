import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGame } from '../contexts/GameContext';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCharacterById } from '../models/characters';

// Styled Components
const AdminContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: white;
`;

const AdminHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
`;

const BackButton = styled.button`
  background-color: #4dabf7;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: #3b8de0;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #444;
`;

const Tab = styled.button`
  padding: 10px 20px;
  background-color: ${({ active }) => active ? '#4dabf7' : 'transparent'};
  color: ${({ active }) => active ? 'white' : '#aaaaaa'};
  border: none;
  border-bottom: 2px solid ${({ active }) => active ? '#4dabf7' : 'transparent'};
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    background-color: ${({ active }) => active ? '#4dabf7' : '#333'};
  }
`;

const Card = styled.div`
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  margin-top: 0;
  margin-bottom: 15px;
  color: #ffffff;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px;
  background-color: #333;
  color: #ffffff;
  border-bottom: 2px solid #444;
`;

const Td = styled.td`
  padding: 10px;
  border-bottom: 1px solid #444;
  color: ${({ highlight }) => highlight ? '#4dabf7' : '#ffffff'};
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  background-color: ${({ status }) => {
    switch (status) {
      case 'waiting':
        return '#868e96';
      case 'ready':
        return '#f59f00';
      case 'executing':
        return '#4dabf7';
      case 'finished':
        return '#37b24d';
      default:
        return '#868e96';
    }
  }};
  color: white;
`;

const CharacterIcon = styled.span`
  display: inline-block;
  width: 24px;
  height: 24px;
  text-align: center;
  line-height: 24px;
  background-color: ${({ color }) => color || 'transparent'};
  border-radius: 50%;
  margin-right: 5px;
`;

const Button = styled.button`
  background-color: #4dabf7;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  
  &:hover {
    background-color: #3b8de0;
  }
`;

// 管理頁面組件
const Admin = () => {
  const navigate = useNavigate();
  const { currentPlayer } = useGame();
  
  const [activeTab, setActiveTab] = useState('games');
  const [games, setGames] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 載入遊戲記錄
  useEffect(() => {
    if (!currentPlayer) {
      setError('請先登入');
      setLoading(false);
      return;
    }
    
    const fetchGames = async () => {
      try {
        setLoading(true);
        
        // 創建查詢條件
        const q = query(
          collection(db, 'games'),
          where('creatorId', '==', currentPlayer.id),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        
        // 執行查詢
        const querySnapshot = await getDocs(q);
        
        const gamesList = [];
        querySnapshot.forEach((doc) => {
          gamesList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setGames(gamesList);
        setLoading(false);
      } catch (error) {
        console.error('獲取遊戲記錄錯誤:', error);
        setError('載入遊戲記錄失敗');
        setLoading(false);
      }
    };
    
    fetchGames();
  }, [currentPlayer]);
  
  // 處理返回首頁
  const handleBackToHome = () => {
    navigate('/');
  };
  
  // 查看遊戲詳情
  const handleViewGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };
  
  // 格式化日期
  const formatDate = (timestamp) => {
    if (!timestamp) {
      return 'N/A';
    }
    
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };
  
  // 獲取角色信息
  const getCharacterInfo = (characterId) => {
    const character = getCharacterById(characterId);
    return character || { name: '未知角色', avatar: '❓', color: '#aaaaaa' };
  };
  
  // 渲染遊戲記錄標籤內容
  const renderGamesTab = () => {
    if (loading) {
      return <div>載入中...</div>;
    }
    
    if (error) {
      return <div style={{ color: '#f03e3e' }}>{error}</div>;
    }
    
    if (games.length === 0) {
      return <div>尚無遊戲記錄</div>;
    }
    
    return (
      <Card>
        <CardTitle>最近遊戲記錄</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>遊戲ID</Th>
              <Th>創建時間</Th>
              <Th>狀態</Th>
              <Th>創建者</Th>
              <Th>對手</Th>
              <Th>操作</Th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => {
              const creatorCharacter = getCharacterInfo(game.creatorCharacter);
              const opponentCharacter = game.opponentCharacter ? 
                getCharacterInfo(game.opponentCharacter) : null;
              
              return (
                <tr key={game.id}>
                  <Td>{game.id.substring(0, 8)}...</Td>
                  <Td>{formatDate(game.createdAt)}</Td>
                  <Td>
                    <StatusBadge status={game.status}>
                      {game.status === 'waiting' ? '等待中' : 
                       game.status === 'ready' ? '準備中' : 
                       game.status === 'executing' ? '執行中' : 
                       game.status === 'finished' ? '已完成' : '未知'}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <CharacterIcon color={creatorCharacter.color}>
                      {creatorCharacter.avatar}
                    </CharacterIcon>
                    {game.creatorName || '玩家'}
                  </Td>
                  <Td>
                    {opponentCharacter ? (
                      <>
                        <CharacterIcon color={opponentCharacter.color}>
                          {opponentCharacter.avatar}
                        </CharacterIcon>
                        {game.opponentName || '玩家'}
                      </>
                    ) : '無對手'}
                  </Td>
                  <Td>
                    <Button onClick={() => handleViewGame(game.id)}>
                      查看
                    </Button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    );
  };
  
  // 渲染角色數據標籤內容
  const renderCharactersTab = () => {
    const allCharacters = [
      { id: 'warrior', name: '戰士', wins: 15, losses: 8 },
      { id: 'mage', name: '法師', wins: 12, losses: 10 },
      { id: 'rogue', name: '盜賊', wins: 8, losses: 5 }
    ];
    
    return (
      <Card>
        <CardTitle>角色數據統計</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>角色</Th>
              <Th>勝場</Th>
              <Th>敗場</Th>
              <Th>勝率</Th>
            </tr>
          </thead>
          <tbody>
            {allCharacters.map((char) => {
              const character = getCharacterById(char.id);
              const winRate = ((char.wins / (char.wins + char.losses)) * 100).toFixed(1);
              
              return (
                <tr key={char.id}>
                  <Td>
                    <CharacterIcon color={character.color}>
                      {character.avatar}
                    </CharacterIcon>
                    {character.name}
                  </Td>
                  <Td>{char.wins}</Td>
                  <Td>{char.losses}</Td>
                  <Td highlight>{winRate}%</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    );
  };
  
  // 渲染卡牌數據標籤內容
  const renderCardsTab = () => {
    const popularCards = [
      { id: 'attack_fireball', name: '火球術', type: 'attack', usage: 45 },
      { id: 'move_forward_2', name: '前進2格', type: 'movement', usage: 38 },
      { id: 'attack_sweep', name: '橫掃', type: 'attack', usage: 32 },
      { id: 'attack_backstab', name: '背刺', type: 'attack', usage: 30 },
      { id: 'move_left_1', name: '左移1格', type: 'movement', usage: 28 }
    ];
    
    return (
      <Card>
        <CardTitle>熱門卡牌統計</CardTitle>
        <Table>
          <thead>
            <tr>
              <Th>卡牌</Th>
              <Th>類型</Th>
              <Th>使用次數</Th>
            </tr>
          </thead>
          <tbody>
            {popularCards.map((card) => {
              return (
                <tr key={card.id}>
                  <Td>{card.name}</Td>
                  <Td>
                    <StatusBadge status={card.type === 'attack' ? 'finished' : 'executing'}>
                      {card.type === 'attack' ? '攻擊' : '移動'}
                    </StatusBadge>
                  </Td>
                  <Td highlight>{card.usage}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    );
  };
  
  // 渲染當前標籤內容
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'games':
        return renderGamesTab();
      case 'characters':
        return renderCharactersTab();
      case 'cards':
        return renderCardsTab();
      default:
        return renderGamesTab();
    }
  };
  
  return (
    <AdminContainer>
      <AdminHeader>
        <Title>管理頁面</Title>
        <BackButton onClick={handleBackToHome}>
          返回首頁
        </BackButton>
      </AdminHeader>
      
      <TabContainer>
        <Tab 
          active={activeTab === 'games'} 
          onClick={() => setActiveTab('games')}
        >
          遊戲記錄
        </Tab>
        <Tab 
          active={activeTab === 'characters'} 
          onClick={() => setActiveTab('characters')}
        >
          角色數據
        </Tab>
        <Tab 
          active={activeTab === 'cards'} 
          onClick={() => setActiveTab('cards')}
        >
          卡牌數據
        </Tab>
      </TabContainer>
      
      {renderActiveTabContent()}
    </AdminContainer>
  );
};

export default Admin;