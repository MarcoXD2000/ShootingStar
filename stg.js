//起動時の処理
function setup(){
    canvasSize(1200, 720);
    loadImg(0, "image/bg.png");
    loadImg(1, "image/spaceship.png");
    loadImg(2, "image/missile.png");
    loadImg(3, "image/explode.png");
    for(var i=0; i<=4; i++) loadImg(4+i, "image/enemy"+i+".png");
    for(var i=0; i<=2; i++) loadImg(9+i, "image/item"+i+".png");
    loadImg(12, "image/laser.png");
    loadImg(13, "image/title_ss.png");
    initSShip();
    //initMissile();
    initObject();
    loadSound(0, "sound/bgm.m4a");
}

//メインループ
var FPS = 75;
const Scene = Object.freeze({
    TITLE: 0,
    STAGE: 1,
    GAMEOVER: -1,
});
const AUTO_MISSILE_CD = int(5 * FPS/30);
const IFRAME = int(30 * FPS/30);
const MAX_SHIP_ENERGY = 10;
const ENEMY_IFRAME = int(1 * FPS/30);

var tmr = 0;
var scene = Scene.TITLE;
var stage = 1;
var score = 0;
var hiScore = 0;

function mainloop(){
    tmr++;
    drawBG(1);
    setFPS(FPS);
    
    switch (scene) {
        case Scene.TITLE:
            drawImg(13, 200, 200);
            if (tmr % int(FPS*4/3) < int(FPS*2/3))fText("Press [SPC] or Click to start.", 600, 540, 40, "cyan");
            if (key[32] == 1 || tapC == 1) {
                key[32] = 0;
                tapC = 0;
                initSShip();
                initObject();
                score = 0; 
                stage = 1;
                scene = Scene.STAGE;
                tmr = 0;
                playBgm(0);
                score = 0;
            }
            
            break;


        case Scene.STAGE:
            gameoverCheck();

            moveSShip();
            moveObjects();
            moveMissile();
            setEnemies();
            setItems();
            
            hitCheck();
            autoHandle();
            lifeGaugeHandle();
            drawEffects();
            
            stageHandle();

            //console.log("tmr = ", tmr);

            break;

        case Scene.GAMEOVER:
            const [x,y] = getShipLocation();
            if (tmr > FPS*5) scene = Scene.TITLE;
            else if (tmr % int(FPS*1/6) == 1) setExplosion(x+rnd(120)-60, y+rnd(90)-40, 9);
            moveObjects();
            moveMissile();
            drawEffects();
            fText("GAME OVER", 600, 300, 50, "red");
            
            break;
    }

    drawScore();
}

//背景のスクロール
var bgx = 0;
function drawBG(spd){
    bgx = (bgx + spd) % 1200;
    drawImg(0,-bgx,0);
    drawImg(0,1200-bgx,0);

    var horizonY = 580;
    var offsetX = bgx%40;
    lineW(2);
    for(var i=1; i < 30; i++){
        var tx = i*40-offsetX;
        var bx = i*240-offsetX*6-3000;
        line(tx, horizonY, bx, 720, "sliver");
    }
    for(var i=1; i < 12; i++){
        lineW(1+int(i/3));
        line(0, horizonY, 1200, horizonY, "gray");
        horizonY = horizonY + i*2;
    }
}

//ゲームの進行を管理する変数

//Objects
const MISSILE_RADIUS = 12;
const SELF_RADIUS = 30;

class GameObject {
    constructor(x, y, xp, yp, t, life){
        this.x = x;
        this.y = y;
        this.xp = xp;
        this.yp = yp ;
        this.t = t;
        this.life = life;
        this.muteki = 0;
    }
    
    drawObject(){
        this.x = this.x + this.xp * 30/FPS;
        this.y = this.y + this.yp * 30/FPS;
        drawImgC(this.t, this.x, this.y);
    }

    hitCheck(other, r1, r2){
        if (getDis(this.x, this.y, other.x, other.y) < (r1 + r2)) return true;
    }
}

//自機の管理
class SShip {
    constructor(x, y){
        this.ship = new GameObject(x,y,0,0,1,MAX_SHIP_ENERGY);
        //this.energy = 10;
        this.auto = false;
        this.missileTmr = 0;
    }

