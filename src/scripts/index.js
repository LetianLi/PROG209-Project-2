// Create the canvas
var canvas = document.createElement("canvas");
var canvasCtx = canvas.getContext("2d");
canvas.width = 280*3;
canvas.height = 280*2;
document.body.appendChild(canvas);

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

    constructor(src, spriteWidth, spriteHeight) {
        this.#image = new Image();
        this.#image.src = src;
        this.#image.onload = () => {
            this.isReady = true;
            console.log("Finished loading image " + src);
        }
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
    }

    draw(sheetX = 0, sheetY = 0) {
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
    speed = 100;

    constructor() {
        super("images/player_spritesheet.png", 32, 32);
    }

    move(relX, relY) {
        if (this.x + relX < mapLimits.left) {
            this.x = mapLimits.left;
        } else if (this.x + this.spriteWidth + relX > mapLimits.right) {
            this.x = mapLimits.right - this.spriteWidth;
        } else {
            this.x += relX;
        }
        if (this.y + relY < mapLimits.top) {
            this.y = mapLimits.top;
        } else if (this.y + this.spriteHeight + relY > mapLimits.bottom) {
            this.y = mapLimits.bottom - this.spriteHeight;
        } else {
            this.y += relY;
        }

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
    if (keysDown["ArrowLeft"]) relX -= 10;
    if (keysDown["ArrowRight"]) relX += 10;
    if (keysDown["ArrowUp"]) relY -= 10;
    if (keysDown["ArrowDown"]) relY += 10;

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
    requestAnimationFrame(main);
};

let lastUpdateTime = performance.now();
main();

