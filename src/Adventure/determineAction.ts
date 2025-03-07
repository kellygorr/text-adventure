import {
  ActionType,
  ExitProps,
  GameProps,
  ItemProps,
  ObstacleProps,
  RoomProps,
} from '../utilities/GameProps';

interface Props {
  prompt: string;
  currentExit: ExitProps | null;
  currentRoom: RoomProps | null;
  inventory: ItemProps[];

  prevExit: number | null;
  currentItem: ItemProps | null;
  game: GameProps;
}

export interface determineActionDetails {
  actionType: ActionType | null;
  exit: ExitProps | null;
  obstacle: ObstacleProps | null;
  requiredItem: ItemProps | null;
  item: ItemProps | null;
}

export const determineAction = ({
  prompt,
  currentExit,
  currentRoom,
  inventory,
  prevExit,
  currentItem,
  game,
}: Props): determineActionDetails => {
  let exit: ExitProps | null = currentExit;
  let obstacle: ObstacleProps | null = null;
  let item: ItemProps | null = currentItem;
  let requiredItem: ItemProps | null = null;

  // Investigate
  if (
    prompt.toLowerCase().includes('investigate') ||
    prompt.toLowerCase().includes('look') ||
    prompt.toLowerCase().includes('search') ||
    prompt.toLowerCase().includes('examine') ||
    prompt.toLowerCase().includes('inspect') ||
    prompt.toLowerCase().includes('view')
  ) {
    // reset current item
    item = null;

    // check if user is trying to investigate a door
    exit = getActiveExit(prompt, exit, currentRoom);

    const exitObstacle = getObstacleOnExit(exit, currentRoom);
    obstacle = exitObstacle ? exitObstacle : obstacle;

    let items: ItemProps[] | null = null;

    // which investigate verb is used in the prompt
    const investigateVerbs = [
      'look at the',
      'investigate the',
      'search the',
      'examine the',
      'inspect the',
      'view the',
      'look at',
      'investigate',
      'search',
      'examine',
      'inspect',
      'view',
    ];
    const pickupVerb = investigateVerbs.find((verb) =>
      prompt.toLowerCase().includes(verb),
    );

    // check substring after pickup verb
    const substring = prompt
      .toLowerCase()
      .split(pickupVerb as string)[1]
      ?.trim();

    console.log('SUBSTRING:', substring);
    if (currentRoom) {
      // Is user investigating an item in the room?
      items =
        currentRoom.items.flatMap((item) => {
          // Check if the parent item's name matches
          const parentMatches = item.name
            .toLowerCase()
            .split(' ')
            .some((word) => prompt.toLowerCase().includes(word));

          // Find an attached item that matches
          const matchingAttachedItem = item.attachedToItem?.find(
            (attachedItem) =>
              attachedItem.name
                .toLowerCase()
                .split(' ')
                .some((word) => prompt.toLowerCase().includes(word)),
          );

          // If an attached item matches, return only that
          if (matchingAttachedItem) {
            return [matchingAttachedItem];
          }

          // Otherwise, return the parent item if it matches
          return parentMatches ? [item] : [];
        }) ?? null;
      if (items.length === 1) {
        // Only one item
        item = items[0];
      } else if (items.length > 1) {
        // Multiple items
        // check substring to find the first item that matches one of the items
        const words = substring.split(' '); // Split the string into words

        item =
          words
            .map((word) =>
              items?.find(
                (item) => word.toLowerCase() === item.name.toLowerCase(),
              ),
            )
            .find((item) => item !== undefined) ?? item; // Get the first non-undefined value
      }
    }
    // User is trying to investigate an exit
    if (exit) {
      // does exit have an obstacle
      const hasObstacle = exit.hasObstacle;
      // look for required item in use inventory
      requiredItem = getRequiredItem(obstacle, inventory, game);

      return {
        actionType: hasObstacle
          ? ActionType.InvestigateExitObstacle
          : ActionType.InvestigateExitOpen,
        exit,
        obstacle,
        item,
        requiredItem,
      };
    }

    // User is trying to look at inventory
    if (
      prompt.toLowerCase().includes('inventory') ||
      prompt.toLowerCase().includes('items')
    ) {
      return {
        actionType: ActionType.LookAtInventory,
        exit,
        obstacle,
        item,
        requiredItem,
      };
    }

    const isItem = item !== null;
    return {
      actionType: isItem ? ActionType.InvestigateItem : ActionType.Investigate,
      exit,
      obstacle,
      item,
      requiredItem,
    };
  }

  // Pickup item
  if (
    prompt.toLowerCase().includes('pick up') ||
    prompt.toLowerCase().includes('pickup') ||
    prompt.toLowerCase().includes('take') ||
    prompt.toLowerCase().includes('grab') ||
    prompt.toLowerCase().includes('get') ||
    prompt.toLowerCase().includes('acquire') ||
    prompt.toLowerCase().includes('obtain')
  ) {
    console.log('TRYING TO PICK UP');

    // which pickup verb is used in the prompt
    const pickupVerbs = [
      'pick up',
      'pickup',
      'take',
      'grab',
      'get',
      'acquire',
      'obtain',
    ];
    const pickupVerb = pickupVerbs.find((verb) =>
      prompt.toLowerCase().includes(verb),
    );

    // check substring after pickup verb
    const substring = prompt
      .toLowerCase()
      .split(pickupVerb as string)[1]
      .trim();

    // User is trying to pick up an item in the room, check room for this item
    if (currentRoom) {
      // check if user is using a generic name for the item
      const genericNames = [
        'item',
        'thing',
        'object',
        'stuff',
        'something',
        'it',
      ];

      // check if substring has a generic name as the first word
      const usingGenericName = genericNames.some((word) =>
        substring.startsWith(word),
      );

      let items: ItemProps[] | null = null;

      if (usingGenericName) {
        console.log('USING GENERIC NAME');
        // check description of items in the room for matching

        items =
          currentRoom.items.flatMap((item) => {
            // Check if the main item's locationTags match the substring
            const itemMatches = item.locationTags.some((word) =>
              substring.includes(word),
            );

            // Check if any attached item's locationTags match the substring
            const matchingAttachedItems =
              item.attachedToItem?.filter((attachedItem) =>
                attachedItem.locationTags.some((word) =>
                  substring.includes(word),
                ),
              ) || [];

            // If the main item matches, return it. Otherwise, return matching attached items.
            return itemMatches ? [item] : matchingAttachedItems;
          }) ?? null;
      } else {
        // Check each string in item.name to see if anything matches the prompt
        // Look for items or attachedToItem that match the prompt
        items =
          currentRoom.items.flatMap((item) => {
            // Check if the main item's name matches the prompt
            const itemMatches = item.name
              .toLowerCase()
              .split(' ')
              .some((word) => prompt.toLowerCase().includes(word));

            // Check if any attached item's name matches the prompt
            const matchingAttachedItems =
              item.attachedToItem?.filter((attachedItem) =>
                attachedItem.name
                  .toLowerCase()
                  .split(' ')
                  .some((word) => prompt.toLowerCase().includes(word)),
              ) || [];

            // If the main item matches, return it. Otherwise, return matching attached items.
            return itemMatches ? [item] : matchingAttachedItems;
          }) ?? null;
      }
      console.log('ITEMS:', items);
      if (items.length > 0) {
        if (items.length === 1) {
          // Only one item
          if (items[0].canAddToInventory) {
            item = items[0];

            return {
              actionType: ActionType.PickUpItemSuccess,
              exit,
              obstacle,
              item,
              requiredItem,
            };
          }
        } else {
          // Multiple items

          // filter out items that can't be picked up
          items = items.filter((item) => item.canAddToInventory);

          // check substring to find the first item that matches one of the items
          const words = substring.split(' '); // Split the string into words

          item =
            words
              .map((word) =>
                items?.find(
                  (item) => word.toLowerCase() === item.name.toLowerCase(),
                ),
              )
              .find((item) => item !== undefined) ?? item; // Get the first non-undefined value

          if (item) {
            return {
              actionType: ActionType.PickUpItemSuccess,
              exit,
              obstacle,
              item,
              requiredItem,
            };
          }
        }
      }

      return {
        actionType: ActionType.PickUpItemFailure,
        exit,
        obstacle,
        item,
        requiredItem,
      };
    }
  }

  // Use item
  if (
    prompt.toLowerCase().includes('use') ||
    prompt.toLowerCase().includes('activate') ||
    prompt.toLowerCase().includes('apply') ||
    prompt.toLowerCase().includes('interact') ||
    prompt.toLowerCase().includes('employ') ||
    prompt.toLowerCase().includes('utilize')
  ) {
    // determine what obstacle the user is trying to use the item on
    obstacle = null;

    // User is trying to use an item in their inventory, check inventory for this item
    item =
      inventory.find((item) =>
        item.name
          .toLowerCase()
          .split(' ')
          .some((word) => prompt.toLowerCase().includes(word)),
      ) ?? item;

    // check if user is trying to investigate a door
    exit = getActiveExit(prompt, currentExit, currentRoom);

    // There is a small overlap with how "use" can be interpreted.  This is accounting for that overlap
    if (!item && prompt.toLowerCase().includes('use') && exit) {
      // If the user is trying to use the door and it is already completed, exit the room
      if (!exit.hasObstacle) {
        // reset currentExit
        const isExitDoor = exit.roomId === 'exit door';

        obstacle = null;
        item = null;
        return {
          actionType: isExitDoor
            ? ActionType.EscapeGame
            : ActionType.ExitRoomSuccess,
          exit,
          obstacle,
          item,
          requiredItem,
        };
      } else {
        // mark exit as completed // WE DON'T WANT TO DO THIS YET
        // exit.hasObstacle = null;
        return {
          actionType: ActionType.ExitRoomFailure,
          exit,
          obstacle,
          item,
          requiredItem,
        };
      }
    }

    // user is not trying to use an inventory item
    if (!item) {
      return {
        actionType: ActionType.UseItemFailure,
        exit,
        obstacle,
        item,
        requiredItem,
      };
    }

    if (exit) {
      // user is trying to use an inventory item on an exit

      // check if exit has obstacle
      obstacle = exit.hasObstacle
        ? (currentRoom?.obstacle?.find(
            (obstacle) => obstacle.obstacleId === exit?.hasObstacle?.obstacleId,
          ) ?? null)
        : null;

      // mark exit as completed // WE DON'T WANT TO DO THIS YET
      // exit.hasObstacle = null;
    } else if (currentRoom?.obstacle) {
      // user is trying to use an inventory item on an obstacle

      // check keywords on obstacles against prompt
      obstacle =
        currentRoom.obstacle.find((obstacle) =>
          obstacle.keywords.some((word) => prompt.toLowerCase().includes(word)),
        ) ?? null;
    }

    // look for required item in use inventory
    requiredItem = getRequiredItem(obstacle, inventory, game);

    // check if item matches obstacle
    if (item.itemId === obstacle?.requiredItem?.itemId) {
      return {
        actionType: ActionType.UseItemSuccess,
        exit,
        obstacle,
        item,
        requiredItem,
      };
    } else {
      return {
        actionType: ActionType.UseItemFailure,
        exit,
        obstacle,
        item,
        requiredItem,
      };
    }
  }

  // Exit room
  if (
    prompt.toLowerCase().includes('exit') ||
    prompt.toLowerCase().includes('leave') ||
    prompt.toLowerCase().includes('go') ||
    prompt.toLowerCase().includes('escape') ||
    prompt.toLowerCase().includes('flee') ||
    prompt.toLowerCase().includes('depart') ||
    prompt.toLowerCase().includes('room')
  ) {
    // check if user wants to return to previous room
    if (
      prompt.toLowerCase().includes('back') ||
      prompt.toLowerCase().includes('return') ||
      prompt.toLowerCase().includes('previous')
    ) {
      if (prevExit !== null) {
        // reset currentExit

        // reset currentExit
        obstacle = null;
        item = null;

        return {
          actionType: ActionType.GoBackToPreviousRoom,
          exit,
          obstacle,
          item,
          requiredItem,
        };
      } else {
        return {
          actionType: ActionType.ExitRoomFailure,
          exit,
          obstacle,
          item,
          requiredItem,
        };
      }
    }
    console.log('currentExit', currentExit);
    // check if user is trying to exit a door
    exit = getActiveExit(prompt, currentExit, currentRoom);
    console.log('getActiveExit:', exit);
    if (exit) {
      // check if exit has obstacle
      if (!exit?.hasObstacle) {
        console.log('EXITING ROOM:', exit);
        console.log('PREV EXIT:', prevExit);
        const isPreviousRoom = exit.roomId === prevExit;
        const isExitDoor = exit.roomId === 'exit door';
        console.log('isExitDoor????:', isExitDoor);
        // reset currentExit
        obstacle = null;
        item = null;
        return {
          actionType: isPreviousRoom
            ? ActionType.GoBackToPreviousRoom
            : isExitDoor
              ? ActionType.EscapeGame
              : ActionType.ExitRoomSuccess,
          exit,
          obstacle,
          item,
          requiredItem,
        };
      } else {
        return {
          actionType: ActionType.ExitRoomFailure,
          exit,
          obstacle,
          item,
          requiredItem,
        };
      }
    }
  }

  return {
    actionType: null,
    exit,
    obstacle,
    item,
    requiredItem,
  };
};