    moveSShip(){
        //Ship movement
        this.ship.x += int(((key[39] && 1) - (key[37] && 1)) * 20 * 30/FPS);
        if (this.ship.x >= 1000) this.ship.x = 999; 
        if (this.ship.x <= 60) this.ship.x = 61;
        this.ship.y += int(((key[40] && 1) - (key[38] && 1)) * 20 * 30/FPS); 
        if (this.ship.y >= 680) this.ship.y = 679; 
        if (this.ship.y <= 40) this.ship.y = 41;
        

        //Touch/Mouse
        if (tapC > 0){
            if (tapX > 900 && tapX < 1180 && tapY > 20 && tapY < 80){
                tapC = 0;
                this.auto = !this.auto;
            }
            else {
                this.ship.x += int((tapX-this.ship.x)/6);
                this.ship.y += int((tapY-this.ship.y)/6);
            }
        }
        
        //missile movement
        if (key[65] == 1){
            key[65] = 2;
            this.auto = !this.auto;
        }
    
        //prevent auto and spc at the same time
        if (this.auto) key[32] = 2;

        if (key[32] == 1 || (this.auto && !(this.missileTmr))){ 
            setMissile();
            key[32] = 2;      
        }
    
        if (this.ship.muteki % 2 == 0) this.ship.drawObject();
        if (this.ship.muteki > 0) this.ship.muteki--;
    }

    getEnergy(){
        return this.ship.life;
    }
}

var sShip = new SShip(400,360);


//自機が撃つ弾の管理
const MAX_MISSILES = 1000;

class Missiles {
    constructor(){
        this.missiles = new Array(MAX_MISSILES);
        this.numMissiles = 0;
        this.numPowerUp = 0;
        this.numLaser = 0;
        for (var i = 0; i < MAX_MISSILES; i++) this.missiles[i] = null;
    }

    setMissile(){
        var n = this.numPowerUp;
        var bulletType = 2;
        if (this.numLaser > 0){
            this.numLaser--;
            bulletType = 12;
        }
        for (var i = 0; i <= n; i++){
            this.missiles[this.numMissiles] = new GameObject((sShip.ship.x+40), (sShip.ship.y - n*6 + i*12), 40, int((i-n/2)*2), bulletType, -1);
            this.numMissiles = (this.numMissiles + 1) % MAX_MISSILES;
            //console.log("missle set");
        }
    }

    moveMissile(){
        for (var i = 0; i < MAX_MISSILES; i++){
            if (this.missiles[i]){ 
                this.missiles[i].drawObject();
                //console.log("missle move");
                if (this.missiles[i].x > 1200) {
                    this.deleteMissiles(i);
                }
            }
        }
    }

    deleteMissiles(i){
        if (this.missiles[i]){
            delete this.missiles[i];
            this.missiles[i] = null;
            //console.log("missile deleted");
        }
    }

    isLaser(i){
        if (this.missiles[i].t == 12) return true;
        return false;
    }
}


//エフェクト（爆発演出）の管理
class Effect {
    constructor(x,y,n,t){
        this.x = x;
        this.y = y;
        this.n = n;
        this.t = t;
    }

    drawEffect(){
        if(this.n > 0){
            var n = int(this.n);
            drawImgTS(3, (9-n)*128, 0, 128, 128, this.x - 64, this.y - 64, 128, 128);
            this.n -= 1 * 30/FPS;
        }
    }
}

const MAX_EFFECTS = 100;

class Explosions{
    constructor(){
        this.explosions = new Array(MAX_EFFECTS);
        this.numExplosions = 0;
        for (var i = 0; i < MAX_EFFECTS; i++) this.explosions[i] = null;
    }

    setExplosion(x,y,n,t){
        this.explosions[this.numExplosions] = new Effect(x,y,n,t);
        this.numExplosions = (this.numExplosions + 1) % MAX_EFFECTS;
    }

    drawExplosions(){
        for (var i = 0; i < MAX_EFFECTS; i++){
            if (!this.explosions[i]) continue;
            this.explosions[i].drawEffect();
            if (this.explosions[i].n == 0) this.deleteExplosions(i);
        }
    }

    deleteExplosions(i){
        if (this.explosions[i]){
            delete this.explosions[i];
            this.explosions[i] = null;
            //console.log("explosion deleted");
        }
    }
}



//敵をセットする
const MAX_ENEMIES = 100;

class Enemies {
    constructor(){
        this.enemies = new Array(MAX_ENEMIES);
        this.numEnemies = 0;
        for (var i = 0; i < MAX_ENEMIES; i++) this.enemies[i] = null;
    }
    
    setEnemies(x, y ,xp, yp, t){
        var life = 1;
        switch (t) {
            case 4:   life = 1; break;
            case 5:   life = 1 * stage; break;
            case 6:   life = 3 * stage; break;
            case 7:   life = 5 * stage; break;
            case 8:   life = -1; break;
        }
        this.enemies[this.numEnemies] = new GameObject(x, y, xp, yp, t, life);
        this.numEnemies = (this.numEnemies + 1) % MAX_ENEMIES;
        //console.log("enemies setted");
        
    }
    
