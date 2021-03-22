const express = require("express");
const cors = require("cors");
const fs = require("fs");
const port = process.env.PORT;

const app = express();
const router = express.Router();

const { Client } = require("pg");
const pool = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

let trxData;
let rawdata = [];

app.use(cors());

app.listen(port, () => {
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

router.get("/json", async (req, res) => {
  try {
    const client = await pool.connect;
    const result = await client.query("SELECT * FROM public.transaction;");
    const results = { results: result ? result.rows : null };

    res.send("Connected to DB");
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

/* for JSON file read
router.get("/json", (req, res) => {
  let rawdata = fs.readFileSync("./JSON/transactions.json");
  let trxData = JSON.parse(rawdata);
  res.send(trxData);
});
*/

/*
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
