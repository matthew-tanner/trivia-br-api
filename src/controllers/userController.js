const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize/lib/errors");
const { User } = require("../models");
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
        isAdmin: false
      });
      console.log(createUser)
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
          });
        }
      } else {
        callback({
          status: 0,
          message: "Unauthorized"
        });
      }
    } catch (err) {
      callback({
        status: 0,
        message: err
      });
    }
  });

  socket.on("userinfo", async (data, callback) => {
    const { token } = data;
    console.log(data)

    try {
      const validateUser = await validateToken(token);
      
      if (validateUser) {
        callback({
          status: 1,
          displayName: validateUser.displayName,
          userId: validateUser.id
        });
      } else {
        callback({
          status: 0,
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
