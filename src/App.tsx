import React, { useContext, useRef } from 'react';

import './App.scss';
import './utilities/styles/Particle.scss';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { adventuresData, Intro } from './Intro/Intro';
import { Adventure } from './Adventure/Adventure';
import {
  getAdventureTypeFromEnum,
  SiteContext,
} from './utilities/context/site-context';
import DawnofChange from './assets/audio/dawnofchange.mp3';

const App: React.FC = () => {
  const { adventure, isSoundOn, setIsSoundOn } = useContext(SiteContext) as {
    adventure: any;
    isSoundOn: boolean;
    setIsSoundOn: React.Dispatch<React.SetStateAction<boolean>>;
  };
  const adventureString = getAdventureTypeFromEnum(adventure);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    <div
      className="App-root"
      style={{
        backgroundImage: `url(${adventuresData[adventure].background})`,
      }}
    >
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

      <div
        className="App-sound Intro-darkBackground"
        aria-label="Music I Use: Bensound.com/free-music-for-videos.  License code: AJF4CNXUVROVZ8WL"
        onClick={handleAudioClick}
      >
        Sound:{' '}
        {isSoundOn ? 'On' : <span style={{ letterSpacing: '1px' }}>Off</span>}
        <audio ref={audioRef} src={DawnofChange} loop />
      </div>

      <div className="App-content">
        <Router>
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path={`/${adventureString}`} element={<Adventure />} />
          </Routes>
        </Router>
      </div>
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
