import { useContext, useEffect, useRef, useState } from 'react';
import {
  getAdventureTypeFromEnum,
  SiteContext,
} from '../utilities/context/site-context';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import axios from 'axios';
import {
  GameProps,
  RoomProps,
  RoomImageProps,
  AdventureType,
} from '../utilities/GameProps';
import './Intro.scss';
import '../utilities/styles/Button.scss';
import '../utilities/styles/Loading.scss';
import React from 'react';
import { Prologue } from './Prologue';
import { adventuresData, exampleGame } from '../utilities/GameData';
import { Settings } from './Settings';
import SettingsIcon from '../assets/images/icons/settings.svg';

export interface ApiResponse {
  response: string;
}

interface Props {
  activeAdventure: AdventureType;
  setActiveAdventure: (adventure: AdventureType) => void;
}

export const Intro: React.FC<Props> = ({
  activeAdventure,
  setActiveAdventure,
}) => {
  const {
    setAdventure,
    setGame,
    loading,
    setLoading,
    setRoomImages,
    settings,
    setSettings,
    gameStorage,
    setCurrentRoomId,
  } = useContext(SiteContext);
  const characterRef = React.useRef<HTMLImageElement>(null);
  const [prologueReady, setPrologueReady] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const prevLocation = useRef<string | null>(null);

  useEffect(() => {
    console.log('Intro useEffect');
    // Ignore first render and refreshes
    if (!prevLocation.current) {
      setLoading(false);
      prevLocation.current = location.pathname;
      return;
    }
    /** User clicked the "go back" button */
    if (
      navigationType === 'POP' &&
      prevLocation.current !== location.pathname
    ) {
      console.log('User clicked the "go back" button');
      setLoading(false);
      setPrologueReady(false);
    }
  }, [navigationType, location, setLoading, loading]);

  const handleButtonClick = async (
    e: any,
    selectedAdventure: AdventureType,
  ) => {
    e.preventDefault();
    setActiveAdventure(selectedAdventure);
    setLoading(true);

    const adventureString = getAdventureTypeFromEnum(selectedAdventure);
    const adventureData = gameStorage && gameStorage[adventureString]?.game;
    const adventureImages = gameStorage && gameStorage[adventureString]?.images;
    // Only use stored data if both game and images are found
    if (adventureData && adventureImages) {
      setGame(adventureData);
      setRoomImages(adventureImages);
      setCurrentRoomId(1);

      setTimeout(() => {
        console.log('Prologue ready 1');
        setLoading(false);
        setPrologueReady(true);
      }, 2000);
    } else {
      /** Create Game with AI */
      let newGame: GameProps = exampleGame;
      // setGame(newGame);
      // try {
      //   const result = await axios.post<ApiResponse>(
      //     'http://localhost:5001/api/generateGame',
      //     {
      //       messages: [
      //         {
      //           role: 'user',
      //           content: `Generate a text adventure game.  Theme: escape the dungeon.`,
      //         },
      //       ],
      //     },
      //   );
      //   const response = result.data.response;
      //   newGame = JSON.parse(response) as GameProps;
      //   newGame.theme = getAdventureType(adventure);
      //   setGame(newGame);
      // } catch (error) {
      //   console.error('Error fetching response:', error);
      //   return; // Exit the function if there is an error
      // }

      // Setup game
      setGame(newGame);
      setCurrentRoomId(1);
      // Save game to local storage
      localStorage.setItem(
        'adventure-text-' + newGame?.theme,
        JSON.stringify(newGame),
      );

      /** Create an ai image for each room based on the room description */
      newGame.rooms.map(async (currentRoom: RoomProps) => {
        try {
          const response = await axios.post('/api/generateGameImage', {
            roomDescription: currentRoom.description,
            adventureType: selectedAdventure,
          });

          const imageUrl = response.data.imageUrl;
          console.log('ROOM:', Number(currentRoom.roomId));
          console.log('Image URL:', imageUrl);
          setRoomImages((prevRoomImages: RoomImageProps[]) => {
            return [
              ...prevRoomImages,
              {
                roomId: Number(currentRoom.roomId),
                image: imageUrl as string,
              },
            ];
          });
        } catch (error) {
          console.error('Error fetching image:', error);
        }
      });

      setTimeout(() => {
        console.log('Prologue ready 2');
        setLoading(false);
        setPrologueReady(true);
      }, 3000);
    }
  };

  const handleBegin = () => {
    setLoading(true);
    setAdventure(activeAdventure);
    navigate(`/${getAdventureTypeFromEnum(activeAdventure)}`);
  };

  return (
    <div className="Intro-root">
      <div className="Intro-content Intro-darkBackground">
        <img
          ref={characterRef}
          className={
            loading
              ? 'Intro-character' +
                ' Intro-centerCharacter' +
                adventuresData[activeAdventure].type
              : prologueReady
                ? 'Intro-characterPrologue'
                : 'Intro-character'
          }
          src={adventuresData[activeAdventure].character}
          alt="character"
        />
        {loading && (
          <div className="Intro-loadingTitle">
            Loading adventure
            <div className="stage">
              <div className="dot-pulse"></div>
            </div>
          </div>
        )}

        <div
          className={
            settings ? `Intro-settings Intro-settingsOpen` : 'Intro-settings'
          }
          onClick={() => {
            setSettings(!settings);
          }}
        >
          <img src={SettingsIcon} alt="settings" />
        </div>

        <div
          className="Intro-contentWrapper"
          style={{
            opacity: loading ? 0 : 1,
            pointerEvents: loading ? 'none' : 'all',
          }}
        >
          {prologueReady && !settings && <Prologue begin={handleBegin} />}
          {settings && <Settings setPrologueReady={setPrologueReady} />}
          <div
            style={{
              opacity: prologueReady || loading || settings ? 0 : 1,
              pointerEvents:
                prologueReady || loading || settings ? 'none' : 'all',
            }}
            className="Intro-contentWrapper"
          >
            <h2 className="Intro-title">Where does your adventure begin?</h2>
            <div className="Intro-buttons">
              {adventuresData.map((data, index) => (
                <button
                  className={
                    Number(activeAdventure) === index
                      ? 'active btn-1 buttonStyle'
                      : 'btn-1 buttonStyle'
                  }
                  key={data.type}
                  onMouseOver={(e) => {
                    setActiveAdventure(index);
                  }}
                  onClick={(e) => handleButtonClick(e, data.type)}
                >
                  <span>{getAdventureTypeFromEnum(data.type)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
