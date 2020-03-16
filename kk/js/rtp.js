const balance = 1000;
const amountOfSpins = 10000;

for (j = 0; j < 100; j++) {
  let numOfZeros = 0;
  let newBalance = balance;
  let spins = null;
  let stopSpinning = false;

  for (let i = 0; i < amountOfSpins; i++) {
    spins++;
    newBalance--;

    let x = Math.floor(Math.random() * 37);

    if (x == 0) (newBalance += 36), numOfZeros++;

    if (newBalance == 0) i = amountOfSpins;
  }

  console.log(
    `After ${spins} spins, the ball landed on zero ${numOfZeros} times and your balance was £${newBalance}`
  );

  let profit = newBalance - balance;
  let winLose = newBalance < balance ? "loss" : "profit";

  console.log(`Your ${winLose} was £${Math.abs(profit)}`);
}
