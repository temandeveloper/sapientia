# Rabbit

Sapientia
"Sapientia" (Latin: wisdom, intelligence, deep understanding) is an innovative desktop application striving to bring local AI intelligence directly to your device. We believe true wisdom resides at your fingertips, not in distant clouds. Sapientia empowers your device to become smarter and more responsive, with a core focus on privacy, speed, and offline capabilities.

Our Vision
Sapientia's vision is to create a personal AI assistant that runs entirely on the user's device. This means your data stays yours, and tasks can be completed faster without network latency. From automating daily routines to executing complex commands for computer or browser operations, Sapientia is designed to deliver unprecedented control and efficiency.

Key Features (Under Development)
Local AI Processing: Running AI models on-device for maximum privacy and speed.

Device Control: Ability to automate and execute commands on the operating system and applications.

Browser Integration: Interacting with web browsers for web-based tasks.

Modularity: Designed to support various AI models and plugins in the future.

Intuitive Interface: A simple yet powerful user experience for all skill levels.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### you must be read to setup development environment for desktop application:
https://learn.microsoft.com/en-gb/windows/uwp/debug-test-perf/windows-app-certification-kit

### Install

```bash
$ npm install
$ npx puppeteer browsers install
```

### To use the latest llama.cpp release available Run :

```bash
$ npx node-llama-cpp source download --release latest
```
https://node-llama-cpp.withcat.ai/guide/building-from-source#download-new-release

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```


Additional Terms
By using Sapientia, you agree to the following terms:

Permitted Use

Sapientia is , not sold, to you. This grants you the right to install and use the application for personal or professional purposes.
Redistribution or sublicensing of the application is prohibited without prior written consent.
Restrictions

You may not reverse-engineer, decompile, or disassemble the software, except where such activity is explicitly permitted by law.
You may not use the application to engage in unlawful activities, including but not limited to unauthorized data scraping, hacking, or bypassing website security protocols.
Data Privacy

RabBit processes all data locally on your machine. The application does not collect, transmit, or store any personal data on external servers.
You are responsible for maintaining the security of your local system and any data processed through RabBit.
AI Chat Feature

The AI Chat feature provided in Sapientia is experimental and runs locally on your machine. Use of this feature is at your own risk, and RabBit is not responsible for any incorrect outputs or decisions made based on its usage.
Disclaimer of Warranty

The application is provided “as is” without warranty of any kind. GoDiscus disclaims all warranties, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
Limitation of Liability

In no event shall GoDiscus be liable for any damages arising out of the use or inability to use Sapientia, including but not limited to incidental, special, or consequential damages.
Updates and Modifications

GoDiscus reserves the right to update or modify Sapientia at any time. Continued use of the application after updates constitutes acceptance of the modified terms.
