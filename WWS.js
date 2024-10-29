/*
JavaScript&HTML5 ゲーム開発用システム
開発 ワールドワイドソフトウェア有限会社

（使用条件）
本ソースコードの著作権は開発元にあります。
利用されたい方はメールにてお問い合わせ下さい。
th@wwsft.com ワールドワイドソフトウェア 廣瀬
*/

// ---------- グローバル変数 ----------
var SYS_VER = "Ver.20200227";
var DEBUG = false;

//端末の種類
var deviceType	= 0;
var PT_PC		= 0;
var PT_iOS		= 1;
var PT_Android	= 2;
var PT_Kindle	= 3;

//処理の進行を管理
//main_idxの値↓
//0: 初期化
//1: セーブできない警告
//2: メイン処理
var main_idx = 0;
var main_tmr = 0;
var stop_flg = 0;//メイン処理の一時停止

var NUA = navigator.userAgent;//機種判定
var supportTouch = 'ontouchend' in document;//タッチイベントが使えるか？
if(DEBUG) {//★★★開発中
	log(NUA);
	log(supportTouch);
}

// ---------- 描画面(キャンバス) ----------
//サウンドの定義
var SOUND_ON = true;//サウンドを出力するか

//キャンバスの初期サイズ
var CWIDTH  = 800;//幅
var CHEIGHT = 600;//高さ

//フレームレート
var FPS = 30;//１秒間に何回処理を行うか ( frames per second )

//ローカルストレージ
var LS_KEYNAME = "SAVEDATA";//keyName 任意に変更可

//保存できるか判定し、できない場合に警告を出す　具体的には iOS Safari プライベートブラウズがON（保存できない）状態に警告を出す
var CHECK_LS = false;

//キー入力用
var K_ENTER = 13;
var K_SPACE = 32;
var K_LEFT  = 37;
var K_UP    = 38;
var K_RIGHT = 39;
var K_DOWN  = 40;
var K_a     = 65;
var K_z     = 90;

// ---------- 描画面(キャンバス) ----------
var winW, winH;
var bakW, bakH;
var SCALE = 1.0;//スケール値設定＋タップ位置計算用
var cvs = document.getElementById("canvas");
var bg = cvs.getContext("2d");

function initCanvas() {//キャンバス初期設定
	winW = window.innerWidth;
	winH = window.innerHeight;
	bakW = winW;
	bakH = winH;

	if( winH < winW*CHEIGHT/CWIDTH ) {
		winW = int(winH*CWIDTH/CHEIGHT);
	}
	else {
		winH = int(CHEIGHT*winW/CWIDTH);
	}
	cvs.width = winW;
	cvs.height = winH;
	SCALE = winW / CWIDTH;
	bg.scale(SCALE,SCALE);
	bg.textAlign = "center";   //┬文字列のセンタリング表示用に必要な値を指定
	bg.textBaseline = "middle";//┘
//	cvs.focus();//キー入力を拾えるようにフォーカスを当てる
}

function canvasSize(w, h) {//■ユーザー用関数
	CWIDTH = w;
	CHEIGHT = h;
	initCanvas();
}

// ---------- 各種の関数 ----------
function eID(id) {
	return document.getElementById(id);
}

function log(str) {
	console.log(str);
}

function int(val) {//整数を返す＝小数点以下を切り捨て
//	return Math.floor(val);//マイナスの場合 -0.1 → -1となるので注意
	return parseInt(val);//こちらはプラスもマイナスも小数部分を切り捨てる
}

function str(val) {//数を文字列に変換
	return String(val);
}

function rnd(max) {//乱数
	return int(Math.random()*max);
}

function abs(val) {//絶対値
	return Math.abs(val);
}

function sin(a) {//三角関数
	return Math.sin(Math.PI*2*a/360);
}

function cos(a) {
	return Math.cos(Math.PI*2*a/360);
}

function getDis(x1, y1, x2, y2) {//２点間の距離
	return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
}

function digit0(val, leng) {
	var s = "0000000000000000" + val;
	return s.substring( s.length-leng, s.length );
}

function setFPS(val) {//フレームレートの設定
	FPS = val;
}

