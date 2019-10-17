/**
 * App.js
 * Initializes the queues and message consumer needed to persist image capture events in S3.
 * Code is a modified copy of the Node.js APIs Publish/Subscribe tutorial.
 * @author Andrew Roberts
 */

// load regenerator-runtime and env variables before anything else
import "regenerator-runtime";
import dotenv from "dotenv";
let result = dotenv.config({ path: 'env/dev.env' });
if (result.error) {
  throw result.error;
}

import solace from "solclientjs";
import SEMPClient from "./SEMPClient";
import QueueConsumer from "./QueueConsumer";

async function run(){
  // Solace initialization
  let factoryProps = new solace.SolclientFactoryProperties();
  factoryProps.profile = solace.SolclientFactoryProfiles.version10;
  solace.SolclientFactory.init(factoryProps);
  solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

  // provision the queue and add the appropriate subscriptions required to read image events
  let client = SEMPClient(process.env.SEMP_MSG_VPN);
  try {
    await client.provisionQueue(process.env.IMAGE_INGRESS_QUEUE_NAME);
    await client.provisionQueueSubscription(process.env.IMAGE_INGRESS_QUEUE_NAME, process.env.IMAGE_INGRESS_TOPIC);
  } catch (err) {
    console.log(err);
    process.exit();
  }

  // initialize a queue consumer that consumes images from the queue we just provisioned
  var imageConsumer = QueueConsumer(solace, process.env.IMAGE_INGRESS_QUEUE_NAME);
  // and open a connect with the Solace PubSub+ Broker
  imageConsumer.run();

  // program will run until it is told to exit
  imageConsumer.log("Press Ctrl-C to exit");
  process.stdin.resume();

  process.on("SIGINT", function() {
    "use strict";
    imageConsumer.exit();
  });
}

run();
