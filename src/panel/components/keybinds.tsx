import {EventBus, KeyEvents, KeyEventManager } from '@microsoft/msfs-sdk';
import { Navmap, toggleMap } from './interface';

export class Keybinds {
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {        
        this.eventBus = eventBus;
    }

    async listen() {
        const bus = new EventBus();
        
        const manager = await KeyEventManager.getManager(bus);
        console.log("Keybinders listening");
        manager.interceptKey('PLUS', true);
        manager.interceptKey('MINUS', true);
        manager.interceptKey('FLIGHT_MAP', false);

        manager.interceptKey('MAC_CREADY_SETTING_DEC', true);
        manager.interceptKey('MAC_CREADY_SETTING_INC', true);

        console.log(manager);
        const subscriber = bus.getSubscriber<KeyEvents>();
        subscriber.on('key_intercept').handle(keyData => {
            console.log(keyData.key);
            switch (keyData.key) {
                case 'FLIGHT_MAP':
                    toggleMap();
                break;
                case 'PLUS':
                    Navmap!.zoomIn();
                break;
                case 'MINUS':
                    Navmap!.zoomOut();
                break;
            }
        });
    }
}