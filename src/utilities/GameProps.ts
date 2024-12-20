export enum AdventureType {
  Dungeon,
  Forest,
  Castle,
}

export interface GameProps {
  theme: 'dungeon' | 'forest' | 'castle';
  introduction: string;
  characterPrompt: string;
  rooms: Array<RoomProps>;
}

export interface ExitProps {
  roomId: number | 'exit door';
  direction: string;
}

export interface RoomProps {
  id: number;
  description: string;
  image?: string;
  exits: ExitProps[];
  items: Array<ItemProps>;
  obstacle: ObstacleProps | null;
}

export interface ItemProps {
  itemId: number;
  item: string;
  location: string;
  canAddToInventory?: boolean;
  image?: string;
}

export interface ObstacleProps {
  description: string;
  requiredItem: {
    itemId: number;
  } | null;
}

export enum ActionType {
  Move = 'Move',
  PickUp = 'PickUp',
  Use = 'Use',
  Investigate = 'Investigate',
  LookAtInventory = 'LookAtInventory',
  ExitRoom = 'ExitRoom',
}
export interface ActionResponse {
  actionType: ActionType;
  response: string;
  characterPrompt: string;
  addItemsToInventory: Array<ItemProps>;
  exit: ExitProps | null;
}

export interface AdventureDataProps {
  type: AdventureType;
  name: string;
  background: string;
  character: string;
  prompt?: string;
  defaultAssets: ItemImagesProps;
}

export interface ItemsDefaultProps {
  dungeon: ItemImagesProps;
  forest: ItemImagesProps;
  castle: ItemImagesProps;
}

export interface ItemImagesProps {
  key: string[];
  spear: string[];
  wand: string[];
  hammer: string[];
  empty: string[];
  unknown: string[];
}
