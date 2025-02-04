import { useContext } from 'react';
import './Settings.scss';
import { SiteContext } from '../utilities/context/site-context';
import { GameStorage } from '../utilities/GameProps';

interface Props {
  /** Use can clear game during prologue, will need to reset prologueReady to false */
  setPrologueReady: (prologueReady: boolean) => void;
}

export const Settings = (props: Props) => {
  const { gameStorage, setGameStorage } = useContext(SiteContext);
  return (
    <div className="Settings-container">
      <h2 className="Intro-title">Settings</h2>
      <div className="Settings-description">
        Generated games are saved locally.
        <br />
        Delete games to start over:
      </div>
      {
        // add delete button for each object in gamesStorage
        renderDeleteButtons(gameStorage, setGameStorage, props)
      }
    </div>
  );
};

const renderDeleteButtons = (
  gameStorage: GameStorage | null,
  setGameStorage: (gameStorage: GameStorage) => void,
  props: Props,
) => {
  const { setPrologueReady } = props;
  const dungeon = gameStorage?.dungeon && (
    <button
      className="Settings-deleteButton"
      onClick={() => {
        localStorage.removeItem('adventure-text-dungeon');
        localStorage.removeItem('adventure-text-dungeon-images');
        setPrologueReady(false);
        setGameStorage({
          dungeon: null,
          forest: gameStorage.forest,
          castle: gameStorage.castle,
        });
      }}
    >
      <span className="Settings-deleteText">X</span>

      {
        // capitalize first letter of theme
        (gameStorage?.dungeon?.game.theme).charAt(0).toUpperCase() +
          (gameStorage?.dungeon?.game.theme).slice(1)
      }
    </button>
  );
  const forest = gameStorage?.forest && (
    <button
      className="Settings-deleteButton"
      onClick={() => {
        localStorage.removeItem('adventure-text-forest');
        localStorage.removeItem('adventure-text-forest-images');
        setPrologueReady(false);
        setGameStorage({
          dungeon: gameStorage.dungeon,
          forest: null,
          castle: gameStorage.castle,
        });
      }}
    >
      {(gameStorage?.forest?.game.theme).toUpperCase()}
    </button>
  );
  const castle = gameStorage?.castle && (
    <button
      className="Settings-deleteButton"
      onClick={() => {
        localStorage.removeItem('adventure-text-castle');
        localStorage.removeItem('adventure-text-castle-images');
        setPrologueReady(false);
        setGameStorage({
          dungeon: gameStorage.dungeon,
          forest: gameStorage.forest,
          castle: null,
        });
      }}
    >
      {(gameStorage?.castle?.game.theme).toUpperCase()}
    </button>
  );

  return dungeon || forest || castle ? (
    <div className="Settings-buttonList">
      {dungeon}
      {forest}
      {castle}
    </div>
  ) : (
    <div>No saved games</div>
  );
};
