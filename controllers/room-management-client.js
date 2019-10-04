
"use strict";

var logger = require('pino')({
  'level': process.env.LOG_LEVEL || 'info'
});

var Promise = require('bluebird');

var states = require('../models/states');
var Client = require('node-rest-client').Client;

var roomManagementRestClient = new Client();
var roomManagement = process.env.ROOM_MANAGEMENT_URL || 'http://room-management:8080'

/* eslint-disable no-template-curly-in-string */
roomManagementRestClient.registerMethod("getRoom", roomManagement+"/api/room/${roomId}", "GET");
roomManagementRestClient.registerMethod("createRoom", roomManagement+"/api/create", "POST");
roomManagementRestClient.registerMethod("addUserToRoom", roomManagement+"/api/room/${roomId}/addUser/${userId}", "PUT");
roomManagementRestClient.registerMethod("removeUserFromRoom", roomManagement+"/api/room/${roomId}/removeUser/${userId}", "DELETE");
roomManagementRestClient.registerMethod("getUsersInRoom", roomManagement+"/api/room/${roomId}/users", "GET");

var tempRoomId = null;
var usersInRoom = [];




var getRoom = function(id){

  return new Promise(function(){

  });


};


var createRoom = function(){
  return new Promise(function(resolve){
    var args = {
      path: { },
      parameters: { },
      headers: { },
      data: ""
    };
    roomManagementRestClient.methods.createRoom(args, function (dataCreateRoom) {
      resolve({id : dataCreateRoom.id });
    });
    
  });
};

var addUserToRoom = function(roomId,userId){

  return new Promise(function(resolve,reject){

    var args = {
      path: { roomId: roomId, userId: userId },
      parameters: { },
      headers: { },
      data: ""
    };
    roomManagementRestClient.methods.addUserToRoom(args, function () {
      logger.info('User joined');
      resolve();
    });
  });


};

var removeUserFromRoom = function(roomId,userId){

  return new Promise(function(resolve){
    var argsRemoveUserFromRoom = {
      path: { roomId: roomId, userId: userId },
      parameters: { },
      headers: { },
      data: ""
    };
    roomManagementRestClient.methods.removeUserFromRoom(argsRemoveUserFromRoom, function () {
      resolve();
    });
  });


};

var getUsersInRoom = function(id){

  return new Promise(function(resolve){
    var args = {
      path: { roomId: id },
      parameters: { },
      headers: { },
      data: ""
    };

    roomManagementRestClient.methods.getUsersInRoom(args, function (dataUsersInRoom) {
        //usersInRoom = dataUsersInRoom;
        resolve({
          state: states.assigned,
          roomId: id,
          playerList: dataUsersInRoom
        });
    });

  });


};





module.exports = {
  getRoom: getRoom,
  createRoom: createRoom,
  addUserToRoom: addUserToRoom,
  removeUserFromRoom: removeUserFromRoom,
  getUsersInRoom: getUsersInRoom
};
