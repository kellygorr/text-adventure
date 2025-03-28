import React, { useEffect, useMemo } from 'react';
import { useState } from 'react';
import {
  AdventureType,
  GameProps,
  GameStorage,
  ItemProps,
  RoomImageProps,
  RoomProps,
} from '../GameProps';
import { getRandomItemImage } from '../GameData';

interface Props {
  children: React.ReactNode;
}

export enum PageType {
  Start = 'Start',
  Adventure = 'Adventure',
  End = 'End',
}

export const getAdventureTypeFromEnum = (type: AdventureType) => {
  switch (type) {
    case AdventureType.Dungeon:
      return 'dungeon';
    case AdventureType.Forest:
      return 'forest';
    case AdventureType.Castle:
      return 'castle';
  }
};

export const getAdventureTypeFromStr = (type: string) => {
  switch (type) {
    case 'forest':
      return AdventureType.Forest;
    case 'castle':
      return AdventureType.Castle;
    default:
      return AdventureType.Dungeon;
  }
};

type SiteContextProps = {
  /** Storage */
  gameStorage: GameStorage | null;
  setGameStorage: (gameStorage: GameStorage) => void;

  /** App */
  loading: boolean | null;
  setLoading: (loading: boolean | null) => void;
  isSoundOn: boolean;
  setIsSoundOn: React.Dispatch<React.SetStateAction<boolean>>;
  settings: boolean;
  setSettings: (settings: boolean) => void;

  /** Inventory */
  inventory: ItemProps[];
  setInventory: (inventory: ItemProps[]) => void;
  isInventoryOpen: boolean;
  setIsInventoryOpen: (isInventoryOpen: boolean) => void;

  /** Adventure settings */
  adventure: AdventureType;
  setAdventure: (adventure: AdventureType) => void;
  game: GameProps | null;
  setGame: (game: GameProps) => void;
  currentRoom: RoomProps | null;
  setCurrentRoomId: (id: number) => void;
  /** Used to update the final room description */
  setRoomDescription: (id: number, description: string) => void;
  removeItemFromRoom: (itemId: number) => void;
  markObstacleAsCompleted: (obstacleId: number) => void;
  roomImages: RoomImageProps[];
  setRoomImages: (
    roomImages:
      | RoomImageProps[]
      | ((prevRoomImages: RoomImageProps[]) => RoomImageProps[]),
  ) => void;
};

const SiteContext = React.createContext<SiteContextProps>({
  gameStorage: null,
  setGameStorage: () => {},
  loading: null,
  setLoading: () => {},
  isSoundOn: false,
  setIsSoundOn: () => {},
  settings: false,
  setSettings: () => {},
  isInventoryOpen: false,
  setIsInventoryOpen: () => {},
  adventure: AdventureType.Dungeon,
  setAdventure: () => {},
  game: null,
  setGame: () => {},
  currentRoom: null,
  setCurrentRoomId: () => {},
  setRoomDescription: () => {},
  removeItemFromRoom: () => {},
  markObstacleAsCompleted: () => {},
  roomImages: [],
  setRoomImages: () => {},
  inventory: [],
  setInventory: () => {},
});

