export enum AdventureType {
  Dungeon,
  Forest,
  Castle,
}

export interface GameStorage {
  dungeon: {
    game: GameProps;
    images: Array<RoomImageProps>;
  } | null;
  forest: {
    game: GameProps;
    images: Array<RoomImageProps>;
  } | null;
  castle: {
    game: GameProps;
    images: Array<RoomImageProps>;
  } | null;
}

export interface GameProps {
  theme: 'dungeon' | 'forest' | 'castle';
  introduction: string;
  characterPrompt: string;
  rooms: Array<RoomProps>;
}

export interface RoomImageProps {
  roomId: number;
  image: string;
}

export interface ExitProps {
  roomId: number | 'exit door' | 'dead end';
  direction: string;
  /** Add obstacle ID is applicable */
  hasObstacle?: {
    obstacleId: number;
  };
}

export interface RoomProps {
  id: number;
  description: string;
  exits: ExitProps[];
  items: ItemProps[];
  obstacle: ObstacleProps[] | null;
}

export interface ItemProps {
  itemId: number;
  name: string;
  location: string;
  canAddToInventory?: boolean;
  image?: string;
}

export interface ObstacleProps {
  obstacleId: number;
  description: string;
  requiredItem: {
    itemId: number;
  } | null;
  isCompleted?: boolean;
}

export enum ActionType {
  Move = 'Move',
  PickUpItemSuccess = 'PickUpItemSuccess',
  PickUpItemFailure = 'PickUpItemFailure',
  UseItemSuccess = 'UseItemSuccess',
  UseItemFailure = 'UseItemFailure',
  Investigate = 'Investigate',
  LookAtInventory = 'LookAtInventory',
  ExitRoomSuccess = 'ExitRoomSuccess',
  ExitRoomFailure = 'ExitRoomFailure',
  UnknownAction = 'UnknownAction',
}

export interface ActionResponse {
  actionType: ActionType;
  response: string;
  characterPrompt: string;
  item: ItemProps | null;
  inventoryItem: ItemProps | null;
  obstacle: ObstacleProps | null;
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
