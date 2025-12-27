const mockSocket = {
    id: 'test-player-id',
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    connect: jest.fn(),
};

const mockIo = jest.fn(() => mockSocket);
mockIo.io = mockIo;
mockIo.connect = mockIo;
mockIo.Manager = jest.fn();
mockIo.Socket = jest.fn();

module.exports = mockIo;
