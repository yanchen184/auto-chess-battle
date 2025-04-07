import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';

const Home = () => (
  <div className="page">
    <h1>自走棋對戰遊戲</h1>
    <p>版本: v0.1.0</p>
    <p>歡迎來到自走棋對戰遊戲！你將在 5x5 的棋盤上與對手進行策略對戰。</p>
    <div className="features">
      <h2>選擇角色</h2>
      <ul>
        <li>戰士 - 血量豐厚，近戰能力強</li>
        <li>法師 - 特殊技能，可造成大範圍傷害</li>
        <li>盜賊 - 機動性強，有特殊手段</li>
      </ul>
    </div>
    <p className="construction">這個應用程序目前正在開發中。敬請期待完整版本！</p>
  </div>
);

function App() {
  return (
    <HashRouter>
      <div className="App">
        <header className="App-header">
          <div className="version-info">v0.1.0</div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;