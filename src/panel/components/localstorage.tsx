

export async function localStorageSet(key: string, value: string) { 
    return new Promise((resolve, reject) => {
        resolve(SetStoredData(key, value));
    })
}

export async function localStorageGet(key: string) { 
    return new Promise((resolve, reject) => {
        resolve(GetStoredData<string>(key));
    })
}