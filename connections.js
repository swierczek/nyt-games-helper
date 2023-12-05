const FIRST_CONNECTIONS_DATE = '06-12-2023';

var todaysGameIndex = 0; // today's game's index
var currentGameIndex = 0; // current game's index
var groups; // initialized in click events
var completedGames = getCompletedGames();

var dateArray = [];

// reset the helper wrapper for debugging purposes
let helperWrapper = document.querySelector('#nyt-games-helper');
if (helperWrapper) {
	helperWrapper.remove();
}

document.querySelector('head').insertAdjacentHTML('beforeend',`
<style>
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
</style>`);

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

	initBoardGroups();

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

	initBoardGroups();

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

	initBoardGroups();

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

	initBoardGroups();

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
 * only previous boards (or not). Maybe also a "previous" and "next" button.
 *
 * https://www.nytimes.com/svc/connections/v1/2023-06-12.json is the first available date
 * {"status":"ERROR","errors":["Not Found"],"results":[]} if date isn't defined
 */
helperWrapper.querySelector('#different-board').addEventListener('click', (event) => {
	event.preventDefault();

	initBoardGroups();

	let min = new Date(FIRST_CONNECTIONS_DATE); // inclusive
	let max = new Date(); // exclusive
	let dates = getDateArray(min, max);

	// new random index between 1 and (today - 1)
	let newIndex = Math.floor(Math.random() * dates.length);

	// get new game data
	fetch('https://www.nytimes.com/svc/connections/v1/'+dates[newIndex]+'.json')
	.then((res) => res.json())
	.then((res) => {
		if (res.status === 'ERROR') {
			updateStatus('Failed to regenerate a new board. Try again!');
		} else if (res.id && res.groups) {
			currentGameIndex = res.id;

			// set the value of today's array to the different board array
			let allGameData = window.wrappedJSObject.gameData;
			allGameData[todaysGameIndex] = res;

			// export gameData back to window.gameData
			window.wrappedJSObject.gameData = cloneInto(allGameData, window);

			// update groups so the rest of the extension works with the new groups
			groups = allGameData[todaysGameIndex].groups;

			// trigger a focus event which should update the DOM
			window.dispatchEvent(new Event('focus', { 'bubbles': true }));

			// check if this board has been completed before
			if (completedGames[currentGameIndex] === true) {
				updateStatus('Game #' + currentGameIndex + ' - you have completed this game before.');
			} else {
				updateStatus('Game #' + currentGameIndex + ' - you have not completed this game yet.')
			}
		}
	});
});

/**
 * Get an array of dates in the format YYYY-MM-DD.
 * Based on https://stackoverflow.com/a/45068485/1499877
 *
 * @param min Date, inclusive
 * @param max Date, exclusive
 */
function getDateArray(min, max) {
	if (dateArray.length > 0) {
		return dateArray;
	}

	var dates = [];

	min.setDate(min.getDate() - 1);
	max.setDate(max.getDate() - 1);

	while (min < max) {
		// this line modifies the original min reference which you want to make the while loop work
		min.setDate(min.getDate() + 1);

		let newDate = new Date(min);

		let thisYear = newDate.getFullYear();
		let thisMonth = newDate.getMonth() + 1;
		let thisDate = newDate.getDate();

		let dateString = thisYear
			+ '-'
			+ (thisMonth <= 9 ? '0' : '') + thisMonth
			+ '-'
			+ (thisDate <= 9 ? '0' : '') + thisDate;

		// this pushes a new date , if you were to push min then you will keep updating every item in the array
		dates.push(dateString);
	}

	dateArray = dates;

	return dates;
}

/**
 * Monitor the #board for DOM changes so we can detect when the game is complete
 * https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
 */
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
		        	markCompleted(currentGameIndex);
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
 * Get today's board groups. The last element of window.gameData
 * should contain the object we're looking for.
 *
 * @return Object
 */
function initBoardGroups() {
	if (typeof groups !== 'undefined') {
		return;
	}

	let allGameData = window.wrappedJSObject.gameData;
	let items = getBoardItems();

	// check all array items in the game data to determine the index of today's puzzle
	for (let i=allGameData.length-1; i>=0; i--) {
		let thisGroups = allGameData[i].groups;
		let options = [];

		if (!thisGroups) {
			continue;
		}

		// add all group members to options
		for (let key in thisGroups) {
			options.push(...thisGroups[key].members);
		}

		options.sort();

		if (equalArrays(options, items)) {
			todaysGameIndex = i;
			currentGameIndex = i;
			groups = allGameData[i].groups;
			return;
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