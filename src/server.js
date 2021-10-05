const express = require("express");
const socket = require("socket.io");
const cors = require("cors");

const { appPort, dbName } = require("./config/index");
const controllers = require("./controllers");
const dbConn = require("./db/index");

const app = new express();

app.use(express.json());
app.use(cors());
app.get("/", (req, res) => res.status(200).send("ping"));

dbConn
  .authenticate()
  .then(() => dbConn.sync())
  .then(() => {
    console.log(`connected to database ${dbName}`);
    const server = app.listen(appPort, () => console.log(`Server running on ${appPort}...`));

    const io = socket(server, {
      transports: ["websocket", "polling"],
      log: true,
      cors: {
        cors: {
          origin: "*",
        },
      },
    });
    
    io.on("connection", (socket) => {
      console.log(`New connection : ${socket.id}`);
      rooms = Array.from(io.sockets.adapter.rooms);

      controllers.UserController.respond(io, socket);
      controllers.GameController.respond(io, socket);
      controllers.AdminController.respond(io, socket);
    
      socket.on("disconnect", () => {
        console.log(`socket ${socket.id} disconnected.`);
        socket.broadcast.emit("logoff", `user: ${socket.id} disconnected`);
      });
    });
  })
  .catch((err) => {
    console.log(`${err}`);
  });