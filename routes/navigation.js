const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/main', async (req, res) => {
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

router.get('/underConstruction', (req, res) => {
    if (req.session.user) {
        const page = req.query.page;
        res.render('underConstruction', { user: req.session.user, page: page });
    } else {
        res.redirect('/');
    }
});

router.get('/renderUnderConstruction', (req, res) => {
    if (req.session.user) {
        const page = req.query.page;
        res.render('underConstruction', { user: req.session.user, page: page });
    } else {
        res.status(401).send('Unauthorized');
    }
});

module.exports = router;