// check if user is interacting with door/exit
const getActiveExit = (
  prompt: string,
  currentExit: ExitProps | null,
  currentRoom: RoomProps | null,
): ExitProps | null => {
  let myExit: ExitProps | null = null;

  if (
    prompt.toLowerCase().includes('door') ||
    prompt.toLowerCase().includes('exit') ||
    prompt.toLowerCase().includes('lock') ||
    prompt.toLowerCase().includes('padlock') ||
    prompt.toLowerCase().includes('barrier') ||
    prompt.toLowerCase().includes('block') ||
    prompt.toLowerCase().includes('gate')
  ) {
    // determine which direction the user is looking at
    const direction = determineDirection(prompt);
    if (direction) {
      myExit =
        currentRoom?.exits.find((exit) => exit.direction === direction) ?? null;
    }

    // determine what exit the user is looking at ?????
    const hasOneExit = currentRoom?.exits.length === 1;
    if (hasOneExit && !myExit) {
      myExit = currentRoom?.exits[0];
    }

    if (currentExit && !myExit) {
      myExit = currentExit;
    }
  } else if (
    prompt.toLowerCase().includes('north') ||
    prompt.toLowerCase().includes('south') ||
    prompt.toLowerCase().includes('east') ||
    prompt.toLowerCase().includes('west')
  ) {
    // determine which direction the user is looking at
    const direction = determineDirection(prompt);
    if (direction) {
      myExit =
        currentRoom?.exits.find((exit) => exit.direction === direction) ?? null;
    }
  }
  console.log('MY EXIT????:', myExit);
  return myExit;
};

