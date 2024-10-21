import { aircraft, staticvars } from "../vars";

const V: any = {
    te : { v: 0, h: 0, t: 0, te: 0}
};

export function updateCustomVars() {
    calcTotalEnergy();
    update_stf();
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

export var current_aircraft: any = {};
export function initAircraft() {
    const atc_model = SimVar.GetSimVarValue("ATC MODEL", "string");

    aircraft.forEach((ac) => {
        if (ac.atc_model == atc_model) {
            current_aircraft = ac;
            console.log("Aircraft found: ", ac.name);
        }
    });

    calc_polar();
}

function calc_polar() {

    let c4 = current_aircraft.minimum_sink.speed_kts;
    let d4 = current_aircraft.minimum_sink.sink_kts;

    // Speed and sink in knots at best glide
    let c5 = current_aircraft.best_glide.speed_kts;
    let d5 = current_aircraft.best_glide.sink_kts;

    // Speed and sink in knots at "fast speed" - around 92kts/170kmh
    let c6 = current_aircraft.fast.speed_kts;
    let d6 = current_aircraft.fast.sink_kts;

    let atop = (c6-c5) * (d4-d5) + (c5-c4) * (d6-d5);
    let abottom = c4 * c4 * (c6 -c5) + c6 * c6 * (c5-c4) + c5 * c5 * (c4-c6);
    current_aircraft.a = atop/abottom;

    let btop = d6 - d5 - current_aircraft.a * (c6 * c6 - c5 * c5);
    let bbottom = c6 - c5;

    current_aircraft.b = btop/bbottom;

    current_aircraft.c = d5 - current_aircraft.a * c5 * c5 - current_aircraft.b * c5;
}

function update_stf() {
    let bugs = 100;
    let totalweight: number = SimVar.GetSimVarValue("A:TOTAL WEIGHT", "lbs");
    
    let wf = Math.sqrt(totalweight / current_aircraft.reference_weight_lbs );

    let aa = current_aircraft.a / wf * 100 / bugs;
    let bb = current_aircraft.b * 100 / bugs;
    let cc = current_aircraft.c * wf * 100 / bugs;
    
    let mccready = SimVar.GetSimVarValue("VARIOMETER MAC CREADY SETTING", "knots");
   
    let stf = Math.sqrt((cc - mccready) / aa);
    let sink_stf = (aa * stf * stf) + (bb * stf) + cc

    SimVar.SetSimVarValue("L:LXN_SINK_STF", "knots", sink_stf);
    SimVar.SetSimVarValue("L:LXN_STF", "knots", stf);
    staticvars.stf_ms = stf * 0.51444;
    staticvars.sink_stf_ms = sink_stf * 0.51444;
}


export function calculateArrivalheight(distance: number, heading: number, startaltitude: number) {
    console.log(staticvars.sink_stf_ms, staticvars.stf_ms);
    const sinkRate: number = staticvars.sink_stf_ms as number; 
    const timeToFly = calculateTimeToFly(distance, heading);
  
    return startaltitude + (timeToFly * sinkRate);
  }

export function calculateTimeToFly(distance: number, heading: number) {
    const indicatedAirspeed: number = staticvars.stf_ms as number;
    const windDirection: number = staticvars.winddirection as number;
    const windSpeed: number = SimVar.GetSimVarValue("A:AMBIENT WIND VELOCITY", "m/s");
    const groundSpeed = calculateGroundSpeed(indicatedAirspeed, windSpeed, windDirection, heading);
    const timeToFly = distance / groundSpeed;
  
    return timeToFly;
  }
  
  // Helper function to calculate the ground speed
  function calculateGroundSpeed(indicatedAirspeed: number, windSpeed: number, windDirection: number, heading: number) {
    const windDirectionRad = windDirection * Math.PI / 180;
    const headingRad = heading * Math.PI / 180;
  
    const windComponent = windSpeed * Math.cos(windDirectionRad - headingRad);
    const trueAirspeed = indicatedAirspeed - windComponent;
  
    const groundSpeed = trueAirspeed * Math.cos(headingRad);
    console.log("GS: " + groundSpeed);
    return groundSpeed;
  }