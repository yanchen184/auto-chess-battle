import React from 'react';
import styled from 'styled-components';

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isCurrentPlayer ? 'flex-start' : 'flex-end'};
  background-color: #1a1d24;
  border-radius: 8px;
  padding: 15px;
  min-width: 250px;
`;

const PlayerName = styled.div`
  color: ${props => props.isCurrentPlayer ? '#61dafb' : '#ff6b6b'};
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
`;

const CharacterInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const CharacterName = styled.div`
  color: #ffffff;
  font-size: 1rem;
  margin-right: 10px;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 15px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
`;

const StatLabel = styled.span`
  color: #aaaaaa;
  font-size: 0.8rem;
  margin-right: 5px;
`;

const StatValue = styled.span`
  color: ${props => {
    if (props.type === 'health') return '#ff6b6b';
    if (props.type === 'mana') return '#61dafb';
    return '#ffffff';
  }};
  font-weight: bold;
`;

const StatusIndicator = styled.div`
  font-size: 0.8rem;
  color: ${props => props.ready ? '#4CAF50' : '#FFC107'};
  margin-top: 5px;
`;

const PlayerStatus = ({ player, isCurrentPlayer }) => {
  if (!player) return null;
  
  return (
    <StatusContainer isCurrentPlayer={isCurrentPlayer}>
      <PlayerName isCurrentPlayer={isCurrentPlayer}>
        {isCurrentPlayer ? '你' : '對手'}: {player.name}
      </PlayerName>
      
      <CharacterInfo>
        <CharacterName>{player.character.name}</CharacterName>
      </CharacterInfo>
      
      <StatsContainer>
        <StatItem>
          <StatLabel>血量:</StatLabel>
          <StatValue type="health">{player.health}/{player.character.health}</StatValue>
        </StatItem>
        
        <StatItem>
          <StatLabel>魔力:</StatLabel>
          <StatValue type="mana">{player.mana}/{player.character.mana}</StatValue>
        </StatItem>
      </StatsContainer>
      
      <StatusIndicator ready={player.ready}>
        {player.ready ? '已準備' : '選擇卡片中...'}
      </StatusIndicator>
    </StatusContainer>
  );
};

export default PlayerStatus;