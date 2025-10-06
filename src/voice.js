import Voice from "@react-native-voice/voice";
import { NativeModules, NativeEventEmitter } from "react-native";
import { solicitarPermissaoMicrofone } from "./permissions";
import { ALIAS_VOZ } from "./constants";

// Estado interno
let ouvindo = false;
let melhorTexto = "";
let assinaturas = [];

// Utilidades
function garantirModuloNativo() {
    if (!NativeModules?.Voice) {
        throw new Error(
            "@react-native-voice/voice indisponível. Abra o Dev Client recém-compilado."
        );
    }
}
function adicionarAssinaturas(mapa) {
    const emissor = new NativeEventEmitter(NativeModules.Voice);
    const subs = [];
    if (mapa.parcial) subs.push(emissor.addListener("onSpeechPartialResults", mapa.parcial));
    if (mapa.resultado) subs.push(emissor.addListener("onSpeechResults", mapa.resultado));
    if (mapa.erro) subs.push(emissor.addListener("onSpeechError", mapa.erro));
    if (mapa.fim) subs.push(emissor.addListener("onSpeechEnd", mapa.fim));
    assinaturas = subs;
}
function limparAssinaturas() {
    assinaturas.forEach((s) => { try { s?.remove?.(); } catch { } });
    assinaturas = [];
}
async function pararEDestruir() {
    try { await Voice.stop(); } catch { }
    try { await Voice.destroy(); } catch { }
    try { Voice.removeAllListeners?.(); } catch { }
}

// Normalização e interpretação
function normalizar(s = "") {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^\p{Letter}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}
export function interpretarIntencao(texto) {
    const t = normalizar(texto);
    const tem = (arr) => arr.some((a) => t.includes(normalizar(a)));
    if (tem(ALIAS_VOZ.ligar)) return "ligar";
    if (tem(ALIAS_VOZ.desligar)) return "desligar";
    return null;
}

// API press-and-hold
export async function iniciarSegurarFala(onAtualizar, { idioma = "pt-BR" } = {}) {
    if (ouvindo) return;
    await solicitarPermissaoMicrofone();
    garantirModuloNativo();

    melhorTexto = "";
    await pararEDestruir();

    adicionarAssinaturas({
        parcial: (e) => {
            const v = e?.value?.[0] || "";
            if (v) { melhorTexto = v; onAtualizar?.(v); }
        },
        resultado: (e) => {
            const v = e?.value?.[0] || "";
            if (v) { melhorTexto = v; onAtualizar?.(v); }
        },
        erro: () => { /* deixamos o stop tratar o melhorTexto */ },
        fim: () => { /* encerramento tratado ao soltar */ },
    });

    ouvindo = true;
    await Voice.start(idioma, {
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_PREFER_OFFLINE: true,
        RECOGNIZER_ENGINE: "google",
    });
}

export async function pararSegurarFala() {
    if (!ouvindo) return "";
    ouvindo = false;

    try { await Voice.stop(); } catch { }
    const texto = melhorTexto || "";
    await pararEDestruir();
    limparAssinaturas();
    return texto.trim();
}

export function estaOuvindo() { return ouvindo; }
