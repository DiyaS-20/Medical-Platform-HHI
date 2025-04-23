const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { db } = require("./firebase");
const authRoutes = require("./routes/auth");
const medicalFilesRoutes = require("./routes/medicalFiles");

const app = express();

// Load environment variables
dotenv.config();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Root route to verify if backend is running
app.get("/", (req, res) => {
  res.send("Welcome to the Medical Portal API!");
});

app.get("/status", (req, res) => {
  res.json({ message: "Server is up and running on port 5000!" });
});

// Authentication routes
app.use("/api", authRoutes);

// Medical files routes (upload and retrieve)
app.use("/api", medicalFilesRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
