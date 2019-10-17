# Romo Robot Demo

## What does this demonstrate?

A demo of a multi-protocol event-driven microservices powered robot.
  
### Solace PubSub+ features used
- [MQTT](https://docs.solace.com/Open-APIs-Protocols/MQTT/MQTT-get-started.htm)
- [REST](https://docs.solace.com/Open-APIs-Protocols/REST-get-start.htm#contentBody)
- [WebSockets Messaging](https://docs.solace.com/Solace-PubSub-Messaging-APIs/JavaScript-API/Web-Messaging-Concepts/Web-Messaging-Architectures.htm)

## Application Flow Diagram
![Application Flow](/docs/SUNCOR-DEMO-APP-DIAGRAM.png "Application Flow")

## Contents

This repository contains:

1. **[image-to-s3](image-to-s3/):** A ReactJS application that both controls the demo session and displays station data
2. **[rekognition-lambda](rekognition-lambda/):** A ReactJS application that simulates a gas-pump on your mobile phone
3. **[romo-emotion-controller](romo-emotion-controller/):** A ReactJS application that simulates a gas-pump on your mobile phone
4. **[web-ui](web-ui/):** A ReactJS application that simulates a gas-pump on your mobile phone


## Checking out

To check out the project, clone this GitHub repository:

```
git clone https://github.com/solacese/mqtt-gas-pump
cd mqtt-gas-pump
```

## Running the Demo

### To run the demo, you'll first need to edit a few config files:

```
dashboard/src/shared-components/solace/pubsubplus-config-EDITME.js
```
This config file provides the details to connect to your Solace PubSub+ broker.  Fill it out using the details found in the "Solace Web Messaging" section of the "Connect" tab on your cloud broker's management portal.  You'll probably want to use the Secure WebSocket URI.  As for "login_topic" and "start_topic," this is a matter of preference; the app is configured to publish messages on these topics. 

```
mobile-app/src/shared-components/clients/mqtt-config-EDITME.js
```
Similarly, this is another config file that provides the details to connect to your Solace PubSub+ broker.  This file is used by an MQTT client.  Fill it out using the details found in the "MQTT" section of the "Connect" tab on your cloud broker's management portal.  For "mqtt_host," use the hostname of your broker—excluding the protocol prefix and port (e.g. somejumbleofletters.messaging.solace.cloud).  For "mqtt_port," use the port from the WebSocket Secured MQTT Host data URI.  
   
### Next, you'll need to make sure you have parcel installed for running your dev server and/or building the app:
```
npm install -g parcel-bundler
```
Parcel is awesome for JS development, check it out [here](https://parceljs.org/getting_started.html)

### Once you have parcel installed, you can run the following commands from inside either of the two apps to run the server locally or build the app for distribution:
```
npm run dev
npm run build
```
The output from the build command will be found in the dist/ folder at the root level of the app.  An easy way to host these files is to upload them to S3 and use the bucket for [static website hosting](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html).

### My servers are running, what now?
Once you have the servers running for both the dashboard app and the mobile app, you'll want to navigate to the homepage of the dashboard server and follow the flow as prompted by the app.  

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

See the list of [contributors](https://github.com/solacese/machine-learning-demo/graphs/contributors) who participated in this project.

## License

This project is licensed under the Apache License, Version 2.0. - See the [LICENSE](LICENSE) file for details.

## Resources

For more information try these resources:

- The Solace Developer Portal website at: http://dev.solace.com
- Get a better understanding of [Solace technology](http://dev.solace.com/tech/).
- Check out the [Solace blog](http://dev.solace.com/blog/) for other interesting discussions around Solace technology
- Ask the [Solace community.](http://dev.solace.com/community/)
