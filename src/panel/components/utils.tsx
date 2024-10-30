import { simUnits, Units } from "../vars";

export const checkSimVarLoaded: Promise<boolean> = new Promise(resolve => {
    const interval = setInterval(() => {
        if (window.SimVar !== undefined) {
            clearInterval(interval);
            resolve(true);
        }
    });
});

export function pref(unittype: string, unit: 'm' | 'ft' | 'km' | 'nmiles', v: number): number {
    if(unit == Units[unittype][simUnits].simunit) {
        return v;
    } else {
        return v * factors[unit][Units[unittype][simUnits].simunit];
    }
}

const factors: {[key: string]: {[key: string]: number}} = {
    m: {
        ft: 3.28084,
        m: 1,
        km: 0.001
    },
    ft: {
        ft: 1,
        m: 0.3048,
        km: 0.0003048
    },
    km: {
        ft: 3280.84,
        m: 1000,
        km: 1,
        nmiles: 0.539957
    },
    nmiles: {
        ft: 5280,
        m: 1852,
        km: 1.852
    }   
}