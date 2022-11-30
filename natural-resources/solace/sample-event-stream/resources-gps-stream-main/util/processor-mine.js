const solace = require('solclientjs').debug
const packagejson = require('../package.json')
const Subscriber = require("./subscriber")


class Processor {
    constructor(publisher, throttle, verbose) {
        this.publisher = publisher
        this.subscriber = new Subscriber(throttle, verbose)
        this.source_session = null
        this.verbose = verbose
    }

    log(line) {
        let now = new Date();
        let time = [("0" + now.getHours()).slice(-2), ("0" + now.getMinutes()).slice(-2), ("0" + now.getSeconds()).slice(-2)];
        let timestamp = "[" + time.join(":") + "] ";
        console.log(timestamp + line);
    }

    start() {
      // Connect to destination broker Solace
      this.publisher.connect()
          .then((session) => {

            //DEFINE CONSTANTS THAT APPLY TO ALL TRANSACTIONS
            const TOPIC_DIVIDER = "/";
            const TOPIC_ROOT = "acmeResources";
            const DOMAIN_NAME = "ops";
            const EVENT_NAME = "train_trak";
            const EVENT_TYPE = "gps";
            const VERSION_NUMBER = "v2";
            const ASSETS_DATAFILE = require('./assets.json');
            const GPS_DATAFILE = require('./gps.json');
            const NUMBER_OF_ASSETS_IN_DATAFILE = ASSETS_DATAFILE.length;
            const NUMBER_OF_GPS_COORDINATES_IN_DATAFILE = GPS_DATAFILE.length;
            const NUMBER_OF_ITEMS_IN_ORDER = 5;
            const DELAY_BETWEEN_MSGS = 200;  // wait time in millis

            var route, trainId, orderId, associateId, direction, cardLastFour, stat, longitude, latitude;

            //Loop here so it sends a constant stream of transactions
            for (let i = 0; i < NUMBER_OF_GPS_COORDINATES_IN_DATAFILE; i++) {
              route = Math.floor(Math.random() * 68 + 3487); // this is because enums in EP event def are 3487 to 3555
              trainId = Math.floor(Math.random() * 23984 + 1); //randomly generate customer id
              orderId = Math.floor(Math.random() * 239840 + 1); //randomly generate order id
              associateId = Math.floor(Math.random() * 2398 + 1); //randomly generate associate id
              direction = Math.floor(Math.random() * 25 + 1); //randomly generate PoS location id
              cardLastFour = Math.floor(Math.random() * 10000 );  //randomly generate PoS location id TODO PAD IT WITH ZEROS
              stat = "OK"; //TODO make this random.  Needs to link to the cardLastFour (e.g. if paymenttype is cash, then cardLast4 is null
              latitude = GPS_DATAFILE[i].latitude; //get the current latitude from the GPS Data File
              longitude = GPS_DATAFILE[i].longitude; //get the current longitude from the GPS Data File
              

            //----------ASSET INITIATES FILLING-------------------------------------------------------------
            // Create topic structure of the form
            // acmeResources/ops/train_trak/gps/v2/{route}/{trainID}/{lat}/{lon}/{dir}/{status}
            var assetMovementVerb = "fill-initiated";
            var messageTopic = TOPIC_ROOT + TOPIC_DIVIDER +
                DOMAIN_NAME + TOPIC_DIVIDER +
                EVENT_NAME + TOPIC_DIVIDER +
                EVENT_TYPE + TOPIC_DIVIDER +
                //assetMovementVerb + TOPIC_DIVIDER +
                VERSION_NUMBER + TOPIC_DIVIDER +
                route + TOPIC_DIVIDER +
                trainId + TOPIC_DIVIDER +
                latitude + TOPIC_DIVIDER +
                longitude + TOPIC_DIVIDER +
                direction + TOPIC_DIVIDER +
                stat;

            //Generate customer-initiated Message Body -example pasted at end of code
            var messageBody = new Object();
            messageBody.trainId = trainId;
            messageBody.transactionState = assetMovementVerb;
            messageBody.route = route;
            messageBody.direction = direction;
            messageBody.status = stat;

            var messageBodyString = JSON.stringify(messageBody);
            this.verbose ? this.log(`Ready to publish ${messageBodyString} data to ${messageTopic}`) : null
            this.publisher.publish(messageBodyString, messageTopic);

            wait(DELAY_BETWEEN_MSGS);  //pause between messages


            //----------ASSET COMPLETES FILLING-------------------------------------------------------------
            // Create topic structure of the form
            // acmeResources/ops/train_trak/gps/v2/{route}/{trainID}/{lat}/{lon}/{dir}/{status}
        //     var assetMovementVerb = "fill-completed";
        //     var messageTopic = TOPIC_ROOT + TOPIC_DIVIDER +
        //         DOMAIN_NAME + TOPIC_DIVIDER +
        //         EVENT_NAME + TOPIC_DIVIDER +
        //         EVENT_TYPE + TOPIC_DIVIDER +
        //         //assetMovementVerb + TOPIC_DIVIDER +
        //         VERSION_NUMBER + TOPIC_DIVIDER +
        //         route + TOPIC_DIVIDER +
        //         trainId + TOPIC_DIVIDER +
        //         latitude + TOPIC_DIVIDER +
        //         longitude + TOPIC_DIVIDER +
        //         direction + TOPIC_DIVIDER +
        //         stat;

        //     //Update transaction state
        //   messageBody.transactionState = assetMovementVerb;
        //     //Generate customer-initiated Message Body -example pasted at end of code
        //   var assets = new Array();
        //  for (let i = 0; i < NUMBER_OF_ITEMS_IN_ORDER; i++) {
        //    var randomAssetIndex = Math.floor(Math.random() * NUMBER_OF_ASSETS_IN_DATAFILE );
        //    assets[i] = ASSETS_DATAFILE[randomAssetIndex];
        //  }
        //      messageBody.assets = assets;

        //     //Send the message
        //     var messageBodyString = JSON.stringify(messageBody);
        //     this.verbose ? this.log(`Ready to publish ${messageBodyString} data to ${messageTopic}`) : null
        //     this.publisher.publish(messageBodyString, messageTopic);

        //    wait(DELAY_BETWEEN_MSGS);  //pause between messages

            //----------ASSET INITIATES EMPTYING-------------------------------------------------------------
            // Create topic structure of the form
            // acmeResources/ops/train_trak/gps/v2/{route}/{trainID}/{lat}/{lon}/{dir}/{status}
          //   var assetMovementVerb = "empty-initiated";
          //   var messageTopic = TOPIC_ROOT + TOPIC_DIVIDER +
          //       DOMAIN_NAME + TOPIC_DIVIDER +
          //       EVENT_NAME + TOPIC_DIVIDER +
          //       EVENT_TYPE + TOPIC_DIVIDER +
          //       //assetMovementVerb + TOPIC_DIVIDER +
          //       VERSION_NUMBER + TOPIC_DIVIDER +
          //       route + TOPIC_DIVIDER +
          //       trainId + TOPIC_DIVIDER +
          //       latitude + TOPIC_DIVIDER +
          //       longitude + TOPIC_DIVIDER +
          //       direction + TOPIC_DIVIDER +
          //       stat;

          //   //Update transaction state
          //   messageBody.transactionState = assetMovementVerb;
          //   messageBody.assets = null;
          //   messageBody.stat = stat;
          //   messageBody.cardLastFour = cardLastFour;


          //   var messageBodyString = JSON.stringify(messageBody);
          //   this.verbose ? this.log(`Ready to publish ${messageBodyString} data to ${messageTopic}`) : null
          //   this.publisher.publish(messageBodyString, messageTopic);

          //  wait(DELAY_BETWEEN_MSGS);  //pause between messages

           //----------ASSET COMPLETES EMPTYING-------------------------------------------------------------
            // Create topic structure of the form
            // acmeResources/ops/train_trak/gps/v2/{route}/{trainID}/{lat}/{lon}/{dir}/{status}
          //   var assetMovementVerb = "empty-completed";
          //   var messageTopic = TOPIC_ROOT + TOPIC_DIVIDER +
          //       DOMAIN_NAME + TOPIC_DIVIDER +
          //       EVENT_NAME + TOPIC_DIVIDER +
          //       EVENT_TYPE + TOPIC_DIVIDER +
          //       //assetMovementVerb + TOPIC_DIVIDER +
          //       VERSION_NUMBER + TOPIC_DIVIDER +
          //       route + TOPIC_DIVIDER +
          //       trainId + TOPIC_DIVIDER +
          //       latitude + TOPIC_DIVIDER +
          //       longitude + TOPIC_DIVIDER +
          //       direction + TOPIC_DIVIDER +
          //       stat;

          //   //Update transaction state
          //   messageBody.transactionState = assetMovementVerb;
          //   messageBody.assets = null;
          //   messageBody.stat = stat;
          //   messageBody.cardLastFour = cardLastFour;


          //   var messageBodyString = JSON.stringify(messageBody);
          //   this.verbose ? this.log(`Ready to publish ${messageBodyString} data to ${messageTopic}`) : null
          //   this.publisher.publish(messageBodyString, messageTopic);

          //  wait(DELAY_BETWEEN_MSGS);  //pause between messages
        }
          })
        
          .catch((error) => {
            this.log(error)
          });
    }

