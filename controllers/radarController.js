const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
var isodate = require("isodate");

let keys = JSON.parse(fs.readFileSync(__dirname + '/../keys.json', 'utf8'));

mongoose.connect(`mongodb://${keys.mlab.test.user}:${keys.mlab.test.password}@ds149414.mlab.com:49414/sw`,
 function(err){
  if(err) {
    console.log('Coś poszło nie tak przy połączeniu :c');
    throw err;
  }
})

let tempSchema = new mongoose.Schema({
  temps: [[{type: String}, {type: String}]],
  time: Date
})

let temps = mongoose.model('temp', tempSchema, 'test');

module.exports = function(app){

  app.get('/', function(req, res){
    console.log('[INFO] GET ' + req.path)
    res.render('index')
  })

  app.get('/api/temps/last', function(req, res){
    console.log('[INFO] GET ' + req.path)
    res.setHeader('Content-Type', 'application/json')
    temps.findOne({}, {}, {sort: { 'time' : -1 }}, function(err, readout){
      res.send({temps: readout.temps})
    })
  })

  app.get('/api/temps/:seconds', function(req, res){
    console.log('[INFO] GET ' + req.path)
    res.setHeader('Content-Type', 'application/json')
    temps.find({}, function(err, readouts){
      let result = []
      readouts.forEach(function(readout){
        let now = new Date()
        after = now.getTime() - 1000 * req.params.seconds
        if(readout.time.getTime() > after) {
          result.push({temps: readout.temps, time: readout.time}) 
        }   
      })
      res.send({readouts: result})
    })
  })
      
  app.get('*', function(req, res){
    console.log('[INFO] Unhandled request was made: ' + req.path)
    console.log('[INFO] Sending 404 page...')
    res.render('404')
  })

}