var allBalls = [];
var allBricks = [];
var allPackages = [];
var ctx;
var WIDTH;
var HEIGHT;
var paddle;
var looper;
var degreeRotate;

var frame;
var peakBalls;
var packagesCollected;

var ballsLost;
var packagesMissed;
var start;

$( document ).ready(init);

function init(){
	canvas = document.getElementById("game");
	ctx = canvas.getContext("2d");

	canvas.addEventListener('mousemove', function(evt) {
		var mousePos = getMousePos(canvas, evt);
		//mousePos.x + ',' + mousePos.y;
		paddle.x = mousePos.x-paddle.width/2;
	  }, false);

	$("#reset").click(function(){reset(false)});
	$("#overlay").hide();

	WIDTH = $("#container").width();
	HEIGHT = $("#container").height();

	console.log(WIDTH+"  "+HEIGHT);

	canvas.width=WIDTH;
	canvas.height=HEIGHT;

	// Create paddle
	paddle = new Paddle(WIDTH/2-50,HEIGHT-40,100,10);

	allBalls.push(new Ball(paddle.x+paddle.width/2,paddle.y-15,10,0,-2,"rgba(255,0,0,.5)"));
	allBalls.push(new Ball(200,200,10,1,-2,"rgba(255,0,0,.5)"));

	// Start with many balls
	// for(i=0;i<1;i++){
	// 	c1 = Math.floor(Math.random() * 255) + 1;
	// 	c2 = Math.floor(Math.random() * 255) + 1;
	// 	c3 = Math.floor(Math.random() * 255) + 1;

	// 	allBalls.push(new Ball(
	// 		Math.floor(Math.random() * 400),
	// 		Math.floor(Math.random() * 400),
	// 		10,//Math.floor(Math.random() * 40) + 1,
	// 		Math.floor(Math.random() * 5) + 1,
	// 		-Math.floor(Math.random() * 5) + 1,
	// 		"rgba("+c1+","+c2+","+c3+",.5)"
	// 	));
	// }

	rows = Math.floor(HEIGHT/30);
	cols = Math.floor(WIDTH/30);
	bh = 20;
	space = 2;
	bw = (WIDTH-(space*(cols-1)))/cols
	color = "rgb(70,70,70)";

	cx = 0;
	cy = 0;


	// Create bricks
	for(var i=0;i<rows;i++){
		for(var k=0;k<cols;k++){
			if(Math.floor(Math.random() * 10) == 7){
				//continue;
			}
			ifToPack = Math.floor(Math.random() * 100);
			pack=0;

			if(ifToPack<90){
				pack = Math.floor(Math.random() * 8)+1;
			}
			if(ifToPack > 5 && ifToPack < 7){
				pack = 9;
			}
			

			if(pack != 0)
				co = "rgb(105,210,255)";
			else
				co = color;
			
			allBricks.push(new Brick(cx,cy,bw,bh,co,pack));
			cx += bw+space;
		}
		cx = 0;
		cy += bh+space;
	}

	// Start
	frame = 0;
	start = new Date();

	peakBalls = 0;
	packagesCollected = 0;

	ballsLost = 0;
	packagesMissed = 0;

	degreeRotate = 0;

	looper = setInterval(tick, 16);
}

