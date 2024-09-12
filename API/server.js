const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config(); // Load environment variables

const { addUser, removeUser, updateUser, getUsers } = require('./controllers/users'); // Importing user functions

const server = express();

server.use(helmet());
server.use(cors());
server.use(express.json());
server.use(express.static('public')); // Serve static files from 'public' directory

// Basic route for the homepage
server.get('/', (req, res) => {
  res.send('<h1>🚀</h1>');
});

// Test route for "/api/search"
server.get('/api/search', (req, res) => {
    try {
        res.status(200).json({ message: "Hello World" });
    } catch (error) {
        console.error("Server error:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to add a new user
server.post('/api/users', (req, res) => {
    const { name, rateOfPay } = req.body;

    if (!name || !rateOfPay) {
        return res.status(400).json({ message: "Name and rate of pay are required" });
    }

    const newUser = addUser(name, rateOfPay);
    return res.status(201).json({ message: "User added", user: newUser });
});

// Route to get all users
server.get('/api/users', (req, res) => {
    const users = getUsers();
    return res.status(200).json(users);
});

// Route to remove a user by ID
server.delete('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const removedUser = removeUser(id);

    if (removedUser) {
        return res.status(200).json({ message: "User removed", user: removedUser });
    } else {
        return res.status(404).json({ message: "User not found" });
    }
});

// Route to update a user by ID
server.put('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;

    const updatedUser = updateUser(id, updates);

    if (updatedUser) {
        return res.status(200).json({ message: "User updated", user: updatedUser });
    } else {
        return res.status(404).json({ message: "User not found" });
    }
});

// General error-handling middleware
server.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`\n--> BizPay is running on port ${port} <--\n`);
});

module.exports = server; // Export the server instance