import { useContext } from 'react';

import './Map.scss';
import React from 'react';
import { RoomProps } from '../utilities/GameProps';
import { SiteContext } from '../utilities/context/site-context';
import { adventuresData } from '../utilities/GameData';

interface Props {
  response: string;
  loading: boolean | null;
  currentRoom: RoomProps | null;
}

const MapComponent: React.FC<Props> = ({ response, loading, currentRoom }) => {
  const { isInventoryOpen, setIsInventoryOpen, inventory } =
    useContext(SiteContext);

  return (
    <div className="Map-content">
      <div
        className="imageWrapper Intro-darkBackground"
        style={{
          backgroundImage: `url(${currentRoom?.image})`,
        }}
      >
        {
          <div
            className={`Map-inventory Intro-darkBackground ${
              isInventoryOpen ? '' : 'Map-inventoryClosed'
            }`}
            style={{
              transitionDelay: isInventoryOpen
                ? '0s'
                : (inventory.length - 1) * 0.1 - 0.05 + 's',
            }}
          >
            <div className="Map-inventoryTab Intro-darkBackground">
              Inventory:
            </div>

            <div className="Map-inventoryList">
              {
                /** First inventory item is the "empty" item, for inventories longer than 1, remove first empty item */
                (inventory.length === 1
                  ? inventory
                  : inventory.slice(1, inventory.length)
                ).map((item, index) => (
                  <div
                    key={item.itemId}
                    className={`Map-inventoryItem ${!isInventoryOpen ? 'closed' : ''}`}
                    style={{ transitionDelay: index * 0.1 + 's' }}
                  >
                    <img src={item.image} alt={item.item} />
                    <div
                      className={`Map-inventoryItemTitle ${!isInventoryOpen ? 'closed' : ''}`}
                      style={{ transitionDelay: index * 0.1 + 0.2 + 's' }}
                    >
                      {item.item}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        }
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
