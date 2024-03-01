# msgService Development Tools README

## Overview

The `msgService` tool is designed to enable the sending of custom messages to any channel instantly, without having to wait for messages from other services. Its primary purpose is to facilitate immediate communication across various components or services by publishing predefined messages to specific channels. This tool is especially useful in environments where real-time interaction and response are critical.

## Components

- **messagesConfig.json**: A configuration file that contains predefined messages along with their associated channels.
- **msgListener.js**: A script for subscribing and listening to messages on specified topics.
- **msgSender.js**: A Command Line Interface (CLI) tool for sending messages based on configurations.
- **package.json**: Specifies the dependencies required by the tool.

## Usage

### Setting Up

1. Ensure Node.js is installed on your system.
2. Navigate to the `msgService` directory and execute `npm install` to install the necessary dependencies.

### Configuring Messages

To define custom messages, edit the `messagesConfig.json` file. Each entry should specify a channel and the message data. These messages can be triggered through the command-line interface.

### Sending Messages with msgSender

- Execute `node msgSender.js` to initiate the message sender CLI.
- Input a key that corresponds to a message defined in `messagesConfig.json`. The message will then be automatically published to its configured channel at 5-second intervals.

### Listening to Messages with msgListener

- Execute `node msgListener.js` to start listening to the configured topics.
- The script subscribes to the specified topics and outputs the received messages. You can add or remove topics of interest by editing the `topics` array in `msgListener.js`.

### Dependencies

- **MQTT**: Utilized for messaging across distributed systems.
- **Readline**: Used for reading input from the command line.

## Example

To send a predefined message:

1. Ensure your desired message and channel are configured in `messagesConfig.json`.
2. Run `node msgSender.js`, then enter the corresponding key.
3. The message will be sent to the specified channel, and any active listeners will be able to react to it accordingly.

This tool streamlines the process of inter-service communication by allowing for quick and effortless message broadcasting and listening, making it an invaluable resource for developers working on complex, distributed systems.
