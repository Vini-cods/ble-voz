import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { escanearESelecionarUma, conectar, escreverComando } from "./src/ble";
import { iniciarSegurarFala, pararSegurarFala, interpretarIntencao, estaOuvindo } from "./src/voice";
import { solicitarPermissoesBle } from "./src/permissions";
import { COMANDOS } from "./src/constants";

export default function App() {
  const [dispositivo, setDispositivo] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [ultimoReconhecido, setUltimoReconhecido] = useState("");
  const [pressionando, setPressionando] = useState(false);

  async function aoPressionarConectar() {
    try {
      setOcupado(true);
      await solicitarPermissoesBle();
      const achado = await escanearESelecionarUma(8000);
      if (!achado) return Alert.alert("BLE", "Nenhum ESP32 encontrado");
      await conectar(achado.idDispositivo);
      setDispositivo(achado);
      Alert.alert("Conectado", achado.nome || achado.idDispositivo);
    } catch (e) {
      Alert.alert("Erro BLE", e?.message || String(e));
    } finally {
      setOcupado(false);
    }
  }

  async function enviar(dadoBase64) {
    if (!dispositivo?.idDispositivo) return Alert.alert("BLE", "Conecte primeiro");
    try {
      setOcupado(true);
      await escreverComando(dispositivo.idDispositivo, dadoBase64);
    } catch (e) {
      Alert.alert("Erro ao enviar", e?.message || String(e));
    } finally {
      setOcupado(false);
    }
  }

  // Press & Hold: começar a ouvir
  async function aoSegurarInicio() {
    if (!dispositivo?.idDispositivo || ocupado || pressionando || estaOuvindo()) return;
    try {
      setPressionando(true);
      setUltimoReconhecido("(ouvindo...)");
      await iniciarSegurarFala((parcial) => setUltimoReconhecido(parcial), { idioma: "pt-BR" });
    } catch (e) {
      setPressionando(false);
      Alert.alert("Voz", e?.message || String(e));
    }
  }

  // Ao soltar: parar e agir
  async function aoSegurarFim() {
    if (!pressionando) return;
    try {
      const texto = await pararSegurarFala();
      setPressionando(false);
      setUltimoReconhecido(texto || "(vazio)");

      const intencao = interpretarIntencao(texto);
      if (intencao === "ligar") await enviar(COMANDOS.LIGAR);
      else if (intencao === "desligar") await enviar(COMANDOS.DESLIGAR);
      else Alert.alert("Voz", `Comando não reconhecido: "${texto}"`);
    } catch (e) {
      setPressionando(false);
      Alert.alert("Voz", e?.message || String(e));
    }
  }

  // Botão grande reutilizável
  function BotaoGrande({ rotulo, onPress, onPressIn, onPressOut, desabilitado, variante = "primario", ativo }) {
    return (
      <Pressable
        style={[
          estilos.botao,
          variante === "secundario" ? estilos.botaoSecundario : estilos.botaoPrimario,
          desabilitado && estilos.botaoDesabilitado,
          ativo && estilos.botaoAtivo,
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={desabilitado}
        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={estilos.botaoTexto}>{rotulo}</Text>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={estilos.area} edges={["top", "right", "bottom", "left"]}>
      <StatusBar barStyle="dark-content" />
      <View style={estilos.container}>
        <Text style={estilos.titulo}>BLE + Voz → LED no ESP32</Text>
        <Text style={estilos.subtitulo}>
          {dispositivo ? `Conectado: ${dispositivo.nome || dispositivo.idDispositivo}` : "Não conectado"}
        </Text>

        <View style={estilos.banner}>
          <Text style={estilos.bannerTitulo}>Último reconhecimento</Text>
          <Text style={estilos.bannerTexto}>{ultimoReconhecido || "(vazio)"}</Text>
        </View>

        <View style={{ height: 16 }} />

        <BotaoGrande rotulo="Procurar & Conectar" onPress={aoPressionarConectar} desabilitado={ocupado} />

        <View style={{ height: 12 }} />

        <BotaoGrande
          rotulo="Ligar LED (BLE)"
          onPress={() => enviar(COMANDOS.LIGAR)}
          desabilitado={ocupado || !dispositivo}
        />

        <View style={{ height: 12 }} />

        <BotaoGrande
          rotulo="Desligar LED (BLE)"
          onPress={() => enviar(COMANDOS.DESLIGAR)}
          desabilitado={ocupado || !dispositivo}
        />

        <View style={{ height: 12 }} />

        <BotaoGrande
          rotulo={pressionando ? "Solte para enviar" : "Pressione e segure para falar"}
          onPressIn={aoSegurarInicio}
          onPressOut={aoSegurarFim}
          desabilitado={ocupado || !dispositivo}
          variante="secundario"
          ativo={pressionando}
        />

        {ocupado && (
          <View style={{ marginTop: 24 }}>
            <ActivityIndicator size="large" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  titulo: { fontSize: 28, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  subtitulo: { fontSize: 16, color: "#475569", marginTop: 6, textAlign: "center" },

  banner: {
    width: "100%",
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFE08A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  bannerTitulo: { fontSize: 14, fontWeight: "700", color: "#78350F", marginBottom: 4 },
  bannerTexto: { fontSize: 20, fontWeight: "800", color: "#111827" },

  botao: {
    width: "100%",
    minHeight: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  botaoPrimario: { backgroundColor: "#111827" },
  botaoSecundario: { backgroundColor: "#374151" },
  botaoAtivo: { backgroundColor: "#4B5563" },
  botaoDesabilitado: { opacity: 0.4 },
  botaoTexto: { color: "white", fontSize: 20, fontWeight: "800", textAlign: "center" },
});
