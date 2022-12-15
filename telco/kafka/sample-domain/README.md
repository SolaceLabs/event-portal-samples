ACME Telco is going through a digital transformation. Existing systems are tightly coupled and fragile. ACME wants to decouple systems to become more agile as well as taking advantage of Cloud Hosted applications. This demo and related use cases are for the ACME Telco demo telecommunications provider and showcase a range of operational tasks typical for the industry.

Use Case 1: Billing Enquiry

A Bill Issued event is published by the Billing Application at the conclusion of the billing period.

A converged consumer uses their mobile app to retrieve their latest bill that includes charges for mobile and cable services. This triggers the Billing Enquiry Received event. Data is provided by the Billing Application.

The customer is not clear about the charges and calls the call centre, they will be identified with their phone number. This triggers the Customer Verified event which is published by the Customer Management Application which publishes the profile.

The agent retrieves the invoice information with the same event for Billing (Billing Enquiry Received). 

The Recommendation application subscribes to the Billing Enquiry Received event and generates/provides a recommendation to the agent.

The marketing journey triggers an email to be sent to the customer.

All Billing events are subscribed to by the Customer 360 Customer Data Platform.

Use Case 2: Real-time Provisioning

A pre-paid customer goes to a local shop to have their sim card balance topped up. Data is entered into the In-Store Application and a SIM Top Up Request event is published.

Customer details are validated in the Customer Management application and a Customer Verified event is published.

The SIM Top Up Request event is subscribed to by the Provisioning system seamlessly via the event mesh.

The Provisioning system publishes an Order Received event which is subscribed to by the Customer 360 Customer Data Platform and Order Management system. It is also subscribed to by the Offers Engine which tailors deals based on what we know about the customer.

Once provisioning is complete, a Line Provisioned event is sent to the Mobile Self-Service application to notify the customer.


Use Case 3: Order Management (New Orders)

The Order Management application subscribes to Order Received events and validates order details from the In-Store Application.

The Credit Check application also subscribes to Order Received events and checks the customer’s credit status to ensure they’re good for payment.

The Product Inventory application also subscribes to Order Received events and manages the inventory level check and distribution.

The Payment application subscribes to Payment Received events published by the In-Store Application and processes the payment.

The Customer 360 Customer Data Platform subscribes to the Payment Received event for analytics and to complete the process.