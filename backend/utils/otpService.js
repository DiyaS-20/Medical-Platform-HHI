const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Import User model

// Generate a 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999);
}

// Generate a unique User ID
function generateUniqueId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array(3).fill().map(() => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  const numbers = crypto.randomInt(100000, 999999);
  return randomLetters + numbers;
}

// Send OTP via email
async function sendOtpEmail(email, otp) {
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
}

// Store OTP and User in MongoDB
async function storeOTP(email, otp) {
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 minutes
  let user = await User.findOne({ email });

  if (user) {
    user.otp = otp;
    user.otpExpiry = otpExpiry;
  } else {
    user = new User({ email, otp, otpExpiry, userId: generateUniqueId() });
  }

  await user.save();
}

// Verify OTP
async function verifyOTP(email, enteredOtp) {
  const user = await User.findOne({ email });

  if (!user) {
    return 'No user found for this email.';
  }

  if (user.otpExpiry < Date.now()) {
    return 'OTP expired.';
  }

  if (user.otp !== enteredOtp) {
    return 'Incorrect OTP.';
  }

  // OTP is valid, remove OTP fields
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return { message: 'OTP verified successfully', userId: user.userId };
}

module.exports = { generateOTP, storeOTP, verifyOTP, sendOtpEmail, generateUniqueId };
