import { useContext, useEffect, useState } from 'react';
import {
  getAdventureTypeFromEnum,
  SiteContext,
} from '../utilities/context/site-context';
import { useNavigate } from 'react-router-dom';

import './End.scss';
import '../utilities/styles/Button.scss';
import '../utilities/styles/Loading.scss';
import React from 'react';

import { adventuresData, EscapeGameRoom } from '../utilities/GameData';

interface Props {}

export const End: React.FC<Props> = () => {
  const navigate = useNavigate();
  const {
    game,
    currentRoom,
    setCurrentRoomId,
    adventure,
    setGame,
    setLoading,
    setRoomImages,
    gameStorage,
  } = useContext(SiteContext);
  const characterRef = React.useRef<HTMLImageElement>(null);
  const [preload, setPreload] = useState<boolean>(true);

  useEffect(() => {
    // We need to wait until gameStorage is loaded before we can begin
    if (gameStorage) {
      setPreload(false);
    }
  }, [gameStorage]);
  //recover game from local storage
  useEffect(() => {
    // if game is set we are coming from intro page
    if (!game) {
      setLoading(true);
      const adventureString = getAdventureTypeFromEnum(adventure);
      const adventureData = gameStorage && gameStorage[adventureString]?.game;
      const adventureImages =
        gameStorage && gameStorage[adventureString]?.images;

      if (!preload) {
        if (adventureData && adventureImages) {
          setGame(adventureData);
          setRoomImages(adventureImages);
          setCurrentRoomId(EscapeGameRoom);
          setTimeout(() => {
            setLoading(false);
          }, 3000);
        } else {
          console.error('No game data found in local storage');
          navigate(`/`);
        }
      }
    }
  }, [
    gameStorage,
    adventure,
    navigate,
    setLoading,
    setGame,
    setRoomImages,
    preload,
    game,
    setCurrentRoomId,
    currentRoom?.roomId,
  ]);

  useEffect(() => {
    if (currentRoom?.roomId !== EscapeGameRoom) {
      setCurrentRoomId(EscapeGameRoom);
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    }
  }, [currentRoom?.roomId, setCurrentRoomId, setLoading]);

  const handleButtonClick = async (e: any) => {
    navigate('/');
    setCurrentRoomId(1);
    setLoading(true);
  };

  return (
    <div className="Intro-root">
      <div className="Intro-content Intro-darkBackground End-content">
        <img
          ref={characterRef}
          className={'Intro-character'}
          src={adventuresData[adventure].character}
          alt="character"
        />

        <div
          className="Intro-contentWrapper End-contentWrapper"
          style={{
            opacity: currentRoom?.roomId === EscapeGameRoom ? 1 : 0,
            pointerEvents:
              currentRoom?.roomId === EscapeGameRoom ? 'all' : 'none',
          }}
        >
          <h2 className="Intro-title">You escaped!</h2>
          <div>{currentRoom?.description}</div>
          <div className="Intro-buttons">
            <button
              className="active btn-1 buttonStyle"
              onClick={handleButtonClick}
            >
              <span>Main menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
