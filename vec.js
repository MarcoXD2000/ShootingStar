//vector operations

class vec2d{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }

    rotate(a){
        var sina = Math.sin(Math.PI*2*a/360);
        var cosa = Math.cos(Math.PI*2*a/360); 
        var rx = this.x*cosa - this.y*sina;
        var ry = this.x*sina + this.y*cosa;
        return new vec2d(rx,ry);
    }
}