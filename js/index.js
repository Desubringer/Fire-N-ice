//import Player from 'player.js';
class Player{
	constructor(row, column){
		this.row = row,
		this.column = column,
		this.dir = true,			//true means right, false means left. An anti-moonwalking measure, not that i don't appreciate the idea
		this.state = null,			//so we can draw 'turn'/run'/'jump'/'fall'/'burn'/'cast'/'sleep'. null is for idle
		this.frame = 0,				//so we make it feel alive
		this.frames = 8,
		this.duck = false;			//separated coz shouldn't deny us moving around, unlike non-zero this.state
		this.image = new Image(),
		this.image.src='img/dana.png';
	}

	Turn(){
		this.state = 'turn';
		this.frame = 0;
		this.frames = this.duck?1:3;
		this.dir = !this.dir
	}//Player.Turn()
	
	Move(moveTo){
		if(moveTo=='right'^this.dir){		//why not
			this.Turn(); kbIgnore = true; return;
		}
		let step = moveTo == 'right'? 1 : -1; //to change column by this value, also to check the things another column ahead
		let liesAhead = this.column + step;

		if (field[this.row][liesAhead] == 'empty'){	//a regular everyday step into adjacent empty square
			kbIgnore = true;
			if (field[this.row-1][liesAhead] != 'empty')
				this.duck = true;
			this.state = 'run';
			this.frame = 0;
			this.frames = 4;
			return;
		}
		
		if (field[this.row][liesAhead] == 'fire'){ //a regular everyday step into adjacent eternal suffering
			this.column = liesAhead; this.Burn();  kbIgnore = true; return;
		}
		
		if ((field[this.row][liesAhead] == 'ice' || field[this.row][this.liesAhead] == 'metal') &&
			(field[this.row][liesAhead + step] == 'empty' || field[this.row][liesAhead + step] == 'fire')){
				
				this.Push(step, this.row, liesAhead);  return;

		}

		if (field[this.row-1][this.column] == 'empty' && field[this.row-1][liesAhead] == 'empty'){ //get onto <smth> solid before you, in case it cannot be pushed
			this.Jump(); return;
		}
		//console.log('no can do!');	//other than step/push/burn/jump, no movement types for Dana
	} //Player.Move()
	
	Push(delta, row, column){ //gets coordinates of what's being pushed
		this.state = 'push';
		this.frame = 0;
		this.frames = 1;
		kbIgnore = true;
		let toUpdate = findIndexOf(row,column);
		engine.squaresToAnimate.splice(toUpdate, 1); //moving things are invisible to the game engine, to stop redrawing. We'll do it manually in slide().
		slideMustGoOn = {delta: delta, row: row, column: column, framesLeft:12}; //to remind: sMGO.delta is +1 for right and -1 for left, the whole object being used by slide() routine

	} //Player.Push()
	
	Jump(){
		this.state = 'jump';
		this.frame = 0;
		this.frames = 4;
		kbIgnore = true;
	}//Jump()

	Fall(){
		this.state = 'fall';
		this.duck = false;
		this.frame = 0
		this.frames = 7;
		kbIgnore = true;
	}//Fall()

	Spell(){
		this.state = 'spell';
		kbIgnore = true;
		this.frame = 0;
		this.frames = 4;
	} //Player.Spell()
	
	Burn(){
		this.state = 'burn';
		kbIgnore = true;
		this.frame = 0;
		this.frames = 2;
		alert('you\'ve lost!');
	}//Player.Burn()
	
