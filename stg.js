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

    //new sprites
    loadImg(14, "image/plasmaball3.0.png");
    loadImg(15, "image/Lplasmaball.png");
    loadImg(16, "image/shock4.0.png");
    loadImg(17, "image/Lshock.png");
    loadImg(18, "image/funnel.png");
    loadImg(19, "image/funnelG2.png");
    loadImg(20, "image/funnelG3.png");
    loadImg(21, "image/Lfunnel.png");
    loadImg(22, "image/Lockon.png");
    
    initSShip();
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

//Image IDs
const PICTURES = Object.freeze({
    BG1: 0,
    SHIP: 1,
    TITLE: 13,
    //WEAPONS
    MISSILE: 2,
    LASER: 12,
    PLASMABALL: 14,
    LPLASMABALL: 15,
    FUNNEL: 18,
    FUNNELG2: 19,
    FUNNELG3: 20,
    LFUNNEL: 21,
    //EFFECTS
    EXPLOSION: 3,
    PURPLESHOCK: 16,
    YELLOWSHOCK: 17,
    LOCKON: 22,
    //ENEMIES
    BULLET: 4,
    WING: 5,
    BALL: 6,
    HOPPER: 7,
    BLOCK: 8,
    //ITEMS
    ITEM_E: 9,
    ITEM_M: 10,
    ITEM_L: 11,
})

const picturesFrame = new Map();
    picturesFrame.set(PICTURES.BG1, 1);
    picturesFrame.set(PICTURES.SHIP, 1);
    picturesFrame.set(PICTURES.TITLE, 1);
    //WEAPONS
    picturesFrame.set(PICTURES.MISSILE, 1);
    picturesFrame.set(PICTURES.LASER, 1);
    picturesFrame.set(PICTURES.PLASMABALL, 4);
    picturesFrame.set(PICTURES.LPLASMABALL, 4);
    picturesFrame.set(PICTURES.FUNNEL, 2);
    picturesFrame.set(PICTURES.FUNNELG2, 2);
    picturesFrame.set(PICTURES.FUNNELG3, 2);
    picturesFrame.set(PICTURES.LFUNNEL, 2);
    //EFFECTS
    picturesFrame.set(PICTURES.EXPLOSION, 9);
    picturesFrame.set(PICTURES.PURPLESHOCK, 10);
    picturesFrame.set(PICTURES.YELLOWSHOCK, 10);
    //ENEMIES
    picturesFrame.set(PICTURES.BULLET, 1);
    picturesFrame.set(PICTURES.WING, 1);
    picturesFrame.set(PICTURES.BALL, 1);
    picturesFrame.set(PICTURES.HOPPER, 1);
    picturesFrame.set(PICTURES.BLOCK, 1);
    //ITEMS
    picturesFrame.set(PICTURES.ITEM_E, 1);
    picturesFrame.set(PICTURES.ITEM_M, 1);
    picturesFrame.set(PICTURES.ITEM_L, 1);


const WeaponEffect = new Map();
    WeaponEffect.set(PICTURES.SHIP, PICTURES.EXPLOSION);
    WeaponEffect.set(PICTURES.PLASMABALL, PICTURES.PURPLESHOCK);
    WeaponEffect.set(PICTURES.LPLASMABALL, PICTURES.YELLOWSHOCK);
    WeaponEffect.set(PICTURES.MISSILE, PICTURES.EXPLOSION);
    WeaponEffect.set(PICTURES.LASER, PICTURES.EXPLOSION);
    WeaponEffect.set(PICTURES.FUNNEL, PICTURES.EXPLOSION);
    WeaponEffect.set(PICTURES.FUNNELG2, PICTURES.EXPLOSION);
    WeaponEffect.set(PICTURES.FUNNELG3, PICTURES.EXPLOSION);
    WeaponEffect.set(PICTURES.LFUNNEL, PICTURES.EXPLOSION);

const SCENE = Object.freeze({
    TITLE: 0,
    STAGE: 1,
    GAMEOVER: -1,
    SETTING: 114,
    CONTROLS: 514,
    PAUSE: 1919,
});

var FPS = 60;
var MAX_SHIP_ENERGY = 10;
var AUTO_MISSILE_CD = int(5 * FPS/30); 
var IFRAME = int(30 * FPS/30);
var ENEMY_IFRAME = int(1 * FPS/30);

var tmr = 0;
var scene = SCENE.TITLE;
var stage = -999;
var score = 0;
var hiScore = 0;
var menu = 0;
var uiOpacity = 80;
var pauseTmr = 0;
var shakeTmr = 0;
var shakeStr = 0;

function mainloop(){
    drawBG(1);
    setFPS(FPS);
    //console.log(tmr);
    
    switch (scene) {
        case SCENE.TITLE:
            tmr++;
            mainMenu();
            break;

        case SCENE.PAUSE:
            pauseMenu();
            break;
        case SCENE.STAGE:
            pauseTmr>0?pauseTmr--:tmr++;
            shakeTmr>0?shakeTmr--:0;
            pauseGame();
            gameoverCheck();
            gameUI(); 
            moveObjects();
            moveSShip();
            hitCheck();
            setEnemies();
            setItems();
            drawEffects();
            break;

        case SCENE.GAMEOVER:
            pauseTmr>0?pauseTmr--:tmr++;
            shakeTmr>0?shakeTmr--:0;
            gameoverMenu();
            break;

        case SCENE.SETTING:
            settingMenu();
            break;

        case SCENE.CONTROLS:
            controlsMenu();
            break;
    }

}

//背景のスクロール
var bgx = 0;
function drawBG(spd){
    if (pauseTmr > 0 || scene==SCENE.PAUSE) spd = 0;
    var [xShake,yShake] = [0,0];
    if (shakeTmr > 0){
        xShake = rnd(shakeStr) - Math.floor(shakeStr/2);
        yShake = rnd(shakeStr) - Math.floor(shakeStr/2);
    }

    bgx = (bgx + spd) % 1200;
    var fbgx = bgx + xShake;
    var fbgy = 0 + yShake;
    drawImg(PICTURES.BG1,-fbgx,fbgy);
    drawImg(PICTURES.BG1,1200-fbgx,fbgy);

    var horizonY = 580 + yShake;
    var offsetX = bgx%40;
    lineW(2);
    for(var i=1; i < 30; i++){
        var tx = i*40-offsetX + xShake;
        var bx = i*240-offsetX*6-3000 + xShake;
        line(tx, horizonY, bx, 720, "silver");
    }
    for(var i=1; i < 12; i++){
        lineW(1+int(i/3));
        line(0+xShake, horizonY+yShake, 1200+xShake, horizonY+yShake, "gray");
        horizonY = horizonY + i*2;
    }
}


//*****GAME*****
class Anime {
    constructor(x, y, xp, yp, t, duration, startFrame = 0){
        this.x = x;
        this.y = y;
        this.xp = xp;
        this.yp = yp;
        this.t = t;
        this.totalFrame = picturesFrame.get(t);
        this.startFrame = startFrame;
        this.frame = startFrame;
        this.frame_FPS_counter = startFrame;
        this.duration = int(duration * FPS/30);
    }
    
    drawAnimation(){      
        if (this.duration == 0) return;  
        this.totalFrame = picturesFrame.get(this.t);
        this.moveAnimation();
        this.drawAnimationPause();
        if (this.totalFrame > 1){
            this.frame_FPS_counter = (this.frame_FPS_counter + 1 * 30/FPS);
            this.frame = int(this.frame_FPS_counter) % this.totalFrame;
            if (this.frame == 0) this.frame += this.startFrame;
        }
        this.duration--;
    }

