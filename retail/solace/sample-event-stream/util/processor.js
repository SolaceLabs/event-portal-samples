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
            const TOPIC_ROOT = "acme-retail";
            const DOMAIN_NAME = "store-ops";
            const EVENT_NAME = "retail-order";
            const VERSION_NUMBER = "v1";
            const PRODUCTS_DATAFILE = require('./products.json');
            const NUMBER_OF_PRODUCTS_IN_DATAFILE = PRODUCTS_DATAFILE.length;
            const NUMBER_OF_ITEMS_IN_ORDER = 5;
            const DELAY_BETWEEN_MSGS = 5000;  // wait time in millis

            var storeLocation, customerId, orderId, associateId, posId, cardLastFour, paymentType;

            //TODO Loop here so it sends a constant stream of transactions
            storeLocation = Math.floor(Math.random() * 68 + 3487); // this is because enums in EP event def are 3487 to 3555
            customerId = Math.floor(Math.random() * 23984 + 1); //randomly generate customer id
            orderId = Math.floor(Math.random() * 239840 + 1); //randomly generate order id
            associateId = Math.floor(Math.random() * 2398 + 1); //randomly generate associate id
            posId = Math.floor(Math.random() * 25 + 1); //randomly generate PoS location id
            cardLastFour = Math.floor(Math.random() * 10000 );  //randomly generate PoS location id TODO PAD IT WITH ZEROS
            paymentType = "credit"; //TODO make this random.  Needs to link to the cardLastFour (e.g. if paymenttype is cash, then cardLast4 is null

            //----------CUSTOMER INITIATES TRANSACTION-------------------------------------------------------------
            // Create topic structure of the form
            // acme-retail/store-ops/retail-order/customer-initiated/v1/{storeLocation}/{customerId}/{orderId}
            var retailOrderVerb = "customer-initiated";
            var messageTopic = TOPIC_ROOT + TOPIC_DIVIDER +
                DOMAIN_NAME + TOPIC_DIVIDER +
                EVENT_NAME + TOPIC_DIVIDER +
                retailOrderVerb + TOPIC_DIVIDER +
                VERSION_NUMBER + TOPIC_DIVIDER +
                storeLocation + TOPIC_DIVIDER +
                customerId + TOPIC_DIVIDER +
                orderId;

            //Generate customer-initiated Message Body -example pasted at end of code
            var messageBody = new Object();
            messageBody.customerId = customerId;
            messageBody.transactionState = retailOrderVerb;
            messageBody.storeId = storeLocation;
            messageBody.associateId = associateId;
            messageBody.retailOrderNumber = orderId;

            var messageBodyString = JSON.stringify(messageBody);
            this.verbose ? this.log(`Ready to publish ${messageBodyString} data to ${messageTopic}`) : null
            this.publisher.publish(messageBodyString, messageTopic);

            wait(DELAY_BETWEEN_MSGS);  //pause between messages


            //----------CUSTOMER COMPLETES SHOPPING-------------------------------------------------------------
            // Create topic structure of the form
            // acme-retail/store-ops/retail-order/customer-completed/v1/{storeLocation}/{customerId}/{orderId}
            var retailOrderVerb = "customer-completed";
            var messageTopic = TOPIC_ROOT + TOPIC_DIVIDER +
                DOMAIN_NAME + TOPIC_DIVIDER +
                EVENT_NAME + TOPIC_DIVIDER +
                retailOrderVerb + TOPIC_DIVIDER +
                VERSION_NUMBER + TOPIC_DIVIDER +
                storeLocation + TOPIC_DIVIDER +
                customerId + TOPIC_DIVIDER +
                orderId;

            //Update transaction state
          messageBody.transactionState = retailOrderVerb;
            //Generate customer-initiated Message Body -example pasted at end of code
          var products = new Array();
         for (let i = 0; i < NUMBER_OF_ITEMS_IN_ORDER; i++) {
           var randomProductIndex = Math.floor(Math.random() * NUMBER_OF_PRODUCTS_IN_DATAFILE );
           products[i] = PRODUCTS_DATAFILE[randomProductIndex];
         }
             messageBody.products = products;

            //Send the message
            var messageBodyString = JSON.stringify(messageBody);
            this.verbose ? this.log(`Ready to publish ${messageBodyString} data to ${messageTopic}`) : null
            this.publisher.publish(messageBodyString, messageTopic);

           wait(DELAY_BETWEEN_MSGS);  //pause between messages

            //----------CUSTOMER PAYS-------------------------------------------------------------
            // Create topic structure of the form
            // acme-retail/store-ops/retail-order/customer-paid/v1/{storeLocation}/{customerId}/{orderId}
            var retailOrderVerb = "customer-paid";



            var messageTopic = TOPIC_ROOT + TOPIC_DIVIDER +
                DOMAIN_NAME + TOPIC_DIVIDER +
                EVENT_NAME + TOPIC_DIVIDER +
                retailOrderVerb + TOPIC_DIVIDER +
                VERSION_NUMBER + TOPIC_DIVIDER +
                storeLocation + TOPIC_DIVIDER +
                customerId + TOPIC_DIVIDER +
                orderId;

            //Update transaction state
            messageBody.transactionState = retailOrderVerb;
            messageBody.products = null;
            messageBody.paymentType = paymentType;
            messageBody.cardLastFour = cardLastFour;


            var messageBodyString = JSON.stringify(messageBody);
            this.verbose ? this.log(`Ready to publish ${messageBodyString} data to ${messageTopic}`) : null
            this.publisher.publish(messageBodyString, messageTopic);

           wait(DELAY_BETWEEN_MSGS);  //pause between messages


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
