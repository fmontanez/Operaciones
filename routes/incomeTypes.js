const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
    if (req.session.user) {
        res.render('incomeTypes', { user: req.session.user });
    } else {
        res.redirect('/');
    }
});

router.get('/search', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, name } = req.query;
    let query = 'SELECT * FROM income_types WHERE 1=1 ';
    const params = [];
    let paramIndex = 1; // Start parameter index from 1
    let whereClauses = [];

    // Check if id is a valid number before adding to query
    if (id && !isNaN(id)) { // Add isNaN check
        query += ` AND id = $${paramIndex}`;
        params.push(id);
        paramIndex++;
    }

    if (name) {
        query += ` AND ( UPPER(name) LIKE UPPER($${paramIndex}) OR UPPER(description) LIKE UPPER($${paramIndex + 1}))`;
        params.push(`%${name}%`);
        params.push(`%${name}%`);
        paramIndex += 2;
    }


    query += ' ORDER BY id ASC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const incomeTypeId = req.params.id;
    const { name, description } = req.body;

    // Server-side validation (redundant with client-side, but good practice)
    if (!name || name.length < 2 || name.length > 64) {
        return res.status(400).json({ message: 'El nombre debe tener entre 2 y 64 caracteres.' });
    }
    if (!description || description.length < 2 || description.length > 255) {
        return res.status(400).json({ message: 'La descripción debe tener entre 2 y 255 caracteres.' });
    }

    try {
        const query = `
            UPDATE income_types
            SET name = $1, description = $2
            WHERE id = $3
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description, incomeTypeId]);

        if (result.rows.length > 0) {
            res.json({ success: true, incomeType: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Tipo de ingreso no encontrado.' });
        }
    } catch (error) {
        console.error('Error updating income type:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el tipo de ingreso.' });
    }
});

router.post('/', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, description } = req.body;

    // Server-side validation
    if (!name || name.length < 2 || name.length > 64) {
        return res.status(400).json({ message: 'El nombre debe tener entre 2 y 64 caracteres.' });
    }
    if (!description || description.length < 2 || description.length > 255) {
        return res.status(400).json({ message: 'La descripción debe tener entre 2 y 255 caracteres.' });
    }

    try {
        const query = `
            INSERT INTO income_types (name, description)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description]);

        if (result.rows.length > 0) {
            res.status(201).json({ success: true, incomeType: result.rows[0] });
        } else {
            res.status(500).json({ message: 'Error al crear el tipo de ingreso.' });
        }
    } catch (error) {
        console.error('Error creating income type:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al crear el tipo de ingreso.' });
    }
});

router.delete('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const incomeTypeId = req.params.id;

    try {
        const query = `
            DELETE FROM income_types
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [incomeTypeId]);

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Tipo de ingreso eliminado exitosamente.' });
        } else {
            res.status(404).json({ message: 'Tipo de ingreso no encontrado.' });
        }
    } catch (error) {
        console.error('Error deleting income type:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el tipo de ingreso.' });
    }
});

module.exports = router;
