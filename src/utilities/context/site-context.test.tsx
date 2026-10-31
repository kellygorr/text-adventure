import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SiteContext, SiteProvider } from './site-context';
import { GameProps } from '../GameProps';

const TEST_GAME: GameProps = {
  theme: 'dungeon',
  currentRoomId: 1,
  introduction: 'intro',
  characterPrompt: 'prompt',
  rooms: [
    {
      roomId: 1,
      description: 'room one',
      exits: [
        {
          roomId: 2,
          direction: 'north',
          type: 'door',
          hasObstacle: { obstacleId: 7 },
        },
      ],
      items: [
        {
          itemId: 10,
          name: 'table',
          descriptionTags: ['wood'],
          locationTags: ['center'],
          canAddToInventory: false,
          attachedToItem: [
            {
              itemId: 11,
              name: 'key',
              descriptionTags: ['small'],
              locationTags: ['under'],
              canAddToInventory: true,
            },
          ],
        },
      ],
      obstacle: [
        {
          obstacleId: 7,
          type: 'lock',
          name: 'locked door',
          keywords: ['door', 'lock'],
          description: 'locked',
          requiredItem: { itemId: 11 },
        },
      ],
    },
    {
      roomId: 2,
      description: 'room two',
      exits: [],
      items: [],
      obstacle: null,
    },
  ],
};

function ContextProbe() {
  const ctx = React.useContext(SiteContext);

  return (
    <div>
      <div data-testid="storage-loaded">
        {ctx.gameStorage ? 'yes' : 'no'}
      </div>
      <div data-testid="room-description">
        {ctx.currentRoom?.description ?? 'none'}
      </div>
      <div data-testid="attached-count">
        {ctx.currentRoom?.items[0]?.attachedToItem?.length ?? 0}
      </div>
      <div data-testid="obstacle-count">
        {ctx.currentRoom?.obstacle?.length ?? 0}
      </div>
      <div data-testid="exit-obstacle">
        {ctx.currentRoom?.exits[0]?.hasObstacle ? 'blocked' : 'open'}
      </div>

      <button
        onClick={() => {
          ctx.setGame(TEST_GAME);
          ctx.setCurrentRoomId(1);
        }}
      >
        init game
      </button>
      <button onClick={() => ctx.setRoomDescription(1, 'updated room')}>
        set description
      </button>
      <button onClick={() => ctx.removeItemFromRoom(11)}>remove attached</button>
      <button onClick={() => ctx.markObstacleAsCompleted(7)}>
        complete obstacle
      </button>
    </div>
  );
}

describe('SiteProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads saved game storage from localStorage', async () => {
    localStorage.setItem('adventure-text-dungeon', JSON.stringify(TEST_GAME));
    localStorage.setItem(
      'adventure-text-dungeon-images',
      JSON.stringify([{ roomId: 1, image: '/room-1.jpg' }]),
    );

    render(
      <SiteProvider>
        <ContextProbe />
      </SiteProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('storage-loaded')).toHaveTextContent('yes');
    });
  });

  it('applies room state mutations through context actions', () => {
    render(
      <SiteProvider>
        <ContextProbe />
      </SiteProvider>,
    );

    fireEvent.click(screen.getByText('init game'));
    expect(screen.getByTestId('room-description')).toHaveTextContent('room one');
    expect(screen.getByTestId('attached-count')).toHaveTextContent('1');
    expect(screen.getByTestId('obstacle-count')).toHaveTextContent('1');
    expect(screen.getByTestId('exit-obstacle')).toHaveTextContent('blocked');

    fireEvent.click(screen.getByText('set description'));
    expect(screen.getByTestId('room-description')).toHaveTextContent(
      'updated room',
    );

    fireEvent.click(screen.getByText('remove attached'));
    expect(screen.getByTestId('attached-count')).toHaveTextContent('0');

    fireEvent.click(screen.getByText('complete obstacle'));
    expect(screen.getByTestId('obstacle-count')).toHaveTextContent('0');
    expect(screen.getByTestId('exit-obstacle')).toHaveTextContent('open');
  });
});
