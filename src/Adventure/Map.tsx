import { useContext, useState } from 'react';
import { SiteContext } from '../utilities/context/site-context';
import './Map.scss';

interface Props {
  response: string;
}

export const Map: React.FC<Props> = ({ response }) => {
  const { currentRoom } = useContext(SiteContext);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  return (
    <div className="Map-content">
      <div
        className="Map-ImageContainer"
        style={{ backgroundImage: `url(${currentRoom?.image})` }}
      />
      <div className="imageWrapper">
        <img
          alt="room1"
          onLoad={() => setImageLoading(false)}
          src={currentRoom?.image}
          style={{ opacity: imageLoading ? 0 : 1 }}
        />
      </div>
      <div className="Map-summary Intro-darkBackground">
        {renderSummary(response, currentRoom?.id, currentRoom?.description)}
      </div>
    </div>
  );
};

const renderSummary = (
  response: string,
  currentRoomID: number | undefined,
  description: string | undefined,
) => (
  <>
    <div>
      <h3>Room: {currentRoomID}</h3>
      <p>{description}</p>
    </div>
    {response && (
      <div>
        <h3>Response</h3>
        <p className="Map-response">{response}</p>
      </div>
    )}
  </>
);
