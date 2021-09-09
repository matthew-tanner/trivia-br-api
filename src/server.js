const express = require("express");
const socket = require("socket.io");

const app = new express();

app.use("/", (req, res) => res.status(200).send("test"));

const server = app.listen(3000, () => console.log("listening on 3000"));
const io = socket(server);

io.on("connection", (socket) => {
  console.log("socket connected", socket);
})