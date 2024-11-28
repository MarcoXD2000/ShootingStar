//vector operations

class vec2d{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }

    addition(a){
        var nx = this.x + a.x;
        var ny = this.y + a.y;
        return new vec2d(nx,ny);
    }
    
    subtraction(a){
        var nx = this.x - a.x;
        var ny = this.y - a.y;
        return new vec2d(nx,ny);
    }
    
    //a = angle in 360
    rotate(a){
        var sina = Math.sin(Math.PI*2*a/360);
        var cosa = Math.cos(Math.PI*2*a/360); 
        var rx = this.x*cosa - this.y*sina;
        var ry = this.x*sina + this.y*cosa;
        return new vec2d(rx,ry);
    }

    get length(){
        return Math.sqrt(this.x**2 + this.y**2);
    }
}