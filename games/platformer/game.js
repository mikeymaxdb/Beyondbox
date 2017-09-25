"use strict";

(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();



function App(){
	this.canvas=undefined;
	this.titleContainer = undefined;
	this.canvasHeight = undefined;
	this.canvasWidth = undefined;
	this.story = undefined;
	this.keys = [];
	this.currentChapterIndex = 0;
	this.firstChapter = true;
	this.chapter = undefined;
	this.deaths = 0;

	this.startTime = 0;

	this.clockContainer = undefined;
	this.deathsContainer = undefined;

	this.start=function(){
		this.init();
	}
	this.init=function(){
		var view = this;
		var can = document.getElementById("GameCanvas");
		this.canvas=can.getContext("2d");
		this.canvasWidth = can.width;
		this.canvasHeight = can.height;

		this.titleContainer = document.getElementById("TitleContainer");
		this.clockContainer = document.getElementById("ClockContainer");
		this.deathsContainer = document.getElementById("DeathsContainer");

		this.story = new Story(this.canvasWidth, this.canvasHeight);
		//this.story.setChapter(5);


		this.loadNextChapter();


		document.body.addEventListener("keydown", function(e) {
			view.keys[e.keyCode] = true;
		});

		document.body.addEventListener("keyup", function(e) {
			view.keys[e.keyCode] = false;
		});

		this.startTime = Date.now();

		this.tick();
	}
	this.loadNextChapter = function(){
		var chapter
			
		if(this.firstChapter){
			chapter = this.story.getChapter();
			this.firstChapter = false;
		} else{
			chapter = this.story.nextChapter();
		}

		this.chapter = chapter;
	},
	this.resetChapter = function(){
		this.deaths++;
		console.log("Deaths: "+this.deaths);
		this.chapter = this.story.getChapter();
	},
	this.tick = function(){
		var view = this, last;
		this.canvas.clearRect(0,0,this.canvasWidth,this.canvasHeight);

		if(this.chapter.draw){
			this.chapter.draw(this.canvas);
		}

		this.titleContainer.innerHTML = "Chapter "+(this.story.currentChapter+1)+": "+this.chapter.title;
		var timeDelta = Date.now()-this.startTime;
		var min = Math.floor(timeDelta/1000/60);
		min=(min<10?"0"+min:min);
		var sec = (timeDelta/1000%60).toFixed(3);
		sec=(sec<10?"0"+sec:sec);
		this.clockContainer.innerHTML = min+":"+sec;
		this.deathsContainer.innerHTML = this.deaths+" death"+(this.deaths!=1?"s":"");

		this.chapter.playerCharacters.forEach(function(item, index, array){
			item.tickStart();
			
			last = (index==(array.length-1));

			view.chapter.staticElements.forEach(function(box, boxIndex, boxArray){
				var collision = view.collisionCheck(item, box)

				if(collision){
					if(box.isExit){
						view.loadNextChapter();
					} else if(box.causesDeath){
						view.resetChapter();
					}
				}
				

				item.collision(box, collision);

				if(last){
					box.draw(view.canvas);
					if(box.update){
						box.update();
					}

					// number for de-bugging
					// view.canvas.font="13px Arial";
					// view.canvas.fillStyle = "white";
					// view.canvas.fillText(boxIndex,box.x+3,box.y+13);
				}
			});
			item.update(view);
			item.draw(view.canvas);
		});

		requestAnimationFrame(function(){view.tick()});
	}

	this.collisionCheck = function(shapeA, shapeB) {
		// get the vectors to check against
		var vX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2)),
		vY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2)),
		// add the half widths and half heights of the objects
		hWidths = (shapeA.width / 2) + (shapeB.width / 2),
		hHeights = (shapeA.height / 2) + (shapeB.height / 2),
		colDir = null;

		// if the x and y vector are less than the half width or half height, they we must be inside the object, causing a collision
		if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {         // figures out on which side we are colliding (top, bottom, left, or right)
			var oX = hWidths - Math.abs(vX),
			oY = hHeights - Math.abs(vY);
			if (oX >= oY) {
				if (vY > 0) {
					colDir = "t";
				} else {
					colDir = "b";
				}
			} else {
				if (vX > 0) {
					colDir = "l";
				} else {
					colDir = "r";
				}
			}
		}
		return colDir;
	}
}

function Character(){

}

