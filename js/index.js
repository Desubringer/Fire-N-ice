//import Player from 'player.js';
class Player{
	constructor(row, column){
		this.row = row,
		this.column = column,
		this.dir = 'right',
		this.state = null,			//to animate 'turn'/run'/'jump'/'duck'/'fall'/'burn'/'cast'/'sleep'. null is for idle
		this.frame = 0,
		this.frames = 6,
		this.image = new Image(),
		this.image.src='img/dana.png';
	}

	Turn(){
		this.dir = this.dir=='right'?'left':'right';
		this.Draw();
		this.Animate(this.dir == 'right'? 'turnR':'turnL');
	}
	Move(moveTo){
		if(this.dir != moveTo){
			this.Turn(); return;
		}
		let step = moveTo == 'right'? 1 : -1;
		let liesAhead = this.column + step;
		
		if (field[this.row][liesAhead] == 'empty'){	//a regular step
			field[this.row][this.column] = 'empty';
			drawSquare(this.row, this.column);
			drawSquare(this.row-1, this.column);
			this.column = liesAhead;
			field[this.row][this.column] = 'player';
			this.Draw();
			fieldUpdate();
			return;
		}
		
		if (field[this.row][liesAhead] == 'fire'){ //burn, glacierfucker, burn
			this.column = liesAhead;this.Burn(); return;
		}
		
		if (field[this.row][liesAhead] == 'ice' && (field[this.row][liesAhead + step] == 'empty' || field[this.row][liesAhead + step] == 'fire')){
				this.Push(step, this.row, liesAhead); return;
		}

		if (field[this.row-1][this.column] == field[this.row-1][liesAhead] == 'empty'){ //get onto <smth> solid, if there's no obstacle above you nor above that <smth>
			//this.JumpAnim();
			this.column = liesAhead; this.row -= 1;
		}
		
	}
	
	Push(delta, row, column){
		//this.PushAnim();
		slideMustGoOn = {delta: delta, row: row, column: column};
	}
	
	Spell(){
		//this.CastAnim();

	}
	
	Burn(){
		//this.BurnAnim();
		alert('you\'ve lost!');
	}
	
	Animate(action){							//

	}//Player.Animate
	
	Draw(){										//handles the player.png set
		drawSquare(this.row, this.column);
		drawSquare(this.row-1, this.column);
		drawSquare(this.row, this.column+this.dir=='right'?-1:1);
		drawSquare(this.row-1, this.column+this.dir=='right'?-1:1);
		//let xOffset;
		//let yOffset;
		if (this.dir == 'right' && !this.state)
			ctx.drawImage(this.image, 775+(!this.frame%3 && 48), 12, 32, 52, this.column*blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5);		//stands still, looks right(also TO the right, but not primarily so)
		if (this.dir == 'left')
			ctx.drawImage(this.image, 775+(!this.frame%3 && 48), 76, 32, 52, this.column* blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5);
	}//Player.Draw
	
} //class Player

class Engine{
	constructor(frames, toAnimate){
		this.timeStart = null,
		this.timeAnim=null,
		this.timeNow = null,
		this.cycleLength = frames,
		this.frame = 0,
		this.timer = 0,
		//this.startTime = this.startDate.getTime();
		this.squaresToAnimate = toAnimate;
	}//constructor
	Tick(){
		this.frame = this.frame < this.cycleLength?this.frame+1 : 0;
		player.frame = player.frame < player.frames? player.frame+1: 0;
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
//Couldn't help, truly sorry. Not a bit sorry if you're a radfem, though

const field = [
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , gR,Li , g , iR,LiR,Li , gR,LiR,LgR,LiR,Lg , iR,Lg , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , e , e , e , e , e , e , e , e , g , g , g , g],
	[g , g , g , g , e , e , f , i , e , p , e , e , g , g , g , g],
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
} //PCseek

let PCstartPoint = PCseek();
const player = new Player(PCstartPoint[0], PCstartPoint[1]);


// mapObjects.tiles.src = 'img/tilemap.png';
// mapObjects.ice.src = 'img/ice.png';
// mapObjects.fire.src = 'img/fire.png'



let framesToAnimate=[];
for (let row = 0; row<field.length; row++)
	for (let col = 0; col<field[row].length; col++)
		if (field[row][col]!='empty' && field[row][col]!='ground' && field[row][col]!='+ground'&&
			field[row][col]!='+ground+'&&field[row][col]!='ground+'&&field[row][col]!='player')
			framesToAnimate.push([row, col]);
const engine = new Engine(5, framesToAnimate);
														//  IGNITION

var fallMustGoOn = false;						//these two are used in a lifecycle
var slideMustGoOn = false;						//to control objects while still animating them
												//changes tiles and, potentially, the level itself :o)
var lvl = 1;
var mainIterator;

window.addEventListener("keydown", function (event){
	if (!fallMustGoOn && !slideMustGoOn)
	switch (event.code){
		case 'ArrowLeft': player.Move('left'); break;
		case 'ArrowRight': player.Move('right'); break;
		case 'Space': player.Spell(); break;
//		case Enter: restartMenu(); break;
		default: return;
	}
});
const msecPerFrame = 1000/engine.cycleLength;
let Initializer = function(){		
fieldDraw();									//init field
engine.timeStart = Date.now();					//for a displayed timer, to see how long you take to get past each level
engine.timeAnim = engine.timeStart;				//time of the last frame render, used for animation throttling in couple with rAF
main();
}
window.onload = Initializer;
									//////////////////////////////
									//	>>>>	THE		<<<<<	//
									//	>>>>	ENTRY	<<<<<	//
									//	>>>>	POINT	<<<<<	//
function main(){					//////////////////////////////
mainIterator = window.requestAnimationFrame(main);
engine.timeNow = Date.now();
let timeElapsed = engine.timeNow - engine.timeAnim;
if (timeElapsed >= msecPerFrame){
	engine.Tick();
	if (fallMustGoOn) {gravity();}
	if (slideMustGoOn) {slide();}
	engine.timeAnim = engine.timeNow - (timeElapsed%msecPerFrame);
}
engine.Draw();
} // MAIN

