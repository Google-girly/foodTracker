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
    const { firstName, lastName, userName, password, age, gender} = req.body;

    // Check if the username already exists in the database
    let sql = `SELECT * FROM userAccount WHERE userName = ?`;
    const [rows] = await conn.query(sql, [userName]);

    if (rows.length > 0) {
        // username already exists
        return res.render('signUp.ejs', { error: "Username already taken!" });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert the new user into the database
    sql = `INSERT INTO userAccount (firstName, lastName, userName, userPassword, age, gender) VALUES (?, ?, ?, ?,?,?)`;
    const sqlParams = [firstName, lastName, userName, hashedPassword, age, gender];
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
        res.render('home.ejs');
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

    const [mealIDResult] = await conn.query("SELECT LAST_INSERT_ID() AS mealID");
    const mealID = mealIDResult[0].mealID;
    
    console.log('mealID:', mealID); 


    const mealHistorySQL = "INSERT INTO mealHistory(mealID, userID, meal, mealDate, category) VALUES(?,?,?,?,?)";
    await conn.query(mealHistorySQL, [mealID, userID, insertFood, dateFood, cat]);
 
    // Re-fetch food list after insertion
    const [rows] = await conn.query("SELECT * FROM foodData");

    res.render("addFood", { message: "Food added!", foodList: rows });
});

app.get('/mealHistory', async (req, res) => {
    const { date } = req.query;

    // If date is not provided, set it to an empty string or default message
    const displayDate = date || '';

    if (!date) {
        // If no date, show the form and message
        return res.render('mealHistory', { message: "Date is required.", meals: { breakfast: [], lunch: [], dinner: [] }, date: displayDate });
    }

    // Query to get meals for the specified date, ordered by category
    const [rows] = await conn.query(
        "SELECT * FROM mealHistory WHERE mealDate = ? ORDER BY category ASC",
        [date]
    );

    // Initialize an object to store meals by category
    const meals = { breakfast: [], lunch: [], dinner: [] };

    // Loop through the rows and classify meals based on category
    rows.forEach(meal => {
        if (meal.category.toLowerCase() === 'breakfast') {
            meals.breakfast.push(meal);
        } else if (meal.category.toLowerCase() === 'lunch') {
            meals.lunch.push(meal);
        } else if (meal.category.toLowerCase() === 'dinner') {
            meals.dinner.push(meal);
        }
    });

    
    // Render the mealHistory page with the meals and the selected date
    res.render('mealHistory', { meals, date: displayDate });
});






// app.post('/mealHistory', async (req, res) => {
//     app.get('/mealHistory', async (req, res) => {
//     const { date } = req.query;

//     if (!date) {
//         return res.status(400).send("Date is required.");
//     }

//     try {
//         // Query to get meals for the specified date
//         const [rows] = await conn.query(
//             "SELECT * FROM mealHistory WHERE mealDate = ? ORDER BY mealDate ASC",
//             [date]
//         );

//         if (rows.length === 0) {
//             return res.render('mealHistory', { message: "No meals found for this date." });
//         }

//         // Render the mealHistory page with the fetched rows
//         res.render('mealHistory', { meals: rows, date: date });

//     } catch (error) {
//         console.error('Error querying mealHistory:', error);
//         res.status(500).send("Error retrieving meal history.");
//     }
// });

app.get('/home', (req, res) => {
    res.render('home'); // Ensure the login.ejs file exists in your views folder
});



// Start the server
app.listen(3000, () => {
    console.log("Express server running");
});
