const sequelize = require("../db/index");
const {DataTypes} = require("sequelize");

const User = require("./userModel")(sequelize, DataTypes);
const Game = require("./gameModel")(sequelize, DataTypes);

User.belongsToMany(Game, {
  through: "UserGames"
});

Game.belongsToMany(User, {
  through: "UserGames"
})

module.exports = {
  User, Game
};