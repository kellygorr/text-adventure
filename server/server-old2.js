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
          locationTags: 'center of room',
          canAddToInventory: false,
        },
        {
          itemId: 2,
          name: 'key',
          locationTags: 'under chair',
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
          locationTags: 'center of room',
          canAddToInventory: false,
        },
        {
          itemId: 4,
          name: 'sword',
          locationTags: 'under table',
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
          locationTags: 'at the back of the room',
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
          locationTags: 'ring of keys',
          canAddToInventory: true,
        },
        {
          itemId: 7,
          name: 'rusty padlock',
          locationTags: 'exit door',
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
  const { messages, room, inventory, theme } = req.body;
  const url = process.env.OPENAI_API_ENDPOINT;
  // console.log('messages:', messages);
  console.log('room items', room?.items);
  console.log('theme', theme);
  console.log('inventory', inventory);

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
          Keep track of any [GAME DATA] that was relevant to the action taken. This data will need to be returned in the response (without editing it). For example, the [ITEM] object that the user was trying to pick up.

          2. Return relevant [GAME DATA] (Dynamic Data Matching):
          - The AI should return **only** the exact data from the [GAME DATA] that is relevant to the action the user is taking.
          - This means that if the player is trying to pick up an item, the **exact [ITEM]** object (with all its original attributes) should be returned, **without modification**. 
          - The AI should **never add, remove, or modify** the fields in any object from the [GAME DATA]. If the user is interacting with an item, for example, the exact "itemId", "name", "locationTags", and "canAddToInventory" fields from the [ITEMS] array must be returned as-is.
          - The returned objects should **match the items exactly as they are in the [ITEMS] array**. 
          - The AI should only select the objects that are **relevant** to the action. For example, if the player picks up an item, only the relevant [ITEM] should be returned. If the player examines the room or obstacles, only the relevant [OBSTACLE] or [EXIT] objects should be returned.

          - **Dynamic Identification**:
            - The AI determines which part of the [GAME DATA] is relevant by matching it **exactly** with the user's input. For example, if a user says, “pick up the key under the chair,” the AI must identify the key from the [ITEMS] array, and return the exact [ITEM] object for the key."

          - **Ensuring Data Integrity**:
            - **The integrity of the [GAME DATA] must be maintained.** The AI does not modify or create new objects. It should only return the exact objects from the data provided.
          
          3. **Formulate the Response**:
          - Once the actionType is determined, the AI should return a **JSON object** (as defined in the output section below and not wrapped in any additional formatting or block quotes) that includes:
            - The actionType
            - A response and characterPrompt that is generated by the AI (See output section for more details).
            - The **exact [ITEM]/[EXIT]/[OBSTACLE]/[INVENTORY ITEM]** (if any) that was relevant to the action taken (Dynamic Data Matching).

          ### [GAME DATA] (Reference)
            /** Room id.  Reference: [ID] */
            [ID]: ${room?.id},
            /** Room description.  Reference: [DESCRIPTION] */
            [DESCRIPTION]: ${room?.description}, 
            /** Items in the room.  Reference: [ITEMS]/[ITEM] */
            [ITEMS]: ${room?.items},
            /** Obstacles in the room.  Reference: [OBSTACLES]/[OBSTACLE] */
            [OBSTACLES]: ${room?.obstacle},
            /** Exits in the room.  Reference: [EXITS]/[EXIT] */
            [EXITS]: ${room?.exits},
            /** User's inventory.  Reference: [INVENTORY]/[INVENTORY ITEM] */
            [INVENTORY]: ${inventory ? inventory : []},
    
        /***** [ITEMS] rules *****/
        - **Overview**: An array of [ITEM] objects in the room that the user can investigate or pick up.
        - **[ITEMS]**: ${room?.items} (do not modify [ITEM] objects)
        - **ActionType**: 
            - "PickUpItemSuccess"
            - "PickUpItemFailure"
            - "Investigate"
        - **Rules**:
            - Items with "canAddToInventory: false" **cannot** be picked up.
            - Items with "canAddToInventory: true" **can** be picked up.
            - Each item has a unique "itemId" that must not be changed.
            - The user can pick up multiple items at a time.
        - **[ITEM] Interface**:
            {
              itemId: number;
              name: string;
              locationTags: string;
              canAddToInventory?: boolean;
              image?: string;
            }

        /***** [OBSTACLES] rules *****/
          - **Overview**: An array of [OBSTACLE] objects in the room that the user can overcome.
          - **[OBSTACLES]**: ${room?.obstacle} (do not modify [OBSTACLE] objects)
          - **ActionType**:
              - "UseItemSuccess"
              - "UseItemFailure"
              - "Investigate"
          - **Rules**:
              - Obstacles with "requiredItem: null" **cannot** be overcome (this will likely be attached to a blocked door).
              - Obstacles with "requiredItem.itemId" require the user to have that item (an inventory item with a matching "itemId") in their inventory in order to overcome.
              - Obstacles that have been completed will have "isCompleted: true" (users do not need to overcome an obstacle that is already completed).
          - **[OBSTACLE] Interface**:
              {
                obstacleId: number;
                description: string;
                requiredItem: {
                  itemId: number;
                } | null;
              }
       

        /***** [EXITS] rules *****/
        - **Overview**: An array of [EXIT] objects in the room that the user can use to access new rooms.
        - **[EXITS]**: ${room?.exits} (do not modify [EXIT] objects)
        - **ActionType**:
            - "ExitRoomSuccess"
            - "ExitRoomFailure"
            - "UseItemSuccess"
            - "UseItemFailure"
            - "Investigate"
        - **Rules**:
            - Exits have a "direction" (e.g., north, south, east, west), representing where the exit is located in the room.
            - Some exits have an "obstacle" ("hasObstacle.obstacleId") that references an [OBSTACLE] from the [OBSTACLES] array, which the user must overcome in order to use the exit.
            - Exits referencing an [OBSTACLE] with "isCompleted: true" can be used.
            - Exits without an obstacle can be used freely.
            - Exits have a "roomId" that references:
                - The room the user will enter if they successfully use the exit.
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

        /***** [INVENTORY] rules *****/
        - **Overview**: An array of [INVENTORY ITEM] objects that the user has picked up.
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
              locationTags: string;
              canAddToInventory?: boolean;
              image?: string;
            }

        /***** actionType: PickUpItemSuccess Conditions *****/
        /** ALL conditions below must be met for actionType: PickUpItemSuccess **/
        - User explicitly requests to pick up an item.
        - The [ITEM] is one of the available [ITEMS] (see [GAME DATA]).
        - The item has "canAddToInventory: true".

        /***** actionType: PickUpItemFailure Conditions *****/
        /** ANY condition below results in actionType: PickUpItemFailure **/
        - The [ITEM] is not one of the available [ITEMS] (see [GAME DATA]).
        - The item has "canAddToInventory: false".
        - The user is trying to pick up more than one item at a time.
  
        /***** actionType: UseItemSuccess Conditions *****/
        /** ALL conditions below must be met for actionType: UseItemSuccess **/
        - User requests to use an [INVENTORY ITEM] from their [INVENTORY] on an [OBSTACLES] (see [GAME DATA]).
        - The "itemId" of the [INVENTORY ITEM] matches the "requiredItem.itemId" of the [OBSTACLE].
        - The target [OBSTACLE] is in the current room.
        - The [OBSTACLE] is not completed ("isCompleted: false | undefined | null").

        /***** actionType: UseItemFailure Conditions *****/
        /** ANY condition below results in actionType: UseItemFailure **/
        - The [INVENTORY ITEM] is not in the user's [INVENTORY] (see [GAME DATA]).
        - The target is not a valid [OBSTACLE] in [OBSTACLES] (see [GAME DATA]).
        - The [OBSTACLE] has "isCompleted: true".
        - The "itemId" does not match the "requiredItem.itemId" of the [OBSTACLE].
        - The [OBSTACLE] has "requiredItem: null" (cannot be completed).
        - User attempts to use more than one [INVENTORY ITEM] at a time.

        /***** actionType: ExitRoomSuccess Conditions *****/
        /** ALL conditions below must be met for actionType: ExitRoomSuccess **/
        - User explicitly requests to exit the room.
        - The selected [EXIT] exists in the [EXITS] (see [GAME DATA]).
        - If the [EXIT] has "hasObstacle.obstacleId", the corresponding [OBSTACLE] must have "isCompleted: true".
        - If the [EXIT] does not have "hasObstacle.obstacleId", the exit can be used freely.
        /** Notes: **/
        - Users are not required to complete all [OBSTACLES] to use an [EXIT].

        /***** actionType: ExitRoomFailure Conditions *****/
        /** ANY condition below results in actionType: ExitRoomFailure **/
        - The selected [EXIT] is not part of [EXITS] (see [GAME DATA]).
        - The user's intended exit is unclear (e.g., following "UseItemSuccess" on an [EXIT], assume they are attempting that [EXIT]).
        - The [EXIT] has "hasObstacle.obstacleId", but the required [OBSTACLE] is not completed.
        - The [EXIT] leads to a room with "roomId: 'dead end'".

        /***** actionType: Investigate Conditions *****/
        /** ANY condition below results in actionType: Investigate **/
        - The user is investigating an [ITEM], [OBSTACLE], or [EXIT] in the room (see [GAME DATA]).
        - The user is investigating something described in the [DESCRIPTION] of the room (see [GAME DATA]).
        - The user is trying to investigate something in the room

        /***** actionType: LookAtInventory Conditions *****/
        /** ANY condition below results in actionType: LookAtInventory **/
         - The user wants to look at or get information about an [INVENTORY ITEM] in their [INVENTORY] (see [GAME DATA]).
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

        ### 1. Base Output Interface

        The "ActionResponse" interface defines the baseline structure for all responses. Fields marked as optional ("| null") may only be required for certain "actionType"s, as detailed in the specific examples below.  
        This is for informational purposes only as the output should be in JSON format.

        export interface ActionResponse {
          /** The action the user is trying to take. */
          actionType: ActionType; // Always required
           /** This is the result of the user's action.
           * Example responses like "You added a key to your inventory" are intentionally bland and basic.
           * The AI should **not** use these directly but instead create rich, imaginative responses that convey 
           * the outcome of the action in a vivid and engaging way. Add sensory details, emotions, and other 
           * immersive elements to make the world feel alive.
           */
          response: string; // Always required: A human-readable string
           /** A short prompt to help the character with their next action. 
           * Encouraging creative thinking and open-ended possibilities. 
           * The AI should craft a prompt that sparks imagination and invites player exploration. 
           * Example: "What do you do next?", "Try something else", "You have already tried that", "You can't pick that up".
           */
          characterPrompt: string; // Always required: A follow-up prompt for the player
          /** The item ([ITEM] | [INVENTORY ITEM]) that is relevant to the user's current action (See [GAME DATA]). Do not make changes to [ITEMS] or [INVENTORY] objects, the objects must be return exactly as they appear from the [GAME DATA]. */
          item: [ITEM] | [INVENTORY ITEM] | null;
          /** An [OBSTACLES] that is relevant to the user's current action (See [GAME DATA]). Do not make changes to [OBSTACLE] objects, the objects must be return exactly as they appear from the [GAME DATA]. */
          obstacle: [OBSTACLE] | null;
          /** An [EXIT] that is relevant to the user's current action (See [GAME DATA]). Do not make changes to [EXIT] objects, the objects must be return exactly as they appear from the [GAME DATA]. */
          exit: [EXIT] | null;
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
         - Example 1:  Use an [INVENTORY ITEM] successfully on an [OBSTACLE]
         {
            "output": {
              "actionType": "UseItemSuccess",
              "response": "You successfully used the key to unlock the door.  You can now exit the room.",
              "characterPrompt": "What do you do next?",
              "item": [INVENTORY ITEM],
              "obstacle": [OBSTACLE],
              "exit": [EXIT],
            },
            "comments: {
              "actionType": "UseItemSuccess",
              "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
              "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
              "items": "The [INVENTORY ITEM] object from the [INVENTORY] array (see [GAME DATA]) that the player used to overcome the [OBSTACLE].",
              "obstacle": "The [OBSTACLE] object from the [OBSTACLES] array (see [GAME DATA]) that the player successfully overcame.  Do not make changes to the [OBSTACLE] object.",
              "exit": "The [EXIT] object from the [EXITS] array (see [GAME DATA]) that is now accessible after overcoming the [OBSTACLE].  Some [OBSTACLE] are not attached to an [EXIT] and would return 'null' instead.  Do not make changes to the [EXIT] object."
            }
          }

        /***** actionType: UseItemFailure *****/
        --none--

        /***** actionType: ExitRoomSuccess *****/
        --none--

        /***** actionType: ExitRoomFailure *****/
        --none--

        /***** actionType: PickUpItemSuccess *****/
        - Example 1: Pick up an [ITEM] in the room successfully
        {
          "output": {
            "actionType": "PickUpItemSuccess",
            "response": "You added a key to your inventory.",
            "characterPrompt": "What do you do next?",
            "item": [ITEM],
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "PickUpItemSuccess",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "item": The [ITEM] object for the [ITEMS] array (see [GAME DATA]) that the player picked up.  Do not make changes to the [ITEM] object.",
            "obstacle": null,
            "exit": null,
          }
        }

        /***** actionType: PickUpItemFailure *****/
        - Example 1: The user tries to pick up an [ITEM] that cannot be added to their inventory
        {
          "output": {
            "actionType": "PickUpItemFailure",
            "response": "You don't want to carry that around",
            "characterPrompt": "What do you do next?",
            "item": [ITEM],
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "PickUpItemFailure",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "item": "The [ITEM] objects from the [ITEMS] array (see [GAME DATA]) that the player tried to pick up.  Do not make changes to the [ITEM] object.",
            "obstacle": null,
            "exit": null,
          }
        }
        - Example 2: The user tries to pick up more than one [ITEM] at a time
        {
          "output": {
            "actionType": "PickUpItemFailure",
            "response": "You can only pick up one item at a time.",
            "characterPrompt": "What do you do next?",
            "item": null,
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "PickUpItemFailure",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "item": null,
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
            "item": null,
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "PickUpItemFailure",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "item": null,
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
            "item": null,
            "obstacle": null,
            "exit": null,
          },
          "comments: {
            "actionType": "Investigate",
            "response": "The result of the user's action.  This is a simple example (For AI to improve upon)",
            "characterPrompt": "A short prompt to guide the player on their next action.  This is a simple example (For AI to improve upon)",
            "item": null,
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
