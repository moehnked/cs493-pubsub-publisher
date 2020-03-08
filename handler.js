const express = require('express');
const AWS = require("aws-sdk");
const serverless = require('serverless-http');

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header("Access-Control-Allow-Methods", "*")
  next();
});

app.post('/play', (req, res) => {
  AWS.config.update({region: 'us-east-1'});
  
  const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
  const queueUrl = "https://sqs.us-east-1.amazonaws.com/850459610895/test-queue.fifo";
  var bod = JSON.parse(req.body);
  var artist = bod['artist'];
  var album = bod['album'];
  var track = bod['song'];
  console.log("user listened to " + track + " from " + album + " by " + artist );
  
  //publish message to SQS
  var sqsOrderData = {
    MessageAttributes: {
      "artist": {
        DataType: "String",
        StringValue: artist
      },
      "album": {
        DataType: "String",
        StringValue: album
      },
      "song": {
        DataType: "String",
        StringValue: track
      },
      "message": {
        DataType: "String",
        StringValue: "user listened to " + track + " from " + album + " by " + artist
      }
    },
    MessageBody: JSON.stringify(bod),
    MessageDeduplicationId: track,
    MessageGroupId: "UserPlays",
    QueueUrl: queueUrl
  };
  // Send the order data to the SQS queue
  let sendSqsMessage = sqs.sendMessage(sqsOrderData).promise();

  sendSqsMessage.then((data) => {
      console.log(`OrdersSvc | SUCCESS: ${data.MessageId}`);
      res.json({"message":"successfully logged play of track"});
  }).catch((err) => {
      console.log(`OrdersSvc | ERROR: ${err}`);

      // Send email to emails API
      res.json({"message":"We ran into an error. Please try again."});
  });
  
  //res.json({"message":"good"});
});

module.exports.handler = serverless(app);
