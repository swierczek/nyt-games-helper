var index = 0;
var randomPreviousIndex = 0;
var groups = getBoardGroups();
var completedGames = getCompletedGames();

// reset the helper wrapper for debugging purposes
let helperWrapper = document.querySelector('#nyt-games-helper');
if (helperWrapper) {
	helperWrapper.remove();
}

let css = `
#top-text {
	display: none;
}
#nyt-games-helper {
	text-align: center;
}
#nyt-games-helper a {
	text-decoration: underline;
	padding: 10px;
	display: inline-block;
}
.item.selected.test {
	color: red;
	width: 110%;
}
#status-wrapper {
	padding: 10px;
	display: block;
}
#status {
	border-radius: 10px;
	padding: 7px;
	background: none;
	transition: all .4s easeOutExpo;
}
#status.updated {
	background: #eee;
}
`;

document.querySelector('head').insertAdjacentHTML('beforeend', '<style>' + css + '</style>');

document.querySelector('#snackbar').insertAdjacentHTML('beforebegin', '<div id="nyt-games-helper"></div>');
helperWrapper = document.querySelector('#nyt-games-helper');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" id="free-guess">Free guess</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" id="reveal-incorrect-item">Reveal incorrect item</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" id="reveal-group">Reveal next group</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" id="random-group">Reveal random group</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" id="different-board">Random previous board</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<div id="status-wrapper"><span id="status"></span></div>');

let status = document.querySelector('#status');

observeBoard();

/**
 * Make a free guess with the current selection.
 */
helperWrapper.querySelector('#free-guess').addEventListener('click', (event) => {
	event.preventDefault();

	let selected = getSelectedItems();
	let selectedElements = document.querySelectorAll('.item.selected');

	if (selected.length < 4) {
		updateStatus('Select 4 items to make a guess.');
		return;
	}

	for (let key in groups) {
		if (equalArrays(groups[key].members, selected)) {
			updateStatus('Current selection is a match!');
			// class can be found via animations.css
			animate(selectedElements, 'solved-pulse', 500);
			return;
		} else {
			// check how many match
			// updateStatus('Current selection is not a match.');

			let overlap = arrayIntersect(groups[key].members, selected);

			if (overlap.length === 3) {
				updateStatus('3 overlap');
				animate(selectedElements, 'short-bounce', 500);
				return;
			}
		}
	}

	// output the overlap message
	animate(selectedElements, 'invalid-shake', 500);
	updateStatus('No significant overlap');
});

/**
 * Reveal the odd-item-out if 3 are in the same group
 */
helperWrapper.querySelector('#reveal-incorrect-item').addEventListener('click', (event) => {
	event.preventDefault();

	let selected = getSelectedItems();

	if (selected.length < 4) {
		updateStatus('Select 4 items to continue.');
		return;
	}

	for (let key in groups) {
		if (equalArrays(groups[key].members, selected)) {
			updateStatus('Current selection is a match!');
			return;
		} else {
			let overlap = arrayIntersect(groups[key].members, selected);

			if (overlap.length === 3) {
				let item = arrayDiff(groups[key].members, selected);
				updateStatus(item);

				let element = Array.from(
					document.querySelectorAll('.item.selected')
				).find(el => {
					return el.textContent.trim() == item
				});

				animate([element], 'invalid-shake', 500);
				return;
			}
		}
	}

	updateStatus('No significant overlap');
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

	updateStatus('Next group: ' + nextGroup);
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

	updateStatus('Random group: ' + randomGroup);
});

/**
 * Load a different board (currently a random previous board)
 *
 * TODO: instead of updating it on button click, reveal an input form that
 * has a date picker and/or board # input, a "random" button, and a checkbox indicating
 * only previous boards (or not). Maybe also a "previous" and "next" button. And keep track
 * of solved puzzles via local storage or a cookie.
 */
helperWrapper.querySelector('#different-board').addEventListener('click', (event) => {
	event.preventDefault();

	// set the value of today's array to the different board array
	let allGameData = window.wrappedJSObject.gameData;
	let randomPreviousIndex = Math.floor(Math.random() * index - 1);
	allGameData[index] = allGameData[randomPreviousIndex]; // switch to new board

	// export gameData back to window.gameData
	window.wrappedJSObject.gameData = cloneInto(allGameData, window);

	// update groups so the rest of the extension works with the new groups
	groups = allGameData[index].groups;

	// trigger a focus event which should update the DOM
	window.dispatchEvent(new Event('focus', { 'bubbles': true }));

	// check if this board has been completed before
	if (completedGames[randomPreviousIndex] === true) {
		updateStatus('You have completed this game before.');
	} else {
		updateStatus('You have not completed this board yet.')
	}

});

function observeBoard() {
	// Select the node that will be observed for mutations
	var targetNode = document.querySelector('#board');

	// Options for the observer (which mutations to observe)
	var config = { subtree: true, childList: true };

	// Callback function to execute when mutations are observed
	var callback = function(mutationsList) {
	    for (let mutation of mutationsList) {
	        if (mutation.type == 'childList' && mutation.addedNodes.length === 1) {
	        	let classes = mutation.addedNodes[0].classList;
	        	if (classes.contains('answer-banner') && classes.contains('item-row-3')) {
		        	markCompleted(randomPreviousIndex);
	        	}
	        }
	    }
	};

	// Create an observer instance linked to the callback function
	var observer = new MutationObserver(callback);

	// Start observing the target node for configured mutations
	observer.observe(targetNode, config);

	// Later, you can stop observing
	// observer.disconnect();
}

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
			randomPreviousIndex = i;
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
 * @return array of strings
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

/**
 * Update the status text and toggle the .updated class to animate the background
 */
function updateStatus(text) {
	status.innerText = text;
	status.classList.add('updated');
	setTimeout(() => {
		status.classList.remove('updated');
	}, 300);
}

/**
 * Toggle an animation class for a group of elements
 *
 * @param elements to toggle the class on
 * @param cssClass to toggle
 * @param duration How long until the class should be removed
 */
function animate(elements, cssClass, duration) {
	elements.forEach((element) => {
		element.classList.add(cssClass);

		setTimeout(() => {
			element.classList.remove(cssClass);
		}, duration);
	});
}

/**
 * Get an object of all completed games from local storage
 *
 * @return object
 */
function getCompletedGames() {
	let completedGames = localStorage.getItem("completedGames");

	return completedGames ? JSON.parse(completedGames) : {};
}

/**
 * Mark this index as a completed game in local storage
 *
 * @param index int
 */
function markCompleted(index) {
	completedGames[index] = true;

	localStorage.setItem('completedGames', JSON.stringify(completedGames));
}