# NYT Games Helper

This is an add-on for Firefox to add hints and the ability to play previous days' boards for the NYT game [Connections](https://www.nytimes.com/games/connections).

<img width="759" alt="image" src="https://github.com/swierczek/nyt-games-helper/assets/2423727/8c2ff596-633e-44a8-8a4b-816b9f67a046">

The add-on is published at https://addons.mozilla.org/en-US/firefox/addon/nyt-games-helper/.

## Firefox mobile
To use this on Firefox on an android device: https://www.androidpolice.com/install-add-on-extension-mozilla-firefox-android/

## How it works
Connections loads a global `window.gameData` array with many (all?) previous and some future days' boards. This add-on reads from that object and the currently selected items to add various hints.

Connections uses React, and internally seems to read the global object when the user makes guesses. In order to unlock all boards, this add-on takes advantage of that to load previous boards into the current day's index.

This add-on also tracks the index of any completed boards in local storage in order to keep track of games new to the user vs. games already seen (because the "load a different game" functionality currently only picks a random index).

## Future work
* Enhance the "different board" functionality
* Add Wordle hints

## Packaging process
```
cd ~/Documents/nyt-games-helper/; zip Archive.zip connections.js manifest.json
```
