const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Database
const db = new sqlite3.Database('./neighboraid.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        initializeDatabase();
    }
});

// Create Tables
function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            address TEXT,
            latitude REAL,
            longitude REAL,
            radius REAL DEFAULT 1.5,
            trust_score REAL DEFAULT 5.0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            resource_type TEXT,
            description TEXT,
            quantity TEXT,
            urgency TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            resource_type TEXT,
            description TEXT,
            quantity TEXT,
            availability TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    console.log('✅ Database tables initialized');
}

// Haversine distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Calculate match score
function calculateMatchScore(request, offer, distance) {
    let score = 0;
    const distanceScore = Math.max(0, 100 - (distance * 20));
    score += distanceScore * 0.3;
    
    const urgencyWeights = {
        'critical': 100,
        'high': 70,
        'medium': 40,
        'low': 20
    };
    score += (urgencyWeights[request.urgency] || 50) * 0.4;
    score += offer.trust_score * 20 * 0.2;
    
    if (request.resource_type === offer.resource_type) {
        score += 100 * 0.1;
    }
    return Math.round(score);
}

// Register User (WITHOUT Google Maps - using hardcoded Boston coordinates)
app.post('/api/users/register', (req, res) => {
    const { name, email, phone, address, radius } = req.body;

    // Hardcoded Boston coordinates for demo (random nearby locations)
    const lat = 42.3601 + (Math.random() - 0.5) * 0.05;
    const lng = -71.0589 + (Math.random() - 0.5) * 0.05;

    db.run(
        `INSERT INTO users (name, email, phone, address, latitude, longitude, radius) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, address, lat, lng, radius || 1.5],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'User already exists or database error' });
            }
            res.json({
                message: 'User registered successfully',
                userId: this.lastID,
                latitude: lat,
                longitude: lng
            });
        }
    );
});

// Get User by Email
app.get('/api/users/:email', (req, res) => {
    db.get('SELECT * FROM users WHERE email = ?', [req.params.email], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(row);
    });
});

// Create Request
app.post('/api/requests', (req, res) => {
    const { user_id, resource_type, description, quantity, urgency } = req.body;

    db.run(
        `INSERT INTO requests (user_id, resource_type, description, quantity, urgency) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, resource_type, description, quantity, urgency],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'Failed to create request' });
            }
            res.json({
                message: 'Request created successfully',
                requestId: this.lastID
            });
        }
    );
});

// Create Offer
app.post('/api/offers', (req, res) => {
    const { user_id, resource_type, description, quantity, availability } = req.body;

    db.run(
        `INSERT INTO offers (user_id, resource_type, description, quantity, availability) 
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, resource_type, description, quantity, availability],
        function(err) {
            if (err) {
                return res.status(400).json({ error: 'Failed to create offer' });
            }
            res.json({
                message: 'Offer created successfully',
                offerId: this.lastID
            });
        }
    );
});

// Find Matches
app.get('/api/matches/:requestId', (req, res) => {
    const requestId = req.params.requestId;

    db.get('SELECT * FROM requests WHERE id = ?', [requestId], (err, request) => {
        if (err || !request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        db.get('SELECT * FROM users WHERE id = ?', [request.user_id], (err, requester) => {
            if (err || !requester) {
                return res.status(404).json({ error: 'Requester not found' });
            }

            db.all(
                `SELECT offers.*, users.name, users.address, users.latitude, users.longitude, users.trust_score, users.phone
                 FROM offers 
                 JOIN users ON offers.user_id = users.id
                 WHERE offers.status = 'active' AND offers.resource_type = ?`,
                [request.resource_type],
                (err, offers) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error' });
                    }

                    const matches = offers
                        .map(offer => {
                            const distance = calculateDistance(
                                requester.latitude,
                                requester.longitude,
                                offer.latitude,
                                offer.longitude
                            );

                            if (distance > requester.radius) {
                                return null;
                            }

                            const score = calculateMatchScore(request, offer, distance);

                            return {
                                ...offer,
                                distance: distance.toFixed(2),
                                matchScore: score
                            };
                        })
                        .filter(match => match !== null)
                        .sort((a, b) => b.matchScore - a.matchScore);

                    res.json({
                        request: request,
                        matches: matches,
                        totalMatches: matches.length
                    });
                }
            );
        });
    });
});

// Get All Requests
app.get('/api/requests', (req, res) => {
    db.all(
        `SELECT requests.*, users.name, users.address, users.latitude, users.longitude
         FROM requests 
         JOIN users ON requests.user_id = users.id
         WHERE requests.status = 'active'
         ORDER BY requests.created_at DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

// Get All Offers
app.get('/api/offers', (req, res) => {
    db.all(
        `SELECT offers.*, users.name, users.address, users.latitude, users.longitude
         FROM offers 
         JOIN users ON offers.user_id = users.id
         WHERE offers.status = 'active'
         ORDER BY offers.created_at DESC`,
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        }
    );
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend server running ✅' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});