var express = require('express'); // ExpressJS 모듈을 추가
var app = express();
var mongojs = require('mongojs'); // MongoDB 연결 해야되니 MongoJS 모듈도 추가
var db = mongojs('inp_prj', ['images']); // 여기서 genie는 database 이름이고 images테이블을 사용할꺼라고 선언
var bodyParser = require('body-parser'); // json 형태로 파싱할꺼니까 모듈 추가
var formidable = require('formidable'); // form 태그 데이터들을 가져오는 모듈
var fs = require('fs-extra'); // 파일을 복사하거나 디렉토리 복사하는 모듈
var dateUtils  = require('date-utils');



app.use(express.static(__dirname + '/public')); //public 폴더 안에 javascript 파일과 css파일을 모아둘 예정
app.use(bodyParser.json()); // body-parser 모듈을 사용해서 파싱 해줌
app.engine('html', require('ejs').__express);
app.set('views', __dirname + '/views'); // ejs 파일들을 저장하기 위해 경로 추가했음
app.set('view engine', 'ejs'); // ejs를 html로 바꿔주면 html로 파일 실행됩니다.


app.get('/', function(req, res) { // 웹에서 실행할 주소가 localhost:3000/ 이거일때를 선언
    res.render('index'); // index.ejs로 써도 되고 index만 써도 파일 실행을 해줍니다.
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
		//실제 저장하는 경로와 db에 넣어주는 경로로 나눠 주었는데 나중에 편하게 불러오기 위해 따로 나눠 주었음
		filePath = db_new_location + file_name;
		fs.copy(temp_path,new_location + file_name, function(err) { // 이미지 파일 저장하는 부분임
			if (err) {
				console.error(err);
			}
		});
	}

	db.images.insert({"name":name,"filePath":filePath, "regdate" : (new Date()).toFormat('YYYY-MM-DD HH24:MI:SS')},function(err,doc){
	//디비에 저장
	});
  });
  res.redirect("/"); // http://localhost:8080/ 으로 이동!
});

app.get('/image',function(req,res){ //몽고디비에서 filePath 와 name을 불러옴
    db.images.find(function(err,doc){
        res.json(doc);
    });
});

var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)

server.listen(8080); //server 구동 포트 localhost:8080 여기에 쓰입니다.
console.log("Server running on port 8080");


// 이 채팅 서버에 현재 접속한 사용자명을 저장할 변수
var usernames = {};
io.sockets.on('connection', function (socket) {
  // 클라이언트가 sendchat 이벤트를 전송할 경우 처리할 리스너 함수
  socket.on('sendchat', function (data) {
	// 클라이언트가 updatechat 함수를 실행하도록 알린다. 
    // 이때 updatechat 함수에 전달한 인자는 2개다.
	var dbm = mongojs('inp_prj', ['messages']);
	dbm.messages.insert({"name":socket.username,"msg":data, "regdate" : (new Date()).toFormat('YYYY-MM-DD HH24:MI:SS')},function(err,doc){
	//디비에 저장
	});
    io.sockets.emit('updatechat', socket.username, data);	
  });
  // 클라이언트가 sendimg 이벤트를 전송할 경우 처리할 리스너 함수
  socket.on('sendimg', function (path) {
	// 클라이언트가 updatechat 함수를 실행하도록 알린다. 
    // 이때 updatechat 함수에 전달한 인자는 2개다.
	
	var dbm = mongojs('inp_prj', ['images']);
	dbm.images.find().sort({_id:-1}).limit(1).toArray(function(err, doc){
        doc.forEach(function(item){
			//console.log('fjew: '+item.filePath);
			io.sockets.emit('updateimg', socket.username, item.filePath);				
		});
    });
		
  });
  
  
  // 클라이언트가 adduser 이벤트를 전송할 경우 처리할 리스너 함수
  socket.on('adduser', function(username){
    // 이 클라이언트를 위한 소켓 세션에 username이라는 필드에 클라이언트가 전송한 값을 저장한다. 
    socket.username = username;
    // 클라이언트의 username을 사용자 목록을 관리하는 전역 변수인 usernames에 추가한다.
    usernames[username] = username;
    // 클라이언트에게 채팅 서버에 접속되었다고 알린다.
    socket.emit('updatechat', 'SERVER', 'you have connected');
    // 사용자가 채팅 서버에 추가되었다는 메시지를 전역으로(모든 클라이언트에게) 알린다.
    socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
    // 채팅을 사용하는 변경된 사용자 목록을 클라이언트에게 업데이트하도록 updateusers 함수를 실행하도록 알린다.
    io.sockets.emit('updateusers', usernames);
  });
  // 사용자가 접속을 끊을 경우 처리할 리스너 함수
  socket.on('disconnect', function(){
    // 사용자 목록을 관리하는 전역변수에서 해당 사용자를 삭제한다.
    delete usernames[socket.username];
    // 채팅을 사용하는 변경된 사용자 목록을 클라이언트에게 업데이트하도록 updateusers 함수를 실행하도록 알린다.
    io.sockets.emit('updateusers', usernames);
    // 사용자가 채팅 서버에서 나갔다는 메시지를 전역으로(모든 클라이언트에게) 알린다.
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
  });
});
