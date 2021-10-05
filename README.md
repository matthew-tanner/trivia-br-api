# Yet Another Trivia Game - API

This server API is written in NodeJS utilizing SOCKET.IO websockets. The front end associated with this project can be found at https://github.com/matthew-tanner/trivia-br-frontend

## Configuration
Utilize the .env-template for for configuring the local .env that is required for the api to function.

## Startup
 - hot reloading ```npx nodemon```
 - base startup ```npm run start```

## Routes
"/" is the only main route for this api. All other integrations and endpoints are handled directly through socket events.

## Package List
- bcrypt
- cors
- dotenv
- express
- jsonwebtoken
- nodemon
- pg
- pg-hstore
- sequelize
- socket.io
