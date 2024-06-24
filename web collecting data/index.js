const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const session = require('express-session');

const app = express();
const port = 3000;

// Session configuration
app.use(session({
  secret: '3AqpC9qCFWsMkbP', //secret key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } // Set secure to true if using HTTPS
}));

const mongoURI = 'mongodb+srv://mongo:3AqpC9qCFWsMkbP@cluster0.vkdjf70.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // MongoDB URI
app.use(express.json());
//---------------------------------------------------------
app.get('/api/last-energy', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI);
    await client.connect();
    const db = client.db('HEMS');
    const collection = db.collection('HEMS2');

    // Retrieve the last document to get the latest 'energy' value
    const lastEntry = await collection.find({}, { projection: { _id: 0, energy: 1 } }).sort({ _id: -1 }).limit(1).toArray();

    if (lastEntry.length > 0) {
      res.status(200).json(lastEntry[0].energy );
    } else {
      res.status(404).send('No data found');
    }
    
    client.close();
  } catch (error) {
    console.error('Error retrieving the last energy reading:', error);
    res.status(500).send('Error fetching data');
  }
});

//------------------------------------------------------------------------
app.post('/api/data', async (req, res) => {
  try {
    const { power, energy } = req.body;
    const client = new MongoClient(mongoURI);
    await client.connect();
    const db = client.db('HEMS'); // database name
    const collection = db.collection('HEMS2'); // collection name

    // Retrieve the last document to get the current highest 'num' value
    const lastEntry = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    let num = 1;
    if (lastEntry.length > 0 && !isNaN(lastEntry[0].num)) {
      num = lastEntry[0].num + 1;
    }

    // Insert the data with a timestamp, unique ID, and 'num'
    await collection.insertOne({
      _id: new ObjectId(),
      num,
      power,
      energy,
      timestamp: new Date().toISOString() // ISO 8601 format
    });

    client.close();
    res.status(200).send('Data inserted successfully with incremented counter.');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
    res.status(500).send('Error inserting data');
  }
});

//------------------------------------------------- ----------------------


// const getSeason = (date) => {
//   const month = date.getMonth();
//   if (month >= 2 && month <= 4) {
//     return 'Spring';
//   } else if (month >= 5 && month <= 7) {
//     return 'Summer';
//   } else if (month >= 8 && month <= 10) {
//     return 'Autumn';
//   } else {
//     return 'Winter';
//   }
// };

// app.post('/api/data', async (req, res) => {
//   try {
//     const { power, energy } = req.body;
//     const client = new MongoClient(mongoURI);
//     await client.connect();
//     const db = client.db('HEMS'); // database name
//     const collection = db.collection('HEMS2'); // collection name

//     // Retrieve the last document to get the current highest 'num' value
//     const lastEntry = await collection.find().sort({ _id: -1 }).limit(1).toArray();
//     let num = 1;
//     if (lastEntry.length > 0 && !isNaN(lastEntry[0].num)) {
//       num = lastEntry[0].num + 1;
//     }

//     const currentDate = new Date();
//     const dayOfWeek = currentDate.toLocaleString('en-US', { weekday: 'long' }); // e.g., 'Monday'
//     const season = getSeason(currentDate);

//     // Insert the data with a timestamp, unique ID, 'num', day of the week, and season
//     await collection.insertOne({
//       _id: new ObjectId(),
//       num,
//       power,
//       energy,
//       dayOfWeek,
//       season,
//       timestamp: currentDate.toISOString() // ISO 8601 format
//     });

//     client.close();
//     res.status(200).send('Data inserted successfully with incremented counter.');
//   } catch (error) {
//     console.error('Error connecting to MongoDB Atlas:', error);
//     res.status(500).send('Error inserting data');
//   }
// });

//-----------------------------------------------------------------------
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

