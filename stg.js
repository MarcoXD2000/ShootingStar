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
//Keyboard Control
const CONTROL = new Map();

CONTROL.set('UP', 38);
CONTROL.set('DOWN', 40);
CONTROL.set('LEFT', 37);
CONTROL.set('RIGHT', 39);
CONTROL.set('FIRE', 32);
CONTROL.set('AUTO', 65);
CONTROL.set('SELECT', 13);
CONTROL.set('BACK', 27);
CONTROL.set('PAUSE', 27);

const OccupiedKey = new Map();

OccupiedKey.set(38, 'UP');
OccupiedKey.set(40, 'DOWN');
OccupiedKey.set(37, 'LEFT');
OccupiedKey.set(39, 'RIGHT');
OccupiedKey.set(32, 'FIRE');
OccupiedKey.set(65, 'AUTO');
OccupiedKey.set(13, 'SELECT');
OccupiedKey.set(27, 'BACK');

var FPS = 75;

const Scene = Object.freeze({
    TITLE: 0,
    STAGE: 1,
    GAMEOVER: -1,
    SETTING: 114,
    CONTROLS: 514,
});

const MAX_SHIP_ENERGY = 10;
var AUTO_MISSILE_CD = int(5 * FPS/30); 
var IFRAME = int(30 * FPS/30);
var ENEMY_IFRAME = int(1 * FPS/30);

var tmr = 0;
var scene = Scene.TITLE;
var stage = 1;
var score = 0;
var hiScore = 0;
var menu = 0;

