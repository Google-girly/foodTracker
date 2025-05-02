import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();

// Set up the view engine to use EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.set('trust proxy', 1); // trust first proxy

app.use(session({
  secret: 'cst336 csumb',
  resave: false,
  saveUninitialized: true,
}));


app.use(express.urlencoded({ extended: true }));

// Database connection setup
const pool = mysql.createPool({
    host: "jannieltan.online",
    user: "jannielt_webuser",
    password: "Jannieltan22@",
    database: "jannielt_foodTracker",
    connectionLimit: 10,
    waitForConnections: true
});
const conn = await pool.getConnection();

// Routes

// Serve the login page
app.get('/', (req, res) => {
    res.render('login.ejs');
});

//Login ACTION
app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const sql = `SELECT * FROM userAccount WHERE userName = ?`;
    const [rows] = await conn.query(sql, [username]);

    if (rows.length === 0) {
        return res.render('login.ejs', { error: "Wrong credentials!" });
    }

    const hashedPassword = rows[0].userPassword;

    // compare the typed in password to the hashedpassword
    const match = await bcrypt.compare(password, hashedPassword);

    if (match) {
        req.session.userAuthenticated = true;
        req.session.fullName = rows[0].firstName + " " + rows[0].lastName;
        res.render('addMeal.ejs');
    } else {
        res.render('login.ejs', { error: "Wrong credentials!" });
    }
});

// Serve the sign-up page (GET request)
app.get('/signUp', (req, res) => {
    res.render('signUp.ejs');  
});

// lets user sign up
app.post('/signUp', async (req, res) => {
    const { firstName, lastName, userName, userPassword } = req.body;

    // Check if the username already exists in the database
    let sql = `SELECT * FROM userAccount WHERE userName = ?`;
    const [rows] = await conn.query(sql, [userName]);

    if (rows.length > 0) {
        // username already exists
        return res.render('signUp.ejs', { error: "Username already taken!" });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // insert the new user into the database
    sql = `INSERT INTO userAccount (firstName, lastName, userName, userPassword) VALUES (?, ?, ?, ?)`;
    const sqlParams = [firstName, lastName, userName, hashedPassword];
    await conn.query(sql, sqlParams);


    res.render('login.ejs', { success: "Account created successfully. Please log in." });
});

// lets user add meal
app.post('/addMeal', async (req, res) => {
	//Get values from form
	const { meal_name } = req.body;

	//Check if meal already exists in database
	let sql = `SELECT * FROM Meal
		

});


// Start the server
app.listen(3000, () => {
    console.log("Express server running");
});
