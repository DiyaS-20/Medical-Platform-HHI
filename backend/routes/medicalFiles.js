const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt"); // For password hashing
const { db } = require("../firebase");

const router = express.Router();

// Multer setup for file uploads with dynamic destination
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { userId } = req.body;

    if (!userId) {
      return cb(new Error("User ID is required"));
    }

    const userFolder = path.join(__dirname, "..", "uploads", userId);
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Route for uploading medical files
router.post("/Uploadmedicalfiles", upload.single("file"), async (req, res) => {
  const { userId, password, hospital, department, doctor, description } = req.body;
  const file = req.file;

  if (!userId || !password || !hospital || !department || !doctor || !description || !file) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Save user credentials (if not already saved)
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      await userRef.set({ userId, password: hashedPassword });
    }

    // Save file details to Firebase
    await db.collection("medicalFiles").add({
      userId,
      hospital,
      department,
      doctor,
      description,
      filePath: file.path,
      uploadedAt: new Date(),
    });

    res.json({ message: "File uploaded successfully." });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Failed to upload file." });
  }
});

// Route for retrieving user files
router.post("/retrieveFiles", async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: "User ID and Password are required." });
  }

  try {
    // Verify user credentials
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(400).json({ message: "User not found." });
    }

    const userData = userDoc.data();
    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid password." });
    }

    // Retrieve files from the user's folder
    const userFolder = path.join(__dirname, "..", "uploads", userId);
    if (fs.existsSync(userFolder)) {
      const files = fs.readdirSync(userFolder);
      res.json({ files });
    } else {
      res.status(404).json({ message: "No files found for this user." });
    }
  } catch (error) {
    console.error("Error retrieving files:", error);
    res.status(500).json({ message: "Failed to retrieve files." });
  }
});

module.exports = router;
