// Valores fixos compartilhados no app

// UUIDs do serviço/característica no ESP32
export const UUID_SERVICO = "0000ffb0-0000-1000-8000-00805f9b34fb";
export const UUID_CARAC_COMANDO = "0000ffb1-0000-1000-8000-00805f9b34fb";

// Comandos (Base64) para o BLE-PLX
export const COMANDOS = {
    LIGAR: "AQ==",     // 0x01
    DESLIGAR: "AA==",  // 0x00
};

// Palavras/expressões esperadas para cada intenção
export const ALIAS_VOZ = {
    ligar: ["liga", "ligar", "ligue", "acende", "acender", "acender luz", "on"],
    desligar: ["desliga", "desligar", "desligue", "apaga", "apagar", "apagar luz", "off"],
};
