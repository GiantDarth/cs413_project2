// Copyright (c) 2016 Christopher Robert Philabaum
// Use self-closing anonymous function (using arrow-notation) to avoid flooding the 'namespace'
(() => {
    // Only run when the document is fully loaded.
    document.addEventListener("DOMContentLoaded", (event) => {
        const WIDTH = 400;
        const HEIGHT = 400;
        const PIXEL_SIZE = 32;
        // Multiplier on the difference between the ball mouse
        // Affects how fast/slow the ball is shot
        const VELOCITY_FACTOR = 0.05;
        let strikes = 0;

        var gameport = document.getElementById("gameport");
        // Shortened from #000000
        var renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT, { backgroundColor: 0x000 });
        gameport.appendChild(renderer.view);

        var stage = new PIXI.Container();
        // Scoreboard text.
        var scoreBoard = new PIXI.Text(strikes, {fill: 'white'});
        // Anchor on the top-right
        scoreBoard.anchor.x = 1;
        scoreBoard.anchor.y = 0;
        scoreBoard.position.x = WIDTH - 40;
        scoreBoard.position.y = 10;

        stage.addChild(scoreBoard);

        var ball = new PIXI.Sprite(PIXI.Texture.fromImage('assets/bowl_ball.png'));
        var pins = new Array();
        // Used to not reuse/reload the same image.
        const PIN_IMG = PIXI.Texture.fromImage('assets/pin.png');
        for(let i = 0; i < 10; i++) {
            pins.push(new PIXI.Sprite(PIN_IMG));
        }

        ball.anchor.x = 0.5;
        ball.anchor.y = 0.5;
        // Center sprite on screen.
        ball.position.x = WIDTH / 2;
        ball.position.y = HEIGHT - PIXEL_SIZE;

        // Custom states
        ball.released = true;
        ball.velocity = { x: 0, y: 0 };

        stage.addChild(ball);

        // Use to position the pins collectively.
        var pinsContainer = new PIXI.Container();
        // Get the count of rows.
        const ROWS = getNumOfRows(pins.length);
        for(let p = 0, pos = 0, row = 0; p < pins.length; p++) {
            pins[p].anchor.x = 0.5;
            pins[p].anchor.y = 0.5;

            // Add pins starting from left-to-right
            pins[p].position.x = (pos - row / 2) * PIXEL_SIZE;
            // Reverse the y position based on row facing the ball,
            // so that the first pin is bottom.
            pins[p].position.y = (ROWS - row) * PIXEL_SIZE;

            // Custom collided state.
            pins[p].collided = false;
            // Set custom collided event.
            pins[p].on('collided', (ball, pin, index) => {
                if(!pin.collided) {
                    console.log("Pin", index);
                }
                pin.collided = true;
            });

            pinsContainer.addChild(pins[p]);

            if(isLastOfRow(pos, row)) {
                row++;
                pos = 0;
            }
            else {
                pos++;
            }
        }

        pinsContainer.position.x = WIDTH / 2;
        pinsContainer.position.y = 0;

        stage.addChild(pinsContainer);

        ball.interactive = true;

        ball.on('mousedown', (e) => {
            ball.released = false;
        });

        ball.on('mousemove', (e) => {
            if(!ball.released) {
                // Rotate the ball based on the mouse position relative to the ball position, and compensate with an extra 90 degrees to the left.
                ball.rotation = Math.atan2(e.data.global.y - ball.position.y, e.data.global.x - ball.position.x) - Math.PI / 2;
            }
        });

        ball.on('mouseupoutside', (e) => {
            if(!ball.released) {
                ball.velocity = { x: (ball.position.x - e.data.global.x) * VELOCITY_FACTOR,
                    y: (ball.position.y - e.data.global.y) * VELOCITY_FACTOR}
            }
            ball.released = true;
        });

        function resetBall() {
            ball.velocity = {x: 0, y: 0};
            ball.position.x = WIDTH / 2;
            ball.position.y = HEIGHT - PIXEL_SIZE;
            ball.rotation = 0;
        }

        function resetPins() {
            pins.forEach(pin => {
                pin.visible = true;
                pin.collided = false;
            });
        }

        function resetGame() {
            resetPins();
            resetBall();
            strikes++;
            scoreBoard.text = strikes;
        }

        function checkCollision(ball, pin) {
            // Collided only if the absolute of the distances in both axes are less than their bitmaps.
            return Math.abs(ball.position.x - (pin.position.x + pinsContainer.x)) < PIXEL_SIZE
            && Math.abs(ball.position.y - (pin.position.y + pinsContainer.y)) < PIXEL_SIZE;
        }

        // Self-execute animate
        (function animate() {
            requestAnimationFrame(animate);
            // If either velocity vector component is non-zero
            if(ball.velocity.x || ball.velocity.y) {
                ball.rotation += 0.2;
                ball.position.x += ball.velocity.x;
                ball.position.y += ball.velocity.y;

                pins.forEach((pin, index) => {
                    if(checkCollision(ball, pin)) {
                        pin.emit('collided', ball, pin, index);
                    }

                    // Hide the pin if collided.
                    if(pin.collided) {
                        pin.visible = false;
                    }
                });

                // If every pin is collided, then reset the game layout.
                if(pins.every(pin => pin.collided)) {
                    resetGame();
                }

                if(ball.position.x < 0 || ball.position.x > WIDTH || ball.position.y < 0 || ball.position.y > HEIGHT) {
                    resetBall();
                }
            }
            renderer.render(stage);
        })();
    });

    function isLastOfRow(pos, row) {
        return pos === row;
    }

    function getNumOfRows(numOfPins) {
        var row = 0;
        for(let n = 0, pos = 0; n < numOfPins; n++) {
            // Reset position and increment row num.
            if(isLastOfRow(pos, row)) {
                row++;
                pos = 0;
            }
            else {
                pos++;
            }
        }

        return row;
    }
})();
