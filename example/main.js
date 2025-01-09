import {
  initFirebase,
  sendData,
  verifyCode,
  receiveData,
  checkCode,
  getCurrentTimeInSeconds,
} from "firebase-realtime-sharing";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGE_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;

const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

initFirebase(firebaseConfig);
const senderBtn = document.getElementById("sender-btn");
const receiverBtn = document.getElementById("receiver-btn");
const senderBox = document.getElementById("sender");
const receiverBox = document.getElementById("receiver");
const btns = document.getElementById("btns");
const codeBox = document.getElementById("code");
const sendBtn = document.getElementById("send-btn");

// sender handle
let intervalId;
const counterBox = document.getElementById("counter");
const countdown = (seconds) => {
  if (seconds === 0) {
    handleConnected();
  } else {
    counterBox.innerText = `Mã sẽ hết hạn sau ${seconds}s`;
  }
};

senderBtn.addEventListener("click", async () => {
  senderBox.hidden = false;
  btns.hidden = true;

  // is sending
  const oldCode = await checkCode();
  if (oldCode) {
    const code = oldCode.code;
    let seconds = oldCode.expireAt - getCurrentTimeInSeconds();
    codeBox.innerText = `Enter "${code}" in receiver`;
    countdown(seconds);
    intervalId = setInterval(() => {
      seconds = seconds - 1;
      countdown(seconds);
    }, 1000);
    sendBtn.hidden = true;
    return;
  }
});

receiverBtn.addEventListener("click", () => {
  receiverBox.hidden = false;
  btns.hidden = true;
});

const handleConnected = () => {
  clearInterval(intervalId);
  counterBox.innerText = "";
  codeBox.innerText = "";
  sendBtn.hidden = false;
};

const expireTimeSeconds = 120;
const inputData = document.getElementById("inputData");
sendBtn.addEventListener("click", async () => {
  if (intervalId) clearInterval(intervalId);

  const data = inputData.value;
  let { code, seconds } = await sendData({ expireTimeSeconds, data }, handleConnected);
  codeBox.innerText = `Enter "${code}" in receiver`;
  countdown(seconds);
  intervalId = setInterval(() => {
    seconds = seconds - 1;
    countdown(seconds);
  }, 1000);
  sendBtn.hidden = true;
});

// receiver handle
const inputCode = document.getElementById("inputCode");
const verifyBtn = document.getElementById("verify");
const dataBox = document.getElementById("dataBox");

verifyBtn.addEventListener("click", async () => {
  const code = inputCode.value;
  const valid = await verifyCode(code);
  if (valid) {
    dataBox.innerText = "Receiving...";
    const data = await receiveData();
    dataBox.innerText = `data: ${data}`;
  } else {
    dataBox.innerText = "";
  }
});
