const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 8080;
const filePath = 'data.json';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

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

// API Endpoints
/*app.post('/login', (req, res) => {
    console.log('Received login attempt:', req.body);
    res.json({ message: 'Login received' });
});*/

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    res.status(401).json({ error: 'Invalid username or password' });
});
// API Endpoints
app.post('/login', (req, res) => {
    console.log('Received login attempt:', req.body);
    res.json({ message: 'Login received' });
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

// Add this route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Desktop/signInPageV1.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});