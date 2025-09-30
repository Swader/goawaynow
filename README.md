# X Follower Remover

A simple Chrome extension to bulk remove X (Twitter) followers from a list of
usernames.

## Features

- Remove followers in bulk from a simple list
- Configurable delay between actions to avoid rate limiting
- Progress tracking
- Graceful error handling
- Saves your list and settings

## Installation

Works with any Chromium browser.

1. Download the source code into a folder. Clicking "Download zip" on Github should
do the trick.

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode"

4. Click "Load unpacked" and select the folder containing the extension files

5. The extension should now appear in your extensions list

## Usage

1. Navigate to `x.com` (or stay on any X page)

2. Click the extension icon in your toolbar

3. Paste usernames in the textarea (one per line)

4. Optionally adjust the delay (default: 2000ms / 2 seconds)
   - Higher delays = safer but slower
   - Recommended: 2000-5000ms to avoid rate limiting
     - rate limiting manifests as black-screen when trying to load an X page.
       Waiting a few minutes usually clears it as the X front-end code stops
       thinking you're a bot. If it happens, increase the delay or just take a
       break and retry later.

5. Click "Start Removal"

6. Keep the popup open and don't interact with the X tab while running

7. The extension will:
   - Visit each profile
   - Open the "..." menu
   - Click "Remove this follower"
   - Confirm the removal
   - Move to the next user

## Notes

- **Rate Limiting**: X may rate limit you if you remove too many followers too
  quickly. Use higher delays (3-5 seconds) for large lists.

- **Errors**: The extension will continue even if some removals fail. Check the
  final count to see success/failure rates.

- **XPath Fragility**: X's DOM structure changes occasionally. If the extension
  stops working, the XPath selectors may need updating. Report this in Github if
  it happens, or to x.com/bitfalls!

- **Keep Popup Open**: Don't close the popup while the script is running, or it
  will stop.

## Privacy

This extension:

- ✅ Runs entirely in your browser
- ✅ Stores data only locally (Chrome storage)
- ✅ Makes no external API calls
- ✅ Open source - inspect the code yourself
