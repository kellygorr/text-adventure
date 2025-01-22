const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const { AzureOpenAI } = require('openai');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const exampleGame = {
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
          item: 'rubble',
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

const systemPromptMakeGame = {
  role: 'system',
  content: [
    {
      type: 'text',
      text: `You are a text adventure game.  You need to create a game for the user to play.  The user must escape the dungeon.  The game must start with an introduction to set the scene, and using details from the first room (id:1).  After the introduction I will need the rooms for the user to explore and escape.  There can be more than 3 rooms, but the main path to escape should not be more than 3 rooms deep.  
      The rooms can have items, exits, and obstacles.  Items that can be picked up (canAddToInventory) include: key, spear, wand, hammer.  Keys can be used to open locks, but can only be used on one lock obstacle, they cannot be re-used.  Spear, wand, and hammer, can be used to break locks or clear blocked doors (unless it is a dead end).
      Obstacles should have required items in order to overcome them (unless it is a dead end).  The required items for an obstacle must be added to proceeding rooms, and these items must be able to be picked up and (canAddToInventory), there should not be any extra items that can be picked up.  It would be confusing to be able to pick up an item that can't be used on any obstacle.
      There should be at least one room that leads to a room with two exits, the door the user entered from and an exit called 'dead end' (marked as an obstacle).
      The first room must have a locked door obstacle, and the required item should be a key located under a chair in the room.
      The last room should have a locked or blocked exit door (marked as an obstacle).  The required item for the last obstacle must be in a room before the last room, but not in the first room.
      Example output format:
      ${JSON.stringify(exampleGame, null, 2)}
      Follow this structure when creating the game output.
      `,
    },
  ],
};

app.post('/api/generateGame', async (req, res) => {
  const { messages } = req.body;
  const url = process.env.OPENAI_API_ENDPOINT;
  console.log('messages:', messages);
  try {
    const response = await axios.post(
      url,
      {
        messages: [systemPromptMakeGame, ...messages],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.OPENAI_API_KEY,
        },
      },
    );

    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.log('ERROR', error.response?.data);
    console.error('Error calling Azure OpenAI API:', error);

    res
      .status(500)
      .json({ error: 'Failed to fetch response from Azure OpenAI' });
  }
});

