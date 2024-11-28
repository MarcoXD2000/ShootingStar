//curves

//ctrlPts: array of points at least 4 points
function catmullRomSpline(ctrlPts, segments = 100, wrap = false){
    var iCtrlPtCount = ctrlPts.length;
    var curvePts = new Array();

    //catmull-roms basis matrix
    var Mcr = 
    [ -1, 3, -3, 1,
       2, -5, 4, -1,
       -1, 0, 1, 0,
       0, 2, 0, 0
    ];

    for (var i = 0; i < 16; i++) Mcr[i] /= 2;

    //not wrap
    for (var i = -1; i <= iCtrlPtCount - 3; i++) {
        var P1;
        var P2;
        var P3;
        var P4;

        if (i == -1) {
            P1 = new vec2d(ctrlPts[0].x, ctrlPts[0].y);
            P2 = new vec2d(ctrlPts[0].x, ctrlPts[0].y);
            P3 = new vec2d(ctrlPts[1].x, ctrlPts[1].y);
            P4 = new vec2d(ctrlPts[2].x, ctrlPts[2].y);
        }
        else if (i == iCtrlPtCount - 3){
            P1 = new vec2d(ctrlPts[iCtrlPtCount - 3].x, ctrlPts[iCtrlPtCount - 3].y);
            P2 = new vec2d(ctrlPts[iCtrlPtCount - 2].x, ctrlPts[iCtrlPtCount - 2].y);
            P3 = new vec2d(ctrlPts[iCtrlPtCount - 1].x, ctrlPts[iCtrlPtCount - 1].y);
            P4 = new vec2d(ctrlPts[iCtrlPtCount - 1].x, ctrlPts[iCtrlPtCount - 1].y);
        }
        else {
            P1 = new vec2d(ctrlPts[i].x, ctrlPts[i].y);
            P2 = new vec2d(ctrlPts[i + 1].x, ctrlPts[i + 1].y);
            P3 = new vec2d(ctrlPts[i + 2].x, ctrlPts[i + 2].y);
            P4 = new vec2d(ctrlPts[i + 3].x, ctrlPts[i + 3].y);
        }

        var Gb = [  P1.x, P1.y,
                    P2.x, P2.y,
                    P3.x, P3.y,
                    P4.x, P4.y,
                ];

        for (var j = 0; j <= segments; j++){
            var t = j / segments;
            var t2 = t**2;
            var t3 = t**3;
            var Bb = [  (t3 * Mcr[0] + t2 * Mcr[4] + t * Mcr[8] + 1 * Mcr[12]),
                        (t3 * Mcr[1] + t2 * Mcr[5] + t * Mcr[9] + 1 * Mcr[13]),
                        (t3 * Mcr[2] + t2 * Mcr[6] + t * Mcr[10] + 1 * Mcr[14]),
                        (t3 * Mcr[3] + t2 * Mcr[7] + t * Mcr[11] + 1 * Mcr[15]) ];

            var Q = [   (Bb[0] * Gb[0] + Bb[1] * Gb[2] + Bb[2] * Gb[4] + Bb[3] * Gb[6]),
                        (Bb[0] * Gb[1] + Bb[1] * Gb[3] + Bb[2] * Gb[5] + Bb[3] * Gb[7]) ];

            var x = Q[0];
            var y = Q[1];

            var pt = new vec2d(x,y);

            curvePts.push(pt);
        }
    }


    return curvePts;
}

function drawCurve(curvePts, col){
    var segments = curvePts.length - 1;

    for (var i = 0; i < segments; i++){
        var P1x = curvePts[i].x;
        var P1y = curvePts[i].y;
        var P2x = curvePts[i+1].x;
        var P2y = curvePts[i+1].y;
        line(P1x, P1y, P2x, P2y, col);
    }
}