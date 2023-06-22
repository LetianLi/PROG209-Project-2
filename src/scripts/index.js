// Create the canvas (will resize for smaller windows)
var canvas = document.createElement("canvas");
var canvasCtx = canvas.getContext("2d");
canvas.width = Math.min(500, window.innerWidth * 0.9);
canvas.height = Math.min(400, window.innerHeight * 0.9 - 140);
document.getElementById("game").appendChild(canvas);

// Handle pausing and unpausing
var gameActive = true;
var gameWon = false;
function pauseResume() {
    gameActive = !gameActive;
    if (gameActive) {
        lastUpdateTime = performance.now();
        keysDown = {}; // reset keys just in case
        main();
        document.getElementById("pauseBtn").innerHTML = "Pause";
    } else {
        document.getElementById("pauseBtn").innerHTML = "Play";
    }
    if (!gameWon) document.getElementById("info").innerHTML = "";
}
// Pause game if page is not focused (unfortunately does not catch window changes)
document.addEventListener("visibilitychange", function() {
    if (gameActive && document.visibilityState !== 'visible') {
        gameActive = false;
        document.getElementById("pauseBtn").innerHTML = "Play";
        if (!gameWon) document.getElementById("info").innerHTML = "Paused due to loss of focus";
    }
});

const mapLimits = {
    left: 10,
    right: canvas.width - 10,
    top: 10,
    bottom: canvas.height - 10
};  

// Setup some helpful classes
class SpritesheetSprite {
    #image;
    isReady = false;
    x = 0;
    y = 0;
    frame = 0;

    constructor(src, spriteWidth, spriteHeight, framesPerAnimation, animationCount) {
        this.#image = new Image();
        this.#image.src = src;
        this.#image.onload = () => {
            this.isReady = true;
            console.log("Finished loading image " + src);
        }
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.framesPerAnimation = framesPerAnimation;
        this.animationCount = animationCount;
    }

    draw(sheetX = 0, sheetY = 0) {
        sheetX = Math.round(sheetX);
        sheetY = Math.round(sheetY);
        canvasCtx.drawImage(this.#image, this.spriteWidth*sheetX, this.spriteHeight*sheetY, this.spriteWidth, this.spriteHeight, this.x, this.y, this.spriteWidth, this.spriteHeight);
    }

    isColliding(other) {
        return this.x + this.spriteWidth > other.x && this.x < other.x + other.spriteWidth 
            && this.y + this.spriteHeight > other.y && this.y < other.y + other.spriteHeight;
    }

    isInProximity(other, distance = 10) {
        return this.x + this.spriteWidth + distance > other.x && this.x < other.x + other.spriteWidth + distance
            && this.y + this.spriteHeight + distance > other.y && this.y < other.y + other.spriteHeight + distance;
    }
}

class Background {
    #image;
    #tileWidth;
    #tileHeight;
    #tileAmountX;
    #tileAmountY;
    isReady = false;
    x = 0;
    y = 0;

    constructor(src, tileWidth, tileHeight, tileAmountX, tileAmountY) {
        this.#image = new Image();
        this.#image.src = src;
        this.#image.onload = () => {
            this.isReady = true;
            console.log("Finished loading image " + src);
        }
        this.#tileWidth = tileWidth;
        this.#tileHeight = tileHeight;
        this.#tileAmountX = tileAmountX;
        this.#tileAmountY = tileAmountY;
    }

    draw() {
        for (let row = 0; row < this.#tileAmountY; row++) {
            for (let col = 0; col < this.#tileAmountX; col++) {
                canvasCtx.drawImage(this.#image, this.x + col*this.#tileWidth, this.y + row*this.#tileHeight);
            }
        }
    }
}

class Rock {
    #image;
    spriteWidth;
    spriteHeight;
    isReady = false;
    x = 0;
    y = 0;

    constructor(src, width, height) {
        this.#image = new Image();
        this.#image.src = src;
        this.#image.onload = () => {
            this.isReady = true;
            console.log("Finished loading image " + src);
        }
        this.spriteWidth = width;
        this.spriteHeight = height;
    }

    draw() {
        canvasCtx.drawImage(this.#image, this.x, this.y);
    }
}

class Player extends SpritesheetSprite {
    direction = "DOWN";
    moving = false;
    mining = false;
    speed = 100;

    static #directionFrameMapping = {"DOWN":0, "LEFT":1, "RIGHT":2, "UP":3};

    constructor() {
        super("images/player_spritesheet.png", 32, 32, 5, 3);
    }

    move(relX, relY) {
        if (relX < 0) this.direction = "LEFT";
        else if (relX > 0) this.direction = "RIGHT";
        else if (relY < 0) this.direction = "UP";
        else if (relY > 0) this.direction = "DOWN";

        let maxDistanceLeft = this.x - mapLimits.left;
        let maxDistanceRight = mapLimits.right - this.x - this.spriteWidth;
        let maxDistanceUp = this.y - mapLimits.top;
        let maxDistanceDown = mapLimits.bottom - this.y - this.spriteHeight;

        relX = Math.min(Math.max(-maxDistanceLeft, relX), maxDistanceRight);
        relY = Math.min(Math.max(-maxDistanceUp, relY), maxDistanceDown);
        
        this.moving = !(relX == 0 && relY == 0);
        this.x += relX;
        this.y += relY;
    }

