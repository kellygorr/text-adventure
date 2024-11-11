export interface GameProps {
  theme: string;
  introduction: string;
  rooms: Array<RoomProps>;
}

export interface RoomProps {
  id: number;
  description: string;
  image?: string;
  exits: Array<string>;
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

export const exampleGame: GameProps = {
  theme: 'dungeon',
  introduction:
    "You awake in a dimly lit dungeon, chained to a cold, stone wall. You have no memory of how you got here, but you know you must escape. You notice the faint scent of damp earth and hear the distant sound of dripping water echoing through the stone corridors. There’s no time to waste. You must find a way out.\n\nControls:\n- Move: north, south, east, west\n- Interact: 'explore' to look around the room and examine objects\n- Use items you collect to escape\n",
  rooms: [
    {
      id: 1,
      description:
        "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
      image:
        'https://dalleprodaue.blob.core.windows.net/private/images/23ee72c2-74db-4c8d-9263-17394387cf33/generated_00.png?se=2024-11-10T00%3A00%3A20Z&sig=RCXsALgWL%2FYc9fEd6RB7enNb8mEPKOsuLx7wETFu46Y%3D&ske=2024-11-14T00%3A50%3A21Z&skoid=f4f58869-78fa-4857-8a87-4ce5ae4ba8c3&sks=b&skt=2024-11-07T00%3A50%3A21Z&sktid=33e01921-4d64-4f8c-a055-5bdaffd5e33d&skv=2020-10-02&sp=r&spr=https&sr=b&sv=2020-10-02',
      exits: ['north'],
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
      exits: ['south', 'east', 'north'],
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
      exits: ['south'],
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
      exits: ['west'],
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