// ---------- キー入力 ----------
window.addEventListener("keydown", onKey);
window.addEventListener("keyup", offKey);

var inkey = 0;
var key = new Array(256);

function clrKey() {
	inkey = 0;
	for(var i = 0; i < 256; i++) key[i] = 0;
}

function onKey(e) {
	if(snd_init == 0) loadSoundSPhone();//【重要】サウンドの読み込み
	inkey = e.keyCode;
	key[e.keyCode]++;
}

function offKey(e) {
	inkey = 0;
	key[e.keyCode] = 0;
}

// ---------- マウス入力 ----------
var tapX = 0;
var tapY = 0;
var tapC = 0;

function mouseDown(e) {
	e.preventDefault();//キャンバスの選択／スクロール等を抑制する
	var rect = e.target.getBoundingClientRect();
	tapX = e.clientX-rect.left;
	tapY = e.clientY-rect.top;
	tapC = 1;
	transformXY();
	if(snd_init == 0) loadSoundSPhone();//【重要】サウンドの読み込み
}

function mouseMove(e) {
	e.preventDefault();
	var rect = e.target.getBoundingClientRect();
	tapX = e.clientX-rect.left;
	tapY = e.clientY-rect.top;
	transformXY();
}

function mouseUp(e) { tapC = 0; }
function mouseOut(e) { tapC = 0; }

// ---------- タップ入力 ----------
function touchStart(e) {
	e.preventDefault();//キャンバスの選択／スクロール等を抑制する
	var rect = e.target.getBoundingClientRect();
	tapX = e.touches[0].clientX-rect.left;
	tapY = e.touches[0].clientY-rect.top;
	tapC = 1;
	transformXY();
	if(snd_init == 0) loadSoundSPhone();//【重要】サウンドの読み込み
}

function touchMove(e) {
	e.preventDefault();
	var rect = e.target.getBoundingClientRect();
	tapX = e.touches[0].clientX-rect.left;
	tapY = e.touches[0].clientY-rect.top;
	transformXY();
}

function touchEnd(e) {
	e.preventDefault();
	tapC = 0;//※マウス操作ではmouseOutがこれになる
}

function touchCancel(e) {
	tapX = -1;
	tapY = -1;
	tapC = 0;
}

function transformXY() {//実座標→仮想座標への変換
	tapX = int(tapX/SCALE);
	tapY = int(tapY/SCALE);
}

// ---------- 加速度センサー ----------
var acX = 0, acY = 0, acZ = 0;

//window.ondevicemotion = deviceMotion;//★★★旧
window.addEventListener("devicemotion", deviceMotion);

function deviceMotion(e) {
	var aIG = e.accelerationIncludingGravity;
	acX = int(aIG.x);
	acY = int(aIG.y);
	acZ = int(aIG.z);
	if(deviceType == PT_Android) {//Android と iOS で正負が逆になる
		acX = -acX;
		acY = -acY;
		acZ = -acZ;
	}
}

// ---------- 画像読み込み ----------
var img = new Array(256);
var img_loaded = new Array(256);

function loadImg(n, filename) {
//	log("画像"+n+" "+filename+" 読込開始");
	img_loaded[n] = false;//読み込み開始
	img[n] = new Image();
	img[n].onload = function() {
//		log("画像"+n+" "+filename+" 読込完了");
		img_loaded[n] = true;
	}
	img[n].src = filename;
}

// ---------- サウンド制御 ----------
var snd_init = 0;//サウンドファイルを読み込んだか（スマートフォン対策）

var soundfile = new Array(256);
var isBgm = -1;
var bgmNo = 0;
var wait_se = 0;
var seNo = -1;

var soundloaded = 0;//いくつファイルを読み込んだか
var sf_name = new Array(256);

function loadSoundSPhone() {//スマートフォンでサウンドファイルを読み込む
	for(var i = 0; i < soundloaded; i++) {
		try {
			soundfile[i] = new Audio(sf_name[i]);
			soundfile[i].load();
//			log("サウンド読み込みＳＰ"+i);
		} catch(e) {}
	}
	snd_init = 2;//スマホでサウンドを読み込んだ
}

