const API_URL = 'http://127.0.0.1:5001';

const qs = sel => document.querySelector(sel);
const fileListDiv = qs('#flashcard-file-list');
const questionText = qs('#question-text');
const answerText = qs('#answer-text');
const mcqOptions = qs('#mcq-options');
const showAnswerBtn = qs('#show-answer-btn');
const perfBtns = qs('#performance-btns');
const cardInner = qs('.card-inner');
const cardBack = qs('.card-back');
const cardFront = qs('.card-front');

let currentCard = null;

async function loadFiles() {
    const res = await fetch(`${API_URL}/list-files`);
    const data = await res.json();

    const fileListDiv = document.querySelector('#flashcard-file-list');
    document.querySelector('#flashcard-file-status')?.remove();

    if (!data.files.length) {
        fileListDiv.textContent = 'No files found.';
        return;
    }

 data.files.forEach(filename => {
    const wrapper = document.createElement('div');
    wrapper.className = 'file-item';

const checkbox = document.createElement('input');
checkbox.type = 'checkbox';
checkbox.value = filename;
checkbox.name = 'selectedFiles';
checkbox.id = `file-${filename}`;

const label = document.createElement('label');
label.textContent = filename;
label.setAttribute('for', checkbox.id);


    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    fileListDiv.appendChild(wrapper);
});


    const btn = document.createElement('button');
    btn.textContent = 'Start Study';
    btn.className = 'primary';
    btn.onclick = generateCards;
    fileListDiv.appendChild(btn);
}


async function generateCards() {
    const checked = document.querySelectorAll('#flashcard-file-list input:checked');
    const filenames = Array.from(checked).map(cb => cb.value);
    if (!filenames.length) return alert('Please select at least one file.');

    const res = await fetch(`${API_URL}/generate-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames })
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Generation failed.');

    document.getElementById('flashcard-section')?.classList.remove('hidden');
    document.getElementById('file-select-section')?.classList.add('hidden');


    fetchNextCard();
}

async function fetchNextCard() {
    const res = await fetch(`${API_URL}/get-card`);
    if (!res.ok) {
        questionText.textContent = 'No cards available.';
        return;
    }

    const card = await res.json();
    currentCard = card;
    displayCard(card);
}

function displayCard(card) {
    cardInner.classList.remove('flipped');
    cardFront.classList.remove('hidden');
    cardBack.classList.add('hidden');
    showAnswerBtn.classList.toggle('hidden', card.type === 'mcq');
    perfBtns.classList.add('hidden');
    mcqOptions.innerHTML = '';

    questionText.textContent = card.question;
    answerText.textContent = card.answer;
}

showAnswerBtn.addEventListener('click', () => {
    cardInner.classList.add('flipped');
    cardBack.classList.remove('hidden');
    showAnswerBtn.classList.add('hidden');
    perfBtns.classList.remove('hidden');
});

perfBtns.addEventListener('click', async e => {
    if (!e.target.matches('#performance-btns button')) return;
    const action = e.target.textContent.toLowerCase();

    if (!currentCard || !currentCard.id) return;

    if (action === 'hard') {
        await fetch(`${API_URL}/answer-card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId: currentCard.id, correct: false })
        });
        fetchNextCard();
    } else if (action === 'easy') {
        await fetch(`${API_URL}/answer-card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId: currentCard.id, correct: true })
        });
        fetchNextCard();
    } else if (action === 'medium' || action === 'next card') {
        fetchNextCard();
    }
});

loadFiles();
fetchNextCard();
