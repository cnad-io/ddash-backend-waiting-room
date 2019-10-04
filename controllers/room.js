"use strict";

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var Promise = require('bluebird');
var player = require('./player');
//var uuidv1 = require('uuid/v1');
//var states = require('../models/states');

var roomManagementClient = require('./room-management-client');

var tempRoomId = null;
//var usersInRoom = [];

var get = function () {
  logger.info('Get room requested');
  return new Promise(function (resolve) {
   if (tempRoomId){
    roomManagementClient.getUsersInRoom(tempRoomId).then(function (data){
      //usersInRoom = dataUsersInRoom;
      resolve(data);

    });
    } else {
      roomManagementClient.createRoom().then(function (data){

        tempRoomId= data.id;
        roomManagementClient.getUsersInRoom(tempRoomId).then(function (usersinroom){
          resolve(usersinroom);
        });

      });
    }
  });
};

var clean = function () {
  logger.info('Clean room requested');
  return new Promise(function (resolve) {
    //usersInRoom = [];
    tempRoomId = null;
    resolve();
  });
};

var join = function (data) {
  logger.info('User trying to join');
  logger.debug('Username thats trying to join:', data);
  return new Promise(function (resolve, reject) {
    var validate = player.validate(data.nickname);
    if (validate) {
      logger.info('validated');

      if (tempRoomId){
        logger.info('Adding user '+data.playerId+' to room');

        roomManagementClient.addUserToRoom(tempRoomId, data.playerId).then(function (){
          logger.info('User joined');
          resolve(validate);
        });
      } else {
        logger.info('tempRoomId is null');

        roomManagementClient.createRoom().then(function (createdRoom){
          tempRoomId= createdRoom.id;
          logger.info('Adding user '+data.playerId+' to room ' +  createdRoom.id);
          roomManagementClient.addUserToRoom(tempRoomId, data.playerId).then(function (){
            resolve();
          });

        });
      }
      //usersInRoom.push(data);

    } else {
      reject(validate);
    }
  });
};

var removeByDisconnection = function (id) {
  logger.info('User'+id+'Disconected');

  //usersInRoom.forEach(function (value, index) {
    //if (value.socketId === id) {
      //roomManagementClient.removeUserFromRoom(tempRoomId, id).then(function(){
      //  usersInRoom.splice(index, 1);
      //});

    //}
  //});
};

module.exports = {
  join: join,
  clean: clean,
  get: get,
  removeByDisconnection: removeByDisconnection
};
