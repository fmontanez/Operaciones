const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    if (req.session.user) {
        try {
            const tutors = await pool.query("SELECT e.id AS tutor_id, e.lastname||' '||e.sec_lastname||' '||e.name AS tutor_name FROM employees e INNER JOIN hierarchies h ON (e.hierarchie_id = h.id) WHERE h.tutor_allowed is true ORDER BY tutor_name");

            res.render('tutorships', {
                user: req.session.user,
                tutors: tutors.rows
            });
        } catch (error) {
            console.error('Error fetching data for tutorships page:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/');
    }
});

router.get('/search', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name } = req.query;
    
    let query = `
        SELECT 
            e.id, 
            e.lastname, 
            e.sec_lastname, 
            e.name, 
            t.lastname as tutor_lastname, 
            t.sec_lastname as tutor_sec_lastname, 
            t.name as tutor_name 
        FROM employees e 
        LEFT JOIN employees t ON e.tutor_id = t.id 
        WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (name) {
        query += ` AND (UPPER(e.name) LIKE UPPER($${paramIndex}) OR UPPER(e.lastname) LIKE UPPER($${paramIndex}) OR UPPER(e.sec_lastname) LIKE UPPER($${paramIndex}))`;
        params.push(`%${name.toUpperCase()}%`);
        paramIndex++;
    }

    query += ' ORDER BY e.lastname, e.sec_lastname, e.name';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing tutorships search query', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/chart-data', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const result = await pool.query(`
            SELECT 
                t.lastname||' '||t.sec_lastname||' '||t.name AS tutor_name, 
                COUNT(e.id) as employee_count 
            FROM employees e
            INNER JOIN employees t ON e.tutor_id = t.id
            GROUP BY t.lastname, t.sec_lastname, t.name
            ORDER BY tutor_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/:id/tutor', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { tutor_id } = req.body;

    try {
        const result = await pool.query(
            'UPDATE employees SET tutor_id = $1 WHERE id = $2 RETURNING *',
            [tutor_id, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating tutor', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
