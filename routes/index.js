'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
const client = require('../db');


module.exports = function makeRouterWithSockets (io) {


  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT * FROM tweets', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
    });
  }


  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query('SELECT name, content \
                  FROM users JOIN tweets ON tweets.user_id = users.id \
                  WHERE name=$1', [req.params.username], function (err, result){
      if (err) return next(err);
      var usersTweets = result.rows;

      res.render('index', {
        title: 'Twitter.js',
        tweets: usersTweets,
        showForm: true,
        username: req.params.username
      });
    });

  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    res.render('index', {
      title: 'Twitter.js',
      tweets: tweetsWithThatId // an array of only one element ;-)
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    var newTweet = tweetBank.add(req.body.name, req.body.content);
    io.sockets.emit('new_tweet', newTweet);
    res.redirect('/');
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