									/*		misc lifecycle procedures	*/

function createArray(length) {
    let arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        let args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}//createArray

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
}	//fieldDraw

function animateAll(){

} //animateAll()

function fieldUpdate(){				//Check if it's too icy/hot in the air. Midair, particularly.
for (let row=field.length - 2; row!=-1; row--){	// starting from pre-last row of the map, going upwards
	for (let column=0; column<field[row]; column++){	// left to right
		if (field[row+1][column].contains != 'ground' && field[row+1][column].contains != 'ice' && field[row+1][column].contains != 'player')
			if(field[row][column].contains == 'ice' || field[row][column].contains == 'fire' || field[row][column].contains == 'player'){
				fallMustGoOn = {row: row, column: column};
			}
		}
	}
}// fieldUpdate
function gravity(block){

	let below = field[block.row+1][block.column]

		alert(`now ${field[block.row][block.column]} at [${block.row}][${block.column}]shall fall down`);
		if(below == 'fire'){
				field[block.row][block.column].contains == 'ice' && destroy(column, row, column, row+1);
		}
		below.contains = field[row][column].contains;
		field[row][column].contains = 'empty';
		drawSquare(row ,column);
		drawSquare(row, column+1);
			
		below = field[row][col+2];
		fallMustGoOn = (below && below.contains != 'ground' && below.contains != 'ice' && below.contains != 'metal' && below.contains != 'jar');
}// gravity
function drawSquare (row, column){
	ctx.drawImage(mapObjects, 0, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);		// always a background image, for a player/fire/other moving and/or half-transparent images to place upon
	switch (field[row][column]){
		case 'ground': 	drawGround(row, column);break;
		case '+ground':	if (field[row][column+1] == 'ground' || field[row][column+1] == 'ground+')			//someday, i'll master photoshop
							ctx.drawImage(mapObjects, 80, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
						else{
							ctx.drawImage(mapObjects, 16, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
							ctx.drawImage(mapObjects, 112, (lvl-1)*16, 8, 16, column*blockSize, row*blockSize, blockSize/2, blockSize); 
						}
						break;
		case '+ground+':ctx.drawImage(mapObjects, 112, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'ground+':	if (field[row][column-1] == 'ground' || field[row][column-1] == '+ground')			//and wave goodbye to dirty tricks like this
							ctx.drawImage(mapObjects, 96, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
						else{
							ctx.drawImage(mapObjects, 16, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
							ctx.drawImage(mapObjects, 120, (lvl-1)*16, 8, 16, (column+0.5)*blockSize, row*blockSize, blockSize/2, blockSize); 
						}
						break;																				//but today is not the day
		case 'ice':		ctx.drawImage(mapObjects, 0, 160+(engine.frame%3?16:0), 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'ice+':	ctx.drawImage(mapObjects, 16, 160+(engine.frame%3?16:0), 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case '+ice+':	ctx.drawImage(mapObjects, 32, 160+(engine.frame%3?16:0), 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case '+ice':	ctx.drawImage(mapObjects, 48, 160+(engine.frame%3?16:0), 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'fire':	ctx.drawImage(mapObjects, 160+(lvl-1)*32, 16*engine.frame, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		default: true;
	}

}//drawSquare
function drawGround(row, column){
	let xOffset = 48;							//Tippity tip: 16 for a single block, 32 for a left edge, 48 for a center, 64 for a right edge
	let lSide = field[row][column-1];
	let rSide = field[row][column+1];
	if (lSide != 'ground' && lSide != '+ground'){ //no ground to the left only
		xOffset -= 16; //32
		if 	(rSide != 'ground' && rSide != 'ground+') //no ground to the left AND to the right
			xOffset -= 16; //16
	}
	else{
		if (rSide != 'ground' && rSide != 'ground+') //no ground to the right
			xOffset += 16; //64
	}
	ctx.drawImage(mapObjects, xOffset, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); 
}//draw Ground

function slide(){
	
}//slide

function collision(){

}//collision

function destroy(row1, col1, row2, col2){
	// destroyAnim(row2, col2);
	field[row1][col1].contains = 'empty';
	field[row2][col2].contains = 'empty';
	drawSquare(row1, col1);
	drawSquare(row2, col2);
}//destroy

function destroyAnim(row, col) {
	//should go like this: pshhh!
}//oblIterate
