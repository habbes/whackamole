# Whackamole

This is an experimental project aimed at providing a simple for tool for verifying how a distribute system
responds to network issues or node failures. It makes it easy to simulate issues such
as slow networks, unresponsive nodes, etc.

*Note*: This is a proof-of-concept.

## Setup

Install dependencies:

```sh
npm install
```

The `controller` is the main app. Run the controller using:

```
node controller
```

This opens up a prompt where you can type commands. Enter `help` to see available commands:

```
> help
delay
Delays responses from the specified node by the given interval for a period of time.
Usage: delay <node> <duration> <interval>

noresponse
Blocks responses from the specified node for a period of time.
Usage: noresponse <node> <duration>

connect
Connects to a node and gives it an alias to refer to by in other commands.
Usage: connect <alias> <nodeAddress>

exit
Exits this application.

> 
```

To see an example of the tool in action, see the [./sample](sample) test scenario walkthrough.
