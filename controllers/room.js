"use strict";

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var Promise = require('bluebird');
var player = require('./player');
var uuidv1 = require('uuid/v1');
var states = require('../models/states');

var usersInRoom = [];

var get = function (id) {
  logger.info('Get room requested');
  logger.debug('Get room requested by id:', id);
  return new Promise(function (resolve) {
    if (id) {
      resolve({
        state: states.assigned,
        roomId: id,
        playerList: usersInRoom
      });
    } else {
      resolve({
        state: states.assigned,
        roomId: uuidv1(),
        playerList: usersInRoom
      });
    }
  });
};

var clean = function () {
  logger.info('Clean room requested');
  return new Promise(function (resolve) {
    usersInRoom = [];
    resolve();
  });
};

var join = function (data) {
  logger.info('User trying to join');
  logger.debug('Username thats trying to join:', data);
  return new Promise(function (resolve, reject) {
    var validate = player.validate(data.nickname);
    if (validate) {
      usersInRoom.push(data);
      logger.info('User joined');
      resolve(validate);
    } else {
      reject(validate);
    }
  });
};

var removeByDisconnection = function (id) {
  usersInRoom.forEach(function (value, index) {
    if (value.socketId === id) {
      usersInRoom.splice(index, 1);
    }
  });
};

module.exports = {
  join: join,
  clean: clean,
  get: get,
  removeByDisconnection: removeByDisconnection
};