	Tick(){
		if (this.frame < this.frames || this.state == 'burn'){
			{this.frame++;keypressed = null;}	//current animation sequence continued, input flushed (user-friendly safety measure)
			if ((this.state != 'fall') && (field[this.row+1][this.column] == 'empty'))
				this.Fall();					//but even as we wait, things can happen, and because of them, we can fall
		if (this.state!='run') this.duck = (field[this.row-1][this.column] != 'empty'); //or we can crouch/stand
		}		
		else{					//idle, ready for user input, check if smth falls
			switch (this.state){								//THE ANIMATIONS AFTERMATH:
				case 'run': //console.log(`key: ${keypressed}`)
							field[this.row][this.column] = 'empty';
							this.column+=this.dir?1:-1; 
							field[this.row][this.column] = 'player';
							this.duck = field[this.row-1][this.column]!='empty';
							if (field[this.row+1][this.column] == 'empty' || field[this.row+1][this.column] == 'fire')
								{this.Fall(); return;}
							fieldUpdate(this.row);
							if (!fallMustGoOn && keypressed && field[this.row][this.column+(this.dir?1:-1)] == 'empty'){ //continue moving?
								switch (keypressed){
									case 'ArrowRight': this.Move('right'); return;	//run
									case 'ArrowLeft': this.Move('left'); return;	//farther
									default: 1;
								}
							}
							kbIgnore = false;
							break;
				case 'fall': 	field[this.row][this.column] = 'empty';
								this.row+=1;
								if (field[this.row][this.column]=='fire'){
									this.Burn();return;
								}
								field[this.row][this.column] = 'player';
								fieldUpdate(this.row);
								if (field[this.row+1][this.column] == 'empty'||
									field[this.row+1][this.column] == 'fire'){
										this.frame = 0;									//fall
										this.frames = this.frames!=5?this.frames-1:5;	//deeper
										return;											//and a bit faster
								}
								kbIgnore = false;
								break;
				case 'jump':	field[this.row][this.column] = 'empty'
								this.row--; this.column += this.dir?1:-1;
								if (field[this.row][this.column]=='fire'){
									this.Burn(); return;
								}
								field[this.row][this.column] = 'player';
								drawSquare(this.row+1, this.column);
								drawSquare(this.row+1, this.column-(this.dir?1:-1));
								break;
				case 'spell': 	drawSquare(this.row, this.column+(this.dir?1:-1));
								iceMagic(this.row+1, this.column+(this.dir?1:-1));
				default: 1; //
			}
			this.state = null;	// if running/falling sequence ends, reset to idle state
			this.frame = 0;
			this.frames = 8;
			if (!fallMustGoOn && !slideMustGoOn) {kbIgnore = false;}
			//this.duck = field[this.row-1][this.column]!='empty';
		}
	} //Player.Tick()
	Draw(){										//renders state-relevant sprites from dana.png, also renewing some squares around self coz Dana has a TALL magic hat and a LONG magic stick.
		if (!this.state){
				drawSquare(this.row-1, this.column);
				drawSquare(this.row, this.column);
				drawSquare(this.row, this.column - (this.dir?1:-1));
				ctx.drawImage(this.image, 775+(!this.duck && this.frame && !(this.frame%6) && 48)+(this.duck&&192), this.dir?12:76, 34, 52,
							this.column*blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5);		//stayin cool lookin right
		}else
			if (!this.duck) //STANDING TALL SPRITES
				switch (this.state){
					case 'turn':	drawSquare(this.row-1, this.column);
									drawSquare(this.row, this.column);
									drawSquare(this.row, this.column-(this.dir?1:-1));
									ctx.drawImage(this.image, 201+(this.frame*48), this.dir?76:12, 34, 52, this.column* blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5); break;
					case 'run': for (let i = -1; i < 2; i++){
									drawSquare(this.row+i, this.column+1);
									drawSquare(this.row+i, this.column);
									drawSquare(this.row+i, this.column-1);
								}
								ctx.drawImage(this.image, 3+(this.frame*48), this.dir?12:76, 40, 52,
										(this.column + (this.dir?1:-1)*(this.frame)/(this.frames))*blockSize, (this.row-0.5)*blockSize, blockSize*1.1, blockSize*1.5);
								break;
					case 'push': 	drawSquare(this.row-1, this.column);
									drawSquare(this.row, this.column);
									ctx.drawImage(this.image, 584, this.dir?12:76 , 32, 52, this.column* blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5); break;
					case 'burn': 	ctx.drawImage(this.image, 1112+(this.frame%2 * 48), 0, 34, 64, this.column* blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5); break;
					case 'spell':	drawSquare(this.row-1, this.column);
									drawSquare(this.row, this.column);
									drawSquare(this.row, this.column+this.dir?1:-1);
									ctx.drawImage(this.image, 870+(Math.floor(this.frame/3) * 42), this.dir?12:76,
															34+(Math.floor(this.frame/3)*14), 	52,
															(this.column - (this.dir?0.12:0.25)*Math.floor(this.frame/3))*blockSize, (this.row-0.5)*blockSize,
															blockSize*(1+0.4*Math.floor(this.frame/3)), blockSize*1.5);
								break;
					case 'jump':	drawSquare(this.row-1, this.column);
									drawSquare(this.row, this.column);
									drawSquare(this.row-1, this.column+this.dir?1:-1);
									drawSquare(this.row, this.column+this.dir?1:-1);
									ctx.drawImage(this.image, 584 + (this.frame)*48, this.dir?8:72 , 32, 54,
													(this.column+(this.dir?1:-1)*this.frame/2/this.frames)* blockSize, (this.row-0.5 - this.frame/2/this.frames)*blockSize, blockSize, blockSize*1.5); break;
									break;
					case 'fall':	drawSquare(this.row-1, this.column);
									drawSquare(this.row, this.column);
									drawSquare(this.row+1, this.column);
									if (this.frames == 7)
										ctx.drawImage(this.image, 393+((this.frame>4)&&47), 6+this.frame%2*63, 32, 52,
										this.column* blockSize, (this.row-0.5 + this.frame/this.frames)*blockSize, blockSize, blockSize*1.5);
									else
									if (this.frames == 6)
										ctx.drawImage(this.image, 537, 6+this.frame%2*63, 32, 52,
											this.column* blockSize, (this.row-0.5 + this.frame/this.frames)*blockSize, blockSize, blockSize*1.5);
									else
									if (this.frames == 5)
										ctx.drawImage(this.image, 488, 0+this.frame%2*64, 32, 64,
											this.column* blockSize, (this.row-0.7 + this.frame/this.frames)*blockSize, blockSize, blockSize*1.7);
									break;
				default: throw('Dana ain\'t well today. Must be evil sorcery');
			}
			else 			//CROUCHED SPRITES, base offset: 968
				switch (this.state){
					case 'turn':	drawSquare(this.row, this.column);
									ctx.drawImage(this.image, 968, this.dir?76:12, 34, 52, this.column* blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5); break;
					case 'run':		drawSquare(this.row, this.column);
									drawSquare(this.row-1, this.column);
									drawSquare(this.row, this.column+(this.dir?1:-1));
									ctx.drawImage(this.image, 968+(this.frame%2*48), this.dir?12:76, 40, 52,
									(this.column + (this.dir?1:-1)*(this.frame)/(this.frames))*blockSize, (this.row-0.5)*blockSize, blockSize*1.1, blockSize*1.5);
									break;
					case 'push': 	drawSquare(this.row, this.column);
									ctx.drawImage(this.image, 1065, this.dir?12:76 , 34, 52, this.column* blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5); break;
					case 'burn': 	ctx.drawImage(this.image, 1112+(this.frame%2 * 48), 76, 34, 52, this.column* blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5); break;
					case 'spell':	drawSquare(this.row, this.column);
									drawSquare(this.row, this.column+(this.dir?1:-1));
									ctx.drawImage(this.image, 870+(Math.floor(this.frame/3) * 42), this.dir?12:76,	//TODO
															34+(Math.floor(this.frame/3)*14), 	52,
															(this.column - (this.dir?0.12:0.25)*Math.floor(this.frame/3))*blockSize, (this.row-0.5)*blockSize,
															blockSize*(1+0.4*Math.floor(this.frame/3)), blockSize*1.5);
								break;
					default: throw('Dana ain\'t well today. Must be evil sorcery');
				}
	}//Player.Draw()
	
} //class Player

