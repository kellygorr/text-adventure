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
  currentRoomId: null,
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
          locationTags: ['center'],
          canAddToInventory: false,
        },
        {
          itemId: 2,
          name: 'key',
          locationTags: ['chair'],
          canAddToInventory: true,
        },
      ],
      obstacle: [
        {
          obstacleId: 1,
          type: 'door',
          keywords: ['door', 'exit', 'lock', 'barrier', 'gate'],
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
        { roomId: 1, direction: 'south', hasObstacle: null },
        { roomId: 4, direction: 'east', hasObstacle: null },
        { roomId: 3, direction: 'north', hasObstacle: null },
      ],

      items: [
        {
          itemId: 3,
          name: 'table',
          locationTags: ['center'],
          canAddToInventory: false,
        },
        {
          itemId: 4,
          name: 'sword',
          locationTags: ['table'],
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
        { roomId: 2, direction: 'south', hasObstacle: null },
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
          locationTags: ['wall', 'east', 'dead end'],
          canAddToInventory: false,
        },
      ],
      obstacle: [
        {
          obstacleId: 2,
          type: 'permanent obstacle',
          keywords: ['block', 'rubble', 'barrier', 'rock', 'stone', 'wall'],
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
        { roomId: 2, direction: 'west', hasObstacle: null },
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
          locationTags: ['wall', 'ring'],
          canAddToInventory: true,
        },
        {
          itemId: 7,
          name: 'rusty padlock',
          locationTags: ['exit', 'door', 'north'],
          canAddToInventory: false,
        },
      ],
      obstacle: [
        {
          obstacleId: 3,
          type: 'door',
          keywords: ['door', 'exit', 'lock', 'padlock', 'barrier', 'gate'],
          description: `The door has a rusty padlock.  You won't be able to open it with a key.`,
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

app.post('/api/playerAction', async (req, res) => {
  console.log('req.body:', req.body);
  const {
    messages,
    actionType,
    playerMessage,
    roomId,
    roomDescription,
    roomItems,
    roomExits,
    inventory,
    item,
    attachedToItem,
    obstacle,
    requiredItem,
    exit,
  } = req.body;
  const url = process.env.OPENAI_API_ENDPOINT;
  console.log(
    'InvestigateItem',
    attachedToItem,
    actionType === 'InvestigateItem',
    attachedToItem?.length > 0,
  );
  const systemPrompt = {
    role: 'system',
    content: [
      {
        type: 'text',
        text: `You are the narrator for an interactive text adventure game. Your role is to vividly describe the outcome of the player's actions, creating an immersive and dynamic story.

        # 1. Incoming data 
        You will be provided with the following information:
        - **[GAME DATA]**: Contextual game information, such as the action the user is taking, a description of the room, items, obstacles, exits, and more.
        - **Definitions**: A description of key game elements and their properties.

          ## [GAME DATA] (Do not modify data)
          Here is the data you will be working with:   
          [GAME DATA]: {
            /** The type of action the player is attempting (see [ACTION TYPE] Definitions) */
            [ACTION TYPE]: ${actionType},
            /** The player's specific input, which may include details about their intent. */
            [PLAYER MESSAGE]: ${playerMessage},
            /** The room id */
            [ROOM ID]: ${roomId},
            /** The room description. */
            [ROOM DESCRIPTION]: ${roomDescription}, 
            /** The items in the room. */
            [ROOM ITEMS]: ${roomItems},
            /** The exits in the room. */
            [ROOM EXITS]: ${roomExits},
            /** The player's inventory. */
            [INVENTORY]: ${inventory},
            /** The item the user is interacting with or using (if applicable) */
            [ITEM]: ${item},
            /** Items attached to the item the user is interacting with (if applicable).  See locationTags for details about the items location in relation to the parent item */
            [ATTACHED TO ITEM] : ${attachedToItem}
            /** The obstacle the user is interacting with (if applicable) */
            [OBSTACLE]: ${obstacle},
            /** The required item to overcome the obstacle (if applicable) */
            [REQUIRED OBSTACLE ITEM]: ${requiredItem},
            /** The exit the user is interacting with (if applicable) */
            [EXIT]: ${exit}
          }
        
          ## Definitions
            ### [ACTION TYPE] Definition
            - **Move**: The player moves to a location within the room.
            - **PickUpItemSuccess**: The player successfully picks up an item.
            - **UseItemSuccess**: The player successfully uses an item.
            - **UseItemFailure**: The player attempts to use an item, but it fails.
            - **PickUpItemFailure**: The player tries to pick up an item, but cannot.
            - **Investigate**: The player examines something closely.
            - **InvestigateItem**: The player examines an item in the room.
            - **InvestigateExitObstacle**: The player examines an exit that has an obstacle on it that is preventing the player from going through it.
            - **InvestigateExitOpen**: The player examines an exit that doesn't have an obstacle and can be used/exited.
            - **LookAtInventory**: The player checks their inventory.
            - **GoBackToPreviousRoom**: The player returns to a previously visited location.
            - **ExitRoomSuccess**: The player successfully exits a room.
            - **EscapeGame**: The player successfully escapes the game.
            - **ExitRoomFailure**: The player tries to exit but is blocked.
            - **EscapeGame**: The player has successfully escapes the game.
            - **UnknownAction**: The player's action is unclear or unsupported.
            
            ### [ITEM] definition
            - **Interface**:
              {
                itemId: number;
                name: string;
                descriptionTags: string[]; // Keywords that describe the item
                locationTags: string[]; // Keywords where the item is located in the room
                canAddToInventory?: boolean;
                image?: string;
                attachedToItem?: [ITEM][] // This is coming in as Object in the data, see [ATTACHED TO ITEM] for attached item details
              }
            ### [ATTACHED TO ITEM] definition
            - **Interface**: An array of [ITEM] objects attached to the parent [ITEM].  The locationTags will indicate where the attached item is located in relation to the parent item
            
            ### [ROOM ITEMS] definition
            - **Interface**: An array of [ITEM] objects in the room
            
            ### [INVENTORY] definition
            - **Interface**: An array of [ITEM] objects in the room

            ### [OBSTACLE] definition
            - **Interface**:
              {
                obstacleId: number;
                name: string;
                type: 'lock' | 'barrier' | 'permanent obstacle';
                keywords: string[];
                description: string;
                requiredItem: {
                  itemId: number;
                } | null;
              }

            ### [EXIT] definition
            - **Interface**:
              {
                roomId: number | 'exit door' | 'dead end';
                type: 'door' | 'permanent obstacle';
                direction: string;
                hasObstacle?: {
                  obstacleId: number;
                };
              }
            
            ### [ROOM EXITS] definition
            - **Interface**: An array of [EXIT] objects in the room

        # 2. Your Responsibilities
        1. **Interpret the Action**: Analyze the player's intent based on **[ACTION TYPE]** and **[PLAYER MESSAGE]**.  
        2. **Reference the Game World**: Use **[GAME DATA]** to determine the most relevant and logical outcome.  
        3. **Provide a Descriptive Response**: Narrate the result in a rich, engaging style, using appropriate tone and sensory details.  
        4. **Maintain Game Logic**: Ensure responses align with existing game mechanics and world-building.  
        5. **Handle Unknown Inputs Gracefully**: If an action is unclear or impossible, provide a natural, immersive response rather than a blunt rejection.
        6. **Memory and Context Handling**: The AI should maintain consistency when referencing past interactions within the session.  See: Handling Long-Term Interactions
        7. **Response structure:**: Ensure that responses always follow the JSON format defined in [OUTPUT] Response structure.

          ## Response tone and style guidelines
          Your goal is to make the game feel alive and engaging, responding with creativity, humor, and mystery as needed.
          Keep the tone immersive and descriptive, drawing players deeper into the game world with vivid details and engaging storytelling.
          For the exact formatting and required response structure, see: [OUTPUT] Response structure.
          
          - If the player types 'examine the old book', your response might be:  
            *You gently blow the dust off the cover, revealing an intricate pattern of symbols etched in gold.*  
          - If the player tries to 'talk to the stone statue', your response might be:
            *Your words echo in the quiet chamber, but the statue remains silent—watching, waiting. Or is that just your imagination?*  
          - If the player attempts something impossible, like 'fly into the sky' without wings or magic, your response might be:  
            *You leap into the air, arms outstretched—only to land back on solid ground. Gravity remains unconvinced by your ambitions.*  
          
          Ensure responses maintain variety in sentence structure and phrasing across different interactions, even when describing similar objects or actions. This helps keep the game world feeling fresh and engaging for the player.

          ## Handling Long-Term Interactions
          The AI should maintain consistency when referencing past interactions within the session.
          - If an item has already been investigated, responses should reflect prior knowledge.
          - If the player is attempting to do something multiple times, the AI should acknowledge this.
          - If the player goes back to a previous room, the AI should acknowledge this.
          - All responses should follow the Response format guidelines.

        # 3. [OUTPUT] Response structure
        Instructions for how the response should always be formatted.

          ## Response format
          - The output structure for all responses, which should be returned in JSON format.
          - This is for informational purposes only as the output should be in JSON format.  Do not add any additional formatting (e.g., "json" blocks or extra quotes around the object).
        
          [OUTPUT]: {
            /** This is a summary of the player's action.  The summary should not be longer than 3 sentences.  (For tone and style see: Response tone and style guidelines) */
            actionSummary: string;
            /** A short message to help the player with their next action.  Keep message under 50 characters.  The message should invite the player to take the next action without restricting their choices.  (For tone and style see: Response tone and style guidelines) */
            playerPrompt: string;
          }

          ${
            actionType === 'InvestigateItem' &&
            attachedToItem?.length > 0 &&
            `
            ### Response assistance: InvestigateItem (with [ATTACHED TO ITEM] list)
              #### Overview
              The player is investigating an item that has items associated with it or attached to it

              #### Guidelines
              - The [ITEM] being investigated has items attached to it (see [ATTACHED TO ITEM]).
              - You must list **only** the items present in the [ATTACHED TO ITEM] array, without exception.
              - Use locationTags to describe where the attached items are relative to the parent [ITEM]. Do **not** change or infer new locations.
              - **Do not copy details/detailTags verbatim** from the item data. Instead, describe them naturally, integrating them into the response.
              - Ensure descriptions **match the given attributes** (e.g., if a sword is described as "rusty" (see detailTags) do not call it "gleaming").
              
              #### Key Details for Response Generation
              - Use the Response tone and style guidelines section to craft an engaging and immersive response for this information.
              - The player is investigating a(n) **${item.name}**, which is described as: ${item.descriptionTags.map((tag) => tag).join(', ')} in the detailTags for this [ITEM].
              - The **${item.name}** is located in the ${item.locationTags.map((location) => location).join(', ')} of the room.
              - The **${item.name}** has **${attachedToItem?.length}** items attached to it that must be included in your response.
              - The attached items are: **${attachedToItem?.map((item) => item.name).join(', ')}**.
            `
          }
        
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
