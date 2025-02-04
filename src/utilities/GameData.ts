import TestImage from '../assets/images/test1.png';

import dungeonBackground from '../assets/images/dungeon-background.jpeg';
import dungeonCharacter from '../assets/images/dungeon-character.png';
import forestBackground from '../assets/images/forest-background.jpeg';
import forestCharacter from '../assets/images/forest-character.png';
import castleBackground from '../assets/images/castle-background.jpeg';
import castleCharacter from '../assets/images/castle-character.png';
import Key1 from '../assets/images/items/key1.png';
import Key2 from '../assets/images/items/key2.png';
import Empty1 from '../assets/images/items/empty1.png';
import Empty2 from '../assets/images/items/empty2.png';
import Empty3 from '../assets/images/items/empty3.png';
import Hammer1 from '../assets/images/items/hammer1.png';
import Spear1 from '../assets/images/items/spear1.png';
import Spear2 from '../assets/images/items/spear2.png';
import Wand1 from '../assets/images/items/wand1.png';
import Wand2 from '../assets/images/items/wand2.png';
import Unknown1 from '../assets/images/items/unknown1.png';

import DungeonKey1 from '../assets/images/items/dungeon/key1.png';
import DungeonEmpty1 from '../assets/images/items/dungeon/empty1.png';
import DungeonSpear1 from '../assets/images/items/dungeon/spear1.png';
import DungeonSpear2 from '../assets/images/items/dungeon/spear2.png';
import DungeonWand1 from '../assets/images/items/dungeon/wand1.png';
import DungeonHammer1 from '../assets/images/items/dungeon/hammer1.png';
import ForestHammer1 from '../assets/images/items/forest/hammer1.png';
import ForestSpear1 from '../assets/images/items/forest/spear1.png';

import {
  ActionType,
  AdventureDataProps,
  AdventureType,
  GameProps,
  ItemImagesProps,
  ItemsDefaultProps,
} from './GameProps';

export const defaultAssetsStrings = ['key', 'spear', 'wand', 'hammer', 'empty'];
const DefaultAssets: ItemImagesProps = {
  key: [Key1, Key2],
  spear: [Spear1, Spear2],
  wand: [Wand1, Wand2],
  hammer: [Hammer1],
  empty: [Empty1, Empty2, Empty3],
  unknown: [Unknown1],
};

const ItemsDefault: ItemsDefaultProps = {
  dungeon: {
    key: [...DefaultAssets.key, DungeonKey1],
    spear: [...DefaultAssets.spear, DungeonSpear1, DungeonSpear2],
    wand: [...DefaultAssets.wand, DungeonWand1],
    hammer: [...DefaultAssets.hammer, DungeonHammer1],
    empty: [...DefaultAssets.empty, DungeonEmpty1],
    unknown: [...DefaultAssets.unknown],
  },
  forest: {
    key: [...DefaultAssets.key],
    spear: [...DefaultAssets.spear, ForestSpear1],
    wand: [...DefaultAssets.wand],
    hammer: [...DefaultAssets.hammer, ForestHammer1],
    empty: [...DefaultAssets.empty],
    unknown: [...DefaultAssets.unknown],
  },
  castle: {
    key: [...DefaultAssets.key],
    spear: [...DefaultAssets.spear],
    wand: [...DefaultAssets.wand],
    hammer: [...DefaultAssets.hammer],
    empty: [...DefaultAssets.empty],
    unknown: [...DefaultAssets.unknown],
  },
};

export const adventuresData: AdventureDataProps[] = [
  {
    type: AdventureType.Dungeon,
    name: 'Escape the dungeon',
    background: dungeonBackground,
    character: dungeonCharacter,
    prompt:
      'A fantasy dungeon wall in a modern cartoon art style with ruby, beige, and bronze colors. ',
    defaultAssets: ItemsDefault.dungeon,
  },
  {
    type: AdventureType.Forest,
    name: 'Escape the forest',
    background: forestBackground,
    character: forestCharacter,
    prompt:
      'A fantasy forest in a modern cartoon, art style with emerald, and rubies. The color scheme includes warm hues of green, beige, and gold, creating a cozy yet mysterious atmosphere. It is a stylized, game-inspired look. The overall style is detailed, vibrant, and slightly cartoonish, resembling fantasy video game art.',
    defaultAssets: ItemsDefault.forest,
  },
  {
    type: AdventureType.Castle,
    name: 'Escape the castle',
    background: castleBackground,
    character: castleCharacter,
    defaultAssets: ItemsDefault.castle,
  },
];

export const exampleGame: GameProps = {
  theme: 'dungeon',
  introduction:
    'You awake in a dimly lit dungeon, up against a cold, stone wall. You have no memory of how you got here. There’s no time to waste. You must find a way out!',
  characterPrompt: 'What do you do?',
  rooms: [
    {
      id: 1,
      description:
        "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
      exits: [
        {
          roomId: 2,
          direction: 'north',
          hasObstacle: {
            obstacleId: 1,
          },
        },
      ],
      items: [
        {
          itemId: 1,
          name: 'chair',
          location: 'center of room',
          canAddToInventory: false,
        },
        {
          itemId: 2,
          name: 'key',
          location: 'under chair',
          canAddToInventory: true,
        },
      ],
      obstacle: [
        {
          obstacleId: 1,
          description: 'The door is locked, and you need a key to unlock it.',
          requiredItem: {
            itemId: 2,
          },
        },
      ],
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
          name: 'table',
          location: 'center of room',
          canAddToInventory: false,
        },
        {
          itemId: 4,
          name: 'rusty sword',
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
      exits: [
        { roomId: 2, direction: 'south' },
        {
          roomId: 'dead end',
          direction: 'east',
          hasObstacle: {
            obstacleId: 2,
          },
        },
      ],
      items: [
        {
          itemId: 5,
          name: 'rubble',
          location: 'at the back of the room',
          canAddToInventory: false,
        },
      ],
      obstacle: [
        {
          obstacleId: 2,
          description:
            'The path is blocked by rubble. You need to find another way out.',
          requiredItem: null,
        },
      ],
    },
    {
      id: 4,
      description:
        'You find yourself in what appears to be a guard room. There’s a small barred window high up on the wall, letting in a sliver of moonlight. On the wall hangs a ring of keys, one of which looks newer than the others.',
      exits: [
        { roomId: 2, direction: 'west' },
        {
          roomId: 'exit door',
          direction: 'north',
          hasObstacle: {
            obstacleId: 3,
          },
        },
      ],
      items: [
        {
          itemId: 6,
          name: 'key',
          location: 'ring of keys',
          canAddToInventory: true,
        },
        {
          itemId: 7,
          name: 'rusty padlock',
          location: 'exit door',
          canAddToInventory: false,
        },
      ],
      obstacle: [
        {
          obstacleId: 3,
          description:
            'The door has a rusty padlock.  You won’t be able to open it with a key.',
          requiredItem: {
            itemId: 4,
          },
        },
      ],
    },
  ],
};

export const getRandomItemImage = (item: string, adventure: AdventureType) => {
  // find closest match to string in defaultAssetsStrings
  let exactItem: string | undefined = defaultAssetsStrings.find((asset) =>
    asset.includes(item),
  );
  exactItem = exactItem ? exactItem : 'unknown';

  const imageArray = adventuresData[adventure].defaultAssets[
    exactItem as keyof ItemImagesProps
  ] as string[];

  return imageArray.sort(() => 0.5 - Math.random())[0];
};
