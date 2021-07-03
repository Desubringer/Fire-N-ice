//import Player from 'player.js';
class Player{
	constructor(row, column){
		this.row = row,
		this.column = column,
		this.dir = true,			//true means right, false means left. An anti-moonwalking measure, not that i don't appreciate the idea
		this.state = null,			//so we can draw 'turn'/run'/'jump'/'fall'/'burn'/'cast'/'sleep' actions. null is for idle
		this.frame = 0,				//so we make it feel alive
		this.frames = 8,
		this.duck = false;			//separated coz combines with this.state in terms of drawing, and doesn't deny us kb controls, unlike non-null state
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
		if((moveTo=='right')^this.dir){		//why not
			this.Turn(); kbIgnore = true; return;
		}
		let step = moveTo == 'right'? 1 : -1; //player.column += step, but first
		let liesAhead = this.column + step;	//let's find out what's in front of us

		if (field[this.row][liesAhead] == 'empty' || field[this.row][liesAhead] == 'fire'){	//a regular everyday step into adjacent square
			kbIgnore = true;
			if (field[this.row-1][liesAhead] != 'empty')	//we don't want to bump our head into the wall
				this.duck = true;							//neither do we stand up until the sky is clear, so, THIS
			this.state = 'run';
			this.frame = 0;
			this.frames = 4;
			return;
		}


		if ((field[this.row][liesAhead] == 'ice' || field[this.row][liesAhead] == 'metal') &&	//pushable block?
			(field[this.row][liesAhead + step] == 'empty' || field[this.row][liesAhead + step] == 'fire')){	//with nothing solid behind?
				
				this.Push(step, this.row, liesAhead);  return;

		}

		if (field[this.row-1][this.column] == 'empty' && field[this.row-1][liesAhead] == 'empty'){ //get onto <smth> solid before you, in case it couldn't be pushed and nothing's above
			this.Jump(); return;
		}
		//console.log('no can do!');	//other than step/push/burn/jump, nothing happens
	} //Player.Move()
	
	Push(delta, row, column){ //gets direction and coordinates of what's being pushed
		this.state = 'push';
		this.frame = 0;
		this.frames = 1;
		kbIgnore = true;
		let toUpdate = findIndexOf(row,column);
		engine.squaresToAnimate.splice(toUpdate, 1); //moving things get removed from game engine's array right away. Rendered manually in slide()/gravity().
		slideMustGoOn = {delta: delta, row: row, column: column, framesLeft:15, isMetal: field[row][column]=='metal'}; //once again: sMGO.delta is +1 for right and -1 for left, the whole object being used by slide() routine
		field[row][column] = 'empty'; //pushed square turns officially empty right off the bat
	} //Player.Push()
	
	Jump(){
		this.state = 'jump';
		this.frame = 0;
		this.frames = 5;
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
	}//Player.Burn()
	
