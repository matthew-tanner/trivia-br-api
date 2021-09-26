module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define("game", {
    gameId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    hostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userList: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    isComplete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    questions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  });
  return Game;
};
