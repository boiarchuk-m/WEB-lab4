$(function() {

  // Initialize variables
  const $window = $(window);
  const $usernameInput = $('.usernameInput'); 
  const $messages = $('.messages');          
  const $inputMessage = $('.inputMessage'); 

  const $loginPage = $('.login.page');  
  const $chatPage = $('.chat.page');     

  const socket = io();

  let username;
  let connected = false;
  let $currentInput = $usernameInput.focus();

  const addParticipantsMessage = (data) => {
    let message = '';
    if (data.numUsers === 1) {
      message += `there's 1 participant`;
    } else {
      message += `there are ${data.numUsers} participants`;
    }
    log(message);
  }

  // Sets the client's username
  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());

    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      socket.emit('add user', username);
    }
  }

  // Sends a chat message
  const sendMessage = () => {
    let message = $inputMessage.val();
    message = cleanInput(message);
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({ username, message });
      socket.emit('new message', message);
    }
  }

  const log = (message, options) => {
    const $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options = {}) => {

    const $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', '#1E90FF');
    const $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    const $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }


  const addMessageElement = (el, options) => {
    const $el = $(el);
    if (!options) {
      options = {};
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }

    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }


  // Keyboard events

  $window.keydown(event => {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    if (event.which === 13) {
      if (username) {
        sendMessage();
      } else {
        setUsername();
      }
    }
  });


  // Click events

  $loginPage.click(() => {
    $currentInput.focus();
  });

  $inputMessage.click(() => {
    $inputMessage.focus();
  });

  // Socket events

  socket.on('login', (data) => {
    connected = true;
    const message = 'Welcome to the chat ';
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  socket.on('new message', (data) => {
    addChatMessage(data);
  });

  socket.on('user joined', (data) => {
    log(`${data.username} joined`);
    addParticipantsMessage(data);
  });

  socket.on('user left', (data) => {
    log(`${data.username} left`);
    addParticipantsMessage(data);
    removeChatTyping(data);
  });


  socket.on('disconnect', () => {
    log('you have been disconnected');
  });

  socket.io.on('reconnect', () => {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.io.on('reconnect_error', () => {
    log('attempt to reconnect has failed');
  });

});
