# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Challenges

Creating the adventure - Assets

- It wouldn't create weapons or magical weapons. I wanted the rabbit to be holding a staff. It kept telling me that it was against the Code of conduct.

- Fix: I could get around it by asking it to create an image with a fantasy rabbit holding a stick. It never generated a stick, it always generated some sort of magical looking staff.

- I wanted to create a sword, which was also a problem. I asked it to generate an item that a knight might carry in their scabbard and it generated what looked like a grenade, but was probably just a weird water bottle.

- I was able to generate a spear. I got the error message, but just kept on generating, so it would work sometimes not others.

Creating the adventure - Output length

- It takes a long time (4-5 seconds) to take generate the adventure
- I chose to leave it like this, because the alternative would be loading one room at a time and then having to coordinate a story across the rooms when the ai would have to place keys to unlock rooms that hadn't been created yet.
- Manual it would be easier to create unique experience without ai by randomizing where the key is

Creating the adventure - "uniqueness"

- The AI would always create an adventure involving keys and doors as the solution. It would need more prompting to make the solutions more technique. For example, using a sword to break through a rusty lock or using a torch to burn down a wooden door. It didn't create any new or novel combinations of solutions (game is boring)

Looking at objects

- AI kept responding with the item as if the user had picked it up. When looking at a key the ai would always return the key object. In the example I specifically have a message saying to return null if the user is not not picking up the item. I also called the key "addItemToInventory". It would return the key.

- Fix: In the response I made the AI categorize the interaction the user was trying to do. For example "Move | Use | Investigate | PickUp". So even though the AI was still returning the item, I would know not to add it to the user's inventory.

Making things up:

- If the user would ask to look at their inventory the AI would make up things the user had like: torches and keys, even when I provided the current user inventory. I had to handle the inventory and messaging around an empty inventory on my end. Because the AI would always say there was something in the user's inventory.

- A frustrating scenario: If a user opened a door the AI would acknowledge that the door is open but would make up additional obstacles that prevented the player from opening the door. For example it would say: "The door is unlocked, but it is stuck and won't open"
  -Similarily it would add obstacles to doors that you have already gone through. If you wanted to return to a previous room it would say that there is rubble blocking the way.

Picking up items - AI success but no item returned

- If the user is picking something up the ai needs to let me know what they are picking up. If it doesn't return the item object I don't know what to add to the inventory. This would happen sometimes, so I added an extra note saying that the item is required to be returned when the actionType is pickupItemSuccess. I also have another fallback where if it doesn't return the item I send back a message pretending that the user dropped the item and needs to try and pick it up again.

## Overview

### Introduction

- Music, animations, settings
