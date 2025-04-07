import React, { useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { AttackPatternDisplay } from './AttackPatternDisplay';

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
  width: 100%;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #ffffff;
`;

const CardsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
`;

const Card = styled.div`
  width: 120px;
  height: 160px;
  background-color: ${({ selected, cardColor }) => 
    selected ? `${cardColor || '#4dabf7'}` : '#f8f9fa'};
  color: ${({ selected }) => (selected ? '#ffffff' : '#333333')};
  border-radius: 8px;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 10px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  border: 2px solid ${({ selected, cardColor }) => 
    selected ? '#ffffff' : cardColor || '#4dabf7'};
  
  &:hover {
    transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-5px)')};
    box-shadow: ${({ disabled }) => (disabled ? '0 4px 8px rgba(0, 0, 0, 0.1)' : '0 8px 16px rgba(0, 0, 0, 0.2)')};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

const CardIcon = styled.div`
  font-size: 1.5rem;
`;

const CardCost = styled.div`
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const CardName = styled.div`
  font-size: 0.9rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
`;

const CardDescription = styled.div`
  font-size: 0.75rem;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const CardType = styled.div`
  font-size: 0.7rem;
  text-align: center;
  padding: 2px 5px;
  background-color: ${({ type, selected }) => {
    if (selected) {
      return 'rgba(255, 255, 255, 0.2)';
    }
    switch (type) {
      case 'movement':
        return '#4dabf7';
      case 'attack':
        return '#ff6b6b';
      default:
        return '#aaaaaa';
    }
  }};
  color: ${({ selected }) => (selected ? '#ffffff' : '#ffffff')};
  border-radius: 4px;
  margin-top: 5px;
`;

const SelectedCardsSection = styled.div`
  padding: 15px;
  background-color: #2a2a2a;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const SelectedCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
`;

const ConfirmButton = styled.button`
  padding: 12px 20px;
  background-color: ${({ disabled }) => (disabled ? '#868e96' : '#37b24d')};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: background-color 0.3s ease;
  margin-top: 20px;
  width: 100%;
  
  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#868e96' : '#2b8a3e')};
  }
`;

const CardPopover = styled.div`
  position: absolute;
  z-index: 10;
  background-color: #1a1a1a;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  min-width: 200px;
  top: ${({ position }) => position === 'top' ? 'auto' : '100%'};
  bottom: ${({ position }) => position === 'top' ? '100%' : 'auto'};
  left: 50%;
  transform: translateX(-50%);
  margin: ${({ position }) => position === 'top' ? '0 0 10px 0' : '10px 0 0 0'};
  
  &:after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    ${({ position }) => position === 'top' 
      ? 'border-top: 8px solid #1a1a1a; bottom: -8px;' 
      : 'border-bottom: 8px solid #1a1a1a; top: -8px;'
    }
    left: 50%;
    transform: translateX(-50%);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 10px;
`;

const InfoLabel = styled.div`
  font-size: 0.8rem;
  color: #aaaaaa;
`;

const InfoValue = styled.div`
  font-size: 0.8rem;
  color: #ffffff;
