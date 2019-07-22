"use strict";

module.exports = {
  public: {
    in: {
      join: "join",
      disconnect: "disconnect"
    },
    out: {
      playersRoom: "players in room",
      disconnected: "disconnected",
      news: "news",
      joinResponse: "join response",
      roomAssigned: "room assigned",
      playerJoined: "player joined"
    }
  },
  server: {
    out: {
      createRoom: "createRoom",
      disconnect: "disconnect"
    },
    in: {
      newRoom: "newroom"
    }
  }
};