function loadSound(n, filename) {
//	if(deviceType == PT_PC) {
//		try {
//			soundfile[n] = new Audio(filename);
//			soundfile[n].load();
//			log("サウンド読み込みＰＣ"+n);
//		} catch(e) {}
//		snd_init = 1;//パソコンでサウンドを読み込んだ
//	}
//	else {
		sf_name[n] = filename;
//	}
	soundloaded++;
}

function playSE(n) {
	if(SOUND_ON == false) return;
	if(isBgm == 2) return;
	if(wait_se == 0) {
		seNo = n;
		soundfile[n].loop = false;
		soundfile[n].play();
		wait_se = 3;//ブラウザに負荷をかけないため連続して流さないようにする
	}
}

function playBgm(n) {
	if(SOUND_ON == false) return;
	log("ＢＧＭ"+n+"出力");
	bgmNo = n;
	soundfile[n].loop = true;
	soundfile[n].play();
	isBgm = 1;//BGM流れている
}

function pauseBgm() {
	soundfile[bgmNo].pause();
	isBgm = 0;//BGM停止している
}

function stopBgm() {
	soundfile[bgmNo].pause();
	soundfile[bgmNo].currentTime = 0;
	isBgm = 0;//BGM停止している
}

function rateSnd(rate) {//曲の速度
	soundfile[bgmNo].playbackRate = rate;
}

//ブラウザを隠した時に音を一時停止する処理
document.addEventListener("visibilitychange", vcProc);

function vcProc() {
	log("visibilitychange");
	if(document.visibilityState == "hidden") {
		stop_flg = 1;
		if(isBgm == 1) {
			pauseBgm();
			isBgm = 2;//BGM再出力待ち
		}
	}
	else if(document.visibilityState == "visible") {
		stop_flg = 0;
		if(isBgm == 2) playBgm(bgmNo);
	}
}

// ---------- ローカルストレージ ----------
//【開発メモ】
//ローカルストレージへのアクセスができない状態（具体的にはSafariでプライベートブラウズになっている時） try catch が入っていないとフリーズする
//7  C:\Users\ユーザ名\AppData\Local\Google\Chrome\User Data\Default\Local Storage
//
function saveLS(kno, val) {
	try {
		localStorage.setItem(LS_KEYNAME+kno, val);
	}
	catch(e) {}
}

function loadLS(kno) {//文字列、数値をそのまま保存し、元の状態（型）で読み込めるようにしてある
	var val = null;
	try {
		val = localStorage.getItem(LS_KEYNAME+kno);
	}
	catch(e) {}
	if(val == null) return val;
	if(val == "") return val;
	if(isNaN(val) == true) return val;
	//↑以上、文字列
	return Number(val);
}

function clrLS(kno) {
	localStorage.removeItem(LS_KEYNAME+kno);
}

// ---------- 描画１ 図形 ----------
function setAlp(per) {
	bg.globalAlpha = per/100;//【メモ】HTML5は0.0～1.0の値で指定
}

function colorRGB(cr, cg, cb) {
	cr = int(cr);//【開発メモ】少数を渡すとおかしくなるので整数にしておく
	cg = int(cg);
	cb = int(cb);
	return ("rgb("+cr+","+cg+","+cb+")");
}

function lineW(wid) {//線の太さを指定
	bg.lineWidth = wid;
	bg.lineCap = "round";//線の先端を丸める指定
	bg.lineJoin = "round";//線の接続部分を丸める指定
}

function line(x0, y0, x1, y1, col) {//線
	bg.strokeStyle = col;
	bg.beginPath();
	bg.moveTo(x0, y0);
	bg.lineTo(x1, y1);
	bg.stroke();
}

function fill(col) {//キャンバス全体の塗り潰し
	bg.fillStyle = col;
	bg.fillRect(0, 0, CWIDTH, CHEIGHT);
}

function fRect(x, y, w, h, col) {//矩形（塗り潰し）
	bg.fillStyle = col;
	bg.fillRect(x, y, w, h);
}

