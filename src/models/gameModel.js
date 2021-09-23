module.exports = (sequelize, DataTypes) => {
  const Game = sequelize.define("game", {
    gameId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