	Tick(){
		if (this.frame < this.frames || this.state == 'burn'){
			{this.frame++;keypressed = null;}	//current animation sequence continued, input flushed (user-friendly safety measure)
			if ((this.state != 'fall') && ((field[this.row+1][this.column] == 'empty') || (field[this.row+1][this.column] == 'fire')))
				this.Fall();					//but even as smth is already happening, it could affect us, you know, gravitationally
		if (this.state!='run' && this.state!='fall') this.duck = (field[this.row-1][this.column] != 'empty'); //or we can crouch/stand up
		}
		else{					//animation cycle over, ready for user input, but first we do outcome
			switch (this.state){								//ANIMATIONS AFTERMATH START:
				case 'run': 	field[this.row][this.column] = 'empty';
								this.column+=this.dir?1:-1;

								if (field[this.row][this.column] == 'fire'		//we don't need
									||field[this.row+1][this.column] == 'JAR'	//no water
									||field[this.row+1][this.column] == '+JAR'	//let the glacierfucker
									||field[this.row+1][this.column] == '+JAR+'	//burn
									||field[this.row+1][this.column] == 'JAR+'){//burn, glacierfucker	
										this.Burn(); return;					//burn.
								}

								field[this.row][this.column] = 'player';		//BUT, if we DO need no water...
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
								break;
				case 'fall': 	field[this.row][this.column] = 'empty';
								this.row++;
								if (field[this.row][this.column]=='fire'
									||field[this.row+1][this.column] == 'JAR'
									||field[this.row+1][this.column] == '+JAR'	
									||field[this.row+1][this.column] == '+JAR+'
									||field[this.row+1][this.column] == 'JAR+'){
									this.Burn();return;
								}
								field[this.row][this.column] = 'player';
								if (field[this.row+1][this.column] == 'empty'||
									field[this.row+1][this.column] == 'fire'){
										this.frame = 0;									//fall
										this.frames!=5?this.frames--:true;	//deeper (and a bit faster)
										return;
								}
								fieldUpdate(this.row);
								break;
				case 'jump':	field[this.row][this.column] = 'empty';
								this.row--; this.dir?this.column++ : this.column--;
								if (field[this.row][this.column]=='fire'
									||field[this.row+1][this.column] == 'JAR'
									||field[this.row+1][this.column] == '+JAR'	
									||field[this.row+1][this.column] == '+JAR+'
									||field[this.row+1][this.column] == 'JAR+'){
									this.Burn();return;
								}
								field[this.row][this.column] = 'player';
								drawSquare(this.row+1, this.column);
								drawSquare(this.row+1, this.column-(this.dir?1:-1));
								drawSquare(this.row, this.column-(this.dir?1:-1));
								drawSquare(this.row-1, this.column-(this.dir?1:-1));
								break;
				case 'spell': 	drawSquare(this.row, this.column+(this.dir?1:-1));
								iceMagic(this.row+1, this.column+(this.dir?1:-1));
								break;
				default: 		1;
			} 							//ANIMATIONS AFTERMATH END
			this.state = null;		//this point is not always reached, look out for the returns in the switch above 
			this.frame = 0;
			this.frames = 8;
			if (!fallMustGoOn && !slideMustGoOn) {kbIgnore = false;}	//regain control of PC, if legit.
			//this.duck = field[this.row-1][this.column]!='empty';
		}
	} //Player.Tick()
	Draw(){						//renders state-relevant sprites from dana.png, also refreshing squares around self coz the hat is TALL and the stick is LONG.
		if (!this.state){
				drawSquare(this.row-1, this.column);
				drawSquare(this.row, this.column);
				drawSquare(this.row, this.column - (this.dir?1:-1));
				ctx.drawImage(this.image, 775+(!this.duck && this.frame && !(this.frame%6) && 48)+(this.duck&&192), this.dir?12:76, 34, 52,
							this.column*blockSize, (this.row-0.5)*blockSize, blockSize, blockSize*1.5);		//stayin cool lookin this.dir (presumably, right)
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
										(this.column + (this.dir?1:-1)*(this.frame)/(this.frames) - 0.15)*blockSize, (this.row-0.5)*blockSize, blockSize*1.16, blockSize*1.5);
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
									drawSquare(this.row-1, this.column+1);
									drawSquare(this.row, this.column+1);
									drawSquare(this.row-1, this.column-1);
									drawSquare(this.row, this.column-1);
									ctx.drawImage(this.image, 584 + (this.frame&&48) + (this.frame>2 && 48) + (this.frame>3 && 48), this.dir?8:72 , 32, 54,
													(this.column+(this.frame>2 && (this.dir?0.2:-0.2)) + (this.frame>3 && (this.dir?0.4:-0.4)))* blockSize, (this.row-0.5 - (this.frame>2 && 0.4) - (this.frame>3 && 0.3))*blockSize, blockSize, blockSize*1.5); break;
									break;
					case 'fall':	drawSquare(this.row-1, this.column);
									drawSquare(this.row, this.column);
									drawSquare(this.row+1, this.column);
									if (this.frames == 7)
										ctx.drawImage(this.image, 393+((this.frame>2)&&47), 6+this.frame%2*63, 32, 52,
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
					default: throw('Dana ain\'t well today. Must\'ve caught FIRE MWAHAHAHAHAHA');
			}
			else 			//CROUCHING SPRITES, base offset: 968
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
		this.timeStart = null,	//init time, for the UI timer
		this.timeAnim = null,	//these two are
		this.timeNow = null,	//for animation throttling purposes
		this.puff = null,		//for an object containing row, col and frame of the current evaporating animation
		this.magic = null,		//~ {row, col, frame} of the current spell effects
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

//together we stand:
const Li = '+ice';		//+ means being chain-frozen to the correspondent side
const iR = 'ice+';
const LiR = '+ice+';

const Lg = '+ground';
const gR = 'ground+';
const LgR = '+ground+';

const j = 'jar';		//cold types of jar
const Lj = '+jar';
const LjR = '+jar+';
const jR = 'jar+';

const J = 'JAR';		//hot types of JAR
const LJ = '+JAR';
const LJR = '+JAR+';
const JR = 'JAR+';

const P = 'pipe';		//now THESE are going to take some effort to even draw... TO REDO?
const LP = '+pipe';
const LPR = '+pipe+';
const PR = 'pipe+';

//divided we fall:
const f = 'fire';
const e = 'empty';
const m = 'metal';
const p = 'player';
const i = 'ice';
const g = 'ground';
//if (you.value != "radfem") console.log ("Couldn\'t help it. No offence. Rly."); else alert("Touche!");

// const field = [ 	//1-4
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , e , e , e , e , e , e , e , e , e , e , g , g , g],
// 	[g , g , g , e , e , e , e , e , e , e , e , e , e , g , g , g],
// 	[g , g , g , e , e , e , e , e , e , e , e , e , e , g , g , g],
// 	[g , g , g , iR,Li , e , e , e , e , e , e , iR,Li , g , g , g],
// 	[g , g , g , f , iR,LiR,Li , e , e , iR,LiR,Li , f , g , g , g],
// 	[g , g , g , g , f , e , iR,LiR,LiR,Li , e , f , g , g , g , g],
// 	[g , g , g , g , g , f , i , p , e , i , f , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// ];

// const field = [ 	//9-9
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , e , e , e , e , e , e , e , g , g , g],
// 	[g , g , g , g , g , e , e , e , f , e , e , e , e , g , g , g],
// 	[g , g , g , g , e , e , e , gR,LiR,Lg , g , m , e , g , g , g],
// 	[g , g , g , e , e , e , g , e , p , e , g , m , e , g , g , g],
// 	[g , g , g , e , e , g , e , e , m , e , e , m , e , g , g , g],
// 	[g , g , g , g , e , e , gR,LiR,LgR,Li , f , g , g , g , g , g],
// 	[g , g , g , g , g , e , e , e , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
//];

