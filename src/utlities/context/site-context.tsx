import React from 'react';
import { useState } from 'react';
import { GameProps } from '../GameProps';

interface Props {
  children: React.ReactNode;
}

export enum PageType {
  Start,
  Adventure,
  End,
}

export enum AdventureType {
  Dungeon,
  Forest,
  Castle,
}

type SiteContextProps = {
  /** Pages */
  page: PageType | null;
  setPage: (page: PageType) => void;

  /** Adventure settings */
  name: string;
  setName: (name: string) => void;
  adventure: AdventureType;
  setAdventure: (adventure: AdventureType) => void;
  game: GameProps | null;
  setGame: (game: GameProps) => void;
};
const SiteContext = React.createContext<SiteContextProps>({
  page: null,
  setPage: () => {},
  name: '',
  setName: () => {},
  adventure: AdventureType.Dungeon,
  setAdventure: () => {},
  game: null,
  setGame: () => {},
});

const SiteProvider = ({ children }: Props) => {
  const [page, setPage] = useState<PageType | null>(null);
  const [name, setName] = useState<string>('');
  const [adventure, setAdventure] = useState<AdventureType>(
    AdventureType.Dungeon,
  );
  const [game, setGame] = useState<GameProps | null>(null);

  return (
    <SiteContext.Provider
      value={{
        page,
        setPage,
        name,
        setName,
        adventure,
        setAdventure,
        game,
        setGame,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export { SiteContext, SiteProvider };
