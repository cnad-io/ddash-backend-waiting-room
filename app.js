'use strict';

var app = require('http').createServer();
var io = require('socket.io')(app);
var ioOut = require('socket.io-client');
var redis = require('socket.io-redis');
var logger = require('pino')({ 'level': process.env.LOG_LEVEL || 'info' });

var events = require('./models/events');
var states = require('./models/states');
var roomController = require('./controllers/room');

// TODO: Reemplazar despues por administración de usuarios
var usersInRoom = [];

logger.info('Starting server with port 8080.');
app.listen(8080);

if (process.env.REDIS_ADAPTER_URL) {
  logger.info('Integrating with Redis.');
  var redisConnection = {
    host: process.env.REDIS_ADAPTER_URL || 'redis-waiting-room',
    port: 6379
  };
  logger.debug('Redis configuration.', redisConnection);
  io.adapter(redis(redisConnection));
}

logger.info('Setting acepted origins.');
io.origins('*:*');

var updateRoom = function () {
  var room = io.sockets.adapter.rooms.waiting;
  logger.debug('Players in room', usersInRoom);
  io.to('waiting')
  .emit(
    events.public.out.playersRoom,
    usersInRoom
  );
  var maxPlayers = process.env.MAX_PLAYER_PER_ROOM || '4';
  if (!room) {
    return;
  }
  if (room.length === parseInt(maxPlayers, 0)) {
    io.to('waiting')
    .emit(events.public.out.news, {
      info: 'creando game-room'
    });
    adminSocket.emit(events.server.out.createRoom, {});
  }
  logger.info('Player(s) in room' + room.length);

  io.to('waiting')
  .emit(
    events.public.out.news,
    {
      info: maxPlayers - room.length + " player(s) remaining to assign a game room."
    }
  );
};

io.on('connection', function (socket) {
  logger.info('Connection stated.');
  socket.emit(events.public.out.news, { info: 'welcome to wsao' });
  logger.info('Configure join event.');
  socket.on(events.public.in.join, function (data) {
    var joinInput = data
    if (typeof data != 'object') {
      joinInput = JSON.parse(data);
    }
    roomController.on.join(joinInput).then(function () {
      socket.join('waiting');
      socket.emit(events.public.out.joinResponse,
        { playerId: socket.id, nickname: data.nickname });
        logger.info('Player joined.');
      usersInRoom.push({ playerId: socket.id, nickname: data.nickname });
      io.to('waiting')
        .emit(events.public.out.playerJoined, data.nickname);
      updateRoom();
    })
    .catch(function () {
      socket.emit(events.public.out.news, { info: 'Your token is invalid' });
    });
  });
  logger.info('Configure disconnect event.');
  socket.on(events.public.in.disconnect, function () {
    updateRoom();
  });
});

logger.info('Starting admin socket.');
var adminURL = process.env.ADMIN_URL || 'http://game-room-internal:8081';
logger.info('Admin socket URL.', adminURL);
var adminSocket = ioOut(adminURL);

adminSocket.on(events.server.in.newRoom, function (data) {
  logger.info('New room requested.');
  logger.debug('New room requested data.', data);
  var response =  { state: states.assigned , roomId: data.roomId, playerList: usersInRoom };
  io.to('waiting').emit(events.public.out.roomAssigned, response);
  io.to('waiting').emit(events.public.out.news, {
    info: 'game-room: ' + data.roomId
  });
  usersInRoom = [];
});
