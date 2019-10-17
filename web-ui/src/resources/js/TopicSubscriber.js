/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * Solace Web Messaging API for JavaScript
 * Publish/Subscribe tutorial - Topic Subscriber
 * Demonstrates subscribing to a topic for direct messages and receiving messages
 */

/*jslint es6 browser devel:true*/
/*global solace*/

var TopicSubscriber = function(topicName, romoMovementTopicName) {
  "use strict";
  var subscriber = {};
  subscriber.session = null;
  subscriber.topicName = topicName;
  subscriber.subscribed = false;

  subscriber.romoMovementTopicName = romoMovementTopicName;

  var msgCount = 0;
  var happyCount = 0;
  var sadCount = 0;
  var angryCount = 0;
  var disgustedCount = 0;
  var surprisedCount = 0;
  var calmCount = 0;

  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // Logger
  subscriber.log = function(line) {
    var now = new Date();
    var time = [
      ("0" + now.getHours()).slice(-2),
      ("0" + now.getMinutes()).slice(-2),
      ("0" + now.getSeconds()).slice(-2)
    ];
    var timestamp = "[" + time.join(":") + "] ";
    console.log(timestamp + line);
  };

  subscriber.log(
    '\n*** Subscriber to topic "' +
      subscriber.topicName +
      '" is ready to connect ***'
  );

  // Establishes connection to Solace router
  subscriber.connect = function() {
    // extract params
    if (subscriber.session !== null) {
      subscriber.log("Already connected and ready to subscribe.");
      return;
    }
    var hosturl = document.getElementById("hosturl").value;

    if (getParameterByName("host") != undefined) {
      hosturl = getParameterByName("host");
    }

    // check for valid protocols
    if (
      hosturl.lastIndexOf("ws://", 0) !== 0 &&
      hosturl.lastIndexOf("wss://", 0) !== 0 &&
      hosturl.lastIndexOf("http://", 0) !== 0 &&
      hosturl.lastIndexOf("https://", 0) !== 0
    ) {
      subscriber.log(
        "Invalid protocol - please use one of ws://, wss://, http://, https://"
      );
      return;
    }
    var username = document.getElementById("username").value;

    if (getParameterByName("clientuser") != undefined) {
      username = getParameterByName("clientuser");
    }

    var pass = document.getElementById("password").value;

    if (getParameterByName("clientpassword") != undefined) {
      pass = getParameterByName("clientpassword");
    }

    var vpn = document.getElementById("message-vpn").value;

    if (getParameterByName("msgvpn") != undefined) {
      vpn = getParameterByName("msgvpn");
    }

    if (!hosturl || !username || !pass || !vpn) {
      subscriber.log(
        "Cannot connect: please specify all the Solace message router properties."
      );
      return;
    }

    subscriber.log("Connecting to Solace message router using url: " + hosturl);
    subscriber.log("Client username: " + username);
    subscriber.log("Solace message router VPN name: " + vpn);
    // create session

    try {
      subscriber.session = solace.SolclientFactory.createSession({
        // solace.SessionProperties
        url: hosturl,
        vpnName: vpn,
        userName: username,
        password: pass
      });
    } catch (error) {
      subscriber.log(error.toString());
    }
    // define session event listeners
    subscriber.session.on(solace.SessionEventCode.UP_NOTICE, function(
      sessionEvent
    ) {
      subscriber.log("=== Successfully connected and ready to subscribe. ===");
    });
    subscriber.session.on(
      solace.SessionEventCode.CONNECT_FAILED_ERROR,
      function(sessionEvent) {
        subscriber.log(
          "Connection failed to the message router: " +
            sessionEvent.infoStr +
            " - check correct parameter values and connectivity!"
        );
      }
    );
    subscriber.session.on(solace.SessionEventCode.DISCONNECTED, function(
      sessionEvent
    ) {
      subscriber.log("Disconnected.");
      subscriber.subscribed = false;
      if (subscriber.session !== null) {
        subscriber.session.dispose();
        subscriber.session = null;
      }
    });
    subscriber.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, function(
      sessionEvent
    ) {
      subscriber.log(
        "Cannot subscribe to topic: " + sessionEvent.correlationKey
      );
    });
    subscriber.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, function(
      sessionEvent
    ) {
      if (subscriber.subscribed) {
        subscriber.subscribed = false;
        subscriber.log(
          "Successfully unsubscribed from topic: " + sessionEvent.correlationKey
        );
      } else {
        subscriber.subscribed = true;
        subscriber.log(
          "Successfully subscribed to topic: " + sessionEvent.correlationKey
        );
        subscriber.log("=== Ready to receive messages. ===");
      }
    });
    // define message event listener
    subscriber.session.on(solace.SessionEventCode.MESSAGE, function(message) {
      var jsonString = message.getBinaryAttachment();
      var characterCommand = JSON.parse(jsonString);

      var emotionName = "";

      if (characterCommand[0].highestEmotion != undefined) {
        msgCount++;

        emotionName = characterCommand[0].highestEmotion.toLowerCase();

        if (parseInt(characterCommand[0].higestConfidence) > 65) {
          document.getElementById("last" + emotionName).src =
            "https://romo-robot-demo.s3.amazonaws.com/" +
            characterCommand[0].image;
        } else {
          console.log(
            "Emotion not high enough: " + characterCommand[0].higestConfidence
          );
        }

        switch (emotionName) {
          case "happy":
            happyCount++;
            $("#happyProgress").css("width", 5 * happyCount + "%");
            $("#happyProgress").text(happyCount);
            break;

          case "sad":
            sadCount++;
            $("#sadProgress").css("width", 5 * sadCount + "%");
            $("#sadProgress").text(sadCount);
            break;

            break;

          case "angry":
            angryCount++;
            $("#angryProgress").css("width", 5 * angryCount + "%");
            $("#angryProgress").text(angryCount);
            break;

            break;

          case "disgusted":
            disgustedCount++;
            $("#disgustedProgress").css("width", 5 * disgustedCount + "%");
            $("#disgustedProgress").text(disgustedCount);
            break;

            break;

          case "surprised":
            surprisedCount++;
            $("#surprisedProgress").css("width", 5 * surprisedCount + "%");
            $("#surprisedProgress").text(surprisedCount);
            break;

            break;

          case "calm":
            calmCount++;
            $("#calmProgress").css("width", 5 * calmCount + "%");
            $("#calmProgress").text(calmCount);
            break;

            break;

          default:
            alert("Not implemented " + emotionName);
        }
      }

      //document.getElementById(emotionName + 'Emotion').style = "color: green;";

      subscriber.log(
        'Received message: "' +
          message.getBinaryAttachment() +
          '", details:\n' +
          message.dump()
      );
    });
    // if secure connection, first load iframe so the browser can provide a client-certificate
    if (
      hosturl.lastIndexOf("wss://", 0) === 0 ||
      hosturl.lastIndexOf("https://", 0) === 0
    ) {
      var urlNoProto = hosturl
        .split("/")
        .slice(2)
        .join("/"); // remove protocol prefix
      document.getElementById("iframe").src =
        "https://" + urlNoProto + "/crossdomain.xml";
    } else {
      subscriber.connectToSolace(); // otherwise proceed
    }
  };

  // Actually connects the session triggered when the iframe has been loaded - see in html code
  subscriber.connectToSolace = function() {
    try {
      subscriber.session.connect();
    } catch (error) {
      subscriber.log(error.toString());
    }
  };

  // Subscribes to topic on Solace message router
  subscriber.subscribe = function() {
    if (subscriber.session !== null) {
      if (subscriber.subscribed) {
        subscriber.log(
          'Already subscribed to "' +
            subscriber.topicName +
            '" and ready to receive messages.'
        );
      } else {
        subscriber.log("Subscribing to topic: " + subscriber.topicName);
        try {
          subscriber.session.subscribe(
            solace.SolclientFactory.createTopicDestination(
              subscriber.topicName
            ),
            true, // generate confirmation when subscription is added successfully
            subscriber.topicName, // use topic name as correlation key
            10000 // 10 seconds timeout for this operation
          );
        } catch (error) {
          subscriber.log(error.toString());
        }
      }
    } else {
      subscriber.log(
        "Cannot subscribe because not connected to Solace message router."
      );
    }
  };

  // Unsubscribes from topic on Solace message router
  subscriber.unsubscribe = function() {
    if (subscriber.session !== null) {
      if (subscriber.subscribed) {
        subscriber.log("Unsubscribing from topic: " + subscriber.topicName);
        try {
          subscriber.session.unsubscribe(
            solace.SolclientFactory.createTopicDestination(
              subscriber.topicName
            ),
            true, // generate confirmation when subscription is removed successfully
            subscriber.topicName, // use topic name as correlation key
            10000 // 10 seconds timeout for this operation
          );
        } catch (error) {
          subscriber.log(error.toString());
        }
      } else {
        subscriber.log(
          'Cannot unsubscribe because not subscribed to the topic "' +
            subscriber.topicName +
            '"'
        );
      }
    } else {
      subscriber.log(
        "Cannot unsubscribe because not connected to Solace message router."
      );
    }
  };

  //var romoRotateMessage = {turnByAngle:{speed:0.5,radius:0,angle:0}};
  // var romoDriveMessage = {driveWithRadius:{speed:0.5, radius:0}};
  var romoMoveMessage = {};
  var robotSelected = "all";

  subscriber.publish = function(command) {
    if (subscriber.session !== null) {
      console.debug("Move Romo ===> " + command);

      switch (command.toUpperCase()) {
        case "MOVE_FORWARD":
          romoMoveMessage = {
            driveForwardWithSpeed: { speed: 0.5, duration: 0.5 }
          };
          break;
        case "MOVE_BACKWARD":
          romoMoveMessage = {
            driveBackwardWithSpeed: { speed: 0.5, duration: 0.5 }
          };
          break;
        case "ROTATE_UP":
          romoMoveMessage = {
            turnByAngle: { speed: 0.5, radius: 0, angle: 10 }
          };
          break;
        case "ROTATE_DOWN":
          romoMoveMessage = {
            turnByAngle: { speed: 0.5, radius: 0, angle: -10 }
          };
          break;
      }

      var romoMoveMessageText = JSON.stringify(romoMoveMessage);
      subscriber.log(romoMoveMessageText);

      var message = solace.SolclientFactory.createMessage();
      message.setDestination(
        solace.SolclientFactory.createTopicDestination(romoMovementTopicName)
      );
      message.setBinaryAttachment(romoMoveMessageText);
      message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
      subscriber.log(
        'Publishing message "' +
          romoMoveMessageText +
          '" to topic "' +
          romoMovementTopicName +
          '"...'
      );
      try {
        subscriber.session.send(message);
        subscriber.log("Message published.");
      } catch (error) {
        subscriber.log(error.toString());
      }
    } else {
      subscriber.log(
        "Cannot publish because not connected to Solace message router."
      );
    }
  };

  // Gracefully disconnects from Solace message router
  subscriber.disconnect = function() {
    subscriber.log("Disconnecting from Solace message router...");
    if (subscriber.session !== null) {
      try {
        subscriber.session.disconnect();
      } catch (error) {
        subscriber.log(error.toString());
      }
    } else {
      subscriber.log("Not connected to Solace message router.");
    }
  };

  return subscriber;
};
