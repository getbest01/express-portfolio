const express = require("express");
const cors = require("cors");
const fs = require("fs");
const port = process.env.PORT;
const fetch = require("node-fetch");
const app = express();
const router = express.Router();
const mongoose = require("mongoose");

const { Pool } = require("pg");

//PostGRE
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

//MongoDB
try {
  // Connect to the MongoDB cluster
  mongoose.connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log(" Mongoose is connected")
  );
} catch (e) {
  console.log("MongoDB could not connect");
}

// ** MIDDLEWARE ** CORS whitelist define//
const whitelist = [
  //"http://localhost:3000",
  //"http://localhost:3001",
  //"http://127.0.0.1:5500",
  "https://jason-portfolio-fiscaltrace.netlify.app",
  "https://jason-portfolio-weatherapikey.netlify.app",
  "https://jason-portfolio-currweather.netlify.app",
  "https://jason-portfolio-pgatour.netlify.app",
  "https://jason-portfolio-kijijo.netlify.app"
];
const corsOptions = {
  origin: function (origin, callback) {
    console.log("** Origin of request " + origin);
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      console.log("Origin acceptable");
      callback(null, true);
    } else {
      console.log("Origin rejected");
      callback(new Error("Not allowed by CORS"));
    }
  },
};

//app setting

app.use(cors(corsOptions));
app.use(require("body-parser").json());
app.listen(port || 3000, () => {
  console.log(`Express server is running on port ${port || "3000"}`);
});

//Fiscaltrace - Postgre database read
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

