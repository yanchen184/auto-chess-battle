import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

// Styled Components
const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px;
  border-radius: 8px;
  background-color: #2a2a2a;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  min-width: 200px;
  border-left: 5px solid ${({ color }) => color || '#4dabf7'};
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ color }) => color || '#4dabf7'};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
  margin-right: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const PlayerName = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffffff;
`;

const CharacterName = styled.div`
  font-size: 0.9rem;
  color: #aaaaaa;
`;

const StatusBars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StatusBarWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatusLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const BarTitle = styled.span`
  font-size: 0.9rem;
  color: #aaaaaa;
`;

const BarValue = styled.span`
  font-size: 0.9rem;
  font-weight: bold;
  color: #ffffff;
`;

const BarContainer = styled.div`
  height: 12px;
  background-color: #444444;
  border-radius: 6px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${({ value, max }) => `${(value / max) * 100}%`};
  background-color: ${({ type }) => {
    switch (type) {
      case 'health':
        return '#ff6b6b';
      case 'mana':
        return '#4dabf7';
      default:
        return '#aaaaaa';
    }
  }};
  transition: width 0.5s ease-in-out;
`;

const StatusEffectsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
`;

const StatusEffect = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${({ type }) => {
    switch (type) {
      case 'buff':
        return '#37b24d';
      case 'debuff':
        return '#f03e3e';
      default:
        return '#868e96';
    }
  }};
  font-size: 0.8rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ReadyStatus = styled.div`
  padding: 5px 10px;
  font-size: 0.9rem;
  font-weight: bold;
  border-radius: 4px;
  text-align: center;
  margin-top: 15px;
  background-color: ${({ isReady }) => (isReady ? '#37b24d' : '#868e96')};
  color: white;
  transition: background-color 0.3s ease;
`;

/**
 * 玩家狀態組件
 * 
 * @param {Object} props - 組件屬性
 * @param {Object} props.player - 玩家資料
 * @param {String} props.player.name - 玩家名稱
 * @param {Object} props.player.characterData - 角色資料
 * @param {Number} props.player.health - 目前生命值
 * @param {Number} props.player.mana - 目前魔力值
 * @param {Boolean} props.player.isReady - 是否準備完成
 * @param {Array} props.player.statusEffects - 狀態效果列表
 * @param {Boolean} props.isCurrentPlayer - 是否為當前玩家
 */
const PlayerStatus = ({ player, isCurrentPlayer }) => {
  if (!player || !player.characterData) {
    return null;
  }
  
  // 取得玩家資料
  const { 
    name, 
    characterData, 
    health, 
    mana, 
    isReady,
    statusEffects = []
  } = player;
  
  // 最大生命值和魔力值
  const maxHealth = characterData.health;
  const maxMana = characterData.mana;
  
  return (
    <StatusContainer color={characterData.color}>
      <PlayerInfo>
        <Avatar color={characterData.color}>
          {characterData.avatar}
        </Avatar>
        <div>
          <PlayerName>{name || '玩家'}</PlayerName>
          <CharacterName>{characterData.name}</CharacterName>
        </div>
      </PlayerInfo>
      
      <StatusBars>
        {/* 生命值條 */}
        <StatusBarWrapper>
          <StatusLabel>
            <BarTitle>生命值</BarTitle>
            <BarValue>{`${health}/${maxHealth}`}</BarValue>
          </StatusLabel>
          <BarContainer>
            <BarFill type="health" value={health} max={maxHealth} />
          </BarContainer>
        </StatusBarWrapper>
        
        {/* 魔力值條 */}
        <StatusBarWrapper>
          <StatusLabel>
            <BarTitle>魔力值</BarTitle>
            <BarValue>{`${mana}/${maxMana}`}</BarValue>
          </StatusLabel>
          <BarContainer>
            <BarFill type="mana" value={mana} max={maxMana} />
          </BarContainer>
        </StatusBarWrapper>
      </StatusBars>
      
      {/* 狀態效果 */}
      {statusEffects && statusEffects.length > 0 && (
        <StatusEffectsContainer>
          {statusEffects.map((effect, index) => (
            <StatusEffect key={index} type={effect.type}>
              {effect.icon && <span>{effect.icon}</span>}
              {effect.name}
            </StatusEffect>
          ))}
        </StatusEffectsContainer>
      )}
      
      {/* 準備狀態 */}
      <ReadyStatus isReady={isReady}>
        {isReady ? '已準備' : '未準備'}
      </ReadyStatus>
    </StatusContainer>
  );
};

PlayerStatus.propTypes = {
  player: PropTypes.shape({
    name: PropTypes.string,
    characterData: PropTypes.object.isRequired,
    health: PropTypes.number.isRequired,
    mana: PropTypes.number.isRequired,
    isReady: PropTypes.bool,
    statusEffects: PropTypes.array
  }).isRequired,
  isCurrentPlayer: PropTypes.bool
};

export default PlayerStatus;
