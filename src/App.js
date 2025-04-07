import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import Home from './pages/Home';
import CharacterSelect from './pages/CharacterSelect';
import Game from './pages/Game';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <GameProvider>
      <HashRouter>
        <div className="App">
          <header className="App-header">
            <div className="version-info">v0.1.0</div>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/select" element={<CharacterSelect />} />
              <Route path="/game/:gameId" element={<Game />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </GameProvider>
  );
}

export default App;