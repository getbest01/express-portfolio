const express = require("express");
const cors = require("cors");
const fs = require("fs");
const port = process.env.PORT;

const app = express();
const router = express.Router();

const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(cors());

app.listen(port, () => {
  console.log(`Express server is running on port ${port}`);
});

router.get("/", (req, res) => {
  res.send("Hello world");
  client.connect();
  res.send("Connected to DB");
  client.query("SELECT * FROM public.transaction;", (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    client.end();
  });

  
});

router.get("/json", (req, res) => {
  client.connect();
  let rawdata = [];
  client.query("SELECT * FROM public.transaction;", (err, resQuery) => {
    if (err) throw err;
    for (let row of resQuery.rows) {
      rawdata.push(JSON.stringify(row));
    }
    let trxData = JSON.parse(rawdata);
    res.send(trxData);
    client.end();
  });
});

/* for JSON file read
router.get("/json", (req, res) => {
  let rawdata = fs.readFileSync("./JSON/transactions.json");
  let trxData = JSON.parse(rawdata);
  res.send(trxData);
});
*/
router.post("/replace", (req, res) => {
  console.log(req.body);
  let newTrx = JSON.parse(req.body);
  console.log(newTrx);
  fs.writeFile("./JSON/transactions.json", JSON.stringify(newTrx), finished);

  function finished(err) {
    console.log("JSON file replaced");
  }
});

app.use(`/`, router);