app.post('/api/generateGameImage', async (req, res) => {
  const { roomDescription, adventureType } = req.body; // Expect a room description in the request body
  console.log('generateGameImage', adventureType, roomDescription);
  let prompt = ''; // Initialize the prompt
  if (adventureType === 0) {
    // Generate the prompt using the room description
    prompt = `A dark, mysterious dungeon room with ${roomDescription}. In the style of a modern cartoon, art style with rubies. The color scheme includes warm hues of red, beige, and gold, creating a cozy yet mysterious atmosphere. It is a stylized, game-inspired look. The overall style is detailed, vibrant, and slightly cartoonish.  The style is painterly, detailed, and vibrant, blending realism with a slightly exaggerated, whimsical aesthetic.`;
  } else if (adventureType === 1) {
    prompt = `A dark, mysterious forest with ${roomDescription}. In the style of a modern cartoon, art style with emerald, and rubies. The color scheme includes warm hues of green, beige, and gold, creating a cozy yet mysterious atmosphere. It is a stylized, game-inspired look. The overall style is detailed, vibrant, and slightly cartoonish. The style is painterly, detailed, and vibrant, blending realism with a slightly exaggerated, whimsical aesthetic.`;
  } else if (adventureType === 2) {
    prompt = `A dark, mysterious castle room with ${roomDescription}. In the style of a modern cartoon, art style with blue diamonds, and rubies. The color scheme includes warm hues of blue, beige, and gold, creating a cozy yet mysterious atmosphere. It is a stylized, game-inspired look. The overall style is detailed, vibrant, and slightly cartoonish. The style is painterly, detailed, and vibrant, blending realism with a slightly exaggerated, whimsical aesthetic.`;
  }

  const size = '1024x1024'; // Image size
  const n = 1; // Number of images to generate

  // Get the API endpoint and key from environment variables
  const apiUrl = process.env.DALE3_API_ENDPOINT; // Use the endpoint from your .env
  const apiKey = process.env.DALE3_API_KEY; // Use the API key from your .env

  try {
    // Create an Azure OpenAI client with the endpoint
    const client = new AzureOpenAI({
      apiKey, // Authentication via API key
      endpoint: apiUrl, // Specify the Azure OpenAI endpoint
      apiVersion: '2024-04-01-preview',
    });

    // Make the API call to generate the image
    const results = await client.images.generate({
      prompt,
      n, // Number of images to generate
      size, // Size of the image
    });

    // Extract the URL of the generated image
    const imageUrl = results.data[0]?.url;
    console.log('Generated image URL:', imageUrl);
    // Return the generated image URL in the response
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

const gameDataExampleUseItemSuccess = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'chair',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
};
const responseExampleUseItemSuccess = {
  actionType: 'UseItemSuccess',
  response:
    'You successfully used the key to unlock the door.  You can now exit the room.', // Simple example (For AI to improve upon)
  characterPrompt: `What do you do next?`, // Simple example (For AI to improve upon)
  items: [
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  obstacle: {
    obstacleId: 1,
    description: 'The door is locked, and you need a key to unlock it.',
    isCompleted: true,
    requiredItem: {
      itemId: 55,
    },
  },
  exit: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
};

const gameDataExampleUseItemFailure = {
  /** Room id.  Reference: [ID] */
  id: 4,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    'You find yourself in what appears to be a guard room. There’s a small barred window high up on the wall, letting in a sliver of moonlight. On the wall hangs a ring of keys, one of which looks newer than the others.',
  /** Items in the room.  Reference: [ITEMS] */
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
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
    {
      itemId: 6,
      item: 'key',
      location: 'ring of keys',
      canAddToInventory: true,
    },
  ],
};
const responseExampleUseItemFailure = {
  actionType: 'UseItemFailure',
  response:
    'The lock is too rusty for a key, try to find another way to open the door.', // Simple example (For AI to improve upon)
  characterPrompt: `What do you do next?`, // Simple example (For AI to improve upon)
  items: [
    {
      itemId: 6,
      item: 'key',
      location: 'ring of keys',
      canAddToInventory: true,
    },
  ],
  obstacle: {
    obstacleId: 3,
    description:
      'The door has a rusty padlock.  You won’t be able to open it with a key.',
    requiredItem: {
      itemId: 4,
    },
  },
  exit: [
    { roomId: 2, direction: 'west' },
    {
      roomId: 'exit door',
      direction: 'north',
      hasObstacle: {
        obstacleId: 3,
      },
    },
  ],
};
const gameDataExample2UseItemFailure = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'chair',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
      isCompleted: true,
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [],
};
const responseExample2UseItemFailure = {
  actionType: 'UseItemFailure',
  response: 'You have already unlocked this door', // Simple example (For AI to improve upon)
  characterPrompt: `Do you want to go through it?`, // Simple example (For AI to improve upon)
  items: null,
  obstacle: {
    obstacleId: 1,
    description: 'The door is locked, and you need a key to unlock it.',
    requiredItem: {
      itemId: 55,
    },
    isCompleted: true,
  },
  exit: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
};

const gameDataExamplePickUpItemSuccess = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old table in the center of the room, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'table',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under table',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [],
};
const responseExamplePickUpItemSuccess = {
  actionType: 'PickUpItemSuccess',
  response: 'You added a key to your inventory.', // Simple example (For AI to improve upon)
  characterPrompt: `What do you do next?`, // Simple example (For AI to improve upon)
  items: [
    {
      itemId: 55,
      item: 'key',
      location: 'under table',
      canAddToInventory: true,
    },
  ],
  obstacle: null,
  exit: null,
};

const gameDataExamplePickUpItemFailure = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'chair',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [],
};
const responseExamplePickUpItemFailure = {
  actionType: 'PickUpItemFailure',
  response:
    'That won’t fit in your inventory, and there is no time for sitting you need to escape!', // Simple example (For AI to improve upon)
  characterPrompt: `What do you do next?`, // Simple example (For AI to improve upon)
  items: {
    itemId: 1,
    item: 'chair',
    location: 'center of room',
    canAddToInventory: false,
  },
  obstacle: null,
  exit: null,
};

