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
    loadImg(16, "image/shock.png");
    
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


const WEAPONS = Object.freeze({
    MISSILE: 2,
    LASER: 12,
    PLASMABALL: 14,
    LPLASMABALL: 15,
});

const EFFECTS = Object.freeze({
    EXPLOSION: 3,
    SHOCK: 16,
})

const WeaponEffect = new Map();
WeaponEffect.set(WEAPONS.PLASMABALL, EFFECTS.SHOCK);
WeaponEffect.set(WEAPONS.LPLASMABALL, EFFECTS.SHOCK);
WeaponEffect.set(WEAPONS.MISSILE, EFFECTS.EXPLOSION);
WeaponEffect.set(WEAPONS.LASER, EFFECTS.EXPLOSION);

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

function mainloop(){
    drawBG(1);
    setFPS(FPS);
    
    switch (scene) {
        case SCENE.TITLE:
            tmr++;
            mainMenu();
            break;

        case SCENE.PAUSE:
            pauseMenu();
            break;
        case SCENE.STAGE:
            tmr++;
            pauseGame();
            gameoverCheck();
            gameUI(); 
            moveObjects();
            moveSShip();
            moveMissile();
            setEnemies();
            setItems();
            hitCheck();
            drawEffects();

            break;

        case SCENE.GAMEOVER:
            tmr++;
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
    if (scene==SCENE.PAUSE) spd = 0;

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


//*****GAME*****
const MISSILE_RADIUS = 12;
const SELF_RADIUS = 30;

class GameObject {
    constructor(x, y, xp, yp, t, life, totalFrame = 1){
        this.x = x;
        this.y = y;
        this.xp = xp;
        this.yp = yp ;
        this.t = t;
        this.life = life;
        this.muteki = 0;
        this.totalFrame = totalFrame;
        this.frame = 0;
        this.frame_FPS_counter = 0;
        this.paralyseTmr= 0;
    }
    
    drawObject(){        
        if (this.paralyseTmr > 0){ 
            this.drawObjectPause(); 
            this.paralyseTmr--;
            return;
        }
        var frameWidth = img[this.t].width/this.totalFrame;
        var frameHeight = img[this.t].height;
        this.x = this.x + this.xp * 30/FPS;
        this.y = this.y + this.yp * 30/FPS;
        drawImgTS(this.t, frameWidth*this.frame, 0, frameWidth, frameHeight, this.x-frameWidth/2, this.y-frameHeight/2, frameWidth, frameHeight);
        if (this.totalFrame > 1){
            this.frame_FPS_counter = (this.frame_FPS_counter + 1 * 30/FPS);
            this.frame = int(this.frame_FPS_counter) % this.totalFrame;
        }
    }

    drawObjectPause(){
        var frameWidth = img[this.t].width/this.totalFrame;
        var frameHeight = img[this.t].height;
        drawImgTS(this.t, frameWidth*this.frame, 0, frameWidth, frameHeight, this.x-frameWidth/2, this.y-frameHeight/2, frameWidth, frameHeight);
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
        this.dragging = false;
        this.currentWeapon = WEAPONS.PLASMABALL;
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
        this.dragging = false;
        if (tapC > 0){     
            this.dragging = true;      
            this.ship.x += int((tapX-this.ship.x)/6);
            this.ship.y += int((tapY-this.ship.y)/6);            
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
    
        if (this.ship.muteki % 2 == 0) this.ship.drawObject();
        if (this.ship.muteki > 0) this.ship.muteki--;
    }

    getEnergy(){
        return this.ship.life;
    }
}

var sShip = new SShip(400,360);


//自機が撃つ弾の管理


//default x,y velocities of different weapons
const WeaponVelocity = new Map();
WeaponVelocity.set(WEAPONS.MISSILE,new vec2d(40,0));
WeaponVelocity.set(WEAPONS.LASER,new vec2d(40,0));
WeaponVelocity.set(WEAPONS.PLASMABALL,new vec2d(35,0));
WeaponVelocity.set(WEAPONS.LPLASMABALL,new vec2d(35,0));

//number of animation frames of different weapons
const WeaponFrame = new Map();
WeaponFrame.set(WEAPONS.MISSILE, 1);
WeaponFrame.set(WEAPONS.LASER, 1);
WeaponFrame.set(WEAPONS.PLASMABALL, 4);
WeaponFrame.set(WEAPONS.LPLASMABALL, 4);

const STATUS = Object.freeze({
    PARALYSE: 0,
})

const setWeaponFunc = new Map();
setWeaponFunc.set(WEAPONS.MISSILE, function(){return Missile.createMissiles()});
setWeaponFunc.set(WEAPONS.LASER, function(){return Missile.createMissiles()});
setWeaponFunc.set(WEAPONS.PLASMABALL, function(){return Plasmaball.createPlasmaball()});
setWeaponFunc.set(WEAPONS.LPLASMABALL, function(){return Plasmaball.createPlasmaball()});

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

    deleteWeapon(i){
        if (this.weapons[i]){
            this.weapons.splice(i,1,null);
        }
    }
}

class Missile extends GameObject{
    constructor(i){//set missile
        var n = weapons.numPowerUp;
        var currentWeapon = sShip.currentWeapon;
        var frame = WeaponFrame.get(currentWeapon);
        var velocity = WeaponVelocity.get(currentWeapon);
        super((sShip.ship.x+40), (sShip.ship.y - n*6 + i*12), velocity.x, int((i-n/2)*2), currentWeapon, -1, frame);
        this.id = weapons.numWeapons;
    }

    static createMissiles(){
        for (var i = 0; i <= weapons.numPowerUp; i++){
            //arr.push(new Missile());
            weapons.weapons[weapons.numWeapons] = new Missile(i);
            weapons.numWeapons = (weapons.numWeapons + 1) % MAX_WEAPONS;
        }
        
        if (weapons.numL > 0){ 
            weapons.numL--;
            weapons.numL==0?sShip.currentWeapon=2:0;
        }
    }

    moveWeapon(){
        super.drawObject();
        if (this.x > 1200) {
            weapons.deleteWeapon(this.id);
        }
    }

    onHit(){
        if (this.t == WEAPONS.MISSILE) weapons.deleteWeapon(this.id); //delete when the missile is not a laser;
        return [];
    }
}


//Paralysis enemies
class Plasmaball extends GameObject{//*****TODO*****
    constructor(i){//set missile
        var n = weapons.numPowerUp;
        var currentWeapon = sShip.currentWeapon;
        var frame = WeaponFrame.get(currentWeapon);
        var velocity = WeaponVelocity.get(currentWeapon);
        velocity = velocity.rotate(8*((i-n/2)*2));
        super((sShip.ship.x+40), (sShip.ship.y - n*6 + i*12), velocity.x, velocity.y, currentWeapon, -1, frame);
        this.id = weapons.numWeapons;
        this.alp = 100;
        this.sec = FPS * 2;
    }

    static createPlasmaball(){
        for (var i = 0; i <= weapons.numPowerUp; i++){
            //arr.push(new Missile());
            weapons.weapons[weapons.numWeapons] = new Plasmaball(i);
            weapons.numWeapons = (weapons.numWeapons + 1) % MAX_WEAPONS;
        }
        
        if (weapons.numL > 0){ 
            weapons.numL--;
            weapons.numL==0?sShip.currentWeapon=14:0;
        }
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
        this.alp = this.alp>10?this.alp * Math.pow(0.985, 60/FPS):this.alp;
        
        this.sec -= 1;
    }

    onHit(){
        weapons.deleteWeapon(this.id);
        if (this.t == WEAPONS.LPLASMABALL) return [STATUS.PARALYSE]; 
        return [];
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
const EffectFrame = new Map();
EffectFrame.set(EFFECTS.EXPLOSION, 9);
EffectFrame.set(EFFECTS.SHOCK, 8);

const setEffectFunc = new Map();
setEffectFunc.set(EFFECTS.EXPLOSION,function(x,y,n,d){return Explosion.setExplosion(x,y,n,d);});
setEffectFunc.set(EFFECTS.SHOCK,function(x,y,n,d){return Shock.setShock(x,y,n,d);});


const MAX_EFFECTS = 100;


class Effect {
    constructor(x, y, t, duration, totalFrame = 1, startFrame = 0){
        this.x = x;
        this.y = y;
        this.t = t;
        this.totalFrame = totalFrame;
        this.frame = startFrame;
        this.frame_FPS_counter = startFrame;
        this.duration = int(duration * FPS/30);
    }
    
    drawEffect(){      
        if (this.duration == 0) return;  
        var frameWidth = img[this.t].width/this.totalFrame;
        var frameHeight = img[this.t].height;
        drawImgTS(this.t, frameWidth*this.frame, 0, frameWidth, frameHeight, this.x-frameWidth/2, this.y-frameHeight/2, frameWidth, frameHeight);
        if (this.totalFrame > 1){
            this.frame_FPS_counter = (this.frame_FPS_counter + 1 * 30/FPS);
            this.frame = int(this.frame_FPS_counter) % this.totalFrame;
            if (this.frame == 0) this.frame += this.startFrame;
        }
        this.duration--;
    }

    drawEffectPause(){
        var frameWidth = img[this.t].width/this.totalFrame;
        var frameHeight = img[this.t].height;
        drawImgTS(this.t, frameWidth*this.frame, 0, frameWidth, frameHeight, this.x-frameWidth/2, this.y-frameHeight/2, frameWidth, frameHeight);
    }
}

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

    deleteEffect(i){
        if (this.effects[i]){
            this.effects.splice(i,1,null);
        }
    }
}


class Explosion extends Effect{
    constructor(x,y,n,duration){
        super(x,y,EFFECTS.EXPLOSION,duration,EffectFrame.get(EFFECTS.EXPLOSION), n);
        this.id = effects.numEffects++;
        effects.numEffects = effects.numEffects % MAX_EFFECTS;
    }

    static setExplosion(x,y,n,duration){
        effects.effects[effects.numEffects] = new Explosion(x,y,n,duration);
    }
}

class Shock extends Effect{
    constructor(x,y,n,duration){
        super(x,y,EFFECTS.SHOCK,duration,EffectFrame.get(EFFECTS.SHOCK), n);
        this.id = effects.numEffects++;
        effects.numEffects = effects.numEffects % MAX_EFFECTS;
    }

    static setShock(x,y,n,duration){
        effects.effects[effects.numEffects] = new Shock(x,y,n,duration);
    }
}



//敵をセットする
const MAX_ENEMIES = 100;

const ENEMIES = new Map();
ENEMIES.set("BULLET",4);
ENEMIES.set("WING",5);
ENEMIES.set("BALL",6);
ENEMIES.set("HOPPER",7);
ENEMIES.set("BLOCK",8);

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
                                if(tmr % Math.ceil(FPS/30) == 0) this.enemies[i].xp = int(this.enemies[i].xp * 0.95);
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
            effects.setEffect(EFFECTS.EXPLOSION,this.enemies[i].x, this.enemies[i].y, 0, EffectFrame.get(EFFECTS.EXPLOSION));
            this.deleteEnemies(i);
            score += 100;
            if (score > hiScore) hiScore = score;
        }
        else{ 
            effects.setEffect(WeaponEffect.get(sShip.currentWeapon),this.enemies[i].x, this.enemies[i].y, 0, EffectFrame.get(WeaponEffect.get(sShip.currentWeapon)));

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


//アイテムをセットする
const MAX_ITEMS = 100

const ITEMS = new Map();
ITEMS.set("ENERGY",9);
ITEMS.set("MISSILE",10);
ITEMS.set("LASER",11);
 
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
    if (tmr % (12*FPS) == 0) {
        var itemProbability = new Map();
        var energyLoss = MAX_SHIP_ENERGY - getEnergy();
        itemProbability.set("ENERGY", 25 + energyLoss*2);
        itemProbability.set("MISSILE", 25 - energyLoss);
        itemProbability.set("LASER", 25 - energyLoss);
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
                items.setItems(1300, 60 + rnd(600), -10, 0, ITEMS.get(v));
                rand += sumOfProbability;
            }
        }
        itemProbability.keys().forEach((v) => spawnItem(v));
    }

}

