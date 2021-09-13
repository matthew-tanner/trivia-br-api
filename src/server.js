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
//app.use("/user", controllers.UserController);

dbConn
  .authenticate()
  .then(() => dbConn.sync())
  .then(() => {
    console.log(`connected to database ${dbName}`);
    const server = app.listen(appPort, () => console.log(`Server running on ${appPort}...`));

    const io = socket(server, {
      transports: ["polling"],
      cors: {
        cors: {
          origin: "*",
        },
      },
    });
    
    io.on("connection", (socket) => {
      console.log(`New connection : ${socket.id}`);

      controllers.UserController.respond(socket);
    
      socket.on("disconnect", () => {
        console.log(`socket ${socket.id} disconnected.`);
        socket.broadcast.emit("logoff", `user: ${socket.id} disconnected`);
      });
    });
  })
  .catch((err) => {
    console.log(`${err}`);
  });