class Engine{
	constructor(frames, animated){
		this.timeStart = null,	//init time, for a UI timer
		this.timeAnim = null,	//these two are
		this.timeNow = null,	//for animation throttling purposes
		this.cycleLength = frames, 
		this.frame = 0,
		this.timer = 0,
		this.squaresToAnimate = animated;	//why render the whole set of squares when you only need to update animated ones?
		this.pauseTime = 0;		//timerDisplayed = date.now() - timeStart - pauseTime
	}//constructor
	Tick(){
		this.frame = this.frame < this.cycleLength?this.frame+1 : 0;
	}//Tick()
	Draw(){
		for (let i = 0; i < this.squaresToAnimate.length; i++)
			drawSquare(this.squaresToAnimate[i][0], this.squaresToAnimate[i][1]);
		player.Draw();
	}
}//class Engine

//together we stand
const Li = '+ice';		//where + means being frozen to the correspondent side
const iR = 'ice+';
const LiR = '+ice+';
const Lg = '+ground';
const gR = 'ground+';
const LgR = '+ground+';
//divided we fall
const f = 'fire';
const e = 'empty';
const m = 'metal';
const p = 'player';
const i = 'ice';
const g = 'ground';
//if (you.value != radfem) alert "Couldn\'t help not missin that one. No offence. Rly."; else alert("Have at thee, dumbass");

