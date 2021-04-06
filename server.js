require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');
const urlencodedParser = bodyParser.urlencoded({ extended: false });

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true }, (err)=>{
  if(err){
    console.log(err)
  }else{
    console.log("db connected")
  }
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

const URLSchema = mongoose.Schema({
  old: String,
  newURL: String
});

const URLModel = mongoose.model("URLModel", URLSchema);

app.post("/api/shorturl/new", urlencodedParser, (req, res)=>{
  var url_orig = req.body.url;
  var url = url_orig;
  url = url.replace(/^(http(s)*:\/\/)*(www\.)*/g, "");
  // url = url.replace(/^(ftp:\/)*/g, "")
  url = url.replace(/\/(.)*/g, "")
  if(url !== undefined){
    dns.lookup(url, (err, address, family)=>{
      if(err){
        console.log(err);
        res.json({"error": "invalid url"});
      }else{
        var newURL=Math.floor(Math.random()*999999999);
        URLModel.create({old: url_orig, newURL: newURL}, (err, data)=>{
          if(err){
            console.log(err)
            res.json({"error": "invalid url"});
          }else{
            res.json({"original_url": url_orig, "short_url": newURL});
          }
        })
      }
    })
  }else{
    res.json({"error": "invalid url"});
  }

})
app.get("/api/shorturl/:url", (req, res)=>{
  var url = req.params.url;
  URLModel.findOne({"newURL": url}, (err, data)=>{
    if(err){
      console.log(err)
      res.json({"error": "invalid url"});
    }else if(data != null){
      res.redirect(data.old);
    }else{
      res.json({"error": "Not Found"});
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
