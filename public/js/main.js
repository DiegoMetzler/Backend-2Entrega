// public/js/main.js

const socket = io();

const form = document.getElementById('message-form');
const input = document.getElementById('message-input');
const messagesDiv = document.getElementById('messages');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = input.value;
    socket.emit('mensaje', message);
    input.value = '';
});

socket.on('mensaje', (msg) => {
    const p = document.createElement('p');
    p.textContent = msg;
    messagesDiv.appendChild(p);
});
