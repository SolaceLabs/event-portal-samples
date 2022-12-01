const solace = require('solclientjs').debug
const packagejson = require('../package.json')

class Subscriber {
    constructor(throttle, verbose) {
        this.host = packagejson.source_broker.host
        this.username = packagejson.source_broker.username
        this.password = packagejson.source_broker.password
        this.vpn = packagejson.source_broker.msgVPN
        this.timeNow = new Date().getSeconds()

        // Default to wildcard subscription given topic prefix in package.json
        this.topicSub = packagejson.source_broker.topicPrefix ? `${packagejson.source_broker.topicPrefix}/>` : '>'
        this.session = null

        // Verbose logging
        this.verbose = verbose
        
        // Throttling
        this.throttle = throttle
        this.count = 0
    }
 
    // Function that outputs to console with a timestamp
    log(line) {
        let now = new Date();
        let time = [("0" + now.getHours()).slice(-2), ("0" + now.getMinutes()).slice(-2), ("0" + now.getSeconds()).slice(-2)];
        let timestamp = "[" + time.join(":") + "] ";
        console.log(timestamp + line);
    }

    /**
     * Asynchronous function that connects to the Solace Broker and returns a promise.
     */
     async connect(publisher) {
      return new Promise((resolve, reject) => {
        // Initialize factory with the most recent API defaults
        let factoryProps = new solace.SolclientFactoryProperties();
        factoryProps.profile = solace.SolclientFactoryProfiles.version10;
        solace.SolclientFactory.init(factoryProps);

        // enable console logging depending on verbose flag. Default to INFO level
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
          this.subscribe()
          resolve(sessionEvent);
        });

        //Message callback function
        this.session.on(solace.SessionEventCode.MESSAGE, message => {
          let topicName = message.getDestination().getName();
          if (this.throttle) {
            let temp = new Date().getSeconds()
            if (temp - this.timeNow > 1){
              // Get the topic name from the message's destination
              this.verbose ? this.log(`Received message from origin broker on topic: ${topicName}`) : null
              // Publish the message if the payload is not undefined
              message.getBinaryAttachment() ? publisher.publish(message.getBinaryAttachment(), topicName) : null
              this.timeNow = new Date().getSeconds()
            }
          } else {
            // Get the topic name from the message's destination
            this.verbose ? this.log(`Received message from origin broker on topic: ${topicName}`) : null
            // Publish the message if the payload is not undefined
            message.getBinaryAttachment() ? publisher.publish(message.getBinaryAttachment(), topicName) : null
          }
        });

        //SUBSCRIPTION ERROR implies that there was an error in subscribing on a topic
        this.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, sessionEvent => {
          this.log("Cannot subscribe to topic: " + sessionEvent.correlationKey);
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

    subscribe() {
      if (this.session != null) {
        this.log(`Subscribing to ${this.topicSub} on source broker`)
        try {
          this.session.subscribe(
              solace.SolclientFactory.createTopicDestination(this.topicSub),
              true, // generate confirmation when subscription is added successfully
              this.topicSub, // use topic name as correlation key
              10000 // 10 seconds timeout for this operation
          );
        } catch (error) {
            this.log(error.toString());
        }
      }
    }

    /**
     * Terminate connection to the broker
     */
    terminate() {
      this.log(`Disconnecting from ${this.host} Solace message broker...`);
      if (this.session !== null) {
        try {

          // Unsubscribe from topic
          try {
            this.session.unsubscribe(
              solace.SolclientFactory.createTopicDestination(this.topicSub), 
              true, // generate confirmation when subscription is removed successfully
              this.topicSub, // use topic name as correlation key
              10000 // 10 seconds timeout for this operation
            );
          } catch (error) {
            this.log(error.toString());
          }

          // Disconnect Session
          try {
            this.session.disconnect();
          } catch (error) {
            this.log(error.toString());
          }

        } catch (error) {
            throw new Error(error.toString())
        }
      } else {
        throw new Error('Cannot terminate session: not connected to Solace broker')
      }
      setTimeout(function () {
      }, 1000); // wait for 1 second to finish
  }
}

module.exports = Subscriber;
