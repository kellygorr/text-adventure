import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Map } from './Map';
import { ApiResponse } from '../Intro/Intro';
import './Adventure.scss';
import {
  getAdventureTypeFromEnum,
  getAdventureTypeFromStr,
  SiteContext,
} from '../utilities/context/site-context';
import {
  ActionResponse,
  ActionType,
  ExitProps,
  ItemProps,
} from '../utilities/GameProps';
import { useNavigate } from 'react-router-dom';
import { getRandomItemImage } from '../utilities/GameData';
import { determineAction, determineActionDetails } from './determineAction';

export const Adventure: React.FC = () => {
  const {
    game,
    currentRoom,
    inventory,
    setInventory,
    setCurrentRoomId,

    adventure,
    setGame,
    setIsInventoryOpen,
    loading,
    setLoading,
    roomImages,
    setRoomImages,
    gameStorage,
    removeItemFromRoom,
    markObstacleAsCompleted,
  } = useContext(SiteContext);
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [preload, setPreload] = useState<boolean>(true);
  const navigate = useNavigate();
  const [responseLoading, setResponseLoading] = useState<boolean>(false);

  // determine active exit user is working on
  const [currentExit, setCurrentExit] = useState<ExitProps | null>(null);

  const [currentItem, setCurrentItem] = useState<ItemProps | null>(null);
  const [prevExit, setPrevExit] = useState<number | null>(null);
  const [isEscaping, setIsEscaping] = useState<boolean>(false);

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
          setCurrentRoomId(1);
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
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!game || responseLoading) {
      console.error('Game not found');
      return;
    }

    if (!prompt || prompt.trim() === '') {
      console.error('Empty prompt');
      setResponseLoading(true);
      const newMessages = [
        ...messages,
        { role: 'system', content: 'Look at me load!' },
      ];

      setMessages(newMessages);

      setTimeout(() => {
        setResponseLoading(false);

        const newMessages = [
          ...messages,
          { role: 'system', content: 'Look at me load!' },
          { role: 'system', content: 'Loading completed' },
        ];
        setMessages(newMessages);
        return null;
      }, 5000);
    } else {
      // clear input
      setPrompt('');

      let newMessages = [...messages, { role: 'user', content: prompt }];

      console.log('determineActionDetails');
      console.log('currentExit:', currentExit);
      console.log('currentRoom:', currentRoom);

      const details: determineActionDetails = determineAction({
        prompt,
        currentExit,
        currentRoom,
        inventory,
        prevExit,
        currentItem,
        game,
      });

      console.log('details:', details);
      console.log('details Required item:', details.requiredItem);

      // Update current Exit
      if (details.actionType === ActionType.UseItemSuccess && details.exit) {
        setCurrentExit({
          ...details.exit,
          hasObstacle: null,
        });
      } else {
        setCurrentExit(details.exit);
      }

      setCurrentItem(details.item);
      if (details.actionType === ActionType.EscapeGame) {
        setIsInventoryOpen(false);
        setLoading(true);
        setIsEscaping(true);
      } else {
        setResponseLoading(true);
      }

      try {
        const message = {
          messages: newMessages,
          room: currentRoom,
          details,
          inventory: inventory.slice(1), // remove first Empty object from inventory
          theme: game.theme,
        };

        console.log('MESSAGE---', message);

        const result = await axios.post<ApiResponse>(
          'http://localhost:5001/api/playerAction',
          {
            ...message,
          },
        );

        console.log('RESULT:', result);
        const response = result.data.response;
        let parsed: ActionResponse;

        try {
          parsed = JSON.parse(response) as ActionResponse;
        } catch (error) {
          console.error('Invalid JSON response, applying fallback:', response);

          // Try to extract the JSON part if it's wrapped in "[OUTPUT]: {...}"
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          console.log('JSON MATCH:', jsonMatch);

          try {
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]) as ActionResponse;
            } else {
              parsed = {
                actionSummary: response, // Assume response is just a string
                playerPrompt: 'What will you do next?',
              };
            }
          } catch (error) {
            parsed = {
              actionSummary: response, // Assume response is just a string
              playerPrompt: 'What will you do next?',
            };
          }
        }

        console.log('PARSED:', parsed);
        game.characterPrompt = parsed.playerPrompt;

        if (details.actionType === ActionType.Investigate) {
          console.log('----Investigate');
        } else if (details.actionType === ActionType.PickUpItemSuccess) {
          console.log('PICK UP ITEM????', details.item);

          if (details.item) {
            // remove item from room
            removeItemFromRoom(details.item.itemId);

            // Set random image for inventory item
            details.item.image = getRandomItemImage(
              details.item.name,
              getAdventureTypeFromStr(game.theme),
            );
            setInventory([...inventory, details.item]);
            setIsInventoryOpen(true);
            parsed.actionSummary = `${parsed.actionSummary}`;
          } else {
            console.error('No items found in response');
            parsed.actionSummary = `Oops it slipped out of your hands, try picking it up again!`;
          }
        } else if (details.actionType === ActionType.UseItemSuccess) {
          console.log('----UseItemSuccess');
          if (details.item && details.obstacle?.obstacleId) {
            console.log('markObstacleAsCompleted');
            // need to update currentObstacle and current exit
            markObstacleAsCompleted(details.obstacle?.obstacleId);
            // remove item from inventory
            const newInventory = inventory.filter(
              (item) => item.itemId !== details.item?.itemId,
            );
            setInventory(newInventory);

            parsed.actionSummary = `${parsed.actionSummary} Item removed from inventory!`;
          } else {
            console.error('No items found in response');
          }
        } else if (details.actionType === ActionType.LookAtInventory) {
          console.log('----LookAtInventory');
          if (inventory.length === 1) {
            parsed.actionSummary = 'Inventory is empty';
          } else {
            parsed.actionSummary = `Inventory: ${inventory.map((item) => item.name)}`;
            setIsInventoryOpen(true);
          }
        } else if (details.actionType === ActionType.GoBackToPreviousRoom) {
          console.log('----GoBackToPreviousRoom');
          if (currentRoom?.roomId !== undefined) {
            setPrevExit(currentRoom.roomId);
          }

          if (prevExit !== null) {
            setLoading(true);
            setCurrentRoomId(prevExit);
          }
        } else if (details.actionType === ActionType.ExitRoomSuccess) {
          console.log('Exit success');
          console.log('Exiting to room:', details.exit?.roomId);

          if (currentRoom?.roomId !== undefined) {
            console.log('Setting prevExit----:', currentRoom.roomId);
            setPrevExit(currentRoom.roomId);
          }
          setIsInventoryOpen(false);
          setLoading(true);
          setCurrentRoomId(details.exit?.roomId as number);
        } else if (details.actionType === ActionType.EscapeGame) {
          console.log('You win!');

          setTimeout(() => {
            navigate(`/${getAdventureTypeFromEnum(adventure)}/end`);
          }, 2000);
        } else {
          console.log('----Basic response');
        }

        newMessages = [
          ...newMessages,
          { role: 'system', content: parsed.actionSummary },
        ];

        setMessages(newMessages);
      } catch (error) {
        console.error('Error:', error, (error as any)?.status);
        if ((error as any)?.status === 429) {
          setMessages([
            ...messages,
            {
              role: 'system',
              content: '🚨 looks like there have been too many requests',
            },
          ]);
        } else {
          setMessages([
            ...messages,
            { role: 'system', content: '🚨 Oops you need to start the server' },
          ]);
        }
      } finally {
        // console.log('set loading false Adventure.tsx');
        setResponseLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className={isEscaping ? 'Adventure-root escapeGame' : 'Adventure-root'}
    >
      <div
        className={
          isEscaping ? 'Adventure-content escapeGame' : 'Adventure-content'
        }
      >
        <Map
          loading={loading}
          response={messages[messages.length - 1]?.content}
          messages={messages}
          responseLoading={responseLoading}
          currentRoom={currentRoom}
          roomImage={roomImages.find(
            (room) => room.roomId === currentRoom?.roomId,
          )}
        />
      </div>

      <div
        className={
          loading && currentRoom?.roomId === 1
            ? 'Adventure-formWrapper'
            : 'Adventure-formWrapper open'
        }
      >
        <div
          className={
            !responseLoading
              ? 'Adventure-prompt Intro-title'
              : 'Adventure-prompt Intro-title disabled'
          }
        >
          {game?.characterPrompt}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className={
              !responseLoading ? 'Adventure-input' : 'Adventure-input disabled'
            }
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            className={responseLoading ? 'basicButton disabled' : 'basicButton'}
          >
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
