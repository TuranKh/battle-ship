import { stdin } from "node:process";

const letterForType = {
  C: {
    name: 'Carrier',
    length: 5,
    coordinates: new Set(),
    shortName: 'C',
  },
  B: {
    name: 'Battleship',
    length: 4,
    coordinates: new Set(),
    shortName: 'B',
  },
  R: {
    name: 'Cruiser',
    length: 3,
    coordinates: new Set(),
    shortName: 'R',
  },
  S: {
    name: 'Submarine',
    length: 3,
    coordinates: new Set(),
    shortName: 'S',
  },
  D: {
    name: 'Destroyer',
    length: 2,
    coordinates: new Set(),
    shortName: 'D',
  }
};

const computerShips = {};

const userCoordinates = {};
const opponentCoordinates = {};
const availableShips = new Set(Object.keys(letterForType));
const userShots = new Set();
const computerShots = new Set();
let userScore = 0;
let computerScore = 0;

const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const lettersCount = letters.length;
const numbers = Array.from({
  length: 10,
}, (_, index) => {
  return index + 1;
});

export default function main() {
  console.log('    \nWelcome on board Giga! \n');

  // Fill with null values

  for (const n of numbers) {
    for (const letter of letters) {
      const coordinate = `${letter}${n}`;
      userCoordinates[coordinate] = null;
      opponentCoordinates[coordinate] = null;
    }
  }

  printBoard(true);
  initializeBoard();

  const shipNames = Object.values(letterForType).map((det) => det.name);

  let stage = "ChooseGameType";
  let activeShip = null;
  console.log(`Press m for manual and a for automatic setup`);

  stdin.on("data", (data) => {
    const dataStr = data.toString("utf-8").trim();
    if (dataStr === 'show') {
      printBoard(false, true);
    }
    switch (stage) {
      case "ChooseGameType":
        const insensitive = dataStr.toLowerCase()
        if (insensitive === 'm') {
          stage = "ChooseShip";
          console.log(`\n You have 4 types of ships:  ${shipNames.join(',')}. Which one 
          do you want to place, press letter to proceed: \n 
            ${getShips()}
          `);
        }
        else if (insensitive === 'a') {
          initializeBoard(true);
          stage = "UserShoots";
          console.log('\n Enter the coordinate you want to shoot: ');
        }
        break;
      case "ChooseShip":
        const letter = dataStr.toUpperCase();
        const chosenShipDetails = letterForType[letter];
        const isValidShip = !!chosenShipDetails;
        if (isValidShip) {
          activeShip = {
            details: chosenShipDetails,
            letter,
          };
          console.log(`You chose ${chosenShipDetails.name}, it has the length of ${chosenShipDetails.length}, please enter ${chosenShipDetails.length} coordinates by separating with coma`);
          stage = "PlaceShip";
        }
        else {
          console.error(`The ship you entered doesn't exists, choose from these: 
            ${getShips()}`);
        }
        break;

      case "PlaceShip":
        const enteredCoordinates = dataStr.split(',');
        const enteredCoordinatesSet = new Set(enteredCoordinates);
        let hasError = false;
        if (enteredCoordinatesSet.size !== activeShip.details.length) {
          console.error(`The ship you chose (${activeShip.details.name}) has length of ${activeShip.details.length}, please enter right length`);
        }
        else {
          // Consecutive check
          let isHorizontal = true;
          let isVertical = true;
          let letters = [];
          let values = [];

          for (const userCoordinate of enteredCoordinates) {
            const trimmed = userCoordinate.trim();
            const [letter, ...value] = trimmed.split("");
            letters.push(letter);
            values.push(Number(value.join('')));
          }

          letters = letters.sort();
          let startingPoint = null;
          letterCheck: for (const letter of letters) {
            const unicode = letter.charCodeAt(0);
            if (startingPoint === null) {
              startingPoint = unicode;
            }
            else {
              if (startingPoint + 1 !== unicode) {
                isHorizontal = false;
                break letterCheck;
                // console.error('The coordinates should be ')
              }
              else {
                startingPoint = unicode;
              }
            }
          }

          values = values.sort((a, b) => a - b);
          startingPoint = null;
          valueCheck: for (const value of values) {
            if (startingPoint === null) {
              startingPoint = value;
            }
            else {
              if (startingPoint + 1 !== value) {
                isVertical = false;
                break valueCheck;
              }
              else {
                startingPoint = value;
              }
            }
          }


          if ((isHorizontal && isVertical) || (!isHorizontal && !isVertical)) {
            console.error('Choose either horizontal or vertical placement');
            break;
          }

          entered: for (const userCoordinate of enteredCoordinates) {
            const trimmed = userCoordinate.trim().toUpperCase();
            const coordinateValue = userCoordinates[trimmed];

            if (coordinateValue === undefined) {
              console.error(`Wrong coordinate ${trimmed}, coordinate you entered doesn't exist`);
              hasError = true;
              break entered;
            }

            // means cell is empty
            else if (coordinateValue === null) {
              userCoordinates[trimmed] = activeShip.letter;
              activeShip.details.coordinates.add(userCoordinate);
            }

            else {
              const placedShip = letterForType[coordinateValue];
              console.log(`Mate, you have already placed ship: ${placedShip.name} ship there, nice try :)`);
              console.log(`Enter valid coordinates for ${activeShip.details.name}`);
              hasError = true;
              break entered;
            }
          }

          if (!hasError) {
            console.log(`=== Well Done, Ship ${activeShip.details.name} is placed ===`);
            printBoard(true);
            availableShips.delete(activeShip.letter);

            if (availableShips.size === 0) {
              console.log(' Great! You are done placing your ships, Ready to start the game');
              stage = "UserShoots";
              printBoard(false);
              console.log('\n Enter the coordinate you want to shoot: ');
            }
            else {
              console.log(`Ships that are left for placement: 
                ${getShips()}`);
              stage = "ChooseShip";
            }
          }
        }
        break;

      case "UserShoots":
        const enteredCoordinate = dataStr.toUpperCase();
        const alreadyShot = userShots.has(enteredCoordinate);
        const target = opponentCoordinates[enteredCoordinate];
        const isValidShot = target !== undefined;

        if (alreadyShot) {
          console.log('Mate you already shot there, play wisely 🧠');
          console.log('Try again');
        }
        else if (isValidShot) {
          userShots.add(enteredCoordinate);
          if (target === null) {
            console.log('You missed: ❌');
          }

          else {
            computerShips[target].delete(enteredCoordinate);
            if (computerShips[target].size === 0) {
              console.log(`You destroyed ${letterForType[target].name} ship, Good job 🪄`);
              userScore++;
              if (userScore === availableShips.size) {
                console.log('You won the game, congrats! 💙');
              }
            }
            else {
              console.log(`Great job, you hit a ship, but I won't tell you which) ☄️`);
            };
          }
          stage = "ComputerShoots"
          computerMakesShot();
          stage = "UserShoots"
        }
        else {
          console.log('Your coordinate is not valid, 👀')
        }

        break;

      case "ComputerShoots":
        console.log('It is computers turn, be patient');
    }
    // const enteredStr = 
    // stdout.write(data.toString("utf-8").toUpperCase());
  });

}