const field = [
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , gR,Li , g , iR,Li , g , gR,LiR,LgR,LiR,Lg , iR,Lg , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , e , e , e , e , e , e , g , e , g , g , g , g],
	[g , g , g , g , e , f , e , i , p , e , i , e , g , g , g , g],
	[g , g , g , g , e , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , e , i , e , e , e , g , g , g , g , g , g , g],
	[g , g , g , g , e , i , e , f , e , e , e , e , g , g , g , g],
	[g , g , g , g , e , i , e , f , e , e , e , e , g , g , g , g],
	[g , g , g , g , e , i , e , f , e , e , e , e , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , f , e , e , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g]
];


const canvas = document.getElementById('game');
canvas.width = canvas.height = window.innerHeight - window.innerHeight%field[0].length;
canvas.style.display = "block";
canvas.style.margin = "0 auto"
const ctx = canvas.getContext('2d');

const blockSize = canvas.height/field[0].length;
const mapObjects = new Image();
mapObjects.src = 'img/The_tileset.png'
let PCseek = () => {
	for (let row = 0; row<field.length; row++)
		for (let col = 0; col<field[row].length; col++)
			if (field[row][col] == p) return [row, col];
} //PCseek()

let PCstartPoint = PCseek();
const player = new Player(PCstartPoint[0], PCstartPoint[1]);


// mapObjects.tiles.src = 'img/tilemap.png';
// mapObjects.ice.src = 'img/ice.png';
// mapObjects.fire.src = 'img/fire.png'



let squaresToAnimate=[];
for (let row = 0; row<field.length; row++)
	for (let col = 0; col<field[row].length; col++)
		if (field[row][col]!='empty' && field[row][col]!='ground' && field[row][col]!='+ground'&&
			field[row][col]!='+ground+'&&field[row][col]!='ground+'&&field[row][col]!='player')
			squaresToAnimate.push([row, col]);
const engine = new Engine(5, squaresToAnimate);
														//  IGNITION

var fallMustGoOn = null;						//these two are used in a lifecycle
var slideMustGoOn = null;						//to control objects movements while still animating da hood