// const field = [ 	//7-2
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , e , e , e , e , e , e , e , e , e , e , e , e , e , e , g],
// 	[g , e , e , e , g , g , g , g , g , g , g , g , e , e , e , g],
// 	[g , e , e , g , g , g , g , g , g , g , g , g , g , e , e , g],
// 	[g , e , g , g , g , g , e , e , e , e , e , g , g , g , e , g],
// 	[g , e , g , g , e , e , e , e , e , e , e , g , g , g , e , g],
// 	[g , e , g , g , e , e , e , e , f , e , e , g , g , g , e , g],
// 	[g , e , g , g , g , e , e , e , iR,LiR,LiR,Lg , g , g , e , g],
// 	[g , e , g , g , g , g , p , e , e , e , g , g , g , g , e , g],
// 	[g , e , g , g , g , g , g , e , g , i , g , g , g , g , e , g],
// 	[g , e , g , g , g , f , e , e , e , i , e , f , g , g , e , g],
// 	[g , e , e , g , g , g , g , g , g , g , g , g , g , e , e , g],
// 	[g , e , e , e , g , g , g , g , g , g , g , g , e , e , e , g],
// 	[g , e , e , e , e , e , e , e , e , e , e , e , e , e , e , g],
// ];

// const field = [ 	//13-1
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// 	[g , g , e , e , e , g , e , e , e , e , g , e , e , e , g , g],
// 	[g , e , e , e , g , e , e , g , g , f , e , e , e , g , g , g],
// 	[gR,LiR,Lg , e , e , e , e , gR,LiR,LiR,LiR,Lg , e , e , e , g],
// 	[g , g , e , e , e , g , f , e , e , e , g , e , e , g , g , g],
// 	[g , e , e , e , gR,LiR,LiR,LiR,Lg , e , e , e , e , gR,LiR,Lg],
// 	[g , g , g , f , e , e , e , g , g , e , e , g , f , e , e , g],
// 	[g , gR,LiR,LiR,LiR,Lg , e , p , e , e , gR,LiR,LiR,LiR,Lg , g],
// 	[g , e , e , e , g , e , e , g , g , f , e , e , e , g , g , g],
// 	[gR,LiR,Lg , e , e , e , e , gR,LiR,LiR,LiR,Lg , e , e , e , g],
// 	[g , g , g , e , e , g , f , e , e , e , g , e , e , g , g , g],
// 	[g , e , e , e , gR,LiR,LiR,LiR,Lg , e , e , e , e , gR,LiR,Lg],
// 	[g , g , g , e , e , e , e , g , g , e , e , g , e , e , e , g],
// 	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
// ];

