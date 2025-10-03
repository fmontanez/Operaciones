const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    if (req.session.user) {
        try {
            const roles = await pool.query('SELECT * FROM roles ORDER BY id');
            const levels = await pool.query('SELECT * FROM levels ORDER BY id');
            const employementRelationships = await pool.query('SELECT * FROM employement_relationships ORDER BY id');
            const incomeTypes = await pool.query('SELECT * FROM income_types ORDER BY id');
            const hierarchies = await pool.query('SELECT * FROM hierarchies ORDER BY id');

            res.render('employees', {
                user: req.session.user,
                roles: roles.rows,
                levels: levels.rows,
                employementRelationships: employementRelationships.rows,
                incomeTypes: incomeTypes.rows,
                hierarchies: hierarchies.rows
            });
        } catch (error) {
            console.error('Error fetching catalog data for employees form:', error);
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

    const { name, taxId, govermentCode, roleId, incomeTypeId, levelId, employementRelationshipId } = req.query;
    
    let query = `
        SELECT 
            e.id,
            e.lastname,
            e.sec_lastname,
            e.name,
            e.email,
            e.tax_id,
            e.goverment_code,
            er.name as employment_relationship_name,
            it.name as income_type_name,
            r.name as role_name,
            l.name as level_name,
            h.name as hierarchie_name
        FROM employees e
        LEFT JOIN roles r ON e.role_id = r.id
        LEFT JOIN levels l ON e.level_id = l.id
        LEFT JOIN employement_relationships er ON e.employement_relationship_id = er.id
        LEFT JOIN income_types it ON e.income_type_id = it.id
        LEFT JOIN hierarchies h ON e.hierarchie_id = h.id
        WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (name) {
        query += ` AND (UPPER(e.name) LIKE UPPER($${paramIndex}) OR UPPER(e.lastname) LIKE UPPER($${paramIndex}) OR UPPER(e.sec_lastname) LIKE UPPER($${paramIndex}))`;
        params.push(`%${name.toUpperCase()}%`);
        paramIndex++;
    }

    if (taxId) {
        query += ` AND UPPER(e.tax_id) LIKE UPPER($${paramIndex})`;
        params.push(`%${taxId.toUpperCase()}%`);
        paramIndex++;
    }

    if (govermentCode) {
        query += ` AND UPPER(e.goverment_code) LIKE UPPER($${paramIndex})`;
        params.push(`%${govermentCode.toUpperCase()}%`);
        paramIndex++;
    }

    if (roleId) {
        query += ` AND e.role_id = $${paramIndex}`;
        params.push(roleId);
        paramIndex++;
    }

    if (incomeTypeId) {
        query += ` AND e.income_type_id = $${paramIndex}`;
        params.push(incomeTypeId);
        paramIndex++;
    }

    if (levelId) {
        query += ` AND e.level_id = $${paramIndex}`;
        params.push(levelId);
        paramIndex++;
    }

    if (employementRelationshipId) {
        query += ` AND e.employement_relationship_id = $${paramIndex}`;
        params.push(employementRelationshipId);
        paramIndex++;
    }

    query += ' ORDER BY e.lastname,e.sec_lastname,e.name ASC';

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error executing employee search query', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching employee by id', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
        name, lastname, sec_lastname, birth_date, email, tax_id, goverment_code, id_opta,
        contracting_date, social_security_number, employement_relationship_id, role_id, level_id, hierarchie_id,
        transfer_bank_number, bank, id_bank, income_type_id, imss_bw_gros_salary, imss_bw_net_salary,
        gin_bw_net_salary, monthly_bonus, assignation_bonus, total_monthly_salary, last_rise_date
    } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO employees (name, lastname, sec_lastname, birth_date, email, tax_id, goverment_code, id_opta, contracting_date, social_security_number, employement_relationship_id, role_id, level_id, hierarchie_id, transfer_bank_number, bank, id_bank, income_type_id, imss_bw_gros_salary, imss_bw_net_salary, gin_bw_net_salary, monthly_bonus, assignation_bonus, total_monthly_salary, last_rise_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) RETURNING *',
            [name, lastname, sec_lastname, birth_date, email, tax_id, goverment_code, id_opta, contracting_date, social_security_number, employement_relationship_id, role_id, level_id, hierarchie_id, transfer_bank_number, bank, id_bank, income_type_id, imss_bw_gros_salary, imss_bw_net_salary, gin_bw_net_salary, monthly_bonus, assignation_bonus, total_monthly_salary, last_rise_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating employee', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const {
        name, lastname, sec_lastname, birth_date, email, tax_id, goverment_code, id_opta,
        contracting_date, social_security_number, employement_relationship_id, role_id, level_id, hierarchie_id,
        transfer_bank_number, bank, id_bank, income_type_id, imss_bw_gros_salary, imss_bw_net_salary,
        gin_bw_net_salary, monthly_bonus, assignation_bonus, total_monthly_salary, last_rise_date
    } = req.body;

    try {
        const result = await pool.query(
            'UPDATE employees SET name = $1, lastname = $2, sec_lastname = $3, birth_date = $4, email = $5, tax_id = $6, goverment_code = $7, id_opta = $8, contracting_date = $9, social_security_number = $10, employement_relationship_id = $11, role_id = $12, level_id = $13, hierarchie_id = $14, transfer_bank_number = $15, bank = $16, id_bank = $17, income_type_id = $18, imss_bw_gros_salary = $19, imss_bw_net_salary = $20, gin_bw_net_salary = $21, monthly_bonus = $22, assignation_bonus = $23, total_monthly_salary = $24, last_rise_date = $25 WHERE id = $26 RETURNING *',
            [name, lastname, sec_lastname, birth_date, email, tax_id, goverment_code, id_opta, contracting_date, social_security_number, employement_relationship_id, role_id, level_id, hierarchie_id, transfer_bank_number, bank, id_bank, income_type_id, imss_bw_gros_salary, imss_bw_net_salary, gin_bw_net_salary, monthly_bonus, assignation_bonus, total_monthly_salary, last_rise_date, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating employee', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    try {
        await pool.query('DELETE FROM employees WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting employee', error.stack);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;