function Box(x,y,w,h,settings){
	settings = settings || {};
	this.colorConstants = {
		exit : "#6495ED",
		lava : "#B22222",
		princess: "#BF5FFF",
		villan: "#488214",
		speedUp: "#009999",
		grass: "#32CD32",
		sky: "#87CEFA",
		treeBark: "#8B4513",
		treeLeaves: "#6B8E23",
		sun: "#ff0"
	}

	this.x = x;
	this.y = y;
	this.width = w;
	this.height = h;
	this.color = this.colorConstants[settings.color] || settings.color || "#444";
	this.materialType = settings.materialType || "solid";
	this.frictionX = settings.frictionX || 0.75;
	this.isExit = settings.isExit || false;
	this.causesDeath = settings.causesDeath || false;

	if(settings.velX || settings.velY){
		this.velX = settings.velX || 0;
		this.velY = settings.velY || 0;
		this.minX = settings.minX || 0;
		this.maxX = settings.maxX || 0;
		this.minY = settings.minY || 0;
		this.maxY = settings.maxY || 0;

		this.update = function(){
			this.x += this.velX;
			this.y += this.velY;

			if(this.x > this.maxX || this.x < this.minX){
				this.velX *= -1;
			}

			if(this.y > this.maxY || this.y < this.minY){
				this.velY *= -1;
			}
		}
	}

	

	this.draw = function(canvas){
		canvas.fillStyle = this.color;
		canvas.fillRect(this.x, this.y, this.width, this.height);
	}
}

function Player(x,y,settings){
	var settings = settings || {};
	this.x = x;
	this.y = y;
	this.width = settings.width || 10;
	this.height = settings.height || 20;
	this.color = settings.color || "#FF6347";

	this.defaultheight = settings.height || 20;

	this.speedX = 10;
	this.speedY = 7;

	this.velX = 0;
	this.velY = 0;

	this.frictionX = 0.75;
	this.gravityY = 0.3;
	this.airFrictionX = 0.9999;

	this.jumping = false;
	this.grounded = false;
	this.crouching = false;

	this.tickStart = function(){
		this.grounded = false;
		//this.frictionX = this.airFrictionX;
	}

	this.collision=function(item, direction){
		
		if (direction === "l") {
			if(item.materialType == "solid"){
				this.velX = 0;
				this.jumping = false;
				this.x = item.x+item.width;
			}
		} else if (direction === "r") {
			if(item.materialType == "solid"){
				this.velX = 0;
				this.jumping = false;
				this.x = item.x-this.width;
			}
		} else if (direction === "b") {
			if(item.materialType == "solid"){
				this.grounded = true;
				this.jumping = false;
				this.frictionX = item.frictionX;
				this.y = item.y-this.height;
			}
		} else if (direction === "t") {
			if(item.materialType == "solid"){
				this.velY =0;
				this.y = item.y+item.height;
			}
		}
		if(direction && this.grounded){
			
		}
	}
	this.update = function(parent){
		if (parent.keys[38] || parent.keys[32]) { //up, space
			if(!this.jumping && this.grounded){
				this.jumping = true;
				this.grounded = false;
				this.velY = -this.speedY;
			}
		}
		if (parent.keys[39]) {// right arrow
			if (this.velX < this.speedX) {
				this.velX++;
			}
		}
		if (parent.keys[37]) {// left arrow
			if (this.velX > -this.speedX) {
				this.velX--;
			}
		}
		if (parent.keys[40]) {// down arrow
			this.crouching = true;
		} else{
			this.crouching = false;
		}

		

		this.velX *= this.frictionX;
		this.velY += this.gravityY;

		if(this.grounded){
			this.velY = 0;
		}

		this.x += this.velX;
		this.y += this.velY;

		if(this.crouching){
			if((this.height == this.defaultheight)&&this.grounded){
				this.y += this.defaultheight/2;
			}
			this.height = this.defaultheight/2;

		} else{
			if((this.height != this.defaultheight)&&this.grounded){
				this.y -= this.defaultheight/2;
			}
			this.height = this.defaultheight;
		}
	}

	this.draw = function(canvas){
		canvas.fillStyle = this.color;
		canvas.fillRect(this.x, this.y, this.width, this.height);
	}
}



