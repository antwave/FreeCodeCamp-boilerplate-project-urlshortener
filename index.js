require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var bodyParser = require("body-parser");
const mongoose = require('mongoose');
const dns = require('dns');


// Connect and setup Database with mongoose
const mongodbURI = process.env['databaseURL'];
mongoose.connect(mongodbURI);
var URLSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
var URLDocument = mongoose.model('URLs', URLSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

// We need this to parse URLs in POST requests
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use(express.urlencoded({extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// POST urls to database
app.post('/api/shorturl', async function(req, res) {
  let parsedURL;
  // Create a URL object using the URL constructor (appropiate way to do it)
  try {
    parsedURL = new URL(req.body.url);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ error: 'invalid URL' });
  }
  // Validate the URL using dns.lookup
  dns.lookup(parsedURL.hostname, async (err, address, family) => {
    if (!address || req.body.url == "") {
      res.json({error: 'invalid url'});
    } else {
      let newURL = await createAndSaveURL(req.body.url);
      res.json(newURL);
    }  
  });
});


//Redirect to URL
app.get("/api/shorturl/:short_URL/", async function(req, res) {
  console.log("this is url " + req.params.short_URL);
  let shortURL = req.params.short_URL;
  let foundURL = await findURLByNumber(shortURL);
  if (foundURL.length !== 0) {
    console.log(foundURL);
    res.redirect(foundURL[0].original_url);
  };
});


// Save URL object to db
var createAndSaveURL = async function(requestURL) {
  let documentCount = await URLDocument.countDocuments();
  var newURL = new URLDocument({original_url: requestURL, short_url: documentCount});
  newURL.save();
  console.log("new URL saved to db: " + newURL);
  return newURL;
};


// Find URL in database by short_url number
var findURLByNumber = async function(shortURL) {
  let foundURL = await URLDocument.find({short_url: shortURL});
  return foundURL;
};


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