const gameDataExampleExitRoomSuccess = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'chair',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
      isCompleted: true,
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [],
};
const responseExampleExitRoomSuccess = {
  actionType: 'ExitRoomSuccess',
  response: 'You exit through the north door', // Simple example (For AI to improve upon)
  characterPrompt: `Explore the new room`, // Simple example (For AI to improve upon)
  items: null,
  obstacle: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
      isCompleted: true,
    },
  ],
  exit: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
};

const gameDataExampleExitRoomFailure = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'chair',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
};
const responseExampleExitRoomFailure = {
  actionType: 'ExitRoomFailure',
  response: 'The door is locked, maybe you have a key you can use on it?', // Simple example (For AI to improve upon)
  characterPrompt: `What do you do next?`, // Simple example (For AI to improve upon)
  items: null,
  obstacle: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  exit: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
};

const gameDataExampleLookAtInventory = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'chair',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
};
const responseExampleLookAtInventory = {
  actionType: 'LookAtInventory',
  response: 'I will open your inventory for you!', // Simple example (For AI to improve upon)
  characterPrompt: `What do you do next?`, // Simple example (For AI to improve upon)
  items: [
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  obstacle: null,
  exit: null,
};

const gameDataExampleInvestigate = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'chair',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [],
};
const responseExampleInvestigate = {
  actionType: 'Investigate',
  response:
    'The torch is flickering, casting eerie shadows on the wall.  It looks firmly attached to the wall', // Simple example (For AI to improve upon)
  characterPrompt: `What do you do next?`, // Simple example (For AI to improve upon)
  items: null,
  obstacle: null,
  exit: null,
};

const gameDataExampleMove = {
  /** Room id.  Reference: [ID] */
  id: 1,
  /** Room description.  Reference: [DESCRIPTION] */
  description:
    "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
  /** Items in the room.  Reference: [ITEMS] */
  items: [
    {
      itemId: 1,
      item: 'chair',
      location: 'center of room',
      canAddToInventory: false,
    },
    {
      itemId: 55,
      item: 'key',
      location: 'under chair',
      canAddToInventory: true,
    },
  ],
  /** Obstacles in the room.  Reference: [OBSTACLES] */
  Obstacles: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      requiredItem: {
        itemId: 55,
      },
    },
  ],
  /** Exits in the room.  Reference: [EXITS] */
  exits: [
    {
      roomId: 2,
      direction: 'north',
      hasObstacle: {
        obstacleId: 1,
      },
    },
  ],
  /** User's inventory.  Reference: [INVENTORY] */
  inventory: [],
};
const responseExampleMove = {
  actionType: 'Move',
  response:
    'You walk over to the chair, it looks like there might be something under it.', // Simple example (For AI to improve upon)
  characterPrompt: `What do you do next?`, // Simple example (For AI to improve upon)
  items: null,
  obstacle: null,
  exit: null,
};

const responseExampleUnknownAction = {
  actionType: 'UnknownAction',
  response:
    'Unable to determine the action. Please try something else or ask for help.', // Simple example (For AI to improve upon)
  characterPrompt: `Try something else`, // Simple example (For AI to improve upon)
  items: null,
  obstacle: null,
  exit: null,
};

