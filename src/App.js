import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopNavBar from './components/TopNavBar';
import SideNavBar from './components/SideNavBar';
import Soundscapes from './components/Soundscapes';
import DimensionalMap from './components/DimensionalMap';
import Compendium from './components/Compendium';
import BattleManager from './components/BattleManager';

function App() {
  return (
    <BrowserRouter>
    <div className="App d-flex">
      <SideNavBar />
      <div className="content flex-grow-1">
        <TopNavBar />
        <Routes>
          <Route path="/soundscapes" element={<Soundscapes />} />
          <Route path="/dimensional-map" element={<DimensionalMap />} />
          <Route path="/compendium" element={<Compendium />} />
          <Route path="/battle-manager" element={<BattleManager />} />
        </Routes>
        <div className="container-fluid">
          <div className="row">
            <main className="col px-md-4">
              <div className="pt-3">
                <h1>Welcome to Dungeon Admin</h1>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
    </BrowserRouter>
  );
}

export default App;