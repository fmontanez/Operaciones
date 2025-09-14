const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const session = require('express-session');
const bcrypt = require('bcrypt');
const Swal = require('sweetalert2');
const app = express();
const port = 3000;


// PostgreSQL connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'HAS',
    password: 'adminadmin',
    port: 5432,
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key', // Replace with a real secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'html'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

app.post('/login', async (req, res) => {
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

app.get('/main', async (req, res) => {
    if (req.session.user) {
        try {
            const parentMenuQuery = `
                SELECT mi.*
                FROM menu_items mi
                JOIN user_type_menu_items utmi ON mi.id = utmi.menu_item_id
                WHERE utmi.user_type_id = $1
                AND mi.active = true
                AND mi.deleted = false
                AND mi.parent_id IS NULL
                ORDER BY mi.priority;
            `;
            const parentMenuResult = await pool.query(parentMenuQuery, [req.session.user.userTypeId]);
            const parentMenuItems = parentMenuResult.rows;

            const menu = [];

            for (const parent of parentMenuItems) {
                const childMenuQuery = `
                    SELECT mi.*
                    FROM menu_items mi
                    JOIN user_type_menu_items utmi ON mi.id = utmi.menu_item_id
                    WHERE utmi.user_type_id = $1
                    AND mi.active = true
                    AND mi.deleted = false
                    AND mi.parent_id = $2
                    ORDER BY mi.priority;
                `;
                const childMenuResult = await pool.query(childMenuQuery, [req.session.user.userTypeId, parent.id]);
                const children = childMenuResult.rows;
                menu.push({ ...parent, children });
            }

           res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
            res.render('main', { user: req.session.user, menu });
        } catch (error) {
            console.error('Error fetching menu items:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.user = null;
    req.session.save(err => {
        if (err) {
            return res.status(500).send('Could not log out.');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

app.get('/underConstruction', (req, res) => {
    if (req.session.user) {
        const page = req.query.page;
        res.render('underConstruction', { user: req.session.user, page: page });
    } else {
        res.redirect('/');
    }
});

app.get('/renderUnderConstruction', (req, res) => {
    if (req.session.user) {
        const page = req.query.page;
        res.render('underConstruction', { user: req.session.user, page: page });
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/roles', (req, res) => {
    if (req.session.user) {
        res.render('roles', { user: req.session.user });
    } else {
        res.redirect('/');
    }
});

app.get('/roles/search', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, name } = req.query;
    let query = 'SELECT * FROM roles WHERE 1=1 ';
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



app.put('/roles/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const roleId = req.params.id;
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
            UPDATE roles
            SET name = $1, description = $2
            WHERE id = $3
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description, roleId]);

        if (result.rows.length > 0) {
            res.json({ success: true, role: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Rol no encontrado.' });
        }
    } catch (error) {
        console.error('Error updating role:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el rol.' });
    }
});

app.post('/roles', async (req, res) => {
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
            INSERT INTO roles (name, description)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description]);

        if (result.rows.length > 0) {
            res.status(201).json({ success: true, role: result.rows[0] });
        } else {
            res.status(500).json({ message: 'Error al crear el rol.' });
        }
    } catch (error) {
        console.error('Error creating role:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al crear el rol.' });
    }
});

app.delete('/roles/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const roleId = req.params.id;

    try {
        const query = `
            DELETE FROM roles
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [roleId]);

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Rol eliminado exitosamente.' });
        } else {
            res.status(404).json({ message: 'Rol no encontrado.' });
        }
    } catch (error) {
        console.error('Error deleting role:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el rol.' });
    }
});

app.get('/levels', (req, res) => {
    if (req.session.user) {
        res.render('levels', { user: req.session.user });
    } else {
        res.redirect('/');
    }
});

app.get('/levels/search', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, name } = req.query;
    let query = 'SELECT * FROM levels WHERE 1=1 ';
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

app.put('/levels/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const levelId = req.params.id;
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
            UPDATE levels
            SET name = $1, description = $2
            WHERE id = $3
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description, levelId]);

        if (result.rows.length > 0) {
            res.json({ success: true, level: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Nivel no encontrado.' });
        }
    } catch (error) {
        console.error('Error updating level:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el nivel.' });
    }
});

app.post('/levels', async (req, res) => {
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
            INSERT INTO levels (name, description)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description]);

        if (result.rows.length > 0) {
            res.status(201).json({ success: true, level: result.rows[0] });
        } else {
            res.status(500).json({ message: 'Error al crear el nivel.' });
        }
    } catch (error) {
        console.error('Error creating level:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al crear el nivel.' });
    }
});

app.delete('/levels/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const levelId = req.params.id;

    try {
        const query = `
            DELETE FROM levels
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [levelId]);

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Nivel eliminado exitosamente.' });
        } else {
            res.status(404).json({ message: 'Nivel no encontrado.' });
        }
    } catch (error) {
        console.error('Error deleting level:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el nivel.' });
    }
});

