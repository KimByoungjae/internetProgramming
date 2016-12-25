var express = require('express'); // ExpressJS ����� �߰�
var app = express();
var mongojs = require('mongojs'); // MongoDB ���� �ؾߵǴ� MongoJS ��⵵ �߰�
var db = mongojs('inp_prj', ['images']); // ���⼭ genie�� database �̸��̰� images���̺��� ����Ҳ���� ����
var bodyParser = require('body-parser'); // json ���·� �Ľ��Ҳ��ϱ� ��� �߰�
var formidable = require('formidable'); // form �±� �����͵��� �������� ���
var fs = require('fs-extra'); // ������ �����ϰų� ���丮 �����ϴ� ���
var dateUtils  = require('date-utils');



app.use(express.static(__dirname + '/public')); //public ���� �ȿ� javascript ���ϰ� css������ ��Ƶ� ����
app.use(bodyParser.json()); // body-parser ����� ����ؼ� �Ľ� ����
app.engine('html', require('ejs').__express);
app.set('views', __dirname + '/views'); // ejs ���ϵ��� �����ϱ� ���� ��� �߰�����
app.set('view engine', 'ejs'); // ejs�� html�� �ٲ��ָ� html�� ���� ����˴ϴ�.


app.get('/', function(req, res) { // ������ ������ �ּҰ� localhost:3000/ �̰��϶��� ����
    res.render('index'); // index.ejs�� �ᵵ �ǰ� index�� �ᵵ ���� ������ ���ݴϴ�.
});
app.get('/section1.html', function(req, res) { 
    res.sendFile(__dirname + '/views/section1.html');	
});

app.post('/search', function(req, res){
	var dbm = mongojs('inp_prj', ['messages']);
	
	var senddata = "";
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        senddata = fields.name;
    });
	dbm.messages.find(function(err,doc){
        var origin = doc;
		
		var result = "<html><body><ul>";
		origin.forEach(function(item){
			var match_name = (item.name).match(senddata);
			var match_msg = (item.msg).match(senddata);
			var match_regdate = (item.regdate).match(senddata);
			
			if(match_name || match_msg || match_regdate){			
				var itemstring = "<li>" + item._id + "<ul><li>" + item.name +
				"</li><li>" + item.msg + "</li><li>" + item.regdate +
				"</li></ul></li>";
				result = result + itemstring;	
			}			
		});
		result = result + "</ul></body></html>";
		res.send(result);
		//res.json(doc);
    });	
	
});	

app.post('/search2', function(req, res){
	var dbm = mongojs('inp_prj', ['images']);
	
	var senddata = "";
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        senddata = fields.name;
    });
	dbm.images.find(function(err,doc){
        var origin = doc;
		
		var result = "<html><h1>DB search Result</h1><body><ul>";
		origin.forEach(function(item){
			var match_name = (item.name).match(senddata);
			var match_msg = (item.filePath).match(senddata);
			var match_regdate = (item.regdate).match(senddata);
			
			if(match_name || match_msg || match_regdate){			
				var itemstring = "<li>" + item._id + "<ul><li>" + item.name +
				"</li><li>" + item.filePath + "</li><li>" + item.regdate +
				"</li></ul></li>";
				result = result + itemstring;	
			}			
		});
		result = result + "</ul></body></html>";
		res.send(result);			
    });
});	

app.post('/upload',function(req,res){ 
    var name = "";
    var filePath = "";
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        name = fields.name;
    });

  form.on('end', function(fields, files) {
	for (var i = 0; i < this.openedFiles.length; i++) {
		var temp_path = this.openedFiles[i].path;
		var file_name = this.openedFiles[i].name;
		var index = file_name.indexOf('/'); 
		var new_file_name = file_name.substring(index + 1);
		var new_location = 'public/resources/images/'+name+'/';
		var db_new_location = 'resources/images/'+name+'/';
		//���� �����ϴ� ��ο� db�� �־��ִ� ��η� ���� �־��µ� ���߿� ���ϰ� �ҷ����� ���� ���� ���� �־���
		filePath = db_new_location + file_name;
		fs.copy(temp_path,new_location + file_name, function(err) { // �̹��� ���� �����ϴ� �κ���
			if (err) {
				console.error(err);
			}
		});
	}

	db.images.insert({"name":name,"filePath":filePath, "regdate" : (new Date()).toFormat('YYYY-MM-DD HH24:MI:SS')},function(err,doc){
	//��� ����
	});
  });
  res.redirect("/"); // http://localhost:8080/ ���� �̵�!
});

