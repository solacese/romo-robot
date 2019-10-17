/**
 * TopicSubscriber.js
 * Message consumer that listens for Rekognition emotion analysis events,
 * parses the results, and sends Romo-SDK formatted emotion events back to the broker.
 * @author Andrew Roberts
 */

function TopicSubscriber(solaceModule, topicName, publishTopicName) {
  let solace = solaceModule;
  let subscriber = {};
  subscriber.session = null;
  subscriber.topicName = topicName;
  subscriber.commandTopicName = publishTopicName;
  subscriber.subscribed = false;

  // Logger
  subscriber.log = function(line) {
    let now = new Date();
    let time = [
      ("0" + now.getHours()).slice(-2),
      ("0" + now.getMinutes()).slice(-2),
      ("0" + now.getSeconds()).slice(-2)
    ];
    let timestamp = "[" + time.join(":") + "] ";
    console.log(timestamp + line);
  };

  subscriber.log(
    '\n*** Subscriber to topic "' +
      subscriber.topicName +
      '" is ready to connect ***'
  );

  // main function
  subscriber.run = function() {
    subscriber.connect();
  };

  // Establishes connection to Solace message router
  subscriber.connect = function() {
    if (subscriber.session !== null) {
      subscriber.log("Already connected and ready to subscribe.");
      return;
    }
    // create session
    try {
      subscriber.session = solace.SolclientFactory.createSession({
        // solace.SessionProperties
        url: process.env.SOLACE_URI,
        vpnName: process.env.SOLACE_VPN,
        userName: process.env.SOLACE_USER,
        password: process.env.SOLACE_PASSWORD
      });
    } catch (error) {
      subscriber.log(error.toString());
    }
    // define session event listeners
    subscriber.session.on(solace.SessionEventCode.UP_NOTICE, function(
      sessionEvent
    ) {
      subscriber.log("=== Successfully connected and ready to subscribe. ===");
      subscriber.subscribe();
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
      sessionEvent,
      argv
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
      console.log(message.getBinaryAttachment());
      let jsonString = message.getBinaryAttachment();
      let source = "romo";
      let imagekey = "romo-some-image.jpg";

      let topicLevels = message
        .getDestination()
        .getName()
        .split("/");

      if (topicLevels.length > 4) {
        source = topicLevels[3];
        subscriber.log('Received message from "' + source);

        imagekey = topicLevels[2] + "/" + topicLevels[3] + "-" + topicLevels[4];
      }

      //subscriber.log("Message payload " + jsonString);

      let jsonData = JSON.parse(jsonString);

      if (jsonData.FaceDetails != undefined) {
        if (jsonData.FaceDetails.length >= 1) {
          subscriber.log(
            "Response contains " + jsonData.FaceDetails.length + " face(s)"
          );
        } else {
          subscriber.log("No faces found in FaceDetails.");
          return;
        }

        // The emotionAnalysis object stores the total score for each emotion across all faces
        let emotionAnalysis = {};

        // These lets hold the single highest type and score across all faces
        let highestEmotion = "";
        let highestConfidence = 0;
        let highestSharpness = 0;
        let highestBrightness = 0;

        for (
          let faceIndex = 0;
          faceIndex < jsonData.FaceDetails.length;
          faceIndex++
        ) {
          let face = jsonData.FaceDetails[faceIndex];
          let emotions = face.Emotions;

          for (
            let emotionIndex = 0;
            emotionIndex < emotions.length;
            emotionIndex++
          ) {
            let emotionType = emotions[emotionIndex].Type;
            let emotionConfidence = emotions[emotionIndex].Confidence;

            if (emotions[emotionIndex].Confidence > highestConfidence) {
              highestEmotion = emotions[emotionIndex].Type;
              highestConfidence = emotions[emotionIndex].Confidence;
            }

            if (emotionType in emotionAnalysis) {
              emotionAnalysis[emotionType] += emotions[emotionIndex].Confidence;
            } else {
              emotionAnalysis[emotionType] = emotions[emotionIndex].Confidence;
            }
          }

          if (
            jsonData.FaceDetails[faceIndex].Quality.Sharpness > highestSharpness
          ) {
            highestSharpness =
              jsonData.FaceDetails[faceIndex].Quality.Sharpness;
          }

          if (
            jsonData.FaceDetails[faceIndex].Quality.Brightness >
            highestBrightness
          ) {
            highestBrightness =
              jsonData.FaceDetails[faceIndex].Quality.Brightness;
          }
        }

        let romoExpression = "none";
        let romoEmotion = "indifferent";

        switch (highestEmotion.toLowerCase()) {
          case "anger":
            romoExpression = "angry";
            romoEmotion = "indifferent";
            break;

          case "calm":
            romoExpression = "curious";
            romoEmotion = "curious";
            break;

          case "disgusted":
            romoExpression = "scared";
            romoEmotion = "indifferent";
            break;

          case "happy":
            romoExpression = "happy";
            romoEmotion = "happy";
            break;

          case "sad":
            romoExpression = "sad";
            romoEmotion = "sad";
            break;

          case "surprised":
            romoExpression = "startled";
            romoEmotion = "indiffrent";
            break;
        }

        var messageText = '[{ "expression" : "' + romoExpression + '", "emotion" : "' + romoEmotion + '", "highestEmotion" : "' + highestEmotion.toLowerCase() + '", "higestConfidence" : ' + highestConfidence + ', "source": "' + source + '", "Sharpness" : ' + highestSharpness + ', "Brightness" : ' + highestBrightness + ', "image" : "' + imagekey  + '" }]';


        let message = solace.SolclientFactory.createMessage();

        message.setDestination(
          solace.SolclientFactory.createTopicDestination(
            subscriber.commandTopicName
          )
        );
        message.setBinaryAttachment(messageText);
        message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);

        subscriber.log(
          'Publishing message "' +
            messageText +
            '" to topic "' +
            subscriber.commandTopicName +
            '"...'
        );

        try {
          subscriber.session.send(message);
          subscriber.log("Message published to " + subscriber.commandTopicName);
        } catch (error) {
          subscriber.log(error.toString());
        }

        subscriber.log(
          "Highest emotion: " + highestEmotion + ", value: " + highestConfidence
        );
      } else {
        subscriber.log("Invalid response received.");
      }
    });

    // connect the session
    try {
      subscriber.session.connect();
    } catch (error) {
      subscriber.log(error.toString());
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

  subscriber.exit = function() {
    subscriber.unsubscribe();
    subscriber.disconnect();
    setTimeout(function() {
      process.exit();
    }, 1000); // wait for 1 second to finish
  };

  return subscriber;
}

export default TopicSubscriber;
