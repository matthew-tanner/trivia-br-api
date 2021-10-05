const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize/lib/errors");
const { User, Game } = require("../models");
const { jwtSecret } = require("../config");
const validateToken = require("../utils/validateToken");

const respond = (io, socket) => {
  socket.on("register", async (data, callback) => {
    const { email, password, displayName } = data;

    try {
      const hashed = bcrypt.hashSync(password, 12);

      const createUser = await User.create({
        emailAddress: email,
        passwordHash: hashed,
        displayName: displayName,
        isAdmin: false,
      });
      callback({
        status: 1,
        message: "success",
        email: createUser.emailAddress,
        displayName: createUser.displayName,
      });
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

  socket.on("login", async (data, callback) => {
    const { email, password } = data;

    try {
      const getUser = await User.findOne({
        where: {
          emailAddress: email,
        },
      });

      if (getUser) {
        const confirmPwd = bcrypt.compare(password, getUser.passwordHash);
        if (confirmPwd) {
          const newToken = jwt.sign({ id: getUser.id }, jwtSecret, {
            expiresIn: "24h",
          });
          console.log(`logged in user - ${getUser.emailAddress}`);
          callback({
            status: 1,
            userId: getUser.id,
            email: getUser.emailAddress,
            displayName: getUser.displayName,
            sessionToken: newToken,
            isAdmin: getUser.isAdmin,
          });
        }
      } else {
        callback({
          status: 0,
          message: "Unauthorized",
        });
      }
    } catch (err) {
      callback({
        status: 0,
        message: err,
      });
    }
  });

  socket.on("userinfo", async (data, callback) => {
    const { token } = data;

    try {
      if (token) {
        const validateUser = await validateToken(token);

        if (validateUser) {
          callback({
            status: 1,
            displayName: validateUser.displayName,
            userId: validateUser.id,
            isAdmin: validateUser.isAdmin
          });
        } else {
          callback({
            status: 0,
            message: "invalid token"
          });
        }
      }else{
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

  socket.on("usergamedata", async (data, callback) => {
    const { token, userId } = data;

    try {
      if (token) {
        const validateUser = await validateToken(token);
        if (validateUser) {
          const getGames = await Game.findAll({
            where: {
              hostId: userId,
              isComplete: true,
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
