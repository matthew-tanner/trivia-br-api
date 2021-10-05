const jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize/lib/errors");
const { User, Game } = require("../models");
const { jwtSecret } = require("../config");
const { Op } = require("sequelize");
const validateToken = require("../utils/validateToken");

const respond = (io, socket) => {
  socket.on("admingamedata", async (data, callback) => {
    const { token, userId } = data;

    try {
      if (token) {
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        const now = new Date();
        const validateUser = await validateToken(token);

        if (validateUser) {
          const getGames = await Game.findAll({
            where: {
              isComplete: true,
              createdAt: {
                [Op.gt]: startOfDay,
                [Op.lt]: now
              }
            }
          })

          callback({
            status: 1,
            displayName: validateUser.displayName,
            userId: validateUser.id,
            games: getGames
          });
        } else {
          callback({
            status: 0,
            message: "invalid token"
          });
        }
      } else {
        callback({
          status: 0,
          message: "no token",
          displayName: "",
          userId: 0
        })
      }
    } catch (err) {
      callback({
        status: err,
      });
    }
  });
};

module.exports = {
  respond,
};
