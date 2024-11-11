import { useContext } from 'react';
import {
  AdventureType,
  PageType,
  SiteContext,
} from '../utlities/context/site-context';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { exampleGame, GameProps } from '../utlities/GameProps';

export interface ApiResponse {
  response: string;
}
export const Intro: React.FC = () => {
  const { setPage, setAdventure, setGame } = useContext(SiteContext);
  const navigate = useNavigate();

  const handleButtonClick = async (e: any, adventure: AdventureType) => {
    e.preventDefault();
    setPage(PageType.Adventure);
    setAdventure(adventure);
    let newGame: GameProps = exampleGame;
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
    //   setGame(newGame);
    // } catch (error) {
    //   console.error('Error fetching response:', error);
    //   return; // Exit the function if there is an error
    // }

    if (newGame) {
      //   const currentRoom = newGame.rooms[0];
      //   try {
      //     const response = await axios.post('/api/generateGameImage', {
      //       roomDescription: currentRoom.description,
      //     });

      //     const imageUrl = response.data.imageUrl;
      //     currentRoom.image = imageUrl;

      //     console.log('Generated Image URL:', imageUrl);
      //   } catch (error) {
      //     console.error('Error fetching image:', error);
      //   }
      // }

      setGame(newGame);
      navigate(`/${PageType.Adventure}`);
    }
  };

  return (
    <div className="Intro-root">
      <h2>Where does your adventure begin?</h2>
      <div className="Intro-buttons">
        <button onClick={(e) => handleButtonClick(e, AdventureType.Dungeon)}>
          Dungeon
        </button>
      </div>
    </div>
  );
};
