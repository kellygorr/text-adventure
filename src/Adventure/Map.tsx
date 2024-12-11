import { useState } from 'react';

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

  return (
    <div className="Map-content">
      <div
        className="imageWrapper Intro-darkBackground"
        onLoad={() => setImageLoading(false)}
        style={{
          backgroundImage: `url(${currentRoom?.image})`,
          // opacity: imageLoading ? 0 : 1,
        }}
      />
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

    <div style={{ position: 'relative' }}>
      <h3>
        Response:{' '}
        {loading && (
          <div className="stage">
            <div className="dot-pulse"></div>
          </div>
        )}
      </h3>

      <p className="Map-response">
        {response ? response : 'Ask a question below to begin your adventure'}
      </p>
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
