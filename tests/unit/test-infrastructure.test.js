/**
 * Test infrastructure validation
 * Verifies that all mocks, helpers, and fixtures are working correctly
 */

const threeMocks = require('../mocks/three');
const audioMocks = require('../mocks/audio');
const websocketMocks = require('../mocks/websocket');
const domHelpers = require('../helpers/dom');
const asyncHelpers = require('../helpers/async');
const gameStateFixtures = require('../fixtures/gameStates');
const networkMessageFixtures = require('../fixtures/networkMessages');
const audioBufferFixtures = require('../fixtures/audioBuffers');

describe('Test Infrastructure', () => {
    describe('Three.js Mocks', () => {
        it('should create mock scene', () => {
            const scene = threeMocks.createMockScene();
            expect(scene).toBeDefined();
            expect(scene.add).toBeDefined();
            expect(scene.remove).toBeDefined();
        });

        it('should create mock camera', () => {
            const camera = threeMocks.createMockCamera();
            expect(camera).toBeDefined();
            expect(camera.position).toBeDefined();
            expect(camera.lookAt).toBeDefined();
        });

        it('should create mock renderer', () => {
            const renderer = threeMocks.createMockRenderer();
            expect(renderer).toBeDefined();
            expect(renderer.render).toBeDefined();
            expect(renderer.domElement).toBeInstanceOf(HTMLCanvasElement);
        });
    });

    describe('Audio Mocks', () => {
        it('should create mock audio context', () => {
            const context = audioMocks.createMockAudioContext();
            expect(context).toBeDefined();
            expect(context.createGain).toBeDefined();
            expect(context.state).toBe('running');
        });

        it('should create mock audio buffer', () => {
            const buffer = audioMocks.createMockAudioBuffer(2, 44100, 44100);
            expect(buffer).toBeDefined();
            expect(buffer.numberOfChannels).toBe(2);
            expect(buffer.length).toBe(44100);
        });
    });

    describe('WebSocket Mocks', () => {
        it('should create mock Socket.io client', () => {
            const socket = websocketMocks.createMockSocketIO();
            expect(socket).toBeDefined();
            expect(socket.on).toBeDefined();
            expect(socket.emit).toBeDefined();
        });

        it('should simulate connection', () => {
            const socket = websocketMocks.createMockSocketIO();
            const connectHandler = jest.fn();
            socket.on('connect', connectHandler);
            socket.simulateConnect();
            expect(connectHandler).toHaveBeenCalled();
            expect(socket.connected).toBe(true);
        });
    });

    describe('DOM Helpers', () => {
        let container;

        afterEach(() => {
            if (container) {
                domHelpers.cleanupContainer(container);
            }
        });

        it('should create container', () => {
            container = domHelpers.createContainer('test');
            expect(container).toBeInstanceOf(HTMLElement);
            expect(document.body.contains(container)).toBe(true);
        });

        it('should create element with attributes', () => {
            const element = domHelpers.createElement('div', {
                id: 'test-div',
                className: 'test-class',
            });
            expect(element.id).toBe('test-div');
            expect(element.className).toBe('test-class');
        });

        it('should simulate events', () => {
            container = domHelpers.createContainer('test');
            const button = domHelpers.createElement('button');
            container.appendChild(button);
            const handler = jest.fn();
            button.addEventListener('click', handler);
            domHelpers.simulateEvent(button, 'click');
            expect(handler).toHaveBeenCalled();
        });
    });

    describe('Async Helpers', () => {
        it('should wait for condition', async () => {
            let ready = false;
            setTimeout(() => {
                ready = true;
            }, 100);
            await asyncHelpers.waitFor(() => ready, 200);
            expect(ready).toBe(true);
        });

        it('should flush promises', async () => {
            let resolved = false;
            Promise.resolve().then(() => {
                resolved = true;
            });
            await asyncHelpers.flushPromises();
            expect(resolved).toBe(true);
        });

        it('should create deferred promise', () => {
            const deferred = asyncHelpers.createDeferred();
            expect(deferred.promise).toBeInstanceOf(Promise);
            expect(deferred.resolve).toBeInstanceOf(Function);
            expect(deferred.reject).toBeInstanceOf(Function);
        });
    });

    describe('Game State Fixtures', () => {
        it('should create basic game state', () => {
            const state = gameStateFixtures.createBasicGameState();
            expect(state).toBeDefined();
            expect(state.player).toBeDefined();
            expect(state.ai).toBeDefined();
            expect(state.gameOver).toBe(false);
        });

        it('should create game state with trails', () => {
            const state = gameStateFixtures.createGameStateWithTrails();
            expect(state.player.trail.length).toBeGreaterThan(0);
            expect(state.ai.trail.length).toBeGreaterThan(0);
        });

        it('should create multiplayer game state', () => {
            const state = gameStateFixtures.createMultiplayerGameState(4);
            expect(state.players).toHaveLength(4);
            expect(state.mode).toBe('multiplayer');
        });
    });

    describe('Network Message Fixtures', () => {
        it('should create player join message', () => {
            const message = networkMessageFixtures.createPlayerJoinMessage('player-1', 'Alice');
            expect(message.type).toBe('playerJoin');
            expect(message.playerId).toBe('player-1');
            expect(message.playerName).toBe('Alice');
        });

        it('should create game start message', () => {
            const message = networkMessageFixtures.createGameStartMessage([], 'classic');
            expect(message.type).toBe('gameStart');
            expect(message.gameMode).toBe('classic');
        });
    });

    describe('Audio Buffer Fixtures', () => {
        it('should create audio buffer data', () => {
            const buffer = audioBufferFixtures.createAudioBufferData(2, 44100, 44100);
            expect(buffer.numberOfChannels).toBe(2);
            expect(buffer.length).toBe(44100);
            expect(buffer.duration).toBe(1);
        });

        it('should create music track metadata', () => {
            const track = audioBufferFixtures.createMusicTrackMetadata(
                'track-1',
                'Test Track',
                180
            );
            expect(track.id).toBe('track-1');
            expect(track.name).toBe('Test Track');
            expect(track.duration).toBe(180);
        });

        it('should create playlist', () => {
            const playlist = audioBufferFixtures.createPlaylist(5);
            expect(playlist.tracks).toHaveLength(5);
        });
    });
});
