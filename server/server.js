const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const socketio = require("socket.io");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/auth/register", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.users.findUnique({
      where: {
        username,
      },
    });

    if (user) {
      return res.status(409).send({ message: "User already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await prisma.users.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(newUser, process.env.JWT_SECRET_KEY);

    res.send(token);
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.users.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return res.status(409).send({ message: "User does not exist" });
    }

    const isCorrectPassword = bcrypt.compareSync(password, user.password);

    // successfully logged in!
    if (isCorrectPassword) {
      const token = jwt.sign(user, process.env.JWT_SECRET_KEY);

      res.send(token);
    } else {
      res.status(401).send({ message: "Incorrect password" });
    }
  } catch (error) {
    next(error);
  }
});

app.post("/api/user/catch_pokemon", async (req, res, next) => {
  const { pokemon } = req.body;
  const token = req.headers.authorization;

  const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const newPokemon = await prisma.pokemon.create({
    data: {
      name: pokemon,
      user: {
        connect: { id: user.id },
      },
    },
  });

  const ownedPokemon = await prisma.pokemon.findMany({
    where: {
      ownerId: user.id,
    },
  });

  res.status(201).send(ownedPokemon);
});

app.get("/api/user/my_pokemon", async (req, res, next) => {
  const token = req.headers.authorization;

  const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

  try {
    const ownedPokemon = await prisma.pokemon.findMany({
      where: {
        ownerId: user.id,
      },
    });

    res.send(ownedPokemon);
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", async (req, res, next) => {
  // you will need the authorization token
  // it transforms that token to the user's data
  // and sends it back to the client
  const token = req.headers.authorization;

  // 2 args
  // 1. the token
  // 2. the same secret key that you used before
  const user = jwt.verify(token, process.env.JWT_SECRET_KEY);

  res.send(user);
});

// app.listen returns the server that you just created
// we use this server to create a socketio server
const server = app.listen(3000);

const io = new socketio.Server(server, {
  cors: {
    // only accept socket requests from localhost:5173
    origin: "http://localhost:5173",
  },
});

let loggedInUsers = [];
const allMessages = [];

io.on("connection", (socket) => {
  io.to(socket.id).emit("receive_message", allMessages);

  socket.on("user_joined", (user) => {
    loggedInUsers.push({ socketId: socket.id, user });

    io.emit("all_users", loggedInUsers);
  });

  socket.on("disconnect", () => {
    // disconnect means like when user logs out, or disconnects from the socket server
    // this is why refreshing browser counts as a "disconnect"

    loggedInUsers = loggedInUsers.filter((user) => user.socketId !== socket.id);

    io.emit("all_users", loggedInUsers);
  });

  /*
  socket.emit("send_message", {
      fromUser: user.id,
      toUser: selectedUserToChatWith.user.id,
      message,
    });*/

  socket.on("send_message", ({ fromUser, toUser, message }) => {
    allMessages.push({ fromUser, toUser, message });

    // we want to send this message ONLY to the toUser
    // we need their socketId
    // how do we get their socketId?

    // these 3 sections just sends the message to the people that should be receiving it
    // aka the receiver
    // and the sender

    // just finds the socket Id of the receiving user
    const toUserSocketId = loggedInUsers.find(
      (user) => user.user.id === toUser
    ).socketId;

    // sends alls messages to the receiving user
    io.to(toUserSocketId).emit("receive_message", allMessages);

    // sends all messages to sending user
    io.to(socket.id).emit("receive_message", allMessages);
  });
});