    moveAnimation(){
        this.x = this.x + this.xp * 30/FPS;
        this.y = this.y + this.yp * 30/FPS;
    }

    drawAnimationPause(){
        var [xShake,yShake] = [0,0];
        if (shakeTmr > 0){
            xShake = rnd(shakeStr) - Math.floor(shakeStr/2);
            yShake = rnd(shakeStr) - Math.floor(shakeStr/2);
        }
        var frameWidth = img[this.t].width/this.totalFrame;
        var frameHeight = img[this.t].height;
        drawImgTS(this.t, frameWidth*this.frame, 0, frameWidth, frameHeight, this.x-frameWidth/2 + xShake, this.y-frameHeight/2 + yShake, frameWidth, frameHeight);
    }
}

const MISSILE_RADIUS = 12;
const SELF_RADIUS = 30;
var DEBUG_GAME = true;
DEBUG_GAME = false;


class GameObject extends Anime{
    constructor(x, y, xp, yp, t, life, r = -1){
        super(x,y,xp,yp,t,-1);
        this.life = life;
        this.muteki = 0;
        this.paralyseTmr = 0;
        if (r == -1) r = (img[t].width/this.totalFrame + img[t].height)/4
        this.radius = r;
        this.coord = new vec2d(x, y);
    }
    
    drawObject(){        
        if (this.paralyseTmr > 0){ 
            this.drawObjectPause(); 
            this.paralyseTmr--;
            return;
        }
        this.drawAnimation();
        if (DEBUG_GAME) sCir(this.x,this.y,this.radius,"lime");

        this.coord.x = this.x;
        this.coord.y = this.y;
    }

    drawObjectPause(){
        this.drawAnimationPause();
        if (DEBUG_GAME) sCir(this.x,this.y,this.radius,"lime");
    }

    static hitCheck(a,b){
        if (GameObject.getObjDis(a,b) < (a.radius + b.radius)) return true;
    }

    static getObjDis(a,b){
        return getDis(a.x, a.y, b.x, b.y);
    }
}

//自機の管理
class SShip extends GameObject{
    constructor(x, y){
        super(x,y,0,0,PICTURES.SHIP,MAX_SHIP_ENERGY,SELF_RADIUS);
        //this.energy = 10;
        this.auto = false;
        this.missileTmr = 0;
        this.dragging = false;
        this.currentWeapon = PICTURES.FUNNEL;
        this.equipments = new Map();
    }

    moveSShip(){
        //Ship movement
        this.equipments.values().forEach((e) => e?e.moveEquipment():0);
        this.xp = int(((key[CONTROL.get("RIGHT")] && 1) - (key[CONTROL.get("LEFT")] && 1)) * 20);
        if (this.x + this.xp >= 1000){ this.xp = 999 - this.x;} 
        if (this.x + this.xp <= 60) { this.xp = 61 - this.x;}
        this.yp = int(((key[CONTROL.get("DOWN")] && 1) - (key[CONTROL.get("UP")] && 1)) * 20); 
        if (this.y + this.yp >= 680) { this.yp = 679 - this.y;} 
        if (this.y + this.yp <= 40) { this.yp = 41 - this.y;}

        
        //Touch/Mouse
        this.dragging = false;
        if (tapC > 0){     
            this.dragging = true;      
            this.xp = int((tapX-this.x)/6);
            this.yp = int((tapY-this.y)/6);            
        }
        
        //missile movement
        if (key[CONTROL.get("AUTO")] == 1){
            key[CONTROL.get("AUTO")] = 2;
            this.auto = !this.auto;
        }
    
        //prevent auto and spc at the same time
        if (this.auto) key[CONTROL.get("FIRE")] = 2;

        if (key[CONTROL.get("FIRE")] == 1 || (this.auto && !(this.missileTmr))){ 
            setWeapon(this.currentWeapon);
            key[CONTROL.get("FIRE")] = 2;      
        }
    
        if (this.muteki % 2 == 0) this.drawObject();
        else this.moveAnimation();
        if (this.muteki > 0) this.muteki--;
    }

    drawShipPause(){
        this.equipments.values().forEach((e) => e.drawEquipmentPause());
        if (pauseTmr % 2 == 0) this.drawObjectPause();
    }

    getEnergy(){
        return this.life;
    }

    onHit(){
        effects.setEffect(PICTURES.EXPLOSION, this.x, this.y, effectOnHitFrame.get(PICTURES.EXPLOSION), 4);
        shakeStr = 7;
        shakeTmr = 10 * FPS/30;
        pauseTmr = 10 * FPS/30;
        sShip.life--;
        sShip.muteki = IFRAME;    
        return this.t;
    }
}

var sShip = new SShip(400,360);

//自機が撃つ弾の管理
//default x,y velocities of different weapons
const WeaponVelocity = new Map();
WeaponVelocity.set(PICTURES.MISSILE,new vec2d(40,0));
WeaponVelocity.set(PICTURES.LASER,new vec2d(40,0));
WeaponVelocity.set(PICTURES.PLASMABALL,new vec2d(35,0));
WeaponVelocity.set(PICTURES.LPLASMABALL,new vec2d(35,0));
WeaponVelocity.set(PICTURES.FUNNEL,new vec2d(0,0));

const STATUS = Object.freeze({
    PARALYSE: 0,
})

const setWeaponFunc = new Map();
setWeaponFunc.set(PICTURES.MISSILE, function(){return Missile.createMissiles()});
setWeaponFunc.set(PICTURES.LASER, function(){return Missile.createMissiles()});
setWeaponFunc.set(PICTURES.PLASMABALL, function(){return Plasmaball.createPlasmaball()});
setWeaponFunc.set(PICTURES.LPLASMABALL, function(){return Plasmaball.createPlasmaball()});
setWeaponFunc.set(PICTURES.FUNNEL, function(){return sShip.equipments.get('funnel').fireMissile()});

const weaponStatus = new Map();
weaponStatus.set(PICTURES.MISSILE, function(){return[]});
weaponStatus.set(PICTURES.LASER, function(){return[]});
weaponStatus.set(PICTURES.PLASMABALL, function(){return[]});
weaponStatus.set(PICTURES.LPLASMABALL, function(){return [STATUS.PARALYSE]});
weaponStatus.set(PICTURES.FUNNEL, function(){return[]});
weaponStatus.set(PICTURES.FUNNELG2, function(){return[]});
weaponStatus.set(PICTURES.FUNNELG3, function(){return[]});
weaponStatus.set(PICTURES.SHIP, function(){return[]})

const MAX_WEAPONS = 1000;
class Weapons {
    constructor(){
        this.weapons = new Array(MAX_WEAPONS);
        this.numPowerUp = 0;
        this.numL = 0;
        this.numWeapons = 0;
        for (var i = 0; i < MAX_WEAPONS; i++) this.weapons[i] = null;
    }

    setWeapon(weapon){
        setWeaponFunc.get(weapon)();
    }

    moveWeapon(){
        for (var i = 0; i < this.weapons.length; i++) {
            if (this.weapons[i]){
                this.weapons[i].moveWeapon();
            }
        }
    }

    drawWeaponsPause(){
        for (var i = 0; i < this.weapons.length; i++) {
            if (this.weapons[i]){
                this.weapons[i].drawWeaponPause();
            }
        }
    }

    deleteWeapon(i){
        if (this.weapons[i]){
            this.weapons.splice(i,1,null);
        }
    }
}

