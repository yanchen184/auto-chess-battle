import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const ResultContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background-color: ${props => props.win ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
  border-radius: 10px;
  max-width: 600px;
  margin: 0 auto;
`;

const ResultTitle = styled.h1`
  color: ${props => props.win ? '#4CAF50' : '#F44336'};
  font-size: 2.5rem;
  margin-bottom: 20px;
  text-align: center;
`;

const ResultMessage = styled.p`
  color: #ffffff;
  font-size: 1.2rem;
  margin-bottom: 30px;
  text-align: center;
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 30px;
`;

const StatColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatLabel = styled.span`
  color: #aaaaaa;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const StatValue = styled.span`
  color: #ffffff;
  font-size: 1.5rem;
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
  margin: 10px;
  
  &:hover {
    background-color: #4fa8d1;
  }
`;

const GameResult = ({ result, stats, onPlayAgain }) => {
  const navigate = useNavigate();
  const isWinner = result === 'win';
  
  const handleMainMenu = () => {
    navigate('/');
  };
  
  return (
    <ResultContainer win={isWinner}>
      <ResultTitle win={isWinner}>
        {isWinner ? '勝利！' : '失敗'}
      </ResultTitle>
      
      <ResultMessage>
        {isWinner
          ? '恭喜！你在戰鬥中取得了勝利！'
          : '不要灰心，再接再厲！'}
      </ResultMessage>
      
      <StatsContainer>
        <StatColumn>
          <StatLabel>回合數</StatLabel>
          <StatValue>{stats.rounds}</StatValue>
        </StatColumn>
        
        <StatColumn>
          <StatLabel>移動次數</StatLabel>
          <StatValue>{stats.moves}</StatValue>
        </StatColumn>
        
        <StatColumn>
          <StatLabel>攻擊次數</StatLabel>
          <StatValue>{stats.attacks}</StatValue>
        </StatColumn>
        
        <StatColumn>
          <StatLabel>造成傷害</StatLabel>
          <StatValue>{stats.damageDealt}</StatValue>
        </StatColumn>
      </StatsContainer>
      
      <div>
        <Button onClick={onPlayAgain}>再玩一次</Button>
        <Button onClick={handleMainMenu}>回主選單</Button>
      </div>
    </ResultContainer>
  );
};

export default GameResult;