    moveEnemies(){
        for (var i = 0; i < MAX_ENEMIES; i++){
            if (this.enemies[i]){ 
                //shoot bullets;
                
                
                switch (this.enemies[i].t) {

                    //enemy 01
                    case 5: if (this.enemies[i].t == 5 && rnd(10000) < 300*30/FPS) 
                                this.setEnemies(this.enemies[i].x, this.enemies[i].y, -24, 0, 4);
                            break;
                    
                    //enemy 02
                    case 6: if (this.enemies[i].y < 60) this.enemies[i].yp = 8;
                            else if (this.enemies[i].y > 660) this.enemies[i].yp = -8;  
                            break;
                    
                    //enemy 03
                    case 7: if (this.enemies[i].xp < 0){
                                //this.enemies[i].xp = int(this.enemies[i].xp * Math.pow(0.95, 30/FPS)); //adjust speed with FPS;
                                if(tmr % Math.ceil(FPS/30) == 0) this.enemies[i].xp = int(this.enemies[i].xp * 0.95); //adjust speed with FPS;
                                if (this.enemies[i].xp == 0){
                                    this.setEnemies(this.enemies[i].x, this.enemies[i].y, -20, 0, 4);
                                    this.enemies[i].xp = 20;
                                }
                            }
                            break;

                    case 8: break;
                }
                
                this.enemies[i].drawObject();

                if (this.enemies[i].muteki > 0) this.enemies[i].muteki--;
                

                if (this.enemies[i].x < 0 || this.enemies[i].x > 1400) {
                    this.deleteEnemies(i);
                }
            }
        }
    }

    decreaseEnemyLife(i){
        if (this.enemies[i].muteki > 0) return;
        this.enemies[i].life -= 1;
        if (this.enemies[i].life == 0){ 
            setExplosion(this.enemies[i].x, this.enemies[i].y, 9)
            this.deleteEnemies(i);
            score += 100;
            if (score > hiScore) hiScore = score;
        }
        else{ 
            setExplosion(this.enemies[i].x, this.enemies[i].y, 4);
            this.enemies[i].muteki = ENEMY_IFRAME;
        }
    }
    deleteEnemies(i){
        if (this.enemies[i]){
            delete this.enemies[i];
            this.enemies[i] = null;
            //console.log("enemies deleted");
        }
    }

    getType(i){
        return this.enemies[i].t;
    }
}

const MAX_ITEMS = 100

//アイテムをセットする
class Items { // *****TODO*****
    constructor(){
        this.items = new Array(MAX_ITEMS);
        this.numItems = 0;
    }

    setItems(x, y ,xp, yp, t){
        var life = -1;
        this.items[this.numItems] = new GameObject(x, y, xp, yp, t, life);
        this.numItems = (this.numItems + 1) % MAX_ITEMS;
        //console.log("items setted");
        
    }

    moveItems(){
        for (var i = 0; i < MAX_ITEMS; i++){
            if(this.items[i]) this.items[i].drawObject();
        }
    }

    getType(i){
        return this.items[i].t;
    }
    
    deleteItems(i){
        if (this.items[i]){
            delete this.items[i];
            this.items[i] = null;
        }
    }
}




//Objects
var enemies = new Enemies(); 
var missiles = new Missiles();
var explosions = new Explosions();
var items = new Items();

function initObject(){
    enemies = new Enemies();
    missiles = new Missiles();
    explosions = new Explosions();
}

function setEnemies(){
    var sec = int(tmr/FPS);
    if ((sec >= 4 && sec < 10) && tmr % (20*FPS/30)  == 0) enemies.setEnemies(1300, 60+rnd(600), -16, 0, 5);
    
    if ((sec >= 14 && sec < 20) && tmr % (20*FPS/30) == 0) enemies.setEnemies(1300, 60+rnd(600), -12, rnd(2)?8:-8 , 6);
    
    if ((sec >= 24 && sec < 30) && tmr % (20*FPS/30) == 0) enemies.setEnemies(1300, 360+rnd(300), -48, -10, 7);
    
    if ((sec >= 34 && sec < 50) && tmr % (60*FPS/30) == 0) enemies.setEnemies(1300, rnd(720-192), -6, 0, 8);
    
    if ((sec >= 54 && sec < 70) && tmr % (20*FPS/30) == 0) {
        enemies.setEnemies(1300, 60+rnd(300), -16, 4, 5);
        enemies.setEnemies(1300, 360+rnd(300), -16, -4, 5);
    }

    if (sec >= 74 && sec < 90) {
        if(tmr % (20*FPS/30) == 0) enemies.setEnemies(1300, 60+rnd(600), -12, rnd(2)?8:-8 , 6);
        if(tmr % (45*FPS/30) == 0) enemies.setEnemies(1300, rnd(720-192), -8, 0, 8);
    }

    if (sec >= 94 && sec < 110) {
        if (tmr % (10*FPS/30) == 0) enemies.setEnemies(1300, 360, -24, rnd(11)-5, 5);
        if (tmr % (20*FPS/30) == 0) enemies.setEnemies(1300, 360+rnd(300), -56, -(4+rnd(12)), 7);
    }
}

