require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const { Schema } = mongoose;


let ourUrlCount = 0;

// Connecting to the database
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then((err, data) => {
  console.log('Hello');
}).catch((err) => {
  console.log(err);
});


// Creating our Database Schema
const ourUrlSchema = new Schema({
  original_url: String,
  short_url: Number
});


// Creating our Model from the Schema created earlier.
const ourUrlModel = mongoose.model('ourUrlModel', ourUrlSchema);

// Creating the express app.
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// const ourShorteningRoutes = [];

app.use(cors());

app.use(bodyParser.urlencoded({ extneded: false }));

// Declaring the static directory
// process.cwd() returns the current working directory.
app.use('/public', express.static(`${process.cwd()}/public`));

// Our Home endpoint.
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl/new', (req, res) => {
  const givenUrl = req.body.url;


  console.log(givenUrl);
  let urlToParse = givenUrl.slice(givenUrl.indexOf('/') + 2);
  urlToParse = urlToParse.slice(0, urlToParse.indexOf('/'));
  dns.lookup(urlToParse, (err) => {
    if (err) {

      console.log("Error");
      res.json({
        error: "Invalid url"
      });
    } else {
      // ourShorteningRoutes.push(givenUrl);

      findUrlInDataBase(givenUrl).then((checkUrl) => {
        console.log('Check url', checkUrl);
        if (checkUrl) {
          return res.json({ original_url: givenUrl, short_url: checkUrl });
        }
      }).catch((err) => {
        ourUrlCount += 1;

        ourUrlModel.create({ original_url: givenUrl, short_url: ourUrlCount })
          .then((data) => {
            res.json({ original_url: data.original_url, short_url: data.short_url });
          }).catch((err) => {
            console.log(err);
          });
      });




      // console.log(givenUrl, ourShorteningRoutes.length);
      // res.json({
      //   original_url: givenUrl,
      //   short_url: ourShorteningRoutes.length
      // });
    }
  });
});


function findUrlInDataBase(givenUrl) {
  // ourUrlModel.findOne({given_url: givenUrl}).exec().then((data)=>{
  //   if(data){
  //     console.log('Already present');
  //     return data.short_url;
  //   }
  // }).catch((err) => {
  //   console.log(err);
  //   return undefined;
  // });

  return new Promise((resolve, reject) => {
    ourUrlModel.findOne({ original_url: givenUrl }, (err, entry) => {
      if (err) {
        reject(err);
      } else {

        if (entry) {
          resolve(entry.short_url);
        }
        reject(err);
      }
    });
  });
}


function findShortUrlInDataBase(givenUrl) {
  // ourUrlModel.findOne({given_url: givenUrl}).exec().then((data)=>{
  //   if(data){
  //     console.log('Already present');
  //     return data.short_url;
  //   }
  // }).catch((err) => {
  //   console.log(err);
  //   return undefined;
  // });

  return new Promise((resolve, reject) => {
    ourUrlModel.findOne({ short_url: givenUrl }, (err, entry) => {
      if (err) {
        reject(err);
      } else {

        if (entry) {
          resolve(entry.original_url);
        }
        reject(err);
      }
    });
  });
}

app.get('/api/shorturl/:shortened', (req, res) => {
  const shortenedIndex = req.params.shortened;

  findShortUrlInDataBase(shortenedIndex).then((data) => {
    res.redirect(302, data);
  }).catch((err) => {
    return res.json({ error: 'Invalid url' });
  });


});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
