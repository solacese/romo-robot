/**
 * App.js
 * Initializes
 * Code is a modified copy of the Node.js APIs Publish/Subscribe tutorial.
 * @author Andrew Roberts
 */

// load regenerator-runtime and env variables before anything else
import "regenerator-runtime";
import dotenv from "dotenv";
let result = dotenv.config({ path: "env/dev.env" });
if (result.error) {
  throw result.error;
}

import solace from "solclientjs";
import TopicSubscriber from "./TopicSubscriber";

async function run() {
  // Solace initialization
  let factoryProps = new solace.SolclientFactoryProperties();
  factoryProps.profile = solace.SolclientFactoryProfiles.version10;
  solace.SolclientFactory.init(factoryProps);
  solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

  // initialize an image consumer that consumes from the queue we just provisioned
  let subscriber = TopicSubscriber(
    solace,
    "T/imageAnalysis/>",
    "T/MQTTRomo/all/command/character"
  );
  // and open a connect with the Solace PubSub+ Broker
  subscriber.run();

  // program will run until it is told to exit
  subscriber.log("Press Ctrl-C to exit");
  process.stdin.resume();

  process.on("SIGINT", function() {
    "use strict";
    subscriber.exit();
  });
}

run();
