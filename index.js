const gridContainer = document.querySelector(".grid-container");
let cards = [];
let firstCard, secondCard;
let lockBoard = false;
let score = 0;
let timeLeft = 35;
let timerInterval = null;
let gameStarted = false;
let gameOver = false;
let matchedPairs = 0;

document.querySelector(".score").textContent = score;

fetch("./data/cards.json")
    .then(res => res.json())
    .then(data => {
        cards = [...data, ...data];
        shuffleCards();
        generateCards();
    });

function shuffleCards() {
    let currentIndex = cards.length, 
    randomIndex,
    temporaryValue;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = cards[currentIndex];
        cards[currentIndex] = cards[randomIndex];
        cards[randomIndex] = temporaryValue;
    }
}

function generateCards() {
    for (let card of cards) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.setAttribute('data-name', card.name);

        // 
cardElement.innerHTML = `
    <div class="front">
        <img class="front-image" src="${card.image}" alt="${card.name}">
    </div>
    <div class="back"></div>
`;

        gridContainer.appendChild(cardElement);
        cardElement.addEventListener('click', flipCard);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        document.querySelector(".timer").textContent = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameOver = true;
            lockBoard = true;
            alert("Time's up! Game Over!");
        }
    }, 1000);
}

function flipCard() {
    if (lockBoard || gameOver) return;
    if (this === firstCard) return;

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    this.classList.add('flipped');

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    lockBoard = true;

    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.name === secondCard.dataset.name;

    if (isMatch) {
        score++;
        document.querySelector(".score").textContent = score;
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    matchedPairs++;

    if (matchedPairs === cards.length / 2) {
        clearInterval(timerInterval);
        gameOver = true;
        alert("Congratulations! You Win!");
    }

    resetBoard();
}

function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [firstCard, secondCard] = [null, null];
    lockBoard = false;
}

function restart() {
    clearInterval(timerInterval);

    resetBoard();
    shuffleCards();

    score = 0;
    timeLeft = 35;
    gameStarted = false;
    gameOver = false;
    matchedPairs = 0;

    document.querySelector(".score").textContent = score;
    document.querySelector(".timer").textContent = timeLeft;

    gridContainer.innerHTML = '';
    generateCards();
}