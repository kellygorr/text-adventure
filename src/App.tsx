import React, { useContext, useEffect, useRef, useState } from 'react';

import './App.scss';
import './utilities/styles/Particle.scss';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Intro } from './Intro/Intro';
import { Adventure } from './Adventure/Adventure';
import {
  getAdventureTypeFromEnum,
  SiteContext,
} from './utilities/context/site-context';
import DawnofChange from './assets/audio/dawnofchange.mp3';
import { adventuresData, EscapeGameRoom } from './utilities/GameData';
import { AdventureType } from './utilities/GameProps';
import { End } from './End/End';

const requiredFonts = [
  '400 1rem "Bubblegum Sans"',
  '400 1rem "Patrick Hand"',
  '400 1rem "Tektur"',
  '400 1rem "Tourney"',
];
const fontLoadingFadeOutMs = 300;

const App: React.FC = () => {
  const {
    isSoundOn,
    setIsSoundOn,
    settings,
    currentRoom,
    roomImages,
    loading,
  } = useContext(SiteContext);
  /**  Temporary active adventure for intro screen to switch between themes */
  const [activeAdventure, setActiveAdventure] = useState(AdventureType.Dungeon);
  const adventureString = getAdventureTypeFromEnum(activeAdventure);
  const [isEndGame, setIsEndGame] = useState(false);
  const [areFontsReady, setAreFontsReady] = useState(false);
  const [isFontLoadingVisible, setIsFontLoadingVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (areFontsReady) {
      return;
    }

    let isMounted = true;
    const fontsReady =
      typeof document !== 'undefined' && 'fonts' in document
        ? Promise.allSettled(
            requiredFonts.map((font) => document.fonts.load(font)),
          ).then(() => document.fonts.ready)
        : Promise.resolve();
    fontsReady.finally(() => {
      if (isMounted) {
        setAreFontsReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [areFontsReady]);

  useEffect(() => {
    if (!areFontsReady) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsFontLoadingVisible(false);
    }, fontLoadingFadeOutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [areFontsReady]);

  useEffect(() => {
    if (currentRoom?.roomId === EscapeGameRoom) {
      setIsEndGame(true);
    } else {
      setIsEndGame(false);
    }
  }, [currentRoom]);

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
          opacity:
            location.pathname === '/' || (isEndGame && !loading)
              ? settings
                ? 0.5
                : 1
              : 0,
          backgroundImage: isEndGame
            ? `url(${roomImages.find((image) => image.roomId === EscapeGameRoom)?.image})`
            : `url(${adventuresData[activeAdventure].background})`,
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
        <Route path={`/${adventureString}/end`} element={<End />} />
      </Routes>
      {isFontLoadingVisible && (
        <div
          className={`App-fontLoading${areFontsReady ? ' App-fontLoadingFadeOut' : ''}`}
          role="status"
          aria-live="polite"
        >
          <div className="App-fontLoadingPanel">
            <div className="App-fontLoadingTitle">Loading text adventure</div>
            <div className="App-fontLoadingText">Preparing fonts...</div>
          </div>
        </div>
      )}
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
