// =====================================================
// FIREBASE - CONFIGURACIÓN ÚNICA PARA TODO EL PROYECTO
// =====================================================
// Todas las páginas importan desde aquí. Así hay una sola
// configuración y una sola versión del SDK.
//
//  - Realtime Database  -> usuarios / login (ya existente)
//  - Cloud Firestore    -> novedades laborales, incapacidades
//                          y notificaciones
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    child,
    update,
    onValue,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDTujbcDDXo3N2a-L5p4cEUXD-8llmtD_A",
    authDomain: "sitio-web-acso.firebaseapp.com",
    databaseURL: "https://sitio-web-acso-default-rtdb.firebaseio.com",
    projectId: "sitio-web-acso",
    storageBucket: "sitio-web-acso.firebasestorage.app",
    messagingSenderId: "916869190856",
    appId: "1:916869190856:web:13b6a0f9926139c8f481fd",
    measurementId: "G-3CFS0H850L"
};

const app = initializeApp(firebaseConfig);

// Realtime Database (usuarios)
const rtdb = getDatabase(app);

// Cloud Firestore (novedades / incapacidades / notificaciones)
const db = getFirestore(app);

// Nombres de las colecciones de Firestore
const COL_NOVEDADES = "novedades_laborales";
const COL_NOTIFICACIONES = "notificaciones";

// Estados que puede tener una novedad
const ESTADOS_NOVEDAD = [
    "Pendiente",
    "Visto",
    "En revisión",
    "Aprobada",
    "Rechazada"
];

export {
    app,
    rtdb,
    db,
    COL_NOVEDADES,
    COL_NOTIFICACIONES,
    ESTADOS_NOVEDAD,

    // Realtime Database
    ref,
    get,
    child,
    update,
    onValue,
    onDisconnect,

    // Firestore
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp
};
