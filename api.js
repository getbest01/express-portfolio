const express = require("express");
const cors = require("cors");
const fs = require("fs");
const port = process.env.PORT;

const app = express();
const router = express.Router();

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// --> Add this
// ** MIDDLEWARE ** //
const whitelist = ['http://localhost:3000']
const corsOptions = {
  origin: function (origin, callback) {
    console.log("** Origin of request " + origin)
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      console.log("Origin acceptable")
      callback(null, true)
    } else {
      console.log("Origin rejected")
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(corsOptions))
//app.use(cors());



app.listen(port || 3000, () => {
  console.log(`Express server is running on port ${port}`);
});

router.get("/", (req, res) => {
  const client = pool.connect();
  res.send("Connected to DB");
  client.query("SELECT * FROM public.transaction;", (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    client.release();
  });
});

//Postgre database read
router.get("/json", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM public.transaction;");
    const results = { results: result ? result.rows : null };
    res.send(JSON.stringify(results));
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

/* for JSON file read
let trxData;
let rawdata = [];
router.get("/json", (req, res) => {
  let rawdata = fs.readFileSync("./JSON/transactions.json");
  let trxData = JSON.parse(rawdata);
  res.send(trxData);
});
*/


//Postgre database write
router.post("/replace", async (req, res) => {
  try {
    console.log("post start! - show body")
    console.log(req.body);
    console.log(req);
    let insertText = "";

    let newTrx = JSON.parse(req.body);
    console.log("loop starts!");
    for (let i = 0; i < newTrx.length; i++) {
      insertText += `(${newTrx[i].id},${newTrx[i].fiscalType},${newTrx[i].desc}, ${newTrx[i].dolValue}),`;
      console.log(insertText)
    }
    insertText.slice(0, -1); //remove last comma
    const client = pool.connect();
    //delete existing data of the table
    const deleteRes = client.query("DELETE * FROM public.transaction;");
    console.log(`delete table result: ${deleteRes}`);
    //replace with the new contents
    let insertQuery = `INSERT INTO public.transactions VALUES ${insertText};`;
    console.log(insertQuery);
    const insertRes = client.query(insertQuery);
    console.log(`insert table result: ${insertRes}`);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

/* for JSON file write
router.post("/replace", (req, res) => {
  console.log(req.body);
  let newTrx = JSON.parse(req.body);
  console.log(newTrx);
  fs.writeFile("./JSON/transactions.json", JSON.stringify(newTrx), finished);

  function finished(err) {
    console.log("JSON file replaced");
  }
});
*/


app.use(`/`, router);