// these get populated asynchronously
var answers;
var guesses;
var answer;
var words;

// getTodaysAnswer();
// getWordList();

console.log('a', a);

let helperWrapper = document.querySelector('#nyt-games-helper');
if (helperWrapper) {
	helperWrapper.remove();
}

async function getTodaysAnswer() {
	console.log('getting today\'s answer');

	let date = getCurrentDate();

	fetch('https://www.nytimes.com/svc/wordle/v2/' + date + '.json')
	.then((res) => {
		return res.json();
	})
	.then((res) => {
		answer = res.solution;
	});
}

function getCurrentDate() {
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	var yyyy = today.getFullYear();

	return yyyy + '-' + mm + '-' + dd;
}

// let keyboard = document.querySelector('#wordle-app-game div[aria-label="Keyboard"]');
let body = document.querySelector('body');
body.insertAdjacentHTML('beforeend', '<div id="nyt-games-helper" style="text-align:center; position: relative; z-index: 999;"></div>');
helperWrapper = document.querySelector('#nyt-games-helper');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" style="padding: 10px" id="random-word">Random word</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<a href="#" style="padding: 10px" id="next-letter">Reveal next letter</a>');
helperWrapper.insertAdjacentHTML('beforeend', '<div style="padding: 10px" id="status"></div>');

helperWrapper.querySelector('#random-word').addEventListener('click', (event) => {
	event.preventDefault();
	console.log('answer', answer);
});

async function getWordList() {
	console.log('getting word list');
	// need to edit the Lambda function > Configuration > Function URL - to either allow https://swierczek.github.io or *
	// https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/whendle/edit/function-url?tab=configure
	let response = await fetch('https://weifgb2amntdbh5s3amxjogpfi0wkedp.lambda-url.us-east-1.on.aws/')
	.then((res) => {
		console.log('res', res);
		return res.json();
	})
	.catch((err) => {
		console.log(err);
	});
	// let response = await fetch('https://sxpbbu5pslheeh3bqixkkbxybm0vtmtr.lambda-url.us-east-2.on.aws/');
	// let text = await response.text();

	// console.log('text', text);

	// let json = JSON.parse(text);
	// answers = json['answers'];
	// guesses = json['guesses'];
}

getWordList();

// needed apparently cuz await is setting the global var
setTimeout(() => console.log(answers), 0);