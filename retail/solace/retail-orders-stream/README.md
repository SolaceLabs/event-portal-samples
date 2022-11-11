# Event API: retail-order Data

This CLI tool publishes a stream of real-time retail-order Data on predefined destination Solace PubSub+ Broker

## How to run

`npx @event-api/retail-order [OPTIONS]`. Note: Still not published! replace `@event-api` with `@tamimi-org`

Below are the following options

| Flag                | Description                                                                             | Type                     | Default               |
| ------------------- | --------------------------------------------------------------------------------------- | ------------------------ | --------------------- |
| -v, --version       | outputs the version number                                                              |                          |                       |
| -h, --host          | Destination Solace PubSub+ Broker to publish on websocket port in the form of host:port | `<host>:<port>`          | `ws://localhost:8008` |
| -u, --user          | Destination Solace PubSub+ Broker username:password                                     | `<username>:<password> ` | `default:default`     |
| -m, --msgVPN        | Destination Solace PubSub+ Broker message VPN                                           | `<value>`                | `default`             |
| -d, --documentation | Launch hosted AsyncAPI documentation                                                    |                          |                       |
| --verbose           | Verbose output logs                                                                     | `bool`                   | `False`               |
| --no-throttle       | Skip throttling of publishing to destination broker                                     |                          |                       |
| --help              | display help for command                                                                |                          |                       |

## Development

To run this cli tool locally
- `npm install`
- `node index --help`

To contribute to this CLI tool

- Update package.json containing the necessary metadata needed to define the cli tool
  - Update description in package.json
  - Update source_broker in package.json
  - Update asyncAPI documentation in package.json
  - Update version in package.json
- `npm publish --access public`

Note: If you dont have access to publish to the @event-api npm registry, contact the admins

## To-do

- Throttle logic in Message callback function of subscriber
  - Message eliding?