class Weapon extends GameObject{
    constructor(x, y, xp, yp, t, life, r = -1){
        super(x, y, xp, yp, t, life, r);
        if (this.moveWeapon == undefined) {
            throw new Error("moveWeapon method must be implemented");
        }
        if (this.drawWeaponPause == undefined) {
            throw new Error("drawWeaponPause must be implemented");
        }
        if (this.onHit == undefined) {
            throw new Error("onHit method must be implemented");
        }
        
        this.id = weapons.numWeapons;
    }
}

class Missile extends Weapon{
    constructor(n, i, pic, obj, homingTarget = null){//set missile
        var velocity = WeaponVelocity.get(pic);
        velocity.y = int((i-(n/2))*2);
        var fireLocation = new vec2d((img[obj.t].width/picturesFrame.get(obj.t)/2),  -n*6+i*12);
        const coord = obj.coord;
        var x = coord.x;
        var y = coord.y;
        var angle = 180*Math.atan(velocity.y/velocity.x)/Math.PI;
        if (homingTarget) {
            var direction = homingTarget.coord.subtraction(obj.coord);
            velocity = velocity.rotate(angle = 180*Math.atan(direction.y/direction.x)/Math.PI);
            fireLocation = fireLocation.rotate(angle);
            //console.log(velocity.x, velocity.y, tmr);
        }
        super((x+fireLocation.x), (y+fireLocation.y), velocity.x, velocity.y, pic, -1, MISSILE_RADIUS);
        // super((x+40), (y - n*6 + i*12), velocity.x, velocity.y, pic, -1, MISSILE_RADIUS);
        this.rotateAngle = angle;
    }

    static createMissiles(){
        if (weapons.numL > 0){ 
            sShip.currentWeapon = PICTURES.LASER;
        }
        for (var i = 0; i <= weapons.numPowerUp; i++){
            //arr.push(new Missile());
            weapons.weapons[weapons.numWeapons] = new Missile(weapons.numPowerUp, i, sShip.currentWeapon, sShip);
            weapons.numWeapons = (weapons.numWeapons + 1) % MAX_WEAPONS;
        }
        
        weapons.numL==0?sShip.currentWeapon=PICTURES.MISSILE:0;
    }

    static createFunnelMissiles(funnel){
        var pic = PICTURES.MISSILE;
        if (weapons.numL > 0){ 
            pic = PICTURES.LASER;
        }
        var n = 0;
        if (funnel.t == PICTURES.FUNNELG2) n = 1;
        else if (funnel.t == PICTURES.FUNNELG3) n = 1;

        for (var i = 0; i <= n; i++){
            weapons.weapons[weapons.numWeapons] = new Missile(n, i, pic, funnel, funnel.closestEnemy);
            weapons.numWeapons = (weapons.numWeapons + 1) % MAX_WEAPONS;
        }
    }

    moveWeapon(){
        //super.drawObject();
        this.moveAnimation();
        this.drawWeaponPause();
        this.coord.x = this.x;
        this.coord.y = this.y;
        if (this.x > 1200) {
            weapons.deleteWeapon(this.id);
        }
    }

    drawWeaponPause(){
        // this.drawObjectPause();
        var [xShake,yShake] = [0,0];
        if (shakeTmr > 0){
            xShake = rnd(shakeStr) - Math.floor(shakeStr/2);
            yShake = rnd(shakeStr) - Math.floor(shakeStr/2);
        }
        var correct = new vec2d(-img[this.t].width/2, -img[this.t].height/2);
        drawImgR(this.t, this.x + correct.x + xShake, this.y + correct.y + yShake, this.rotateAngle);
        if (DEBUG_GAME) sCir(this.x,this.y,this.radius,"lime");

    }

    onHit(){
        if (this.t == PICTURES.MISSILE) weapons.deleteWeapon(this.id); //delete when the missile is not a laser;
        return this.t;
    }
}

//Paralysis enemies
class Plasmaball extends Weapon{
    constructor(i){//set missile
        var n = weapons.numPowerUp;
        var currentWeapon = sShip.currentWeapon;
        var velocity = WeaponVelocity.get(currentWeapon);
        velocity = velocity.rotate(8*((i-n/2)*2));
        const [x,y] = getShipLocation();
        super((x+40), (y - n*6 + i*12), velocity.x, velocity.y, currentWeapon, -1);
        this.alp = 100;
        this.sec = FPS * 1.5;
    }

    static createPlasmaball(){
        if (weapons.numL > 0){ 
            weapons.numL--;
            sShip.currentWeapon = PICTURES.LPLASMABALL;
        }

        for (var i = 0; i <= weapons.numPowerUp; i++){
            //arr.push(new Missile());
            weapons.weapons[weapons.numWeapons] = new Plasmaball(i);
            weapons.numWeapons = (weapons.numWeapons + 1) % MAX_WEAPONS;
        }
        
        weapons.numL==0?sShip.currentWeapon = PICTURES.PLASMABALL:0;
    }

    moveWeapon(){
        this.xp *= Math.pow(0.98, 60/FPS);
        this.yp *= Math.pow(0.98, 60/FPS);
        setAlp(int(this.alp));
        super.drawObject();
        setAlp(100);
        if (this.x > 1200 || this.sec <= 0) {
            weapons.deleteWeapon(this.id);
        }
        this.alp = this.alp>20?this.alp * Math.pow(0.985, 60/FPS):this.alp;
        
        this.sec -= 1;
    }

    drawWeaponPause(){
        setAlp(int(this.alp));
        this.drawObjectPause();
        setAlp(100);
    }

    onHit(){
        //weapons.deleteWeapon(this.id);
        this.sec -= FPS * 0.1; //reduce 0.3second of the duration of plasmaball 
        for (var i = 0 ; i < int(FPS*0.3); i++)
            this.alp = this.alp>20?this.alp * Math.pow(0.985, 60/FPS):this.alp;
        return this.t;
    }
}

//Funnel
class Funnel extends GameObject{
    constructor(i){
        var n = weapons.numPowerUp;
        var currentWeapon = sShip.currentWeapon;  
        var velocity = WeaponVelocity.get(currentWeapon);
        var location = new vec2d(100,0);
        location = location.rotate(35 * Math.ceil(i/2) * Math.pow(-1,i));
        location = location.addition(sShip.coord);
        super(sShip.coord.x, sShip.coord.y, velocity.x, velocity.y, currentWeapon, -1, MISSILE_RADIUS);
        this.funnelID = i;
        this.anker = new vec2d(location.x,location.y);
        this.grade = PICTURES.FUNNEL;
        this.closestEnemy = null;
    }

    moveFunnel(){
        if (weapons.numL > 0) this.t = PICTURES.LFUNNEL;
        else this.t = this.grade;
        this.anker.x += sShip.xp * 30/FPS;
        this.anker.y += sShip.yp * 30/FPS;

        var curAnker = this.anker;
        var speed = 1/8;
        var homingRadius = sShip.equipments.get("funnel").homingRadius;

        this.closestEnemy = findClosestEnemy(this);
        if (this.closestEnemy && getDis(sShip.x, sShip.y, this.closestEnemy.x, this.closestEnemy.y) < homingRadius){ 
            // line(this.x, this.y, closestEnemy.x, closestEnemy.y, "red");
            drawImgC(PICTURES.LOCKON,this.closestEnemy.x, this.closestEnemy.y);
            curAnker = new vec2d(-100, 0);
            curAnker = curAnker.rotate(35 * Math.ceil(this.funnelID/2) * Math.pow(-1,this.funnelID));
            curAnker = curAnker.addition(this.closestEnemy.coord);
            if (getDis(this.x,this.y,this.closestEnemy.x,this.closestEnemy.y) <= 100) speed = 1;
        }else this.closestEnemy = null;

        const displacement = curAnker.subtraction(this.coord);
        this.xp = displacement.x*speed + rnd(2) - 1;
        this.yp = displacement.y*speed + rnd(2) - 1;
    
        
        this.drawWire();
        this.drawObject();
        this.coord.x = this.x;
        this.coord.y = this.y;

    }

