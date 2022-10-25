import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

var firebaseConfig = {
  apiKey: "AIzaSyD43dMGSv-0KA_qDydZJlaWvQeBLyZbEcA",
  authDomain: "biblioteca-e8390.firebaseapp.com",
  projectId: "biblioteca-e8390",
  storageBucket: "biblioteca-e8390.appspot.com",
  messagingSenderId: "1092210610354",
  appId: "1:1092210610354:web:855f7a861e292d8608f9ab",
};
firebase.initializeApp(firebaseConfig);
export default firebase.firestore();
