import React, { useContext, useRef, useState } from 'react';

import './App.scss';
import './utilities/styles/Particle.scss';
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import { Intro } from './Intro/Intro';
import { Adventure } from './Adventure/Adventure';
import {
  getAdventureTypeFromEnum,
  SiteContext,
} from './utilities/context/site-context';
import DawnofChange from './assets/audio/dawnofchange.mp3';
import { adventuresData } from './utilities/GameData';
import { AdventureType } from './utilities/GameProps';

const App: React.FC = () => {
  const { isSoundOn, setIsSoundOn, settings } = useContext(SiteContext);
  /**  Temporary active adventure for intro screen to switch between themes */
  const [activeAdventure, setActiveAdventure] = useState(AdventureType.Dungeon);
  const adventureString = getAdventureTypeFromEnum(activeAdventure);
  const audioRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();

  const handleAudioClick = () => {
    setIsSoundOn((prev: boolean) => {
      const newIsSoundOn = !prev;

      if (audioRef.current) {
        if (newIsSoundOn) {
          audioRef.current.play();
          audioRef.current.volume = 0.05;
        } else {
          audioRef.current.pause();
        }
      }

      return newIsSoundOn;
    });
  };

  return (
    <div className="App-root">
      <div
        className="App-background"
        style={{
          opacity: location.pathname === '/' ? (settings ? 0.5 : 1) : 0,
          backgroundImage: `url(${adventuresData[activeAdventure].background})`,
        }}
      />
      <div className="particle-container">{renderParticles()}</div>

      <header>
        <div className="App-banner Intro-darkBackground">
          <h1>
            adventure<span>text</span>
          </h1>
          <div className="App-gameName">
            Escape the{' '}
            <div key={'location-' + adventureString} className="App-location">
              {adventureString}
            </div>
          </div>
        </div>
      </header>
      <div className="App-settingsWrapper">
        <div
          className="App-sound Intro-darkBackground"
          aria-label="Music I Use: Bensound.com/free-music-for-videos.  License code: AJF4CNXUVROVZ8WL"
          onClick={handleAudioClick}
        >
          Sound:{' '}
          {isSoundOn ? 'On' : <span style={{ letterSpacing: '1px' }}>Off</span>}
          <audio ref={audioRef} src={DawnofChange} loop />
        </div>
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <Intro
              activeAdventure={activeAdventure}
              setActiveAdventure={setActiveAdventure}
            />
          }
        />
        <Route path={`/${adventureString}`} element={<Adventure />} />
      </Routes>
    </div>
  );
};

export default App;

const renderParticles = () => {
  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push(<div key={i} className="particle" />);
  }
  return particles;
};
