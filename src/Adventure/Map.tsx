import { useContext, useState } from 'react';

import './Map.scss';
import React from 'react';
import { ItemProps, RoomImageProps, RoomProps } from '../utilities/GameProps';
import { SiteContext } from '../utilities/context/site-context';

interface Props {
  messages: Array<{ role: string; content: string }>;
  loading: boolean | null;
  setLoading: (loading: boolean | null) => void;
  responseLoading: boolean | null;
  currentRoom: RoomProps | null;
  response: string;
  roomImage?: RoomImageProps;
  isFullMessage?: boolean;
}

const zeroStateResponse = 'Ask a question below to begin your adventure';

const MapComponent: React.FC<Props> = (props: Props) => {
  const { roomImage, loading, setLoading } = props;
  const { isInventoryOpen, inventory, setIsInventoryOpen } =
    useContext(SiteContext);
  const [isFullMessage, setIsFullMessage] = useState<boolean>(false);
  return (
    <div className="Map-content">
      <div className="Map-imageContainer Intro-darkBackground">
        {/** Image must be background only, object fit not working correctly */}
        <div
          className="Map-imageWrapper"
          style={{
            backgroundImage: `url(${roomImage?.image})`,
            opacity: loading ? 0 : 1,
            border: 'none',
          }}
        />

        {/** Preload image */}
        <img
          className="Map-image"
          src={roomImage?.image}
          alt="room"
          onLoad={() => setLoading(false)}
        />
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
          <div
            className="Map-inventoryTab Intro-darkBackground"
            onClick={() => setIsInventoryOpen(false)}
          >
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
                  style={{ transitionDelay: (index + 1) * 0.1 + 's' }}
                >
                  <img src={item.image} alt={item.name} />
                  <div
                    className={`Map-inventoryItemTitle ${!isInventoryOpen ? 'closed' : ''}`}
                    style={{ transitionDelay: index * 0.1 + 0.2 + 's' }}
                  >
                    {item.name}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        <div
          className="Map-imageWrapper-loader"
          style={{ opacity: loading ? 1 : 0 }}
        >
          <div className="stage">
            <div className="dot-pulse"></div>
          </div>
        </div>
      </div>
      <div className="Map-summary Intro-darkBackground">
        {renderSummary({ ...props, isFullMessage })}
      </div>
      <div className="Map-MenuButtons">
        <button
          className="Map-ListIcon"
          onClick={(e) => {
            e.stopPropagation();
            setIsFullMessage(!isFullMessage);
          }}
        >
          {isFullMessage ? (
            <div className="Map-ListIcon-Line" />
          ) : (
            <>
              <div className="Map-ListIcon-Line" />
              <div
                className="Map-ListIcon-Line"
                style={{ backgroundColor: '#ffe48d' }}
              />
              <div className="Map-ListIcon-Line" />
            </>
          )}
        </button>
        <button
          className="Map-MenuButtons-inventoryButton"
          onClick={() => setIsInventoryOpen(!isInventoryOpen)}
        >
          <img src={inventory[0].image} alt="inventory" />
          <div className="Map-MenuButtons-inventoryButtonArrow">
            {isInventoryOpen ? <> &darr; </> : <> &uarr; </>}
          </div>
        </button>
      </div>
    </div>
  );
};

const renderSummary = (props: Props) => {
  const { currentRoom, response, responseLoading, messages, isFullMessage } =
    props;
  const currentRoomID = currentRoom?.id;
  const description = currentRoom?.description;
  const exits = currentRoom?.exits;
  return (
    <>
      <div className="Map-descriptionWrapper">
        <h3>Room: {currentRoomID}</h3>
        <p>{description}</p>
        <p className="Map-descriptionExits">
          Exits:{' '}
          {exits?.map((exit, index) => (
            <span key={exit.direction}>
              {exit.direction}
              {exits.length - 1 !== index && ', '}
            </span>
          ))}
        </p>
      </div>

      <div className="Map-responseWrapper" style={{ position: 'relative' }}>
        <h3>
          Response:{' '}
          {responseLoading && (
            <div className="stage">
              <div className="dot-pulse"></div>
            </div>
          )}
        </h3>

        <div className="Map-response">
          {isFullMessage
            ? messages.length > 0
              ? messages.map((msg, index) => {
                  const isLastMessage = index === messages.length - 1;
                  return (
                    <div key={msg.content}>
                      <p style={{ color: isLastMessage ? '#ffe48d' : 'white' }}>
                        <span className="Map-responseRole">
                          {msg.role === 'user' ? 'adventurer' : 'GM'}
                        </span>
                        : {msg.content}
                      </p>
                    </div>
                  );
                })
              : renderZeroStateResponse()
            : response
              ? response
              : zeroStateResponse}
        </div>
      </div>
    </>
  );
};

const renderZeroStateResponse = () => (
  <>
    <div>
      <p>
        <span className="Map-responseRole" style={{ color: 'white' }}>
          adventurer:
        </span>
      </p>
    </div>
    <div>
      <p>
        <span className="Map-responseRole">GM:</span> {zeroStateResponse}
      </p>
    </div>
  </>
);

export const Map = React.memo(MapComponent, (prevProps, nextProps) => {
  // Compare the props to decide if re-rendering is needed
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.roomImage === nextProps.roomImage &&
    prevProps.response === nextProps.response &&
    prevProps.responseLoading === nextProps.responseLoading &&
    prevProps.currentRoom === nextProps.currentRoom
  );
});
