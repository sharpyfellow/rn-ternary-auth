const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/User"); // Adjust the path as necessary

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/myapp")
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Registration endpoint
app.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();

    const token = jwt.sign({ userId: user._id }, "your_jwt_secret");
    res.status(201).send({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Internal server error");
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received:", { email, password }); // Log the request body

  const user = await User.findOne({ email });
  if (!user) {
    console.log("User not found");
    return res.status(400).send("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    console.log("Invalid password");
    return res.status(400).send("Invalid credentials");
  }

  const token = jwt.sign({ userId: user._id }, "your_jwt_secret");
  res.send({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).send("Access denied");
  }
  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).send("Invalid token");
  }
};

// Get user profile

app.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId);
  res.send({ id: user._id, name: user.name, email: user.email });
});

// Other routes and middleware

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