function sRect(x, y, w, h, col) {//矩形（線）
	bg.strokeStyle = col;
	bg.strokeRect(x, y, w, h);
}

function fCir(x, y, r, col) {//円（塗り潰し）
	bg.fillStyle = col;
	bg.beginPath();
	bg.arc(x, y, r, 0, Math.PI*2, false);
	bg.closePath();
	bg.fill();
}
function sCir(x, y, r, col) {//円（線）
	bg.strokeStyle = col;
	bg.beginPath();
	bg.arc(x, y, r, 0, Math.PI*2, false);
	bg.closePath();
	bg.stroke();
}

function fTri(x0, y0, x1, y1, x2, y2, col) {//三角（塗り潰し）
	bg.fillStyle = col;
	bg.beginPath();
	bg.moveTo(x0, y0);
	bg.lineTo(x1, y1);
	bg.lineTo(x2, y2);
	bg.closePath();
	bg.fill();
}

function sTri(x0, y0, x1, y1, x2, y2, col) {//三角（線）
	bg.strokeStyle = col;
	bg.beginPath();
	bg.moveTo(x0, y0);
	bg.lineTo(x1, y1);
	bg.lineTo(x2, y2);
	bg.closePath();
	bg.stroke();
}

function fPol(xy, col) {//多角形
	bg.fillStyle = col;
	bg.beginPath();
	bg.moveTo(xy[0], xy[1]);
	for(var i=2; i<xy.length; i+=2) bg.lineTo(xy[i], xy[i+1]);
	bg.closePath();
	bg.fill();
}

// ---------- 描画２ 画像 ----------
function drawImg(n, x, y) {
	if(img_loaded[n] == true) bg.drawImage(img[n], x, y);
}

function drawImgC(n, x, y) {//センタリング表示
	if(img_loaded[n] == true) bg.drawImage(img[n], x-int(img[n].width/2), y-int(img[n].height/2));
}

function drawImgS(n, x, y, w, h) {//拡大縮小
	if(img_loaded[n] == true) bg.drawImage(img[n], x, y, w, h);
}

function drawImgTS(n, sx, sy, sw, sh, cx, cy, cw, ch) {//切り出し＋拡大縮小
	if(img_loaded[n] == true) bg.drawImage(img[n], sx, sy, sw, sh, cx, cy, cw, ch);
}

function drawImgR(n, x, y, ang) {//回転
	if(img_loaded[n] == true) {
		var w = img[n].width;
		var h = img[n].height;
		bg.save();
		bg.translate(x+w/2, y+h/2);
		bg.rotate(Math.PI*ang/180);
		bg.drawImage(img[n], -w/2, -h/2);
		bg.restore();
	}
}

// ---------- 描画３ 文字 ----------
function fText(str, x, y, siz, col) {
	bg.font = int(siz) + "px bold monospace";//等幅フォントを指定
	bg.fillStyle = "black";
	bg.fillText(str, x+1, y+1);
	bg.fillStyle = col;
	bg.fillText(str, x, y);
}

function fTextN(str, x, y, h, siz, col) {
	var i;
	var sn = str.split("\n");//改行を区切り文字とした一次元配列を生成
	bg.font = int(siz) + "px bold monospace";//等幅フォントを指定
	if(sn.length == 1) {
		h = 0;
	}
	else {
		y = y - int(h/2);
		h = int(h/(sn.length-1));
	}
	for(i = 0; i < sn.length; i++) {
		bg.fillStyle = "black";
		bg.fillText(sn[i], x+1, y+h*i+1);
		bg.fillStyle = col;
		bg.fillText(sn[i], x, y+h*i);
	}
}

function mTextWidth(str) {//文字列のキャンバス上の幅を返す
	return bg.measureText(str).width;
}

// ---------- 日時の取得 ----------
var year, month, date, day, hour, min, sec;

function getDate() {
	var D = new Date();
	year	= D.getFullYear();	//西暦を取得
	month	= D.getMonth();		//月を取得　１月は0
	date	= D.getDate();		//日を取得
	day		= D.getDay();		//曜日を取得　日曜は0
	hour	= D.getHours();		//時間を取得
	min		= D.getMinutes();	//分を取得
	sec		= D.getSeconds();	//秒を取得
}