    drawWeaponPause(){
        if (this.closestEnemy) drawImgC(PICTURES.LOCKON,this.closestEnemy.x, this.closestEnemy.y);
        this.drawWire();
        this.drawObjectPause();
    }

    onHit(){
        return this.t;
    }

    drawWire(){
        var wireCol = "red";    
        switch (this.t){
            case PICTURES.FUNNELG2: wireCol = "green"; break;
            case PICTURES.FUNNELG3: wireCol = "purple"; break;
            case PICTURES.LFUNNEL: wireCol = "blue"; break;
        }
        //line(sShip.x, sShip.y, this.x, this.y, wireCol);
        const shipDisplacement = this.coord.subtraction(sShip.coord);
        var offset = 110 - shipDisplacement.length;
        offset = offset>0?offset/5:0;
        offset = this.funnelID%2==0?offset:-offset;
        var ctrlPts = new Array();
        ctrlPts.push(sShip.coord);
        ctrlPts.push(new vec2d(sShip.coord.x + shipDisplacement.x/3, sShip.coord.y + shipDisplacement.y*4/5+offset));
        ctrlPts.push(new vec2d(sShip.coord.x + shipDisplacement.x*2/3, sShip.coord.y + shipDisplacement.y-offset));
        ctrlPts.push(this.coord);
        var curvePts = catmullRomSpline(ctrlPts);
        lineW(2);
        drawCurve(curvePts, wireCol);
    }
}

class Funnels {
    constructor(){
        this.numFunnel = 0;
        this.numFunnelG2 = 0;
        this.funnels = new Array();
        this.addFunnel();
        this.homingRadius = 400;
    }

    addFunnel(){
        this.funnels.push(new Funnel(this.numFunnel++));
        return this.funnels[this.numFunnel - 1];
    }

    upgradeFunnel(){
        if (this.numFunnelG2 == 5){
            this.funnels.forEach((f) => f.grade = PICTURES.FUNNELG3);
            this.homingRadius = 550;
            return;
        }
        this.funnels[this.numFunnelG2++].grade = PICTURES.FUNNELG2;
    }

    moveFunnels(){
        var breath = (tmr%(2*FPS)) / (2*FPS);
        if (breath > 1/2) breath = 1 - breath;
        setAlp(uiOpacity * breath * 2);
        sCir(sShip.x, sShip.y, this.homingRadius, "red");
        setAlp(100);
        if (pauseTmr > 0){ 
            this.drawEquipmentPause();
            return;
        }
        if (this.numFunnel < 5 && weapons.numPowerUp >= this.numFunnel) this.addFunnel();
        if ((weapons.numPowerUp-5) >= this.numFunnelG2) this.upgradeFunnel();
        for (var i = 0; i < this.numFunnel; i++){
            this.funnels[i].moveFunnel();
        }
    }

    drawEquipmentPause(){
        for (var i = 0; i < this.numFunnel; i++){
            this.funnels[i].drawWeaponPause();
        }
    }

    fireMissile(){
        for (var i = 0; i < this.numFunnel; i++){
            Missile.createFunnelMissiles(this.funnels[i]);
        }
        weapons.numL>0?weapons.numL--:0;
    }

    moveEquipment(){
        this.moveFunnels();
    }

}

//Turn Extra energies into Beam gauge
class Destorybeam {//*****TODO*****

}

class Beams {//*****TODO*****

}

class Framethrower {//*****TODO*****

}

class HomingMissiles {//*****TODO*****

} 

//Bounce between enemies
class BounceMissiles {//*****TODO*****

}


//エフェクト（爆発演出）の管理
const setEffectFunc = new Map();
setEffectFunc.set(PICTURES.EXPLOSION,function(x,y,n,d){return Explosion.setExplosion(x,y,n,d);});
setEffectFunc.set(PICTURES.PURPLESHOCK,function(x,y,n,d){return PurpleShock.setShock(x,y,n,d);});
setEffectFunc.set(PICTURES.YELLOWSHOCK,function(x,y,n,d){return YellowShock.setShock(x,y,n,d);});

const effectOnHitFrame = new Map();
effectOnHitFrame.set(PICTURES.EXPLOSION, 5);
effectOnHitFrame.set(PICTURES.PURPLESHOCK, 0);
effectOnHitFrame.set(PICTURES.YELLOWSHOCK, 0);

const MAX_EFFECTS = 100;

class Effects {
    constructor(){
        this.effects = new Array(MAX_EFFECTS);
        this.numEffects = 0;
        for (var i = 0; i < MAX_EFFECTS; i++) this.effects[i] = null;
    }

    setEffect(effect, x, y, n, duration){
        setEffectFunc.get(effect)(x,y,n,duration);
    }

    drawEffects(){
        for (var i = 0; i < MAX_EFFECTS; i++){
            if (this.effects[i]){
                this.effects[i].drawEffect();
                this.effects[i].duration == 0? this.deleteEffect(i):0;
            }
        }
    }

    drawEffectsPause(){
        for (var i = 0; i < MAX_EFFECTS; i++){
            if (this.effects[i]){
                this.effects[i].drawAnimationPause();
            }
        }
    }

    deleteEffect(i){
        if (this.effects[i]){
            this.effects.splice(i,1,null);
        }
    }
}

class Effect extends Anime{
    constructor(x,y,xp,yp,t,duration, startFrame = 0){
        super(x,y,xp,yp,t,duration,startFrame);
        if (this.drawEffect == undefined){
            throw new Error("drawEffect must be implemented");
        }
        this.id = effects.numEffects;
    }
}

class Explosion extends Effect{
    constructor(x,y,n,duration){
        super(x,y,-1,0,PICTURES.EXPLOSION,duration, n);
    }

    static setExplosion(x,y,n,duration){
        effects.effects[effects.numEffects] = new Explosion(x,y,n,duration);
        effects.numEffects = (effects.numEffects+1) % MAX_EFFECTS;
    }

    drawEffect(){
        this.drawAnimation();
    }
}

class PurpleShock extends Effect{
    constructor(x,y,n,duration){
        super(x,y,-1,0,PICTURES.PURPLESHOCK,duration, n);
    }

    static setShock(x,y,n,duration){
        effects.effects[effects.numEffects] = new PurpleShock(x,y,n,duration);
        effects.numEffects = (effects.numEffects+1) % MAX_EFFECTS;

    }

    drawEffect(){
        this.drawAnimation();
    }
}

class YellowShock extends Effect{
    constructor(x,y,n,duration){
        super(x,y,-1,0,PICTURES.YELLOWSHOCK,duration, n);
    }

    static setShock(x,y,n,duration){
        effects.effects[effects.numEffects] = new YellowShock(x,y,n,duration);
        effects.numEffects = (effects.numEffects+1) % MAX_EFFECTS;

    }

    drawEffect(){
        this.drawAnimation();
    }
}



//敵をセットする
const MAX_ENEMIES = 100;

const setEnemyFunc = new Map();
setEnemyFunc.set(PICTURES.BULLET,function(x,y,xp,yp){return Bullet.createBullet(x,y,xp,yp)});
setEnemyFunc.set(PICTURES.WING,function(x,y,xp,yp){return Wing.createWing(x,y,xp,yp)});
setEnemyFunc.set(PICTURES.BALL,function(x,y,xp,yp){return Ball.createBall(x,y,xp,yp)});
setEnemyFunc.set(PICTURES.HOPPER,function(x,y,xp,yp){return Hopper.createHopper(x,y,xp,yp)});
setEnemyFunc.set(PICTURES.BLOCK,function(x,y,xp,yp){return Block.createBlock(x,y,xp,yp)});

