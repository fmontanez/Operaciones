const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = `
            SELECT 
                u.*, 
                e.name, 
                e.lastname, 
                r.name as role 
            FROM users u
            JOIN employees e ON u.username = e.username
            JOIN roles r ON e.role_id = r.id
            WHERE u.username = $1
        `;
        const result = await pool.query(query, [username]);

        if (result.rows.length > 0) {
            const user = result.rows[0];

            const match = await bcrypt.compare(password, user.password);

            if (match) {
                const displayName = `${user.name.charAt(0).toUpperCase() + user.name.slice(1).toLowerCase()} ${user.lastname.charAt(0).toUpperCase() + user.lastname.slice(1).toLowerCase()}`;
                const initials = `${user.name.charAt(0).toUpperCase()}${user.lastname.charAt(0).toUpperCase()}`;

                req.session.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    userTypeId: user.user_type_id,
                    displayName: displayName,
                    initials: initials,
                    role: user.role
                };
                res.json({ success: true });
            } else {
                res.json({ success: false, message: 'Invalid username or password' });
            }
        } else {
            res.json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/logout', (req, res) => {
    req.session.user = null;
    req.session.save(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

module.exports = router;
