import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
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

// Serve the sign-up page (GET request)
app.get('/signUp', (req, res) => {
    res.render('signUp.ejs');  
});

// lets user sign up
app.post('/signUp', async (req, res) => {
    const { firstName, lastName, userName, userPassword, age, gender, userPlan} = req.body;

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
    sql = `INSERT INTO userAccount (firstName, lastName, userName, userPassword, age, gender, userPlan) VALUES (?, ?, ?, ?,?,?,?)`;
    const sqlParams = [firstName, lastName, userName, hashedPassword, age, gender, userPlan];
    await conn.query(sql, sqlParams);


    res.render('login.ejs', { success: "Account created successfully. Please log in." });
});


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
        req.session.userID = rows[0].userID;
        res.render('addFood.ejs');
    } else {
        res.render('login.ejs', { error: "Wrong credentials!" });
    }
});


app.get('/addFood', async (req, res) => {
    const [rows] = await conn.query("SELECT * FROM foodData");
    res.render("addFood", { message: null, foodList: rows });
});

app.post('/addFood', async (req, res) => {
    const { dateFood, insertFood, cat } = req.body;

    if (!req.session.userAuthenticated) {
        return res.render('login.ejs', { error: "Please log in first." });
    }

    const userID = req.session.userID;

    const sql = "INSERT INTO Meal (userID, category, mealDate, meal) VALUES (?, ?, ?, ?)";
    await conn.query(sql, [userID, cat, dateFood, insertFood]);

    // Re-fetch food list after insertion
    const [rows] = await conn.query("SELECT * FROM foodData");

    res.render("addFood", { message: "Food added!", foodList: rows });
});




// Start the server
app.listen(3000, () => {
    console.log("Express server running");
});