function setItems(){
    if (tmr % (12*FPS) == 0) items.setItems(1300, 60 + rnd(600), -10, 0, rnd(3) + 9);
}

function setMissile(){
    missiles.setMissile();
}

function moveObjects(){
    enemies.moveEnemies();
    items.moveItems();
}

function moveMissile(){
     missiles.moveMissile();
}

function initSShip(){
    sShip = new SShip(400, 360);
}

function moveSShip(){
    sShip.moveSShip();
}

function getEnergy(){
    return sShip.getEnergy();
}

function getShipLocation(){
    return [sShip.ship.x, sShip.ship.y];
}

function hitCheck(){
    for (var i = 0; i < MAX_ENEMIES; i++){
        if (!(enemies.enemies[i])) continue;
        var r1 = MISSILE_RADIUS;
        var r2 = (img[enemies.getType(i)].width + img[enemies.getType(i)].height)/4;

        //Enemies x SShip
        if (enemies.enemies[i].hitCheck(sShip.ship, SELF_RADIUS, r2) && sShip.ship.muteki == 0){
            //explosions.setExplosion(enemies.enemies[i].x, enemies.enemies[i].y, 9);
            sShip.ship.life--;
            sShip.ship.muteki = IFRAME;
            enemies.decreaseEnemyLife(i);
        }

        if (!(enemies.enemies[i])) continue;


        //Enemies x Missile
        for (var j = 0; j < MAX_MISSILES; j++){
            if (!(missiles.missiles[j])) continue;
            if (enemies.enemies[i].hitCheck(missiles.missiles[j], r1,r2)){
                //explosions.setExplosion(enemies.enemies[i].x, enemies.enemies[i].y, 9);
                enemies.decreaseEnemyLife(i);
                if(!missiles.isLaser(j)) missiles.deleteMissiles(j);
                break;
            }
        }
    }

    //Ship x items
    for (var i = 0; i < MAX_ITEMS; i++){
        if (!items.items[i]) continue;
        var t = items.getType(i);
        var r = (img[t].width + img[t].height)/4;
        if (items.items[i].hitCheck(sShip.ship, SELF_RADIUS, r)){
            switch (t){
                case 9:  if (sShip.getEnergy() < MAX_SHIP_ENERGY) sShip.ship.life++; break;
                case 10: missiles.numPowerUp++; break;
                case 11: missiles.numLaser += 50; break;
            }
            
            items.deleteItems(i);

        }
    }
}

function autoHandle(){
    //auto fire
    var col = "white";
    if (sShip.auto){
        sShip.missileTmr = (sShip.missileTmr + 1) % AUTO_MISSILE_CD;
        col = "lime";
    }
    else sShip.missileTmr = 0;

    fRect(900, 20, 280, 60, "blue");
    fText("[A]uto Missile", 1040, 60, 36, col);
}

function lifeGaugeHandle() {
    //Life gauge
    for (var i = 0; i < MAX_SHIP_ENERGY; i++) fRect(20+i*30, 660, 20, 40, "#c00000");
    for (var i = 0; i < getEnergy(); i++) fRect(20+i*30, 660, 20, 40, colorRGB(160-16*i, 240-12*i, 24*i));
}

function setExplosion(x,y,n){
    explosions.setExplosion(x,y,n);
}

function drawEffects(){
    explosions.drawExplosions();
}

function gameoverCheck(){
    if (getEnergy() <= 0){ 
        scene = Scene.GAMEOVER;
        tmr = 0;
        stopBgm();
    }
}

function stageHandle(){
    if (tmr < FPS*4) fText("STAGE " + stage, 600, 300, 50, "cyan");
    if (tmr > FPS*114 && tmr < FPS*118) fText("STAGE CLEAR", 600, 300, 50, "cyan");
    if (tmr == FPS * 120) {
        stage++;
        tmr = 0;
    }
}

function drawScore(){
    fText("SCORE " + score, 200, 50, 40, "white");
    fText("HISCORE " + hiScore, 600, 50, 40, "yellow");
}
