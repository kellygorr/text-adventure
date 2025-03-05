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
  const { messages, room, inventory, theme, details } = req.body;
  const url = process.env.OPENAI_API_ENDPOINT;
  // console.log('messages:', messages);
  console.log('room items', room?.items);
  console.log('theme', theme);
  console.log('inventory', inventory);
  console.log('player message', messages[messages.length - 1].content);
  console.log('actionType', details.actionType);

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
            [ACTION TYPE]: ${details.actionType},
            /** The player's specific input, which may include details about their intent. */
            [USER MESSAGE]: ${messages[messages.length - 1].content},
            /** The room id */
            [ROOM ID]: ${room?.roomId},
            /** The room description. */
            [ROOM DESCRIPTION]: ${room?.description}, 
            /** The items in the room. */
            [ROOM ITEMS]: ${room?.items},
            /** The exits in the room. */
            [ROOM EXITS]: ${room?.exits},
            /** The player's inventory. */
            [INVENTORY]: ${inventory ? inventory : null},
            /** The item the user is interacting with or using (if applicable) */
            [ITEM]: ${details.item},
            /** The obstacle the user is interacting with (if applicable) */
            [OBSTACLE]: ${details.obstacle},
            /** The exit the user is interacting with (if applicable) */
            [EXIT]: ${details.exit}
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
              }
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
        1. **Interpret the Action**: Analyze the player's intent based on **[ACTION TYPE]** and **[USER MESSAGE]**.  
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
            /** This is a summary of the player's action.  Keep summary under 3 sentences.  (For tone and style see: Response tone and style guidelines) */
            [ACTION SUMMARY]: string;

            /** A short message to help the player with their next action.  Keep message under 50 characters.  The message should invite the player to take the next action without restricting their choices.  (For tone and style see: Response tone and style guidelines) */
            [PLAYER PROMPT]: string;
          }

          ## Response example
          The following examples demonstrate how responses should be structured.  
          The [ACTION SUMMARY] examples are not to be used verbatim but should serve as a reference for formatting, ensuring responses align with the game's logic and flow.
          Use [GAME DATA] to determine the most relevant and logical outcome when generating responses. Below are examples of how specific game data can influence response content and formatting.
          Each example below represents a different game state and should be considered individually. They are not meant to be taken as part of a single continuous session but rather as isolated cases demonstrating how responses should be structured based on the current game data.

            ### Example Scenario: Picking up an item
            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'PickUpItemSuccess',
              [USER MESSAGE]: 'pick up the lantern',
              [ROOM ID]: 3,
              [ROOM DESCRIPTION]: 'A dimly lit stone chamber with an eerie glow. In the corner, a dusty brass lantern sits upon a decrepit wooden bench.  A faint, flickering light from a hidden source struggles to illuminate the stone walls, casting long shadows that seem to move in the drafts.',
              [ROOM ITEMS]: [
                { itemId: 1, name: 'lantern', descriptionTags: ['brass', 'dusty',"empty"], locationTags: ['bench'], canAddToInventory: true },
                { itemId: 2, name: 'bench', descriptionTags: ['wooden', 'old', 'scratched'], locationTags: ['corner'], canAddToInventory: false }
              ],
              [ROOM EXITS]:[
                { roomId: 2, direction: 'south', type: 'door', hasObstacle: null },
                { roomId: 4, direction: 'north', type: 'door', hasObstacle: null }
              ],
              [INVENTORY]: null,
              [ITEM]: { itemId: 1, name: 'lantern', descriptionTags: ['brass', 'dusty'], locationTags:[], canAddToInventory: true },
              [OBSTACLE]: null,
              [EXIT]: null
            }
            [EXAMPLE OUTPUT]: {
              "actionSummary": "You lift the dusty brass lantern off the bench, disappointed by how light it feels. The glass is smudged and dirty, and all the oil has burned away.",
              "playerPrompt": "Will you find oil to refill it?"
            }

            ### Example Scenario: Investigating an item (Example 1)
            - If any room items have a locationTag that matches the investigated item's name, include them in the response as objects on or near that item.

            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'InvestigateItem',
              [USER MESSAGE]: 'look at book',
              [ROOM ID]: 3,
              [ROOM DESCRIPTION]: 'The air feels cold and heavy as you step into the room, your footsteps echoing against the stone walls. At the center, a dusty tome rests within a ring of ritual markings—symbols etched in dried blood, faint and mysterious. A ghostly glow pulses from its cover, casting eerie shadows that slither across the walls, as though the room itself is alive, watching you.',
              [ROOM ITEMS]: [
                { itemId: 1, name: 'ritual markings', descriptionTags: ['dried blood', 'faint', 'circle', 'mysterious symbols'], locationTags: ['center', 'floor'], canAddToInventory: false },
                { itemId: 2, name: 'book', descriptionTags: ['dusty', 'tome','old', 'mysterious symbols'], locationTags: ['center', 'ritual markings'], canAddToInventory: true }
              ],
              [ROOM EXITS]:[
                { roomId: 2, direction: 'east', type: 'door', hasObstacle: null }
              ],
              [INVENTORY]: null,
              [ITEM]:  { itemId: 2, name: 'book', descriptionTags: ['dusty', 'tome','old', 'mysterious symbols'], locationTags: ['ritual markings','center'], canAddToInventory: true },
              [OBSTACLE]: null,
              [EXIT]: null
            }
            [EXAMPLE OUTPUT]: {
              "actionSummary": "You step carefully onto the ritual markings, the tome glows in the center, pulsing like a heartbeat. Dust swirls as you lean in, revealing intricate symbols etched in gold across its ancient cover.",
              "playerPrompt": "Do you dare pick it up?"
            }

            ### Example Scenario: Investigating an item (Example 2)
            - If any room items have a locationTag that matches the investigated item's name, include them in the response as objects on or near that item.

            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'InvestigateItem',
              [USER MESSAGE]: 'examine the table',
              [ROOM ID]: 2,
              [ROOM DESCRIPTION]: 'You enter a larger room with high, arched ceilings. The walls are lined with iron shackles, and broken pieces of furniture are strewn about. In the center, there's a heavy wooden table with scratch marks on its surface.',
              [ROOM ITEMS]: [
                {itemId: 3, name: 'table', descriptionTags: ['wooden', 'heavy', 'scratched'], locationTags: ['center'], canAddToInventory: false},
                {itemId: 4, name: 'sword', descriptionTags: ['metal', 'rusty'], locationTags: ['table'], canAddToInventory: true},              
              ],
              [ROOM EXITS]: [
                { roomId: 1, direction: 'south', type: 'door', hasObstacle: null },
                { roomId: 4, direction: 'east', type: 'door', hasObstacle: null },
                { roomId: 3, direction: 'north', type: 'door', hasObstacle: null },
              ],

              [INVENTORY]: null,
              [ITEM]:  {itemId: 3, name: 'table', descriptionTags: ['wooden', 'heavy', 'scratched'], locationTags: ['center'], canAddToInventory: false},
              [OBSTACLE]: null,
              [EXIT]: null
            }
            [EXAMPLE OUTPUT]: {
              "actionSummary": "You approach the heavy wooden table in the center of the room, its surface marred by deep scratch marks. A rusty sword sits atop it.",
              "playerPrompt": "What will you?"
            }

            ### Example Scenario: Investigating an open exit
            - The player is investigating an exit that has no obstacles on it.  The exit is open and can be used.
            - Provide a detailed description of the exit, and let the player know that it is open and can be used.

            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'InvestigateExitOpen',
              [USER MESSAGE]: 'look at north door',
              [ROOM ID]: 4,
              [ROOM DESCRIPTION]: 'The room is small and cramped, the walls lined with shelves of dusty tomes and ancient scrolls. A heavy wooden desk sits in the center, its surface cluttered with inkwells and quills.',
              [ROOM ITEMS]: [
                { itemId: 7, name: 'desk', descriptionTags: ['wooden', 'heavy', 'cluttered'], locationTags: ['center'], canAddToInventory: false },
                { itemId: 8, name: 'shelves', descriptionTags: ['dusty', 'tomes', 'scrolls'], locationTags: ['wall'], canAddToInventory: false },
                { itemId: 9, name: 'rubble', descriptionTags: ['stone', 'rubble', 'blockage'], locationTags: ['corner'], canAddToInventory: false }
              ],
              [ROOM EXITS]:[
                { roomId: 5, direction: 'north', type: 'door', hasObstacle: null },
                { roomId: 3, direction: 'south', type: 'door', hasObstacle: { obstacleId: 3 } }
              ],
              [INVENTORY]: [{ itemId: 2, name: 'lantern', descriptionTags: ['heavy', 'bronze', 'ancient'], locationTags: ['wall', hook], canAddToInventory: true }],
              [ITEM]: null,
              [OBSTACLE]: null,
              [EXIT]: { roomId: 5, direction: 'north', type: 'door', hasObstacle: null }
            }
            
            [EXAMPLE OUTPUT]: {
              "actionSummary": "You turn your attention to the door on the north side of the room. The door is imposing, but is unlocked.",
              "playerPrompt": "What awaits you in this room?"
            }

            ### Example Scenario: Investigating an exit with an obstacle
            - The player is investigating an exit that has an obstacle on it.  The exit is locked or blocked.
            - Provide a detailed description of the exit and the obstacle, and hint at what the player might need to do to overcome the obstacle.
     
            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'InvestigateExitObstacle',
              [USER MESSAGE]: 'look at south door',
              [ROOM ID]: 4,
              [ROOM DESCRIPTION]: 'The room is small and cramped, the walls lined with shelves of dusty tomes and ancient scrolls. A heavy wooden desk sits in the center, its surface cluttered with inkwells and quills.',
              [ROOM ITEMS]: [
                { itemId: 7, name: 'desk', descriptionTags: ['wooden', 'heavy', 'cluttered'], locationTags: ['center'], canAddToInventory: false },
                { itemId: 8, name: 'shelves', descriptionTags: ['dusty', 'tomes', 'scrolls'], locationTags: ['wall'], canAddToInventory: false },
                { itemId: 9, name: 'rubble', descriptionTags: ['stone', 'rubble', 'blockage'], locationTags: ['corner'], canAddToInventory: false }
              ],
              [ROOM EXITS]:[
                { roomId: 5, direction: 'north', type: 'door', hasObstacle: null },
                { roomId: 3, direction: 'south', type: 'door', hasObstacle: { obstacleId: 3 } }
              ],
              [INVENTORY]: [{ itemId: 4, name: 'sword', descriptionTags: ['rusty', 'ancient'], locationTags: ['wall', hook], canAddToInventory: true }],
              [ITEM]: null,
              [OBSTACLE]: { obstacleId: 3, type: 'barrier', name: 'rusty padlock', keywords: ['padlock', 'exit', 'lock', 'barrier', 'gate'], description: 'The door has a rusty padlock.  You won't be able to open it with a key, because there is too much rust.', requiredItem: { itemId: 4}},
              [EXIT]:  { roomId: 3, direction: 'south', type: 'door', hasObstacle: { obstacleId: 3 } }
            }
            
            [EXAMPLE OUTPUT]: {
              "actionSummary": "The door is imposing, but has a rusty padlock.  Maybe you can break it off with something.",
              "playerPrompt": "What do you do next?"
            }

             ### Example Scenario: Investigating a dead end exit with a permanent obstacle
            - The player is investigating an exit (roomId: 'dead end') that is blocked by a permanent obstacle.
            - The player will not be able to use this exit, and the obstacle cannot be removed.
            - Provide a detailed description of the exit and the permanent obstacle, emphasizing that it is impassable.
     
            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'InvestigateExitObstacle',
              [USER MESSAGE]: 'look at south door',
              [ROOM ID]: 4,
              [ROOM DESCRIPTION]: 'The room is small and cramped, the walls lined with shelves of dusty tomes and ancient scrolls. A heavy wooden desk sits in the center, its surface cluttered with inkwells and quills.',
              [ROOM ITEMS]: [
                { itemId: 7, name: 'desk', descriptionTags: ['wooden', 'heavy', 'cluttered'], locationTags: ['center'], canAddToInventory: false },
                { itemId: 8, name: 'shelves', descriptionTags: ['dusty', 'tomes', 'scrolls'], locationTags: ['wall'], canAddToInventory: false },
                { itemId: 9, name: 'rubble', descriptionTags: ['stone', 'rubble', 'blockage'], locationTags: ['corner'], canAddToInventory: false }
              ],
              [ROOM EXITS]:[
                { roomId: 5, direction: 'north', type: 'door', hasObstacle: null },
                { roomId: 'dead end', direction: 'south', type: 'permanent obstacle', hasObstacle: { obstacleId: 3 } }
              ],
              [INVENTORY]: [{ itemId: 4, name: 'sword', descriptionTags: ['rusty', 'ancient'], locationTags: ['wall', hook], canAddToInventory: true }],
              [ITEM]: null,
              [OBSTACLE]: { obstacleId: 3, type: 'permanent obstacle', name: 'cave-in', keywords: ['Rocks', 'boulder', 'stone', 'barrier'], description: 'The path is blocked by a cave-in. You need to find another way out.', requiredItem: null},
              [EXIT]:  { roomId: 3, direction: 'south', type: 'door', hasObstacle: { obstacleId: 3 } }
            }
            
            [EXAMPLE OUTPUT]: {
              "actionSummary": "You turn to the south and find your way blocked by a cave-in. Large boulders have collapsed into the passage, sealing it off completely. The rough edges and sheer weight of the rock make it clear—this exit is impassable. If you want to leave, you'll have to find another way.",
              "playerPrompt": "Where will you turn now?"
            }

            ### Example Scenario: Using an item (success)
            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'UseItemSuccess',
              [USER MESSAGE]: 'use key on door',
              [ROOM ID]: 1,
              [ROOM DESCRIPTION]: 'Dust lingers in the air, carrying the scent of aged wood and neglect. A scratched wooden cabinet stands against the southern wall, while a broken table sags in the center, its collapsed leg casting jagged shadows in the dim light.',
              [ROOM ITEMS]: [
                { itemId: 1, name: 'cabinet', descriptionTags: ['old', 'wooden', 'scratched'], locationTags: ['south', 'wall'], canAddToInventory: false },
                { itemId: 3, name: 'table', descriptionTags: ['old', 'wooden', 'broken'], locationTags: ['center'], canAddToInventory: false }
              ],
              [ROOM EXITS]:[
                { roomId: 3, direction: 'east', type: 'door', hasObstacle: null },
                { roomId: 2, direction: 'south', type: 'door', hasObstacle: { obstacleId: 1 } }
              ],
              [INVENTORY]: [{ itemId: 2, name: 'key', descriptionTags: ['heavy', 'iron', 'ancient'], locationTags: ['chest'], canAddToInventory: true }],
              [ITEM]: { itemId: 2, name: 'key', descriptionTags: ['heavy', 'iron', 'ancient'], locationTags: ['chest'], canAddToInventory: true },
              [OBSTACLE]: {
                obstacleId: 1,
                type: 'door',
                keywords: ['door', 'exit', 'lock', 'barrier', 'gate'],
                description: 'The door is locked, and you need a key to unlock it.',
                requiredItem: { itemId: 2 }
              },
              [EXIT]: { roomId: 2, direction: 'south', hasObstacle: { obstacleId: 1 } }
            }

            [EXAMPLE OUTPUT]: {
              "actionSummary": "You insert the heavy iron key into the lock, the mechanism grinding as it turns. With a loud click, the door swings open, revealing a dark corridor beyond.",
              "playerPrompt": "Will this lead to freedom?"
            }

            ### Example Scenario: Using an item (failure)
            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'UseItemFailure',
              [USER MESSAGE]: 'use lantern on door',
              [ROOM ID]: 7,
              [ROOM DESCRIPTION]: 'The room is shrouded in darkness, the air thick with the scent of damp earth and decay. A faint rustling sound echoes from the shadows, sending a shiver down your spine.',
              [ROOM ITEMS]: null,
              [ROOM EXITS]:[
                { roomId: 6, direction: 'north', type: 'door', hasObstacle: null },
                { roomId: 8, direction: 'south', type: 'door', hasObstacle: { obstacleId: 4} }
              ],
              [INVENTORY]: [{ itemId: 2, name: 'lantern', descriptionTags: ['heavy', 'bronze', 'ancient'], locationTags: ['wall', hook], canAddToInventory: true }],
              [ITEM]: { itemId: 2, name: 'lantern', descriptionTags: ['heavy', 'bronze', 'ancient'], locationTags: ['wall', hook], canAddToInventory: true },
              [OBSTACLE]: {
                obstacleId: 4,
                type: 'door',
                keywords: ['door', 'exit', 'lock', 'barrier', 'gate'],
                description: 'The door is locked, and you need a key to unlock it.',
                requiredItem: {
                  itemId: 3
                }
              },
              [EXIT]: { roomId: 8, direction: 'south', type: 'door', hasObstacle: { obstacleId: 4} }
            }

            [EXAMPLE OUTPUT]: {
              "actionSummary": "You hold the lantern up to the door, the light flickering weakly in the darkness. The shadows seem to deepen, swallowing the glow without a trace. The door remains locked, unmoved by your efforts.",
              "playerPrompt": "Perhaps another approach is needed."
            }

            ### Example Scenario: Exit room
            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'ExitRoomSuccess',
              [USER MESSAGE]: 'exit room',
              [ROOM ID]: 4,
              [ROOM DESCRIPTION]: 'The room is small and cramped, the walls lined with shelves of dusty tomes and ancient scrolls. A heavy wooden desk sits in the center, its surface cluttered with inkwells and quills.',
              [ROOM ITEMS]: [
                { itemId: 7, name: 'desk', descriptionTags: ['wooden', 'heavy', 'cluttered'], locationTags: ['center'], canAddToInventory: false },
                { itemId: 8, name: 'shelves', descriptionTags: ['dusty', 'tomes', 'scrolls'], locationTags: ['wall'], canAddToInventory: false },
                { itemId: 9, name: 'rubble', descriptionTags: ['stone', 'rubble', 'blockage'], locationTags: ['corner'], canAddToInventory: false }
              ],
              [ROOM EXITS]:[
                { roomId: 5, direction: 'north', type: 'door', hasObstacle: null },
                { roomId: 3, direction: 'south', type: 'door', hasObstacle: { obstacleId: 3 } }
              ],
              [INVENTORY]: [{ itemId: 2, name: 'lantern', descriptionTags: ['heavy', 'bronze', 'ancient'], locationTags: ['wall', hook], canAddToInventory: true }],
              [ITEM]: null,
              [OBSTACLE]: null,
              [EXIT]: { roomId: 5, direction: 'north', type: 'door', hasObstacle: null }
            }
            
            [EXAMPLE OUTPUT]: {
              "actionSummary": "You step cautiously beyond the cramped study, leaving the cluttered desk and dusty shelves behind. The air shifts slightly as you move forward, the dim light revealing the path ahead.",
              "playerPrompt": "What awaits you in this room?"
            }

            ### Example Scenario: Escaping the game
            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'EscapeGame',
              [USER MESSAGE]: 'exit room',
              [ROOM ID]: 5,
              [ROOM DESCRIPTION]: 'The room is small and cramped, the walls lined with shelves of dusty tomes and ancient scrolls. A heavy wooden desk sits in the center, its surface cluttered with inkwells and quills.',
              [ROOM ITEMS]: [
                { itemId: 7, name: 'desk', descriptionTags: ['wooden', 'heavy', 'cluttered'], locationTags: ['center'], canAddToInventory: false },
                { itemId: 8, name: 'shelves', descriptionTags: ['dusty', 'tomes', 'scrolls'], locationTags: ['wall'], canAddToInventory: false },
              ],
              [ROOM EXITS]:[
                { roomId: 4, direction: 'north', type: 'door', hasObstacle: null },
                { roomId: 'exit door', direction: 'west', type: 'door', hasObstacle: null }
              ],
              [INVENTORY]: null,
              [ITEM]: null,
              [OBSTACLE]: null,
              [EXIT]: { roomId: 'exit door', direction: 'west', type: 'door', hasObstacle: null }
            }

            [EXAMPLE OUTPUT]: {
              "actionSummary": "You push open the heavy wooden door, the hinges creaking in protest. A rush of fresh air greets you, carrying the scent of freedom and adventure. You step out into the unknown, leaving the dungeon behind.",
              "playerPrompt": "Congratulations you have escaped the dungeon"
            }

            ### Example Scenario: Investigating a dead end
            [EXAMPLE GAME DATA]:{
              [ACTION TYPE]: 'Investigate',
              [USER MESSAGE]: 'Look at east exit',
              [ROOM ID]: 5,
              [ROOM DESCRIPTION]: 'You find yourself in what appears to be caved in room. Light filters through, but the boulders blocks your path.',
              [ROOM ITEMS]: [
                { itemId: 5, name: 'boulders', descriptionTags: ['rock', 'barrier', 'dusty'], locationTags: ['wall', 'east', 'dead end'], canAddToInventory: false },
              ],
              [ROOM EXITS]:[
                { roomId: 2, direction: 'south', type: 'door', hasObstacle: null },
                { roomId: 'dead end', direction: 'east', type: 'door', hasObstacle: { obstacleId: 2} }
              ],
              [INVENTORY]: null,
              [ITEM]: null,
              [OBSTACLE]: { obstacleId: 2, type: 'permanent obstacle', keywords: ['boulders', 'rubble', 'barrier', 'rock', 'stone', 'wall'], description: 'The path is blocked by boulders. You need to find another way out.', requiredItem: null},
              [EXIT]:  { roomId: 'dead end', direction: 'east', type: 'door', hasObstacle: { obstacleId: 2} }
            }

            [EXAMPLE OUTPUT]: {
              "actionSummary": "You turn your attention to the east exit, noticing that although some light filters through, the path is obstructed by a significant amount of boulders. It is impossible to clear.",
              "playerPrompt": "You can't go this way. Try another path."
            }

            ### All other scenarios
            
            [OUTPUT FORMAT]: {
              "actionSummary": "[Brief, relevant summary of the player's action]",
              "playerPrompt": "[Relevant prompt to guide the player's next decision]"
            }

          Each response should be dynamically generated based on the specific game state and player actions while following this structure. Ensure responses remain immersive and engaging, adhering to the Response tone and style guidelines, and formatted as outlined in the Response format section.

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
