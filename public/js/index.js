(() => {
  'use strict'
  const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.forEach(tooltipTriggerEl => {
    new bootstrap.Tooltip(tooltipTriggerEl)
  })
})()

const form = document.getElementById('chat-form')
const chatMessages = document.querySelector('.chat-messages')
const cancelBtn = document.getElementById('cancel-btn')
const messages = []
cancelBtn.addEventListener('click', () => {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', '/chat/stop')
  xhr.send()
  xhr.addEventListener('load', () => {
    if (xhr.status === 200) {
      const lastMessage = chatMessages.lastElementChild
      lastMessage.innerHTML = `<div class="alert alert-danger" role="alert">The conversation has been stopped by the user</div>`
      document.getElementById('send').style.display = 'block'
      cancelBtn.style.display = 'none'
    }
  });
});
form.addEventListener('submit', (e) => {
  e.preventDefault()
  const msg = e.target.elements.msg.value
  messages.push({ message: msg, isBot: false})
  // XHR POST request
  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/chat')
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.send(JSON.stringify({ messages: messages }))
  chatMessages.innerHTML += `<div class="chat-message d-flex mb-2"><div class="d-flex"><img src="/svg/person.svg" alt="User avatar" class="me-2"/></div><p class="mb-0">${msg}</p></div>`;
  chatMessages.innerHTML += `<div class="chat-message d-flex mb-2"><div class="d-flex"><img src="/svg/robot.svg" alt="User avatar" class="me-2"/></div><p class="mb-0">Waiting for AI response</p></div>`;
  chatMessages.scrollTop = chatMessages.scrollHeight
  document.getElementById('send').style.display = 'none'
  cancelBtn.style.display = 'block'
  xhr.addEventListener('progress', (event) => {
    const lastMessage = chatMessages.lastElementChild
    const lastMessageP = lastMessage.querySelector('p')
    if (xhr.responseText.includes('[[END OF CONVERSATION]]')) {
      const receivedMsg = xhr.responseText.replace('[[END OF CONVERSATION]]', '').trim()
      document.getElementById('send').style.display = 'block'
      cancelBtn.style.display = 'none'
      messages.push({ message: receivedMsg, isBot: true})
      lastMessageP.innerHTML = receivedMsg
    }
  });
  xhr.addEventListener('load', () => {
    if (xhr.status !== 200) {
      const lastMessage = chatMessages.lastElementChild
      lastMessage.innerHTML = `<div class="alert alert-danger" role="alert">Something went wrong, please reload the page (The conversation will be lost)</div>`
    }
  });
  e.target.elements.msg.value = ''
  e.target.elements.msg.focus()
});