app.get('/employementRelationships', (req, res) => {
    if (req.session.user) {
        res.render('employementRelationships', { user: req.session.user });
    } else {
        res.redirect('/');
    }
});

app.get('/employementRelationships/search', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, name } = req.query;
    let query = 'SELECT * FROM employement_relationships WHERE 1=1 ';
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

app.put('/employementRelationships/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const employementRelationshipId = req.params.id;
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
            UPDATE employement_relationships
            SET name = $1, description = $2
            WHERE id = $3
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description, employementRelationshipId]);

        if (result.rows.length > 0) {
            res.json({ success: true, employementRelationship: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Relación laboral no encontrada.' });
        }
    } catch (error) {
        console.error('Error updating employement relationship:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la relación laboral.' });
    }
});

app.post('/employementRelationships', async (req, res) => {
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
            INSERT INTO employement_relationships (name, description)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description]);

        if (result.rows.length > 0) {
            res.status(201).json({ success: true, employementRelationship: result.rows[0] });
        } else {
            res.status(500).json({ message: 'Error al crear la relación laboral.' });
        }
    } catch (error) {
        console.error('Error creating employement relationship:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al crear la relación laboral.' });
    }
});

app.delete('/employementRelationships/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const employementRelationshipId = req.params.id;

    try {
        const query = `
            DELETE FROM employement_relationships
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [employementRelationshipId]);

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Relación laboral eliminada exitosamente.' });
        } else {
            res.status(404).json({ message: 'Relación laboral no encontrada.' });
        }
    } catch (error) {
        console.error('Error deleting employement relationship:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la relación laboral.' });
    }
});

app.get('/hierarchies', (req, res) => {
    if (req.session.user) {
        res.render('hierarchies', { user: req.session.user });
    } else {
        res.redirect('/');
    }
});

app.get('/hierarchies/search', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id, name } = req.query;
    let query = 'SELECT * FROM hierarchies WHERE 1=1 ';
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

app.put('/hierarchies/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const hierarchyId = req.params.id;
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
            UPDATE hierarchies
            SET name = $1, description = $2
            WHERE id = $3
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description, hierarchyId]);

        if (result.rows.length > 0) {
            res.json({ success: true, hierarchy: result.rows[0] });
        } else {
            res.status(404).json({ message: 'Jerarquía no encontrada.' });
        }
    } catch (error) {
        console.error('Error updating hierarchy:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la jerarquía.' });
    }
});

app.post('/hierarchies', async (req, res) => {
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
            INSERT INTO hierarchies (name, description)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(query, [name, description]);

        if (result.rows.length > 0) {
            res.status(201).json({ success: true, hierarchy: result.rows[0] });
        } else {
            res.status(500).json({ message: 'Error al crear la jerarquía.' });
        }
    } catch (error) {
        console.error('Error creating hierarchy:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al crear la jerarquía.' });
    }
});

app.delete('/hierarchies/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const hierarchyId = req.params.id;

    try {
        const query = `
            DELETE FROM hierarchies
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [hierarchyId]);

        if (result.rows.length > 0) {
            res.json({ success: true, message: 'Jerarquía eliminada exitosamente.' });
        } else {
            res.status(404).json({ message: 'Jerarquía no encontrada.' });
        }
    } catch (error) {
        console.error('Error deleting hierarchy:', error.stack);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la jerarquía.' });
    }
});

app.get('/incomeTypes', (req, res) => {
    if (req.session.user) {
        res.render('incomeTypes', { user: req.session.user });
    } else {
        res.redirect('/');
    }
});

app.get('/incomeTypes/search', async (req, res) => {
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

app.put('/incomeTypes/:id', async (req, res) => {
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

app.post('/incomeTypes', async (req, res) => {
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

app.delete('/incomeTypes/:id', async (req, res) => {
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

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});