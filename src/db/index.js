const Sequelize = require("sequelize");
const { dbURL, environment } = require("../config/index");

const sequelize = new Sequelize(dbURL, {
  dialect: "postgres",
  ssl: true,
  logging: false,
});

module.exports = sequelize;