interface StringDictionary {
    [key: string]: any;
  }

export const Units: StringDictionary = {
    'speed': {'pref': 'kph', 'imperial': 'kts', 'metric': 'kph', 'options': ['kts', 'mph', 'kph'], 'label': 'Speed'},
    'altitude': {'pref': 'm', 'imperial': 'ft', 'metric': 'm', 'options': ['ft', 'm'], 'label': 'Altitude'}
}

export interface FSEvents {
    indicated_airspeed: number;
    altitude: number;
    groundspeed: number;
    masterunits: any;
  }