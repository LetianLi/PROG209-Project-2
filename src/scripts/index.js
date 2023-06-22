// Create the canvas
var canvas = document.createElement("canvas");
var canvasCtx = canvas.getContext("2d");
canvas.width = 280*3;
canvas.height = 280*2;
document.body.appendChild(canvas);

// Handle pausing and unpausing
var gameActive = true;
function pauseResume() {
    gameActive = !gameActive;
    if (gameActive) {
        lastUpdateTime = performance.now();
        main();
        document.getElementById("pauseBtn").innerHTML = "Pause";
    } else {
        document.getElementById("pauseBtn").innerHTML = "Play";
    }
    document.getElementById("info").innerHTML = "";
}
// Pause game if page is not focused
document.addEventListener("visibilitychange", function() {
    if (gameActive && document.visibilityState !== 'visible') {
        gameActive = false;
        document.getElementById("pauseBtn").innerHTML = "Play";
        document.getElementById("info").innerHTML = "Paused due to loss of focus";
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
        return this.x > other.x && this.x < other.x + other.spriteWidth 
                && this.y > other.y && this.y < other.y + other.spriteHeight;
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

class Player extends SpritesheetSprite {
    direction = "DOWN";
    moving = false;
    mining = false;
    speed = 100;

    static #directionFrameMapping = {"DOWN":0, "LEFT":1, "RIGHT":2, "UP":3};

    constructor() {
        super("images/player_spritesheet.png", 32, 32, 10, 3);
    }

    move(relX, relY) {
        this.moving = false;

        if (this.x + relX < mapLimits.left) {
            this.x = mapLimits.left;
            this.direction = "LEFT";
        } else if (this.x + this.spriteWidth + relX > mapLimits.right) {
            this.x = mapLimits.right - this.spriteWidth;
            this.direction = "RIGHT";
        } else {
            if (relX < 0) this.direction = "LEFT";
            if (relX > 0) this.direction = "RIGHT";
            if (relX != 0) this.moving = true;
            this.x += relX;
        }
        if (this.y + relY < mapLimits.top) {
            this.direction = "UP";
            this.y = mapLimits.top;
        } else if (this.y + this.spriteHeight + relY > mapLimits.bottom) {
            this.direction = "DOWN";
            this.y = mapLimits.bottom - this.spriteHeight;
        } else {
            if (relY < 0) this.direction = "UP";
            if (relY > 0) this.direction = "DOWN";
            if (relY != 0) this.moving = true;
            this.y += relY;
        }
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

const background = new Background("images/floor_tile.png", 280, 280, 3, 2);
const player = new Player();


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
}


function render() {
    if (background.isReady) {
        background.draw();
    }
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

    lastUpdateTime = now;

    // Loop next animation frame
    if (gameActive) requestAnimationFrame(main);
};

let lastUpdateTime = performance.now();
main();

