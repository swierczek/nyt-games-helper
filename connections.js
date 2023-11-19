var index = 0;
var groups = getBoardGroups();

// reset the helper wrapper for debugging purposes
let helperWrapper = document.querySelector('#nyt-games-helper');
if (helperWrapper) {
	helperWrapper.remove();
}

document.querySelector('#snackbar').insertAdjacentHTML('beforebegin', '<div id="nyt-games-helper" style="text-align:center"></div>');
helperWrapper = document.querySelector('#nyt-games-helper');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" style="padding: 10px; display:inline-block" id="free-guess">Free guess</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" style="padding: 10px; display:inline-block" id="reveal-incorrect-item">Reveal incorrect item</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" style="padding: 10px; display:inline-block" id="reveal-group">Reveal next group</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" style="padding: 10px; display:inline-block" id="random-group">Reveal random group</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" style="padding: 10px; display:inline-block" id="different-board">Random previous board</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<div style="padding: 10px; display:block" id="status"></div>');

let status = document.querySelector('#status');

/**
 * Make a free guess with the current selection.
 */
helperWrapper.querySelector('#free-guess').addEventListener('click', (event) => {
	event.preventDefault();

	let selected = getSelectedItems();

	if (selected.length < 4) {
		status.innerText = 'Select 4 items to make a guess.';
		return;
	}

	for (let key in groups) {
		if (equalArrays(groups[key].members, selected)) {
			status.innerText = 'Current selection is a match!';
			return;
		} else {
			// check how many match
			// status.innerText = 'Current selection is not a match.';

			let overlap = arrayIntersect(groups[key].members, selected);

			if (overlap.length === 3) {
				status.innerText = '3 overlap';
				return;
			}
		}
	}

	// output the overlap message
	status.innerText = 'No significant overlap';
});

/**
 * Output the next easiest group
 */
helperWrapper.querySelector('#reveal-group').addEventListener('click', (event) => {
	event.preventDefault();

	let answerBanner0 = document.querySelector('.answer-banner.group-0');
	let answerBanner1 = document.querySelector('.answer-banner.group-1');
	let answerBanner2 = document.querySelector('.answer-banner.group-2');
	let answerBanner3 = document.querySelector('.answer-banner.group-3');

	let keys = Object.keys(groups);

	let nextGroup = '';
	if (!answerBanner0) {
		nextGroup = keys[0];
	} else if (!answerBanner1) {
		nextGroup = keys[1];
	} else if (!answerBanner2) {
		nextGroup = keys[2];
	} else if (!answerBanner3) {
		nextGroup = keys[3];
	}

	status.innerText = 'Next group: ' + nextGroup;
});

/**
 * Output a random unsolved group
 */
helperWrapper.querySelector('#random-group').addEventListener('click', (event) => {
	event.preventDefault();

	let answerBanner0 = document.querySelector('.answer-banner.group-0');
	let answerBanner1 = document.querySelector('.answer-banner.group-1');
	let answerBanner2 = document.querySelector('.answer-banner.group-2');
	let answerBanner3 = document.querySelector('.answer-banner.group-3');

	let keys = Object.keys(groups);

	let possibleKeys = [];

	let nextGroup = '';
	if (!answerBanner0) {
		possibleKeys.push(keys[0]);
	}
	if (!answerBanner1) {
		possibleKeys.push(keys[1]);
	}
	if (!answerBanner2) {
		possibleKeys.push(keys[2]);
	}
	if (!answerBanner3) {
		possibleKeys.push(keys[3]);
	}

	let randomGroup = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];

	status.innerText = 'Random group: ' + randomGroup;
});

/**
 * Reveal the odd-item-out if 3 are in the same group
 */
helperWrapper.querySelector('#reveal-incorrect-item').addEventListener('click', (event) => {
	event.preventDefault();

	let selected = getSelectedItems();

	if (selected.length < 4) {
		status.innerText = 'Select 4 items to continue.';
		return;
	}

	for (let key in groups) {
		if (equalArrays(groups[key].members, selected)) {
			status.innerText = 'Current selection is a match!';
			return;
		} else {
			let overlap = arrayIntersect(groups[key].members, selected);

			if (overlap.length === 3) {
				status.innerText = arrayDiff(groups[key].members, selected);
				return;
			}
		}
	}

	status.innerText = 'No significant overlap';
});

/**
 * Load a different board (currently a random previous board)
 *
 * TODO: instead of updating it on button click, reveal an input form that
 * has a date picker and/or board # input, a "random" button, and a checkbox indicating
 * only previous boards (or not). Maybe also a "previous" and "next" button.
 */
helperWrapper.querySelector('#different-board').addEventListener('click', (event) => {
	event.preventDefault();

	// set the value of today's array to the different board array
	let allGameData = window.wrappedJSObject.gameData;
	let randomPreviousIndex = Math.floor(Math.random() * index - 1);
	allGameData[index] = allGameData[randomPreviousIndex]; // switch to yesterday's board

	// export gameData back to window.gameData
	window.wrappedJSObject.gameData = cloneInto(allGameData, window);

	// update groups so the rest of the extension works with the new groups
	groups = allGameData[index].groups;

	// trigger a focus event which should update the DOM
	window.dispatchEvent(new Event('focus', { 'bubbles': true }));
});

/**
 * Get today's board groups
 *
 * @return Object
 */
function getBoardGroups() {
	let allGameData = window.wrappedJSObject.gameData;
	let items = getBoardItems();

	// check all array items in the game data to determine the index of today's puzzle
	for (let i=0; i<allGameData.length; i++) {
		let groups = allGameData[i].groups;
		let options = [];

		// add all group members to options
		for (let key in groups) {
			options.push(...groups[key].members);
		}

		options.sort();

		if (equalArrays(options, items)) {
			index = i;
			return allGameData[i].groups;
		}
	}
}

/**
 * Get all items on today's board
 *
 * @return array
 */
function getBoardItems() {
	let itemElements = document.querySelectorAll('.item');
	let items = [];

	itemElements.forEach((item) => {
		items.push(item.innerText);
	});

	items.sort();

	return items;
}

/**
 * Check if 2 arrays have the same values in the same order
 *
 * @param arr1 array
 * @param arr2 array
 * @return bool
 */
function equalArrays(arr1, arr2) {
	return JSON.stringify(arr1) == JSON.stringify(arr2);
}

/**
 * Get the intersection of values between 2 arrays
 *
 * @param arr1 array
 * @param arr2 array
 * @return array of intersecting items
 */
function arrayIntersect(arr1, arr2) {
	const setA = new Set(arr1);
    return arr2.filter(value => setA.has(value));
}

/**
 * Get the difference of values between 2 arrays
 *
 * @param arr1 array
 * @param arr2 array
 * @return array of intersecting items
 */
function arrayDiff(arr1, arr2) {
	const setA = new Set(arr1);
	return arr2.filter(value => !setA.has(value));
}

/**
 * Get all currently selected items in alphabetical order
 *
 * @return array
 */
function getSelectedItems() {
	// get the 4 selections, sort alphabetically, check each group
	let selected = document.querySelectorAll('.item.selected');

	let items = [];
	selected.forEach((item) => {
		items.push(item.innerText);
	});

	items.sort();

	return items;
}