app.post('/api/playerAction', async (req, res) => {
  const { messages, room, inventory, theme } = req.body;
  const url = process.env.OPENAI_API_ENDPOINT;
  console.log('messages:', messages);
  console.log('room items', room?.items);
  console.log('theme', theme);

  const systemPrompt = {
    role: 'system',
    content: [
      {
        type: 'text',
        text: `You are a text adventure game system. 
          Your task is to determine the action the user is taking based on the provided game data.
          The user will explore the room, interact with items, manage their inventory, and overcome obstacles.
          Based on their input, you must:

          1. Determine the ActionType:
          The AI needs to understand the action the player is trying to take based on the user's input.
          You will use the game data, rules, and conditions (listed below) to interpret the player's intent, determine if they were successful, and determine the correct actionType.
          The possible actionTypes are:
          - Move
          - PickUpItemSuccess
          - UseItemSuccess
          - UseItemFailure
          - PickUpItemFailure
          - Investigate
          - LookAtInventory
          - ExitRoomSuccess
          - ExitRoomFailure
          - UnknownAction

          2. Formulate the Response:
          Once the actionType is determined, the AI should return plain object (as defined in the output section below and not wrapped in any additional JSON formatting or block quotes) that includes:
          - The actionType
          - response: A short human-readable response that describes the outcome of the action for the player
          - characterPrompt: A short prompt to guide the player on their next action
          - The exact item/exit/obstacle/inventory object (if any) that was relevant to the action taken (e.g., item picked up, item used on obstacle, room exited etc.).

        /***** Game data START.  Reference: [GAME DATA].  Do not modify *****/ 
        Game data: {
          /** Room id.  Reference: [ID] */
          id: ${room?.id},
          /** Room description.  Reference: [DESCRIPTION] */
          description: ${room?.description}, 
          /** Items in the room.  Reference: [ITEMS] */
          items: ${room?.items},
          /** Obstacles in the room.  Reference: [OBSTACLES] */
          Obstacles: ${room?.obstacle},
          /** Exits in the room.  Reference: [EXITS] */
          exits: ${room?.exits},
          /** User's inventory.  Reference: [INVENTORY] */
          inventory: ${inventory ? inventory : []},
        }
        /***** Game data END *****/

        /***** [ITEMS] rules *****/
        - **Overview**: An array of items (items: ItemProps[]) in the room that the user can investigate or pick up.
        - **ActionType**: 
            - "PickUpItemSuccess"
            - "PickUpItemFailure"
            - "Investigate"
        - **Rules**:
            - Items with "canAddToInventory: false" **cannot** be picked up.
            - Items with "canAddToInventory: true" **can** be picked up.
            - Each item has a unique "itemId" that must not be changed.
            - The user can pick up multiple items at a time.
        - **Interface**:
            export interface ItemProps {
              itemId: number;
              item: string;
              location: string;
              canAddToInventory?: boolean;
              image?: string;
            }

        /***** [OBSTACLES] rules *****/
          - **Overview**: An array of obstacles (obstacle: ObstacleProps[]) in the room that the user can overcome.
          - **ActionType**:
              - "UseItemSuccess"
              - "UseItemFailure"
              - "Investigate"
          - **Rules**:
              - Obstacles with "requiredItem: null" **cannot** be overcome (this will likely be attached to a blocked door).
              - Obstacles with "requiredItem.itemId" require the user to have that item (an inventory item with a matching "itemId") in their inventory in order to overcome.
              - Obstacles that have been completed will have "isCompleted: true" (users do not need to overcome an obstacle that is already completed).
          - **Interface**:
              export interface ObstacleProps {
                obstacleId: number;
                description: string;
                requiredItem: {
                  itemId: number;
                } | null;
              }
       

        /***** [EXITS] rules *****/
        - **Overview**: An array of exits (exits: ExitProps[]) in the room that the user can use to access new rooms.
        - **ActionType**:
            - "ExitRoomSuccess"
            - "ExitRoomFailure"
            - "UseItemSuccess"
            - "UseItemFailure"
            - "Investigate"
        - **Rules**:
            - Exits have a "direction" (e.g., north, south, east, west), representing where the exit is located in the room.
            - Some exits have an "obstacle" ("hasObstacle.obstacleId") that references an obstacle from the [OBSTACLES] list, which the user must overcome in order to use the exit.
            - Exits referencing an [OBSTACLES] with "isCompleted: true" can be used.
            - Exits without an obstacle can be used freely.
            - Exits have a "roomId" that references:
                - The room the user will enter if they successfully use the exit.
                - A "roomId" of "dead end" (not accessible, usually with an obstacle that has "requiredItem: null").
                - A "roomId" of "exit door" (the final exit to freedom).
        - **Interface**:
            export interface ExitProps {
              roomId: number | 'exit door' | 'dead end';
              direction: string;
              /** Add obstacle ID if applicable */
              hasObstacle?: {
                obstacleId: number;
              };
            }

        /***** [INVENTORY] rules *****/
        - **Overview**: An array of inventory items (inventory: ItemProps[]) that the user has picked up.
        - **ActionType**:
            - "UseItemSuccess"
            - "UseItemFailure"
            - "LookAtInventory"
            - "Investigate"
        - **Rules**:
            - Inventory items are picked up from [ITEMS] in the room.
            - No duplicate inventory items.
            - Users use inventory items on obstacles. The "itemId" of the inventory item must match the "requiredItem.itemId" of the [OBSTACLES] in order to succeed.
            - Users can only use **one** inventory item at a time.
            - Users can look at their inventory at any time.
        - **Interface (shared with [ITEMS])**:
            export interface ItemProps {
              itemId: number;
              item: string;
              location: string;
              canAddToInventory?: boolean;
              image?: string;
            }

        /***** actionType: PickUpItemSuccess Conditions *****/
        /** ALL conditions below must be met for actionType: PickUpItemSuccess **/
        - User explicitly requests to pick up an item.
        - The item is one of the available [ITEMS] in the room.
        - The item has "canAddToInventory: true".

        /***** actionType: PickUpItemFailure Conditions *****/
        /** ANY condition below results in actionType: PickUpItemFailure **/
        - The item is not one of the available [ITEMS] in the room.
        - The item has "canAddToInventory: false".
  
        /***** actionType: UseItemSuccess Conditions *****/
        /** ALL conditions below must be met for actionType: UseItemSuccess **/
        - User requests to use an item from their [INVENTORY] on an [OBSTACLES].
        - The "itemId" of the [INVENTORY] item matches the "requiredItem.itemId" of the [OBSTACLES].
        - The target [OBSTACLES] is in the current room.
        - The [OBSTACLES] has "isCompleted: false".

        /***** actionType: UseItemFailure Conditions *****/
        /** ANY condition below results in actionType: UseItemFailure **/
        - The item is not in the user's [INVENTORY].
        - The target is not a valid [OBSTACLES] in the room.
        - The [OBSTACLES] has "isCompleted: true".
        - The "itemId" does not match the "requiredItem.itemId" of the [OBSTACLES].
        - The [OBSTACLES] has "requiredItem: null" (cannot be completed).
        - User attempts to use more than one [INVENTORY] item at a time.

        /***** actionType: ExitRoomSuccess Conditions *****/
        /** ALL conditions below must be met for actionType: ExitRoomSuccess **/
        - User explicitly requests to exit the room or use an [EXITS].
        - The selected [EXITS] exists in the current room.
        - Users are not required to complete all [OBSTACLES] to use an [EXITS].
        - If the [EXITS] has "hasObstacle.obstacleId", the corresponding [OBSTACLES] must have "isCompleted: true".
        - If the [EXITS] does not have "hasObstacle.obstacleId", the exit can be used freely.

        /***** actionType: ExitRoomFailure Conditions *****/
        /** ANY condition below results in actionType: ExitRoomFailure **/
        - The selected exit is not part of the room's [EXITS].
        - The user's intended exit is unclear (e.g., following "UseItemSuccess" on an [EXITS], assume they are attempting that exit).
        - The [EXITS] has "hasObstacle.obstacleId", but the required [OBSTACLES] is not completed.
        - The [EXITS] leads to a room with "roomId: 'dead end'".

        /***** actionType: Investigate Conditions *****/
        /** ANY condition below results in actionType: Investigate **/
        - The user is investigating an [ITEMS], [OBSTACLES], or [EXITS]
        - The user is investigating something described in the [DESCRIPTION] of the room
        - The user is trying to investigate something in the room

        /***** actionType: LookAtInventory Conditions *****/
        /** ANY condition below results in actionType: LookAtInventory **/
         - The user wants to look at or get information about something in their [INVENTORY]
         - The user wants to open their inventory

        /***** actionType: Move Conditions *****/
        /** ANY condition below results in actionType: Move **/
        - The user is trying to move to a specific location or object in the room (e.g., "walk to chair")
        - The user is not trying to exit the room (which would trigger actionType: ExitRoomSuccess or ExitRoomFailure)

        /***** actionType: UnknownAction Conditions *****/
        /** ANY condition below results in actionType: UnknownAction **/
        - When the user's action cannot be determined based on the provided game data, rules, and conditions.

        Use the above game data, rules, and conditions to determine the user's actionType.

        /** 
         ** OUTPUT SECTION: STRUCTURE AND EXAMPLES
        ** This section defines the expected response structure based on the user's actions which you previously determined through the actionType.  
        ** Do not add any additional formatting (e.g., "json" blocks or extra quotes around the object). Only return the plain object.
        ** This section includes:
        ** 1. The base ActionResponse interface that all responses must follow.
        ** 2. Example responses for each actionType, illustrating how the AI should format its output. The examples include game data and other relevant context to guide your response.
        ** 3. Verify that the response output matches the expected structure and content for each actionType
        **/

        ### 1. Base Interface

        The "ActionResponse" interface defines the baseline structure for all responses. Fields marked as optional ("| null") may only be required for certain "actionType"s, as detailed in the specific examples below.

        export interface ActionResponse {
          /** The action the user is trying to take. */
          actionType: ActionType; // Always required
           /** This is the result of the user's action.
           * Example responses like "You added a key to your inventory" are intentionally bland and basic.
           * The AI should **not** use these directly but instead create rich, imaginative responses that convey 
           * the outcome of the action in a vivid and engaging way. Add sensory details, emotions, and other 
           * immersive elements to make the world feel alive. Example:
           * "You kneel down and grasp a small, rusted key from under the chair. It feels cold and slightly jagged, 
           * as if it has been hidden away for years. You can't help but wonder what it might unlock."
           */
          response: string; // Always required: A human-readable string
           /** A short prompt to help the character with their next action. 
           * Encouraging creative thinking and open-ended possibilities. 
           * The AI should craft a prompt that sparks imagination and invites player exploration. 
           * Example: "What do you do next?", "Try something else", "You have already tried that", "You can't pick that up".
           */
          characterPrompt: string; // Always required: A follow-up prompt for the player
          /** An [ITEM]/[ITEM]'s or [INVENTORY] item that is relevant to the user's current action. Do not make changes to [ITEM] or [INVENTORY] objects.  Optional by default */
          items: Array<ItemProps> | null;
          /** An [OBSTACLE] that is relevant to the user's current action. Do not make changes to [OBSTACLE] objects, except when adding isCompleted:true. Optional by default */
          obstacle: ObstacleProps | null;
          /** An [EXIT] that is relevant to the user's current action. Do not make changes to [EXIT] objects. Optional by default */
          exit: ExitProps | null;
        }

        ### 2. Examples for each actionType
       /**
       * Notes about these examples:
       * - **Placeholder examples for "response" and "characterPrompt"**:
       *   - The strings provided in the "response" and "characterPrompt" fields are **intentionally simple** placeholders.
       *   - The AI must **never use these placeholders verbatim** and is required to **generate creative and original content** for these fields.
       *   - The goal is to expand these placeholders with **immersive sensory details, emotional tone, and narrative depth**, creating a compelling experience for the player.
       *
       * - **Detailed expectations**:
       *   - **Response**:
       *     - Add rich descriptive details, emotions, or environmental context.
       *     - Example placeholder: "'You added a key to your inventory.'"
       *     - Expected output: "'You kneel down and grasp a small, rusted key from under the chair. The metal is cold and slightly jagged, suggesting it has been hidden away for years. You wonder what it might unlock.'"
       * 
       *   - **CharacterPrompt**:
       *     - Keep it **concise (1 sentence)** and encourage creative player engagement.
       *     - Example placeholder: "'What do you do next?'"
       *     - Expected output: "'What will you do with the key?'"
       * 
       *    - **Example Game data**:
       *    - The example game data is provided to give context for the example responses, but should not be outputted.  Use the [GAME DATA] in the response.
       */

        /***** actionType: UseItemSuccess *****/
         - Example 1:
        Example game data: ${JSON.stringify(gameDataExampleUseItemSuccess, null, 2)}
        Example Response output: ${JSON.stringify(responseExampleUseItemSuccess, null, 2)}

        /***** actionType: UseItemFailure *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExampleUseItemFailure, null, 2)}
        Example Response output: ${JSON.stringify(responseExampleUseItemFailure, null, 2)}
        - Example 2:
        Example game data: ${JSON.stringify(gameDataExample2UseItemFailure, null, 2)}
        Example Response output: ${JSON.stringify(responseExample2UseItemFailure, null, 2)}

        /***** actionType: ExitRoomSuccess *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExampleExitRoomSuccess, null, 2)}
        Example Response output: ${JSON.stringify(responseExampleExitRoomSuccess, null, 2)}

        /***** actionType: ExitRoomFailure *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExampleExitRoomFailure, null, 2)}
        Example Response output: ${JSON.stringify(responseExampleExitRoomFailure, null, 2)}

        /***** actionType: PickUpItemSuccess *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExamplePickUpItemSuccess, null, 2)}
        Example Response output: ${JSON.stringify(responseExamplePickUpItemSuccess, null, 2)}

        /***** actionType: PickUpItemFailure *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExamplePickUpItemFailure, null, 2)}
        Example Response output: ${JSON.stringify(responseExamplePickUpItemFailure, null, 2)}

        /***** actionType: Investigate *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExampleInvestigate, null, 2)}
        Example Response output: ${JSON.stringify(responseExampleInvestigate, null, 2)}

        /***** actionType: LookAtInventory *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExampleLookAtInventory, null, 2)}
        Example Response output: ${JSON.stringify(responseExampleLookAtInventory, null, 2)}

        /***** actionType: Move *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExampleMove, null, 2)}
        Example Response output: ${JSON.stringify(responseExampleMove, null, 2)}

        /***** actionType: UnknownAction *****/
        - Example 1:
        Example game data: ${JSON.stringify(gameDataExampleMove, null, 2)}
        Example Response output: ${JSON.stringify(responseExampleUnknownAction, null, 2)}


        ### 3. AI Validation Rules
        Verify the response output structure and content.  When processing a player's action, ensure the response adheres to the following validation steps:
        1. Verify Correct Object Return:
        - For PickUpItemSuccess or any action involving ITEMS, validate that the returned item matches one of the valid [ITEMS] in the current room. The itemId, item, and other object properties must match exactly with the data provided in [ITEMS].
        - For actions involving OBSTACLES, INVENTORY, or EXITS, ensure the correct object from the respective [GAME DATA] reference is returned.
        
        2. Dynamic Data Matching:
        - The response must dynamically reference and validate against the provided [GAME DATA]. Do not return placeholder or hardcoded data.

        3. Output Immersive Responses:
        - Expand basic placeholders in the response and characterPrompt fields with rich sensory and narrative details. Create imaginative, engaging text to immerse the player.

        4. Response verification:
        - Check that all returned object fields align with the expected format and context provided in [GAME DATA]. If there are any discrepancies in field values or mismatches with [ITEMS], [OBSTACLES], [INVENTORY], or [EXITS], correct the values to match the expected data from [GAME DATA] instead of flagging an error.
        - Ensure that the response reflects the accurate and consistent information from the provided [GAME DATA]:

        /***** [GAME DATA] *****/ 
        Game data: {
          /** Room id.  Reference: [ID] */
          id: ${room?.id},
          /** Room description.  Reference: [DESCRIPTION] */
          description: ${room?.description}, 
          /** Items in the room.  Reference: [ITEMS] */
          items: ${room?.items},
          /** Obstacles in the room.  Reference: [OBSTACLES] */
          Obstacles: ${room?.obstacle},
          /** Exits in the room.  Reference: [EXITS] */
          exits: ${room?.exits},
          /** User's inventory.  Reference: [INVENTORY] */
          inventory: ${inventory ? inventory : []},
        }
        /***** Game data END *****/
       `,
      },
    ],
  };
  try {
    const response = await axios.post(
      url,
      {
        messages: [systemPrompt, ...messages],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.OPENAI_API_KEY,
        },
      },
    );

    console.log('response:---', response.data.choices[0].message.content);
    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling Azure OpenAI API:', error);

    // Check if the error response is available
    if (error.response) {
      const statusCode = error.response.status;
      const errorMessage =
        error.response.data?.error?.message || 'Unknown error occurred';

      // Log the specific status code and message
      console.error(`Error Status: ${statusCode}, Message: ${errorMessage}`);

      // Return the exact status code and message to the client
      res.status(statusCode).json({
        error: `Azure OpenAI API returned an error: ${errorMessage}`,
      });
    } else {
      // Handle cases where there is no response (e.g., network issues)
      console.error(
        'No response received from Azure OpenAI API:',
        error.message,
      );

      res.status(500).json({
        error: 'Failed to fetch response from Azure OpenAI API',
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
