import { useContext, useEffect, useState } from 'react';
import { Map } from './Map';
import './Adventure.scss';
import {
  getAdventureTypeFromEnum,
  getAdventureTypeFromStr,
  SiteContext,
} from '../utilities/context/site-context';
import {
  ActionResponse,
  ActionType,
  ExitProps,
  ItemImagesProps,
  ItemProps,
} from '../utilities/GameProps';
import { useNavigate } from 'react-router-dom';
import { adventuresData, getRandomItemImage } from '../utilities/GameData';
import { determineAction, determineActionDetails } from './determineAction';
import { scriptedPlaythrough } from '../utilities/scriptedPlaythrough';

export const Adventure: React.FC = () => {
  const {
    game,
    currentRoom,
    inventory,
    setInventory,
    setCurrentRoomId,

    adventure,
    setGame,
    setIsInventoryOpen,
    loading,
    setLoading,
    roomImages,
    setRoomImages,
    gameStorage,
    removeItemFromRoom,
    markObstacleAsCompleted,
  } = useContext(SiteContext);
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [preload, setPreload] = useState<boolean>(true);
  const navigate = useNavigate();
  const [responseLoading, setResponseLoading] = useState<boolean>(false);

  // determine active exit user is working on
  const [currentExit, setCurrentExit] = useState<ExitProps | null>(null);

  const [currentItem, setCurrentItem] = useState<ItemProps | null>(null);
  const [prevExit, setPrevExit] = useState<number | null>(null);
  const [showAction, setShowAction] = useState<string | null>(null);
  const [isEscaping, setIsEscaping] = useState<boolean>(false);

  /**
   * ON-RAILS BUILD: which step of scriptedPlaythrough we're on. The
   * input field is auto-filled (typed in, letter by letter) with this
   * turn's scripted text, but the player must still press Enter/click
   * Send themselves — this never auto-advances on its own. Whatever the
   * player actually submits is ignored; the scripted response for the
   * current turnIndex always plays, and turnIndex only advances on a
   * real, player-initiated submit.
   */
  const [turnIndex, setTurnIndex] = useState<number>(0);
  /** True while the auto-fill typing animation is still running for the current turn. */
  const [isTyping, setIsTyping] = useState<boolean>(false);

  useEffect(() => {
    const nextTurn = scriptedPlaythrough[turnIndex];
    if (!nextTurn) return;

    setPrompt('');
    setIsTyping(true);
    let cancelled = false;
    let i = 0;
    const typeNextChar = () => {
      if (cancelled) return;
      i += 1;
      setPrompt(nextTurn.inputText.slice(0, i));
      if (i < nextTurn.inputText.length) {
        setTimeout(typeNextChar, 35);
      } else {
        setIsTyping(false);
      }
    };
    const startTyping = setTimeout(typeNextChar, 2000);

    return () => {
      cancelled = true;
      clearTimeout(startTyping);
    };
  }, [turnIndex]);

  useEffect(() => {
    // We need to wait until gameStorage is loaded before we can begin
    if (gameStorage) {
      setPreload(false);
    }
  }, [gameStorage]);
  //recover game from local storage
  useEffect(() => {
    // if game is set we are coming from intro page
    if (!game) {
      setLoading(true);
      const adventureString = getAdventureTypeFromEnum(adventure);
      const adventureData = gameStorage && gameStorage[adventureString]?.game;
      const adventureImages =
        gameStorage && gameStorage[adventureString]?.images;

      if (!preload) {
        if (adventureData && adventureImages) {
          setGame(adventureData);
          setRoomImages(adventureImages);
          setCurrentRoomId(1);
        } else {
          console.error('No game data found in local storage');
          navigate(`/`);
        }
      }
    }
  }, [
    gameStorage,
    adventure,
    navigate,
    setLoading,
    setGame,
    setRoomImages,
    preload,
    game,
    setCurrentRoomId,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!game || responseLoading) {
      console.error('Game not found');
      return;
    }

    if (!prompt || prompt.trim() === '') {
      return;
    }

    /**
     * ON-RAILS BUILD: always use the scripted turn's own text for the
     * actual game logic, ignoring whatever the player may have edited
     * the field to — the auto-fill effect already put the "intended"
     * text in the box, but we don't trust the live DOM value here so
     * editing the field can never break the deterministic script.
     */
    const scriptedTurn = scriptedPlaythrough[turnIndex];
    const effectivePrompt = scriptedTurn?.inputText ?? prompt;

    // clear input
    setPrompt('');

    let newMessages = [...messages, { role: 'user', content: effectivePrompt }];

    const details: determineActionDetails = determineAction({
      prompt: effectivePrompt,
      currentExit,
      currentRoom,
      inventory,
      prevExit,
      currentItem,
      game,
    });

    setCurrentItem(details.item);
    setCurrentExit(details.exit);
    runActionAnimation(
      details,
      setShowAction,
      adventuresData[adventure].defaultAssets,
    );
    // Setup end screen
    if (details.actionType === ActionType.EscapeGame) {
      setIsInventoryOpen(false);
      setLoading(true);
      setIsEscaping(true);

      setTimeout(() => {
        navigate(`/${getAdventureTypeFromEnum(adventure)}/end`);
        return;
      }, 1000);
    } else {
      setResponseLoading(true);
    }

    if (details.actionType === ActionType.PickUpItemSuccess) {
      if (details.item) {
        // remove item from room
        removeItemFromRoom(details.item.itemId);

        // Set random image for inventory item
        details.item.image = getRandomItemImage(
          details.item.name,
          getAdventureTypeFromStr(game.theme),
        );
        setInventory([...inventory, details.item]);
        setIsInventoryOpen(true);
      }
    } else if (details.actionType === ActionType.UseItemSuccess) {
      setCurrentItem(null);

      // Update current exit
      if (details.exit) {
        setCurrentExit({
          ...details.exit,
          hasObstacle: null,
        });
      }
      if (details.item && details.obstacle?.obstacleId) {
        // need to update currentObstacle and current exit
        markObstacleAsCompleted(details.obstacle?.obstacleId);
        // remove item from inventory
        const newInventory = inventory.filter(
          (item) => item.itemId !== details.item?.itemId,
        );
        setInventory(newInventory);
        setIsInventoryOpen(false);
      }
    }

    try {
      /**
       * ON-RAILS BUILD: no network call. The real app POSTs the player's
       * action and room context to /api/playerAction and gets back
       * AI-generated flavor text; here we look up the pre-authored
       * response for this step of scriptedPlaythrough instead. A fixed
       * delay keeps the dot-pulse "thinking" indicator visible long
       * enough to read, matching the pacing/feel of the real request.
       */
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const parsed: ActionResponse = {
        actionSummary: scriptedTurn?.actionSummary ?? 'What will you do next?',
        playerPrompt: scriptedTurn?.playerPrompt ?? 'What will you do next?',
      };

      game.characterPrompt = parsed.playerPrompt;

      if (details.actionType === ActionType.Investigate) {
        // No additional handling needed
      } else if (details.actionType === ActionType.PickUpItemSuccess) {
        if (!details.item) {
          console.error('No items found in response');
          parsed.actionSummary = `Oops it slipped out of your hands, try picking it up again!`;
        }
      } else if (details.actionType === ActionType.UseItemSuccess) {
        if (details.item && details.obstacle?.obstacleId) {
          parsed.actionSummary = `${parsed.actionSummary} Item removed from inventory!`;
        } else {
          console.error('No items found in response');
        }
      } else if (details.actionType === ActionType.LookAtInventory) {
        if (inventory.length === 1) {
          parsed.actionSummary = 'Inventory is empty';
        } else {
          parsed.actionSummary = `Inventory: ${inventory.map((item) => item.name)}`;
          setIsInventoryOpen(true);
        }
      } else if (details.actionType === ActionType.GoBackToPreviousRoom) {
        if (currentRoom?.roomId !== undefined) {
          setPrevExit(currentRoom.roomId);
        }

        if (prevExit !== null) {
          setLoading(true);
          setCurrentRoomId(prevExit);
        }
      } else if (details.actionType === ActionType.ExitRoomSuccess) {
        if (currentRoom?.roomId !== undefined) {
          setPrevExit(currentRoom.roomId);
        }
        setIsInventoryOpen(false);
        setLoading(true);
        setCurrentRoomId(details.exit?.roomId as number);
      }

      newMessages = [
        ...newMessages,
        { role: 'system', content: parsed.actionSummary },
      ];

      setMessages(newMessages);
      // Advance to the next scripted turn — the player must submit
      // again themselves to trigger it; this never auto-advances.
      setTurnIndex((prev) => prev + 1);
    } catch (error) {
      const status = (error as { status?: unknown })?.status;
      console.error('Error:', error, status);
      if (status === 429) {
        setMessages([
          ...messages,
          {
            role: 'system',
            content: '🚨 looks like there have been too many requests',
          },
        ]);
      } else {
        setMessages([
          ...messages,
          { role: 'system', content: '🚨 Oops you need to start the server' },
        ]);
      }
    } finally {
      setResponseLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className={isEscaping ? 'Adventure-root escapeGame' : 'Adventure-root'}
    >
      <div
        className={
          isEscaping ? 'Adventure-content escapeGame' : 'Adventure-content'
        }
      >
        <Map
          response={messages[messages.length - 1]?.content}
          messages={messages}
          responseLoading={responseLoading}
          currentRoom={currentRoom}
          roomImage={roomImages.find(
            (room) => room.roomId === currentRoom?.roomId,
          )}
          showAction={showAction}
          setShowAction={setShowAction}
        />
      </div>

      <div
        className={
          loading && currentRoom?.roomId === 1
            ? 'Adventure-formWrapper'
            : 'Adventure-formWrapper open'
        }
      >
        <div
          className={
            !responseLoading
              ? 'Adventure-prompt Intro-title'
              : 'Adventure-prompt Intro-title disabled'
          }
        >
          {game?.characterPrompt}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className={
              !responseLoading ? 'Adventure-input' : 'Adventure-input disabled'
            }
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={responseLoading || isTyping}
          />
          <button
            type="submit"
            className={
              responseLoading || isTyping
                ? 'basicButton disabled'
                : 'basicButton'
            }
            disabled={responseLoading || isTyping}
          >
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const runActionAnimation = (
  details: determineActionDetails,
  setShowAction: (showAction: string | null) => void,
  adventuresData: ItemImagesProps,
) => {
  if (details.actionType === ActionType.PickUpItemSuccess) {
  } else if (details.actionType === ActionType.UseItemSuccess) {
    setShowAction(details.item?.image ?? null);
  } else if (
    details.actionType === ActionType.Investigate ||
    details.actionType === ActionType.InvestigateItem ||
    details.actionType === ActionType.InvestigateExitObstacle ||
    details.actionType === ActionType.InvestigateExitOpen
  ) {
    setShowAction(adventuresData['look'][0]);
  }
};
