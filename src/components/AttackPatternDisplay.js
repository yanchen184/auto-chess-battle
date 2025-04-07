import React from 'react';
import styled from 'styled-components';

const PatternContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 2px;
  width: 90px;
  height: 90px;
  margin: 10px auto;
`;

const Cell = styled.div`
  width: 30px;
  height: 30px;
  background-color: ${props => props.active ? '#ff6b6b80' : '#1a1d24'};
  border: 1px solid ${props => props.active ? '#ff6b6b' : '#4a4a4a'};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PlayerMarker = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #61dafb;
  display: flex;
  justify-content: center;
  align-items: center;
`;

/**
 * Display a 3x3 attack pattern grid
 * @param {Array} pattern - 3x3 array with 1 for active cells, 0 for inactive
 */
const AttackPatternDisplay = ({ pattern }) => {
  if (!pattern || !Array.isArray(pattern) || pattern.length !== 3) {
    return null;
  }
  
  return (
    <PatternContainer>
      {pattern.map((row, rowIndex) => 
        row.map((cell, colIndex) => (
          <Cell 
            key={`${rowIndex}-${colIndex}`}
            active={cell === 1}
          >
            {rowIndex === 1 && colIndex === 1 && (
              <PlayerMarker />
            )}
          </Cell>
        ))
      )}
    </PatternContainer>
  );
};

export default AttackPatternDisplay;