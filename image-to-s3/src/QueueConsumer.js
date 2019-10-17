/**
 * QueueConsumer
 * Message consumer that persists image capture events in S3
 * @author Andrew Roberts
 */

import * as S3Client from "./S3Client";

function QueueConsumer(solaceModule, queueName) {
  let solace = solaceModule;
  let consumer = {};
  consumer.session = null;
  consumer.queueName = queueName;
  consumer.consuming = false;

  consumer.log = function(line) {
    let now = new Date();
    let time = [
      ("0" + now.getHours()).slice(-2),
      ("0" + now.getMinutes()).slice(-2),
      ("0" + now.getSeconds()).slice(-2)
    ];
    let timestamp = "[" + time.join(":") + "] ";
    console.log(timestamp + line);
  };

  consumer.log(
    '\n*** Consumer to queue "' +
      consumer.queueName +
      '" is ready to connect ***'
  );

  // main function
  consumer.run = function(argv) {
    consumer.connect(argv);
  };

  // Establishes connection to Solace message router
  consumer.connect = function(argv) {
    if (consumer.session !== null) {
      consumer.log("Already connected and ready to consume messages.");
      return;
    }
    // create session
    try {
      consumer.session = solace.SolclientFactory.createSession({
        // solace.SessionProperties
        url: process.env.SOLACE_URI,
        vpnName: process.env.SOLACE_VPN,
        userName: process.env.SOLACE_USER,
        password: process.env.SOLACE_PASSWORD
      });
    } catch (error) {
      consumer.log(error.toString());
    }
    // define session event listeners
    consumer.session.on(solace.SessionEventCode.UP_NOTICE, function(
      sessionEvent
    ) {
      consumer.log(
        "=== Successfully connected and ready to start the message consumer. ==="
      );
      consumer.startConsume();
    });
    consumer.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function(
      sessionEvent
    ) {
      consumer.log(
        "Connection failed to the message router: " +
          sessionEvent.infoStr +
          " - check correct parameter values and connectivity!"
      );
    });
    consumer.session.on(solace.SessionEventCode.DISCONNECTED, function(
      sessionEvent
    ) {
      consumer.log("Disconnected.");
      consumer.consuming = false;
      if (consumer.session !== null) {
        consumer.session.dispose();
        consumer.session = null;
      }
    });
    // connect the session
    try {
      consumer.session.connect();
    } catch (error) {
      consumer.log(error.toString());
    }
  };

  // Starts consuming from a queue on Solace message router
  consumer.startConsume = function() {
    if (consumer.session !== null) {
      if (consumer.consuming) {
        consumer.log(
          'Already started consumer for queue "' +
            consumer.queueName +
            '" and ready to receive messages.'
        );
      } else {
        consumer.log("Starting consumer for queue: " + consumer.queueName);
        try {
          // Create a message consumer
          consumer.messageConsumer = consumer.session.createMessageConsumer({
            // solace.MessageConsumerProperties
            queueDescriptor: {
              name: consumer.queueName,
              type: solace.QueueType.QUEUE
            },
            acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT // Enabling Client ack
          });
          // Define message consumer event listeners
          consumer.messageConsumer.on(
            solace.MessageConsumerEventName.UP,
            function() {
              consumer.consuming = true;
              consumer.log("=== Ready to receive messages. ===");
            }
          );
          consumer.messageConsumer.on(
            solace.MessageConsumerEventName.CONNECT_FAILED_ERROR,
            function() {
              consumer.consuming = false;
              consumer.log(
                '=== Error: the message consumer could not bind to queue "' +
                  consumer.queueName +
                  '" ===\n   Ensure this queue exists on the message router vpn'
              );
            }
          );
          consumer.messageConsumer.on(
            solace.MessageConsumerEventName.DOWN,
            function() {
              consumer.consuming = false;
              consumer.log("=== The message consumer is now down ===");
            }
          );
          consumer.messageConsumer.on(
            solace.MessageConsumerEventName.DOWN_ERROR,
            function() {
              consumer.consuming = false;
              consumer.log(
                "=== An error happened, the message consumer is down ==="
              );
            }
          );
          // Define message received event listener
          consumer.messageConsumer.on(
            solace.MessageConsumerEventName.MESSAGE,
            async function receivedMessage(message) {
              consumer.log(`Received image.`);
              let file_jpeg = Buffer.from(message.getBinaryAttachment(), "binary"); // not base64, not utf-8... 
              try {
                let res = await S3Client.uploadFile(file_jpeg);
                // Need to explicitly ack otherwise it will not be deleted from the message router
                message.acknowledge();
              } catch(err) {
                console.log(err);
              }
            }
          );
          // Connect the message consumer
          consumer.messageConsumer.connect();
        } catch (error) {
          consumer.log(error.toString());
        }
      }
    } else {
      consumer.log(
        "Cannot start the queue consumer because not connected to Solace message router."
      );
    }
  };

  // Disconnects the consumer from queue on Solace message router
  consumer.stopConsume = function() {
    if (consumer.session !== null) {
      if (consumer.consuming) {
        consumer.consuming = false;
        consumer.log(
          "Disconnecting consumption from queue: " + consumer.queueName
        );
        try {
          consumer.messageConsumer.disconnect();
          consumer.messageConsumer.dispose();
        } catch (error) {
          consumer.log(error.toString());
        }
      } else {
        consumer.log(
          'Cannot disconnect the consumer because it is not connected to queue "' +
            consumer.queueName +
            '"'
        );
      }
    } else {
      consumer.log(
        "Cannot disconnect the consumer because not connected to Solace message router."
      );
    }
  };

  // Gracefully disconnects from Solace message router
  consumer.disconnect = function() {
    consumer.log("Disconnecting from Solace message router...");
    if (consumer.session !== null) {
      try {
        consumer.session.disconnect();
      } catch (error) {
        consumer.log(error.toString());
      }
    } else {
      consumer.log("Not connected to Solace message router.");
    }
  };

  /**
   * exit
   * 🚨RUN!  THE CONTAINER'S ABOUT TO BLOW 🚨
   */
  consumer.exit = function() {
    consumer.stopConsume();
    consumer.disconnect();
    setTimeout(function() {
      process.exit();
    }, 1000); // wait for 1 second to finish
  };

  return consumer;
}

export default QueueConsumer;
