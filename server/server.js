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

const systemPromptMakeGame = {
  role: 'system',
  content: [
    {
      type: 'text',
      text: `You are a text adventure game.  You need to create a game for the player to play.  The player must escape the dungeon.  The game must start with an introduction to set the scene, and using details from the first room (id:1).  After the introduction I will need the rooms for the player to explore and escape.  There can be more than 3 rooms, but the main path to escape should not be more than 3 rooms deep.  
      The rooms can have items, exits, and obstacles.  Items that can be picked up (canAddToInventory) include: key, spear, wand, hammer.  Keys can be used to open locks, but can only be used on one lock obstacle, they cannot be re-used.  Spear, wand, and hammer, can be used to break locks or clear blocked doors (unless it is a dead end).
      Obstacles should have required items in order to overcome them (unless it is a dead end).  The required items for an obstacle must be added to proceeding rooms, and these items must be able to be picked up and (canAddToInventory), there should not be any extra items that can be picked up.  It would be confusing to be able to pick up an item that can't be used on any obstacle.
      There should be at least one room that leads to a room with two exits, the door the player entered from and an exit called 'dead end' (marked as an obstacle).
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
    prompt = `A dark, mysterious dungeon room with ${roomDescription}. In the style of a modern, cartoon, art style with rubies. The color scheme includes warm hues of red, beige, and gold, creating a cozy yet mysterious atmosphere. It is a stylized, game-inspired look. The overall style is detailed, vibrant, and slightly cartoonish.  The style is painterly, detailed, and vibrant, blending realism with a slightly exaggerated, whimsical aesthetic.`;
  } else if (adventureType === 1) {
    prompt = `A dark, mysterious forest with ${roomDescription}. In the style of a modern, cartoon, art style with emerald, and rubies. The color scheme includes warm hues of green, beige, and gold, creating a cozy yet mysterious atmosphere. It is a stylized, game-inspired look. The overall style is detailed, vibrant, and slightly cartoonish. The style is painterly, detailed, and vibrant, blending realism with a slightly exaggerated, whimsical aesthetic.`;
  } else if (adventureType === 2) {
    prompt = `A dark, mysterious castle room with ${roomDescription}. In the style of a modern, cartoon, art style with blue diamonds, and rubies. The color scheme includes warm hues of blue, beige, and gold, creating a cozy yet mysterious atmosphere. It is a stylized, game-inspired look. The overall style is detailed, vibrant, and slightly cartoonish. The style is painterly, detailed, and vibrant, blending realism with a slightly exaggerated, whimsical aesthetic.`;
  }
  console.log('prompt', prompt);

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
  // console.log('messages:', messages);
  console.log('room items', room?.items);
  console.log('theme', theme);
  console.log('inventory', inventory);
  console.log('player message', messages[messages.length - 1].content);

  const systemPrompt = {
    role: 'system',
    content: [
      {
        type: 'text',
        text: `You are a text adventure game system.  The player is interacting with you to try to explore a multi-room dungeon.  They will be trying to interact with items, manage their inventory, overcome obstacles, and go into new rooms.  
        You will need to interpret the [PLAYER MESSAGE], the [GAME DATA], and the [RULES] AND [CONDITIONS], to determine the [ACTION TYPE] and provide a response.
          
          ## ActionType. Reference: [ACTION TYPE]
            - The result of the action the player is taking

            /***** [ACTION TYPE] *****/
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

          ## Game Data. Reference: [GAME DATA]
            - The data that represents the game state, including the room, items, obstacles, exits, and inventory
            
            /***** [GAME DATA] do not modify *****/
            [GAME DATA]: {
              /** The message from the player that describes what they are trying to do.  Reference: [PLAYER MESSAGE] */
              [PLAYER MESSAGE]: ${messages[messages.length - 1].content},
              /** Room id.  Reference: [ID] */
              [ID]: ${room?.id},
              /** Room description.  Reference: [DESCRIPTION] */
              [DESCRIPTION]: ${room?.description}, 
              /** Items in the room.  This list will not change, even if a player picks up an item.  Reference: [ITEMS]/[ITEM] */
              [ITEMS]: ${room?.items},
              /** Obstacles in the room.  Reference: [OBSTACLES]/[OBSTACLE] */
              [OBSTACLES]: ${room?.obstacle},
              /** Exits in the room.  Reference: [EXITS]/[EXIT] */
              [EXITS]: ${room?.exits},
              /** User's inventory.  Reference: [INVENTORY]/[INVENTORY ITEM] */
              [INVENTORY]: ${inventory ? inventory : []}
            }

          ## Your Primary Responsibilities
            1. **Determine [ACTION TYPE]:  Understand the action the player is taking and its result**
            - To determine the [ACTION TYPE]:
              - Review the player's messages and the provided [GAME DATA] to interpret the player's intent
              - Use the [RULES] AND [CONDITIONS] to determine if the player's action was successful/unsuccessful.

            /** Important **/
            Keep track of any [GAME DATA] that was relevant to the action taken. This data will need to be returned in the response (without editing it). For example, the [ITEM] object that the player was trying to pick up.

            2. **Keep track of relevant [GAME DATA] (Dynamic Data Matching)**
            - Keep track of the exact [ITEM]/[EXIT]/[OBSTACLE]/[INVENTORY ITEM] that was relevant to the action taken.
            - The AI should return **only** the exact data from the [GAME DATA] that is relevant to the action the player is taking.
            - This means that if the player is trying to pick up an item, the **exact [ITEM]** object (with all its original attributes) should be returned, **without modification**. 
            - The AI should **never add, remove, or modify** the fields in any object from the [GAME DATA]. If the player is interacting with an item, for example, the exact "itemId", "name", "location", and "canAddToInventory" fields from the [ITEMS] array must be returned as-is.
            - The returned objects should **match the items exactly as they are in the [ITEMS] array**. 
            - The AI should only select the objects that are **relevant** to the action. For example, if the player picks up an item, only the relevant [ITEM] should be returned. If the player examines the room or obstacles, only the relevant [OBSTACLE] or [EXIT] objects should be returned.

            - **Dynamic Identification**:
              - The AI determines which part of the [GAME DATA] is relevant by matching it **exactly** with the player's input. For example, if a player says, “pick up the key under the chair,” the AI must identify the key from the [ITEMS] array, and infer which item the user is talking about and return the exact [ITEM] object for the key."

            - **Ensuring Data Integrity**:
              - **The integrity of the [GAME DATA] must be maintained.** The AI does not modify or create new objects. It should only return the exact objects from the data provided.
            
            3. **Formulate the Response/Output**:
              - Once the [ACTION TYPE] is determined, along with any relevant [GAME DATA], the AI should return a **JSON object** (as defined in the [OUTPUT] section below and not wrapped in any additional formatting or block quotes)
              - The [ACTION TYPE] that was determined based on the player's input and the [GAME DATA].
              - A response and characterPrompt that is generated by the AI (See output section for more details).
              - The **exact [ITEM]/[EXIT]/[OBSTACLE]/[INVENTORY ITEM]** (if any) that was relevant to the action taken (Dynamic Data Matching).
          
          ## Rules for [GAME DATA]. Reference: [RULES]
            - The rules that govern how the player can interact with the [GAME DATA].

            ### [ITEMS] rules
            - **Overview**: An array of [ITEM] objects in the room that the player can investigate or pick up.
            - **[ITEMS]**: ${room?.items} (do not modify [ITEM] objects)
            - **ActionType**: 
                - "PickUpItemSuccess"
                - "PickUpItemFailure"
                - "Investigate"
            - **Rules**:
                - Items with "canAddToInventory: false" **cannot** be picked up.
                - Items with "canAddToInventory: true" **can** be picked up.
                - Each item has a unique "itemId" that must not be changed.
                - The player can pick up multiple items at a time.
            - **[ITEM] Interface**:
                {
                  itemId: number;
                  name: string;
                  location: string;
                  canAddToInventory?: boolean;
                  image?: string;
                }

            ### [OBSTACLES] rules
            - **Overview**: An array of [OBSTACLE] objects in the room that the player can overcome.
            - **[OBSTACLES]**: ${room?.obstacle} (do not modify [OBSTACLE] objects)
            - **ActionType**:
                - "UseItemSuccess"
                - "UseItemFailure"
                - "Investigate"
            - **Rules**:
                - Obstacles with "requiredItem: null" **cannot** be overcome (this will likely be attached to a blocked door).
                - Obstacles with "requiredItem.itemId" require the player to have that item (an inventory item with a matching "itemId") in their inventory in order to overcome.
                - Obstacles that have been completed will have "isCompleted: true" (players do not need to overcome an obstacle that is already completed).
            - **[OBSTACLE] Interface**:
                {
                  obstacleId: number;
                  description: string;
                  requiredItem: {
                    itemId: number;
                  } | null;
                }
          
            ### [EXITS] rules
            - **Overview**: An array of [EXIT] objects in the room that the player can use to access new rooms.
            - **[EXITS]**: ${room?.exits} (do not modify [EXIT] objects)
            - **ActionType**:
                - "ExitRoomSuccess"
                - "ExitRoomFailure"
                - "UseItemSuccess"
                - "UseItemFailure"
                - "Investigate"
            - **Rules**:
                - Exits have a "direction" (e.g., north, south, east, west), representing where the exit is located in the room.
                - Some exits have an "obstacle" ("hasObstacle.obstacleId") that references an [OBSTACLE] from the [OBSTACLES] array, which the player must overcome in order to use the exit.
                - Exits referencing an [OBSTACLE] with "isCompleted: true" can be used.
                - Exits without an obstacle can be used freely.
                - Exits have a "roomId" that references:
                    - The room the player will enter if they successfully use the exit.
                    - A "roomId" of "dead end" (not accessible, usually with an obstacle that has "requiredItem: null").
                    - A "roomId" of "exit door" (the final exit to freedom).
            - **[EXIT] Interface**:
                {
                  roomId: number | 'exit door' | 'dead end';
                  direction: string;
                  hasObstacle?: {
                    obstacleId: number;
                  };
                }

            ### [INVENTORY] rules
            - **Overview**: An array of [INVENTORY ITEM] objects that the player has picked up.
            - **[INVENTORY]**: ${inventory ? inventory : []} (do not modify [INVENTORY ITEM] objects)
            - **ActionType**:
                - "UseItemSuccess"
                - "UseItemFailure"
                - "LookAtInventory"
                - "Investigate"
            - **Rules**:
                - Inventory items are picked up from [ITEMS] in the room.
                - No duplicate inventory items.
                - Users use inventory items on an [OBSTACLE]. The "itemId" of the [INVENTORY ITEM] must match the "requiredItem.itemId" of the [OBSTACLE] in order to succeed.
                - Users can only use **one** [INVENTORY ITEM] at a time.
                - Users can look at their inventory at any time.
            - **[INVENTORY ITEM] Interface**:
                {
                  itemId: number;
                  name: string;
                  location: string;
                  canAddToInventory?: boolean;
                  image?: string;
                }

          ## Conditions for [ACTION TYPE]. Reference: [CONDITIONS]
            - The conditions that determine the [ACTION TYPE] based on the player's actions and the [GAME DATA]

            ### [ACTION TYPE]: PickUpItemSuccess conditions
            /** ALL conditions below must be met for actionType: PickUpItemSuccess **/
            - User explicitly requests to pick up an item.
            - The [ITEM] is one of the available [ITEMS] (see [GAME DATA]).
            - The item has "canAddToInventory: true".

            ### [ACTION TYPE]: PickUpItemFailure conditions
            /** ANY condition below results in actionType: PickUpItemFailure **/
            - The [ITEM] is not one of the available [ITEMS] (see [GAME DATA]).
            - The item has "canAddToInventory: false".
            - The player is trying to pick up more than one item at a time.
      
            ### [ACTION TYPE]: UseItemSuccess conditions
            /** ALL conditions below must be met for actionType: UseItemSuccess **/
            - User requests to use an [INVENTORY ITEM] from their [INVENTORY] on an [OBSTACLES] (see [GAME DATA]).
            - The "itemId" of the [INVENTORY ITEM] matches the "requiredItem.itemId" of the [OBSTACLE].
            - The target [OBSTACLE] is in the current room.
            - The [OBSTACLE] is not completed ("isCompleted: false | undefined | null").

            ### [ACTION TYPE]: UseItemFailure conditions
            /** ANY condition below results in actionType: UseItemFailure **/
            - The [INVENTORY ITEM] is not in the player's [INVENTORY] (see [GAME DATA]).
            - The target is not a valid [OBSTACLE] in [OBSTACLES] (see [GAME DATA]).
            - The [OBSTACLE] has "isCompleted: true".
            - The "itemId" does not match the "requiredItem.itemId" of the [OBSTACLE].
            - The [OBSTACLE] has "requiredItem: null" (cannot be completed).
            - User attempts to use more than one [INVENTORY ITEM] at a time.

            ### [ACTION TYPE]: ExitRoomSuccess conditions
            /** ALL conditions below must be met for actionType: ExitRoomSuccess **/
            - User explicitly requests to exit the room.
            - The selected [EXIT] exists in the [EXITS] (see [GAME DATA]).
            - If the [EXIT] has "hasObstacle.obstacleId", the corresponding [OBSTACLE] must have "isCompleted: true".
            - If the [EXIT] does not have "hasObstacle.obstacleId", the exit can be used freely.
            /** Notes: **/
            - Users are not required to complete all [OBSTACLES] to use an [EXIT].

            ### [ACTION TYPE]: ExitRoomFailure conditions
            /** ANY condition below results in actionType: ExitRoomFailure **/
            - The selected [EXIT] is not part of [EXITS] (see [GAME DATA]).
            - The player's intended exit is unclear (e.g., following "UseItemSuccess" on an [EXIT], assume they are attempting that [EXIT]).
            - The [EXIT] has "hasObstacle.obstacleId", but the required [OBSTACLE] is not completed.
            - The [EXIT] leads to a room with "roomId: 'dead end'".

            ### [ACTION TYPE]: Investigate conditions
            /** ANY condition below results in actionType: Investigate **/
            - The player is investigating an [ITEM], [OBSTACLE], or [EXIT] in the room (see [GAME DATA]).
            - The player is investigating something described in the [DESCRIPTION] of the room (see [GAME DATA]).
            - The player is trying to investigate something in the room

            ### [ACTION TYPE]: LookAtInventory conditions
            /** ANY condition below results in actionType: LookAtInventory **/
            - The player wants to look at or get information about an [INVENTORY ITEM] in their [INVENTORY] (see [GAME DATA]).
            - The player wants to open their inventory

            ### [ACTION TYPE]: Move conditions
            /** ANY condition below results in actionType: Move **/
            - The player is trying to move to a specific location or object in the room (e.g., "walk to chair")
            - The player is not trying to exit the room (which would trigger actionType: ExitRoomSuccess or ExitRoomFailure)

            ### [ACTION TYPE]: UnknownAction conditions
            /** ANY condition below results in actionType: UnknownAction **/
            - When the player's action cannot be determined based on the provided game data, rules, and conditions.

          ## Output Section: Structure and examples.  Reference: [OUTPUT]
            - The expected response/output structure based on the determined [ACTION TYPE].
            - This section includes:
              1. Base response format: Instructions for how the response/output should be formatted.
              2. Example overview: An overview of how the examples are structured
              3. Examples:  Example responses for each [ACTION TYPE], illustrating how the AI should format its output.

            ### 1. Base response format
            - The output structure for all responses, which should be returned in JSON format.
            - This is for informational purposes only as the output should be in JSON format.  Do not add any additional formatting (e.g., "json" blocks or extra quotes around the object).
          
              #### Response output format.  Reference: [RESPONSE]
              {
                /** The result of the action the player is taking */
                "actionType": [ACTION TYPE]; // Always required

                /** This is the result of the player's action. 
                 * - It should include immersive sensory details, emotional tone, and narrative depth, creating a compelling experience for the player.
                */
                "response": string; // Always required

                /** A short prompt to help the character with their next action. 
                 * - This should be a short, engaging prompt to guide the player on their next action.
                 * - The prompt should be open-ended and encourage the player to continue interacting with the game.
                */
                "characterPrompt": string; // Always required
                
                /** The item that is relevant to the player's current action (if applicable).
                 * - **[ITEMS] from [GAME DATA]**: ${room?.items} (return the exact [ITEM] object, do not modify)
                 */
                "item": [ITEM]| null;

                /** The inventory item that is relevant to the player's current action (if applicable).
                 * - **[INVENTORY] from [GAME DATA]**: ${inventory ? inventory : []} (return the exact [INVENTORY ITEM] object, do not modify)
                 */
                "inventoryItem": [INVENTORY ITEM] | null;

                /** The obstacle that is relevant to the player's current action (if applicable).
                 * - **[OBSTACLES] from [GAME DATA]**: ${room?.obstacle} (return the exact [OBSTACLE] object, do not modify)
                 */
                "obstacle": [OBSTACLE] | null;
                
                /** An [EXIT] that is relevant to the player's current action (if applicable)
                 * - **[EXITS] from [GAME DATA]**: ${room?.exits} (return the exact [EXIT] object, do not modify)
                 */
                "exit": [EXIT] | null;
              }

            ### 2. Example overview
            /** An overview of how the examples are structured. */

              #### Components
              * - [EXAMPLE GAME DATA]:  Provides the context for each example.  Each example has its own [EXAMPLE GAME DATA] object (see [GAME DATA] for format details).
              * - [RESPONSE]: This is the example output returned by the AI (see [RESPONSE] for format details).
              * - [COMMENTS]: Additional notes and explanations for each example
               
              #### Notes about examples
              - This is not an exhaustive list of examples but a starting point for the AI to help understand some scenarios and how to dynamically match the [GAME DATA] in the response.
              - The AI should return the exact [ITEM], [INVENTORY ITEM], [OBSTACLE], or [EXIT] objects from the [GAME DATA] that are relevant to the player's action ([ACTION TYPE]).  You will see this in the examples when the exact object from the [EXAMPLE GAME DATA] is returned in the [RESPONSE] without modification.

              #### Example strings for "response" and "characterPrompt"
              - The strings provided in the "response" and "characterPrompt" fields are **intentionally simple** placeholders
              - The AI must **never use these placeholders verbatim** and is required to **generate creative and original content** for these fields
              - See [RESPONSE] for more information about the tone and length of the "response" and "characterPrompt" fields
              

            ### 3. Examples
            
            /***** [ACTION TYPE]: UseItemSuccess *****/
            - Example 1:  Use an [INVENTORY ITEM] successfully on an [OBSTACLE]

              [EXAMPLE GAME DATA]: {
                [PLAYER MESSAGE]: "Use key on door",
                [ID]: 1,
                [DESCRIPTION]: "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
                [ITEMS]: [{
                  itemId: 1,
                  item: "chair",
                  location: "center of room",
                  canAddToInventory: false,
                },
                {
                  itemId: 55,
                  item: "key",
                  location: "under chair",
                  canAddToInventory: true,
                }],
                [OBSTACLES]: [{
                  obstacleId: 1,
                  description: "The door is locked, and you need a key to unlock it.",
                  requiredItem: {
                    itemId: 55,
                  },
                }],
                [EXITS]: [{
                  roomId: 2,
                  direction: 'north',
                  hasObstacle: {
                    obstacleId: 1,
                  },
                }],
                [INVENTORY]: [{
                  itemId: 55,
                  item: 'key',
                  location: 'under chair',
                  canAddToInventory: true,
                }],
              }

              [RESPONSE]: {
                "actionType": "UseItemSuccess",
                "response": "You successfully used the key to unlock the door.  You can now exit the room.",
                "characterPrompt": "What do you do next?",
                "item": null,
                "inventoryItem": {
                  itemId: 55,
                  item: 'key',
                  location: 'under chair',
                  canAddToInventory: true,
                },
                "obstacle": {
                  obstacleId: 1,
                  description: "The door is locked, and you need a key to unlock it.",
                  requiredItem: {
                    itemId: 55,
                },
                "exit": {
                  roomId: 2,
                  direction: 'north',
                  hasObstacle: {
                    obstacleId: 1,
                  },
                },
              }
              
              [COMMENTS]: 
              - We can infer that the player is using the key from their inventory on the door to unlock it, because the player has a key in their inventory and there is only one door in the room.
              - The obstacle is not completed yet
              - The player is successful because the key is the required item for the door obstacle.
              - Notice that the exact [INVENTORY ITEM], [OBSTACLE], and [EXIT] objects from the [EXAMPLE GAME DATA] are returned in the response without modification.
                
            /***** actionType: UseItemFailure *****/
            --none--

            /***** actionType: ExitRoomSuccess *****/
            --none--

            /***** actionType: ExitRoomFailure *****/
            --none--

            /***** actionType: PickUpItemSuccess *****/
            - Example 1: Pick up an [ITEM] in the room successfully

              [EXAMPLE GAME DATA]: {
                [PLAYER MESSAGE]: "Pick up key under chair",
                [ID]: 1,
                [DESCRIPTION]: "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
                [ITEMS]: [{
                  itemId: 1,
                  item: "chair",
                  location: "center of room",
                  canAddToInventory: false,
                },
                {
                  itemId: 55,
                  item: "key",
                  location: "under chair",
                  canAddToInventory: true,
                }],
                [OBSTACLES]: [{
                  obstacleId: 1,
                  description: "The door is locked, and you need a key to unlock it.",
                  requiredItem: {
                    itemId: 55,
                  },
                }],
                [EXITS]: [{
                  roomId: 2,
                  direction: 'north',
                  hasObstacle: {
                    obstacleId: 1,
                  },
                }],
                [INVENTORY]: [],
              }

              [RESPONSE]: {
                "actionType": "PickUpItemSuccess",
                "response": "You added a key to your inventory.",
                "characterPrompt": "What do you do next?",
                "item": {
                  itemId: 55,
                  item: "key",
                  location: "under chair",
                  canAddToInventory: true,
                },
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              },
              
              [COMMENTS]:
              - [ITEMS] Shows that there is a key under the chair that can be picked up
              - The player can successfully pick up the key

            - Example 1: Pick up an [ITEM] in the room successfully with ambiguous message
            
              [EXAMPLE GAME DATA]: {
                [PLAYER MESSAGE]: "Pick up key",
                [ID]: 1,
                [DESCRIPTION]: "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
                [ITEMS]: [{
                  itemId: 1,
                  item: "chair",
                  location: "center of room",
                  canAddToInventory: false,
                },
                {
                  itemId: 55,
                  item: "key",
                  location: "under chair",
                  canAddToInventory: true,
                }],
                [OBSTACLES]: [{
                  obstacleId: 1,
                  description: "The door is locked, and you need a key to unlock it.",
                  requiredItem: {
                    itemId: 55,
                  },
                }],
                [EXITS]: [{
                  roomId: 2,
                  direction: 'north',
                  hasObstacle: {
                    obstacleId: 1,
                  },
                }],
                [INVENTORY]: [],
              }

              [RESPONSE]: {
                "actionType": "PickUpItemSuccess",
                "response": "You added a key to your inventory.",
                "characterPrompt": "What do you do next?",
                "item": {
                  itemId: 55,
                  item: "key",
                  location: "under chair",
                  canAddToInventory: true,
                },
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              },
              
              [COMMENTS]:
              - [ITEMS] Shows that there is a key in the room, but the player's message is ambiguous
              - Use the player's previous messages and responses to determine if they have investigated the room and found the key
              - In this scenario the player has already investigated the chair (actionType: Investigate) and the AI responded that there was a shiny key under it.  Therefore, the AI can infer that the player is trying to pick up the key.

            /***** actionType: PickUpItemFailure *****/
            - Example 1: The player tries to pick up an [ITEM] that cannot be added to their inventory
            {
              "output": {
                "actionType": "PickUpItemFailure",
                "response": "You don't want to carry that around",
                "characterPrompt": "What do you do next?",
                "item": [ITEM],
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              },
              "comments: {
                "actionType": "PickUpItemFailure",
                "response": "The result of the player's action.  This is a simple example (For AI to improve upon)",
                "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
                "item": "The [ITEM] objects from the [ITEMS] array (see [GAME DATA]) that the player tried to pick up.  Do not make changes to the [ITEM] object.",
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              }
            }
            - Example 2: The player tries to pick up more than one [ITEM] at a time
            {
              "output": {
                "actionType": "PickUpItemFailure",
                "response": "You can only pick up one item at a time.",
                "characterPrompt": "What do you do next?",
                "item": null,
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              },
              "comments: {
                "actionType": "PickUpItemFailure",
                "response": "The result of the player's action.  This is a simple example (For AI to improve upon)",
                "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
                "item": null,
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              }
            }
            - Example 3: The player tries to pick up something in the room that is not in the [ITEMS] array
            {
              "output": {
                "actionType": "PickUpItemFailure",
                "response": "You were unable to pick that up.",
                "characterPrompt": "What do you do next?",
                "item": null,
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              },
              "comments: {
                "actionType": "PickUpItemFailure",
                "response": "The result of the player's action.  This is a simple example (For AI to improve upon)",
                "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
                "item": null,
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              }
            }

            /***** actionType: Investigate *****/
            - Example 1: The player investigates the wall
            {
              "output": {
                "actionType": "Investigate",
                "response": "The wall is made of thick stone, and the torch casts eerie shadows across it.",
                "characterPrompt": "What do you do next?",
                "item": null,
                "inventoryItem": null,
                "obstacle": null,
                "exit": null,
              },
              "comments: {
                "actionType": "Investigate",
                "response": "The result of the player's action.  This is a simple example (For AI to improve upon)",
                "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
                "item": null,
                "inventoryItem": null,
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
