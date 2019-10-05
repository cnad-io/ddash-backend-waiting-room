'use strict';

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var events = require('./models/events');
var roomController = require('./controllers/room');

module.exports = function (io) {
  io.on('connection', function (socket) {
    logger.info('New connection');
    socket.on(events.public.in.join, function (data) {
      var player = {
        playerId: data.nickname,
        socketId: socket.id,
        connected: true,
        nickname: data.nickname
      };
      roomController.join(player)
      .then(function () {
        socket.join('waiting');
        socket.emit(events.public.out.joinResponse, player);
        io.to('waiting').emit(events.public.out.playerJoined, player);
        return roomController.get();
      })
      .then(function (room) {
        io.to('waiting').emit(events.public.out.playersRoom, room.playerList);
        var maxPlayers = parseInt(process.env.MAX_WAITING_PLAYErS || '2', 10);
        logger.trace('Limit of players by room', maxPlayers);
        if (io.sockets.adapter.rooms.waiting.length >= maxPlayers) {
          io.to('waiting').emit(events.public.out.roomAssigned, room);
          roomController.clean();
        }
      })
      .catch(function () {
        socket.emit(events.public.out.news, {
          info: 'Your token is invalid'
        });
      });
    });
    socket.on(events.public.in.disconnect, function (data) {
      logger.info('Disconnection happened');
      logger.debug('Disconnection data', data);
      roomController.removeByDisconnection(socket.id);
    });
  });
};