const enemyWeapons = new Array();
enemyWeapons.push(PICTURES.BULLET);

class Enemies{
    constructor(){
        this.enemies = new Array(MAX_ENEMIES);
        this.numEnemies = 0;
        for (var i = 0; i < MAX_ENEMIES; i++) this.enemies[i] = null;
    }

    setEnemies(enemy,x,y,xp,yp){
        setEnemyFunc.get(enemy)(x,y,xp,yp);
    }

    moveEnemies(){
        for (var i = 0; i < MAX_ENEMIES; i++){
            if (this.enemies[i]){
                this.enemies[i].moveEnemy();
            }
        }
    }

    drawEnemiesPause(){
        for (var i = 0; i < MAX_ENEMIES; i++){
            if (this.enemies[i]){
                this.enemies[i].drawEnemyPause();
            }
        }
    }

    deleteEnemy(i){
        if (this.enemies[i]){
            this.enemies.splice(i,1,null);
        }
    }

    getType(i){
        if (this.enemies[i]) {
            return this.enemies[i].t;
        }
    }
}

class Enemy extends GameObject{
    constructor(x,y,xp,yp,t,life){
        super(x,y,xp,yp,t,life);
        if (this.moveEnemy == undefined){
            throw new Error("moveEnemy must be implemented");
        }
        if (this.drawEnemyPause == undefined){
            throw new Error("drawEnemiesPause must be implemented");
        }
        if (this.onHit == undefined){
            throw new Error("onHit must be implemented");
        }
        this.id = enemies.numEnemies;


    }

    onHit(weapon){
        if (this.muteki > 0) return;
        const status = weaponStatus.get(weapon)();
        for (var i = 0; i < status.length; i++){
            switch (status[i]) {
                case STATUS.PARALYSE:
                    this.paralyseTmr = 10 * FPS/30;
                    break;
            }
        }

        this.life -= 1;
        if (this.life == 0){ 
            effects.setEffect(PICTURES.EXPLOSION,this.x, this.y, 0, picturesFrame.get(PICTURES.EXPLOSION));
            enemies.deleteEnemy(this.id);
            score += 100;
            if (score > hiScore) hiScore = score;
        }
        else{ 
            const curEffect =  WeaponEffect.get(weapon);
            const duration = picturesFrame.get(curEffect) - effectOnHitFrame.get(curEffect)
            effects.setEffect(curEffect,this.x, this.y, effectOnHitFrame.get(curEffect), duration);

        }
    }
}

class Bullet extends Enemy{
    constructor(x,y,xp,yp){
        super(x,y,xp,yp,PICTURES.BULLET,1);
    }

    static createBullet(x,y,xp,yp){
        enemies.enemies[enemies.numEnemies] = new Bullet(x,y,xp,yp);
        enemies.numEnemies = (enemies.numEnemies + 1) % MAX_ENEMIES;
    }

    moveEnemy(){
        this.drawObject();
        if (this.x < 0 || this.x > 1400 || this.y < -50 || this.y > 770) {
            enemies.deleteEnemy(this.id);
        }
    }

    drawEnemyPause(){
        this.drawObjectPause();
    }

    onHit(weapon){
        super.onHit(weapon);   
    }
}

class Wing extends Enemy{
    constructor(x,y,xp,yp){
        super(x,y,xp,yp,PICTURES.WING,1*stage);
    }

    static createWing(x,y,xp,yp){
        enemies.enemies[enemies.numEnemies] = new Wing(x,y,xp,yp);
        enemies.numEnemies = (enemies.numEnemies + 1) % MAX_ENEMIES;
    }

    moveEnemy(){
        if (this.muteki > 0) this.muteki--;
        if (!this.paralyseTmr && rnd(10000) < 300*30/FPS) 
            enemies.setEnemies(PICTURES.BULLET, this.x, this.y, -24, 0);
        this.drawObject();
        if (this.x < 0 || this.x > 1400 || this.y < -50 || this.y > 770) {
            enemies.deleteEnemy(this.id);
        }
    }

    drawEnemyPause(){
        this.drawObjectPause();
    }

    onHit(weapon){
        super.onHit(weapon);
    }
}

class Ball extends Enemy{
    constructor(x,y,xp,yp){
        super(x,y,xp,yp,PICTURES.BALL,3*stage);
    }

    static createBall(x,y,xp,yp){
        enemies.enemies[enemies.numEnemies] = new Ball(x,y,xp,yp);
        enemies.numEnemies = (enemies.numEnemies + 1) % MAX_ENEMIES;
    }

    moveEnemy(){
        if (this.muteki > 0) this.muteki--;
        if (this.y < 60) this.yp = 8;
        else if (this.y > 660) this.yp = -8;
        this.drawObject();
        if (this.x < 0 || this.x > 1400 || this.y < -50 || this.y > 770) {
            enemies.deleteEnemy(this.id);
        }
    }

    drawEnemyPause(){
        this.drawObjectPause();
    }

    onHit(weapon){
        super.onHit(weapon);
    }
}

class Hopper extends Enemy{
    constructor(x,y,xp,yp){
        super(x,y,xp,yp,PICTURES.HOPPER,5*stage);
    }

    static createHopper(x,y,xp,yp){
        enemies.enemies[enemies.numEnemies] = new Hopper(x,y,xp,yp);
        enemies.numEnemies = (enemies.numEnemies + 1) % MAX_ENEMIES;
    }

    moveEnemy(){
        if (this.muteki > 0) this.muteki--;
        if (this.xp < 0 && !this.paralyseTmr){
            if(tmr % Math.ceil(FPS/30) == 0) this.xp = int(this.xp * 0.95);
            if (this.xp == 0){
                enemies.setEnemies(PICTURES.BULLET, this.x, this.y, -20, 0);
                this.xp = 20;
            }
        }
        this.drawObject();
        if (this.x < 0 || this.x > 1400 || this.y < -50 || this.y > 770) {
            enemies.deleteEnemy(this.id);
        }
    }

    drawEnemyPause(){
        this.drawObjectPause();
    }

    onHit(weapon){
        super.onHit(weapon);
    }
}

class Block extends Enemy{
    constructor(x,y,xp,yp){
        super(x,y,xp,yp,PICTURES.BLOCK,-1);
    }

    static createBlock(x,y,xp,yp){
        enemies.enemies[enemies.numEnemies] = new Block(x,y,xp,yp);
        enemies.numEnemies = (enemies.numEnemies + 1) % MAX_ENEMIES;
    }

    moveEnemy(){
        if (this.muteki > 0) this.muteki--;
        this.drawObject();
        if (this.x < 0 || this.x > 1400 || this.y < -50 || this.y > 770) {
            enemies.deleteEnemy(this.id);
        }
    }

    drawEnemyPause(){
        this.drawObjectPause();
    }

    onHit(weapon){
        super.onHit(weapon);
        this.paralyseTmr *= 0;
    }
}

//アイテムをセットする
const MAX_ITEMS = 5;

const setItemsFunc = new Map();
setItemsFunc.set(PICTURES.ITEM_E, function(x,y,xp,yp){return Item_E.createItem_E(x,y,xp,yp)});
setItemsFunc.set(PICTURES.ITEM_M, function(x,y,xp,yp){return Item_M.createItem_M(x,y,xp,yp)});
setItemsFunc.set(PICTURES.ITEM_L, function(x,y,xp,yp){return Item_L.createItem_L(x,y,xp,yp)});
 