//Fiscaltrace - Postgre database write
router.post("/replace", async (req, res) => {
  try {
    console.log("post start! - show body");
    console.log(req.body);
    let insertText = "";

    let newTrx = req.body;

    for (let i = 0; i < newTrx.length; i++) {
      insertText += `('${newTrx[i].id}','${newTrx[i].fiscalType}','${newTrx[i].desc}', ${newTrx[i].dolValue}),`;
    }
    insertText = insertText.slice(0, -1); //remove last comma

    const clientR = await pool.connect();

    //delete existing data of the table
    const deleteRes = await clientR.query("DELETE FROM public.transaction;");

    //replace with the new contents
    if (newTrx.length > 0) {
      let insertQuery = `INSERT INTO public.transaction(trxid, trxtype, trxdesc, trxvalue) VALUES ${insertText};`;
      const insertRes = await clientR.query(insertQuery);
    }
    clientR.release();
    res.send(`${newTrx.length} transaction(s) in database now!`);
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

//weather api fetch from weatherapi.com - query with city name
router.get("/weather", async (req, res) => {
  await fetch(
    `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHERAPI_KEY}&q=${req.query.city}&days=3&alerts=yes`
  )
    .then((response) => {
      return response.json();
    })
    .then((data) => res.send(data))
    .catch((e) => {
      console.log(e);
      res.send(e);
    });
});

//weather api fetch from weatherapi.com - query with geo loc
router.get("/weathergeo", async (req, res) => {
  await fetch(
    `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHERAPI_KEY}&q=${req.query.geo}&days=10&alerts=yes`
  )
    .then((response) => {
      return response.json();
    })
    .then((data) => res.send(data))
    .catch((e) => {
      console.log(e);
      res.send(e);
    });
});

//PGA tournament list api fetch from sportsdata.io - query with season
router.get("/pga-tourlist", async (req, res) => {
  await fetch(
    `https://fly.sportsdata.io/golf/v2/json/Tournaments/${req.query.season}?key=${process.env.PGAIO_KEY}`
  )
    .then((response) => {
      return response.json();
    })
    .then((data) => res.send(data))
    .catch((e) => {
      console.log(e);
      res.send(e);
    });
});

//PGA Leaderboard api fetch from sportsdata.io - query with tournament id
router.get("/pga-leaderboard", async (req, res) => {
  console.log(req.query.tourId);
  await fetch(
    `https://fly.sportsdata.io/golf/v2/json/Leaderboard/${req.query.tourId}?key=${process.env.PGAIO_KEY}`
  )
    .then((response) => {
      return response.json();
    })
    .then((data) => res.send(data))
    .catch((e) => {
      console.log(e);
      res.send(e);
    });
});

//PGA Leaderboard api fetch from sportsdata.io - News
router.get("/pga-news", async (req, res) => {
  await fetch(
    `https://fly.sportsdata.io/golf/v2/json/News?key=${process.env.PGAIO_KEY}`
  )
    .then((response) => {
      return response.json();
    })
    .then((data) => res.send(data))
    .catch((e) => {
      console.log(e);
      res.send(e);
    });
});

//Kijijo db transactions =====================================================

//schema definition
const userSchema = new mongoose.Schema({
  name: String,
  user_name: String,
  password: String,
  age: String,
});

const prodSchema = new mongoose.Schema({
  title: String,
  desc: String,
  category: String,
  price: Number,
  register_user: String
});

//models for collections
const User = mongoose.model("users", userSchema);
const Prod = mongoose.model("products", prodSchema);

//Kijijo db query testing
router.get("/mongo", async (req, res) => {
  try {
    User.find({}, { name: 1, password: 1, _id: 0 }, (err, data) => {
      res.send(data);
    });
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

//Kijijo user login
router.post("/mongoLogin", async (req, res) => {
  try {
    console.log(req.body);

    User.find(
      { user_name: req.body.user_name, password: req.body.password },
      { name: 1, password: 1, _id: 0 },
      (err, data) => {
        res.send(data);
      }
    );
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

//Kijijo user add
router.post("/mongoUserAdd", async (req, res) => {
  try {
    console.log(req.body);

    const user1 = new User({
      name: req.body.fullname,
      user_name: req.body.user_name,
      password: req.body.password,
      age: req.body.age,
    });

    User.find(
      { user_name: req.body.user_name },
      { user_name: 1, _id: 0 },
      (err, data) => {
        if (data.length <= 0) {
          user1.save((err, data) => {
            if (err) res.send(err);
            else res.send(data);
          });
        } else res.send("already exists");
      }
    );
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

//Kijijo prod query
router.get("/mongoProdQry", async (req, res) => {
  const re = new RegExp(req.query.searchStr, "i");
  const qryStr =
    (await req.query.searchStr) === ""
      ? {}
      : { $or: [{ desc: re }, { title: re }] };
  try {
    Prod.find(qryStr, (err, data) => {
      res.send(data);
    });
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

//Kijijo product add
router.post("/mongoProductLoad", async (req, res) => {
  try {
    console.log(req.body);

    const prod1 = new Prod({
      title: req.body.title,
      desc: req.body.desc,
      category: req.body.category,
      price: req.body.price,
      register_user: req.body.register_user
    });

    Prod.find({ title: req.body.title }, { title: 1, _id: 0 }, (err, data) => {
      if (data.length <= 0) {
        prod1.save((err, data) => {
          if (err) res.send(err);
          else res.send(data);
        });
      } else res.send("already exists");
    });
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

//Kijijo product update
router.post("/mongoProductUpdate", async (req, res) => {
  try {
    console.log(req.body);

    const prod1 = new Prod({
      title: req.body.title,
      desc: req.body.desc,
      category: req.body.category,
      price: req.body.price,

    });

    const filter = { _id: req.body.id };
    const update = {
      title: req.body.title,
      desc: req.body.desc,
      category: req.body.category,
      price: req.body.price,

    };

    Prod.findOneAndUpdate(filter, update, (err, data) => {
      if (err) res.send(err);
      else res.send(data);
    });
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

//Kijijo db delete testing
router.post("/mongoDelete", async (req, res) => {
  console.log(req.body)
  try {
    Prod.deleteOne(
      { _id: req.body.id },
      (err, data) => {
        if (err) res.send("DeleteErr", err);
        res.send(data);
      }
    );
  } catch (err) {
    console.error(err);
    res.send("Error: " + err);
  }
});

//Kijijo db transactions =====================================================

app.use(`/`, router);

/* Fiscaltrace - for JSON file read
let trxData;
let rawdata = [];
router.get("/json", (req, res) => {
  let rawdata = fs.readFileSync("./JSON/transactions.json");
  let trxData = JSON.parse(rawdata);
  res.send(trxData);
});
*/

/*  Fiscaltrace - for JSON file write
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