function mainloop(){
    tmr++;
    drawBG(1);
    setFPS(FPS);
    
    switch (scene) {
        case Scene.TITLE:
            mainMenu();
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
            drawScore();
            lifeGaugeHandle();
            drawEffects();
            stageHandle();
            quitGame();

            //console.log("tmr = ", tmr);

            break;

        case Scene.GAMEOVER:
            drawScore();
            const [x,y] = getShipLocation();
            if (tmr > FPS*5) scene = Scene.TITLE;
            else if (tmr % int(FPS*1/6) == 1) setExplosion(x+rnd(120)-60, y+rnd(90)-40, 9);
            moveObjects();
            moveMissile();
            drawEffects();
            fText("GAME OVER", 600, 300, 50, "red");
            
            break;

        case Scene.SETTING:
            settingMenu();
            break;

        case Scene.CONTROLS:
            controlsMenu();
            break;
    }

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
        this.ship.x += int(((key[CONTROL.get("RIGHT")] && 1) - (key[CONTROL.get("LEFT")] && 1)) * 20 * 30/FPS);
        if (this.ship.x >= 1000) this.ship.x = 999; 
        if (this.ship.x <= 60) this.ship.x = 61;
        this.ship.y += int(((key[CONTROL.get("DOWN")] && 1) - (key[CONTROL.get("UP")] && 1)) * 20 * 30/FPS); 
        if (this.ship.y >= 680) this.ship.y = 679; 
        if (this.ship.y <= 40) this.ship.y = 41;
        

        //Touch/Mouse
        if (tapC > 0){
            if (isMouseInABox(900, 20, 1180, 80)){
                tapC = 0;
                this.auto = !this.auto;
            }
            else {
                this.ship.x += int((tapX-this.ship.x)/6);
                this.ship.y += int((tapY-this.ship.y)/6);
            }
        }
        
        //missile movement
        if (key[CONTROL.get("AUTO")] == 1){
            key[CONTROL.get("AUTO")] = 2;
            this.auto = !this.auto;
        }
    
        //prevent auto and spc at the same time
        if (this.auto) key[CONTROL.get("FIRE")] = 2;

        if (key[CONTROL.get("FIRE")] == 1 || (this.auto && !(this.missileTmr))){ 
            setMissile();
            key[CONTROL.get("FIRE")] = 2;      
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


//
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

function drawHiScore(){
    fText("HISCORE " + hiScore, 600, 50, 40, "yellow");
}

function quitGame(){
    if (key[CONTROL.get("PAUSE")]) scene = Scene.TITLE;
}

//x1,y1 : top left, x2,y2 : bottom right
function isMouseInABox(x1, y1, x2, y2){
    if (tapX > x1 && tapX < x2 && tapY > y1 && tapY < y2) return true;
    return false;
}


//*****USER MENUS*****

function scrollMenu(totalMenuItems){
    if (key[CONTROL.get("UP")] == 1) {
        menu--;
        key[CONTROL.get("UP")] = 2;
    }
    if (key[CONTROL.get("DOWN")] == 1) {
        menu++;
        key[CONTROL.get("DOWN")] = 2;
    }

    menu = menu % totalMenuItems;
    menu < 0? menu = totalMenuItems + menu : menu;
}

//Sliding bar object
class SlidingBar {
    constructor(x, y, length, height, min, max, step, value, color1 = "grey", color2 = "white"){
        this.x = x;
        this.y = y;
        this.length = length;
        this.height = height;
        this.min = min;
        this.max = max;
        this.step = step;
        this.value = value;
        this.color1 = color1;
        this.color2 = color2;
        this.dragging = false;
    }

    drawBar(){
        fRect(this.x, (this.y + this.height/4), this.length, this.height/2, this.color1);
        var knot = this.x + this.length/(this.max - this.min) * (this.value - this.min); // x coordinate of the knot
        fRect(knot, this.y, 10, this.height, this.color2);
        fText(this.min, this.x - 40, this.y+this.height/2, this.height/2, this.color2);
        fText(this.max, this.x + this.length + 40, this.y+this.height/2, this.height/2, this.color2);
        fText(this.value, this.x + this.length/2, this.y+this.height/2, this.height/2, this.color2);
    }

    dragBar(){

        if (fpsBar.dragging || (tapC && fpsBar.isPointing())) {
            this.dragging = true;
            if (!tapC) {
                this.dragging = false;
                return;
            }

            this.changeValue((tapX - this.x) / this.length * (this.max-this.min) + this.min);
            
            this.value = Math.round(this.value/this.step)*this.step;
            
            if (this.value < this.min) this.value = this.min;
            else if (this.value > this.max) this.value = this.max; 
        }

    }
    
    changeValue(v){
        //process of snapping to the nearest step
        //***TODO***
        const float2rational = function(){
            
        }
        this.value = v;
        this.value = Math.round(this.value/this.step)*this.step;
        if (this.value < this.min) this.value = this.min;
        else if (this.value > this.max) this.value = this.max; 
    }

    getValue(){
        return this.value;
    }

    isPointing(){
        return isMouseInABox(this.x,this.y,this.x+this.length,this.y+this.height);
    }
}

//Box Button Object
const SELECTED = true;
class BoxButton {
    constructor(x,y,length,width,fontSize = 40 ,text = " sample",textColor = "white" ,boxColor = "black", boxAlpha = 70, clickFunction = function(){}){
        this.clickFunction = clickFunction;
        this.x = x;
        this.y = y;
        this.length = length;
        this.width = width;
        this.fontSize = fontSize;
        this.text = text;
        this.textColor = textColor;
        this.boxColor = boxColor;
        this.boxAlpha = boxAlpha;
    }

    onClick(){
        this.clickFunction();
    }

    drawButton(isSelect){
        if(isSelect){
            setAlp(this.boxAlpha);
            fRect(this.x,this.y,this.length,this.width,this.boxColor);
            setAlp(100);
        }
        fText(this.text, this.x + this.length/2, this.y + this.width/2, this.fontSize, this.textColor);
    }

    isPointing(){
        return isMouseInABox(this.x,this.y,this.x+this.length,this.y+this.width);
    }
}

//Title Screen / Main menu

//Buttons
const playButtonFunction = function(){
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    tapC = 0;
    initSShip();
    initObject();
    score = 0; 
    stage = 1;
    scene = Scene.STAGE;
    tmr = 0;
    playBgm(0);
    score = 0;
    menu = 0;
}
var playButton = new BoxButton(500, 375, 200, 50, 40, "PLAY", "cyan", "purple", 70, playButtonFunction);

const settingButtonFunction = function(){
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    tapC = 0;
    menu = 0;
    scene = Scene.SETTING;
}
var settingButton = new BoxButton(500, 475, 200, 50, 40, "SETTING", "cyan", "purple", 70, settingButtonFunction);

//Console
function mainMenu(){
    drawHiScore();
    if (tmr % int(FPS*4/3) < int(FPS*2/3))fText("Press [Enter] or Click to select.", 600, 600, 40, "cyan");
    drawImg(13, 200, 100);

    const totalMenuItems = 2;
    scrollMenu(totalMenuItems);

    if (playButton.isPointing()) menu = 0;
    else if (settingButton.isPointing()) menu = 1;
    
    playButton.drawButton(menu==0?SELECTED:!SELECTED);
    settingButton.drawButton(menu==1?SELECTED:!SELECTED);
    
    if (menu == 0) {
        if (key[CONTROL.get("FIRE")] == 1 || key[CONTROL.get("SELECT")] == 1 || (tapC == 1 && playButton.isPointing())){
            playButton.onClick();
        }
    }
    else if (menu == 1) {
        if (key[CONTROL.get("FIRE")] == 1 || key[CONTROL.get("SELECT")] == 1 || (tapC == 1 && settingButton.isPointing())){
            settingButton.onClick();
        }
    }
    
}




//Setting Menu

//fps drag bar
var fpsBar = new SlidingBar(312, 340, 576, 40, 30, 144, 1, FPS);

//fps button
var fpsButton = new BoxButton(500,275,200,50,40,"FPS","cyan","purple",70);

//Keybinds button
const controlButtonFunction = function(){
    scene = Scene.CONTROLS;
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    tapC = 0;
    menu = 0;  
}
var controlButton = new BoxButton(475, 450, 250, 50, 40, "CONTROLS","cyan","purple",70, controlButtonFunction);

//Back button
const settingBackButtonFunction = function(){
    scene = Scene.TITLE;
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    key[CONTROL.get("BACK")] = 0;
    tapC = 0;
    menu = 0;
}
var settingBackButton = new BoxButton(50, 625, 300, 50, 40, "BACK[ESC]","cyan","purple",70, settingBackButtonFunction);

var dragging = false;
var BarCD = 1 * (FPS/30);

//Setting Menu
function settingMenu(){
    fText("SETTING", 600, 50, 40, "yellow")
    //drawImg(13, 200, 100);

    const totalMenuItems = 3;
    
    scrollMenu(totalMenuItems);

    //console.log(menu);

    if (key[CONTROL.get("LEFT")] || key[CONTROL.get("RIGHT")] || fpsButton.isPointing()) menu = 0;
    else if (controlButton.isPointing()) menu = 1;
    else if (settingBackButton.isPointing()) menu = 2;
    
    fpsButton.drawButton(menu == 0? SELECTED:!SELECTED);
    controlButton.drawButton(menu == 1? SELECTED:!SELECTED);
    settingBackButton.drawButton(menu == 2? SELECTED:!SELECTED);

    //keyboard <- / -> change fps
    if (key[CONTROL.get("LEFT")] && (tmr % BarCD == 0)) fpsBar.changeValue(--FPS);
    if (key[CONTROL.get("RIGHT")] && (tmr % BarCD == 0)) fpsBar.changeValue(++FPS);
    
    fpsBar.dragBar();
    if (fpsBar.dragging) {
        menu = 0; 
    }   
    fpsBar.drawBar();
    FPS = fpsBar.getValue();
    AUTO_MISSILE_CD = int(5 * FPS/30); 
    IFRAME = int(30 * FPS/30);
    ENEMY_IFRAME = int(1 * FPS/30);
    
    
    if (menu == 1) {
        if (key[CONTROL.get("SELECT")] == 1|| key[CONTROL.get("FIRE")] == 1 || (tapC && controlButton.isPointing())){
            controlButton.onClick();
        }
    }
    if (menu == 2|| key[CONTROL.get("BACK")] == 1) {
        if (key[CONTROL.get("SELECT")] == 1|| key[CONTROL.get("FIRE")] == 1 || key[CONTROL.get("BACK")] == 1|| (tapC && settingBackButton.isPointing())){
            settingBackButton.onClick();
        }
    }
    
    
}

//Controls menu


//Back Button
const controlsBackButtonFunction = function(){
    scene = Scene.SETTING;
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    key[CONTROL.get("BACK")] = 0;
    tapC = 0;
    menu = 0;
}
var controlsBackButton = new BoxButton(50, 625, 300, 50, 40, "BACK[ESC]","cyan","purple",70, controlsBackButtonFunction);

//Up key

var upButton = new BoxButton(100,100,200,50,40,"UP","cyan","purple",70);

var modifyUpButton = new BoxButton(350,100,250,50,40,"ArrowUp","white","purple",70);

//down key

var downButton = new BoxButton(100,230,200,50,40,"DOWN","cyan","purple",70);

var modifyDownButton = new BoxButton(350,230,250,50,40,"ArrowDown","white","purple",70);

//left key


var leftButton = new BoxButton(100,360,200,50,40,"LEFT","cyan","purple",70);

var modifyLeftButton = new BoxButton(350,360,250,50,40,"ArrowLeft","white","purple",70);

//right key

var rightButton = new BoxButton(100,490,200,50,40,"RIGHT","cyan","purple",70);

var modifyRightButton = new BoxButton(350,490,250,50,40,"ArrowRight","white","purple",70);

//fire key

var fireButton = new BoxButton(600,100,200,50,40,"FIRE","cyan","purple",70);

var modifyFireButton = new BoxButton(850,100,250,50,40,"[Space]","white","purple",70);

//auto key

var autoButton = new BoxButton(600,230,200,50,40,"AUTO","cyan","purple",70);

var modifyAutoButton = new BoxButton(850,230,250,50,40,"a","white","purple",70);

//select key

var selectButton = new BoxButton(600,360,200,50,40,"SELECT","cyan","purple",70);

var modifySelectButton = new BoxButton(850,360,250,50,40,"Enter","white","purple",70);

const key2button = new Map();

key2button.set("UP", modifyUpButton);
key2button.set("DOWN", modifyDownButton);
key2button.set("LEFT", modifyLeftButton);
key2button.set("RIGHT", modifyRightButton);
key2button.set("FIRE", modifyFireButton);
key2button.set("AUTO", modifyAutoButton);
key2button.set("SELECT", modifySelectButton);

//Find the unicode of the key pressed
var changeKey = 0; 
window.addEventListener("keydown", changeControl);
function changeControl(e){
    changeKey = e.key;
    if (e.keyCode == 32) changeKey = "[Space]";
}

var otherKey = 0;
var subMenu = -1;

function checkRepeatKey(){
    const iterator = key2button.values();
    for (var i = 0; i < key2button.size; i++){
        iterator.next().value.textColor = "white";
    }

    if (OccupiedKey.has(inkey)) {
        var button = key2button.get(OccupiedKey.get(inkey));
        button.textColor = "red";
    }
}

//change key setting
function modifyKey(mod, button){//***TODO***
    if (key[CONTROL.get("BACK")] ){
        if (OccupiedKey.has(otherKey) && OccupiedKey.get(otherKey) != mod) return;
        if (otherKey != 0){
            OccupiedKey.delete(CONTROL.get(mod));
            OccupiedKey.set(otherKey, mod);
            CONTROL.set(mod, otherKey);
        }
        key[CONTROL.get("BACK")] = 2;
        otherKey = 0;
        subMenu = -1;
    }
    
    if (key[inkey] == 1){
        otherKey = inkey;
        button.text = changeKey;
        checkRepeatKey();
        if (OccupiedKey.has(inkey) && OccupiedKey.get(inkey) != mod) button.textColor = "red";
        else button.textColor = "white";
    }
    key[inkey] = 2;
    //console.log(inkey);
    console.log(key[inkey]);
    

}

function controlsMenu(){

    fText("CONTROLS", 600,50,40,"yellow");
    //console.log(changeKey);
    const totalMenuItems = 8;

    if (subMenu == -1){
        scrollMenu(totalMenuItems);

        if (upButton.isPointing()) menu = 0;
        else if (downButton.isPointing()) menu = 1;
        else if (leftButton.isPointing()) menu = 2;
        else if (rightButton.isPointing()) menu = 3;
        else if (fireButton.isPointing()) menu = 4;
        else if (autoButton.isPointing()) menu = 5;
        else if (selectButton.isPointing()) menu = 6;
        else if (controlsBackButton.isPointing()) menu = totalMenuItems-1;
    }

    upButton.drawButton(menu == 0? SELECTED:!SELECTED);
    downButton.drawButton(menu == 1? SELECTED:!SELECTED);
    leftButton.drawButton(menu == 2? SELECTED:!SELECTED);
    rightButton.drawButton(menu == 3? SELECTED:!SELECTED);
    fireButton.drawButton(menu == 4? SELECTED:!SELECTED);
    autoButton.drawButton(menu == 5? SELECTED:!SELECTED);
    selectButton.drawButton(menu == 6? SELECTED:!SELECTED);
    controlsBackButton.drawButton(menu == totalMenuItems-1? SELECTED:!SELECTED);
    
    modifyUpButton.drawButton(subMenu == 0? SELECTED:!SELECTED);
    modifyDownButton.drawButton(subMenu == 1? SELECTED:!SELECTED);
    modifyLeftButton.drawButton(subMenu == 2? SELECTED:!SELECTED);
    modifyRightButton.drawButton(subMenu == 3? SELECTED:!SELECTED);
    modifyFireButton.drawButton(subMenu == 4? SELECTED:!SELECTED);
    modifyAutoButton.drawButton(subMenu == 5? SELECTED:!SELECTED);
    modifySelectButton.drawButton(subMenu == 6? SELECTED:!SELECTED);


    if (menu < totalMenuItems-1 && subMenu == -1){
        if (key[CONTROL.get("SELECT")] == 1 || key[CONTROL.get("FIRE")] == 1 ){
            key[CONTROL.get("SELECT")] = 2;
            key[CONTROL.get("FIRE")] = 2;
            subMenu = menu;       
        }
        else if (tapC && upButton.isPointing()) subMenu = 0;
        else if (tapC && downButton.isPointing()) subMenu = 1;
        else if (tapC && leftButton.isPointing()) subMenu = 2;
        else if (tapC && rightButton.isPointing()) subMenu = 3;
        else if (tapC && fireButton.isPointing()) subMenu = 4;
        else if (tapC && autoButton.isPointing()) subMenu = 5;
        else if (tapC && selectButton.isPointing()) subMenu = 6;
    }

    //Back button
    if ((menu == totalMenuItems-1 || key[CONTROL.get("BACK")] == 1) && subMenu == -1) {
        if (key[CONTROL.get("SELECT")] == 1|| key[CONTROL.get("FIRE")] == 1 || key[CONTROL.get("BACK")] == 1 || (tapC && controlsBackButton.isPointing())){
            controlsBackButton.onClick();
        }
    }
    
    //subMenu handle (change the key setting)

    if (subMenu == 0){ //UP
        modifyKey("UP", modifyUpButton);
    }
    else if (subMenu == 1){ //DOWN
        modifyKey("DOWN", modifyDownButton);
    }
    else if (subMenu == 2){ //LEFT
        modifyKey("LEFT", modifyLeftButton);
    }
    else if (subMenu == 3){ //RIGHT
        modifyKey("RIGHT", modifyRightButton);
    }
    else if (subMenu == 4){ //FIRE
        modifyKey("FIRE", modifyFireButton);
    }
    else if (subMenu == 5){ //AUTO
        modifyKey("AUTO", modifyAutoButton);
    }
    else if (subMenu == 6){ //SELECT
        modifyKey("SELECT", modifySelectButton);
    }

}



