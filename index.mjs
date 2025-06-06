import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import fetch from 'node-fetch';

const app = express();

// Set up the view engine to use EJS
app.set('view engine', 'ejs');
app.use('/foodTracker/public', express.static('public'));

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
app.get('/',  (req, res) => {
    res.render('login.ejs');
});


app.get('/signUp', (req, res) => {
    res.render('signUp.ejs', { error: null });
});

app.get('/foodSearch', (req, res) => {
    res.render('foodSearch.ejs');
});

// lets user sign up
app.post('/signUp', isAuthenticated, async (req, res) => {
    const { firstName, lastName, userName, password, age, gender} = req.body;

    // Check if the username already exists in the database
    let sql = `SELECT * FROM userAccount WHERE userName = ?`;
    const [rows] = await conn.query(sql, [userName]);

    if (rows.length > 0) {
        return res.render('signUp.ejs', { error: "Username already taken!" });
    }

    
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

    console.log("Username submitted:", username);
    console.log("User found:", rows.length > 0);
    if (rows.length > 0) {
        console.log("Stored hash:", rows[0].userPassword);
    }
    console.log("Password match:", match);

    
    req.session.userAuthenticated = true;
    req.session.userID = rows[0].userID;
    res.render('home.ejs', { totalCalories: 0 });  
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
    let { date } = req.query;

    if (!date) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        date = `${yyyy}-${mm}-${dd}`;
    }

    const userID = req.session.userID;
    const displayDate = date;

    const [meals] = await conn.query(
        "SELECT * FROM mealHistory WHERE mealDate = ? AND userID = ? ORDER BY category ASC",
        [date, userID]
    );

    const categorizedMeals = { breakfast: [], lunch: [], dinner: [] };
    meals.forEach(meal => {
        const category = meal.category?.toLowerCase();
        if (category === 'breakfast') categorizedMeals.breakfast.push(meal);
        else if (category === 'lunch') categorizedMeals.lunch.push(meal);
        else if (category === 'dinner') categorizedMeals.dinner.push(meal);
    });

    const [foodList] = await conn.query("SELECT * FROM foodData");

    res.render('mealHistory', {meals: categorizedMeals, foodList, date: displayDate});
});

app.post('/updateMeal', isAuthenticated, async (req, res) => {
    const { mealID, updatedMeal, updatedCategory, updatedDate, currentDate } = req.body;
    const userID = req.session.userID;
  
    const [rows] = await conn.query(
      "SELECT * FROM mealHistory WHERE mealID = ? AND userID = ?",
      [mealID, userID]
    );
    if (rows.length === 0) {
      return res.status(403).send("Unauthorized or meal not found.");
    }
  
    await conn.query(
      "UPDATE mealHistory SET meal = ?, category = ?, mealDate = ? WHERE mealID = ? AND userID = ?",
      [updatedMeal, updatedCategory, updatedDate, mealID, userID]
    );
  
    await conn.query(
      "UPDATE Meal SET meal = ?, category = ?, mealDate = ? WHERE mealID = ? AND userID = ?",
      [updatedMeal, updatedCategory, updatedDate, mealID, userID]
    );
  
    res.redirect(`/mealHistory?date=${currentDate}`);
  });
  


app.post('/deleteMeal', async (req, res) => {
    const { mealID, date } = req.body;
    const userID = req.session.userID;

    const [rows] = await conn.query("SELECT * FROM mealHistory WHERE mealID = ? AND userID = ?", [mealID, userID]);

    if (rows.length === 0) {
        return res.status(403).send("Unauthorized or meal not found.");
    }

    await conn.query("DELETE FROM mealHistory WHERE mealID = ? AND userID = ?", [mealID, userID]);
    await conn.query("DELETE FROM Meal WHERE mealID = ? AND userID = ?", [mealID, userID]);

    res.redirect(`/mealHistory?date=${date}`);
});


app.post('/mealHistory', async (req, res) => {
    const { date, insertFood, mealType } = req.body;
    const userID = req.session.userID;

    const sql = 'INSERT INTO Meal (userID, category, mealDate, meal) VALUES (?, ?, ?, ?)';
    await conn.query(sql, [userID, mealType, date, insertFood]);

    const [mealIDResult] = await conn.query("SELECT LAST_INSERT_ID() AS mealID");
    const mealID = mealIDResult[0].mealID;

    const mealHistorySQL = "INSERT INTO mealHistory(mealID, userID, meal, mealDate, category) VALUES(?,?,?,?,?)";
    await conn.query(mealHistorySQL, [mealID, userID, insertFood, date, mealType]);

    res.redirect(`/mealHistory?date=${date}`);
});

app.get('/home', isAuthenticated, async (req, res) => {
    const userID = req.session.userID;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;


    const [meals] = await conn.query(
        "SELECT meal FROM mealHistory WHERE mealDate = ? AND userID = ?",
        [date, userID]
    );

    let totalCalories = 0;

    for (const meal of meals) {
        const foodName = meal.meal;

        const response = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-app-id": "3b4cc9c0",
                "x-app-key": "962140f8e8d0de29390218b734440410"
            },
            body: JSON.stringify({ query: foodName })
        });

        const data = await response.json();

        if (data.foods && data.foods.length > 0) {
            totalCalories += data.foods[0].nf_calories || 0;
        }
    }

    res.render('home', { totalCalories: Math.round(totalCalories) });
});

app.get('/logout', (req,res) =>{
    req.session.destroy();
    res.render('login.ejs')
})


function isAuthenticated(req,res,next)
{
    if (req.session.userAuthenticated)
    {
        next();
    }
    else
    {
        res.redirect("/");
    }
}

// Start the server
app.listen(3000, () => {
    console.log("Express server running");
});