const getObstacleOnExit = (
  exit: ExitProps | null,
  currentRoom: RoomProps | null,
): ObstacleProps | null => {
  if (exit) {
    return (
      currentRoom?.obstacle?.find(
        (obstacle) => obstacle.obstacleId === exit.hasObstacle?.obstacleId,
      ) ?? null
    );
  }
  return null;
};

const getRequiredItem = (
  obstacle: ObstacleProps | null,
  inventory: ItemProps[],
  game: GameProps,
): ItemProps | null => {
  let myRequiredItem: ItemProps | null = null;

  myRequiredItem = obstacle?.requiredItem
    ? (inventory.find(
        (item) => item.itemId === obstacle?.requiredItem?.itemId,
      ) ?? null)
    : null;

  if (!myRequiredItem) {
    // look for required item in each room from the game data
    myRequiredItem = obstacle?.requiredItem
      ? (game.rooms
          .flatMap((room) => room.items) // Flatten rooms to get items
          .flatMap((item) => [item, ...(item.attachedToItem ?? [])]) // Include both item and its attachedToItem
          .find((item) => item.itemId === obstacle?.requiredItem?.itemId) ??
        null)
      : null;
  }

  return myRequiredItem;
};

const determineDirection = (prompt: string): string | null => {
  const directions = ['north', 'south', 'east', 'west'];
  const lowerCasePrompt = prompt.toLowerCase();

  for (const direction of directions) {
    if (lowerCasePrompt.includes(direction)) {
      return direction;
    }
  }

  return null;
};
