const express = require('express');
const { generateOTP, storeOTP, sendOtpEmail, verifyOTP } = require('../utils/otpService');
const router = express.Router();

// Endpoint to send OTP
router.post('/sendOtp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send('Email is required.');
  }

  const otp = generateOTP();
  try {
    await storeOTP(email, otp); // Save OTP in MongoDB
    await sendOtpEmail(email, otp);
    res.status(200).send('OTP sent successfully.');
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send('Failed to send OTP.');
  }
});

// Endpoint to verify OTP
router.post('/verifyOtp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).send('Email and OTP are required.');
  }

  try {
    const result = await verifyOTP(email, otp);
    if (result.message === 'OTP verified successfully') {
      res.status(200).json(result); // Return userId on success
    } else {
      res.status(400).send(result);
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send('Internal server error.');
  }
});

module.exports = router;