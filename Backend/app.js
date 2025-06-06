const libExpress = require("express");
const cors = require("cors");
const libMongoose = require("mongoose");
const libRanString = require("randomstring");

const app = libExpress();
app.use(cors());
app.use(libExpress.json());

const port = 5000;
const CONNECTION_URL =
  "mongodb://appUser:user123@localhost:27017/IMS?authSource=IMS";

// Connect to MongoDB
(async () => {
  try {
    await libMongoose.connect(CONNECTION_URL);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
})();

app.post("/users", async (req, res) => {
  if (req.body.name && req.body.email && req.body.password && req.body.phone) {
    // await connaction.connect()
    // const db = await connaction.db(DB)
    const Collection = await libMongoose.connection.collection("users");
    const result = await Collection.find({ email: req.body.email }).toArray();

    if (result.length > 0) {
      res.status(400).json({ message: "Email already exists" });
      return;
    } else {
      const user = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
      };
      await Collection.insertOne(user);
      res.status(200).json({ message: "User created successfully" });
    }
  }
});

app.post("/tokens", async (req, res) => {
  if (req.body.email && req.body.password) {
    // await connaction.connect()
    // const db = await connaction.db(DB)

    const Collection = await libMongoose.connection.collection("users");
    const result = await Collection.find({
      email: req.body.email,
      password: req.body.password,
    }).toArray();

    if (result.length > 0) {
      const user = result[0];
      const token = libRanString.generate(7);
      await Collection.updateOne({ _id: user._id }, { $set: { token: token } });
      res.status(200).json({ message: "Login successful", token: token });
    } else {
      res.status(400).json({ error: "Invalid email or password" });
    }
  }
});

app.get("/users/roles", async (req, res) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(400).json({ error: "Valid Token is required" });
    }

    const Collection = libMongoose.connection.db.collection("users");
    const result = await Collection.find({ token: token }).toArray();

    if (result.length > 0) {
      const user = result[0];
      res.status(200).json({
        admin: user?.is_admin === true,
        player: !!user?.playing_for,
        owner: !!user?.owner_of,
      });
    } else {
      res.status(400).json({ error: "Unable to find Token" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/players", async (req, res) => {
  try {
    const Collection = libMongoose.connection.db.collection("users");
    const result = await Collection.find({
      playing_for: { $exists: true },
    }).toArray();

    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "No players found" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/players/:id", async (req, res) => {
  try {
    const playerId = req.params.id;
    const Collection = libMongoose.connection.db.collection("users");
    const result = await Collection.find({
      _id: new libMongoose.Types.ObjectId(playerId),
    }).toArray();

    if (result.length > 0) {
      res.status(200).json(result[0]);
    } else {
      res.status(404).json({ error: "Player not found" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/teams", async (req, res) => {
  try {
    const Collection = libMongoose.connection.db.collection("teams");
    const result = await Collection.find({ _id: { $exists: true } }).toArray();

    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "No players found" });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/users/teams", async (req, res) => {
  if (req.headers.token) {
    try {
      const collection = await libMongoose.connection.db.collection('users');
      const owner = await collection.findOne({ token: req.headers.token });

      if (!!owner.owner_of) {
        const teamCollection = await libMongoose.connection.db.collection('teams');
        const team = await teamCollection.findOne({ name: owner.owner_of }); 
        if (team) {
          res.status(200).json(team);
        } else {
          res.status(404).json({ error: "Team not found" });
        }
      } else {
        res.status(400).json({ error: "User does not own any team" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  } else {
    return res.status(400).json({ error: "Missing User Token" });
  }
});


app.listen(port, () => {
  console.log(`Server is running on ${port}`)
});
