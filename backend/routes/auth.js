const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { db } = require('../firebase'); // Import Firestore instance
const cors = require('cors'); // Importing CORS
const { logBlockchainEvent } = require('../../blockchain/blockchainUtils');

let otpStore = {}; // Store OTPs temporarily in memory

// Applying CORS to this route file
router.use(cors()); // Enable CORS for all routes in this file

// Function to generate OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

// Function to generate a unique User ID (e.g., ABC123456)
const generateUniqueId = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = Math.floor(100000 + Math.random() * 900000);
  const randomLetters = Array(3).fill().map(() => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  return randomLetters + numbers;
};

// Route to generate and return a unique user ID
router.get('/getUniqueId', (req, res) => {
  try {
    const userId = generateUniqueId(); // Generate a unique ID
    res.json({ uniqueId: userId }); // Respond with the generated ID
  } catch (error) {
    console.error('Error generating unique ID:', error);
    res.status(500).json({ message: 'Failed to generate unique ID.' });
  }
});

// Function to send OTP to email
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
  };

  await transporter.sendMail(mailOptions);
};

// Route for sending OTP
router.post('/sendOtp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const otp = generateOtp();
  otpStore[email] = { otp, expiresAt: Date.now() + 300000 }; // OTP valid for 5 minutes

  try {
    await sendOtpEmail(email, otp);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Route for verifying OTP
router.post('/verifyOtp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  const otpEntry = otpStore[email];
  if (!otpEntry || otpEntry.otp !== parseInt(otp) || otpEntry.expiresAt < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  delete otpStore[email];

  const userId = generateUniqueId(); // Generate a unique ID
  res.json({ message: 'OTP verified successfully', userId });
});

// Route for registering user
router.post('/registerUser', async (req, res) => {
  const { name, email, password, userId } = req.body;

  if (!name || !email || !password || !userId) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Save user to Firestore without password hashing
    const userRef = db.collection('users').doc(userId); // Use userID as document ID
    await userRef.set({
      email,
      name,
      password, // Storing password as is
      userId,
    });

    console.log(`User registered: ${userId}, Email: ${email}, Password: "${password}"`);
    res.json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Failed to register user.' });
  }
});

// Route for verifying user login and logging access to blockchain
router.post('/login', async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: 'User ID and Password are required.' });
  }

  try {
    // Query Firestore to find the user by userId
    const userSnapshot = await db.collection('users').doc(userId).get();

    // If no user found with this userId
    if (!userSnapshot.exists) {
      return res.status(400).json({ message: 'Invalid User ID.' });
    }

    // If user is found, retrieve the user data
    const user = userSnapshot.data();

    // Debug logging
    console.log(`Attempting login for userId: ${userId}`);
    console.log(`Stored password in DB: "${user.password}"`);
    console.log(`Entered password: "${password}"`);

    // Plain text password comparison
    if (user.password !== password) {
      console.warn(`Password mismatch for userId: ${userId}`);
      return res.status(400).json({ message: 'Invalid Password.' });
    }

    // Log user login access to the blockchain
    try {
      await logBlockchainEvent(userId, 'Login', `User logged in successfully at ${new Date().toISOString()}`);
    } catch (blockchainError) {
      console.error('Error logging to blockchain:', blockchainError);
      return res.status(500).json({ message: 'Login successful, but failed to log access on the blockchain.' });
    }

    console.log(`Login successful for userId: ${userId}`);
    res.status(200).json({ message: 'Login successful!', userId });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

module.exports = router;
