/* eslint-disable */
'use strict';

var io = require('socket.io');
var events = require('../models/events');
var ioClient = require('socket.io-client');
var expect = require('chai').expect;

var options ={
  transports: ['websocket'],
  'force new connection': true
};

var server;

before(function () {
  server = io(require('http').createServer()).listen('5000');
  require('../socket')(server);
});

after(function () {
  server.close();
});

describe('Waiting Room', function () {
  describe('When a user is joined', function () {
    it('Should respond information of the joined user', function (done) {
      var client = ioClient.connect(
        process.env.WS_SERVER_HOST || 'http://localhost:5000',
        options
      );

      client.on('connect', function() {
        client.emit(events.public.in.join, {
          nickname: 'playerJoined'
        });
      });

      client.on(events.public.out.playerJoined, function (data) {
        expect(data).to.not.be.null;
        expect(data).to.have.property('playerId');
        expect(data).to.have.property('socketId');
        expect(data).to.have.property('connected').equal(true);
        expect(data).to.have.property('nickname').equal('playerJoined');
        done();
        client.disconnect();
      });
    });

    it('Should emit a list of the players in room', function (done) {
      var client = ioClient.connect(
        process.env.WS_SERVER_HOST || 'http://localhost:5000',
        options
      );

      client.on('connect', function() {
        client.emit(events.public.in.join, {
          nickname: 'playersInRoom'
        });
      });

      client.on(events.public.out.playersRoom, function (data) {
        expect(data).to.not.be.null;
        expect(data.length).to.be.equal(1);
        expect(data[0]).to.has.property('nickname').equal('playersInRoom');
        done();
        client.disconnect();
      });
    });
  });

  describe('When the waiting room has the limit of players (Testing with 2)', function () {
    it('Should emit to the assigned players their game room information', function (done) {
      process.env.MAX_WAITING_PLAYES = '2';

      var client1 = ioClient.connect(
        process.env.WS_SERVER_HOST || 'http://localhost:5000',
        options
      );

      client1.on('connect', function() {
        client1.emit(events.public.in.join, {
          nickname: 'player1'
        });
      });

      var client2 = ioClient.connect(
        process.env.WS_SERVER_HOST || 'http://localhost:5000',
        options
      );

      client2.on('connect', function() {
        client2.emit(events.public.in.join, {
          nickname: 'player2'
        });
      });

      client1.on(events.public.out.roomAssigned, function (data) {
        expect(data).to.not.be.null;
        expect(data).to.has.property('state').equal('Assigned');
        expect(data).to.has.property('roomId');
        expect(data).to.has.property('playerList');
        expect(data.playerList.length).to.be.equal(2);
        done();
        client1.disconnect();
        client2.disconnect();
      });
    });
  });
});
