// Create the canvas
var canvas = document.createElement("canvas");
var canvasCtx = canvas.getContext("2d");
canvas.width = 280*3;
canvas.height = 280*2;
document.body.appendChild(canvas);

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

const background = new Background("images/floor_tile.png", 280, 280, 3, 2);
const player = new SpritesheetSprite("images/player_spritesheet.png", 32, 32);


var render = function() {
    if (background.isReady) {
        background.draw();
    }
    if (player.isReady) {
        player.draw(0, 0);
    }
}

// The main game loop
var main = function () {
    console.log("main()");
    render();
    //  Request to do this again ASAP
    setTimeout(() => requestAnimationFrame(main), 1000); // slow update for testing purposes
};

main();

