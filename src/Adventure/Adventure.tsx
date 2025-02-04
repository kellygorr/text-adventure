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
  ItemProps,
  ObstacleProps,
  RoomProps,
} from '../utilities/GameProps';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { getRandomItemImage } from '../utilities/GameData';

export const Adventure: React.FC = () => {
  const {
    game,
    currentRoom,
    inventory,
    setInventory,
    setCurrentRoom,
    adventure,
    setGame,
    isInventoryOpen,
    setIsInventoryOpen,
    loading,
    setLoading,
    roomImages,
    setRoomImages,
    gameStorage,
  } = useContext(SiteContext);
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [preload, setPreload] = useState<boolean>(true);
  const navigate = useNavigate();
  const [responseLoading, setResponseLoading] = useState<boolean>(false);

  useEffect(() => {
    // We need to wait until gameStorage is loaded before we can begin
    if (gameStorage) {
      setPreload(false);
    }
  }, [gameStorage]);
  //recover game from local storage
  useEffect(() => {
    console.log('ADVENTURE??????');
    setLoading(true);
    // if game is set we are coming from intro page
    if (!game) {
      const adventureString = getAdventureTypeFromEnum(adventure);
      const adventureData = gameStorage && gameStorage[adventureString]?.game;
      const adventureImages =
        gameStorage && gameStorage[adventureString]?.images;

      if (!preload) {
        if (adventureData && adventureImages) {
          setGame(adventureData);
          setRoomImages(adventureImages);
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
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!game) {
      console.error('Game not found');
      return;
    }

    // clear input
    setPrompt('');
    setResponseLoading(true);
    let newMessages = [...messages, { role: 'user', content: prompt }];
    console.log('currentRoom:', currentRoom);
    try {
      const result = await axios.post<ApiResponse>(
        'http://localhost:5001/api/playerAction',
        {
          messages: newMessages,
          room: currentRoom,
          inventory: inventory.slice(1), // remove first Empty object from inventory
          theme: game.theme,
        },
      );

      console.log('RESULT:', result);
      const response = result.data.response;
      const parsed = JSON.parse(response) as ActionResponse;
      console.log('PARSED:', parsed);
      game.characterPrompt = parsed.characterPrompt;

      let myItem: ItemProps | null = parsed.item
        ? parsed.item
        : parsed.inventoryItem;

      let myObstacle: ObstacleProps | null = parsed.obstacle;

      console.log('ACTIONTYPE:------', parsed.actionType);
      console.log('MY ITEMS:', myItem);
      if (parsed.actionType === ActionType.Investigate) {
        console.log('----Investigate');
      } else if (parsed.actionType === ActionType.PickUpItemSuccess) {
        console.log('PICK UP ITEM????');

        // The AI is returning the wrong item.  Determine which item matches what the AI is returning.
        // Use the strings in myItem.name to determine what inventory item to add.
        // The name may not match exactly, so you may need to use a partial match.

        if (myItem) {
          // get name substrings
          const nameParts = myItem.name.split(' ');
          const myInventory = currentRoom?.items.find((item) => {
            // check if item name includes all name parts
            return nameParts.find((part) => {
              return item.name.includes(part);
            });
          });

          if (myInventory) {
            myInventory.image = getRandomItemImage(
              myInventory.name,
              getAdventureTypeFromStr(game.theme),
            );

            console.log('New inventory:', myInventory);

            setInventory([...inventory, myInventory]);
            parsed.response = `${parsed.response}`;
          }
        } else {
          console.error('No items found in response');
          parsed.response = `Oops it slipped out of your hands, try picking it up again!`;
        }
      } else if (parsed.actionType === ActionType.UseItemSuccess) {
        // The AI is returning the wrong item.  Determine which item matches what the AI is returning.
        // Use the strings in myItem.name to determine what inventory item to add.
        // The name may not match exactly, so you may need to use a partial match.

        if (myItem) {
          // get name substrings
          const nameParts = myItem.name.split(' ');
          const myInventory = currentRoom?.items.find((item) => {
            // check if item name includes all name parts
            return nameParts.find((part) => {
              return item.name.includes(part);
            });
          });

          if (myInventory) {
            const newInventory = inventory.filter(
              (item) => myInventory?.itemId !== item.itemId,
            );
            console.log('New inventory:', newInventory);
            /** Update game room obstacle */
            const newRoom = currentRoom && {
              ...currentRoom,
              obstacle: currentRoom.obstacle
                ? currentRoom.obstacle.map((obstacle) => ({
                    ...obstacle,
                    isCompleted: obstacle.obstacleId === myObstacle?.obstacleId,
                  }))
                : [],
            };
            console.log('New room:', newRoom);

            // Find the index where the new room should be inserted
            const roomIndex =
              newRoom && game.rooms.findIndex((room) => room.id > newRoom?.id);
            console.log('Room index:', roomIndex);

            // // remove room in game and add new room to game
            // game.rooms = game.rooms.filter((room) => room.id !== newRoom?.id);

            // // Add new room in order of room id
            // if (roomIndex && roomIndex >= 0) {
            //   game.rooms = [
            //     ...game.rooms.slice(0, roomIndex),
            //     newRoom,
            //     ...game.rooms.slice(roomIndex),
            //   ] as RoomProps[];
            // }
            // console.log('New room:', newRoom);
            // setGame(game);
            // setCurrentRoom(newRoom as RoomProps);
            // setInventory(newInventory);

            parsed.response = `${parsed.response} Item removed from inventory!`;
          }
        } else {
          console.error('No items found in response');
        }
      } else if (parsed.actionType === ActionType.LookAtInventory) {
        console.log('----LookAtInventory');
        if (inventory.length === 1) {
          parsed.response = 'Inventory is empty';
        } else {
          parsed.response = `Inventory: ${inventory.map((item) => item.name)}`;
          setIsInventoryOpen(true);
        }
      } else if (parsed.actionType === ActionType.ExitRoomSuccess) {
        console.log('----ExitRoom', parsed.exit);
        if (parsed?.exit?.roomId === 'exit door') {
          console.log('You win!');
        } else {
          console.log('Exit room');
          const roomId = Number(parsed?.exit?.roomId);
          console.log('Exiting to room:', roomId);
          const nextRoom = game?.rooms.find((room) => room.id === roomId);
          if (nextRoom) {
            setLoading(true);
            setCurrentRoom(nextRoom);
          }
        }
      } else {
        console.log('----Basic response');
      }

      newMessages = [
        ...newMessages,
        { role: 'system', content: parsed.response },
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
          loading={loading}
          setLoading={(isLoading) => {
            console.log('set loading!!!!!!', isLoading);
            setLoading(isLoading);
          }}
          response={messages[messages.length - 1]?.content}
          messages={messages}
          responseLoading={responseLoading}
          currentRoom={currentRoom}
          roomImage={roomImages.find((room) => room.roomId === currentRoom?.id)}
        />
      </div>

      <div className="Adventure-formWrapper">
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
