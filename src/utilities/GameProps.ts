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
  currentRoomId: number | null;
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
  type: 'door' | 'permanent obstacle';
  direction: string;
  /** Add obstacle ID is applicable */
  hasObstacle?: {
    obstacleId: number;
  } | null;
}

export interface RoomProps {
  roomId: number;
  description: string | null;
  exits: ExitProps[];
  items: ItemProps[];
  obstacle: ObstacleProps[] | null;
}

export interface ItemProps {
  itemId: number;
  name: string;
  descriptionTags: string[];
  locationTags: string[];
  canAddToInventory?: boolean;
  image?: string;
  attachedToItem?: ItemProps[];
}

export interface ObstacleProps {
  obstacleId: number;
  name: string;
  type: 'lock' | 'barrier' | 'permanent obstacle';
  keywords: string[];
  description: string;
  requiredItem: {
    itemId: number;
  } | null;
  isCompleted?: boolean;
}

export enum ActionType {
  Move = 'Move',
  Investigate = 'Investigate',
  InvestigateItem = 'InvestigateItem',
  InvestigateExitObstacle = 'InvestigateExitObstacle',
  InvestigateExitOpen = 'InvestigateExitOpen',
  PickUpItemSuccess = 'PickUpItemSuccess',
  PickUpItemFailure = 'PickUpItemFailure',
  UseItemSuccess = 'UseItemSuccess',
  UseItemFailure = 'UseItemFailure',
  LookAtInventory = 'LookAtInventory',
  GoBackToPreviousRoom = 'GoBackToPreviousRoom',
  ExitRoomSuccess = 'ExitRoomSuccess',
  EscapeGame = 'EscapeGame',
  ExitRoomFailure = 'ExitRoomFailure',
  UnknownAction = 'UnknownAction',
}

export interface ActionResponse {
  actionSummary: string;
  playerPrompt: string;
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
  sword: string[];
  empty: string[];
  unknown: string[];
}