// ---------- リアルタイム処理 ----------
function wwsSysMain() {

//	var stime = new Date().getTime();
	var stime = Date.now();

	//ブラウザのサイズが変化したか？（スマホなら持ち方を変えたか　縦持ち⇔横持ち）
	if(bakW != window.innerWidth || bakH != window.innerHeight) initCanvas();

	main_tmr ++;
	
	switch(main_idx) {

	case 0://初期化
	setup();
	clrKey();
	main_idx = 2;
	//iOS Safari プライベートブラウズがON（保存できない）か判定
	if(CHECK_LS == true) {
		try {localStorage.setItem("_save_test", "testdata"); } catch(e) { main_idx = 1; }
	}
	break;

	case 1://ローカルストレージの警告
	var x = int(CWIDTH/2);
	var y = int(CHEIGHT/6);
	var fs = int(CHEIGHT/16);
	fill("black");
	fText("※セーブデータが保存されません※", x, y/2, fs, "yellow");
	fTextN("iOS端末をお使いの場合は\nSafariのプライベートブラウズ\nをオフにして起動して下さい。", x, y*2, y, fs, "yellow");
	fTextN("その他の機種（ブラウザ）では\nローカルストレージへの保存を\n許可する設定にして下さい。", x, y*4, y, fs, "yellow");
	fText("このまま続けるには画面をタップ", x, y*5.5, fs, "lime");
	if(tapC != 0) main_idx = 2;
	break;

	case 2://メイン処理
	if(stop_flg == 0) {
		mainloop();
	}
	else {
		clrKey();
		main_tmr--;
	}
	if(wait_se > 0) wait_se--;
	break;

	}

	var ptime = Date.now() - stime;
	if(ptime < 0) ptime = 0;
	if(ptime > int(1000/FPS)) ptime = int(1000/FPS);

	if(DEBUG) {//★★★デバッグ
		var i, x = 240, y;
		fText("処理時間="+(ptime), x, 50, 16, "lime");
		fText("deviceType="+deviceType, x, 100, 16, "yellow");
		fText("isBgm="+isBgm+"("+bgmNo+")", x, 150, 16, "yellow");
		fText("winW="+winW+" winH="+winH+" SCALE="+SCALE, x, 200, 16, "yellow");
		fText(main_idx+":"+main_tmr+"("+tapX+","+tapY+")"+tapC, x, 250, 16, "cyan");
		fText("加速度 "+acX + " : " + acY + " : " + acZ, x, 300, 16, "pink");
		for(i = 0; i < 256; i++) {
			x = i%16;
			y = int(i/16);
			fText(key[i], 15+30*x, 15+30*y, 12, "white");
		}
	}

	setTimeout("wwsSysMain()", int(1000/FPS)-ptime);
}

// ---------- 起動処理 ----------
//window.onload = function() {}

window.addEventListener("load", wwsSysInit);

function wwsSysInit() {

	initCanvas();

	if( NUA.indexOf('Android') > 0 ) {
		deviceType = PT_Android;
	}
	else if( NUA.indexOf('iPhone') > 0 || NUA.indexOf('iPod') > 0 || NUA.indexOf('iPad') > 0 ) {
		deviceType = PT_iOS;
		window.scrollTo(0,1);//iPhoneのURLバーを消す位置に
	}
	else if( NUA.indexOf('Silk') > 0 ) {
		deviceType = PT_Kindle;
	}

	//イベントリスナー（タップ判定）
	if(supportTouch == true) {
		cvs.addEventListener("touchstart", touchStart);
		cvs.addEventListener("touchmove", touchMove);
		cvs.addEventListener("touchend", touchEnd);
		cvs.addEventListener("touchcancel", touchCancel);
	}
	else {
		cvs.addEventListener("mousedown", mouseDown);
		cvs.addEventListener("mousemove", mouseMove);
		cvs.addEventListener("mouseup", mouseUp);
		cvs.addEventListener("mouseout", mouseOut);
	}

	wwsSysMain();//リアルタイム処理を開始
}