app.get('/image',function(req,res){ //�����񿡼� filePath �� name�� �ҷ���
    db.images.find(function(err,doc){
        res.json(doc);
    });
});

var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)

server.listen(8080); //server ���� ��Ʈ localhost:8080 ���⿡ ���Դϴ�.
console.log("Server running on port 8080");


// �� ä�� ������ ���� ������ ����ڸ��� ������ ����
var usernames = {};
io.sockets.on('connection', function (socket) {
  // Ŭ���̾�Ʈ�� sendchat �̺�Ʈ�� ������ ��� ó���� ������ �Լ�
  socket.on('sendchat', function (data) {
	// Ŭ���̾�Ʈ�� updatechat �Լ��� �����ϵ��� �˸���. 
    // �̶� updatechat �Լ��� ������ ���ڴ� 2����.
	var dbm = mongojs('inp_prj', ['messages']);
	dbm.messages.insert({"name":socket.username,"msg":data, "regdate" : (new Date()).toFormat('YYYY-MM-DD HH24:MI:SS')},function(err,doc){
	//��� ����
	});
    io.sockets.emit('updatechat', socket.username, data);	
  });
  // Ŭ���̾�Ʈ�� sendimg �̺�Ʈ�� ������ ��� ó���� ������ �Լ�
  socket.on('sendimg', function (path) {
	// Ŭ���̾�Ʈ�� updatechat �Լ��� �����ϵ��� �˸���. 
    // �̶� updatechat �Լ��� ������ ���ڴ� 2����.
	
	var dbm = mongojs('inp_prj', ['images']);
	dbm.images.find().sort({_id:-1}).limit(1).toArray(function(err, doc){
        doc.forEach(function(item){
			//console.log('fjew: '+item.filePath);
			io.sockets.emit('updateimg', socket.username, item.filePath);				
		});
    });
		
  });
  
  
  // Ŭ���̾�Ʈ�� adduser �̺�Ʈ�� ������ ��� ó���� ������ �Լ�
  socket.on('adduser', function(username){
    // �� Ŭ���̾�Ʈ�� ���� ���� ���ǿ� username�̶�� �ʵ忡 Ŭ���̾�Ʈ�� ������ ���� �����Ѵ�. 
    socket.username = username;
    // Ŭ���̾�Ʈ�� username�� ����� ����� �����ϴ� ���� ������ usernames�� �߰��Ѵ�.
    usernames[username] = username;
    // Ŭ���̾�Ʈ���� ä�� ������ ���ӵǾ��ٰ� �˸���.
    socket.emit('updatechat', 'SERVER', 'you have connected');
    // ����ڰ� ä�� ������ �߰��Ǿ��ٴ� �޽����� ��������(��� Ŭ���̾�Ʈ����) �˸���.
    socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
    // ä���� ����ϴ� ����� ����� ����� Ŭ���̾�Ʈ���� ������Ʈ�ϵ��� updateusers �Լ��� �����ϵ��� �˸���.
    io.sockets.emit('updateusers', usernames);
  });
  // ����ڰ� ������ ���� ��� ó���� ������ �Լ�
  socket.on('disconnect', function(){
    // ����� ����� �����ϴ� ������������ �ش� ����ڸ� �����Ѵ�.
    delete usernames[socket.username];
    // ä���� ����ϴ� ����� ����� ����� Ŭ���̾�Ʈ���� ������Ʈ�ϵ��� updateusers �Լ��� �����ϵ��� �˸���.
    io.sockets.emit('updateusers', usernames);
    // ����ڰ� ä�� �������� �����ٴ� �޽����� ��������(��� Ŭ���̾�Ʈ����) �˸���.
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
  });
});
