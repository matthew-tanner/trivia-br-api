require("dotenv").config();

const config = {
  appPort: parseInt(process.env.PORT),
  dbName: process.env.DB_NAME,
  dbURL: `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${parseInt(
    process.env.DB_PORT
  )}/${process.env.DB_NAME}`,
  environment: process.env.ENVIRONMENT,
  jwtSecret: process.env.JWT_SECRET
};

module.exports = config;