function setWeapon(t){
    weapons.setWeapon(t);
    //console.log("Weapon setted");
}

function moveObjects(){
    enemies.moveEnemies();
    items.moveItems();
}

function moveMissile(){
     weapons.moveWeapon();
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


        //Enemies x Weapons
        for (var j = 0; j < MAX_WEAPONS; j++){
            var hit = false;
            if (enemies.enemies[i].t == 4) break;
            if (!(weapons.weapons[j])) continue;
            if (enemies.enemies[i].muteki==0 && enemies.enemies[i].hitCheck(weapons.weapons[j], r1,r2)){
                //explosions.setExplosion(enemies.enemies[i].x, enemies.enemies[i].y, 9);
                hit = true;
                enemies.decreaseEnemyLife(i);
                const status = weapons.weapons[j].onHit();
                if(!enemies.enemies[i]) break;
                for (var k = 0; k < status.length; k++){
                    enemies.enemies[i].t!=8?enemies.enemies[i].paralyseTmr += 10 * FPS/30 : 0;
                }
            }
            hit?enemies.enemies[i].muteki = ENEMY_IFRAME:0;
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
                case 10: if (weapons.numPowerUp < sShip.getEnergy()) weapons.numPowerUp++; break;
                case 11: 
                        weapons.numL += 50; 
                        sShip.currentWeapon = 15;
                        break;
            }
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

function drawEffects(){
    effects.drawEffects();
}

function gameoverCheck(){
    if (getEnergy() <= 0){ 
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

//Title Screen / Main menu

const SELECTED = true;
//Buttons
const playButtonFunction = function(){
    key[CONTROL.get("FIRE")] = 0;
    key[CONTROL.get("SELECT")] = 0;
    tapC = 0;
    initSShip();
    initObject();
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




//Setting Menu


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




//Controls menu


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

//Pause Menu
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

    sShip.ship.drawObjectPause();
    for (var i = 0; i < MAX_ENEMIES; i++) enemies.enemies[i]?enemies.enemies[i].drawObjectPause():0;
    for (var i = 0; i < MAX_WEAPONS; i++) weapons.weapons[i]?weapons.weapons[i].drawObjectPause():0;
    for (var i = 0; i < MAX_ITEMS; i++) items.items[i]?items.items[i].drawObjectPause():0;
    
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
    else if (tmr % int(FPS*1/6) == 1) effects.setEffect(EFFECTS.EXPLOSION, x + rnd(120) - 60, y + rnd(120) - 60, 0, EffectFrame.get(EFFECTS.EXPLOSION));
    moveObjects();
    moveMissile();
    drawEffects();
    fText("GAME OVER", 600, 300, 50, "red");
}

