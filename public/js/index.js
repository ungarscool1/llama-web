(() => {
  'use strict'
  const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl)
  })
})()

const form = document.getElementById('chat-form')
const chatMessages = document.querySelector('.chat-messages')
form.addEventListener('submit', (e) => {
  e.preventDefault()
  const msg = e.target.elements.msg.value
  // XHR POST request
  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/message')
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.send(JSON.stringify({ message: msg }))
  chatMessages.innerHTML += `<div class="chat-message d-flex mb-2"><div class="d-flex"><img src="/svg/person.svg" alt="User avatar" class="me-2"/></div><p class="mb-0">${msg}</p></div>`;
  xhr.onprogress = (event) => {
    chatMessages.innerHTML += `<div class="chat-message d-flex mb-2"><div class="d-flex"><img src="/svg/robot.svg" alt="User avatar" class="me-2"/></div><p class="mb-0">Waiting for AI response</p></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight
    const lastMessage = chatMessages.lastElementChild
    const lastMessageP = lastMessage.querySelector('p')
    const responseData = event.currentTarget.responseText;
    lastMessageP.innerHTML = responseData
  };
  xhr.onload = () => {
    if (xhr.status === 200) {
    } else {
      chatMessages.innerHTML += `<div class="chat-message d-flex mb-2"><div class="alert alert-danger" role="alert">Something went wrong, please reload the page (The conversation will be lost)</div></div>`;
    }
  }
  e.target.elements.msg.value = ''
  e.target.elements.msg.focus()
});