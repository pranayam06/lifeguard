const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 8080;
const filePath = './data.json';

// Middleware
app.use(cors());
app.use(express.json());

// File operations functions
function readData() {
    try {
        if (!fs.existsSync(filePath)) {
            writeData([]);
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading file:', error);
        return [];
    }
}

function writeData(newData) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
        console.log('Data written successfully');
    } catch (error) {
        console.error('Error writing file:', error);
    }
}

function addData(newEntry) {
    const data = readData();
    data.push(newEntry);
    writeData(data);
    return data;
}
// ... existing code ...

// Add a root route handler
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the API',
        endpoints: {
            'GET /data': 'Get all data',
            'POST /data': 'Add new data',
            'POST /login': 'Login endpoint'
        }
    });
});

// ... existing code ...

// API Endpoints
app.post('/login', (req, res) => {
    console.log('Received login attempt:', req.body);
    const { username, password } = req.body;

    const users = readData(); // Read user data from file
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.json({ message: 'Login successful', user: { username: user.username } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' }); // Return error if credentials are wrong
    }
});


// Add new endpoint to add data
app.post('/data', (req, res) => {
    try {
        const newData = req.body;
        const result = addData(newData);
        res.json({ message: 'Data added successfully', data: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add data' });
    }
});

// Add endpoint to get data
app.get('/data', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});