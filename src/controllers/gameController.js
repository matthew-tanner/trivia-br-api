const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize/lib/errors");
const { User, Game } = require("../models");
const { jwtSecret } = require("../config");
const crypto = require("crypto");

const respond = (io, socket) => {
  socket.on("creategame", async (data, callback) => {
    const gameId = crypto.randomBytes(6).toString("hex");
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
            score: 0,
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
          userId: userId,
          displayName: displayName,
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

      if (getGame) {
        const query = {
          where: {
            gameId: gameId,
          },
        };
        let newUserList = getGame.userList;
        newUserList.push({ userId: userId, displayName: displayName, score: 0 });

        const newData = {
          userList: newUserList,
        };
        const updateGame = await Game.update(newData, query);
        io.sockets.in(gameId).emit("joinedgame", {
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
        console.log("sending game start socket event");
        io.sockets.in(gameId).emit("gamestarted"),
        {
          gameId: gameId,
        };
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

  socket.on("endgame", async (data, callback) => {
    const { gameId } = data;

    try {
      const query = {
        where: {
          gameId: gameId,
        },
        returning: true,
        plain: true,
      };

      data = {
        isComplete: true,
      };

      await Game.update(data, query);
      io.sockets.in(gameId).emit("gamestopped");


    } catch (err) {
      console.log(err);
    }


  })

  socket.on("nextquestion", async (data, callback) => {
    const { gameId } = data;

    try {
      console.log(`next question for : ${gameId}`);
      const getGame = await Game.findOne({
        where: {
          gameId: gameId,
        },
      });
      io.sockets.in(gameId).emit("getnextquestion"),
      {
        gameId: gameId,
      };
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("questioncountdown", async (data) => {
    const {gameId} = data
    let counter = 15;
    const qCountDown = setInterval(()=>{
      io.sockets.in(gameId).emit("counter", counter);
      counter--
      if (counter === 0){
        io.sockets.emit("counter", counter);
        clearInterval(qCountDown);
      }
    }, 1000)
  })

  socket.on("correctanswer", async (data, callback) => {
    const { gameId, userId, score } = data;

    try {
      console.log(`updating score for ${userId} in room ${gameId}`);

      const getGame = await Game.findOne({
        where: {
          gameId: gameId,
        },
      });

      let users = getGame.userList;
      const playerIndex = users.findIndex((object) => object.userId == userId);
      users[playerIndex].score = score;

      const query = {
        where: {
          gameId: gameId,
        },
        returning: true,
        plain: true,
      };

      data = {
        userList: users,
      };

      await Game.update(data, query);
      io.sockets.in(gameId).emit("updateusers", {
        gameId: gameId,
        userList: getGame.userList,
      });
    } catch (err) {
      console.log(err);
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
