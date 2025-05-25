import { EventBus, type ResponsePacket } from "vuepkg";

interface AppEvent {
    websocketMessage: ResponsePacket<unknown>;
}

let appBus: EventBus<AppEvent> | null = null;

export const useAppEventBus = () => {
    if (!appBus) {
        appBus = new EventBus<AppEvent>("appbus");
    }
    return appBus;
};
