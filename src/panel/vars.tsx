
export var selectedUnit: string = 'metric';
export var simUnits: number = 0;

export function setSimUnits(unit: number) {
  simUnits = unit;
}

export const earthradius: {[key: string]: number} = {
  'km': 6371,
  'nmiles': 6371 / 1.852,
  'ft': 6371 * 3.28084,
  'm': 6371 * 1000
}

export interface Variable {
  name: string;
  unittype: string;
  simvar: string;
  shortlabel: string;
  label: string;
  precision: number;
  value: number | string;
  family: string;
}

interface UnitVariables {
  [key: string]: [{simunit: string, label: string},{simunit: string, label: string},{simunit: string, label: string}];
}

export const Units: UnitVariables = {
  'distance': [{simunit: 'nmiles', label: 'NM'}, {simunit: 'km', label: 'km'}, {simunit: 'km', label: 'km'}],
  'speed': [{simunit: 'knots', label: 'kts'}, {simunit: 'kph', label: 'km/h'}, {simunit: 'kph', label: 'km/h'}],
  'altitude': [{simunit: 'ft', label: 'ft'}, {simunit: 'ft', label: 'ft'}, {simunit: 'm', label: 'm'}],
  'verticalspeed': [{simunit: 'knots', label: 'kts'}, {simunit: 'feet/second', label: 'ft/s'}, {simunit: 'm/s', label: 'm/s'}],
  'windspeed': [{simunit: 'knots', label: 'kts'}, {simunit: 'feet/second', label: 'ft/s'}, {simunit: 'm/s', label: 'm/s'}],
  'time':  [{simunit: 'seconds', label: ''}, {simunit: 'seconds', label: ''}, {simunit: 'seconds', label: ''}],
  'angle':  [{simunit: 'degrees', label: 'deg'}, {simunit: 'degrees', label: 'deg'}, {simunit: 'degrees', label: 'deg'}],
  'positionlat':  [{simunit: 'degrees latitude', label: 'deg'}, {simunit: 'degrees', label: 'deg'}, {simunit: 'degrees', label: 'deg'}],
  'positionlong':  [{simunit: 'degrees longitude', label: 'deg'}, {simunit: 'degrees', label: 'deg'}, {simunit: 'degrees', label: 'deg'}],
  'weight':  [{simunit: 'lbs', label: 'lbs'}, {simunit: 'lbs', label: 'lbs'}, {simunit: 'kb', label: 'kg'}],
}

