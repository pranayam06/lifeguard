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

// Add function to handle petition signatures
function addPetitionSignature(userId, petitionId) {
    const data = readData();
    const user = data.find(u => u.username === userId);
    
    if (user) {
        if (!user.signedPetitions) {
            user.signedPetitions = [];
        }
        if (!user.signedPetitions.includes(petitionId)) {
            user.signedPetitions.push(petitionId);
            writeData(data);
        }
        return user.signedPetitions;
    }
    return null;
}

// Update root route to include new endpoints
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the API',
        endpoints: {
            'GET /data': 'Get all data',
            'POST /data': 'Add new data',
            'POST /login': 'Login endpoint',
            'GET /petitions': 'Get available petitions',
            'POST /petitions/sign': 'Sign a petition',
            'GET /petitions/user/:username': 'Get user\'s signed petitions'
        }
    });
});

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

// Add endpoint to get available petitions
app.get('/petitions', (req, res) => {
    try {
        const petitions = [
            { 
                id: 1, 
                title: "Protect Trans Healthcare Access in Schools",
                description: "Support legislation ensuring transgender students have access to appropriate healthcare in educational settings.",
                url: "https://www.aclu.org/petition/protect-trans-youth-healthcare"
            },
            { 
                id: 2, 
                title: "Support Gender-Affirming Care Coverage",
                description: "Advocate for insurance coverage of essential gender-affirming medical procedures and treatments.",
                url: "https://www.hrc.org/campaigns/insurance-coverage"
            },
            { 
                id: 3, 
                title: "Trans Rights in Sports",
                description: "Support inclusive policies for transgender athletes in school and professional sports.",
                url: "https://transathlete.com/take-action"
            },
            { 
                id: 4, 
                title: "Workplace Non-Discrimination Protections",
                description: "Strengthen workplace protections for transgender and non-binary employees.",
                url: "https://www.equalityfederation.org/workplace"
            },
            { 
                id: 5, 
                title: "Trans-Inclusive ID Documents",
                description: "Support easier access to ID document changes reflecting correct gender markers.",
                url: "https://transequality.org/identity-documents-privacy"
            },
            { 
                id: 6, 
                title: "Safe Schools for Trans Youth",
                description: "Create safer educational environments for transgender and gender non-conforming students.",
                url: "https://www.glsen.org/safe-schools"
            },
            { 
                id: 7, 
                title: "Housing Rights Protection",
                description: "Support anti-discrimination measures in housing for transgender individuals.",
                url: "https://nationalcenterfortransequality.org/housing-rights"
            },
            { 
                id: 8, 
                title: "Trans Healthcare Provider Training",
                description: "Advocate for mandatory transgender healthcare competency training for medical professionals.",
                url: "https://www.wpath.org/education"
            },
            { 
                id: 9, 
                title: "Public Facilities Access",
                description: "Support equal access to public facilities for transgender individuals.",
                url: "https://www.aclu.org/public-facilities"
            },
            { 
                id: 10, 
                title: "Legal Name Change Accessibility",
                description: "Make legal name change processes more accessible and affordable for trans individuals.",
                url: "https://transgenderlawcenter.org/equalitymap"
            }
        ];
        res.json(petitions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch petitions' });
    }
});

// Add endpoint to sign a petition
app.post('/petitions/sign', (req, res) => {
    try {
        const { username, petitionId } = req.body;
        const signedPetitions = addPetitionSignature(username, petitionId);
        
        if (signedPetitions) {
            res.json({ 
                message: 'Petition signed successfully', 
                signedPetitions,
                stats: {
                    totalSigned: signedPetitions.length
                }
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to sign petition' });
    }
});

// Add endpoint to get user's petition statistics
app.get('/petitions/user/:username', (req, res) => {
    try {
        const data = readData();
        const user = data.find(u => u.username === req.params.username);
        
        if (user && user.signedPetitions) {
            res.json({
                username: user.username,
                signedPetitions: user.signedPetitions,
                stats: {
                    totalSigned: user.signedPetitions.length
                }
            });
        } else {
            res.json({
                username: req.params.username,
                signedPetitions: [],
                stats: {
                    totalSigned: 0
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user petition data' });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});