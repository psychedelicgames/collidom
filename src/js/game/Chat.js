/**
 * This class handles the sending and receiving of chat messages as well as
 * their display. Chat messages will use the same socket as the game.
 * @author alvin.lin.dev@gmail.com (Alvin Lin)
 */

/**
 * Constructor for the Chat class.
 * @constructor
 * @param {Object} socket The socket connected to the server.
 * @param {Element} displayElement The element in which the chat will be
 *   displayed.
 * @param {Element} textElement The input element from which text will be read
 *   to be sent as a chat message to the server.
 */
 function Chat(socket, displayElement, textElement) {
 	this.socket = socket;
 	this.displayElement = displayElement;
 	this.textElement = textElement;
 }

/**
 * Factory method to create a Chat object.
 * @param {Object} socket The socket connected to the server.
 * @param {Element} displayElement The element in which the chat will be
 *   displayed.
 * @param {Element} textElement The input element from which text will be read
 *   to be sent as a chat message to the server.
 * @return {Chat}
 */
 Chat.create = function(socket, displayElement, textElement) {
 	var chat = new Chat(socket, displayElement, textElement);
 	chat.init();
 	return chat;
 };

/**
 * Binds the event handlers. This should be called during the initialization
 * in client.js.
 */
 Chat.prototype.init = function() {
 	this.textElement.addEventListener('keydown', bind(this, function(e) {
 		if (e.keyCode == 13) {
 			this.sendMessage();
 		}
 	}));

 	this.socket.on('dialogo-servidor-usuarios', bind(this, function(data) {
		//enviamos la información al canal
		this.receiveMessage(data['name'], data['creacion'], data['message'], data['message_class'], data['user_killer'], data['user_killed']);
	}));
 };

/**
 * This is called when a message is received, and will display the new
 * received message.
 * @param {string} name The name of the message sender.
 * @param {string} message The content of the message.
 * @param {boolean} isNotification Whether or not this message is an
 *   administrative notification.
 */
 Chat.prototype.receiveMessage = function(name, creacion, message, message_class, user_killer, user_killed) {
	/*
	name: players[i].name,
								message:"has been killed by",
								message_class: killed,
								user_killer: players[i].killer,
								user_killed: players[i].name


message:"<a class='view_usermame'>" + players[i].name +"</a> has been killed by <a class='view_usermame'>" + players[i].killer + "</a>",
message: body.user.username + "</a> is in for the kill.",
/*
name: " ",
message: body.user.username,
message_class: 'spawn'
*/
// console.log(message + ' ' + message_class);
$('.small-chat-container .chat-display').scrollTop(9999*9000);
if ( message_class == 'spawn') {
	variable  = "<li class='dialog'>";
	variable += '<span class="x-color-one">' + name + '</span> ';
	variable += message;
	variable += "</li>";

	$(variable).appendTo('.playing-chat-container .chat-display').delay(4500).queue(function() { $(this).remove(); });
}
else if ( message_class == 'spawn_drone') {
	variable  = "<li class='dialog'>";
	variable += '<span class="x-color-one">' + name + '</span> ';
	variable += message;
	variable += "</li>";

	$(variable).appendTo('.playing-chat-container .chat-display').delay(4500).queue(function() { $(this).remove(); });
}
else if ( message_class == 'order') {
	variable  = "<li class='dialog'>";
	variable += '<span class="x-color-one">' + name + '</span> ';
	variable += message;
	variable += "</li>";

	$(variable).appendTo('.playing-chat-container .chat-display').delay(4500).queue(function() { $(this).remove(); });
}
else if ( message_class == 'killed') {
	variable  = "<li class='dialog dialog-killed'>";
	variable += user_killed;
	variable += ' ' + message + ' ';
	variable += user_killer;
	variable += "</li>";

	$(variable).appendTo('.playing-chat-container .chat-display').delay(6500).queue(function() { $(this).remove(); });
}
else {
	// var time = conversaciones[i].creacion.split(" ");
	// var time2 = time[1].split(":");
	var username = Cookies('user_username');

	if (name == username) {
		variable = "<li class='dialog'><i class='fas fa-comment x-color-one'></i>";
	}
	else {
		variable = "<li class='dialog'><i class='fas fa-comment'></i>";
	}
	// variable += '<span class="chat-time">' + (time2[0] + ':' + time2[1] + '</span>');
	variable += '<span>' + name + ': </span>';
	variable += message;
	variable += "</li>";
	$(variable).appendTo('.small-chat-container .chat-display');
	$(variable).appendTo('.playing-chat-container .chat-display').delay(6500).queue(function() { $(this).remove(); });
	// var lis = $('.chat-display').children('li');
	// var alto = (lis.length * 19);
	$('.small-chat-container .chat-display').scrollTop(9999*9000);

}
//calculamos los lis que lleva
var messages_size = $(".playing-chat-container .chat-display li").length;
//si acumulamos más de 3, liquidamos el primero
if (messages_size > 3) {
	$('.playing-chat-container .chat-display li').first().remove();
}

};

/**
 * This is called when the user presses enter in the chatbox, and takes care
 * of taking the message they typed and sending it to the server to be relayed
 * to other clients.
 */
 //se modifica el chat para que funcione con las cookies.
 //es un problema de seguridad, dado que el usuario podría manipular las Cookies
 //a fin de impersonificar a un segundo usuario.
 //el servidor debería de recibir el nombre de usuario y el password
 //a fin de verificar que el usuario sea válido.
 //no es recomendable inicializar la información del sock, como segunda opción.
 Chat.prototype.sendMessage = function() {
 	//only available if if user is logued
 	if (Cookies('user_logued') == "True") {
 		var message = this.textElement.value;
		//buscamos las variables de cookies
		var username = Cookies('user_username');
		var password = Cookies('user_password');
		//var password = Cookies('user_password');
		this.textElement.value = '';
		this.socket.emit('dialogo-usuario-servidor', username, password, message);

		$('.small-chat-container .chat-display').scrollTop(9999*9000);
	}
	else {
		alert('need to have an account to chat');
	}
};
