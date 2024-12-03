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
    'You awake in a dimly lit dungeon, up against a cold, stone wall. You have no memory of how you got here, but you know you must escape. You notice the faint scent of damp earth and hear the distant sound of dripping water echoing through the stone corridors. There’s no time to waste. You must find a way out.',
  characterPrompt: 'What do you do?',
  rooms: [
    {
      id: 1,
      description:
        "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
      image:
        'https://dalleprodaue.blob.core.windows.net/private/images/23ee72c2-74db-4c8d-9263-17394387cf33/generated_00.png?se=2024-11-10T00%3A00%3A20Z&sig=RCXsALgWL%2FYc9fEd6RB7enNb8mEPKOsuLx7wETFu46Y%3D&ske=2024-11-14T00%3A50%3A21Z&skoid=f4f58869-78fa-4857-8a87-4ce5ae4ba8c3&sks=b&skt=2024-11-07T00%3A50%3A21Z&sktid=33e01921-4d64-4f8c-a055-5bdaffd5e33d&skv=2020-10-02&sp=r&spr=https&sr=b&sv=2020-10-02',
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

const systemPromptMakeGame = {
  role: 'system',
  content: [
    {
      type: 'text',
      text: `You are a text adventure game.  You need to create a game for the user to play.  The user must escape the dungeon.  The game must start with an introduction to set the scene, and using details from the first room (id:1).  After the introduction I will need the rooms for the user to explore and escape.  There can be more than 3 rooms, but the main path to escape should not be more than 3 rooms deep.  There should be at least one dead end.
      Example format:
      ${JSON.stringify(exampleGame, null, 2)}
      Please follow this structure when creating the game output.
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

const responseExample = {
  /** What action is the user trying to do? Move, PickUp, Use, or Investigate */
  actionType: 'Move | PickUp | Use| Investigate | LookAtInventory | ExitRoom',
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
app.post('/api/playerAction', async (req, res) => {
  const { messages, room, inventory } = req.body;
  const url = process.env.OPENAI_API_ENDPOINT;
  console.log('messages:', messages);

  const systemPrompt = {
    role: 'system',
    content: [
      {
        type: 'text',
        text: `You are a text adventure game. You need to help the user escape the dungeon. The user can move north, south, east, or west, explore the room, look at their inventory, and interact with items. This is a description of the current room: ${room}.  Please provide a response based on the user's last input.  You need to identify the type of action the user is trying to do, based on these options: Move, PickUp, Use, Investigate, LookAtInventory, ExitRoom.  This is the user's current inventory: ${inventory}.
        Example format:
        ${JSON.stringify(responseExample, null, 2)}
        Please follow this structure when creating the game output.`,
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

    console.log('response:', response.data.choices[0].message.content);
    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error calling Azure OpenAI API:', error);

    res
      .status(500)
      .json({ error: 'Failed to fetch response from Azure OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
