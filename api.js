const express = require("express");
const cors = require("cors");
const fs = require("fs");
const port = 3000;

const app = express();
const router = express.Router();

app.use(cors());

app.listen(port, () => {
  console.log(`Express server is running on port ${port}`)
})

router.get("/", (req, res) => {
  res.send('Hello world');
});

router.get("/json", (req, res) => {
  let rawdata = fs.readFileSync("./JSON/transactions.json");
  let trxData = JSON.parse(rawdata);
  res.send(trxData);
});

router.post("/replace", (req, res) => {
  console.log(req.body)
  let newTrx = JSON.parse(req.body);
  console.log(newTrx)
  fs.writeFile("./JSON/transactions.json", JSON.stringify(newTrx), finished);

  function finished(err) {
    console.log("JSON file replaced");
  }
})

app.use(`/`, router);;