var lvl = 1;									//governs over 10 tile presets, and who knows, for choosing the very lvl? someday... %)
var mainIterator;
var keypressed;
var kbIgnore = false;
function kbHandler(event){
	keypressed = event.code;
	if (!kbIgnore){
	switch (keypressed){
				case 'ArrowLeft': player.Move('left'); break;
				case 'ArrowRight': player.Move('right'); break;
				case 'Space': player.Spell(); break;
				case 'enter': ;
				default: 1;
			}
	}
}//kbHandler()
window.addEventListener('keydown', kbHandler, true);
const msecPerFrame = 80;
let Initializer = function(){		
fieldDraw();									//displays the whole field, used but once
engine.timeStart = Date.now();					//for a displayed timer, to see how long you take to get past the current level
engine.timeAnim = engine.timeStart;				//time of the last frame rendered, used for animation throttling in couple with msecPerFrame via rAF, see main()
main();
}

window.onload = Initializer;
									//////////////////////////////
									//	>>>>	THE		<<<<<	//
									//	>>>>	ENTRY	<<<<<	//
									//	>>>>	POINT	<<<<<	//
									//////////////////////////////
function main(){
mainIterator = window.requestAnimationFrame(main);
engine.timeNow = Date.now();
let timeElapsed = engine.timeNow - engine.timeAnim;
engine.Draw();		//everytime we redraw fire/ice/metal blocks and Dana.
player.Draw();		//Otherwise requestAnimationFrame wouldn't even invoke our main(), and that's the whole idea
	if (slideMustGoOn) {slide();}
	if (fallMustGoOn) {kbIgnore=true; gravity();}
if (timeElapsed >= msecPerFrame){ //once in a while we apply changes to the picture
	engine.Tick();
	player.Tick();


	engine.timeAnim = engine.timeNow + (timeElapsed%msecPerFrame);
}

} // main()

									/*		misc lifecycle procedures	*/

/*
function fieldRandomize(){
let x = Math.floor(Math.random() * 20);
switch (x){
	case 0: return 'ground';
	case 1: return 'ice';
	case 2: return 'fire';
	default: return 'empty';
}
}
*/

function fieldDraw(){				//initial display OR full redraw
ctx.clearRect(0, 0, canvas.width, canvas.height);
for (let row=0; row<field.length; row++){
	for (let column=0; column<field[row].length; column++){
		drawSquare(row, column);
	}
}

player.Draw();
}	//fieldDraw()

function fieldUpdate(start){				//Levitation is abomination. The hunt is on!
let blockStart=null,
blockEnd=null,
row=start+1;
while(row--){		//starting from the row of the last action, going upward
	for (let column=0; column<field[row].length; column++){	// left to right
		if (!blockStart){
			switch (field[row][column]){
		  		case 'fire':	if (field[row+1][column]=='empty'||field[row+1][column]=='player') {fallMustGoOn={colStart:column, colEnd:column, row:row, frames:4}; return;}
		  						break;
		  		case 'ground+':	do	column++;							//skip all the ground-frozen elements till the right end of the block
		  							while (field[row][column] != '+ice'&&
		  									field[row][column]!='+metal'&&
		  									field[row][column]!='+ground'&&
		  									field[row][column]!='+jar'&&
		  									column<field[row].length);
			  					break;
			  	case 'ice':		if (field[row+1][column]=='empty'||field[row][column]=='fire') {fallMustGoOn={colStart:column, colEnd:column, row:row, frames:4}; return;}
			  					break;
		  		case 'ice+':	if (field[row+1][column]=='empty'||field[row+1][column=='fire'])
		  							blockStart=column;
		  						else column++; //there's at least 1 more ice frozen to it, both ain't going anywhere
		  						break;
		  		case 'metal+':	blockStart=column; break;
		  		default: ; //others, we just skip
				}
		}else{	//inside a block that is not fixed from the left side, simultaneously searching for its end(falls) or smth solid below it(doesn't)
			if (field[row+1][column]!='empty'&&field[row+1][column!='fire']){	//the block may go on, but it just won't fall
				blockStart = null; continue;									//let's find another blockStart instead
			}
			switch (field[row][column]){	//otherwise, is there a right end, and how does it look?
				case '+ground': blockStart=null; break;
				case '+jar': blockStart=null; break;
				case '+metal':	fallMustGoOn={colStart:column, colEnd:column, row:row, frames:4}; console.log(`${fallMustGoOn}`);return;
				case '+ice':	fallMustGoOn={colStart:column, colEnd:column, row:row, frames:4}; console.log(`${fallMustGoOn}`);return;
				default: ;
			}
		}
	}
}
fallMustGoOn = null;	//nothing falls, it seems
}// fieldUpdate()

