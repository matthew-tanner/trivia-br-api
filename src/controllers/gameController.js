const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize/lib/errors");
const { UserModel } = require("../models");
const { jwtSecret } = require("../config");
const crypto = require("crypto");

const respond = (io, socket) => {
  socket.on("creategame", async (data, callback) => {
    const gameId = crypto.randomBytes(21).toString("hex");
    console.log(gameId);
    try {
      socket.join(gameId);
      console.log(`socket id ${socket.id} created and joined room ${gameId}`);
      rooms = Array.from(io.sockets.adapter.rooms);
      console.log(rooms.filter(room => !room[1].has(room[0])));
      callback({
        status: 1,
        gameId: gameId,
      })
    } catch (err) {
      console.log(`Error - ${err.original.detail}`);
      if (err instanceof UniqueConstraintError) {
        callback({
          status: 0,
          message: "email or display name in use",
        });
      }
      callback({
        status: 0,
        message: err,
      });
    }
    
  });

  socket.on("joingame", async (data, callback) => {
    const { gameId } = data;

    try {
      socket.join(gameId);
      console.log(`socket id ${socket.id} joined room ${gameId}`);
      io.sockets.in(gameId).emit("joinedgame", {gameId: gameId, playerId: socket.id});

    } catch (err) {
      callback({
        status: 0,
        message: err
      });
    }
  });
};

module.exports = {
  respond,
};
