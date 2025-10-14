const express = require('express');
const pool = require('../db');
const router = express.Router();

// Render the customers page with catalog data for dropdowns
router.get('/', async (req, res) => {
    if (req.session.user) {
        try {
            // Fetch countries and currencies for the select dropdowns
            const countries = await pool.query('SELECT * FROM countries ORDER BY name');
            const currencies = await pool.query('SELECT * FROM currencies ORDER BY code');

            res.render('customers', {
                user: req.session.user,
                countries: countries.rows,
                currencies: currencies.rows
            });
        } catch (error) {
            console.error('Error fetching catalog data for customers form:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/');
    }
});

// Search customers with filters
router.get('/search', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, taxCode } = req.query;
    
    let query = `
        SELECT 
            c.customer_id,
            c.name,
            c.legal_name,
            c.tax_code,
            co.name as country_name,
            cur.code as currency_code,
            cur.name as currency_name
        FROM customers c
        LEFT JOIN countries co ON c.country_id = co.id
        LEFT JOIN currencies cur ON c.invoice_currency_id = cur.id
        WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Search in both name and legal_name fields
    if (name) {
        query += ` AND (UPPER(c.name) LIKE UPPER($${paramIndex}) OR UPPER(c.legal_name) LIKE UPPER($${paramIndex}))`;
        params.push(`%${name}%`);
        paramIndex++;
    }

    if (taxCode) {
        query += ` AND UPPER(c.tax_code) LIKE UPPER($${paramIndex})`;
        params.push(`%${taxCode}%`);
        paramIndex++;
    }

    query += ' ORDER BY c.name ASC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing customer search query', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get customer by id
router.get('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM customers WHERE customer_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching customer by id', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new customer
router.post('/', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, legal_name, tax_code, country_id, invoice_currency_id } = req.body;

    // Server-side validation
    if (!name || name.length < 2 || name.length > 255) {
        return res.status(400).json({ message: 'El nombre debe tener entre 2 y 255 caracteres.' });
    }
    if (!legal_name || legal_name.length < 2 || legal_name.length > 255) {
        return res.status(400).json({ message: 'La razón social debe tener entre 2 y 255 caracteres.' });
    }
    if (!country_id) {
        return res.status(400).json({ message: 'El país es obligatorio.' });
    }
    if (!invoice_currency_id) {
        return res.status(400).json({ message: 'La moneda de facturación es obligatoria.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO customers 
            (name, legal_name, tax_code, country_id, invoice_currency_id, created_date, created_by) 
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6) 
            RETURNING *`,
            [name, legal_name, tax_code, country_id, invoice_currency_id, req.session.user.username]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating customer', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, legal_name, tax_code, country_id, invoice_currency_id } = req.body;

    // Server-side validation
    if (!name || name.length < 2 || name.length > 255) {
        return res.status(400).json({ message: 'El nombre debe tener entre 2 y 255 caracteres.' });
    }
    if (!legal_name || legal_name.length < 2 || legal_name.length > 255) {
        return res.status(400).json({ message: 'La razón social debe tener entre 2 y 255 caracteres.' });
    }
    if (!country_id) {
        return res.status(400).json({ message: 'El país es obligatorio.' });
    }
    if (!invoice_currency_id) {
        return res.status(400).json({ message: 'La moneda de facturación es obligatoria.' });
    }

    try {
        const result = await pool.query(
            `UPDATE customers 
            SET name = $1, legal_name = $2, tax_code = $3, country_id = $4, 
                invoice_currency_id = $5, updated_date = CURRENT_TIMESTAMP, updated_by = $6
            WHERE customer_id = $7 
            RETURNING *`,
            [name, legal_name, tax_code, country_id, invoice_currency_id, req.session.user.username, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating customer', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM customers WHERE customer_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting customer', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to get countries catalog
router.get('/catalogs/countries', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const result = await pool.query('SELECT * FROM countries ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching countries', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to get currencies catalog
router.get('/catalogs/currencies', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const result = await pool.query('SELECT * FROM currencies ORDER BY code');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching currencies', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