    /**
     * Terminate connection to the all broker
     */
    terminate() {
      this.log(`Terminating Publisher and Subscriber...`);
      this.publisher.terminate()
      this.subscriber.terminate()
      setTimeout(function () {
      }, 1000); // wait for 1 second to finish
  }

}

module.exports = Processor;


function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}
/*{
  "customerId": 468,
  "transactionState": 759,
  "storeId": 68,
  "products": [
    {
      "description": "Savoy Cabbage",
      "sku": 349832489,
      "quantity": 1,
      "price": 1.93,
      "currency": "USD"
    },
     {
       "description": "Savoy Cabbage",
       "sku": 349832489,
       "quantity": 1,
       "price": 1.93,
       "currency": "USD"
     }
  ],
  "associateId": 591,
  "posId": 432,
  "retailOrderNumber": 627,
  "paymentType": 704,
  "cardLastFour": 234,
  "shipTo": {
    "name": "ABCDEFGHIJKLMNO",
    "address": "ABCDEF",
    "city": "ABCDEFGHIJKLMNOPQRSTUVWX",
    "state": "ABCDEFGHIJKLMNOPQRSTU",
    "zip": "ABCDEFGHIJKLMNOPQRSTUV",
    "storeId": -48
  },
  "billTo": {
    "name": "ABCDEFGHIJKL",
    "address": "ABCDEFGHIJKLMN",
    "city": "ABCDEFGHIJ",
    "state": "ABCDEFGHIJKLMNOPQR",
    "zip": "ABCDEFGHIJKLMNOP"
  }
}*/
