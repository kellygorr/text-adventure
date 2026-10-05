/**
 * Scripted, on-rails playthrough for the portfolio demo build. Replaces
 * the real app's two network calls (POST /api/generateGameImage and
 * POST /api/playerAction — see Intro.tsx and Adventure.tsx) with static
 * local data, so this build has zero backend/API dependency and zero
 * ongoing cost. Everything else — determineAction.ts's classification
 * logic, the exampleGame room/item/obstacle graph, and all game-state
 * transitions (inventory, obstacles, room changes) — is the same,
 * unmodified engine code from the original app.
 *
 * Each entry is one full turn: the exact input text that gets typed
 * into the field for the player (auto-filled, but the player must still
 * press Enter/Send themselves — this never auto-advances), and the
 * canned `{ actionSummary, playerPrompt }` response that would normally
 * come from the AI. Authored in the same voice as the game's existing
 * hardcoded room descriptions.
 *
 * This exact sequence was traced against determineAction.ts's real
 * classification logic (verb keyword matching, item/location tag
 * matching, single-exit fallback, obstacle keyword matching) to
 * confirm every step resolves to the intended ActionType against the
 * real `exampleGame` room graph — not just written to "look right".
 */

export interface ScriptedTurn {
  /** Text auto-typed into the input field for this turn. */
  inputText: string;
  /** Canned AI response for this turn (matches ActionResponse shape). */
  actionSummary: string;
  playerPrompt: string;
}

export const scriptedPlaythrough: ScriptedTurn[] = [
  {
    // Room 1 (cell) — investigate the chair
    inputText: 'look at the chair',
    actionSummary:
      'You crouch down next to the old wooden chair. Something small glints in the shadow underneath it.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 1 — pick up the key found under the chair
    inputText: 'pick up the key',
    actionSummary:
      'You reach under the chair and close your fingers around a small iron key. It feels cold and old.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 1 — use the key on the locked door (only exit, resolves via single-exit fallback)
    inputText: 'use the key on the door',
    actionSummary:
      'The key slides into the lock with a satisfying click. The heavy door creaks open, revealing a larger chamber beyond.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 1 -> Room 2 — exit through the now-unlocked door
    inputText: 'go north',
    actionSummary:
      'You step through the doorway into a larger room with high, arched ceilings.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 2 — investigate the table, which reveals the sword resting on it
    inputText: 'investigate the table',
    actionSummary:
      'The table is heavy and scratched, as if something had been dragged across it many times. A short sword rests on top, half-hidden under a layer of dust.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 2 — pick up the sword before exploring further
    inputText: 'pick up the sword',
    actionSummary:
      'You take the sword from the table. Its weight feels reassuring in your hand.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 2 -> Room 3 — a detour north
    inputText: 'go north',
    actionSummary:
      'You head north into a smaller room. Light filters through a gap above, but a wall of collapsed rubble blocks any way forward.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 3 — dead end, nothing more to do here; return to the room with the table
    inputText: 'go back',
    actionSummary:
      'You turn back and retrace your steps into the room with the high, arched ceilings.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 2 -> Room 4 — head east toward the guard room (no obstacle on this exit)
    inputText: 'go east',
    actionSummary:
      'You head east and find yourself in what looks like an old guard room.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 4 — pick up the key hanging on the wall
    inputText: 'pick up the key',
    actionSummary:
      'You take the newer-looking key from the ring on the wall. It looks like it might fit the exit door.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 4 — try the key on the corroded lock
    inputText: 'use the key on the door',
    actionSummary:
      'The key fits, but the lock is too corroded to turn. The metal flakes under your hand, brittle and weak.',
    playerPrompt: 'What do you do?',
  },
  {
    // Room 4 — use the sword on the padlocked exit door (explicit "north door" to resolve the correct exit among two)
    inputText: 'use the sword on the north door',
    actionSummary:
      "You wedge the sword's blade into the rusty padlock and twist. With a sharp crack, it breaks apart and falls away.",
    playerPrompt: 'What do you do?',
  },
  {
    // Room 4 -> Escape — exit now clear
    inputText: 'exit north',
    actionSummary:
      'The door swings open onto a set of stone stairs leading up and out. Fresh air rushes in. You have escaped the dungeon!',
    playerPrompt: 'What do you do?',
  },
];