function tick(){

	clear();

	if(allBalls.length > peakBalls)
		peakBalls = allBalls.length;

	// Process balls
	for(var i=0;i<allBalls.length;i++){
		ball = allBalls[i];
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.size, 0, 2 * Math.PI, false);
		ctx.fillStyle = ball.color;
		ctx.closePath();
		ctx.fill();

		if(allBricks.length==0 && Math.abs(ball.dy) < 5){
			ball.dy += 1;
		}

		//Side bounce
		if (ball.x + ball.dx + ball.size > WIDTH || ball.x + ball.dx -ball.size < 0){
			ball.dx = -ball.dx;
		}
		//Top
		if (ball.y + ball.dy - ball.size < 0){
			ball.dy = -ball.dy;
		}
		//At or below paddle level
		else if (ball.y + ball.dy + ball.size > paddle.y) {
			if (ball.x > paddle.x && ball.x < paddle.x + paddle.width && ball.y+ball.size <= paddle.y) {
				//move the ball differently based on where it hit the paddle
				ball.dx = 8 * ((ball.x-(paddle.x+paddle.width/2))/paddle.width);
				ball.dy = -ball.dy;
			}
			else if (ball.y - ball.size > HEIGHT){
				if(allBalls.length == 1){
					if(allBricks.length == 0){
						allBalls.splice(i,1);
						ballsLost += 1;
						reset(true);
					}
					else{
						reset(false);
					}
					return;
				}
				else{
					allBalls.splice(i,1);
					ballsLost += 1;
					continue;
				}
			}
		}

		

		// Brick collision detection and ball bounce
		for(var r=0;r<allBricks.length;r++){
			brick = allBricks[r];
			
			if( ball.x + ball.size < brick.x ||
				brick.x + brick.width < ball.x-ball.size ||
				ball.y + ball.size < brick.y ||
				brick.y + brick.height < ball.y-ball.size){
			}
			else{
				allBricks.splice(r,1);
				if(brick.package > 0){
					allPackages.push(new Package(brick.x+brick.width/2,brick.y+brick.height/2,brick.package));
				}
				// if (ball.y + ball.size > brick.y || ball.y -ball.size < brick.y+brick.width){
				// 	ball.dy = -ball.dy;
				// }
				// else if(ball.x + ball.size > brick.x || ball.x -ball.size < brick.x+brick.width){
				// 	ball.dx = -ball.dx;
				// }
				if(ball.dx < 0 && ball.dy > 0){//DL
					if(ball.bottom-brick.top < brick.right-ball.left)
						ball.dy = -ball.dy;
					else
						ball.dx = -ball.dx;
				}
				else if(ball.dx > 0 && ball.dy > 0){//DR
					if(ball.bottom-brick.top < ball.right-brick.left)
						ball.dy = -ball.dy;
					else
						ball.dx = -ball.dx;
				}
				else if(ball.dx > 0 && ball.dy < 0){//UR
					if(brick.bottom - ball.top < ball.right - brick.left)
						ball.dy = -ball.dy;
					else
						ball.dx = -ball.dx;
				}
				else if(ball.dx < 0 && ball.dy < 0){//UL
					if(brick.bottom - ball.top < brick.right - ball.left)
						ball.dy = -ball.dy;
					else
						ball.dx = -ball.dx;
				}
				else if(ball.dy == 0 && ball.dx != 0){//LR
					ball.dx = -ball.dx
				}
				else if(ball.dx == 0 && ball.dy != 0){//UD
					ball.dy= -ball.dy
				}
				else if(Math.abs(ball.dx) == Math.abs(ball.dy)){
					ball.dy *= -1;
					ball.dx *= -1;
				}

				
			}
		}

		if(ball.dy == 0)
			ball.dy = 3;

		ball.shift();

	}

	// Process packages
	for(var u=0;u<allPackages.length;u++){
		pack = allPackages[u];
		// At or below paddle top
		if(pack.y+pack.height >= paddle.y){
			// Hit the paddle
			if(pack.x < paddle.x + paddle.width && pack.x + pack.width > paddle.x && pack.y <= paddle.y+paddle.height){
				if(pack.type ==1){
					for(var e=0;e<allBalls.length;e++){
						ball = allBalls[e];
						ball.dx *= .7;
						ball.dy *= .7;
					}
				}
				else if(pack.type ==2){
					for(var e=0;e<allBalls.length;e++){
						ball = allBalls[e];
						ball.dx *= 1.7;
						ball.dy *= 1.7;
					}
				}
				else if(pack.type ==3){
					temp = [];
					for(var e=0;e<allBalls.length;e++){
						ball = allBalls[e];
						c1 = Math.floor(Math.random() * 255) + 1;
						c2 = Math.floor(Math.random() * 255) + 1;
						c3 = Math.floor(Math.random() * 255) + 1;

						temp.push(new Ball(
							ball.x,
							ball.y,
							10,
							-ball.dx+2,//Math.floor(Math.random() * 5) + 1,
							-ball.dy-2,//-Math.floor(Math.random() * 5) + 1,
							"rgba("+c1+","+c2+","+c3+",.5)"
						));
					}
					for(var e=0;e<temp.length;e++){
						allBalls.push(temp[e]);
					}
				}
				else if(pack.type ==4){
					paddle.width += paddle.width*.2;
				}
				else if(pack.type ==5){
					paddle.width -= paddle.width*.2;
				}
				else if(pack.type ==6){
					// for(var r=0;r<allPackages.length;r++){
					// 	allPackages[r].type = Math.floor(Math.random() * 7) + 1;
					// 	allPackages[r].updateColor();
					// }

					degreeRotate -= 5;
					$("#container").css("-webkit-transform","rotate("+degreeRotate+"deg)");
				}
				else if(pack.type ==7){
					c1 = Math.floor(Math.random() * 255) + 1;
					c2 = Math.floor(Math.random() * 255) + 1;
					c3 = Math.floor(Math.random() * 255) + 1;

					$(canvas).css("background-color","rgba("+c1+","+c2+","+c3+",.3)");
				}
				else if(pack.type ==8){
					degreeRotate += 5;
					$("#container").css({ WebkitTransform: 'rotate(' + degreeRotate + 'deg)'});
				}
				else if(pack.type ==9){
					degreeRotate += 180;
					$("#container").css({ WebkitTransform: 'rotate(' + degreeRotate + 'deg)'});
				}

				allPackages.splice(u,1);
				packagesCollected += 1;
			}
			// Missed the paddle
			else{
				if(pack.y > HEIGHT){
					allPackages.splice(u,1);
					packagesMissed += 1;
				}
			}

			
		}
	}

	// Draw paddle
	ctx.beginPath();
	ctx.rect(paddle.x,paddle.y,paddle.width,paddle.height);
	ctx.fillStyle = "#333";
	ctx.closePath();
	ctx.fill();

	// Draw balls
	// for(var i=0;i<allBalls.length;i++){
	// 	ball = allBalls[i];
	// 	ctx.beginPath();
	// 	ctx.arc(ball.x, ball.y, ball.size, 0, 2 * Math.PI, false);
	// 	ctx.fillStyle = ball.color;
	// 	ctx.closePath();
	// 	ctx.fill();

	// 	ball.shift();
	// }

	// Draw bricks
	for(var r=0;r<allBricks.length;r++){
		brick = allBricks[r];
		ctx.beginPath();
		ctx.rect(brick.x,brick.y,brick.width,brick.height);
		ctx.fillStyle = brick.color;
		ctx.closePath();
		ctx.fill();
	}

	// Draw packages
	for(var u=0;u<allPackages.length;u++){
		pack = allPackages[u];
		ctx.beginPath();
		ctx.rect(pack.x,pack.y,pack.width,pack.height);
		ctx.fillStyle = pack.color;
		ctx.closePath();
		ctx.fill();

		pack.shift();
	}

	$("#bricks").html(commaSeparateNumber(allBricks.length));
	$("#balls").html(commaSeparateNumber(allBalls.length));
	$("#packs").html(commaSeparateNumber(allPackages.length));
	$("#frame").html(frame);

	$("#ballsPeak").html(commaSeparateNumber(peakBalls));
	$("#packsCollected").html(commaSeparateNumber(packagesCollected));
	tm = new Date(new Date()-start);
	$("#time").html((tm.getMinutes()<10?'0':'')+tm.getMinutes()+":"+(tm.getSeconds()<10?'0':'')+tm.getSeconds());

	$("#ballsLost").html(commaSeparateNumber(ballsLost));
	$("#packsMissed").html(commaSeparateNumber(packagesMissed));

	frame+=1;

	
}
function clear() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function Paddle(x,y,width,height){
	this.type="Paddle";
	this.x = x;
	this.y = y;
	this.height = height;
	this.width = width;
}

