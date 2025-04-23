const express = require('express');
const router = express.Router();
const cors = require('cors'); // Import CORS
const { db } = require('../firebase'); // Firestore initialization
const { fetchBlockchainLogs } = require('../../blockchain/blockchainUtils'); // Blockchain utility function

// Use CORS middleware
router.use(cors()); // Enable CORS for this route file

/**
 * Fetch user details by userId
 * Endpoint: GET /api/users/:userId
 */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});

/**
 * Create a new user
 * Endpoint: POST /api/users
 */
router.post('/', async (req, res) => {
  const { userId, name, email, password } = req.body;

  if (!userId || !name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    await db.collection('users').doc(userId).set({
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    });

    res.json({ message: 'User created successfully.' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user.' });
  }
});

/**
 * Update user details
 * Endpoint: PUT /api/users/:userId
 */
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const updates = req.body; // Expect updated fields in request body

  try {
    const userDoc = db.collection('users').doc(userId);

    const existingUser = await userDoc.get();
    if (!existingUser.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userDoc.update(updates);
    res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user.' });
  }
});

/**
 * Delete user
 * Endpoint: DELETE /api/users/:userId
 */
router.delete('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const userDoc = db.collection('users').doc(userId);

    const existingUser = await userDoc.get();
    if (!existingUser.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    await userDoc.delete();
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

/**
 * Fetch access logs for a user from blockchain
 * Endpoint: GET /api/users/:userId/logs
 */
router.get('/:userId/logs', async (req, res) => {
  const { userId } = req.params;

  try {
    const logs = await fetchBlockchainLogs(userId);
    res.status(200).json({ logs });
  } catch (error) {
    console.error('Error fetching logs from blockchain:', error);
    res.status(500).json({ message: 'Failed to fetch access logs.' });
  }
});

module.exports = router;