type Listener = () => void;

let listeners: Listener[] = [];

export function onUnauthorized(
    listener: Listener
) {
    listeners.push(listener);

    return () => {
        listeners = listeners.filter(
            l => l !== listener
        );
    };
}

export function emitUnauthorized() {

    listeners.forEach(
        listener => listener()
    );

}