import { useContext, useEffect, useState } from 'react';
import { SiteContext } from '../utilities/context/site-context';
import './Map.scss';
import React from 'react';
import { RoomProps } from '../utilities/GameProps';

interface Props {
  response: string;
  loading: boolean | null;
  currentRoom: RoomProps | null;
}

const MapComponent: React.FC<Props> = ({ response, loading, currentRoom }) => {
  const [imageLoading, setImageLoading] = useState<boolean>(true);
  console.log('MAP', loading);
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
        {renderSummary(
          response,
          currentRoom?.id,
          currentRoom?.description,
          loading,
        )}
      </div>
    </div>
  );
};

const renderSummary = (
  response: string,
  currentRoomID: number | undefined,
  description: string | undefined,
  loading: boolean | null,
) => (
  <>
    <div>
      <h3>Room: {currentRoomID}</h3>
      <p>{description}</p>
    </div>

    <div>
      <h3>Response</h3>
      {loading && (
        <div className="stage">
          <div className="dot-pulse"></div>
        </div>
      )}
      <p className="Map-response">{response}</p>
    </div>
  </>
);

export const Map = React.memo(MapComponent, (prevProps, nextProps) => {
  // Compare the props to decide if re-rendering is needed
  return (
    prevProps.response === nextProps.response &&
    prevProps.loading === nextProps.loading &&
    prevProps.currentRoom === nextProps.currentRoom
  );
});
