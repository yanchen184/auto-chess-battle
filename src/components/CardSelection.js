import React from 'react';
import styled from 'styled-components';

const CardSelectionContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SectionTitle = styled.h2`
  color: #61dafb;
  margin-bottom: 15px;
  align-self: flex-start;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  width: 100%;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const Card = styled.div`
  background-color: ${props => props.selected ? '#3a506b' : '#1a1d24'};
  border: 2px solid ${props => 
    props.selected ? '#61dafb' : 
    (props.disabled ? '#4a4a4a' : '#2a2e38')
  };
  border-radius: 8px;
  padding: 12px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: all 0.2s;
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-5px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 5px 15px rgba(0, 0, 0, 0.3)'};
  }
`;

const CardTitle = styled.h3`
  color: #ffffff;
  margin: 0 0 8px 0;
  font-size: 0.9rem;
`;

const CardType = styled.div`
  color: ${props => props.type === 'movement' ? '#61dafb' : '#ff6b6b'};
  font-size: 0.7rem;
  margin-bottom: 8px;
`;

const CardDescription = styled.p`
  color: #aaaaaa;
  font-size: 0.8rem;
  margin-bottom: 8px;
`;

const CardCost = styled.div`
  color: #ffcc00;
  font-size: 0.8rem;
  font-weight: bold;
`;

const SelectedCardsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  width: 100%;
`;

const SelectedCardSlot = styled.div`
  width: 120px;
  height: 180px;
  background-color: ${props => props.hasCard ? '#3a506b' : '#1a1d24'};
  border: 2px dashed ${props => props.hasCard ? '#61dafb' : '#4a4a4a'};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  position: relative;
`;

const SlotNumber = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #282c34;
  color: #ffffff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
`;

const RemoveCardButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #ff6b6b;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  cursor: pointer;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
`;

const ConfirmButton = styled.button`
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

const ManaIndicator = styled.div`
  color: #61dafb;
  font-size: 1rem;
  margin-bottom: 15px;
`;

const CardSelection = ({ 
  availableCards, 
  selectedCards, 
  onCardSelect, 
  onCardDeselect, 
  onConfirm, 
  playerMana 
}) => {
  // Calculate total mana cost of selected cards
  const totalManaCost = selectedCards.reduce((sum, card) => sum + card.manaCost, 0);
  
  // Check if card can be afforded with current mana
  const canAffordCard = (card) => playerMana >= card.manaCost;
  
  // Check if card is already selected
  const isCardSelected = (cardId) => selectedCards.some(card => card.id === cardId);
  
  return (
    <CardSelectionContainer>
      <ManaIndicator>魔力: {playerMana} / {totalManaCost > 0 ? `(已使用: ${totalManaCost})` : ''}</ManaIndicator>
      
      <SectionTitle>選擇三張卡片:</SectionTitle>
      
      <SelectedCardsContainer>
        {[0, 1, 2].map(index => (
          <SelectedCardSlot 
            key={index} 
            hasCard={selectedCards[index]}
          >
            <SlotNumber>{index + 1}</SlotNumber>
            
            {selectedCards[index] ? (
              <>
                <CardTitle>{selectedCards[index].name}</CardTitle>
                <CardType type={selectedCards[index].type}>
                  {selectedCards[index].type === 'movement' ? '移動' : '攻擊'}
                </CardType>
                <CardCost>{selectedCards[index].manaCost} 魔力</CardCost>
                <RemoveCardButton onClick={() => onCardDeselect(index)}>×</RemoveCardButton>
              </>
            ) : (
              <div style={{ color: '#4a4a4a' }}>選擇卡片</div>
            )}
          </SelectedCardSlot>
        ))}
      </SelectedCardsContainer>
      
      <CardsGrid>
        {availableCards.map(card => {
          const canAfford = canAffordCard(card);
          const isSelected = isCardSelected(card.id);
          
          return (
            <Card 
              key={card.id}
              selected={isSelected}
              disabled={isSelected || !canAfford || selectedCards.length >= 3}
              onClick={() => {
                if (!isSelected && canAfford && selectedCards.length < 3) {
                  onCardSelect(card);
                }
              }}
            >
              <CardTitle>{card.name}</CardTitle>
              <CardType type={card.type}>
                {card.type === 'movement' ? '移動' : '攻擊'}
              </CardType>
              <CardDescription>{card.description}</CardDescription>
              <CardCost>{card.manaCost} 魔力</CardCost>
            </Card>
          );
        })}
      </CardsGrid>
      
      <ConfirmButton 
        onClick={onConfirm}
        disabled={selectedCards.length !== 3 || totalManaCost > playerMana}
      >
        確認選擇
      </ConfirmButton>
    </CardSelectionContainer>
  );
};

export default CardSelection;