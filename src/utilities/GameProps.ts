import { AdventureType } from './context/site-context';

import TestImage from '../assets/images/test1.png';

export interface GameProps {
  theme: 'dungeon' | 'forest' | 'castle';
  introduction: string;
  characterPrompt: string;
  rooms: Array<RoomProps>;
}

export interface ExitProps {
  roomId: number | 'exit door';
  direction: string;
}

export interface RoomProps {
  id: number;
  description: string;
  image?: string;
  exits: ExitProps[];
  items: Array<ItemProps>;
  obstacle: ObstacleProps | null;
}

export interface ItemProps {
  itemId: number;
  item: string;
  location: string;
  canAddToInventory?: boolean;
}

export interface ObstacleProps {
  description: string;
  requiredItem: {
    itemId: number;
  } | null;
}

export enum ActionType {
  Move = 'Move',
  PickUp = 'PickUp',
  Use = 'Use',
  Investigate = 'Investigate',
  LookAtInventory = 'LookAtInventory',
  ExitRoom = 'ExitRoom',
}
export interface ActionResponse {
  actionType: ActionType;
  response: string;
  characterPrompt: string;
  addItemsToInventory: Array<ItemProps>;
  exit: ExitProps | null;
}

export const responseExample = {
  actionType: ActionType.Investigate,
  response: "This is your response to the user's input",
  characterPrompt: `This is the prompt for the character, ex: What do you do next?, Try something else., You have already tried that., You can't pick that up.`,
  /** If didUserPickUpItem return addItemsToInventory: null.  Items with canAddToInventory can be added to the user's inventory.  The user must ask to pick up an item in order to add it. */
  addItemsToInventory: [
    {
      itemId: 1,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** If user is exiting the room, which exit did they use? */
  exit: { roomId: 3, direction: 'north' },
};

export const exampleGame: GameProps = {
  theme: 'dungeon',
  introduction:
    'You awake in a dimly lit dungeon, up against a cold, stone wall. You have no memory of how you got here, but you know you must escape. You notice the faint scent of damp earth and hear the distant sound of dripping water echoing through the stone corridors. There’s no time to waste. You must find a way out!',
  characterPrompt: 'What do you do?',
  rooms: [
    {
      id: 1,
      description:
        "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
      image: TestImage,
      exits: [{ roomId: 2, direction: 'north' }],
      items: [
        {
          itemId: 1,
          item: 'chair',
          location: 'center of room',
          canAddToInventory: false,
        },
        {
          itemId: 2,
          item: 'key',
          location: 'under chair',
          canAddToInventory: true,
        },
      ],
      obstacle: {
        description: 'The door is locked, and you need a key to unlock it.',
        requiredItem: {
          itemId: 2,
        },
      },
    },
    {
      id: 2,
      description:
        'You enter a larger room with high, arched ceilings. The walls are lined with iron shackles, and broken pieces of furniture are strewn about. In the center, there’s a heavy wooden table with scratch marks on its surface.',
      exits: [
        { roomId: 1, direction: 'south' },
        { roomId: 4, direction: 'east' },
        { roomId: 3, direction: 'north' },
      ],

      items: [
        {
          itemId: 3,
          item: 'table',
          location: 'center of room',
          canAddToInventory: false,
        },
        {
          itemId: 4,
          item: 'rusty sword',
          location: 'under table',
          canAddToInventory: true,
        },
      ],
      obstacle: null,
    },
    {
      id: 3,
      description:
        'You find yourself in what appears to be caved in room.  Light filters through, but the rubble blocks your path.',
      exits: [{ roomId: 2, direction: 'south' }],
      items: [
        {
          itemId: 5,
          item: 'rubble',
          location: 'at the back of the room',
          canAddToInventory: false,
        },
      ],
      obstacle: {
        description:
          'The path is blocked by rubble. You need to find another way out.',
        requiredItem: null,
      },
    },
    {
      id: 4,
      description:
        'You find yourself in what appears to be a guard room. There’s a small barred window high up on the wall, letting in a sliver of moonlight. On the wall hangs a ring of keys, one of which looks newer than the others.',
      exits: [
        { roomId: 2, direction: 'west' },
        { roomId: 'exit door', direction: 'north' },
      ],
      items: [
        {
          itemId: 6,
          item: 'key',
          location: 'ring of keys',
          canAddToInventory: true,
        },
        {
          itemId: 7,
          item: 'rusty padlock',
          location: 'exit door',
          canAddToInventory: false,
        },
      ],
      obstacle: {
        description:
          'The door has a rusty padlock.  You won’t be able to open it with a key.',
        requiredItem: {
          itemId: 4,
        },
      },
    },
  ],
};
