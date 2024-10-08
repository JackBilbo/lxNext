

const V: any = {
    te : { v: 0, h: 0, t: 0, te: 0}
};

export function updateCustomVars() {
    calcTotalEnergy();
}

function calcTotalEnergy() {
    let now = new Date().getTime();
    let h = SimVar.GetSimVarValue("A:INDICATED ALTITUDE", "m");
    let v = SimVar.GetSimVarValue("A:AIRSPEED TRUE", "m/s"); 
    let t = (now - V.te.t) / 1000;
    let m = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg");

    // let te = ( (h - V.te.h) + (Math.pow(v,2) - Math.pow(V.te.v,2)) / (2 * 9.81) )  / t;
    let te = (h - V.te.h) / t + m * (Math.pow(v,2) - Math.pow(V.te.v,2))/(2 * t * m * 9.81);

    V.te.te = ((isNaN(V.te.te) ? te : V.te.te )* 0.9) + (te * 0.1);
    
    V.te.h = h;
    V.te.v = v;
    V.te.t = now;

    SimVar.SetSimVarValue("L:LXN_TE", "m/s", V.te.te);
}