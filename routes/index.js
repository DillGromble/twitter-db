'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
const client = require('../db');


module.exports = function makeRouterWithSockets (io) {


  // a reusable function
  function respondWithAllTweets (req, res, next){
    const query = 'SELECT name, content \
                  FROM users JOIN tweets \
                  ON tweets.user_id = users.id';
    client.query(query, function (err, result) {
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
    const query = 'SELECT name, content \
                  FROM users JOIN tweets \
                  ON tweets.user_id = users.id \
                  WHERE name=$1';
    client.query(query, [req.params.username], function (err, result){
      if (err) return next(err);
      var usersTweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: usersTweets,
        showForm: true
      });
    });
  });


  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    const query = 'SELECT name, content \
                   FROM users JOIN tweets \
                   ON tweets.user_id = users.id \
                   WHERE tweets.id=$1';
    client.query(query, [+req.params.id], function (err, result) {
      if (err) return next(err);
      var tweet = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweet
      });
    })
  });


  // create a new tweet
  router.post('/tweets', function(req, res, next){
    const checkUser = 'SELECT id FROM users WHERE name=$1',
          addUser = 'INSERT INTO users(name, picture_url) VALUES ($1, $2) RETURNING id',
          addTweet = 'INSERT INTO tweets(user_id, content) VALUES($1, $2)';

    client.query(checkUser, [req.body.name], function (err, result) {
      if (err) return next(err);
      if (result.rows[0]) {
        client.query(addTweet, [result.rows[0].id, req.body.content], function (err) {
          if (err) return next(err);
          res.redirect('/');
        });
      }
      else {
        client.query(addUser, [req.body.name, 'http://i.imgur.com/XDjBjfu.jpg'], function (err, result) {
          if (err) return next(err)
          let newID = result.rows[0].id;
          client.query(addTweet, [newID, req.body.content], function (err) {
            if (err) return next(err);
            res.redirect('/');
          });
        });
      }
    });
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
