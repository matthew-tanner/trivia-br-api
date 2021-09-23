module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  });
  return User;
};
