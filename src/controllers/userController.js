const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize/lib/errors");
const { UserModel } = require("../models");
const { jwtSecret } = require("../config");

const respond = (socket) => {
  socket.on("register", async (data, callback) => {
    const { email, password, displayName } = data;

    try {
      const hashed = bcrypt.hashSync(password, 12);

      const createUser = await UserModel.create({
        emailAddress: email,
        passwordHash: hashed,
        displayName: displayName,
      });
      callback({
        email: createUser.emailAddress,
        displayName: createUser.displayName,
      });
    } catch (err) {
      console.log(`Error - ${err.original.detail}`);
      if (err instanceof UniqueConstraintError) {
        callback({
          status: "email or display name in use",
        });
      }
      callback({
        status: err,
      });
    }
  });

  socket.on("login", async (data, callback) => {
    const { email, password } = data;

    try {
      const getUser = await UserModel.findOne({
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
            email: getUser.emailAddress,
            displayName: getUser.displayName,
            sessionToken: newToken,
          });
        }
      } else {
        callback({
          status: "Unauthorized",
        });
      }
    } catch (err) {
      callback({
        status: err,
      });
    }
  });

  socket.on("userInfo", async (data, callback) => {
    const { displayName } = data;

    try {
      const getUser = await UserModel.findOne({
        where: {
          displayName: displayName,
        },
      });

      if (getUser) {
        callback({
          displayName: getUser.displayName,
        });
      } else {
        callback({
          status: "User not found...",
        });
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
