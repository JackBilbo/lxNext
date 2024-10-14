
export var selectedUnit: string = 'metric';
export var simUnits: number = 0;

export function setSimUnits(unit: number) {
  simUnits = unit;
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
  'speed': [{simunit: 'knots', label: 'kts'}, {simunit: 'kph', label: 'km/h'}, {simunit: 'kph', label: 'km/h'}],
  'altitude': [{simunit: 'ft', label: 'ft'}, {simunit: 'ft', label: 'ft'}, {simunit: 'm', label: 'm'}],
  'verticalspeed': [{simunit: 'knots', label: 'kts'}, {simunit: 'feet/second', label: 'ft/s'}, {simunit: 'm/s', label: 'm/s'}],
  'windspeed': [{simunit: 'knots', label: 'kts'}, {simunit: 'feet/second', label: 'ft/s'}, {simunit: 'm/s', label: 'm/s'}],
  'time':  [{simunit: 'seconds', label: ''}, {simunit: 'seconds', label: ''}, {simunit: 'seconds', label: ''}],
  'angle':  [{simunit: 'degrees', label: 'deg'}, {simunit: 'degrees', label: 'deg'}, {simunit: 'degrees', label: 'deg'}],
  'positionlat':  [{simunit: 'degrees latitude', label: 'deg'}, {simunit: 'degrees', label: 'deg'}, {simunit: 'degrees', label: 'deg'}],
  'positionlong':  [{simunit: 'degrees longitude', label: 'deg'}, {simunit: 'degrees', label: 'deg'}, {simunit: 'degrees', label: 'deg'}],
}

export const vars: Variable[] = [
  { name: 'ias', unittype: 'speed', simvar: 'AIRSPEED INDICATED', shortlabel: 'IAS', label: 'Indicated Airspeed', precision: 0, value: 0, family: 'ac' },
  { name: 'alt_agl', unittype: 'altitude', simvar: 'PLANE ALT ABOVE GROUND', shortlabel: 'ALT AGL', label: 'Altitude Above Ground', precision: 0, value: 0, family: 'ac' },
  { name: 'alt', unittype: 'altitude', simvar: 'INDICATED ALTITUDE', shortlabel: 'ALT', label: 'Indicated Altitude', precision: 0, value: 0, family: 'ac' },
  { name: 'maccready', unittype: 'verticalspeed', simvar: 'VARIOMETER MAC CREADY SETTING', shortlabel: 'MC', label: 'Mac Cready Setting', precision: 1, value: 0, family: 'ac' },
  { name: 'totalenergy', unittype: 'verticalspeed', simvar: 'L:LXN_TE', shortlabel: 'TE', label: 'Totel Energy', precision: 1, value: 0, family: 'ac' },  
  { name: 'heading', unittype: 'angle', simvar: 'PLANE HEADING DEGREES TRUE', shortlabel: 'HDG', label: 'Aircraft Heading', precision: 0, value: 0, family: 'ac' },
  { name: 'groundtrack', unittype: 'angle', simvar: 'GPS GROUND TRUE TRACK', shortlabel: 'TRK', label: 'Ground Track', precision: 0, value: 0, family: 'ac' },
  { name: 'planelat', unittype: 'positionlat', simvar: 'A:PLANE LATITUDE', shortlabel: 'LAT', label: 'Aircraft Latitude', precision: 0, value: 53, family: 'none' },
  { name: 'planelong', unittype: 'positionlong', simvar: 'A:PLANE LONGITUDE', shortlabel: 'LONG', label: 'Aircraft Longitude', precision: 0, value: 10, family: 'none' },
  { name: 'winddirection', unittype: 'angle', simvar: 'A:AMBIENT WIND DIRECTION', shortlabel: 'WIND', label: 'Wind Direction', precision: 0, value: 0, family: 'wind' },
  { name: 'windspeed', unittype: 'windspeed', simvar: 'A:AMBIENT WIND VELOCITY', shortlabel: 'WINDSPEED', label: 'Wind Speed', precision: 1, value: 0, family: 'wind' },
  { name: 'verticalwind', unittype: 'verticalspeed', simvar: 'A:AMBIENT WIND Y', shortlabel: 'V. WIND', label: 'Vertical Wind Speed', precision: 0, value: 0, family: 'wind' },
  { name: 'simtime', unittype: 'time', simvar: 'E:SIMULATION TIME', shortlabel: 'SIMTIME', label: 'Simulation Time', precision: 0, value: 0, family: 'timer' },
  { name: 'simtime', unittype: 'time', simvar: 'E:LOCAL TIME', shortlabel: 'LOCAL', label: 'Local Time', precision: 0, value: 0, family: 'timer' }
]

export const varfamilies = [
  { name: 'ac', label: 'Aircraft'},
  { name: 'wind', label: 'Wind'},
  { name: 'waypoint', label: 'Current Waypoint'},
  { name: 'task', label: 'Task'},
  { name: 'timer', label: 'Timer'},
  { name: 'none', label: 'none'},
]

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
    planelat: number;
    planelong: number;
    altitude: number;
    totalenergy: number;
  }