const SiteProvider = ({ children }: Props) => {
  const [gameStorage, setGameStorage] = useState<GameStorage | null>(null);
  const [adventure, setAdventure] = useState<AdventureType>(
    AdventureType.Dungeon,
  );
  const [game, setGame] = useState<GameProps | null>(null);
  const [roomImages, setRoomImages] = useState<RoomImageProps[]>([]);
  const [loading, setLoading] = useState<boolean | null>(true);
  const [settings, setSettings] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  /** First inventory item is the "empty" item */
  const [inventory, setInventory] = useState<ItemProps[]>([
    {
      itemId: 999,
      name: 'Empty',
      descriptionTags: ['nothing'],
      locationTags: ['nothing'],
      canAddToInventory: true,
      image: getRandomItemImage('empty', AdventureType.Dungeon),
    },
  ]);

  // Check for game data in local storage
  useEffect(() => {
    if (!gameStorage) {
      const storageData: GameStorage = {
        dungeon: null,
        forest: null,
        castle: null,
      };
      // get string array from enum AdventureType
      Object.values(AdventureType)
        .filter((value): value is AdventureType => typeof value === 'string')
        .forEach((adventureType: AdventureType) => {
          const adventureTypeStr = adventureType
            ?.toString()
            .toLowerCase() as keyof GameStorage;

          const gameString = localStorage.getItem(
            'adventure-text-' + adventureTypeStr,
          );
          const imagesString = localStorage.getItem(
            'adventure-text-' + adventureTypeStr + '-images',
          );
          const game = gameString && (JSON.parse(gameString) as GameProps);
          const images =
            imagesString && (JSON.parse(imagesString) as RoomImageProps[]);

          storageData[adventureTypeStr] =
            game && images ? { game, images } : null;
        });

      setGameStorage(storageData);
    }
  }, [gameStorage]);

  // Add room images to local storage when all images are received
  useEffect(() => {
    const receivedAllImages = roomImages.length === game?.rooms.length;
    const theme = game?.theme;
    if (receivedAllImages && theme) {
      localStorage.setItem(
        'adventure-text-' + theme + '-images',
        JSON.stringify(roomImages),
      );
    }
  }, [game, roomImages]);

  /** Derive `currentRoom` dynamically */
  const currentRoom = useMemo(
    () =>
      game?.rooms.find((room) => room.roomId === game.currentRoomId) || null,
    [game?.rooms, game?.currentRoomId],
  );

  /** Update the active room ID */
  const setCurrentRoomId = (id: number) => {
    setGame((prev) => (prev ? { ...prev, currentRoomId: id } : prev));
  };

  /** Update the room description */
  const setRoomDescription = (id: number, description: string) => {
    if (!game) return; // Don't proceed if game is null

    // Update game state by passing the updater function to setGame
    const updatedGame = {
      ...game, // Spread the existing game state
      rooms: game.rooms.map((room) =>
        room.roomId === id ? { ...room, description } : room,
      ),
    } as GameProps;

    setGame(updatedGame);
  };

  const removeItemFromRoom = (itemId: number) => {
    if (!game) return; // Don't proceed if game is null

    // Update game state by passing the updater function to setGame
    const updatedGame = {
      ...game, // Spread the existing game state
      rooms: game.rooms.map((room) =>
        room.roomId === game.currentRoomId
          ? {
              ...room,
              items: room.items
                .map((item) => ({
                  ...item,
                  attachedToItem:
                    item.attachedToItem?.filter(
                      (attachedItem) => attachedItem.itemId !== itemId, // Remove the attached item only
                    ) || [], // Make sure attachedToItem is always an array
                }))
                .filter(
                  (item) =>
                    item.itemId !== itemId || item.attachedToItem?.length > 0, // Only remove parent item if it's the one being removed
                ),
            }
          : room,
      ),
    } as GameProps;
    setGame(updatedGame);
  };

  /** When an obstacle is overcome, mark it as completed */
  const markObstacleAsCompleted = (obstacleId: number) => {
    if (!game) return; // Don't proceed if game is null

    // Update game state by passing the updater function to setGame
    const updatedGame = {
      ...game, // Spread the existing game state
      rooms: game.rooms.map((room) =>
        room.roomId === game.currentRoomId
          ? {
              ...room, // Spread the room object
              // remove the obstacle from the room
              obstacle:
                room.obstacle?.filter(
                  (obstacle) => obstacle.obstacleId !== obstacleId,
                ) || null,
              // Update exits in the room by removing the obstacle (if applicable)
              exits: room.exits.map((exit) =>
                exit.hasObstacle?.obstacleId === obstacleId
                  ? { ...exit, hasObstacle: null }
                  : exit,
              ),
            }
          : room,
      ),
    } as GameProps;
    setGame(updatedGame);
  };

  // check loading state
  useEffect(() => {
    console.log('Loading state:', loading);
  }, [loading]);
  return (
    <SiteContext.Provider
      value={{
        gameStorage,
        setGameStorage,
        loading,
        setLoading,
        settings,
        setSettings,
        isSoundOn,
        setIsSoundOn,
        inventory,
        setInventory,
        isInventoryOpen,
        setIsInventoryOpen,
        adventure,
        setAdventure,
        game,
        setGame,
        currentRoom,
        setCurrentRoomId,
        setRoomDescription,
        removeItemFromRoom,
        markObstacleAsCompleted,
        roomImages,
        setRoomImages,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export { SiteContext, SiteProvider };
