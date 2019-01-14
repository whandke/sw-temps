const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
var isodate = require("isodate");

let keys = JSON.parse(fs.readFileSync(__dirname + '/../keys.json', 'utf8'));

function mapToHue(temp) {
  if(temp < 10)
    return 180;
  if(temp > 50)
    return 0;
  temp = temp - 10;
  temp = temp * -1;
  temp = temp + 40;
  temp = temp * 4.5;
  return temp;
}

function sensorFinder(sensor) {
  return sensor.sensor_id == this;
}

function lastToJSON(readout){
  sensors = {
    "00000a94207e": "red",
    "00000a083357": "gold",
    "00000a93b4a0": "green",
    "00000a91eae1": "yellow"
  };
  result = [];  
  time = readout.time;
  readout.temps.forEach(function(s){
    sensor = sensors[s.sensor_id];
    temp = Math.round(s.sensor_temp * 10) / 10;
    result.push(
      {
        sensor_id: sensor, 
        sensor_temp: temp, 
        hue: mapToHue(temp)
      })
  });

  red = result.find(sensorFinder, "red");
  gold = result.find(sensorFinder, "gold");
  yellow = result.find(sensorFinder, "yellow");
  green = result.find(sensorFinder, "green");
  
  return {
    red: red,
    gold: gold,
    yellow: yellow,
    green: green
  };
}

function readoutsToJSON(readouts){
  sensors = {
    "00000a94207e": "red",
    "00000a083357": "gold",
    "00000a93b4a0": "green",
    "00000a91eae1": "yellow"
  };

  red = [];
  gold = [];
  green = [];
  yellow = [];
  time = [];

  readouts.forEach(function(r){
    time.push(r.time)
    r.temps.forEach(function(s){
      if(sensors[s.sensor_id] == "red")
        red.push(Math.round(s.sensor_temp * 10) / 10);
      else if(sensors[s.sensor_id] == "green")
        green.push(Math.round(s.sensor_temp * 10) / 10);
      else if(sensors[s.sensor_id] == "gold")
        gold.push(Math.round(s.sensor_temp * 10) / 10);
      else if(sensors[s.sensor_id] == "yellow")
        yellow.push(Math.round(s.sensor_temp * 10) / 10);
    })
  })
  return {
    series: {
      red: red,
      gold: gold,
      green: green,
      yellow: yellow
    },
    time: time
  }
}

mongoose.connect(`mongodb://${keys.mlab.test.user}:${keys.mlab.test.password}@ds149414.mlab.com:49414/sw`, { useNewUrlParser: true })

let tempSchema = new mongoose.Schema({
  temps: [
    {
      sensor_id: String,
      sensor_temp: String
    }
  ],
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
      res.send({last: lastToJSON(readout)})
    })
  })

  app.get('/api/temps/:seconds', function(req, res){
    console.log('[INFO] GET ' + req.path)
    res.setHeader('Content-Type', 'application/json')
    temps.find({}, function(err, readouts){
      let result = [];
      let now = new Date();
      let after = now.getTime() - 1000 * req.params.seconds;

      readouts.forEach(function(readout){
        if(readout.time.getTime() > after) {
          result.push({temps: readout.temps, time: readout.time}) 
        }   
      })
      res.send(readoutsToJSON(result));
    })
  })
}