const getShips = function () {
  const shipsArr = Array.from(availableShips);
  let shipsMessage = "";

  for (let i = 0; i < shipsArr.length; i++) {
    const letter = shipsArr[i];

    shipsMessage += `${i + 1}. ${letter} for ${letterForType[letter].name}\n`
  }

  return shipsMessage;
}

const printBoard = function (isUserBoard, isCheatMode = false) {

  const title = isUserBoard ? 'Your board' : 'Target board';

  console.log(`   ====${title}====`);

  const lettersStr = letters.join('  ');
  console.log(`   ${lettersStr}`);

  const coordinateKeys = Object.keys(userCoordinates);
  let mergedCoordinateValues = "";

  if (isUserBoard) {
    for (let i = 0; i < coordinateKeys.length; i++) {
      const coordinate = coordinateKeys[i];
      const valueInCoordinate = userCoordinates[coordinate];
      if (valueInCoordinate === null) {
        const coordinateIsShot = computerShots.has(coordinate);
        mergedCoordinateValues += ` ${coordinateIsShot ? '0' : '~'} `;
      }
      else if (valueInCoordinate) {
        const coordinateIsShot = computerShots.has(coordinate);
        mergedCoordinateValues += ` ${coordinateIsShot ? 'X' : valueInCoordinate} `;

      }
      else {
        mergedCoordinateValues += " O ";
      }
      const reminder = (i + 1) % lettersCount;
      if (reminder === 0) {
        const rowNumber = Math.floor(i / 10) + 1;
        console.log(`${rowNumber} ${mergedCoordinateValues}`);
        mergedCoordinateValues = "";
      }
    }
  }
  else {
    for (let i = 0; i < coordinateKeys.length; i++) {
      const coordinate = coordinateKeys[i];
      const valueInCoordinate = opponentCoordinates[coordinate];

      if (valueInCoordinate === null) {
        const coordinateIsShot = userShots.has(coordinate);
        mergedCoordinateValues += ` ${coordinateIsShot ? '0' : '~'} `;
      }

      else if (valueInCoordinate) {
        const coordinateIsShot = userShots.has(coordinate);
        if (isCheatMode) {
          mergedCoordinateValues += ` ${coordinateIsShot ? 'X' : valueInCoordinate} `;
        }
        else {
          mergedCoordinateValues += ` ${coordinateIsShot ? 'X' : '~'} `;
        }
      }
      else {
        mergedCoordinateValues += " O ";
      }
      const reminder = (i + 1) % lettersCount;
      if (reminder === 0) {
        const rowNumber = Math.floor(i / 10) + 1;
        console.log(`${rowNumber} ${mergedCoordinateValues}`);
        mergedCoordinateValues = "";
      }
    }
  }
}

