const express = require('express');
const router = express.Router();
const axios = require('axios');

// Route for text-based chat
router.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        const response = await axios.post('http://localhost:5000/chat', {
            message: userMessage
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error with chatbot');
    }
});

// Route for voice recognition
router.post('/listen', async (req, res) => {
    try {
        const response = await axios.post('http://localhost:5000/listen');
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error with speech recognition');
    }
});

module.exports = router;
