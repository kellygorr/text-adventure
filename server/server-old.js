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
  obstacle: [
    {
      obstacleId: 1,
      description: 'The door is locked, and you need a key to unlock it.',
      isCompleted: true,
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
          
          ### Your Primary Responsibilities
          1. **Determine ActionType**:
          - Understand the action the player is taking based on the user's input and the provided [GAME DATA].
          - You will use the rules, and conditions (listed below) to interpret the player's intent, determine if their action was successful, and determine the correct actionType.
          - The possible actionTypes are:
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

          /** Important **/
          Keep track of any [GAME DATA] that was relevant to the action taken.  This data will need to be returned in the response (without editing it).  For example the [ITEMS] object that the user was trying to pick up.

          2. Return relevant [GAME DATA] (Dynamic Data Matching):
          The AI should return the [GAME DATA] that was relevant to the action taken.  This can includes objects from the [ITEMS], [EXITS], [OBSTACLES], and [INVENTORY] arrays.  These objects should not be modified and should be returned as-is in the response.
          - Dynamic Identification:  The AI dynamically determines which part of the [GAME DATA] is relevant based on the specific action (e.g., "PickUpItemSuccess").
          - Ensuring Data Integrity:  The [GAME DATA] itself remains immutable. The AI does not modify the data but uses it as-is for validation and response.
          
          3. Formulate the Response:
          Once the actionType is determined, the AI should return a JSON object (as defined in the output section below and not wrapped in any additional formatting or block quotes) that includes:
          - The actionType
          - A response and characterPrompt that is generated by the AI (See output section for more details).
          - The exact [ITEMS]/[EXITS]/[OBSTACLES]/[INVENTORY] object (if any) that was relevant to the action taken (Dynamic Data Matching).

        ### Game data (Reference: [GAME DATA])
          /** Room id.  Reference: [ID] */
          [ID]: ${room?.id},
          /** Room description.  Reference: [DESCRIPTION] */
          [DESCRIPTION]: ${room?.description}, 
          /** Items in the room.  Reference: [ITEMS] */
          [ITEMS]: ${room?.items},
          /** Obstacles in the room.  Reference: [OBSTACLES] */
          [OBSTACLES]: ${room?.obstacle},
          /** Exits in the room.  Reference: [EXITS] */
          [EXITS]: ${room?.exits},
          /** User's inventory.  Reference: [INVENTORY] */
          [INVENTORY]: ${inventory ? inventory : []},
  

        /***** [ITEMS] rules *****/
        - **Overview**: An array of [ITEMS] objects (ItemProps[]) in the room that the user can investigate or pick up.
        - **[ITEMS]**: ${room?.items} (do not modify [ITEMS] objects)
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
          - **Overview**: An array of [OBSTACLES] objects (ObstacleProps[]) in the room that the user can overcome.
          - **[OBSTACLES]**: ${room?.obstacle} (do not modify [OBSTACLES] objects)
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
        - **Overview**: An array of [EXITS] objects (ExitProps[]) in the room that the user can use to access new rooms.
        - **[EXITS]**: ${room?.exits} (do not modify [EXITS] objects)
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
              hasObstacle?: {
                obstacleId: number;
              };
            }

        /***** [INVENTORY] rules *****/
        - **Overview**: An array of [INVENTORY] objects (ItemProps[]) that the user has picked up.
        - **[INVENTORY]**: ${inventory ? inventory : []} (do not modify [INVENTORY] objects)
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
        - The item is one of the available [ITEMS] in the room ([ITEMS]: ${room?.items}).
        - The item has "canAddToInventory: true".

        /***** actionType: PickUpItemFailure Conditions *****/
        /** ANY condition below results in actionType: PickUpItemFailure **/
        - The item is not one of the available [ITEMS] in the room ([ITEMS]: ${room?.items}).
        - The item has "canAddToInventory: false".
        - The user is trying to pick up more than one item at a time.
  
        /***** actionType: UseItemSuccess Conditions *****/
        /** ALL conditions below must be met for actionType: UseItemSuccess **/
        - User requests to use an item from their [INVENTORY] ([INVENTORY]: ${room?.inventory}) on an [OBSTACLES] ([OBSTACLES]: ${room?.obstacle}).
        - The "itemId" of the [INVENTORY] item matches the "requiredItem.itemId" of the [OBSTACLES].
        - The target [OBSTACLES] is in the current room.
        - The [OBSTACLES] has "isCompleted: false | undefined | null".

        /***** actionType: UseItemFailure Conditions *****/
        /** ANY condition below results in actionType: UseItemFailure **/
        - The item is not in the user's [INVENTORY] ([INVENTORY]: ${room?.inventory}).
        - The target is not a valid [OBSTACLES] in the room ([OBSTACLES]: ${room?.obstacle}).
        - The [OBSTACLES] has "isCompleted: true".
        - The "itemId" does not match the "requiredItem.itemId" of the [OBSTACLES].
        - The [OBSTACLES] has "requiredItem: null" (cannot be completed).
        - User attempts to use more than one [INVENTORY] item at a time.

        /***** actionType: ExitRoomSuccess Conditions *****/
        /** ALL conditions below must be met for actionType: ExitRoomSuccess **/
        - User explicitly requests to exit the room or use an [EXITS] ([EXITS]: ${room?.exits}).
        - The selected [EXITS] exists in the current room.
        - Users are not required to complete all [OBSTACLES] to use an [EXITS].
        - If the [EXITS] has "hasObstacle.obstacleId", the corresponding [OBSTACLES] must have "isCompleted: true".
        - If the [EXITS] does not have "hasObstacle.obstacleId", the exit can be used freely.

        /***** actionType: ExitRoomFailure Conditions *****/
        /** ANY condition below results in actionType: ExitRoomFailure **/
        - The selected exit is not part of the room's [EXITS] ([EXITS]: ${room?.exits}).
        - The user's intended exit is unclear (e.g., following "UseItemSuccess" on an [EXITS], assume they are attempting that exit).
        - The [EXITS] has "hasObstacle.obstacleId", but the required [OBSTACLES] is not completed.
        - The [EXITS] leads to a room with "roomId: 'dead end'".

        /***** actionType: Investigate Conditions *****/
        /** ANY condition below results in actionType: Investigate **/
        - The user is investigating an [ITEMS], [OBSTACLES], or [EXITS] in the room ([ITEMS]:${room?.items}, [OBSTACLES]:${room?.obstacle}, [EXITS]:${room?.exits}).
        - The user is investigating something described in the [DESCRIPTION] of the room ([DESCRIPTION]:${room?.description})
        - The user is trying to investigate something in the room

        /***** actionType: LookAtInventory Conditions *****/
        /** ANY condition below results in actionType: LookAtInventory **/
         - The user wants to look at or get information about something in their [INVENTORY] ([INVENTORY]: ${room?.inventory}).
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
        ** Do not add any additional formatting (e.g., "json" blocks or extra quotes around the object). Only return a JSON object.
        ** This section includes:
        ** 1. The base ActionResponse interface that all responses must follow.
        ** 2. Example responses for each actionType, illustrating how the AI should format its output.
        ** 3. Verify that the response output matches the expected structure and content for each actionType
        **/

        ### 1. Base Interface

        The "ActionResponse" interface defines the baseline structure for all responses. Fields marked as optional ("| null") may only be required for certain "actionType"s, as detailed in the specific examples below.  
        This is for informational purposes only as the output should be in JSON format.

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
          /** An [ITEMS] or [INVENTORY] object that is relevant to the user's current action (Dynamic Data Matching from the [GAME DATA][INVENTORY]). Do not make changes to [ITEMS] or [INVENTORY] objects, the objects must be return exactly as they appear from the [GAME DATA].  Optional by default */
          items: Array<ItemProps> | null;
          /** An [OBSTACLES] that is relevant to the user's current action (Dynamic Data Matching from the [GAME DATA][OBSTACLES]). Do not make changes to [OBSTACLES] objects, the objects must be return exactly as they appear from the [GAME DATA]. Optional by default */
          obstacle: ObstacleProps[] | null;
          /** An [EXITS] that is relevant to the user's current action (Dynamic Data Matching from the [GAME DATA][EXITS]). Do not make changes to [EXITS] objects, the objects must be return exactly as they appear from the [GAME DATA]. Optional by default */
          exit: ExitProps | null;
        }

        ### 2. Examples for each actionType
        /**
         * Notes about these examples:
         * - **This is the format of the examples **:
         *  {
         *    "output": "This is the expected JSON object that the AI should return."
         *    "comments": "These are additional notes and explanations for each field in the output.  These are not part of the output and should not be included in the response."
         *  }
         * - **Placeholder examples for "response" and "characterPrompt"**:
         *   - The strings provided in the "response" and "characterPrompt" fields are **intentionally simple** placeholders.
         *   - The AI must **never use these placeholders verbatim** and is required to **generate creative and original content** for these fields.
         *   - The goal is to expand these placeholders with **immersive sensory details, emotional tone, and narrative depth**, creating a compelling experience for the player.
         */

        /***** actionType: UseItemSuccess *****/
         - Example 1:  Use an [INVENTORY] item successfully on an [OBSTACLES]
         {
            "output": {
              "actionType": "UseItemSuccess",
              "response": "You successfully used the key to unlock the door.  You can now exit the room.",
              "characterPrompt": "What do you do next?",
              "items": [ [INVENTORY] ],
              "obstacle": [ [OBSTACLES] ],
              "exit": [ [EXITS] ],
            },
            "comments: {
              "actionType": "UseItemSuccess",
              "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
              "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
              "items": "The object from the [INVENTORY] array (from the [GAME DATA]) that the player used to overcome the [OBSTACLES].  Do not make changes to the [INVENTORY] object.",
              "obstacle": "The object from the [OBSTACLES] array (from the [GAME DATA]) that the player successfully overcame.  Do not make changes to the [OBSTACLES] object.",
              "exit": "The object from the [EXITS] array (from the [GAME DATA]) that is now accessible after overcoming the [OBSTACLES].  Some obstacles are not attached to exits and would return 'null' instead.  Do not make changes to the [EXITS] object."
            }
          }

        /***** actionType: UseItemFailure *****/
        --none--

        /***** actionType: ExitRoomSuccess *****/
        --none--

        /***** actionType: ExitRoomFailure *****/
        --none--

        /***** actionType: PickUpItemSuccess *****/
        - Example 1: Pick up an [ITEMS] in the room successfully
        - [ITEMS] (select the [ITEMS] object the user is trying to pick up): ${room?.items}
        {
          "output": {
            "actionType": "PickUpItemSuccess",
            "response": "You added a key to your inventory.",
            "characterPrompt": "What do you do next?",
            "items": [ [ITEMS] ],
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "PickUpItemSuccess",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "items": "One of the objects for the [ITEMS] array: ${room?.items}.  The object from the [ITEMS] array that the player picked up.  Do not make changes to the [ITEMS] object.  The itemId must match the item picked up.",
            "obstacle": null,
            "exit": null,
          }
        }

        /***** actionType: PickUpItemFailure *****/
        - Example 1: The user tries to pick up an [ITEMS] that cannot be added to their inventory
        - [ITEMS] (select the [ITEMS] object the user is trying to pick up): ${room?.items}
        {
          "output": {
            "actionType": "PickUpItemFailure",
            "response": "You don't want to carry that around",
            "characterPrompt": "What do you do next?",
            "items": [ [ITEMS] ],
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "PickUpItemFailure",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "items": "One of the objects for the [ITEMS] array: ${room?.items}. The object from the [ITEMS] array that the player tried to pick up.  Do not make changes to the [ITEMS] object.",
            "obstacle": null,
            "exit": null,
          }
        }
        - Example 2: The user tries to pick up more than one [ITEMS] at a time
        {
          "output": {
            "actionType": "PickUpItemFailure",
            "response": "You can only pick up one item at a time.",
            "characterPrompt": "What do you do next?",
            "items": null,
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "PickUpItemFailure",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "items": null,
            "obstacle": null,
            "exit": null,
          }
        }
        - Example 3: The user tries to pick up something in the room that is not in the [ITEMS] array
        {
          "output": {
            "actionType": "PickUpItemFailure",
            "response": "You were unable to pick that up.",
            "characterPrompt": "What do you do next?",
            "items": null,
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "PickUpItemFailure",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "items": null,
            "obstacle": null,
            "exit": null,
          }
        }

        /***** actionType: Investigate *****/
        - Example 1: The user investigates the wall
        {
          "output": {
            "actionType": "Investigate",
            "response": "The wall is made of thick stone, and the torch casts eerie shadows across it.",
            "characterPrompt": "What do you do next?",
            "items": null,
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "Investigate",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "items": null,
            "obstacle": null,
            "exit": null
          }
        }

        /***** actionType: LookAtInventory *****/
        --none--

        /***** actionType: Move *****/
        --none--

        /***** actionType: UnknownAction *****/
        --none--

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
