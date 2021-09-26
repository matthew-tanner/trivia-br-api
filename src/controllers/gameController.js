const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize/lib/errors");
const { User, Game } = require("../models");
const { jwtSecret } = require("../config");
const crypto = require("crypto");

const respond = (io, socket) => {
  socket.on("creategame", async (data, callback) => {
    const gameId = crypto.randomBytes(21).toString("hex");
    console.log(gameId);
    const { userId, questions } = data;
    let storeQuestions = [];
    questions.map((q) => {
      storeQuestions.push({question: q.question, type: q.type, answer: q.correct_answer, answers: [q.incorrect_answers]})
    })
    try {
      socket.join(gameId);
      console.log(`socket id ${socket.id} created and joined room ${gameId}`);
      //console.log(storeQuestions);

      const createGame = await Game.create(
        {gameId: gameId,
        hostId: userId,
        userList: [{
          userId: userId,
        }],
        isComplete: false,
        questions: storeQuestions,}
      )
      if(createGame){
        callback({
          status: 1,
          gameId: gameId,
        })
      }else{
        callback({
          status: 0,
          message: "error...",
        });
      }
    } catch (err) {
      console.log(`Error - ${err}`);
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
    const { gameId, displayName } = data;

    try {
      socket.join(gameId);
      console.log(`player [${displayName}] - socket id ${socket.id} joined room ${gameId}`);
      const getGame = Game.findOne({
        where: {
          gameId: gameId
        }
      })

      if(getGame){
        io.sockets.in(gameId).emit("joinedgame", {gameId: gameId, playerId: socket.id, displayName: displayName, userList: getGame.userList});
        callback({
          status: 1,
          gameId: gameId,
          userList: getGame.userList,
          displayName: displayName,
          socketId: socket.id
        })
      }
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
