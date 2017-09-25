// https://github.com/hecht-software/box2dweb
// https://github.com/hecht-software/box2dweb/blob/master/demo.html
// http://blog.sethladd.com/2011/09/box2d-javascript-example-walkthrough.html
// http://buildnewgames.com/assets/article//box2dweb/js/example4.js

// Break out box2d
var     b2Vec2 = Box2D.Common.Math.b2Vec2
	,   b2AABB = Box2D.Collision.b2AABB
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2ContactListener = Box2D.Dynamics.b2ContactListener
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
	,   b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
	;

var STATES = {
	STARTING: 0,
	READY: 1,
	FIRING: 2,
	WAITING: 3,
	ALLBALLSIN: 4
}
var game = {
	canvas: {},
	settings: {
		scale: 60,
		canvasScale: 2,
		gravity: .01,
		shouldRest: false,
		boxWidth: 7,
		boxHeight: 10,
		ballSize: .20,
		ballSpeed: 20,
		debug: false
	},
	state: {
		stage: STATES.STARTING,
		level: 1,
		ballsInMotion: 0,
		firstBallPosition: {
			x: undefined,
			y: undefined
		},
		launchVector: undefined,
		fireIndex: 0,
		lastFireTime: 0,
		speedBoost:1
	},
	ui: {},
	world: undefined,
	contactListener: undefined,
	balls: [],
	boxes: [],
	start: function(){
		this.canvas.el = document.getElementById("c");
		this.canvas.context = this.canvas.el.getContext("2d");
		this.canvas.width = this.canvas.el.width;
		this.canvas.height = this.canvas.el.height;

		this.canvas.el.onmouseup = this.onMouseUp.bind(this);

		this.ui.level = document.getElementById("level");
		this.ui.balls = document.getElementById("balls");
		this.ui.speed = document.getElementById("speed");

		this.ui.speed.onmouseup = (function(){
			this.state.speedBoost += 1;
		}).bind(this);

		this.world = new b2World(new b2Vec2(0, this.settings.gravity), this.settings.shouldRest);
		this.contactListener = new b2ContactListener;
		this.contactListener.BeginContact = this.onContact.bind(this);
		this.world.SetContactListener(this.contactListener);
		
		this.addWalls();
		this.addBoxes();
		this.addBalls(2);

		this.updateUI();

		if(this.settings.debug){
			this.setupDebugRender();
		}

		this.state.stage = STATES.READY;
		window.requestAnimationFrame(this.tick.bind(this));
	},
	updateUI: function(){
		this.ui.level.innerHTML = this.state.level;
		this.ui.balls.innerHTML = this.balls.length - this.state.fireIndex;
	},
	onContact: function(contact){
		var box,bottom,ball;
		
		function process(body){
			var data = body.GetUserData();
			if(data){
				if(data.health){
					box = body;
				} else if(data.type == "bottom"){
					bottom = body;
				} else if(data.radius){
					ball = body;
				}
			}
		}
		process(contact.GetFixtureA().GetBody());
        process(contact.GetFixtureB().GetBody());

        if(box){
        	box.GetUserData().health = box.GetUserData().health-1;
        } else if(bottom){
        	if(!this.state.firstBallPosition.x){
        		this.state.firstBallPosition.x = ball.GetPosition().x;
	    		this.state.firstBallPosition.y = ball.GetPosition().y;
        	}

        	ball.SetLinearVelocity(new b2Vec2(0,0));
        	this.state.ballsInMotion -= 1;
        	if(this.state.ballsInMotion == 0 && this.state.stage == STATES.WAITING){
        		this.state.stage = STATES.ALLBALLSIN;
        	}
        }
	},
	addWalls: function(){
		var size = 10/this.settings.scale
		var thickness = (size / 2);
		var tallness = (this.canvas.height / this.settings.scale) / 2;
		var wideness = (this.canvas.width / this.settings.scale) / 2

		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 0;
		fixDef.restitution = 1;
		fixDef.shape = new b2PolygonShape;

		// Bottom
		var bodyDef = new b2BodyDef;
		bodyDef.type = b2Body.b2_staticBody;
		bodyDef.userData = {
			type: "bottom"
		}
		bodyDef.position.x = this.canvas.width / 2 / this.settings.scale;
		bodyDef.position.y = this.canvas.height / this.settings.scale+size/2;
		fixDef.shape.SetAsBox(wideness, thickness);
		this.world.CreateBody(bodyDef).CreateFixture(fixDef);


		// Top
		var bodyDef = new b2BodyDef;
		bodyDef.type = b2Body.b2_staticBody;
		bodyDef.position.x = this.canvas.width / 2 / this.settings.scale;
		bodyDef.position.y = -size/2;
		fixDef.shape.SetAsBox(wideness, thickness);
		this.world.CreateBody(bodyDef).CreateFixture(fixDef);

		// Left
		bodyDef.position.x = -size/2;
		bodyDef.position.y = this.canvas.height/this.settings.scale/2;
		fixDef.shape.SetAsBox(thickness,tallness);
		this.world.CreateBody(bodyDef).CreateFixture(fixDef);

		// Right
		bodyDef.position.x = this.canvas.width/this.settings.scale+size/2;
		fixDef.shape.SetAsBox(thickness,tallness);
		this.world.CreateBody(bodyDef).CreateFixture(fixDef);
	},
	advanceBoxes: function(){
		var that = this;
		this.boxes.forEach(function(box){
			var body = box.GetBody();
			var v = new b2Vec2(body.GetPosition().x,body.GetPosition().y+that.canvas.height/that.settings.boxHeight/that.settings.scale)
			body.SetPosition(v);
		})
	},
	addBoxes: function(){
		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 0;
		fixDef.restitution = 1;

		// Half width,height
		var h_width = this.canvas.width/this.settings.boxWidth/this.settings.scale/2;
		var h_height = this.canvas.height/this.settings.boxHeight/this.settings.scale/2

		var draw = function(context,box){
			context.lineWidth = .05;
			context.textAlign = "center";
			context.fillStyle = "#458588";
			context.strokeStyle = "#555";

			context.fillRect(box.GetPosition().x-this.width/2,box.GetPosition().y-this.height/2,this.width,this.height);
			context.strokeRect(box.GetPosition().x-this.width/2,box.GetPosition().y-this.height/2,this.width,this.height);
			context.fillStyle = "#fff"
			context.font="1px arial";
			context.fillText(this.health,box.GetPosition().x,box.GetPosition().y+this.height/4);
		}

		
		for(var i = 0; i < this.settings.boxWidth; i++) {
			if(Math.random()*2>1){
				continue;
			}
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_staticBody;
			bodyDef.userData = {
				draw: draw,
				height: h_height*2,
				width: h_width*2,
				health: Math.ceil(Math.random()*(this.state.level+1)+this.state.level-1)
			}

			fixDef.shape = new b2PolygonShape;

			fixDef.shape.SetAsBox(h_width,h_height);
			
			bodyDef.position.x = h_width*2*i+h_width;
			bodyDef.position.y = h_height*2+h_height;
			
			this.boxes.push(this.world.CreateBody(bodyDef).CreateFixture(fixDef));
		}
	},
	updateBallPositions: function(){
		var that = this;
		this.balls.forEach(function(ball){
			var v = new b2Vec2(that.state.firstBallPosition.x,that.state.firstBallPosition.y)
			ball.GetBody().SetPosition(v);
		});
	},
	addBalls: function(numBalls){
		var fixDef = new b2FixtureDef;
		fixDef.density = 1.0;
		fixDef.friction = 0;
		fixDef.restitution = 0;
		fixDef.filter.categoryBits = 2;
		fixDef.filter.maskBits = 1;

		var bodyDef = new b2BodyDef;
		bodyDef.type = b2Body.b2_dynamicBody;
		bodyDef.userData = {
			draw: function(context,ball){
				context.beginPath();
				context.arc(ball.GetPosition().x, ball.GetPosition().y, this.radius, 0, 2 * Math.PI, false);
				context.fillStyle = '#fff';
				context.fill();
			},
			radius: this.settings.ballSize
		}
		for(var i = 0; i < numBalls; i++) {
			fixDef.shape = new b2CircleShape(
				this.settings.ballSize
			);

			bodyDef.position.x = this.canvas.width/2/this.settings.scale;
			bodyDef.position.y = this.canvas.height/this.settings.scale-this.settings.ballSize;
			this.balls.push(this.world.CreateBody(bodyDef).CreateFixture(fixDef));
		}
	},
	setupDebugRender: function(){
		//setup debug draw
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(this.canvas.context);
		debugDraw.SetDrawScale(this.settings.scale);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		this.world.SetDebugDraw(debugDraw);
	},
	onMouseUp: function(e){
		if(this.state.stage != STATES.READY){
			return;
		}
		var that = this;

	    mouseX = (e.clientX - this.canvas.el.offsetLeft) / this.settings.scale * this.settings.canvasScale;
	    mouseY = (e.clientY - this.canvas.el.offsetTop) / this.settings.scale * this.settings.canvasScale;

	    var bX = this.state.firstBallPosition.x || this.balls[0].GetPosition().x;
	    var bY = this.state.firstBallPosition.y || this.balls[0].GetPosition().y;

	    var angle = Math.atan((mouseX-bX)/(bY-mouseY));

	    var vX = Math.sin(angle)*this.settings.ballSpeed;
	    var vY = -1*Math.cos(angle)*this.settings.ballSpeed;

	    this.state.launchVector = new b2Vec2(vX,vY);
		
		this.launchCleanup();
	    this.launchBalls();
	},
	launchBalls: function(){
		this.state.stage = STATES.FIRING;
		this.balls[this.state.fireIndex].GetBody().SetLinearVelocity(this.state.launchVector);
		this.state.fireIndex += 1;
		this.state.ballsInMotion += 1;
		
		if(this.state.fireIndex < this.balls.length){
			setTimeout(this.launchBalls.bind(this),100);
		} else{
			this.state.fireIndex = 0;
			this.state.stage = STATES.WAITING;
		}
	},
	launchCleanup: function(){
		this.state.firstBallPosition.x = undefined;
		this.state.firstBallPosition.y = undefined;
		this.state.ballsInMotion = 0;
	},
	tick: function(){
		if(this.state.stage == STATES.ALLBALLSIN){
			this.state.level += 1;
			this.state.speedBoost = 1;
			this.advanceBoxes();
			this.addBoxes();
			this.addBalls(2);
			this.updateBallPositions();
			this.state.stage = STATES.READY;
		}

		this.updateUI();

		var frameRate = 1/(60/this.state.speedBoost), velocity = 10, position = 10, curTime;
		this.world.Step(frameRate, velocity, position);

		// Render
		if(this.settings.debug){
			this.world.DrawDebugData();
		} else{
			var obj = this.world.GetBodyList();
			this.canvas.context.clearRect(0,0,this.canvas.width,this.canvas.height);

			this.canvas.context.save();
			this.canvas.context.scale(this.settings.scale,this.settings.scale);
			while(obj) {
				var body = obj.GetUserData();
				if(body){
					if(body.health == 0){
						// TODO break this out for debug
						this.world.DestroyBody(obj);
					} else if(body.draw){
						body.draw(this.canvas.context,obj);
					}
				}

				obj = obj.GetNext();
			}

			this.canvas.context.restore();
		}
		
		this.world.ClearForces();

		window.requestAnimationFrame(this.tick.bind(this));
	}
}

game.start();