const initializeBoard = function (isUserBoard = false) {
  const coordinatesObj = isUserBoard ? userCoordinates : opponentCoordinates;
  const shipsDetails = Object.values(letterForType);
  let index = 0;
  let currentShipDetails = shipsDetails[index];

  const generate = function () {
    let canPlace = true;
    const isHorizontal = Math.random() > 0.5;
    const currentLength = currentShipDetails.length;
    const randomValueIndex = Math.floor(Math.random() * 10);
    const randomLetterIndex = Math.floor(Math.random() * 10);


    let selectedCoordinates = [];
    if (isHorizontal) {
      for (let i = 0; i < currentLength; i++) {
        const selectedCoordinate = `${letters[randomLetterIndex + i]}${numbers[randomValueIndex]}`;
        selectedCoordinates.push(selectedCoordinate);

        if (coordinatesObj[selectedCoordinate] !== null) {
          canPlace = false;
          selectedCoordinates = [];
          break;
        };
      }
    }

    else {
      for (let i = 0; i < currentLength; i++) {
        const selectedCoordinate = `${letters[randomLetterIndex]}${numbers[randomValueIndex + i]}`;
        selectedCoordinates.push(selectedCoordinate);
        if (coordinatesObj[selectedCoordinate] !== null) {
          canPlace = false;
          selectedCoordinates = [];
          break;
        };
      }
    }

    if (canPlace) {
      for (const coordinate of selectedCoordinates) {
        coordinatesObj[coordinate] = currentShipDetails.shortName;
      }

      index = index + 1;
      currentShipDetails = shipsDetails[index];
      if (index !== shipsDetails.length) {
        generate();
      }
    }

    else {
      generate();
    }
  }

  generate();

  if (isUserBoard) {
    console.log('Your setup is ready 🚀');
    printBoard(true);
  }
  else {
    printBoard(false);
    console.log('Opponent is ready 🤖');

    for (let key in coordinatesObj) {
      const value = coordinatesObj[key];
      if (value !== null) {
        const exists = computerShips[value];

        if (exists) {
          computerShips[value].add(key);
        }
        else {
          computerShips[value] = new Set([key]);
        }
      }
    }
  }
}

const computerMakesShot = function () {
  const randomValueIndex = Math.floor(Math.random() * 10);
  const number = numbers[randomValueIndex];

  const randomLetterIndex = Math.floor(Math.random() * 10);
  const letter = letters[randomLetterIndex];

  const coordinate = `${letter}${number}`;
  computerShots.add(coordinate);
  console.log(`Computer hit you on: ${coordinate}`);
  const shipType = userCoordinates[coordinate];

  if (shipType) {
    const ship = userCoordinates[coordinate];
    const coordinates = letterForType[shipType].coordinates;
    coordinates.delete(coordinate);
    const isDestroyed = coordinates.size === 0;

    if (isDestroyed) {
      console.log(`Opponent destroyed your ${letterForType[ship].name} 😢`);
      computerScore + 1;

      if (computerScore === availableShips.size) {
        console.log(`Computer won the game, I believed in you! 🙅🏼‍♂️`);
      }
    }
    else {
      console.log(`Opponent hit your ${letterForType[ship].name} 😢`);
    }

  }
  else {
    console.log('Opponent missed ❌');
    console.log('Now your turn');
  }
  printBoard(true);
  printBoard(false);
}

main();