class Items {
    constructor(){
        this.items = new Array(MAX_ITEMS);
        this.numItems = 0;
        for (var i = 0; i < MAX_ITEMS; i++) this.items[i] = null;
    }

    setItems(item, x, y ,xp, yp){
        setItemsFunc.get(item)(x,y,xp,yp);
    }

    moveItems(){
        for (var i = 0; i < MAX_ITEMS; i++){
            if(this.items[i]) this.items[i].drawObject();
        }
    }

    drawItemsPause(){//TODO*****
        for (var i = 0; i < MAX_ITEMS; i++){
            if (this.items[i]) this.items[i].drawItemPause();
        }
    }
    
    deleteItems(i){
        if (this.items[i]){
            delete this.items[i];
            this.items[i] = null;
        }
    }
}

class Item extends GameObject{
    constructor(x,y,xp,yp,t){
        super(x,y,xp,yp,t,-1);
        this.id = items.numItems;
    }
    moveItem(){
        this.drawAnimation();
        if (this.x < 0) items.deleteItems(this.id);
    }

    drawItemPause(){
        this.drawObjectPause();
    }
}

class Item_E extends Item{
    constructor(x,y,xp,yp){
        super(x,y,xp,yp,PICTURES.ITEM_E);
    }

    static createItem_E(x,y,xp,yp){
        items.items[items.numItems] = new Item_E(x,y,xp,yp);
        items.numItems = (items.numItems + 1) % MAX_ITEMS;
    }

    onHit(){
        if (sShip.getEnergy() < MAX_SHIP_ENERGY) sShip.life++;
    }
}

class Item_M extends Item{
    constructor(x,y,xp,yp){
        super(x,y,xp,yp,PICTURES.ITEM_M);
    }

    static createItem_M(x,y,xp,yp){
        items.items[items.numItems] = new Item_M(x,y,xp,yp);
        items.numItems = (items.numItems + 1) % MAX_ITEMS;
    }

    onHit(){
        if (weapons.numPowerUp < sShip.getEnergy()) weapons.numPowerUp++;
    }
}

class Item_L extends Item{
    constructor(x,y,xp,yp){
        super(x,y,xp,yp,PICTURES.ITEM_L);
    }

    static createItem_L(x,y,xp,yp){
        items.items[items.numItems] = new Item_L(x,y,xp,yp);
        items.numItems = (items.numItems + 1) % MAX_ITEMS;
    }

    onHit(){
        weapons.numL += 50;
    }
}

//Main game methods
var weapons = new Weapons();
var enemies = new Enemies(); 
var effects = new Effects();
var items = new Items();

function initObject(){
    weapons = new Weapons();
    enemies = new Enemies();
    effects = new Effects();
    items = new Items();
}

function setEnemies(){
    if (pauseTmr > 0) return;
    var sec = int(tmr/FPS);
    if ((sec >= 4 && sec < 10) && tmr % (20*FPS/30)  == 0) enemies.setEnemies(PICTURES.WING, 1300, 60+rnd(600), -16, 0);
    
    if ((sec >= 14 && sec < 20) && tmr % (20*FPS/30) == 0) enemies.setEnemies(PICTURES.BALL, 1300, 60+rnd(600), -12, rnd(2)?8:-8);
    
    if ((sec >= 24 && sec < 30) && tmr % (20*FPS/30) == 0) enemies.setEnemies(PICTURES.HOPPER, 1300, 360+rnd(300), -48, -10);
    
    if ((sec >= 34 && sec < 50) && tmr % (60*FPS/30) == 0) enemies.setEnemies(PICTURES.BLOCK, 1300, rnd(720-192), -6, 0);
    
    if ((sec >= 54 && sec < 70) && tmr % (20*FPS/30) == 0) {
        enemies.setEnemies(PICTURES.WING, 1300, 60+rnd(300), -16, 4);
        enemies.setEnemies(PICTURES.WING, 1300, 360+rnd(300), -16, -4);
    }

    if (sec >= 74 && sec < 90) {
        if(tmr % (20*FPS/30) == 0) enemies.setEnemies(PICTURES.BALL, 1300, 60+rnd(600), -12, rnd(2)?8:-8);
        if(tmr % (45*FPS/30) == 0) enemies.setEnemies(PICTURES.BLOCK, 1300, rnd(720-192), -8, 0, 8);
    }

    if (sec >= 94 && sec < 110) {
        if (tmr % (10*FPS/30) == 0) enemies.setEnemies(PICTURES.WING, 1300, 360, -24, rnd(11)-5);
        if (tmr % (20*FPS/30) == 0) enemies.setEnemies(PICTURES.HOPPER, 1300, 360+rnd(300), -56, -(4+rnd(12)));
    }
}

function setItems(){
    if (pauseTmr > 0) return;
    if (tmr % (12*FPS) == 0) {
        var itemProbability = new Map();
        var energyLoss = MAX_SHIP_ENERGY - getEnergy();
        itemProbability.set(PICTURES.ITEM_E, 25 + energyLoss*2);
        itemProbability.set(PICTURES.ITEM_M, 25 - energyLoss);
        itemProbability.set(PICTURES.ITEM_L, 25 - energyLoss);
        //^Add new items here^
        //itemProbability.values().forEach((v) => console.log("prob: " + v));

        //sum of the total probability of items
        var sumOfProbability = 0;
        itemProbability.values().forEach((v) => sumOfProbability += v);
            
        var rand = rnd(sumOfProbability) + 1;
        //console.log("original = " + rand);
        //select a random item to set based on the probability
        const spawnItem = function(v){
            if (rand > sumOfProbability) return;
            if (itemProbability.get(v)<rand) {
                rand = rand-itemProbability.get(v);
            }
            else {
                items.setItems(v, 1300, 60 + rnd(600), -10, 0);
                rand += sumOfProbability;
            }
        }
        itemProbability.keys().forEach((v) => spawnItem(v));
    }
}

function setWeapon(t){
    weapons.setWeapon(t);
}

function moveObjects(){
    if (pauseTmr > 0){
        enemies.drawEnemiesPause();
        items.drawItemsPause();
        weapons.drawWeaponsPause();
        return;
    }
    enemies.moveEnemies();
    items.moveItems();
    weapons.moveWeapon();

}

function initSShip(){
    sShip = new SShip(400, 360);
    changeWeapon(sShip.currentWeapon);
}

function moveSShip(){
    if (pauseTmr > 0){
        sShip.drawShipPause();
        return;
    }
    sShip.moveSShip();
}

function getEnergy(){
    return sShip.getEnergy();
}

function getShipLocation(){
    return [sShip.x, sShip.y];
}

function hitCheck(){
    if(pauseTmr > 0) return;
    for (var i = 0; i < MAX_ENEMIES; i++){
        if (!(enemies.enemies[i])) continue;
        //Enemies x SShip
        if (sShip.muteki == 0 && GameObject.hitCheck(sShip, enemies.enemies[i])){
            enemies.enemies[i].onHit(sShip.onHit());
        }
        if (!(enemies.enemies[i])) continue;
        //Enemies x Weapons
        for (var j = 0; j < MAX_WEAPONS; j++){
            if (!(weapons.weapons[j])) continue;
            if (enemies.enemies[i].muteki == 0 && GameObject.hitCheck(weapons.weapons[j], enemies.enemies[i])){
                if (!enemyWeapons.includes(enemies.getType(i)))
                    enemies.enemies[i].onHit(weapons.weapons[j].onHit());
                if(!enemies.enemies[i]) break;
            }
        }
    }
    //Ship x items
    for (var i = 0; i < MAX_ITEMS; i++){
        if (!items.items[i]) continue;
        if (GameObject.hitCheck(sShip, items.items[i])){
            items.items[i].onHit();
            items.deleteItems(i);
        }
    }
}

