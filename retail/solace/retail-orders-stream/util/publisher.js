const solace = require('solclientjs').debug

class Publisher {
    constructor(host, user, vpn, verbose) {
        this.host = host
        this.username = user.split(":")[0]
        this.password = user.split(":")[1]
        this.vpn = vpn
        this.session = null
        this.verbose = verbose

        // Verbose logging
        this.verbose = verbose
    }
 
    // Function that outputs to console with a timestamp
    log(line) {
        let now = new Date();
        let time = [("0" + now.getHours()).slice(-2), ("0" + now.getMinutes()).slice(-2), ("0" + now.getSeconds()).slice(-2)];
        let timestamp = "[" + time.join(":") + "] ";
        console.log(timestamp + line);
    }

    // Asynchronous function that connects to the Solace Broker and returns a promise.
    async connect() {
      return new Promise((resolve, reject) => {
        // Initialize factory with the most recent API defaults
        let factoryProps = new solace.SolclientFactoryProperties();
        factoryProps.profile = solace.SolclientFactoryProfiles.version10;
        solace.SolclientFactory.init(factoryProps);
        // enable logging to JavaScript console at WARN level
        // NOTICE: works only with ('solclientjs').debug
        this.verbose ? solace.SolclientFactory.setLogLevel(solace.LogLevel.DEBUG) : solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN)

        if (this.session !== null) {
          this.log('Already connected and ready to publish.');
          return
        }

        try {
          this.session = solace.SolclientFactory.createSession({
              url:      this.host,
              vpnName:  this.vpn,
              userName: this.username,
              password: this.password,
              connectRetries: 1,
          });
        } catch (error) {
          reject(error.toString())
        }
        // Assign callback functions for session event listeners

        //The UP_NOTICE dictates whether the session has been established
        this.session.on(solace.SessionEventCode.UP_NOTICE, sessionEvent => {
          this.log(`=== Successfully connected to ${this.host} and ready to publish ===`);
          resolve(sessionEvent);
        });

        //The CONNECT_FAILED_ERROR implies a connection failure
        this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, sessionEvent => {
          reject(`Connection failed to the message router: ${sessionEvent.infoStr} - check correct parameter values and connectivity!`);
        });

        //DISCONNECTED implies the client was disconnected
        this.session.on(solace.SessionEventCode.DISCONNECTED, sessionEvent => {
          this.log("Disconnected.");
          if (this.session !== null) {
              this.session.dispose();
              this.session = null;
          }
        });

        //REJECTED_MESSAGE implies that the broker has rejected the message
        this.session.on(solace.SessionEventCode.REJECTED_MESSAGE_ERROR, sessionEvent => {
          this.log("Delivery of message with correlation key = " + sessionEvent.correlationKey + " rejected, info: " + sessionEvent.infoStr);
        });
        // connect the session
        try {
          this.verbose ? this.log(`Attempting connection to ${this.host}`) : null
          this.session.connect();
        } catch (error) {
          this.log(error.toString());
        }
      });
    }

    // Publish function to publish messages to the destination broker
    publish(body, topic) {
      if (this.session !== null) {
        var messageText = body
        var message = solace.SolclientFactory.createMessage();
        message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
        message.setBinaryAttachment(messageText);
        message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
        this.log(`Publishing on topic ${topic} to: ${this.host}`)
        try {
            this.session.send(message);
        } catch (error) {
            throw new Error(error.toString())
        }
      } else {
        throw new Error('Cannot publish: session not established to destination broker')
      }
    }

    // Terminate connection to the broker
    terminate() {
      this.log(`Disconnecting from ${this.host} Solace message broker...`);
      if (this.session !== null) {
        try {
            this.session.disconnect();
        } catch (error) {
            throw new Error(error.toString())
        }
      } else {
        throw new Error('Cannot terminate publisher: not connected to Solace broker')
      }
      setTimeout(function () {
      }, 1000); // wait for 1 second to finish
  }

}

module.exports = Publisher;
