cdvar express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);


var clientdir = __dirname + '/client';

app.use(express.static(clientdir))
.use(express.json());

server.listen(8080);
console.log('Server up!');


app.get('/', function (req, res, next) {
	res.sendfile(htmldir + '/index.html');
});

var gamestate, inputs = {}, delay = 750;
app.get('/currentstate', function (req, res, next) {
	res.json(gamestate);
});

app.post('/setdelay', function (req, res, next) {
	console.log(req);
	res.send(true);
});


function serializeInput(input) {
	return input.event + '|' + input.data;
}
function deSerializeInput(string) {
	var split = string.split('|');
	return {event: split[0], data: split[1]};
}
function cycle() {
	if(Object.keys(inputs).length > 0) {
		var c = {};
		for(var i in inputs) {
			var input = serializeInput(inputs[i]);
			if(!c[input]) c[input] = 1;
			else c[input]++;
		}

		var biggest = {amount: 0};
		for(var i in c) {
			if(c[i] > biggest.amount)
				biggest = {input: i, amount: c[i]};
		}

		io.sockets.emit('output', deSerializeInput(biggest.input));
		inputs = {};
	}
	setTimeout(cycle, delay);
}

io.sockets.on('connection', function (socket) {
	socket.on('input', function(data) {
		io.sockets.emit('output', data);
		// inputs[socket.id] = data;
	});
	socket.on('random tile', function(data) {
		socket.broadcast.emit('add tile', data);
	});
	socket.on('gamestate updated', function(data) {
		gamestate = data;
	});
});

cycle();