function autoHandle(){
    //auto fire
    if (isMouseInABox(900, 630, 280, 60) && tapC && !sShip.dragging){
        tapC = 0;
        sShip.auto = !sShip.auto;
    }
    var col = "white";
    if (sShip.auto){
        sShip.missileTmr = (sShip.missileTmr + 1) % AUTO_MISSILE_CD;
        col = "lime";
    }
    else sShip.missileTmr = 0;

    setAlp(70 * uiOpacity/100);
    fRect(900, 630, 280, 60, "navy");
    setAlp(uiOpacity);
    fText("[A]uto Missile", 1040, 660, 36, col);
    setAlp(100);
}

function lifeGaugeHandle() {
    //Life gauge
    setAlp(uiOpacity);
    for (var i = 0; i < MAX_SHIP_ENERGY; i++) fRect(20+i*30, 660, 20, 40, "#c00000");
    for (var i = 0; i < getEnergy(); i++) fRect(20+i*30, 660, 20, 40, colorRGB(160-16*i, 240-12*i, 24*i));
    setAlp(100);
}

function setExplosion(x,y,n){
    explosions.setExplosion(x,y,n);
}

function setShock(x,y,n){
    shocks.setShock(x,y,n);
}

function changeWeapon(weapon){
    if (weapon == PICTURES.FUNNEL){
        sShip.equipments.set("funnel", new Funnels());
    }
}

function drawEffects(){
    if (pauseTmr > 0) {
        effects.drawEffectsPause();
        return;
    }
    effects.drawEffects();
}

function gameoverCheck(){
    if (pauseTmr == 0 && getEnergy() <= 0){ 
        shakeTmr = FPS*5;
        shakeStr = 7;
        scene = SCENE.GAMEOVER;
        tmr = 0;
        stopBgm();
    }
}

function stageHandle(){
    if (scene == SCENE.SETTING) return;
    if (tmr < FPS*4) fText("STAGE " + stage, 600, 300, 50, "cyan");
    if (tmr > FPS*114 && tmr < FPS*118) fText("STAGE CLEAR", 600, 300, 50, "cyan");
    if (tmr == FPS * 120) {
        stage++;
        tmr = 0;
    }
}

function drawScore(){
    setAlp(uiOpacity);
    fText("SCORE " + score, 200, 50, 40, "white");
    fText("HISCORE " + hiScore, 600, 50, 40, "yellow");
    setAlp(100);
}

function drawHiScore(){
    fText("HISCORE " + hiScore, 600, 50, 40, "yellow");
}

function showBulletStatus(){
    setAlp(uiOpacity);
    drawImg(10, 70, 560);
    fTextN("X " + weapons.numPowerUp + "/" + sShip.getEnergy(), 200, 580, 50, 40, "lightblue");
    drawImg(11, 70, 613);
    fTextN("X " + weapons.numL, 200, 630, 50, 40, "lightblue");
    setAlp(100);
}  

function gameUI(){
    autoHandle();
    stageHandle();
    pauseButton();
    drawScore();
    setAlp(70 * uiOpacity/100);
    fRect(10,550,310,160,"navy");
    setAlp(100);
    lifeGaugeHandle();
    showBulletStatus();
}

function pauseButton(){
    if (scene == SCENE.STAGE){
        setAlp(70 * uiOpacity/100);
        fRect(1100,10,80,80, "navy");
        setAlp(uiOpacity);
        fRect(1120,20,10,60, "white");
        fRect(1150,20,10,60, "white");
        if (isMouseInABox(1100,10,80,80) && tapC  && !sShip.dragging){
            tapC = 0;
            scene = SCENE.PAUSE;
        }
    }
    else if (scene == SCENE.PAUSE) {
        setAlp(70);
        fRect(1100,10,80,80, "navy");
        setAlp(100);
        fTri(1120,20, 1120,80, 1160,50, "white");
        if (isMouseInABox(1100,10,80,80) && tapC  && !sShip.dragging){
            tapC = 0;
            scene = SCENE.STAGE;
        }
    }
    setAlp(100);
}

function pauseGame(){
    if (key[CONTROL.get("PAUSE")] == 1){ 
        scene = SCENE.PAUSE;
        key[CONTROL.get("PAUSE")] = 2;
    }
}

function isMouseInABox(x, y, dx, dy){
    if (tapX > x && tapX < x + dx && tapY > y && tapY < y + dy) return true;
    return false;
}

function findClosestEnemy(obj){
    var minDis = 1.1e99;
    var objCoord = obj.coord;
    var closest = null;
    for (var i = 0; i < MAX_ENEMIES; i++){
        if (!enemies.enemies[i]) continue;
        if (enemyWeapons.includes(enemies.getType(i)) || enemies.getType(i) == PICTURES.BLOCK) continue;
        var enemyCoord = enemies.enemies[i].coord;
        var dis = getDis(objCoord.x, objCoord.y, enemyCoord.x, enemyCoord.y);

        if (dis < minDis) {
            minDis = dis;
            closest = i;
        }
    }
    return enemies.enemies[closest];
}

//*****USER MENUS*****

//method to scroll menu items
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
    constructor(x, y, length, height, min, max, step, value, color1 = "grey", color2 = "white", active = true){
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
        this.active = active;
    }

    drawBar(){
        fRect(this.x, (this.y + this.height/4), this.length, this.height/2, this.color1);
        var knot = this.x + this.length/(this.max - this.min) * (this.value - this.min); // x coordinate of the knot
        fRect(knot, this.y, 10, this.height, this.color2);
        fText(this.min, this.x - 40, this.y+this.height/2, this.height/2, this.color2);
        fText(this.max, this.x + this.length + 40, this.y+this.height/2, this.height/2, this.color2);
        fText(this.value, this.x + this.length/2, this.y+this.height/2, this.height/2, this.color2);
        if (!this.active){
            setAlp(70);
            fRect(this.x-10,this.y,this.length+20,this.height,"black");
            setAlp(100);
        }
    }

    dragBar(){
        if (!this.active) return;
        if (this.dragging || (tapC && this.isPointing())) {
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
        if (!this.active) return;
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
        return isMouseInABox(this.x,this.y,this.length,this.height);
    }
}

//Box Button Object

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

    drawButton(isSelect=true){
        if(isSelect){
            setAlp(this.boxAlpha);
            fRect(this.x,this.y,this.length,this.width,this.boxColor);
            setAlp(100);
        }
        fText(this.text, this.x + this.length/2, this.y + this.width/2, this.fontSize, this.textColor);
    }

    isPointing(){
        return isMouseInABox(this.x,this.y,this.length,this.width);
    }
}

//---Title Screen / Main menu---

