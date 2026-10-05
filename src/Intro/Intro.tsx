import { useContext, useEffect, useRef, useState } from 'react';
import {
  getAdventureTypeFromEnum,
  SiteContext,
} from '../utilities/context/site-context';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import {
  GameProps,
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
import dungeonBackground from '../assets/images/dungeon-background.jpeg';
import dungeonRoom1 from '../assets/images/rooms/dungeon-room1.png';
import dungeonRoom2 from '../assets/images/rooms/dungeon-room2.png';
import dungeonRoom3 from '../assets/images/rooms/dungeon-room3.png';
import dungeonRoom4 from '../assets/images/rooms/dungeon-room4.png';

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

    /**
     * ON-RAILS BUILD: gameStorage is only ever populated under the
     * 'dungeon' key (see the localStorage.setItem below — newGame.theme
     * is always 'dungeon'), so this lookup only ever resolves for a
     * previously-started dungeon playthrough; forest/castle always fall
     * through to the else branch below. That's intentional — the
     * loading screen and Prologue reflect whichever theme the player
     * selected, but the actual game is always the dungeon scripted
     * playthrough (see handleBegin, which forces AdventureType.Dungeon
     * regardless of what was selected here).
     */
    const adventureString = getAdventureTypeFromEnum(selectedAdventure);
    const adventureData = gameStorage && gameStorage[adventureString]?.game;
    const adventureImages = gameStorage && gameStorage[adventureString]?.images;
    // Only use stored data if both game and images are found
    if (adventureData && adventureImages) {
      setGame(adventureData);
      setRoomImages(adventureImages);
      setCurrentRoomId(1);

      setTimeout(() => {
        setLoading(false);
        setPrologueReady(true);
      }, 2000);
    } else {
      /**
       * ON-RAILS BUILD: no AI game/image generation here. The real app's
       * commented-out generateGame call already defaulted to exampleGame
       * (this was also the normal no-AI dev path in the original app),
       * so we just use it directly. Room images are static local art
       * (see dungeonBackground import) instead of one-DALL-E-call-per-room.
       */
      let newGame: GameProps = exampleGame;

      // Setup game
      setGame(newGame);
      setCurrentRoomId(1);
      // Save game to local storage
      localStorage.setItem(
        'adventure-text-' + newGame?.theme,
        JSON.stringify(newGame),
      );

      /**
       * Static room images — no network call, no AI generation cost.
       * Dedicated per-room art (Microsoft Designer, generated from the
       * app's original DALL-E prompt) is added here as it's produced;
       * rooms without dedicated art yet fall back to the shared
       * dungeon-background image.
       */
      const dungeonRoomImages: Record<number, string> = {
        1: dungeonRoom1,
        2: dungeonRoom2,
        3: dungeonRoom3,
        4: dungeonRoom4,
      };
      const staticRoomImages: RoomImageProps[] = newGame.rooms.map(
        (currentRoom) => ({
          roomId: Number(currentRoom.roomId),
          image:
            dungeonRoomImages[Number(currentRoom.roomId)] ?? dungeonBackground,
        }),
      );
      setRoomImages(staticRoomImages);

      setTimeout(() => {
        setLoading(false);
        setPrologueReady(true);
      }, 3000);
    }
  };

  const handleBegin = () => {
    setLoading(true);
    /**
     * ON-RAILS BUILD: only the dungeon has a real scripted playthrough,
     * so gameplay always runs the dungeon adventure regardless of which
     * theme was selected on the intro screen (forest/castle only get
     * their own loading screen + Prologue text, for visual variety).
     */
    setActiveAdventure(AdventureType.Dungeon);
    setAdventure(AdventureType.Dungeon);
    navigate(`/${getAdventureTypeFromEnum(AdventureType.Dungeon)}`);
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
          {prologueReady && !settings && (
            <Prologue
              begin={handleBegin}
              introduction={adventuresData[activeAdventure].introduction}
              beginLabel={
                activeAdventure === AdventureType.Dungeon
                  ? 'Begin Adventure'
                  : 'Begin Dungeon Only'
              }
            />
          )}
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
                  // ON-RAILS BUILD: any theme shows its own loading/prologue
                  // screen, but Begin always starts the dungeon adventure
                  // (see handleBegin) since it's the only scripted game.
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