function gravity(){
	let colStart;
	let colEnd;
	let row;
	let below=[];
	if (fallMustGoOn.frames == 4){ //init one-square-down cycle
		console.log('gravity initialized!');
		colStart = fallMustGoOn.colStart;
		colEnd = fallMustGoOn.colEnd;
		row = fallMustGoOn.row;
		for (let i = colStart; i<colEnd; i++){
			below.push(field[row+1][i]);
		}
		console.log(`now ${below} is going to fall from ${row}`);
	}

	if (fallMustGoOn.frames--){	//smth false
		for (let i = colStart; i<colEnd; i++){
			field[row+1][i] = field[row][i];
		}
	}else{						//smth fault
		if (below.filter((item) => (item == 'empty' || item == 'fire')).length)
			fallMustGoOn = {row: row, colStart: colStart, colEnd: colEnd, frames: 4};

	}

}// gravity()

function drawSquare (row, column){
	ctx.drawImage(mapObjects, 0, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);		// always a background image to place elements upon
	switch (field[row][column]){
		case 'ground': 	drawGround(row, column);break;
		case '+ground':	if (field[row][column+1] == 'ground' || field[row][column+1] == 'ground+')			//someday, i'm gonna master photoshop
							ctx.drawImage(mapObjects, 80, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
						else{
							ctx.drawImage(mapObjects, 16, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
							ctx.drawImage(mapObjects, 112, (lvl-1)*16, 8, 16, column*blockSize, row*blockSize, blockSize/2, blockSize); 
						}
						break;																				//and wave goodbye
		case '+ground+':ctx.drawImage(mapObjects, 112, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'ground+':	if (field[row][column-1] == 'ground' || field[row][column-1] == '+ground')			//to dirty tricks like this
							ctx.drawImage(mapObjects, 96, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
						else{
							ctx.drawImage(mapObjects, 16, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
							ctx.drawImage(mapObjects, 120, (lvl-1)*16, 8, 16, (column+0.5)*blockSize, row*blockSize, blockSize/2, blockSize); 
						}
						break;																				//but today is not the day
		case 'ice':		ctx.drawImage(mapObjects, 0, engine.frame%5?176:160, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'ice+':	ctx.drawImage(mapObjects, 16, engine.frame%5?176:160, 16.1, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case '+ice+':	ctx.drawImage(mapObjects, 32, engine.frame%5?176:160, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case '+ice':	ctx.drawImage(mapObjects, 47.9, engine.frame%5?176:160, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'metal':	ctx.drawImage(mapObjects, 63, engine.frame%5?176:160, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case '+metal':	ctx.drawImage(mapObjects, 80, engine.frame%5?176:160, 8, 16, column*blockSize, row*blockSize, blockSize/2, blockSize);
						ctx.drawImage(mapObjects, 71, engine.frame%5?176:160, 8, 16, (column+0.5)*blockSize, row*blockSize, blockSize/2, blockSize);
						break;
		case 'metal+':	ctx.drawImage(mapObjects, 63, engine.frame%5?176:160, 8, 16, column*blockSize, row*blockSize, blockSize/2, blockSize);
						ctx.drawImage(mapObjects, 88, engine.frame%5?176:160, 8, 16, (column+0.5)*blockSize, row*blockSize, blockSize/2, blockSize);
						break;
		case '+metal+':	ctx.drawImage(mapObjects, 80, engine.frame%5?176:160, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'fire':	ctx.drawImage(mapObjects, 160+(lvl-1)*32, 16*engine.frame, 16, 16.1, column*blockSize, row*blockSize, blockSize, blockSize); break;
		default: true;
	}

}//drawSquare()
function drawGround(row, column){
	let xOffset = 49;							//Tippity tip: 16 for a single block; otherwise 33 for a left edge, 49 for a center, 65 for a right edge
	let lSide = field[row][column-1];
	let rSide = field[row][column+1];
	if (lSide != 'ground' && lSide != '+ground'){ //no ground to the left only
		xOffset -= 16; //33
		if 	(rSide != 'ground' && rSide != 'ground+') //no ground to the left AND to the right
			xOffset -= 17; //16
	}
	else{
		if (rSide != 'ground' && rSide != 'ground+') //no ground to the right
			xOffset += 15; //65
	}
	ctx.drawImage(mapObjects, xOffset, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); 
}//drawGround()

function slide(){
	let delta = slideMustGoOn.delta;
	let row = slideMustGoOn.row;
	let column = slideMustGoOn.column;
	let isMetal = field[row][column]=='metal'; //metal is metal, ice is ice. i hope it's crystal clear.
	let toUpdate = slideMustGoOn.toUpdate;
	let onTheWay = field[row][column+delta];
	field[row][column] = 'empty'; //prev square turns officially empty now
	if (slideMustGoOn.framesLeft){
		ctx.drawImage(mapObjects, 0, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
		ctx.drawImage(mapObjects, (isMetal?64:0), 160, 16, 16, (column-delta*(--slideMustGoOn.framesLeft - 12)/12)*blockSize, row*blockSize, blockSize, blockSize);
	}else{ //one square slide finished
		column+=delta;	//shift attention to the destination square
		field[row][column] = isMetal?'metal':'ice';
		slideMustGoOn = null;	//by default, stop sliding
		fieldUpdate(row);
		let below = field[row+1][column];
		switch (onTheWay){ //now let's check what we have bumped into, hence induce appropriate outcomes
			case 'empty':	if (below == 'empty' || below == 'fire'){ //check whether this single block can(ergo must) fall now
								fallMustGoOn = {row: row, colStart: column, colEnd: column, frames: 4};
								return;
							}else
								if (field[row][column+delta] == 'empty' || field[row][column+delta] == 'fire'){ //feels slidey still?
									if (isMetal &&	below != 'ice'&&
													below != '+ice'&&
													below != '+ice+'&&
													below != 'ice+'
										) {engine.squaresToAnimate.push([row,column]); return;} //if metal, and no ice below us -> halt, re-animate
									slideMustGoOn = {delta: delta, row: row, column: column, framesLeft: 12, toUpdate: toUpdate}; //else go on sliding, parameters renewed
								} else engine.squaresToAnimate.push([row,column]);	//animate dead end reached block
							break;
			case 'fire':	extinguish(row, column);
							if (!isMetal){
								field[row][column] = 'empty';
								drawSquare(row, column);
								engine.squaresToAnimate.splice(findIndexOf(row,column), 1)	//if it was fire'n'ice, cease animating the other square as well
							}
							else{
								field[row][column] = 'metal';
								if ((below == 'ice'||below == '+ice'||below == '+ice+'||below == 'ice+')&&		//check if metal slides on
									(field[row][column+delta] == 'empty'||field[row][column+delta] == 'fire'))
									
									slideMustGoOn = {delta:delta, row: row, column: column, framesLeft: 12, toUpdate: toUpdate}; //...with parameters renewed, ofc
								}
							break;
			default: 1;
		}
	}
}//slide()

function extinguish(row, col){
	destroyAnim(row, col);
	drawSquare(row, col);
}//destroy()

function destroyAnim(row, col) {
	//should go like this: pshhh!
}//destroyAnim()

function iceMagic(row, column){
	//a welding inverted
}

function createArray(length) {
    let arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        let args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}//createArray()

function findIndexOf(row, column){ 
	for (let i = 0; i < engine.squaresToAnimate.length; i++){
		if (engine.squaresToAnimate[i][0]==row && engine.squaresToAnimate[i][1]==column) return i;
	}
	return -1;
}//findIndexOf()