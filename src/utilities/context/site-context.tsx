import React, { useEffect } from 'react';
import { useState } from 'react';
import {
  AdventureType,
  GameProps,
  GameStorage,
  ItemProps,
  RoomImageProps,
  RoomProps,
} from '../GameProps';
import Key1 from '../../assets/images/items/dungeon/key1.png';
import Key2 from '../../assets/images/items/key2.png';
import Unknown1 from '../../assets/images/items/unknown1.png';
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
  inventory: Array<ItemProps>;
  setInventory: (inventory: Array<ItemProps>) => void;
  isInventoryOpen: boolean;
  setIsInventoryOpen: (isInventoryOpen: boolean) => void;

  /** Adventure settings */
  adventure: AdventureType;
  setAdventure: (adventure: AdventureType) => void;
  game: GameProps | null;
  setGame: (game: GameProps) => void;
  roomImages: Array<RoomImageProps>;
  setRoomImages: (
    roomImages:
      | Array<RoomImageProps>
      | ((prevRoomImages: Array<RoomImageProps>) => Array<RoomImageProps>),
  ) => void;

  /** Current room */
  currentRoom: RoomProps | null;
  setCurrentRoom: (room: RoomProps) => void;
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
  roomImages: [],
  setRoomImages: () => {},
  currentRoom: null,
  setCurrentRoom: () => {},
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
  const [currentRoom, setCurrentRoom] = useState<RoomProps | null>(null);
  const [loading, setLoading] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  /** First inventory item is the "empty" item */
  const [inventory, setInventory] = useState<ItemProps[]>([
    {
      itemId: 999,
      name: 'Empty',
      location: 'nothing',
      canAddToInventory: true,
      image: getRandomItemImage('empty', AdventureType.Dungeon),
    },
    // {
    //   itemId: 2,
    //   name: 'key',
    //   location: 'on the ground',
    //   canAddToInventory: true,
    //   image: Key1,
    // },
    // {
    //   itemId: 3,
    //   name: 'old key',
    //   location: 'on the ground',
    //   canAddToInventory: true,
    //   image: Key2,
    // },
    // {
    //   itemId: 4,
    //   item: 'Bow',
    //   location: 'on the ground',
    //   canAddToInventory: true,
    //   image: Unknown1,
    // },
  ]);

  // Check for game data in local storage
  useEffect(() => {
    console.log('gameStorage:', gameStorage);
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

          console.log('adventureType:', adventureTypeStr);
          const gameString = localStorage.getItem(
            'adventure-text-' + adventureTypeStr,
          );
          const imagesString = localStorage.getItem(
            'adventure-text-' + adventureTypeStr + '-images',
          );
          const game = gameString && (JSON.parse(gameString) as GameProps);
          const images =
            imagesString && (JSON.parse(imagesString) as RoomImageProps[]);
          console.log('game:', game, images);

          storageData[adventureTypeStr] =
            game && images ? { game, images } : null;
        });
      console.log('set game storage:', storageData);
      setGameStorage(storageData);
    }
  }, [gameStorage]);

  // Add game to local storage
  useEffect(() => {
    console.log('set game to local storage', game?.theme);
    if (game?.theme) {
      console.log('CONTEXT set local storage', game);
      localStorage.setItem(
        'adventure-text-' + game?.theme,
        JSON.stringify(game),
      );
    }
    if (game && !currentRoom) {
      console.log('CONTEXT set current room:', game.rooms[0]);
      setCurrentRoom(game.rooms[0]);
    }
  }, [adventure, currentRoom, game]);

  // Add room images to local storage when all images are received
  useEffect(() => {
    const receivedAllImages = roomImages.length === game?.rooms.length;
    const theme = game?.theme;
    console.log('receivedAllImages:', receivedAllImages, theme, roomImages);
    if (receivedAllImages && theme) {
      localStorage.setItem(
        'adventure-text-' + theme + '-images',
        JSON.stringify(roomImages),
      );
    }
  }, [game, roomImages]);

  useEffect(() => {
    if (game) {
      setAdventure(getAdventureTypeFromStr(game.theme));
    }
  }, [adventure, game]);

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
        setCurrentRoom,
        roomImages,
        setRoomImages,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export { SiteContext, SiteProvider };
