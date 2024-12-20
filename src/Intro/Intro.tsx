import { useContext, useState } from 'react';
import {
  getAdventureTypeFromEnum,
  SiteContext,
} from '../utilities/context/site-context';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GameProps } from '../utilities/GameProps';
import './Intro.scss';
import '../utilities/styles/Button.scss';
import '../utilities/styles/Loading.scss';
import React from 'react';
import { Prologue } from './Prologue';
import { adventuresData, exampleGame } from '../utilities/GameData';

export interface ApiResponse {
  response: string;
}

export const Intro: React.FC = () => {
  const { setAdventure, setGame, adventure, loading, setLoading } =
    useContext(SiteContext);
  const characterRef = React.useRef<HTMLImageElement>(null);
  const [prologueReady, setPrologueReady] = useState(false);
  const navigate = useNavigate();

  const handleButtonClick = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    /** Create Game with AI */
    let newGame: GameProps = exampleGame;
    setGame(newGame);
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

    /** Create Room 1 image with AI */
    const currentRoom = newGame.rooms[0];
    if (newGame && currentRoom) {
      // try {
      //   const response = await axios.post('/api/generateGameImage', {
      //     roomDescription: currentRoom.description,
      //     adventureType: adventure,
      //   });

      //   const imageUrl = response.data.imageUrl;
      //   currentRoom.image = imageUrl;

      //   console.log('Generated Image URL:', imageUrl);
      // } catch (error) {
      //   console.error('Error fetching image:', error);
      // }

      setGame(newGame);
      setTimeout(() => {
        console.log('set loading false');
        setLoading(false);
        setPrologueReady(true);
      }, 1000);
    }
  };

  const handleBegin = () => {
    navigate(`/${getAdventureTypeFromEnum(adventure)}`);
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
                adventuresData[adventure].type
              : prologueReady
                ? 'Intro-characterPrologue'
                : 'Intro-character'
          }
          src={adventuresData[adventure].character}
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
          className="Intro-contentWrapper"
          style={{
            opacity: loading ? 0 : 1,
            pointerEvents: loading ? 'none' : 'all',
          }}
        >
          {prologueReady && <Prologue begin={handleBegin} />}

          <div
            style={{
              opacity: prologueReady || loading ? 0 : 1,
              pointerEvents: prologueReady || loading ? 'none' : 'all',
            }}
            className="Intro-contentWrapper"
          >
            <h2 className="Intro-title">Where does your adventure begin?</h2>
            <div className="Intro-buttons">
              {adventuresData.map((data, index) => (
                <button
                  className={
                    Number(adventure) === index
                      ? 'active btn-1 buttonStyle'
                      : 'btn-1 buttonStyle'
                  }
                  key={data.type}
                  onMouseOver={(e) => {
                    setAdventure(index);
                  }}
                  onClick={(e) => handleButtonClick(e)}
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
