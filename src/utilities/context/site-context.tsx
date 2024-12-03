import React, { useEffect } from 'react';
import { useState } from 'react';
import { GameProps, ItemProps, RoomProps } from '../GameProps';

interface Props {
  children: React.ReactNode;
}

export enum PageType {
  Start = 'Start',
  Adventure = 'Adventure',
  End = 'End',
}

export enum AdventureType {
  Dungeon,
  Forest,
  Castle,
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
  loading: boolean;
  setLoading: (loading: boolean) => void;
  isSoundOn: boolean;
  setIsSoundOn: (isSoundOn: boolean) => void;

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
  inventory: Array<ItemProps>;
  setInventory: (inventory: Array<ItemProps>) => void;
};
const SiteContext = React.createContext<SiteContextProps>({
  loading: false,
  setLoading: () => {},
  isSoundOn: false,
  setIsSoundOn: () => {},
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
  const [inventory, setInventory] = useState<Array<ItemProps>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);

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
  return (
    <SiteContext.Provider
      value={{
        loading,
        setLoading,
        isSoundOn,
        setIsSoundOn,
        name,
        setName,
        adventure,
        setAdventure,
        game,
        setGame,
        currentRoom,
        setCurrentRoom,
        inventory,
        setInventory,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export { SiteContext, SiteProvider };
