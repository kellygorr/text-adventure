import React, { useEffect } from 'react';
import { useState } from 'react';
import { AdventureType, GameProps, ItemProps, RoomProps } from '../GameProps';
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
  /** App */
  loading: boolean | null;
  setLoading: (loading: boolean | null) => void;
  isSoundOn: boolean;
  setIsSoundOn: (isSoundOn: boolean) => void;
  inventory: Array<ItemProps>;
  setInventory: (inventory: Array<ItemProps>) => void;
  isInventoryOpen: boolean;
  setIsInventoryOpen: (isInventoryOpen: boolean) => void;

  /** Adventure settings */
  name: string;
  setName: (name: string) => void;
  adventure: AdventureType;
  setAdventure: (adventure: AdventureType) => void;
  game: GameProps | null;
  setGame: (game: GameProps) => void;

  /** Current room */
  currentRoom: RoomProps | null;
  setCurrentRoom: (room: RoomProps) => void;
};
const SiteContext = React.createContext<SiteContextProps>({
  loading: null,
  setLoading: () => {},
  isSoundOn: false,
  setIsSoundOn: () => {},
  isInventoryOpen: false,
  setIsInventoryOpen: () => {},
  name: '',
  setName: () => {},
  adventure: AdventureType.Dungeon,
  setAdventure: () => {},
  game: null,
  setGame: () => {},
  currentRoom: null,
  setCurrentRoom: () => {},
  inventory: [],
  setInventory: () => {},
});

const SiteProvider = ({ children }: Props) => {
  const [name, setName] = useState<string>('');
  const [adventure, setAdventure] = useState<AdventureType>(
    AdventureType.Dungeon,
  );
  const [game, setGame] = useState<GameProps | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomProps | null>(null);
  /** First inventory item is the "empty" item */
  const [inventory, setInventory] = useState<Array<ItemProps>>([
    {
      itemId: 1,
      item: 'Empty',
      location: 'nothing',
      canAddToInventory: true,
      image: getRandomItemImage('empty', AdventureType.Dungeon),
    },
    // {
    //   itemId: 2,
    //   item: 'key',
    //   location: 'on the ground',
    //   canAddToInventory: true,
    //   image: Key1,
    // },
    // {
    //   itemId: 3,
    //   item: 'old key',
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

  const [loading, setLoading] = useState<boolean | null>(null);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(true);

  useEffect(() => {
    // Add game to local storage
    if (game) {
      localStorage.setItem(
        'adventure-text-' + game.theme,
        JSON.stringify(game),
      );
    }

    if (game && !currentRoom) {
      setCurrentRoom(game.rooms[0]);
    }
  }, [game, currentRoom]);

  useEffect(() => {
    console.log('loading:', loading);
  }, [loading]);

  return (
    <SiteContext.Provider
      value={{
        loading,
        setLoading,
        isSoundOn,
        setIsSoundOn,
        inventory,
        setInventory,
        isInventoryOpen,
        setIsInventoryOpen,
        name,
        setName,
        adventure,
        setAdventure,
        game,
        setGame,
        currentRoom,
        setCurrentRoom,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export { SiteContext, SiteProvider };
