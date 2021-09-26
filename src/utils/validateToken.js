const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { jwtSecret } = require("../config");

const validateToken = async (token) => {
  try {
    payload = jwt.verify(token, jwtSecret);

    if (payload) {
      let getUser = await User.findOne({
        where: { id: payload.id },
      });
      if (getUser) {
        return getUser;
      }
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = validateToken;