function Story(w,h){
	var view = this;
	var canvasWidth = w;
	var canvasHeight = h;
	this.currentChapter = 0;
	this.chapters = [
		function(){
			// Move to the right
			this.title = "Save the princess";
			this.staticElements= [
				
				new Box(50,47,10,23,{color:"villan"}),
				new Box(100,50,10,20,{color:"princess"}),

				new Box(0,70,105,canvasHeight-200,{}),
				new Box(105,75,55,200,{color:"lava"}),
				new Box(160,0,canvasWidth,canvasHeight-130,{}),
				new Box(0,110,canvasWidth,canvasHeight-240,{}),
				new Box(0,20,5,50,{color:"exit"}),

				new Box(canvasWidth-10,canvasHeight-50,10,50,{color:"exit", isExit:true}),

				new Box(-50,-30,50,canvasHeight+60),
				new Box(-30,canvasHeight,canvasWidth+60,50),
				new Box(canvasWidth,-30,50,canvasHeight+60),
			];
			this.playerCharacters = [
				new Player(50,canvasHeight-20)
			];

			this.draw = function(canvas){
				// canvas.font="17px Arial";
				// canvas.fillStyle = "#444";
				// canvas.fillText("Find the exit",200,canvasHeight-100);
			}
		},
		function(){
			// Jump then crouch
			this.title = "Get down for real";
			this.staticElements= [
				new Box(0,0,canvasWidth,canvasHeight-150,{}),
				new Box(canvasWidth/2-200,canvasHeight-50,20,150,{}),
				new Box(canvasWidth/2+50,canvasHeight-160,120,150,{}),
				new Box(canvasWidth-10,canvasHeight-50,10,50,{color:"exit", isExit:true}),

				new Box(-50,-30,50,canvasHeight+60),
				new Box(-30,canvasHeight,canvasWidth+60,50),
				new Box(canvasWidth,-30,50,canvasHeight+60),
			];
			this.playerCharacters = [
				new Player(50,canvasHeight-20)
			];
		},
		function(){
			// Jump and crouch
			this.title = "Climb the heights";
			this.staticElements= [
				new Box(0,0,canvasWidth,canvasHeight-250,{}),
				new Box(canvasWidth/2+50,canvasHeight-80,120,80,{}),
				new Box(canvasWidth/2+160,canvasHeight-130,10,50,{color:"exit", isExit:true}),
				new Box(canvasWidth/2+170,0,500,canvasHeight,{}),

				new Box(-50,-30,50,canvasHeight+60),
				new Box(-30,canvasHeight,canvasWidth+60,50),
				new Box(canvasWidth,-30,50,canvasHeight+60),
			];
			this.playerCharacters = [
				new Player(50,canvasHeight-20)
			];
		},
		function(){
			// Jump over lava
			this.title = "Burn";
			this.staticElements= [
				new Box(0,0,canvasWidth,canvasHeight-300,{}),

				new Box(canvasWidth/2-65,canvasHeight-175,130,175,{color:"lava", causesDeath:true}),

				new Box(0,canvasHeight-180,canvasWidth/2-65,180,{}),
				new Box(canvasWidth-canvasWidth/2+65,canvasHeight-180,canvasWidth/2-50,180,{}),
				new Box(canvasWidth-canvasWidth/4-10,canvasHeight-230,10,50,{color:"exit", isExit:true}),

				new Box(0,0,canvasWidth/4,canvasHeight,{}),
				new Box(canvasWidth-canvasWidth/4,0,canvasWidth/4,canvasHeight,{}),

				new Box(-50,-30,50,canvasHeight+60),
				new Box(-30,canvasHeight,canvasWidth+60,50),
				new Box(canvasWidth,-30,50,canvasHeight+60),
			];
			this.playerCharacters = [
				new Player(canvasWidth/4+5,canvasHeight-200)
			];
		},
		function(){
			// Jump across the huge gap with a speed up platform
			this.title = "Speed up";
			this.staticElements= [
				new Box(-30,canvasHeight-30,canvasWidth+60,50,{color:"lava",causesDeath:true}),

				new Box(-10,80,50,canvasHeight),
				new Box(canvasWidth-40,80,40,canvasHeight),
				
				new Box(canvasWidth-10,30,10,50,{color:"exit", isExit:true}),

				new Box(170,100,50,10,{color:"speedUp", frictionX:0.999}),

				new Box(-50,-30,50,canvasHeight+60),
				new Box(-30,canvasHeight,canvasWidth+60,50),
				new Box(canvasWidth,-30,50,canvasHeight+60),
			];
			this.playerCharacters = [
				new Player(10,40)
			];
		},
		function(){
			// Down, then up with a platform
			this.title = "They move";
			this.staticElements= [
				new Box(canvasWidth-75,canvasHeight-350,30,10,{velY:1, maxY:canvasHeight+5, minY:80}),

				new Box(70,-80,canvasWidth-150,canvasHeight+50),

				new Box(-10,80,50,canvasHeight),
				new Box(canvasWidth-40,80,40,canvasHeight),
				
				new Box(canvasWidth-10,30,10,50,{color:"exit", isExit:true}),


				new Box(-50,-30,50,canvasHeight+60),
				new Box(-30,canvasHeight,canvasWidth+60,50),
				new Box(canvasWidth,-30,50,canvasHeight+60),
			];
			this.playerCharacters = [
				new Player(10,60)
			];
		},
		function(){
			// Platform across the lava beds
			this.title = "Across the pits";
			this.staticElements= [
				new Box(-20,75,50,50),
				new Box(-50,85,canvasWidth,50),
				new Box(30,80,canvasWidth-100,15,{color:"lava",causesDeath:true}),
				new Box(canvasWidth-70,75,20,50),
				new Box(130,75,50,5,{velX:-1,minX:30,maxX:canvasWidth-120}),

				new Box(50,205,30,50),
				new Box(50,215,canvasWidth,50),
				new Box(80,210,canvasWidth-100,15,{color:"lava",causesDeath:true}),
				new Box(canvasWidth-20,205,70,50),
				new Box(80,205,50,5,{velX:2,minX:80,maxX:canvasWidth/2-20}),
				new Box(canvasWidth-70,205,50,5,{velX:-2,maxX:canvasWidth-70,minX:canvasWidth/2+30}),

				new Box(-80,canvasHeight-50,canvasWidth+160,50,{color:"lava",causesDeath:true}),
				new Box(5,canvasHeight-60,50,5,{velY:-1.1,minY:canvasHeight-180,maxY:canvasHeight-60}),
				new Box(105,canvasHeight-180,50,5,{velY:-1.2,minY:canvasHeight-180,maxY:canvasHeight-60}),
				new Box(205,canvasHeight-60,50,5,{velY:-1.3,minY:canvasHeight-180,maxY:canvasHeight-60}),
				new Box(305,canvasHeight-180,50,5,{velY:-1.4,minY:canvasHeight-180,maxY:canvasHeight-60}),
				new Box(405,canvasHeight-60,50,5,{velY:-1.33,minY:canvasHeight-180,maxY:canvasHeight-60}),
				new Box(505,canvasHeight-180,50,5,{velY:-1.22,minY:canvasHeight-180,maxY:canvasHeight-60}),
				new Box(605,canvasHeight-60,50,5,{velY:-1.15,minY:canvasHeight-180,maxY:canvasHeight-60}),

				new Box(canvasWidth-5,canvasHeight-110,5,50,{color:"exit", isExit:true}),
				new Box(canvasWidth-5,canvasHeight-60,5,60),


				new Box(-50,-30,50,canvasHeight+60),
				new Box(-30,canvasHeight,canvasWidth+60,50),
				new Box(canvasWidth,-30,50,canvasHeight+60),
			];
			this.playerCharacters = [
				new Player(10,55)
			];
		},
		function(){
			this.title = "The End";
			this.staticElements= [
				new Box(0,0,canvasWidth,canvasHeight,{color:"sky",materialType:"ghost"}),
				new Box(canvasWidth/2-10,canvasHeight/2,20,canvasHeight/2,{color:"treeBark",materialType:"ghost"}),
				new Box(canvasWidth/2-90,canvasHeight/2-50,180,130,{color:"treeLeaves",materialType:"ghost"}),
				new Box(50,50,90,90,{color:"sun",materialType:"ghost"}),
				new Box(-30,canvasHeight-20,canvasWidth+60,30,{color:"grass"}),
				new Box(canvasWidth/2+50,canvasHeight-40,10,20,{color:"princess",isExit:true}),

				new Box(-50,-500,50,canvasHeight+560),
				new Box(-30,canvasHeight,canvasWidth+60,50),
				new Box(canvasWidth,-30,50,canvasHeight+60),
			];
			this.playerCharacters = [
				new Player(10,canvasHeight-40)
			];
		},
		
	]

	this.getChapter = function(){
		var chapter = this.chapters[this.currentChapter];
		
		return new chapter(this.currentChapter);
	}
	this.nextChapter = function(){
		this.currentChapter += 1;
		return this.getChapter();
	}
	this.previousChapter = function(){
		this.currentChapter -= 1;
		return this.getChapter();
	}
	this.setChapter = function(c){
		this.currentChapter = c;
		return this.getChapter();
	}
}

var App = new App();
App.start();