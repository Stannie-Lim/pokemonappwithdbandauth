const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
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

app.listen(3000);