export const vars: Variable[] = [
  { name: 'ias', unittype: 'speed', simvar: 'AIRSPEED INDICATED', shortlabel: 'IAS', label: 'Indicated Airspeed', precision: 0, value: 0, family: 'ac' },
  { name: 'alt_agl', unittype: 'altitude', simvar: 'PLANE ALT ABOVE GROUND', shortlabel: 'ALT AGL', label: 'Altitude Above Ground', precision: 0, value: 0, family: 'ac' },
  { name: 'alt', unittype: 'altitude', simvar: 'PLANE ALTITUDE', shortlabel: 'ALT', label: 'Indicated Altitude', precision: 0, value: 0, family: 'ac' },
  { name: 'maccready', unittype: 'verticalspeed', simvar: 'VARIOMETER MAC CREADY SETTING', shortlabel: 'MC', label: 'Mac Cready Setting', precision: 1, value: 0, family: 'ac' },
  { name: 'totalenergy', unittype: 'verticalspeed', simvar: 'L:LXN_TE', shortlabel: 'TE', label: 'Totel Energy', precision: 1, value: 0, family: 'ac' },  
  { name: 'heading', unittype: 'angle', simvar: 'PLANE HEADING DEGREES TRUE', shortlabel: 'HDG', label: 'Aircraft Heading', precision: 0, value: 0, family: 'ac' },
  { name: 'groundtrack', unittype: 'angle', simvar: 'GPS GROUND TRUE TRACK', shortlabel: 'TRK', label: 'Ground Track', precision: 0, value: 0, family: 'ac' },
  { name: 'groundspeed', unittype: 'speed', simvar: 'A:GPS GROUND SPEED', shortlabel: 'GND SPD', label: 'Ground Speed', precision: 0, value: 0, family: 'ac' },
  { name: 'stf', unittype: 'speed', simvar: 'L:LXN_STF', shortlabel: 'STF', label: 'Speed to Fly', precision: 0, value: 0, family: 'ac' },
  { name: 'planelat', unittype: 'positionlat', simvar: 'A:PLANE LATITUDE', shortlabel: 'LAT', label: 'Aircraft Latitude', precision: 0, value: 53, family: 'none' },
  { name: 'planelong', unittype: 'positionlong', simvar: 'A:PLANE LONGITUDE', shortlabel: 'LONG', label: 'Aircraft Longitude', precision: 0, value: 10, family: 'none' },
  { name: 'winddirection', unittype: 'angle', simvar: 'A:AMBIENT WIND DIRECTION', shortlabel: 'WIND', label: 'Wind Direction', precision: 0, value: 0, family: 'wind' },
  { name: 'windspeed', unittype: 'windspeed', simvar: 'A:AMBIENT WIND VELOCITY', shortlabel: 'WINDSPEED', label: 'Wind Speed', precision: 1, value: 0, family: 'wind' },
  { name: 'verticalwind', unittype: 'verticalspeed', simvar: 'A:AMBIENT WIND Y', shortlabel: 'V. WIND', label: 'Vertical Wind Speed', precision: 1, value: 0, family: 'wind' },
  { name: 'simtime', unittype: 'time', simvar: 'E:SIMULATION TIME', shortlabel: 'SIMTIME', label: 'Simulation Time', precision: 0, value: 0, family: 'timer' },
  { name: 'localtime', unittype: 'time', simvar: 'E:LOCAL TIME', shortlabel: 'LOCAL', label: 'Local Time', precision: 0, value: 0, family: 'timer' },
  { name: 'tasktime', unittype: 'time', simvar: 'L:LXN_TASKTIME', shortlabel: 'TASK TIME', label: 'Task Time', precision: 0, value: 0, family: 'timer' },
  { name: 'wp_dist', unittype: 'distance', simvar: 'L:LXN_WP_DIST', shortlabel: 'WP DIST', label: 'Current Waypoint Distance', precision: 0, value: 0, family: 'waypoint' },
  { name: 'wp_heading', unittype: 'angle', simvar: 'L:LXN_WP_HEADING', shortlabel: 'WP HDG', label: 'Current Waypoint Heading', precision: 0, value: 0, family: 'waypoint' },
  { name: 'wp_arrival_height', unittype: 'altitude', simvar: 'L:LXN_WP_ARRIVAL_HEIGHT', shortlabel: 'WP ARR MSL', label: 'Estimated Arrival Height MSL', precision: 0, value: 0, family: 'waypoint' },
  { name: 'wp_arrival_height_agl', unittype: 'altitude', simvar: 'L:LXN_WP_ARRIVAL_HEIGHT_AGL', shortlabel: 'WP ARR AGL', label: 'Estimated Arrival Height above Ground/WP Min', precision: 0, value: 0, family: 'waypoint' },
  { name: 'wp_ete', unittype: 'time', simvar: 'L:LXN_WP_ETE', shortlabel: 'WP ETE', label: 'Estimated Time to fly to Waypoint', precision: 0, value: 0, family: 'waypoint' },
]

export const staticvars:{[key: string]: number|string} = {}

export const varfamilies = [
  { name: 'ac', label: 'Aircraft'},
  { name: 'wind', label: 'Wind'},
  { name: 'waypoint', label: 'Current Waypoint'},
  { name: 'task', label: 'Task'},
  { name: 'timer', label: 'Timer'},
  { name: 'none', label: 'none'},
]

export const colors = {
    activeleg: '#C60AC6',
    flightplanleg: '#ffcc00',
    validwaypoint: '#00cc00',
    missedwaypoint: '#cc0000',
}

