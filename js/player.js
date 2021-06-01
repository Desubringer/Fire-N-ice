export class Player{
	constructor(x, y){
		this.x = x
		this.y = y;
		this.dir = 'right';
		this.image = new Image();
		this.image.src='img/dana.png';
	}
	Action(button){
		/*
		if (button == 'left') this.Move('left');
		if (button == 'right') this.Move('right');
		if (button == 'spell') this.Spell();
		*/
		//else, naturally, keep on StandStill()
	}
	Turn(){
		this.dir = this.dir=='right'?'left':'right';
	}
	Move(moveTo){
		if(this.dir != moveTo)
			this.Turn();
		let destination = this.x + (moveTo == 'right'? 1 : -1);
		if field[this.y][destination].contains == 'empty' this.x=destination;
		else ;		
		}
	Spell(){
		//this.castAnim();

	}
}