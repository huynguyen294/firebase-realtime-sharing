# Firebase Realtime Sharing

This just simple way to help your application can sharing data together. When user click send, it will generate a code and then in the receiving device just need enter the code to get data.

# Get started

## Create realtime database

- follow firebase document https://firebase.google.com/docs/database
- then copy the database config

## Init database

```
import { initFirebase } from "firebase-realtime-sharing";

const apiKey = "your-config";
const authDomain = "your-config";
const projectId = "your-config";
const storageBucket = "your-config";
const messagingSenderId = "your-config";
const appId = "your-config";
const measurementId = "your-config";
const databaseURL = "your-config";

const firebaseConfig = { apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId, measurementId };

initFirebase(firebaseConfig);
```

## When send button clicked!

```
import { sendData, checkCode, getCurrentTimeInSeconds } from "firebase-realtime-sharing";

// check if already sent, calc remaining expiration time
const oldCode = await checkCode();
if (oldCode) {
    const code = oldCode.code;
    const seconds = oldCode.expireAt - getCurrentTimeInSeconds();
    return
}

// do send
const handleConnected = () => {} \\ do something when receiver connected
const expireTimeSeconds = 300 \\ expire in 300 seconds
let { code, seconds } = await sendData({ expireTimeSeconds, data }, handleConnected);
// other sendData options:
// codeGeneratorOptions: { limit: 6, randomFn: Math.random, numeric: true, upper: true, lower: true } is default
// codeGenerator: you can also put the custom codeGenerator

// now display the code and expiration time
```

## At the receiving device

```
import { verifyCode, receiveData } from "firebase-realtime-sharing";
const valid = await verifyCode(code);
if (valid) {
    // if valid, now you can waiting for the data
    const data = await receiveData();
}
```

# Run example

- To run example: clone github repo and then "yarn dev"
