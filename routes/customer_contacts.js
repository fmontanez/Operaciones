const express = require('express');
const pool = require('../db');
const router = express.Router();

// Render the customer contacts page with catalog data for dropdowns
router.get('/', async (req, res) => {
    if (req.session.user) {
        try {
            // Fetch customers and customer_roles for the select dropdowns
            const customers = await pool.query('SELECT customer_id, name FROM customers ORDER BY name');
            const customerRoles = await pool.query('SELECT * FROM customer_roles ORDER BY name');

            res.render('customer_contacts', {
                user: req.session.user,
                customers: customers.rows,
                customerRoles: customerRoles.rows
            });
        } catch (error) {
            console.error('Error fetching catalog data for customer contacts form:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/');
    }
});

// Search customer contacts with filters
router.get('/search', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { nombre, role_id } = req.query;
    
    let query = `
        SELECT DISTINCT
            cc.id,
            cc.customer_id,
            cc.name,
            cc.lastname,
            cc.sec_lastname,
            cc.email,
            cc.notes,
            c.name as customer_name,
            ARRAY_AGG(DISTINCT cr.id) as role_ids,
            ARRAY_AGG(DISTINCT cr.name) as role_names
        FROM customer_contacts cc
        LEFT JOIN customers c ON cc.customer_id = c.customer_id
        LEFT JOIN customer_contact_roles ccr ON cc.id = ccr.contact_id
        LEFT JOIN customer_roles cr ON ccr.role_id = cr.id
        WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Search in name, lastname, sec_lastname fields (case insensitive)
    if (nombre) {
        query += ` AND (
            UPPER(cc.name) LIKE UPPER($${paramIndex}) OR 
            UPPER(cc.lastname) LIKE UPPER($${paramIndex}) OR 
            UPPER(cc.sec_lastname) LIKE UPPER($${paramIndex})
        )`;
        params.push(`%${nombre}%`);
        paramIndex++;
    }

    // Filter by role_id if provided
    if (role_id) {
        query += ` AND cc.id IN (
            SELECT contact_id FROM customer_contact_roles WHERE role_id = $${paramIndex}
        )`;
        params.push(role_id);
        paramIndex++;
    }

    query += ' GROUP BY cc.id, c.name ORDER BY cc.lastname ASC, cc.name ASC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing customer contact search query', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get customer contact by id with roles
router.get('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
        // Get contact basic info
        const contactResult = await pool.query(
            'SELECT * FROM customer_contacts WHERE id = $1', 
            [id]
        );
        
        if (contactResult.rows.length === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        const contact = contactResult.rows[0];

        // Get assigned roles
        const rolesResult = await pool.query(
            `SELECT cr.id, cr.name 
             FROM customer_contact_roles ccr
             JOIN customer_roles cr ON ccr.role_id = cr.id
             WHERE ccr.contact_id = $1`,
            [id]
        );

        contact.roles = rolesResult.rows.map(r => r.id);
        
        res.json(contact);
    } catch (error) {
        console.error('Error fetching customer contact by id', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create new customer contact with roles
router.post('/', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { customer_id, name, lastname, sec_lastname, email, notes, roles } = req.body;

    // Server-side validation
    if (!customer_id) {
        return res.status(400).json({ message: 'El cliente es obligatorio.' });
    }
    if (!name || name.length < 2 || name.length > 255) {
        return res.status(400).json({ message: 'El nombre debe tener entre 2 y 255 caracteres.' });
    }
    if (!lastname || lastname.length < 2 || lastname.length > 255) {
        return res.status(400).json({ message: 'El apellido paterno debe tener entre 2 y 255 caracteres.' });
    }
    if (!roles || roles.length === 0) {
        return res.status(400).json({ message: 'Debe seleccionar al menos un rol.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insert contact
        const contactResult = await client.query(
            `INSERT INTO customer_contacts 
            (customer_id, name, lastname, sec_lastname, email, notes, created_date, created_by) 
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7) 
            RETURNING *`,
            [customer_id, name, lastname, sec_lastname, email, notes, req.session.user.username]
        );

        const contactId = contactResult.rows[0].id;

        // Insert contact roles
        for (const roleId of roles) {
            await client.query(
                'INSERT INTO customer_contact_roles (contact_id, role_id) VALUES ($1, $2)',
                [contactId, roleId]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(contactResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating customer contact', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Update customer contact and roles
router.put('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { customer_id, name, lastname, sec_lastname, email, notes, roles } = req.body;

    // Server-side validation
    if (!customer_id) {
        return res.status(400).json({ message: 'El cliente es obligatorio.' });
    }
    if (!name || name.length < 2 || name.length > 255) {
        return res.status(400).json({ message: 'El nombre debe tener entre 2 y 255 caracteres.' });
    }
    if (!lastname || lastname.length < 2 || lastname.length > 255) {
        return res.status(400).json({ message: 'El apellido paterno debe tener entre 2 y 255 caracteres.' });
    }
    if (!roles || roles.length === 0) {
        return res.status(400).json({ message: 'Debe seleccionar al menos un rol.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update contact
        const contactResult = await client.query(
            `UPDATE customer_contacts 
            SET customer_id = $1, name = $2, lastname = $3, sec_lastname = $4, 
                email = $5, notes = $6, updated_date = CURRENT_TIMESTAMP, updated_by = $7
            WHERE id = $8 
            RETURNING *`,
            [customer_id, name, lastname, sec_lastname, email, notes, req.session.user.username, id]
        );
        
        if (contactResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Contact not found' });
        }

        // Delete old roles
        await client.query('DELETE FROM customer_contact_roles WHERE contact_id = $1', [id]);

        // Insert new roles
        for (const roleId of roles) {
            await client.query(
                'INSERT INTO customer_contact_roles (contact_id, role_id) VALUES ($1, $2)',
                [id, roleId]
            );
        }

        await client.query('COMMIT');
        res.json(contactResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating customer contact', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Delete customer contact (cascade will delete roles)
router.delete('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM customer_contacts WHERE id = $1 RETURNING *', 
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting customer contact', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
