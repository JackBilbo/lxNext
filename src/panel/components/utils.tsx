export const checkSimVarLoaded: Promise<boolean> = new Promise(resolve => {
    const interval = setInterval(() => {
        if (window.SimVar !== undefined) {
            clearInterval(interval);
            resolve(true);
        }
    });
});