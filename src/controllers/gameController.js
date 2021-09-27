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
    const { userId, displayName, questions } = data;
    let storeQuestions = [];
    questions.map((q) => {
      storeQuestions.push({
        question: q.question,
        type: q.type,
        answer: q.correct_answer,
        answers: [q.incorrect_answers],
      });
    });
    try {
      socket.join(gameId);
      console.log(`socket id ${socket.id} created and joined room ${gameId}`);

      const createGame = await Game.create({
        gameId: gameId,
        hostId: userId,
        userList: [
          {
            userId: userId,
            displayName: displayName,
          },
        ],
        isComplete: false,
        questions: storeQuestions,
      });
      if (createGame) {
        callback({
          status: 1,
          gameId: gameId,
          hostId: createGame.hostId,
        });
      } else {
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
        message: "something happened",
      });
    }
  });

  socket.on("joingame", async (data, callback) => {
    const { gameId, userId, displayName } = data;

    try {
      socket.join(gameId);
      console.log(`player [${displayName}] - socket id ${socket.id} joined room ${gameId}`);
      const getGame = await Game.findOne({
        where: {
          gameId: gameId,
        },
      });
      console.log(getGame.gameId, getGame.userList)

      if (getGame) {
        console.log("game found...")
        const query = {
          where: {
            gameId: gameId
          }
        }
        let newUserList = getGame.userList;
        newUserList.push({ userId: userId, displayName: displayName });
        console.log(newUserList);

        const newData = {
          userList: newUserList
        }
        console.log(newData)
        const updateGame = await Game.update(newData, query);
        console.log(updateGame);
        io.sockets
          .in(gameId)
          .emit("joinedgame", {
            gameId: gameId,
            playerId: socket.id,
            displayName: displayName,
            userList: updateGame.userList,
          });
        callback({
          status: 1,
          gameId: gameId,
          userList: updateGame.userList,
          hostId: updateGame.hostId,
          displayName: displayName,
          socketId: socket.id,
        });
      }
    } catch (err) {
      callback({
        status: 0,
        message: err,
      });
    }
  });

  socket.on("startgame", async (data, callback) => {
    const { gameId } = data;

    try {
      const getGame = await Game.findOne({
        where: {
          gameId: gameId,
        },
      });

      if (getGame) {
        io.sockets
          .in(gameId)
          .emit("gamestarted"), {
            gameId: gameId
          }
        callback({
          status: 1,
          gameId: getGame.gameId,
          userList: getGame.userList,
          questions: getGame.questions,
          hostId: getGame.hostId,
        });
      }
    } catch (err) {
      callback({
        status: 0,
        message: "err",
      });
    }
  });

  socket.on("nextquestion", async (data, callback) => {
    const { gameId } = data;

    try {
      console.log(`next question for : ${gameId}`)
      io.sockets
        .in(gameId)
        .emit("getnextquestion"), {
          gameId: gameId
        }
    } catch (err) {
      console.log(err)
    }
  });

  socket.on("getgameinfo", async (data, callback) => {
    const { gameId } = data;

    try {
      const getGame = await Game.findOne({
        where: {
          gameId: gameId,
        },
      });

      if (getGame) {
        console.log(getGame.gameId, getGame.userList)
        callback({
          status: 1,
          gameId: getGame.gameId,
          userList: getGame.userList,
          questions: getGame.questions,
          hostId: getGame.hostId,
        });
      }
    } catch (err) {
      callback({
        status: 0,
        message: "err",
      });
    }
  });
};

module.exports = {
  respond,
};