const field = [ 	//JAR TESTING
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , e , e , e , g , e , e , g , g , e , e , e , e , g , g , g],
	[e , e , e , e , e , e , e , e , e , e , e , e , e , e , g , g],
	[g , g , e , e , e , g , e , e , e , e , g , e , e , e , g , g],
	[g , e , e , e , e , e , f , e , e , e , e , e , e , e , g , g],
	[g , g , e , e , e , gR,LiR,Lg , e , e , p , e , e , e , e , g],
	[g , e , e , g , e , e , e , e , e , e , g , e , e , e , e , g],
	[g , e , e , e , g , e , j , e , g , e , J , e , g , e , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
	[g , g , g , g , g , g , g , g , g , g , g , g , g , g , g , g],
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


let squaresToAnimate=[];
for (let row = 0; row<field.length; row++)
	for (let col = 0; col<field[row].length; col++)
		if (field[row][col]=='ice' || field[row][col] == '+ice' || field[row][col] =='+ice+' || field[row][col] == 'ice+'||
			field[row][col]=='metal' || field[row][col] == '+metal' || field[row][col] =='+metal+' || field[row][col] == 'metal+'||
			field[row][col]=='JAR' || field[row][col]=='+JAR' || field[row][col]=='+JAR+' || field[row][col]=='JAR+' ||
			field[row][col]=='fire')
			squaresToAnimate.push([row, col]);
const engine = new Engine(5, squaresToAnimate);
														//  IGNITION

let fallMustGoOn = null;						//these two are used in a lifecycle
let slideMustGoOn = null;						//to control moving blocks while still animating the neighbourhood

let lvl = 9;									//governs over 10 tile presets, and who knows, for choosing the very lvl, someday? %)
let mainIterator;
let keypressed;
let kbIgnore = false;

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
const msecPerFrame = 60;
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



	engine.timeAnim = Date.now();
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

function fieldUpdate(start){				//Levitation is abomination. The hunt is on! Also fires up jars when needed
let blockStart=null,						//Checks all the squares from `start` line to the top
blockEnd=null;								//might be redesigned to checking engine.squaresToAnimate only, once upon a time
if (fallMustGoOn) return; //we DO NOT re-init fMGO when another fall is scheduled/happening! messes the whole thing up! to each it's turn(as per original game, btw)
let row=start+1; //start line may be 0(i.e. top). while() doesnt trust 0s. cheat system engaged!
while(row--){		//from the row of the last action, going upward
	for (let column=0; column<field[row].length; column++){
		if (!blockStart){
			switch (field[row][column]){
		  		case 'fire':	let underFire = field[row+1][column];
		  						if (underFire=='empty'||underFire=='player'){
		  							fallMustGoOn={colStart:column, colEnd:column, row:row, frames:15};
		  							return;
		  						}
		  						if (underFire=='jar'||underFire=='+jar'||
		  							underFire=='+jar+'||underFire=='jar+')
		  							field[row+1][column] = underFire.split('jar').join('JAR');
		  							engine.squaresToAnimate.push([row+1,column]);
		  						break;
		  		case 'ground+':	do	column++;							//these won't fall
		  							while (column<field[row].length &&
		  									field[row][column] != '+ice' &&
		  									field[row][column] != '+metal' &&
		  									field[row][column] != '+ground' &&
		  									field[row][column] != '+jar' &&
		  									field[row][column] != '+JAR');
			  					break;
			  	case 'jar+':	do	column++;							//these neither
		  							while (column<field[row].length &&
		  									field[row][column] != '+ice' &&
		  									field[row][column] != '+metal' &&
		  									field[row][column] != '+ground' &&
		  									field[row][column] != '+jar' &&
		  									field[row][column] != '+JAR');
			  					break;
			  	case 'JAR+':	do	column++;
		  							while (column<field[row].length &&
		  									field[row][column] != '+ice' &&
		  									field[row][column] != '+metal' &&
		  									field[row][column] != '+ground' &&
		  									field[row][column] != '+jar' &&
		  									field[row][column] != '+JAR');
			  					break;
			  	case 'ice':		if (field[row+1][column]=='empty'||field[row+1][column]=='fire'){
			  						fallMustGoOn={colStart:column, colEnd:column, row:row, frames:15};
			  						return;
			  					}
			  					break;
			  	case 'metal':		if (field[row+1][column]=='empty'||field[row][column]=='fire'){
			  						fallMustGoOn={colStart:column, colEnd:column, row:row, frames:15};
			  						return;
			  					}
			  					break;
		  		case 'ice+':	if (field[row+1][column]=='empty'||field[row+1][column]=='fire'){
		  							blockStart=column;
		  							console.log('new block found at '+ row +' row, '+ column +' column');
		  						}
		  						else{
		  							do column++;
		  							while (column<field[row].length &&
		  									field[row][column] != '+ice' &&
		  									field[row][column] !='+metal' &&
		  									field[row][column] !='+ground' &&
		  									field[row][column] !='+jar' &&
		  									field[row][column] !='+JAR');
		  							blockStart=null;
		  						}
		  						break;
		  		case 'metal+':	if (field[row+1][column]=='empty'||field[row+1][column]=='fire'){
		  							blockStart=column;
		  							console.log('new block found at '+ row +' row, '+ column +' column');
		  						}
		  						else{
		  							do column++;
		  							while (column<field[row].length &&
		  									field[row][column] != '+ice' &&
		  									field[row][column]!='+metal' &&
		  									field[row][column]!='+ground' &&
		  									field[row][column]!='+jar'&&
		  									field[row][column]!='+JAR');
		  							blockStart=null;
		  						}
		  						break;
		  		default: ; //others, we just skip, for they are but FALLESS. Or, well, bugged?.
				}
		}else{	//blockStart initialized, means we're searching for the right end, but first...
			if (field[row+1][column]!='empty'&&field[row+1][column]!='fire'){	//the ice-welded block may continue, but it just isn't going to fall
				blockStart = null;												//move on to finding another blockStart
			}
			else{
			switch (field[row][column]){	//otherwise, have we reached the right end?
				case '+ground': blockStart=null; break;
				case '+jar': blockStart=null; break;
				case '+jar+': blockStart=null; break;
				case '+JAR': blockStart=null; break;
				case '+JAR+': blockStart=null; break;
				case '+metal':	fallMustGoOn={colStart:blockStart, colEnd:column, row:row, frames:15}; ;return;
				case '+ice':	fallMustGoOn={colStart:blockStart, colEnd:column, row:row, frames:15}; ;return;
				default: 1;//console.log('the search is now on ' + row + ' row,' + column + ' column, and goes on');
				}
			}
		}
	}
}
fallMustGoOn = null;	//if we didn't hit return by now, nothing is levitating
kbIgnore = false;		//and we regain control
}// fieldUpdate()

let below = [];	

function gravity(){
	let colStart = fallMustGoOn.colStart;
	let colEnd = fallMustGoOn.colEnd;
	let row = fallMustGoOn.row;
	if (fallMustGoOn.frames == 15){ //init one-square-down cycle
		below =[];
		for (let i = colStart; i<=colEnd; i++){	
			below.push(field[row+1][i]);		//memorize what's below and
			let current = findIndexOf(row, i);	//if it's animated(~wasn't sliding before falling)
			if (current != -1)
				engine.squaresToAnimate.splice(current, 1); //animation: off, we're gonna do it manually
		}
	}

	if (fallMustGoOn.frames--){	//smth false
		for (let i = colStart; i<=colEnd; i++){
			ctx.drawImage(mapObjects, 0, (lvl-1)*16, 16, 16, i*blockSize, row*blockSize, blockSize, blockSize);
			switch (field[row][i]){
				case 'ice':		ctx.drawImage(mapObjects, 0, 160, 16, 16, i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize, blockSize); break;
				case 'ice+':	ctx.drawImage(mapObjects, 16, 160, 16.1, 16, i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize, blockSize); break;
				case '+ice+':	ctx.drawImage(mapObjects, 32, 160, 16, 16, i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize, blockSize); break;
				case '+ice':	ctx.drawImage(mapObjects, 47.9, 160, 16, 16, i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize, blockSize); break;
				case 'metal':	ctx.drawImage(mapObjects, 63, 160, 16, 16, i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize, blockSize); break;
				case '+metal':	ctx.drawImage(mapObjects, 80, 160, 8, 16, i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize/2, blockSize);
								ctx.drawImage(mapObjects, 71, 160, 8, 16, (i+0.5)*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize/2, blockSize);
								break;
				case 'metal+':	ctx.drawImage(mapObjects, 63, 160, 8, 16, i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize/2, blockSize);
								ctx.drawImage(mapObjects, 88, 160, 8, 16, (i+0.5)*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize/2, blockSize);
								break;
				case '+metal+':	ctx.drawImage(mapObjects, 80, 160, 16, 16, i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize, blockSize); break;
				case 'fire':	ctx.drawImage(mapObjects, 160+(lvl-1)*32, 16*engine.frame, 16, 16.1,
								i*blockSize, (row+(15-fallMustGoOn.frames)/15)*blockSize, blockSize, blockSize);
								break;
				default: console.log('is this even supposed to fall? i mean, ' + field[row][i] + ' from row ' + row + ' col ' + i);
			}
		}
	}else{						//smth fault
		fallMustGoOn = null;		//let's pause gravity for a nano to see what gives
		for (let i = colStart; i<=colEnd; i++){
			if (below[i-colStart] == 'fire'){		//the most interesting part: if there was a fire below
				extinguish(row+1, i);			//making funny noises is mandatory, yes
				switch (field[row][i]){ 		//now. we iterate through the chain left to right, so [row]'n'[col] of a mutating square are bound to differ, watch out!
					case 'ice':		field[row+1][i] = 'empty'; break;
					case '+ice': 	switch (field[row+1][i-1]){	//right edge melts, only previous block affected
										case 'ice+': field[row+1][i-1] = 'ice'; break;
										case '+ice+': field[row+1][i-1] = '+ice'; break;
										case 'metal+': field[row+1][i-1] = 'metal'; break;
										case '+metal+': field[row+1][i-1] = '+metal'; break;
										default: console.log('N-n-nani?');
									}
									field[row+1][i] = 'empty';
									break;
					case '+ice+':	switch (field[row+1][i-1]){	//middle block melts, prev block affected
										case 'ice+': field[row+1][i-1] = 'ice'; break;
										case '+ice+': field[row+1][i-1] = '+ice'; break;
										case 'metal+': field[row+1][i-1] = 'metal'; break;
										case '+metal+': field[row+1][i-1] = '+metal'; break;
										default: console.log('N-n-nani?');
									}
									switch (field[row][i+1]){	//the next one is affected, too
										case '+ice': field[row][i+1] = 'ice'; break;
										case '+ice+': field[row][i+1] = 'ice+'; break;
										case '+metal': field[row][i+1] = 'metal'; break;
										case '+metal+': field[row][i+1] = 'metal+'; break;
										default: console.log('N-n-nani?');
									}
									field[row+1][i] = 'empty';
									break;
					case 'ice+': 	switch (field[row][i+1]){	//left edge melts, only next block affected
										case '+ice': field[row][i+1] = 'ice'; break;
										case '+ice+': field[row][i+1] = 'ice+'; break;
										case '+metal': field[row][i+1] = 'metal'; break;
										case '+metal+': field[row][i+1] = 'metal+'; break;
										default: console.log('N-n-nani?');
									}
									field[row+1][i] = 'empty';
									break;
					default:		field[row+1][i] = field[row][i]; 	//this fires for every immeltable (~metal) piece
				}
			}
			else{								//when below != fire, hence empty, therefore [i] block falls down gracefully.
				field[row+1][i] = field[row][i];
				engine.squaresToAnimate.push([row+1,i]);
			}
			drawSquare(row+1, i);

			field[row][i] = 'empty';				//okay, the former square can turn empty now
			}
		fieldUpdate(row+1); 	//any more blocks floatin around freely?
	}

}// gravity()

function drawSquare (row, column){
	ctx.drawImage(mapObjects, 0, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);		// always a background image to place an element upon
	switch (field[row][column]){
		case 'ground': 	drawGround(row, column);break;
		case '+ground':	if (field[row][column+1] == 'ground' || field[row][column+1] == 'ground+')			//someday, i'm gonna master photoshop
							ctx.drawImage(mapObjects, 80, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
						else{
							ctx.drawImage(mapObjects, 16, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
							ctx.drawImage(mapObjects, 112, (lvl-1)*16, 8, 16, column*blockSize, row*blockSize, Math.floor(blockSize/2), blockSize); 
						}
						break;																				//and wave goodbye
		case '+ground+':ctx.drawImage(mapObjects, 112, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'ground+':	if (field[row][column-1] == 'ground' || field[row][column-1] == '+ground')
							ctx.drawImage(mapObjects, 96, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
						else{																				//to dirty tricks like this
							ctx.drawImage(mapObjects, 16, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
							ctx.drawImage(mapObjects, 120, (lvl-1)*16, 8, 16, Math.round((column+0.5)*blockSize), row*blockSize, Math.round(blockSize/2), blockSize); 
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
		case 'jar':		ctx.drawImage(mapObjects, 128, 0, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case '+jar':	ctx.drawImage(mapObjects, 144, 0, 8, 16, column*blockSize, row*blockSize, blockSize/2, blockSize); 
						ctx.drawImage(mapObjects, 136, 0, 8, 16, (column+0.5)*blockSize, row*blockSize, blockSize/2, blockSize);
						break;
		case '+jar+':	ctx.drawImage(mapObjects, 144, 0, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'jar+':	ctx.drawImage(mapObjects, 128, 0, 8, 16, column*blockSize, row*blockSize, blockSize/2, blockSize); 
						ctx.drawImage(mapObjects, 152, 0, 8, 16, (column+0.5)*blockSize, row*blockSize, blockSize/2, blockSize);
						break;
		case 'JAR':		ctx.drawImage(mapObjects, 128, 16*(1+engine.frame), 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case '+JAR':	ctx.drawImage(mapObjects, 144, 16*(1+engine.frame), 8, 16, column*blockSize, row*blockSize, blockSize/2, blockSize); 
						ctx.drawImage(mapObjects, 136, 16*(1+engine.frame), 8, 16, (column+0.5)*blockSize, row*blockSize, blockSize/2, blockSize);
						break;
		case '+JAR+':	ctx.drawImage(mapObjects, 144, 16*(1+engine.frame), 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		case 'JAR+':	ctx.drawImage(mapObjects, 128, 16*(1+engine.frame), 8, 16, column*blockSize, row*blockSize, blockSize/2, blockSize); 
						ctx.drawImage(mapObjects, 152, 16*(1+engine.frame), 8, 16, (column+0.5)*blockSize, row*blockSize, blockSize/2, blockSize);
						break;
		case 'fire':	ctx.drawImage(mapObjects, 160+(lvl-1)*32, 16*engine.frame, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); break;
		default: true;	//illegal objects are persecuted by irrendering
	}

}//drawSquare()
function drawGround(row, column){
	let xOffset = 47.5; 		//the mid-block of a prolonged ground patch
	let lSide = field[row][column-1];
	let rSide = field[row][column+1];
	if (lSide != 'ground' && lSide != '+ground'){
		xOffset = 32;	//left edge
		if 	(rSide != 'ground' && rSide != 'ground+')
			xOffset = 16;	//a standaloner
	}
	else{
		if (rSide != 'ground' && rSide != 'ground+')
			xOffset = 63.5;	//right edge
	}
	ctx.drawImage(mapObjects, xOffset, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize); 
}//drawGround()

function slide(){
	let delta = slideMustGoOn.delta;
	let row = slideMustGoOn.row;
	let column = slideMustGoOn.column;
	let isMetal = slideMustGoOn.isMetal; //Metal is metal, ice is ice. The difference is crystal clear.
	let onTheWay = field[row][column+delta];
	//console.log('pushing ' + field[row][column]);
	if (slideMustGoOn.framesLeft){	//our little pretty slide smoothering 'while' substitute
		ctx.drawImage(mapObjects, 0, (lvl-1)*16, 16, 16, column*blockSize, row*blockSize, blockSize, blockSize);
		ctx.drawImage(mapObjects, (isMetal?64:0), 160, 16, 16, (column-delta*(--slideMustGoOn.framesLeft - 15)/15)*blockSize, row*blockSize, blockSize, blockSize);
	}else{ //one square slide = done
		column+=delta;	//shift attention to the destination square
		console.log('changing field['+row+']['+column+'] to ' +(isMetal?'metal':'ice'));
		field[row][column] = isMetal?'metal':'ice';
		slideMustGoOn = null;	//prevent further sliding (for a while?)
		let below = field[row+1][column];	//just for the case
		switch (onTheWay){ //now let's check what we have bumped into, hence induce proper outcomes
			case 'empty':	if (below == 'empty' || below == 'fire'){ //check whether this single block can(ergo must) fall now 
								fallMustGoOn = {row: row, colStart: column, colEnd: column, frames: 15};
								return;
							}else
								if (!isMetal)
									if (below == 'JAR'||below == '+JAR'||below == '+JAR+'||below == 'JAR+'){
										extinguish(row, column);
										field[row][column] = 'empty';
										drawSquare(row, column);
										fieldUpdate(row);
										return;
									}
								if (field[row][column+delta] == 'empty' || field[row][column+delta] == 'fire'){ //feels slidey still?
									if (isMetal &&	below != 'ice'&&
													below != '+ice'&&
													below != '+ice+'&&
													below != 'ice+'
										) {engine.squaresToAnimate.push([row,column]); fieldUpdate(row); return;} //if metal, and no ice below it -> halt, re-animate, check gravity
									slideMustGoOn = {delta: delta, row: row, column: column, framesLeft: 15, isMetal: isMetal}; //else go on sliding, parameters renewed
									field[row][column] = 'empty';
								} else {fieldUpdate(row); engine.squaresToAnimate.push([row,column]);}	//re-animate the block that reached the dead end
							break;
			case 'fire':	extinguish(row, column);	//first, we're, like, pshhh
							if (!isMetal){
								field[row][column] = 'empty';
								drawSquare(row, column);
								engine.squaresToAnimate.splice(findIndexOf(row,column), 1);	//fire'n'ice annihilate -> cease animating recipient square as well
								fieldUpdate(row);
							}
							else{
								field[row][column] = 'metal';
								if ((below == 'ice'||below == '+ice'||below == '+ice+'||below == 'ice+')&&		//check if metal piece slides on
									(field[row][column+delta] == 'empty'||field[row][column+delta] == 'fire')){
									engine.squaresToAnimate.splice(findIndexOf(row,column), 1);		//if it does, current square is ejected from animated ones(if it's not, "shine on you crazy metal")
									slideMustGoOn = {delta:delta, row: row, column: column, framesLeft: 15, isMetal: isMetal}; //parameters renewed
								}
							}
							break;
			default: 1;
		}
	}
}//slide()

function extinguish(row, col){
	destroyAnim(row, col);
	//playSFX('extinguish');
}//destroy()

function destroyAnim(row, col) {
	drawSquare(row, col);
	//should go like this: pshhh!
}//destroyAnim()

function iceMagic(row, column){		//this function mostly relies on working with strings
									//coz whenever we put/remove an ice square,
									//it affects(and is affected by) adjacent squares in terms of managing '+'es
	switch (field[row][column]){
		case 'empty':	if (field[row+1][column]=='JAR'||field[row+1][column]=='+JAR'||
							field[row+1][column]=='+JAR+'||field[row+1][column]=='JAR+')
								return;
						field[row][column] = 'ice';
						if (field[row][column-1] != 'empty' && field[row][column-1] != 'fire'){
							field[row][column-1] += '+';
							field[row][column] = '+'+field[row][column];
							drawSquare(row, column-1);
						}
						if (field[row][column+1] != 'empty' && field[row][column+1] != 'fire'){
							field[row][column+1] = '+'+field[row][column+1];
							field[row][column] += '+';
							drawSquare(row, column+1);
						}
						engine.squaresToAnimate.push([row, column]);
						break;
						
		case 'ice': 	engine.squaresToAnimate.splice(findIndexOf(row, column), 1);
						field[row][column] = 'empty';
						drawSquare(row, column);
						fieldUpdate(row-1);
						break;
		case '+ice': 	engine.squaresToAnimate.splice(findIndexOf(row, column), 1);
						field[row][column] = 'empty';
						field[row][column-1] = field[row][column-1].slice(0, -1);
						drawSquare(row, column);
						drawSquare(row, column-1);
						fieldUpdate(row); 
						break;
		case '+ice+': 	engine.squaresToAnimate.splice(findIndexOf(row, column), 1);
						field[row][column] = 'empty';
						field[row][column-1] = field[row][column-1].slice(0, -1);
						field[row][column+1] = field[row][column+1].slice(1);
						drawSquare(row, column);
						drawSquare(row, column-1);
						drawSquare(row, column+1);
						fieldUpdate(row);
						break;
		case 'ice+': 	engine.squaresToAnimate.splice(findIndexOf(row, column), 1);
						field[row][column] = 'empty';
						field[row][column+1] = field[row][column+1].slice(1);
						drawSquare(row, column);
						drawSquare(row, column+1);
						fieldUpdate(row);
						break;
		default: 1;	//playSFX('spell-failed');
	}

} //iceMagic()

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