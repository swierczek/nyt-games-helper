const FIRST_CONNECTIONS_DATE = '06-12-2023';

var todaysGameIndex = 0; // today's game's index
var currentGameIndex = 0; // current game's index
var groups; // initialized in click events

var dateArray = [];

// reset the helper wrapper for debugging purposes
let helperWrapper = document.querySelector('#nyt-games-helper');
if (helperWrapper) {
	helperWrapper.remove();
}

let intervalId;
let status;

initBoardGroups(); // fetch JSON with today's board data
attachCustomDiv(); // async init of our link bar

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

function attachCustomDiv() {
	intervalId = setInterval(() => {
		let board = document.querySelector('#pz-game-root > article > section:last-of-type');
		if (board) {
			clearTimeout(intervalId);
			init();
		}
	}, 500);
}

function init() {
	document.querySelector('#pz-game-root > article > section:last-of-type').insertAdjacentHTML('afterend', '<div id="nyt-games-helper"></div>');
	helperWrapper = document.querySelector('#nyt-games-helper');
	helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" id="free-guess">Free guess</a>');
	helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" id="reveal-group">Reveal next group</a>');
	helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" id="random-group">Reveal random group</a>');
	helperWrapper.insertAdjacentHTML('beforeend', '<div id="status-wrapper"><span id="status"></span></div>');

	status = document.querySelector('#status');

	/**
	 * Make a free guess with the current selection.
	 */
	helperWrapper.querySelector('#free-guess').addEventListener('click', (event) => {
		event.preventDefault();

		let selected = getSelectedItems();
		let selectedElements = document.querySelectorAll('input[checked]');
		let selectedCells = [];

		selectedElements.forEach((element) => {
			selectedCells.push(element.parentNode);
		});

		if (selected.length < 4) {
			updateStatus('Select 4 items to make a guess.');
			return;
		}

		for(let i=0; i<groups.length; i++) {
			let cards = [];

			groups[i].cards.forEach((card) => {
				cards.push(card.content);
			});

			cards.sort();

			if (equalArrays(cards, selected)) {
				updateStatus('Current selection is a match!');
				// class can be found via animations.css
				animate(selectedCells, 'solved-pulse', 500);
				return;
			} else {
				// check how many match
				let overlap = arrayIntersect(cards, selected);

				if (overlap.length === 3) {
					let item = arrayDiff(cards, selected);
					updateStatus('3 overlap - ' + item);

					let element = Array.from(
						document.querySelectorAll('input[checked]')
					).find(el => {
						return el.value.trim() == item
					});

					animate([element.parentNode], 'short-bounce', 500);
					return;
				}
			}
		};

		// output the overlap message
		animate(selectedCells, 'invalid-shake', 500);
		updateStatus('No significant overlap');
	});

	/**
	 * Output the next easiest group
	 */
	helperWrapper.querySelector('#reveal-group').addEventListener('click', (event) => {
		event.preventDefault();

		let answerBanner0 = getAnswerBannerWithText(groups[0].title);
		let answerBanner1 = getAnswerBannerWithText(groups[1].title);
		let answerBanner2 = getAnswerBannerWithText(groups[2].title);
		let answerBanner3 = getAnswerBannerWithText(groups[3].title);

		let nextGroup = '';
		if (!answerBanner0) {
			nextGroup = groups[0].title;
		} else if (!answerBanner1) {
			nextGroup = groups[1].title;
		} else if (!answerBanner2) {
			nextGroup = groups[2].title;
		} else if (!answerBanner3) {
			nextGroup = groups[3].title;
		}

		updateStatus('Next group: ' + nextGroup);
	});

	/**
	 * Output a random unsolved group
	 */
	helperWrapper.querySelector('#random-group').addEventListener('click', (event) => {
		event.preventDefault();

		let answerBanner0 = getAnswerBannerWithText(groups[0].title);
		let answerBanner1 = getAnswerBannerWithText(groups[1].title);
		let answerBanner2 = getAnswerBannerWithText(groups[2].title);
		let answerBanner3 = getAnswerBannerWithText(groups[3].title);

		let possibleKeys = [];

		if (!answerBanner0) {
			possibleKeys.push(groups[0].title);
		}
		if (!answerBanner1) {
			possibleKeys.push(groups[1].title);
		}
		if (!answerBanner2) {
			possibleKeys.push(groups[2].title);
		}
		if (!answerBanner3) {
			possibleKeys.push(groups[3].title);
		}

		let randomGroup = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];

		updateStatus('Random group: ' + randomGroup);
	});
}

/**
 * Initialize today's board groups by fetching the same JSON their JS uses
 */
function initBoardGroups() {
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	let yyyy = today.getFullYear();

	let dateString = yyyy + '-' + mm + '-' + dd;

	fetch('https://www.nytimes.com/svc/connections/v2/'+dateString+'.json')
	.then((res) => res.json())
	.then((res) => {
		groups = res.categories;
	});
}

function getBoardData() {
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	let yyyy = today.getFullYear();

	let dateString = yyyy + '-' + mm + '-' + dd;

	fetch('https://www.nytimes.com/svc/connections/v2/'+dateString+'.json')
	.then((res) => res.json())
	.then((res) => {
		return res.categories;
	});
}

function getAnswerBannerWithText(text) {
	for (const a of document.querySelectorAll("h3[class^='SolvedCategory']")) {
		if (a.textContent.includes(text)) {
	    	return a;
		}
	}
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
	// get the 4 selections, sort alphabetically
	let selected = document.querySelectorAll('input[checked]');

	let items = [];
	selected.forEach((item) => {
		items.push(item.value);
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
