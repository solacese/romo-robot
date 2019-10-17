# Romo Robot Demo

## What does this demonstrate?

A demo of a multi-protocol event-driven microservices powered robot.
  
### Solace PubSub+ features used
- [MQTT](https://docs.solace.com/Open-APIs-Protocols/MQTT/MQTT-get-started.htm)
- [REST](https://docs.solace.com/Open-APIs-Protocols/REST-get-start.htm#contentBody)
- [WebSockets Messaging](https://docs.solace.com/Solace-PubSub-Messaging-APIs/JavaScript-API/Web-Messaging-Concepts/Web-Messaging-Architectures.htm)

## Application Flow Diagram
TODO

## Contents

This repository contains:

1. **[image-to-s3](image-to-s3/):** service that uploads raw data from image events as a jpg to s3
2. **[rekognition-lambda](rekognition-lambda/):** service that takes jpg formatted images from s3 and uses rekognition to detect emotion
3. **[romo-emotion-controller](romo-emotion-controller/):** transforms rekognition responses into romo readable form
4. **[web-ui](web-ui/):** front end 


## Checking out

To check out the project, clone this GitHub repository:

```
git clone https://github.com/solacese/romo-robot
cd romo-robot
```

## Running the Demo

TODO

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

TODO

## License

This project is licensed under the Apache License, Version 2.0. - See the [LICENSE](LICENSE) file for details.

## Resources

For more information try these resources:

- The Solace Developer Portal website at: http://dev.solace.com
- Get a better understanding of [Solace technology](http://dev.solace.com/tech/).
- Check out the [Solace blog](http://dev.solace.com/blog/) for other interesting discussions around Solace technology
- Ask the [Solace community.](http://dev.solace.com/community/)
