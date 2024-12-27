# Twice - Think Twice Before Social Media

A Chrome extension that helps you be more mindful of your social media usage by prompting you to think twice before visiting social media sites. It's designed to reduce mindless scrolling and promote intentional browsing habits.

![Xnip2024-12-27_23-09-06](https://github.com/user-attachments/assets/452f5fd8-32a0-4950-b8b3-9bc5029e581f)

## Features

- Shows a gentle reminder when you try to visit social media sites.
- If you can't resist, you can proceed with a timer.
- Add any domains you want reminders for.
- Easy to turn on/off or skip this time.

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" button
5. Select the directory containing the extension files (where manifest.json is located)

The extension icon should now appear in your Chrome toolbar.

## How It Works

When you try to visit a social media site, Twice will show a popup asking you to pause and reflect. This small interruption helps you:
- Be more conscious of your browsing habits
- Reduce impulsive social media checking
- Make intentional decisions about your online time

## Development

The extension consists of:
- `manifest.json`: Extension configuration
- `popup.html`: Main extension interface
- `css/`: Styling files
- `js/`: JavaScript functionality

To make changes, simply edit the files and reload the extension in Chrome by clicking the refresh icon on the extension card in `chrome://extensions/`.

## License

MIT
