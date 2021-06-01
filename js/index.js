//import Player from 'player.js';
class Player{
	constructor(row, column){
		this.row = row
		this.column = column;
		this.dir = 'right';
		this.image = new Image();
		this.image.src='img/dana.png';
	}

	Turn(){
		this.dir = this.dir=='right'?'left':'right';
		this.Draw();
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
			field[this.row][this.column] = 'player'
			this.Draw();
			fieldUpdate();
			return;
		}
		
		if (field[this.row][liesAhead] == 'fire'){ //burn, glacierfucker, burn
			this.column = liesAhead;this.Burn(); return;
		}
		
		if (field[this.row][liesAhead] == 'ice' && field[this.row][liesAhead + step] == 'empty' || field[this.row][liesAhead + step] == 'fire'){
				this.Push(step, this.row, liesAhead);
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
	Draw(){
		drawSquare(this.row, this.column);
		drawSquare(this.row-1, this.column);
		if (this.dir == 'right')
			ctx.drawImage(this.image, 765, 12, 52, 52, this.column * blockSize - 16, this.row*blockSize - 25, blockSize*1.5, blockSize*1.5);		//stands still, looks right(also TO the right, but not primarily so)
		if (this.dir == 'left')
			ctx.drawImage(this.image, 765, 76, 52, 52, this.column * blockSize - 16, this.row*blockSize - 25, blockSize*1.5, blockSize*1.5);
	}
	
}

const canvas = document.getElementById('game');
canvas.width = canvas.height = window.innerHeight * 0.9;
const ctx = canvas.getContext('2d');

const f = 'fire';
const e = 'empty';
const m = 'metal';
const p = 'player';
const i = 'ice';
const g = 'ground';
const field = [
	[g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g],
	[g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g],
	[g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g],
	[g,g,g,g,e,e,e,e,e,e,e,e,g,g,g,g],
	[g,g,g,g,e,e,f,i,e,p,e,e,g,g,g,g],
	[g,g,g,g,e,g,g,g,g,g,g,g,g,g,g,g],
	[g,g,g,g,e,i,e,e,e,g,g,g,g,g,g,g],
	[g,g,g,g,e,i,e,f,e,e,e,g,g,g,g,g],
	[g,g,g,g,e,i,e,f,e,e,e,g,g,g,g,g],
	[g,g,g,g,g,g,g,g,g,f,g,g,g,g,g,g],
	[g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g],
	[g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g],
	[g,g,g,g,g,g,g,g,g,g,g,g,g,g,g,g]
];
const blockSize = canvas.height/field[0].length;
const mapObjects = {'tiles': new Image(),
	'ice': new Image(),
	'fire': new Image()
};
let PCseek = () => {
	for (let row = 0; row<field.length; row++)
		for (let col = 0; col<field[row].length; col++)
			if (field[row][col] == p) return [row, col];
} //PCseek
const PCstartPoint = PCseek();
const player = new Player(PCstartPoint[0], PCstartPoint[1]);

mapObjects.tiles.src = 'img/tilemap.png';
mapObjects.ice.src = 'img/ice.png';
mapObjects.fire.src = 'img/fire.png'


window.onload = main;

									//  IGNITION

var fallMustGoOn = false;			//these two are used in a lifecycle
var slideMustGoOn = false;			//to control objects while still animating them
var lvl = 1;						//changes tiles and, potentially, the level itself :o)

window.addEventListener("keydown", function (event){
	console.log(event.code);
	switch (event.code){
		case 'ArrowLeft': player.Move('left'); break;
		case 'ArrowRight': player.Move('right'); break;
		case 'Space': player.Spell(); break;
//		case Enter: restartLvl(); break;
		default: return;
	}
});

function main(){					//READY

fieldDraw();						//SET

gravity();							//GO

slide();

fieldUpdate();

} // MAIN

									/*		lifecycle procedures	*/

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
	if (!fallMustGoOn) return;
	let below = field[block.row+1][block.column]

		alert(`now ${field[block.row][block.column]} at [${block.row}][${block.column}]shall fall down`);
		if(below == 'fire'){
				field[block.row][block.column].contains == 'ice' && destroy(column, row, column, row+1);
			break;
		}
		below.contains = field[i][j].contains;
		field[i][j].contains = 'empty';
		drawSquare(i ,j);
		drawSquare(i, j+1);
			
		below = field[i][j+2];
		fallMustGoOn = (below && below.contains != 'ground' && below.contains != 'ice' && below.contains != 'metal' && below.contains != 'jar');
}// gravity
function drawSquare (row, column){
	ctx.drawImage(mapObjects.tiles, 0, (lvl-1)*32, 32, 32, column*blockSize, row*blockSize, blockSize, blockSize);		// background image
	switch (field[row][column]){
		case 'ground': 	ctx.drawImage(mapObjects.tiles, 32, (lvl-1)*32, 32, 32, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'ice':		ctx.drawImage(mapObjects.ice, 0, 0, 32, 32, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'fire':	ctx.drawImage(mapObjects.fire, 0, 0, 32, 32, column*blockSize, row*blockSize, blockSize, blockSize); break;
	}
}//drawSquare
function slide(){
	if (!slideMustGoOn) return;

}//slide
function collision(){

}//collision
function destroy(row1, col1, row2, col2){
	// oblIterate(row2, col2);
	field[row1][col1].contains = 'empty';
	field[row2][col2].contains = 'empty';
	drawSquare(row1, col1);
	drawSquare(row2, col2);
}//destroy

function oblIterate(row, col) {
	//should go like this: pshhh!
}//oblIterate
