
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    child,
    push,
    update,
    onValue,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
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
const COL_SOLICITUDES = "solicitudes";   // pedidos de servicio y contrato de los clientes
const COL_INVENTARIO = "inventario";               // productos que hay en bodega (los gestiona el supervisor)
const COL_PEDIDOS = "pedidos_productos";           // productos que el empleado pide para un servicio
const COL_ASIGNACIONES = "asignaciones_servicio";  // servicios que el supervisor asigna a un empleado
const COL_HORARIOS = "horarios_empleados";         // horario de cada empleado (lo pone el supervisor)

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
    COL_SOLICITUDES,
    COL_INVENTARIO,
    COL_PEDIDOS,
    COL_ASIGNACIONES,
    COL_HORARIOS,
    ESTADOS_NOVEDAD,

    // Realtime Database
    ref,
    get,
    child,
    push,
    update,
    onValue,
    onDisconnect,

    // Firestore
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp
};
