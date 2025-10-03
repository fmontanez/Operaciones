const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const port = 3000;

// Import routes
const authRoutes = require('./routes/auth');
const navigationRoutes = require('./routes/navigation');
const rolesRoutes = require('./routes/roles');
const levelsRoutes = require('./routes/levels');
const employementRelationshipsRoutes = require('./routes/employementRelationships');
const hierarchiesRoutes = require('./routes/hierarchies');
const incomeTypesRoutes = require('./routes/incomeTypes');
const employeesRoutes = require('./routes/employees');

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

app.use('/', authRoutes);
app.use('/', navigationRoutes);
app.use('/roles', rolesRoutes);
app.use('/levels', levelsRoutes);
app.use('/employementRelationships', employementRelationshipsRoutes);
app.use('/hierarchies', hierarchiesRoutes);
app.use('/incomeTypes', incomeTypesRoutes);
app.use('/employees', employeesRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