export interface FSEvents {
    ias: number;
    alt_agl: number;
    maccready: number;
    groundspeed: number;
    masterunits: any;
    simUnits: number;
    heading: number;
    winddirection: number;
    windspeed: number;
    verticalwind: number;
    time: string;
    simtime: number;
    planelat: number;
    planelong: number;
    altitude: number;
    totalenergy: number;
    wp_dist: number;
  }

  export const aircraft = [
    {
        name: "Gotfriends Discus 2C FES",
        atc_model: "$$:Discus-2c FES",
        minimum_sink: {
            speed_kts: 43,
            sink_kts: -1.17
        },
        best_glide: {
            speed_kts: 59,
            sink_kts: -1.29
        },
        fast: {
            speed_kts: 92,
            sink_kts: -4.04
        },
        reference_weight_lbs: 921
    },
    {
        name: "Gotfriends Discus 2C",
        atc_model: "$$:Discus-2c",
        minimum_sink: {
            speed_kts: 43,
            sink_kts: -1.17
        },
        best_glide: {
            speed_kts: 59,
            sink_kts: -1.29
        },
        fast: {
            speed_kts: 92,
            sink_kts: -4.04
        },
        reference_weight_lbs: 765
    },
    {
        name: "Touchingcloud DG808S",
        atc_model: "808S",
        minimum_sink: {
            speed_kts: 48,
            sink_kts: -0.83585
        },
        best_glide: {
            speed_kts: 57,
            sink_kts: -0.9136
        },
        fast: {
            speed_kts: 92,
            sink_kts: -1.94384
        },
        reference_weight_lbs: 773
    },
    {
        name: "Asobo LS 8",
        atc_model: "LS8_18",
        minimum_sink: {
            speed_kts: 40.5,
            sink_kts: -0.97192
        },
        best_glide: {
            speed_kts: 50.21,
            sink_kts: -0.9816392
        },
        fast: {
            speed_kts: 108,
            sink_kts: -5.928712
        },
        reference_weight_lbs: 770
    },
    {
        name: "Asobo DG1001E Neo",
        atc_model: "DG 1001 e Neo",
        minimum_sink: {
            speed_kts: 55.615571,
            sink_kts: -1.2440576
        },
        best_glide: {
            speed_kts: 63.714,
            sink_kts: -1.3412495
        },
        fast: {
            speed_kts: 108,
            sink_kts: -4.8790384
        },
        reference_weight_lbs: 1501
    },
    {
        name: "Madolo/B21 AS33",
        atc_model: "AS-33me",
        minimum_sink: {
            speed_kts: 49,
            sink_kts: -0.9136048
        },
        best_glide: {
            speed_kts: 59,
            sink_kts: -1.0885504
        },
        fast: {
            speed_kts: 113,
            sink_kts: -4.082064
        },
        reference_weight_lbs: 843
    },
    {
        name: "GlideSimmer K7",
        atc_model: "K7",
        minimum_sink: {
            speed_kts: 34.02,
            sink_kts: -1.5462
        },
        best_glide: {
            speed_kts: 48.59611,
            sink_kts: -1.869
        },
        fast: {
            speed_kts: 81,
            sink_kts: -6.23
        },
        reference_weight_lbs: 818
    },
    {
        name: "Madolo/B21 LS4",
        atc_model: "LS4",
        minimum_sink: {
            speed_kts: 43.2,
            sink_kts: -1.222
        },
        best_glide: {
            speed_kts: 54,
            sink_kts: -1.349
        },
        fast: {
            speed_kts: 108,
            sink_kts: -5.9676
        },
        reference_weight_lbs: 782
    },
    {
        name: "ASW 28 LeNinjaHD/KiloDelta",
        atc_model: "ASW-28",
        minimum_sink: {
            speed_kts: 40.49,
            sink_kts: -1.1
        },
        best_glide: {
            speed_kts: 52.37,
            sink_kts: -1.247
        },
        fast: {
            speed_kts: 108,
            sink_kts: -5.734
        },
        reference_weight_lbs: 716
    },
    {
        name: "JS3 18m",
        atc_model: "JS3-18",
        minimum_sink: {
            speed_kts: 43.2,
            sink_kts: -0.8942
        },
        best_glide: {
            speed_kts: 54,
            sink_kts: -0.9913
        },
        fast: {
            speed_kts: 113.4,
            sink_kts: -4.2764
        },
        reference_weight_lbs: 835
    },
    {
        name: "JS3 15m",
        atc_model: "JS3-15",
        minimum_sink: {
            speed_kts: 43.2,
            sink_kts: -1.03
        },
        best_glide: {
            speed_kts: 54,
            sink_kts: -1.1468
        },
        fast: {
            speed_kts: 113.4,
            sink_kts: -4.49
        },
        reference_weight_lbs: 824
    },
    {
        name: "Schweizer SGS 2-33A (Alpha)",
        atc_model: "SGS-233A",
        minimum_sink: {
            speed_kts: 33.02,
            sink_kts: -1.618
        },
        best_glide: {
            speed_kts: 39.1,
            sink_kts: -1.677
        },
        fast: {
            speed_kts: 73.8,
            sink_kts: -7.4
        },
        reference_weight_lbs: 782
    },
    {
        name: "Yanosik SZD 30 Pirat",
        atc_model: "PIRAT",
        minimum_sink: {
            speed_kts: 40.5,
            sink_kts: -1.36
        },
        best_glide: {
            speed_kts: 44.81,
            sink_kts: -1.438 
        },
        fast: {
            speed_kts: 81,
            sink_kts: -4.781
        },
        reference_weight_lbs: 750
    },
    {
        name: "F7 Simulations ASK 21",
        atc_model: "K21",
        minimum_sink: {
            speed_kts: 44,
            sink_kts: -1.43
        },
        best_glide: {
            speed_kts: 48,
            sink_kts: -1.454 
        },
        fast: {
            speed_kts: 80,
            sink_kts: -3.59
        },
        reference_weight_lbs: 1186
    }
]