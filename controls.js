class PlayerController {
    constructor(game) {
        this.game = game;
    }

    init() {
        document.addEventListener('keydown', (event) => {
            this.game.changePlayerDirection(event.key);
        });
    }
}

module.exports = { PlayerController };