function Ball(x,y,size,dx,dy,color) {
	this.type = "Ball";
	this.x = x;
	this.y = y;
	this.size = size;
	this.dx = dx;
	this.dy = dy;
	this.color = color;
	this.top = y - size;
	this.bottom = y + size;
	this.left = x - size;
	this.right = x + size;
	this.shift = function () {
		this.y += this.dy;
		this.x += this.dx;
		this.top = this.y - this.size;
		this.bottom = this.y + this.size;
		this.left = this.x - this.size;
		this.right = this.x + this.size;
	};
	this.getInfo = function () {
		return this.type+"("+this.x + ',' + this.y+") " + this.size;
	};
}

function Brick(x,y,width,height,color,package){
	this.type = "Brick";
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.color = color;
	this.top = y;
	this.bottom = y + height;
	this.left = x;
	this.right = x + width;
	this.package = package;
}

function Package(x,y,type){
	this.x = x;
	this.y = y;
	this.type = type;
	this.height = 10;
	this.width = 10;
	this.dy = 2;

	this.shift = function(){
		this.y += this.dy;
	}
	this.updateColor = function(){
		if(this.type == 1)
			this.color = "#88f";
		else if(this.type == 2)
			this.color = "#f88";
		else if(this.type == 3)
			this.color = "#8f8";
		else if(this.type == 4)
			this.color = "#8ff";
		else if(this.type == 5)
			this.color = "#ff8";
		else if(this.type == 6)
			this.color = "#f8f";
		else if(this.type == 7)
			this.color = "#fff";
		else if(this.type == 8)
			this.color = "#48f";
		else if(this.type == 9)
			this.color = "#f48";
	}

	this.updateColor();
}


function getMousePos(canvas, evt) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: evt.clientX - rect.left,
		y: evt.clientY - rect.top
	};
}
function reset(won){
	allBalls.length=0;
	//allBalls = new Array();
	allBricks.length=0;
	//allBricks = new Array();
	allPackages.length=0;
	//allPackages = new Array();
	clearInterval(looper);
	
	$("#container").css("-webkit-transform","none");
	if(won){
		$("#overlay").show();
	}
	else{
		$(canvas).css("background-color","#fff");
		init();
	}
}

function commaSeparateNumber(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}