`;

/**
 * 卡牌選擇組件
 * 
 * @param {Object} props - 組件屬性
 * @param {Array} props.availableCards - 可選卡牌列表
 * @param {Array} props.selectedCards - 已選卡牌列表
 * @param {Function} props.onSelectCard - 選擇卡牌處理函數
 * @param {Function} props.onConfirmSelection - 確認選擇處理函數
 * @param {Boolean} props.selectionConfirmed - 是否已確認選擇
 * @param {Object} props.player - 玩家資料
 * @param {Number} props.maxSelections - 最大選擇數量
 */
const CardSelection = ({
  availableCards = [],
  selectedCards = [],
  onSelectCard,
  onConfirmSelection,
  selectionConfirmed = false,
  player,
  maxSelections = 3
}) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState('bottom');
  
  // 處理卡牌點擊
  const handleCardClick = (card) => {
    if (selectionConfirmed) {
      return;
    }
    
    onSelectCard(card);
  };
  
  // 確認是否已選擇卡牌
  const isCardSelected = (card) => {
    return selectedCards.some(selectedCard => selectedCard.id === card.id);
  };
  
  // 確認卡牌是否可選
  const isCardSelectable = (card) => {
    if (!player || selectionConfirmed) {
      return false;
    }
    
    // 檢查是否已達到最大選擇數量
    if (selectedCards.length >= maxSelections && !isCardSelected(card)) {
      return false;
    }
    
    // 檢查魔力值是否足夠
    return player.mana >= card.manaCost;
  };
  
  // 處理卡牌鼠標移入
  const handleCardMouseEnter = (card, event) => {
    // 根據鼠標位置決定彈出位置
    const rect = event.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const topSpace = rect.top;
    const bottomSpace = windowHeight - rect.bottom;
    
    setPopoverPosition(bottomSpace < 200 ? 'top' : 'bottom');
    setHoveredCard(card);
  };
  
  // 處理卡牌鼠標移出
  const handleCardMouseLeave = () => {
    setHoveredCard(null);
  };
  
  // 渲染卡牌
  const renderCard = (card, index) => {
    const selected = isCardSelected(card);
    const selectable = isCardSelectable(card);
    
    return (
      <Card 
        key={`${card.id}-${index}`}
        onClick={() => selectable && handleCardClick(card)}
        selected={selected}
        disabled={!selectable}
        cardColor={card.color}
        onMouseEnter={(e) => handleCardMouseEnter(card, e)}
        onMouseLeave={handleCardMouseLeave}
      >
        <CardHeader>
          <CardIcon>{card.icon}</CardIcon>
          <CardCost>🔮 {card.manaCost}</CardCost>
        </CardHeader>
        <CardName>{card.name}</CardName>
        <CardDescription>{card.description}</CardDescription>
        <CardType type={card.type} selected={selected}>
          {card.type === 'movement' ? '移動' : '攻擊'}
        </CardType>
        
        {/* 卡牌詳情彈出框 */}
        {hoveredCard && hoveredCard.id === card.id && (
          <CardPopover position={popoverPosition}>
            <InfoGrid>
              <InfoLabel>名稱:</InfoLabel>
              <InfoValue>{card.name}</InfoValue>
              
              <InfoLabel>類型:</InfoLabel>
              <InfoValue>{card.type === 'movement' ? '移動' : '攻擊'}</InfoValue>
              
              <InfoLabel>魔力消耗:</InfoLabel>
              <InfoValue>{card.manaCost}</InfoValue>
              
              {card.type === 'movement' && (
                <>
                  <InfoLabel>移動方向:</InfoLabel>
                  <InfoValue>{
                    card.direction === 'forward' ? '前進' :
                    card.direction === 'backward' ? '後退' :
                    card.direction === 'left' ? '左移' :
                    card.direction === 'right' ? '右移' : '未知'
                  }</InfoValue>
                  
                  <InfoLabel>移動距離:</InfoLabel>
                  <InfoValue>{card.range} 格</InfoValue>
                </>
              )}
              
              {card.type === 'attack' && (
                <>
                  <InfoLabel>傷害值:</InfoLabel>
                  <InfoValue>{card.damage}</InfoValue>
                  
                  <InfoLabel>攻擊模式:</InfoLabel>
                  <InfoValue>
                    <AttackPatternDisplay pattern={card.pattern} size={15} />
                  </InfoValue>
                </>
              )}
            </InfoGrid>
          </CardPopover>
        )}
      </Card>
    );
  };
  
  return (
    <Container>
      {/* 已選卡牌區域 */}
      <SelectedCardsSection>
        <SectionTitle>已選擇卡牌 ({selectedCards.length}/{maxSelections})</SectionTitle>
        
        {selectedCards.length > 0 ? (
          <SelectedCardsGrid>
            {selectedCards.map((card, index) => renderCard(card, index))}
          </SelectedCardsGrid>
        ) : (
          <div style={{ textAlign: 'center', color: '#aaaaaa', padding: '20px' }}>
            尚未選擇任何卡牌
          </div>
        )}
        
        <ConfirmButton 
          onClick={onConfirmSelection}
          disabled={selectedCards.length === 0 || selectionConfirmed}
        >
          {selectionConfirmed ? '已確認' : '確認選擇'}
        </ConfirmButton>
      </SelectedCardsSection>
      
      {/* 可用卡牌區域 */}
      <div>
        <SectionTitle>可用卡牌</SectionTitle>
        <CardsContainer>
          {availableCards.map((card, index) => renderCard(card, index))}
        </CardsContainer>
      </div>
    </Container>
  );
};

CardSelection.propTypes = {
  availableCards: PropTypes.array,
  selectedCards: PropTypes.array,
  onSelectCard: PropTypes.func.isRequired,
  onConfirmSelection: PropTypes.func.isRequired,
  selectionConfirmed: PropTypes.bool,
  player: PropTypes.object,
  maxSelections: PropTypes.number
};

export default CardSelection;
