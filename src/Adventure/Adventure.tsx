import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Map } from './Map';
import { ApiResponse } from '../Intro/Intro';
import './Adventure.scss';
import {
  getAdventureTypeFromStr,
  SiteContext,
} from '../utilities/context/site-context';
import { ActionResponse, ActionType, GameProps } from '../utilities/GameProps';
import { useNavigate } from 'react-router-dom';

export const Adventure: React.FC = () => {
  const {
    game,
    currentRoom,
    inventory,
    setInventory,
    setCurrentRoom,
    setGame,
    setAdventure,
  } = useContext(SiteContext);
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const navigate = useNavigate();
  const [response, setResponse] = useState<string>('');
  const [responseLoading, setResponseLoading] = useState<boolean>(false);

  useEffect(() => {
    // If there's no game data, check local storage
    if (!game) {
      const urlParams = window.location.pathname.split('/');
      const adventure = urlParams[urlParams.length - 1];

      setAdventure(getAdventureTypeFromStr(adventure));

      const gameString = localStorage.getItem('adventure-text-' + adventure);

      if (gameString) {
        const gameData = JSON.parse(gameString) as GameProps;
        setGame(gameData);
        // Optionally set the first room if needed
        // setCurrentRoom(gameData.rooms[0]);
      } else {
        console.error('No game data found in local storage');
        navigate(`/`);
      }
    }
  }, [game, setAdventure, setGame, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('set loading true');
    setResponseLoading(true);
    const newMessages = [...messages, { role: 'user', content: prompt }];
    try {
      const result = await axios.post<ApiResponse>(
        'http://localhost:5001/api/playerAction',
        {
          messages: newMessages,
          room: currentRoom,
          inventory: inventory,
        },
      );

      const response = result.data.response;
      const parsed = JSON.parse(response) as ActionResponse;
      if (game) game.characterPrompt = parsed.characterPrompt;
      if (
        parsed.addItemsToInventory?.length > 0 &&
        parsed.actionType === ActionType.PickUp
      ) {
        setInventory([...inventory, ...parsed.addItemsToInventory]);
        parsed.response = `${parsed.response} Item added to inventory!`;
      } else if (parsed.actionType === ActionType.LookAtInventory) {
        if (inventory.length === 0) {
          parsed.response = 'Inventory is empty';
        } else {
          parsed.response = `Inventory: ${inventory.map((item) => item.item)}`;
        }
      } else if (
        game &&
        parsed.actionType === ActionType.ExitRoom &&
        parsed.exit
      ) {
        if (parsed.exit.roomId === 'exit door') {
          console.log('Game over');
        } else {
          const roomId = Number(parsed.exit.roomId);
          console.log('Exiting to room:', roomId);
          setCurrentRoom(game.rooms[roomId]);
        }
      }

      console.log('Parsed:', parsed);
      setMessages(newMessages);
      setResponse(parsed.response);
    } catch (error) {
      setResponse('🚨 Oops you need to start the server');
      console.error('Error fetching response:', error);
    } finally {
      console.log('set loading false Adventure.tsx');
      setResponseLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="Adventure-root">
      <div className="Adventure-content">
        <Map
          response={response}
          loading={responseLoading}
          currentRoom={currentRoom}
        />
      </div>

      <div className="Adventure-formWrapper Intro-darkBackground">
        <div className="Adventure-prompt Intro-title">
          {game?.characterPrompt}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className="Adventure-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" className="basicButton">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
