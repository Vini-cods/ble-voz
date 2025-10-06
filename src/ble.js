import { BleManager } from "react-native-ble-plx";
import { UUID_SERVICO, UUID_CARAC_COMANDO } from "./constants";
import { solicitarPermissoesBle } from "./permissions";

const gerenciador = new BleManager();

export async function escanearESelecionarUma(tempoMs = 8000) {
    await solicitarPermissoesBle();

    return new Promise((resolver) => {
        const vistos = new Map();

        gerenciador.startDeviceScan([UUID_SERVICO], { allowDuplicates: false }, (erro, dispositivo) => {
            if (erro) {
                console.warn("Erro no scan:", erro);
                return;
            }
            if (!dispositivo) return;

            const nome = (dispositivo.name || "").toLowerCase();
            if (nome.includes("esp32") || nome.includes("led")) {
                vistos.set(dispositivo.id, dispositivo);
            }
        });

        setTimeout(() => {
            gerenciador.stopDeviceScan();
            const primeiro = Array.from(vistos.values())[0];
            resolver(primeiro ? { idDispositivo: primeiro.id, nome: primeiro.name } : null);
        }, tempoMs);
    });
}

export async function conectar(idDispositivo) {
    const disp = await gerenciador.connectToDevice(idDispositivo, { timeout: 8000 });
    await disp.discoverAllServicesAndCharacteristics();
    return disp;
}

export async function escreverComando(idDispositivo, dadoBase64) {
    let disp = (await gerenciador.devices([idDispositivo]))?.[0];
    if (!disp) disp = await gerenciador.connectToDevice(idDispositivo);
    await disp.discoverAllServicesAndCharacteristics();
    await disp.writeCharacteristicWithoutResponseForService(
        UUID_SERVICO,
        UUID_CARAC_COMANDO,
        dadoBase64
    );
}
