const fs = require('fs');
const http = require('http');
const express = require('express');
const favicon = require('serve-favicon');
const controller = require('./controllers/controller');

console.log('Getting started!');

let app = express();

//Set up rendering engine
app.set('view engine', 'ejs');
app.set('port', (process.env.PORT || 3000));

//Static files
app.use(express.static('public'));

app.use(express.urlencoded({extended: true}));

//Fire up controllers
controller(app);

//Listen to port
app.listen(app.get('port'), function(){
    console.log(`Now listening on port ${app.get('port')}!`);
});
