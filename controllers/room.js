"use strict";

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var Promise = require('bluebird');
var player = require('./player');
//var uuidv1 = require('uuid/v1');
var states = require('../models/states');
var RestClient = require('node-rest-client').Client;

var roomManagementRestClient = new RestClient();
var roomManagement = process.env.ROOM_MANAGEMENT_URL || 'room-management'

/* eslint-disable no-template-curly-in-string */
roomManagementRestClient.registerMethod("getRoom", roomManagement+"/api/room/${roomId}", "GET");
roomManagementRestClient.registerMethod("createRoom", roomManagement+"/api/create", "POST");
roomManagementRestClient.registerMethod("addUserToRoom", roomManagement+"/api/room/${roomId}/addUser/${userId}", "PUT");
roomManagementRestClient.registerMethod("removeUserFromRoom", roomManagement+"/api/room/${roomId}/removeUser/${userId}", "DELETE");
roomManagementRestClient.registerMethod("getUsersInRoom", roomManagement+"/api/room/${roomId}/users", "GET");

var tempRoomId = null;
var usersInRoom = [];

var get = function () {
  logger.info('Get room requested');
  return new Promise(function (resolve) {
   if (tempRoomId){
      var argsGetusersInRoom = {
        path: { roomId: tempRoomId },
        parameters: { },
        headers: { },
        data: ""
      };
      roomManagementRestClient.methods.getUsersInRoom(argsGetusersInRoom, function (dataUsersInRoom) {

          usersInRoom = dataUsersInRoom;
          resolve({
            state: states.assigned,
            roomId: tempRoomId,
            playerList: usersInRoom
          });
      });
    } else {
      var argsCreateRoom = {
        path: { },
        parameters: { },
        headers: { },
        data: ""
      };
      roomManagementRestClient.methods.createRoom(argsCreateRoom, function (dataCreateRoom) {

        tempRoomId= dataCreateRoom.id;

        var argsGetusers = {
          path: { roomId: tempRoomId },
          parameters: { },
          headers: { },
          data: ""
        };
        roomManagementRestClient.methods.getUsersInRoom(argsGetusers, function (dataUsersInRoom) {
            usersInRoom = dataUsersInRoom;
            resolve({
              state: states.assigned,
              roomId: tempRoomId,
              playerList: usersInRoom
            });
        });
      });
    }
  });
};

var clean = function () {
  logger.info('Clean room requested');
  return new Promise(function (resolve) {
    usersInRoom = [];
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
      //usersInRoom.push(data);
      var argsAddUserToRoom = {
        path: { roomId: tempRoomId, userId: data.playerId },
        parameters: { },
        headers: { },
        data: ""
      };
      roomManagementRestClient.methods.addUserToRoom(argsAddUserToRoom, function () {
        logger.info('User joined');
        resolve(validate);
      });

    } else {
      reject(validate);
    }
  });
};

var removeByDisconnection = function (id) {
  usersInRoom.forEach(function (value, index) {
    if (value.socketId === id) {
      var argsRemoveUserFromRoom = {
        path: { roomId: tempRoomId, userId: id },
        parameters: { },
        headers: { },
        data: ""
      };
      roomManagementRestClient.methods.removeUserFromRoom(argsRemoveUserFromRoom, function () {
        usersInRoom.splice(index, 1);
      });
    }
  });
};

module.exports = {
  join: join,
  clean: clean,
  get: get,
  removeByDisconnection: removeByDisconnection
};
