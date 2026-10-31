import { determineAction } from './determineAction';
import { ActionType, GameProps, ItemProps, RoomProps } from '../utilities/GameProps';

const key: ItemProps = {
  itemId: 2,
  name: 'key',
  descriptionTags: ['small'],
  locationTags: ['under table'],
  canAddToInventory: true,
};

const roomWithObstacle: RoomProps = {
  roomId: 1,
  description: 'A locked room',
  exits: [
    {
      roomId: 2,
      direction: 'north',
      type: 'door',
      hasObstacle: { obstacleId: 1 },
    },
  ],
  items: [
    {
      itemId: 1,
      name: 'table',
      descriptionTags: ['wooden'],
      locationTags: ['center'],
      canAddToInventory: false,
      attachedToItem: [key],
    },
  ],
  obstacle: [
    {
      obstacleId: 1,
      type: 'lock',
      name: 'locked door',
      keywords: ['door', 'lock'],
      description: 'It is locked.',
      requiredItem: { itemId: 2 },
    },
  ],
};

const roomWithoutObstacle: RoomProps = {
  ...roomWithObstacle,
  exits: [{ roomId: 2, direction: 'north', type: 'door', hasObstacle: null }],
  obstacle: null,
};

const baseGame: GameProps = {
  theme: 'dungeon',
  currentRoomId: 1,
  introduction: 'intro',
  characterPrompt: 'prompt',
  rooms: [roomWithObstacle, roomWithoutObstacle],
};

describe('determineAction', () => {
  it('returns inventory action for inventory prompt', () => {
    const result = determineAction({
      prompt: 'look at inventory',
      currentExit: null,
      currentRoom: roomWithObstacle,
      inventory: [],
      prevExit: null,
      currentItem: null,
      game: baseGame,
    });

    expect(result.actionType).toBe(ActionType.LookAtInventory);
  });

  it('returns pickup success for attached item in room', () => {
    const result = determineAction({
      prompt: 'pick up the key under table',
      currentExit: null,
      currentRoom: roomWithObstacle,
      inventory: [],
      prevExit: null,
      currentItem: null,
      game: baseGame,
    });

    expect(result.actionType).toBe(ActionType.PickUpItemSuccess);
    expect(result.item?.name).toBe('key');
  });

  it('returns use-item success when required item is present', () => {
    const result = determineAction({
      prompt: 'use key on north door',
      currentExit: null,
      currentRoom: roomWithObstacle,
      inventory: [key],
      prevExit: null,
      currentItem: null,
      game: baseGame,
    });

    expect(result.actionType).toBe(ActionType.UseItemSuccess);
    expect(result.obstacle?.obstacleId).toBe(1);
  });

  it('returns exit-room success for unobstructed directional exit', () => {
    const result = determineAction({
      prompt: 'go north',
      currentExit: null,
      currentRoom: roomWithoutObstacle,
      inventory: [],
      prevExit: null,
      currentItem: null,
      game: baseGame,
    });

    expect(result.actionType).toBe(ActionType.ExitRoomSuccess);
    expect(result.exit?.direction).toBe('north');
  });
});
