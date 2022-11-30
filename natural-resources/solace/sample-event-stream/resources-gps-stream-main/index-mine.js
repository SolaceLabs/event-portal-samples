#!/usr/bin/env node
const commander = require('commander');
const open = require('open');
const packagejson = require('./package.json')
const Publisher = require('./util/publisher');
const Processor = require('./util/processor-mine');

function main() {

  // Parse command line args
  commander
  .name(`npx ${packagejson.name}`)
  .description(`${packagejson.description}`)
  .version(`${packagejson.version}`, '-v, --version')
  .usage('[OPTIONS]...')
  .option('-h, --host  <host>:<port>', 'Destination Solace PubSub+ Broker to publish on websocket port in the form of host:port', 'ws://localhost:8008')
  .option('-u, --user <username>:<password>', 'Destination Solace PubSub+ Broker username:password.', 'default:default')
  .option('-m, --msgVPN <value>', 'Destination Solace PubSub+ Broker message VPN', 'default')
  .option('-d, --documentation', 'Launch hosted AsyncAPI documentation.')
  .option('--verbose', 'Verbose output logs. Default false')
  .option('--no-throttle', 'Skip throttling of publishing to destination broker')
  .parse(process.argv);

  const options = commander.opts()

  options.throttle ? console.log(" === Throttling output! Use --no-throttle to get faster message rate === \n\n") : null

  if (options.documentation) {
    packagejson.documentation ? open(packagejson.documentation) : console.error("AsyncAPI hosted documentation link is not found.\nPlease either update the 'documentation' value in the package.json or do not pass a -d flag to the command")
    return
  }

  // Instantiate publisher object from class to connect to destination broker
  const publisher = new Publisher(options.host, options.user, options.msgVPN, options.verbose)
  // Instantiate processor object that subscribes to source broker and publish to destination broker
  const processor = new Processor(publisher, options.throttle, options.verbose)
  processor.start()

  // Publish forever until signal interrupt is received
  process.on('SIGINT', function () {
    processor.terminate();
  })
}

if (require.main === module) {
  main();
}
