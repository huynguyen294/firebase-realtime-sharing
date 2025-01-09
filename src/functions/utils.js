import { initFirebase } from ".";
import { get, getDatabase, onValue, push, ref, remove, set } from "firebase/database";

const sample = (d = [], fn = Math.random) => {
  if (d.length === 0) return;
  return d[Math.round(fn() * (d.length - 1))];
};

const generateUid = ({ limit, randomFn, numeric, upper, lower }) => {
  const allowed = [];
  if (numeric) allowed.push("0123456789");
  if (upper) allowed.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if (lower) allowed.push("abcdefghijklmnopqrstuvwxyz");
  if (!numeric && !upper && !lower)
    throw new Error(
      "Sample error! At least one of the following is required: a numeric character, an uppercase letter, or a lowercase letter."
    );
  const allowedChars = allowed.join("");
  const arr = [sample(allowedLetters, randomFn)];
  for (let i = 0; i < limit - 1; i++) {
    arr.push(sample(allowedChars, randomFn));
  }

  return arr.join("");
};

const getCurrentTimeInSeconds = () => Math.floor(Date.now() / 1000);
let EXPIRE_TIME_SECONDS = 300;

const getFBUid = () => {
  const db = getDatabase(initFirebase());
  let uid = localStorage.getItem("fb-uid");
  if (!uid) {
    uid = push(ref(db)).key;
    localStorage.setItem("fb-uid", uid);
  }
  return uid;
};

const deleteById = async (id) => {
  const db = getDatabase(initFirebase());
  const newDocRef = ref(db, id);
  await remove(newDocRef);
};

const deleteCode = async (code) => deleteById(`otps/${code}`);

const checkCode = async (uid) => {
  const db = getDatabase(initFirebase());
  if (!uid) uid = localStorage.getItem("fb-uid");
  const dbRef = ref(db, `otps`);
  const snapshot = await get(dbRef);
  if (!snapshot.exists()) return;

  let found;
  const codesObj = snapshot.val();
  Object.keys(codesObj).forEach((code) => {
    const currentTime = getCurrentTimeInSeconds();
    if (codesObj[code].expireAt < currentTime) deleteById(`otps/${code}`);
    if (codesObj[code].uid === uid && codesObj[code].expireAt >= currentTime) found = { code, ...codesObj[code] };
  });

  if (!found) deleteById(uid);

  return found;
};

const send = async (data) => {
  const db = getDatabase(initFirebase());
  let firebaseUid = localStorage.getItem("fb-uid");
  await set(ref(db, `${firebaseUid}`), data);
};

// if sent return old code and seconds, else return created code and default seconds
const defaultCodeGeneratorOptions = {
  limit: 6,
  randomFn: Math.random,
  numeric: true,
  upper: true,
  lower: true,
};
const sendData = async (
  {
    data,
    expireTimeSeconds = EXPIRE_TIME_SECONDS,
    codeGeneratorOptions = defaultCodeGeneratorOptions,
    codeGenerator = generateUid,
  },
  onConnected = () => {}
) => {
  const db = getDatabase(initFirebase());
  const uid = getFBUid();

  let code = codeGenerator(codeGeneratorOptions).toUpperCase();
  let dbRef = ref(db, `otps/${code}`);

  let seconds = expireTimeSeconds;
  const oldCode = await checkCode(uid);
  if (oldCode) {
    code = oldCode.code;
    seconds = oldCode.expireAt - getCurrentTimeInSeconds();
    dbRef = ref(db, `otps/${oldCode.code}`);
  } else {
    await set(dbRef, { expireAt: getCurrentTimeInSeconds() + expireTimeSeconds, connected: false, uid });
  }

  const unsubscribe = onValue(dbRef, (snapshot) => {
    if (snapshot.exists() && snapshot.val().connected) {
      send(data);
      unsubscribe();
      onConnected();
      deleteById(`otps/${code}`);
    }
  });

  return { code, seconds };
};

let sentUid;
const receiveData = () =>
  new Promise((resolve, reject) => {
    const db = getDatabase(initFirebase());
    if (!sentUid) reject({ ok: false, message: "Not connected yet!" });
    const unsubscribe = onValue(ref(db, sentUid), (dataSnapshot) => {
      if (dataSnapshot.exists()) {
        unsubscribe();
        localStorage.setItem("fb-uid", sentUid);
        resolve(dataSnapshot.val());
        deleteById(sentUid);
      }
    });
  });

const verifyCode = async (code) => {
  const db = getDatabase(initFirebase());
  const dbRef = ref(db, `otps/${code}`);
  const snapshot = await get(dbRef);
  if (snapshot.exists()) {
    const valid = snapshot.val().expireAt >= getCurrentTimeInSeconds();
    if (!valid) return false;

    //connected
    await set(dbRef, { ...snapshot.val(), connected: true });
    sentUid = `${snapshot.val().uid}`;
    return true;
  } else {
    return false;
  }
};

export { sendData, verifyCode, receiveData, deleteCode, checkCode, getCurrentTimeInSeconds };
