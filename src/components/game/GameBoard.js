import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

// Styled Components
const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 4px;
  background-color: #222;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
`;

const Cell = styled.div`
  width: 60px;
  height: 60px;
  background-color: ${({ highlighted, highlightColor }) => 
    highlighted ? highlightColor || '#4dabf7' : '#ddd'};
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  position: relative;
  cursor: ${({ interactive }) => (interactive ? 'pointer' : 'default')};
  transition: all 0.2s ease;
  
  &:hover {
    transform: ${({ interactive }) => (interactive ? 'scale(1.05)' : 'none')};
    box-shadow: ${({ interactive }) => (interactive ? '0 0 8px rgba(0, 0, 0, 0.3)' : 'none')};
  }
  
  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
`;

const PlayerToken = styled.div`
  width: 80%;
  height: 80%;
  border-radius: 50%;
  background-color: ${({ color }) => color || '#4dabf7'};
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  /* 添加動畫效果 */
  animation: ${({ animate }) => (animate ? 'pulse 1.5s infinite' : 'none')};
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

const EffectOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${({ type }) => {
    switch (type) {
      case 'attack':
        return 'rgba(255, 0, 0, 0.3)';
      case 'move':
        return 'rgba(0, 255, 0, 0.3)';
      case 'heal':
        return 'rgba(0, 255, 255, 0.3)';
      default:
        return 'transparent';
    }
  }};
  display: ${({ show }) => (show ? 'block' : 'none')};
  border-radius: 4px;
  z-index: 1;
  
  /* 添加動畫效果 */
  animation: ${({ show }) => (show ? 'fadeInOut 0.8s' : 'none')};
  
  @keyframes fadeInOut {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

const Coordinate = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 8px;
  color: #777;
  opacity: 0.7;
`;

/**
 * 遊戲棋盤組件
 * 
 * @param {Object} props - 組件屬性
 * @param {Array} props.boardState - 棋盤狀態數組
 * @param {Object} props.player1 - 玩家1信息
 * @param {Object} props.player2 - 玩家2信息
 * @param {Array} props.highlightedCells - 高亮顯示的格子座標
 * @param {String} props.highlightColor - 高亮顯示的顏色
 * @param {Array} props.effectCells - 顯示特效的格子
 * @param {Function} props.onCellClick - 格子點擊事件處理函數
 * @param {Boolean} props.interactive - 是否允許互動
 */
const GameBoard = ({
  boardState,
  player1,
  player2,
  highlightedCells = [],
  highlightColor = '#4dabf7',
  effectCells = [],
  onCellClick,
  interactive = true
}) => {
  const [effects, setEffects] = useState([]);
  
  // 當效果格子變化時，顯示動畫
  useEffect(() => {
    if (effectCells && effectCells.length > 0) {
      setEffects(effectCells);
      
      // 設置動畫效果持續時間
      const timer = setTimeout(() => {
        setEffects([]);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [effectCells]);
  
  // 檢查格子是否高亮
  const isCellHighlighted = (x, y) => {
    return highlightedCells.some(cell => cell.x === x && cell.y === y);
  };
  
  // 檢查格子是否有效果
  const getCellEffect = (x, y) => {
    return effects.find(cell => cell.x === x && cell.y === y);
  };
  
  // 渲染棋盤格子
  const renderCell = (x, y) => {
    // 檢查格子是否高亮
    const highlighted = isCellHighlighted(x, y);
    
    // 檢查效果
    const effect = getCellEffect(x, y);
    
    // 檢查格子是否有玩家
    const isPlayer1Here = player1 && player1.position && player1.position.x === x && player1.position.y === y;
    const isPlayer2Here = player2 && player2.position && player2.position.x === x && player2.position.y === y;
    
    return (
      <Cell
        key={`cell-${x}-${y}`}
        highlighted={highlighted}
        highlightColor={highlightColor}
        interactive={interactive && highlighted}
        onClick={() => {
          if (interactive && highlighted && onCellClick) {
            onCellClick(x, y);
          }
        }}
      >
        {/* 顯示玩家1 */}
        {isPlayer1Here && (
          <PlayerToken
            color={player1.characterData?.color || '#ff6b6b'}
            animate={player1.isActive}
          >
            {player1.characterData?.avatar || '👤'}
          </PlayerToken>
        )}
        
        {/* 顯示玩家2 */}
        {isPlayer2Here && (
          <PlayerToken
            color={player2.characterData?.color || '#4dabf7'}
            animate={player2.isActive}
          >
            {player2.characterData?.avatar || '👤'}
          </PlayerToken>
        )}
        
        {/* 顯示效果覆蓋層 */}
        {effect && (
          <EffectOverlay
            type={effect.type}
            show={true}
          />
        )}
        
        {/* 顯示座標 (可選) */}
        <Coordinate>{`${x},${y}`}</Coordinate>
      </Cell>
    );
  };
  
  // 創建棋盤格子
  const renderBoard = () => {
    const cells = [];
    
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        cells.push(renderCell(x, y));
      }
    }
    
    return cells;
  };
  
  return (
    <BoardContainer>
      <Grid>
        {renderBoard()}
      </Grid>
    </BoardContainer>
  );
};

GameBoard.propTypes = {
  boardState: PropTypes.array,
  player1: PropTypes.object,
  player2: PropTypes.object,
  highlightedCells: PropTypes.array,
  highlightColor: PropTypes.string,
  effectCells: PropTypes.array,
  onCellClick: PropTypes.func,
  interactive: PropTypes.bool
};

export default GameBoard;
