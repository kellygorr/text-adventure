const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const { AzureOpenAI } = require('openai');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

const example = {
  theme: 'dungeon',
  introduction:
    "You awake in a dimly lit dungeon, chained to a cold, stone wall. You have no memory of how you got here, but you know you must escape. You notice the faint scent of damp earth and hear the distant sound of dripping water echoing through the stone corridors. There’s no time to waste. You must find a way out.\n\nControls:\n- Move: north, south, east, west\n- Interact: 'explore' to look around the room and examine objects\n- Use items you collect to escape\n",
  rooms: [
    {
      id: 1,
      description:
        "You are in a small, musty cell with thick stone walls. A single torch flickers on the wall, casting eerie shadows. There's an old chair in the corner, and you notice something glinting underneath it.",
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
      text: `You are a text adventure game.  You need to create a game for the user to play.  The user must escape the dungeon.  The game must start with an introduction, and a description of the controls (user can move north/south/east/west, and explore the room and interact with items).  After the introduction I will need the rooms for the user to explore and escape.  There can be more than 3 rooms, but the main path to escape should not be more than 3 rooms deep.  There should be at least one dead end.
      Example format:
      ${JSON.stringify(example, null, 2)}
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
  const { roomDescription } = req.body; // Expect a room description in the request body

  // Generate the prompt using the room description
  const prompt = `A dark, mysterious dungeon room with ${roomDescription}. The room has medieval stone walls, dim lighting, and an eerie atmosphere. There are details like cobwebs, old wooden doors, and a small flickering torch.`;

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

    // Return the generated image URL in the response
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

const systemPrompt = {
  role: 'system',
  content: [
    {
      type: 'text',
      text: 'You are a text adventure game. You need to help the user escape the dungeon. The user can move north, south, east, or west, explore the room, and interact with items. Good luck!',
    },
  ],
};
app.post('/api/openai', async (req, res) => {
  const { messages } = req.body;
  const url = process.env.OPENAI_API_ENDPOINT;
  console.log('messages:', messages);
  try {
    const response = await axios.post(
      url,
      {
        messages: [systemPrompt, ...messages],
        max_tokens: 50,
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
    console.error('Error calling Azure OpenAI API:', error);

    res
      .status(500)
      .json({ error: 'Failed to fetch response from Azure OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
