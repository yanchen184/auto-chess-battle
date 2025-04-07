import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

// Styled Components
const PatternGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  width: ${({ size }) => size * 3 + 4}px;
  height: ${({ size }) => size * 3 + 4}px;
`;

const Cell = styled.div`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  background-color: ${({ active, color }) => active ? color || '#ff6b6b' : '#444'};
  border-radius: 2px;
  transition: all 0.2s ease;

  ${({ playerPosition }) => playerPosition && `
    position: relative;
    
    &:after {
      content: '×';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ffffff;
      font-weight: bold;
    }
  `}
`;

/**
 * 攻擊模式顯示組件
 * 
 * @param {Object} props - 組件屬性
 * @param {Array} props.pattern - 攻擊模式矩陣 (3x3)
 * @param {Number} props.size - 每個格子的大小 (像素)
 * @param {String} props.color - 攻擊格子的顏色
 * @param {Boolean} props.showPlayerPosition - 是否顯示玩家位置
 */
export const AttackPatternDisplay = ({
  pattern,
  size = 20,
  color = '#ff6b6b',
  showPlayerPosition = true
}) => {
  // 如果沒有提供模式，或模式不是 3x3，則返回空
  if (!pattern || pattern.length !== 3 || pattern.some(row => row.length !== 3)) {
    return null;
  }
  
  // 渲染 3x3 網格
  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const active = pattern[y][x] === 1;
        const isPlayerPosition = showPlayerPosition && x === 1 && y === 1;
        
        cells.push(
          <Cell
            key={`cell-${x}-${y}`}
            size={size}
            active={active}
            color={color}
            playerPosition={isPlayerPosition}
          />
        );
      }
    }
    
    return cells;
  };
  
  return (
    <PatternGrid size={size}>
      {renderGrid()}
    </PatternGrid>
  );
};

AttackPatternDisplay.propTypes = {
  pattern: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  size: PropTypes.number,
  color: PropTypes.string,
  showPlayerPosition: PropTypes.bool
};

/**
 * 攻擊模式顯示組件（大）
 * 用於遊戲中顯示當前選擇的攻擊卡的攻擊範圍
 */
export const AttackPatternLarge = ({
  pattern,
  title,
  description,
  damage,
  color = '#ff6b6b'
}) => {
  return (
    <div style={{ padding: '15px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
      {title && (
        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ffffff' }}>
          {title}
        </h3>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
        <AttackPatternDisplay pattern={pattern} size={30} color={color} />
      </div>
      
      {description && (
        <p style={{ fontSize: '0.9rem', color: '#aaaaaa', marginBottom: '10px', textAlign: 'center' }}>
          {description}
        </p>
      )}
      
      {damage && (
        <div style={{ 
          fontSize: '1rem', 
          color: '#ff6b6b', 
          textAlign: 'center', 
          fontWeight: 'bold'
        }}>
          傷害: {damage}
        </div>
      )}
    </div>
  );
};

AttackPatternLarge.propTypes = {
  pattern: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  damage: PropTypes.number,
  color: PropTypes.string
};

export default AttackPatternDisplay;