    draw() {
        if (this.moving) {
            this.frame = (this.frame + 1) % (this.framesPerAnimation * this.animationCount);
            var animationOffset = Math.floor(this.frame / this.framesPerAnimation);
        } else {
            this.frame = 0;
            var animationOffset = 1;
        }
        let sheetX = (this.mining ? 3 : 0) + animationOffset;
        let sheetY = Player.#directionFrameMapping[this.direction];
        super.draw(sheetX, sheetY);
    }
}

class Slime extends SpritesheetSprite {
    direction = "LEFT";
    moving = false;
    state = "MOVING";
    speed = 100;
    color = 0;

    static #stateFrameMapping = { "IDLE": 0, "MOVING": 2, "DEATH": 4 };

    constructor() {
        super("images/slime_spritesheet.png", 32, 32, 5, 10);
        this.color = Math.floor(Math.random() * 4);
        this.frame = Math.floor(Math.random() * 100);
    }

    draw() {
        if (this.state === "DEATH") {
            this.frame = Math.min(40, this.frame + 2);
        } else {
            this.frame = (this.frame + 1) % (this.framesPerAnimation * this.animationCount);
        }
        var animationOffset = Math.floor(this.frame / this.framesPerAnimation);
        var colorOffset = this.color * 5;

        let sheetX = animationOffset;
        let sheetY = Slime.#stateFrameMapping[this.state] + colorOffset;
        super.draw(sheetX, sheetY);
    }

    kill() {
        if (this.state !== "DEATH") {
            this.state = "DEATH";
            this.frame = 0;
        }
    }

    isDead() {
        return this.state === "DEATH" && this.frame == 40;
    }
}

const background = new Background("images/floor_tile.png", 280, 280, 3, 2);
const player = new Player();
player.x = 50;
player.y = 50;

const rocks = [];
for (let i = 0; i < 3; i++) {
    const rock = new Rock("images/rock.png", 46, 32);
    rock.x = Math.floor(Math.random() * (canvas.width - rock.spriteWidth));
    rock.y = Math.floor(Math.random() * (canvas.height - rock.spriteHeight));
    // try again if too close to player
    if (!player.isInProximity(rock, 10)) rocks.push(rock);
    else i--;
}

const enemies = [];
for (let i = 0; i < 10; i++) {
    const slime = new Slime();
    slime.x = Math.floor(Math.random() * (canvas.width - slime.spriteWidth));
    slime.y = Math.floor(Math.random() * (canvas.height - slime.spriteHeight));
    // try again if too close to player or a rock
    if (slime.isInProximity(player, 10) || rocks.some(rock => slime.isInProximity(rock, 2))) i--; 
    else enemies.push(slime);
}


var keysDown = {};
addEventListener("keydown", function (e) {
    keysDown[e.key] = true;
}, false);
addEventListener("keyup", function (e) {
    delete keysDown[e.key];
}, false);


function update(deltaTime) {
    let relX = 0;
    let relY = 0;
    if (keysDown["ArrowLeft"] || keysDown["a"]) relX -= 10;
    if (keysDown["ArrowRight"] || keysDown["d"]) relX += 10;
    if (keysDown["ArrowUp"] || keysDown["w"]) relY -= 10;
    if (keysDown["ArrowDown"] || keysDown["s"]) relY += 10;

    player.move(relX * deltaTime/100, relY * deltaTime/100);
    player.mining = enemies.some(slime => player.isInProximity(slime));

    enemies.forEach(slime => {
        if (player.isColliding(slime)) {
            slime.kill();
        }
    });
}


function render() {
    if (background.isReady) {
        background.draw();
    }

    rocks.forEach(rock => {
        if (rock.isReady) {
            rock.draw();
        }
    });

    enemies.forEach(slime => {
        if (slime.isReady) {
            slime.draw();
        }
    });

    if (player.isReady) {
        player.draw(0, 0);
    }
}

// The main game loop
function main() {
    let now = performance.now();
    let deltaTime = now - lastUpdateTime;
    update(deltaTime);

    render();
    document.getElementById("latencyDisplay").innerHTML = deltaTime.toFixed(1);

    if (enemies.every(slime => slime.isDead()) && !gameWon) {
        gameWon = true;
        document.getElementById("info").innerHTML = "<b>You win!!!!</b>";
        document.getElementById("restartBtn").style = "display: inline-block";
    }

    lastUpdateTime = now;

    // Loop next animation frame
    if (gameActive) requestAnimationFrame(main);
};

let lastUpdateTime = performance.now();
main();

