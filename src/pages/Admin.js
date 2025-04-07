import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const AdminContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #61dafb;
  margin-bottom: 30px;
`;

const Section = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  color: #ffffff;
  margin-bottom: 20px;
  border-bottom: 1px solid #4a4a4a;
  padding-bottom: 10px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`;

const TableHead = styled.thead`
  background-color: #1a1d24;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #2a2e38;
  }
  
  &:hover {
    background-color: #3a4050;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border: 1px solid #4a4a4a;
`;

const TableHeader = styled.th`
  padding: 12px;
  border: 1px solid #4a4a4a;
  text-align: left;
`;

const Button = styled.button`
  background-color: ${props => props.danger ? '#ff6b6b' : '#61dafb'};
  color: ${props => props.danger ? '#ffffff' : '#282c34'};
  border: none;
  padding: 8px 12px;
  margin-right: 8px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.danger ? '#e05050' : '#4fa8d1'};
  }
`;

const Admin = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch all games from Firestore
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const gamesCollection = collection(db, 'games');
        const gamesSnapshot = await getDocs(gamesCollection);
        const gamesList = gamesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setGames(gamesList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching games:', error);
        setLoading(false);
      }
    };
    
    fetchGames();
  }, []);
  
  // Delete a game
  const handleDeleteGame = async (gameId) => {
    if (window.confirm('確定要刪除此遊戲？')) {
      try {
        await deleteDoc(doc(db, 'games', gameId));
        setGames(games.filter(game => game.id !== gameId));
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };
  
  // Reset a game
  const handleResetGame = async (gameId) => {
    if (window.confirm('確定要重置此遊戲？')) {
      try {
        await updateDoc(doc(db, 'games', gameId), {
          status: 'waiting',
          winner: null,
          currentTurn: 0,
          updatedAt: new Date()
        });
        
        // Reload games
        const gamesCollection = collection(db, 'games');
        const gamesSnapshot = await getDocs(gamesCollection);
        const gamesList = gamesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setGames(gamesList);
      } catch (error) {
        console.error('Error resetting game:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <AdminContainer>
        <Title>管理面板</Title>
        <div>載入中...</div>
      </AdminContainer>
    );
  }
  
  return (
    <AdminContainer>
      <Title>管理面板</Title>
      
      <Section>
        <SectionTitle>遊戲列表</SectionTitle>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>遊戲ID</TableHeader>
              <TableHeader>主機玩家</TableHeader>
              <TableHeader>訪客玩家</TableHeader>
              <TableHeader>狀態</TableHeader>
              <TableHeader>創建時間</TableHeader>
              <TableHeader>操作</TableHeader>
            </TableRow>
          </TableHead>
          <tbody>
            {games.length === 0 ? (
              <TableRow>
                <TableCell colSpan="6" style={{ textAlign: 'center' }}>
                  暫無遊戲數據
                </TableCell>
              </TableRow>
            ) : (
              games.map(game => (
                <TableRow key={game.id}>
                  <TableCell>{game.id}</TableCell>
                  <TableCell>{game.hostPlayer?.name || '-'}</TableCell>
                  <TableCell>{game.guestPlayer?.name || '-'}</TableCell>
                  <TableCell>
                    {{
                      'waiting': '等待中',
                      'ready': '準備開始',
                      'executing': '進行中',
                      'finished': '已結束'
                    }[game.status] || game.status}
                  </TableCell>
                  <TableCell>
                    {game.createdAt ? new Date(game.createdAt.seconds * 1000).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleResetGame(game.id)}>重置</Button>
                    <Button danger onClick={() => handleDeleteGame(game.id)}>刪除</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </Section>
    </AdminContainer>
  );
};

export default Admin;