const SELECTED = true;
//Buttons
const playButtonFunction = function(){
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    tapC = 0;
    initObject();
    initSShip();
    score = 0; 
    stage = 1;
    scene = SCENE.STAGE;
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
    scene = SCENE.SETTING;
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

//---Setting Menu---

//fps drag bar
var fpsBar = new SlidingBar(312, 240, 576, 40, 30, 144, 1, FPS);

//fps button
var fpsButton = new BoxButton(550,175,100,50,40,"FPS","cyan","purple",70);

//uiOpacity drag bar
var uiBar = new SlidingBar(312,380,576,40,0,100,1,uiOpacity);

//uiOpacity button
var uiButton = new BoxButton(450,315,300,50,40,"UI-OPACITY","cyan","purple",70);

//Keybinds button
const controlButtonFunction = function(){
    scene = SCENE.CONTROLS;
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    tapC = 0;
    menu = 0;  
}
var controlButton = new BoxButton(475, 450, 250, 50, 40, "CONTROLS","cyan","purple",70, controlButtonFunction);

//Back button
const settingBackButtonFunction = function(){
    if (stage < 0) scene = SCENE.TITLE;
    else if (stage > 0) scene = SCENE.PAUSE;
    
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    key[CONTROL.get("BACK")] = 0;
    tapC = 0;
    menu = 0;
}
var settingBackButton = new BoxButton(475, 625, 250, 50, 40, "BACK[ESC]","cyan","purple",70, settingBackButtonFunction);

var dragging = false;
var BarCD = 2 * (FPS/30);
var settingtmr = 0;
//Setting Menu
function settingMenu(){
    settingtmr++;
    fpsBar.active = true;
    if (stage > 0) fpsBar.active = false;
    if (menu != 1) fText("SETTING", 600, 50, 40, "yellow")
    //drawImg(13, 200, 100);

    const totalMenuItems = 4;
    
    scrollMenu(totalMenuItems);

    //console.log(menu);

    if (fpsButton.isPointing()) menu = 0;
    else if (uiButton.isPointing()) menu = 1;
    else if (controlButton.isPointing()) menu = 2;
    else if (settingBackButton.isPointing()) menu = totalMenuItems-1;

    if (menu == 1) gameUI();
    
    fpsButton.drawButton(menu == 0? SELECTED:!SELECTED);
    uiButton.drawButton(menu == 1? SELECTED:!SELECTED);
    controlButton.drawButton(menu == 2? SELECTED:!SELECTED);
    settingBackButton.drawButton(menu == totalMenuItems-1? SELECTED:!SELECTED);

    //keyboard <- / -> change fps
    if (menu == 0){
        if (key[CONTROL.get("LEFT")] && ((settingtmr % BarCD) == 0)) fpsBar.changeValue(fpsBar.getValue() - 1);
        if (key[CONTROL.get("RIGHT")] && ((settingtmr % BarCD) == 0)) fpsBar.changeValue(fpsBar.getValue() + 1);
    }
    
    fpsBar.dragBar();
    if (fpsBar.dragging) {
        menu = 0; 
    }   
    fpsBar.drawBar();
    FPS = fpsBar.getValue();
    AUTO_MISSILE_CD = int(5 * FPS/30); 
    IFRAME = int(30 * FPS/30);
    ENEMY_IFRAME = int(1 * FPS/30);
    
    //keyboard <- / -> change ui opacity
    if (menu == 1) {
        if (key[CONTROL.get("LEFT")] && (settingtmr % BarCD == 0)) uiBar.changeValue(--uiOpacity);
        if (key[CONTROL.get("RIGHT")] && (settingtmr % BarCD == 0)) uiBar.changeValue(++uiOpacity);
    }

    uiBar.dragBar();
    if (uiBar.dragging) {
        menu = 1;
    }
    uiBar.drawBar();
    uiOpacity = uiBar.getValue();

    if (menu == 2) {
        if (key[CONTROL.get("SELECT")] == 1|| key[CONTROL.get("FIRE")] == 1 || (tapC && controlButton.isPointing())){
            controlButton.onClick();
        }
    }
    

    if (menu == totalMenuItems-1|| key[CONTROL.get("BACK")] == 1) {
        if (key[CONTROL.get("SELECT")] == 1|| key[CONTROL.get("FIRE")] == 1 || key[CONTROL.get("BACK")] == 1|| (tapC && settingBackButton.isPointing())){
            settingBackButton.onClick();
        }
    }
    
    
}

//---Controls menu---

//Back Button
const controlsBackButtonFunction = function(){
    scene = SCENE.SETTING;
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    key[CONTROL.get("BACK")] = 0;
    tapC = 0;
    menu = 0;
}
var controlsBackButton = new BoxButton(475, 625, 250, 50, 40, "BACK[ESC]","cyan","purple",70, controlsBackButtonFunction);

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
        if (key[CONTROL.get("LEFT")] == 1) {
            menu-=4;
            key[CONTROL.get("LEFT")] = 2;
        }
        if (key[CONTROL.get("RIGHT")] == 1) {
            menu+=4;
            key[CONTROL.get("RIGHT")] = 2;
        }
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

//---Pause Menu---
const quitButtonFunction = function(){
    key[CONTROL.get("SELECT")] = 2;
    key[CONTROL.get("FIRE")] = 2;
    tapC = 0;
    scene = SCENE.TITLE;
    menu = 0;
    stage = -999;
    stopBgm();
}
var quitButton = new BoxButton(400,450,400,50,40,"QUIT","cyan","purple",70,quitButtonFunction);

const continueButtonFunction = function(){
    key[CONTROL.get("SELECT")] = 2;
    key[CONTROL.get("FIRE")] = 2;
    tapC = 0;
    scene = SCENE.STAGE;
    menu = 0;
}
var continueButton = new BoxButton(400,300,400,50,40,"CONTINUE","cyan","purple",70,continueButtonFunction);

const pauseSettingButtonFunction = function(){
    key[CONTROL.get("SELECT")] = 2;
    key[CONTROL.get("FIRE")] = 2;
    tapC = 0;
    menu = 0;
    scene = SCENE.SETTING;
}
var pauseSettingButton = new BoxButton(400,375,400,50,40,"SETTING","cyan","purple",70,pauseSettingButtonFunction);

function pauseMenu(){
    if (key[CONTROL.get("PAUSE")] == 1){ 
        scene = SCENE.STAGE;
        key[CONTROL.get("PAUSE")] = 2;
        return;
    }

    sShip.drawShipPause();
    enemies.drawEnemiesPause();
    weapons.drawWeaponsPause();
    items.drawItemsPause();
    effects.drawEffectsPause();
    
    pauseButton();
    fText("PAUSE", 600, 200, 80, "yellow");
    
    const totalMenuItems = 3;
    scrollMenu(totalMenuItems);

    if(continueButton.isPointing()) menu = 0;
    else if(pauseSettingButton.isPointing()) menu = 1;
    else if(quitButton.isPointing()) menu = totalMenuItems-1;

    continueButton.drawButton(menu==0?true:false);
    pauseSettingButton.drawButton(menu==1?true:false);
    quitButton.drawButton(menu==totalMenuItems-1?true:false);

    if (menu == 0){
        if (key[CONTROL.get("SELECT")] == 1 || key[CONTROL.get("FIRE")] == 1 || (tapC && continueButton.isPointing())){
            continueButton.onClick();
        }
    }
    else if (menu == 1){
        if (key[CONTROL.get("SELECT")] == 1 || key[CONTROL.get("FIRE")] == 1 || (tapC && pauseSettingButton.isPointing())){
            pauseSettingButton.onClick();
        }
    }
    else if (menu == totalMenuItems-1){
        if (key[CONTROL.get("SELECT")] == 1 || key[CONTROL.get("FIRE")] == 1 || (tapC && quitButton.isPointing())){
            quitButton.onClick();
        }
    }
}

function gameoverMenu(){
    drawScore();
    const [x,y] = getShipLocation();
    if (tmr > FPS*5) {scene = SCENE.TITLE; stage = -999}
    else if (tmr % int(FPS*1/6) == 1) effects.setEffect(PICTURES.EXPLOSION, x + rnd(120) - 60, y + rnd(120) - 60, 0, picturesFrame.get(PICTURES.EXPLOSION));
    moveObjects();
    drawEffects();
    fText("GAME OVER", 600, 300, 50, "red");
}

