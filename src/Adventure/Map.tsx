import { useContext } from 'react';
import { SiteContext } from '../utlities/context/site-context';
import './Map.scss';
export const Map: React.FC = () => {
  const { game } = useContext(SiteContext);
  console.log('game:', game);
  const currentRoom = game?.rooms[0];
  return (
    <div className="Map-content">
      <div className="imageWrapper">
        <img alt="room1" src={currentRoom?.image} />
      </div>
      <div className="summary">{game?.introduction}</div>
    </div>
  );
};
