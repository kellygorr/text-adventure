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
import Sword1 from '../assets/images/items/sword1.png';
import Sword2 from '../assets/images/items/sword2.png';
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
  AdventureDataProps,
  AdventureType,
  GameProps,
  ItemImagesProps,
  ItemsDefaultProps,
} from './GameProps';

export const EscapeGameRoom: number = 99;

export const defaultAssetsStrings = [
  'key',
  'spear',
  'wand',
  'hammer',
  'empty',
  'sword',
];
const DefaultAssets: ItemImagesProps = {
  key: [Key1, Key2],
  spear: [Spear1, Spear2],
  wand: [Wand1, Wand2],
  hammer: [Hammer1],
  sword: [Sword1, Sword2],
  empty: [Empty1, Empty2, Empty3],
  unknown: [Unknown1],
};

const ItemsDefault: ItemsDefaultProps = {
  dungeon: {
    key: [...DefaultAssets.key, DungeonKey1],
    spear: [...DefaultAssets.spear, DungeonSpear1, DungeonSpear2],
    wand: [...DefaultAssets.wand, DungeonWand1],
    hammer: [...DefaultAssets.hammer, DungeonHammer1],
    sword: [...DefaultAssets.sword],
    empty: [...DefaultAssets.empty, DungeonEmpty1],
    unknown: [...DefaultAssets.unknown],
  },
  forest: {
    key: [...DefaultAssets.key],
    spear: [...DefaultAssets.spear, ForestSpear1],
    wand: [...DefaultAssets.wand],
    hammer: [...DefaultAssets.hammer, ForestHammer1],
    sword: [...DefaultAssets.sword],
    empty: [...DefaultAssets.empty],
    unknown: [...DefaultAssets.unknown],
  },
  castle: {
    key: [...DefaultAssets.key],
    spear: [...DefaultAssets.spear],
    wand: [...DefaultAssets.wand],
    hammer: [...DefaultAssets.hammer],
    sword: [...DefaultAssets.sword],
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
  currentRoomId: null,
  introduction:
    'You awake in a dimly lit dungeon, up against a cold, stone wall. You have no memory of how you got here. There’s no time to waste. You must find a way out!',
  characterPrompt: 'How will you escape?',
  rooms: [
    {
      roomId: 1,
      description:
        "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
      exits: [
        {
          roomId: 2,
          direction: 'north',
          type: 'door',
          hasObstacle: {
            obstacleId: 1,
          },
        },
      ],
      items: [
        {
          itemId: 1,
          name: 'chair',
          descriptionTags: ['old', 'wooden'],
          locationTags: ['center'],
          canAddToInventory: false,
          attachedToItem: [
            {
              itemId: 2,
              name: 'key',
              descriptionTags: ['small', 'metal'],
              locationTags: ['underneath', 'below'],
              canAddToInventory: true,
            },
          ],
        },
      ],
      obstacle: [
        {
          obstacleId: 1,
          type: 'lock',
          name: 'locked door',
          keywords: ['door', 'exit', 'lock', 'barrier', 'gate'],
          description: 'The door is locked, and you need a key to unlock it.',
          requiredItem: {
            itemId: 2,
          },
        },
      ],
    },
    {
      roomId: 2,
      description: `You enter a larger room with high, arched ceilings. The walls are lined with iron shackles, and broken pieces of furniture are strewn about. In the center, there's a heavy wooden table with scratch marks on its surface.`,
      exits: [
        { roomId: 1, direction: 'south', type: 'door', hasObstacle: null },
        { roomId: 4, direction: 'east', type: 'door', hasObstacle: null },
        { roomId: 3, direction: 'north', type: 'door', hasObstacle: null },
      ],

      items: [
        {
          itemId: 3,
          name: 'table',
          descriptionTags: ['wooden', 'heavy', 'scratched'],
          locationTags: ['center'],
          canAddToInventory: false,
          attachedToItem: [
            {
              itemId: 4,
              name: 'sword',
              descriptionTags: ['metal', 'rusty'],
              locationTags: ['on top'],
              canAddToInventory: true,
            },
          ],
        },
      ],
      obstacle: null,
    },
    {
      roomId: 3,
      description:
        'You find yourself in what appears to be caved in room.  Light filters through, but the rubble blocks your path.',
      exits: [
        { roomId: 2, direction: 'south', type: 'door', hasObstacle: null },
        {
          roomId: 'dead end',
          direction: 'east',
          type: 'permanent obstacle',
          hasObstacle: {
            obstacleId: 2,
          },
        },
      ],
      items: [
        {
          itemId: 5,
          name: 'rubble',
          descriptionTags: ['stone', 'barrier', 'dusty'],
          locationTags: ['wall', 'east', 'dead end'],
          canAddToInventory: false,
        },
      ],
      obstacle: [
        {
          obstacleId: 2,
          type: 'permanent obstacle',
          name: 'rubble',
          keywords: ['block', 'rubble', 'barrier', 'rock', 'stone', 'wall'],
          description:
            'The path is blocked by rubble. You need to find another way out.',
          requiredItem: null,
        },
      ],
    },
    {
      roomId: 4,
      description: `You find yourself in what appears to be a guard room. There's a small barred window high up on the wall, letting in a sliver of moonlight. On the wall hangs a ring of keys, one of which looks newer than the others.`,
      exits: [
        { roomId: 2, direction: 'west', type: 'door', hasObstacle: null },
        {
          roomId: 'exit door',
          direction: 'north',
          type: 'door',
          hasObstacle: { obstacleId: 3 },
        },
      ],
      items: [
        {
          itemId: 6,
          name: 'key',
          descriptionTags: ['metal', 'ring'],
          locationTags: ['wall', 'ring'],
          canAddToInventory: true,
        },
      ],
      obstacle: [
        {
          obstacleId: 3,
          type: 'barrier',
          name: 'rusty padlock',
          keywords: ['padlock', 'door', 'exit', 'lock', 'barrier', 'gate'],
          description: `The door has a rusty padlock that is too rusty for a key.  You won't be able to open it with a key, but it looks brittle.`,
          requiredItem: {
            itemId: 4,
          },
        },
      ],
    },
    {
      roomId: EscapeGameRoom,
      description: `As you step beyond the narrow passage, the world opens into a breathtaking valley bathed in golden sunlight. Towering emerald cliffs rise on either side, framing a vast expanse of rolling meadows dotted with wildflowers that sway in the breeze. A crystal-clear river winds through the landscape, its shimmering waters reflecting the endless blue sky above.`,
      exits: [],
      items: [],
      obstacle: [],
    },
  ],
};

export const exampleGame2: GameProps = {
  theme: 'dungeon',
  currentRoomId: null,
  introduction:
    'You awake in a dimly lit dungeon, up against a cold, stone wall. You have no memory of how you got here. There’s no time to waste. You must find a way out!',
  characterPrompt: 'How will you escape?',
  rooms: [
    {
      roomId: 1,
      description: `You enter a larger room with high, arched ceilings. The walls are lined with iron shackles, and broken pieces of furniture are strewn about. In the center, there's a heavy wooden table with scratch marks on its surface.`,
      exits: [
        {
          roomId: 'exit door',
          direction: 'east',
          type: 'door',
          hasObstacle: null,
        },
      ],

      items: [
        {
          itemId: 3,
          name: 'table',
          descriptionTags: ['wooden', 'heavy', 'scratched'],
          locationTags: ['center'],
          canAddToInventory: false,
          attachedToItem: [
            {
              itemId: 4,
              name: 'sword',
              descriptionTags: ['metal', 'rusty'],
              locationTags: ['on top'],
              canAddToInventory: true,
            },
          ],
        },
      ],
      obstacle: null,
    },
    {
      roomId: EscapeGameRoom,
      description: `As you step beyond the narrow passage, the world opens into a breathtaking valley bathed in golden sunlight. Towering emerald cliffs rise on either side, framing a vast expanse of rolling meadows dotted with wildflowers that sway in the breeze. A crystal-clear river winds through the landscape, its shimmering waters reflecting the endless blue sky above.`,
      exits: [],
      items: [],
      obstacle: [],
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
