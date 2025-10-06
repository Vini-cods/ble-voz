import { PermissionsAndroid, Platform } from "react-native";

// BLE no Android 12+ usa permissões específicas; abaixo cuidamos de 10–15
export async function solicitarPermissoesBle() {
    if (Platform.OS !== "android") return true;

    const isS31Plus = Platform.Version >= 31;
    const lista = isS31Plus
        ? [
            "android.permission.BLUETOOTH_SCAN",
            "android.permission.BLUETOOTH_CONNECT",
            // "android.permission.BLUETOOTH_ADVERTISE", // se for anunciar
        ]
        : ["android.permission.ACCESS_FINE_LOCATION"]; // < Android 12

    const res = await PermissionsAndroid.requestMultiple(lista);
    const negada = Object.values(res).some(
        (v) => v !== PermissionsAndroid.RESULTS.GRANTED
    );
    if (negada) throw new Error("Permissões de Bluetooth não concedidas");
    return true;
}

export async function solicitarPermissaoMicrofone() {
    if (Platform.OS !== "android") return true;
    const res = await PermissionsAndroid.request(
        "android.permission.RECORD_AUDIO"
    );
    if (res !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error("Permissão de microfone não concedida");
    }
    return true;
}