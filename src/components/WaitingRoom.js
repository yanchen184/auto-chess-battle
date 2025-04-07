import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const WaitingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
`;

const Title = styled.h1`
  color: #61dafb;
  margin-bottom: 30px;
`;

const GameCode = styled.div`
  background-color: #1a1d24;
  border: 2px solid #61dafb;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: center;
`;

const GameId = styled.h2`
  color: #ffffff;
  font-size: 2rem;
  margin-bottom: 10px;
`;

const Instruction = styled.p`
  color: #aaaaaa;
  margin-top: 10px;
`;

const CopyButton = styled.button`
  background-color: #61dafb;
  color: #282c34;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 10px;
  
  &:hover {
    background-color: #4fa8d1;
  }
`;

const PlayersList = styled.div`
  background-color: #1a1d24;
  border-radius: 10px;
  padding: 20px;
  width: 100%;
  max-width: 400px;
`;

const PlayersTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 15px;
  text-align: center;
`;

const PlayerItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: ${props => props.isHost ? '#3a506b' : '#282c34'};
  border-radius: 4px;
  margin-bottom: 10px;
`;

const PlayerName = styled.span`
  color: #ffffff;
  font-weight: ${props => props.isHost ? 'bold' : 'normal'};
`;

const PlayerStatus = styled.span`
  color: ${props => props.ready ? '#4CAF50' : '#FFC107'};
  font-size: 0.9rem;
`;

const LoadingIndicator = styled.div`
  width: 100px;
  height: 100px;
  border: 5px solid #3a506b;
  border-top: 5px solid #61dafb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 30px 0;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const WaitingRoom = ({ gameId, players, isHost, onStart, isLoading }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  // Reset copied status after 3 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);
  
  const handleCopyGameId = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
  };
  
  const handleStartGame = () => {
    if (isHost && players.length >= 2) {
      onStart();
    }
  };
  
  return (
    <WaitingContainer>
      <Title>遊戲準備室</Title>
      
      <GameCode>
        <GameId>{gameId}</GameId>
        <Instruction>分享此代碼給你的朋友來加入遊戲</Instruction>
        <CopyButton onClick={handleCopyGameId}>
          {copied ? '已複製！' : '複製代碼'}
        </CopyButton>
      </GameCode>
      
      {isLoading ? (
        <>
          <LoadingIndicator />
          <Instruction>正在準備遊戲...</Instruction>
        </>
      ) : (
        <PlayersList>
          <PlayersTitle>玩家 ({players.length}/2)</PlayersTitle>
          
          {players.map(player => (
            <PlayerItem key={player.id} isHost={player.isHost}>
              <PlayerName isHost={player.isHost}>
                {player.name} {player.isHost ? '(主機)' : ''}
              </PlayerName>
              <PlayerStatus ready={player.ready}>
                {player.ready ? '準備完成' : '等待中...'}
              </PlayerStatus>
            </PlayerItem>
          ))}
          
          {isHost && players.length >= 2 ? (
            <CopyButton onClick={handleStartGame}>開始遊戲</CopyButton>
          ) : (
            <Instruction>
              {isHost ? '等待另一位玩家加入...' : '等待主機開始遊戲...'}
            </Instruction>
          )}
        </PlayersList>
      )}
    </WaitingContainer>
  );
};

export default WaitingRoom;