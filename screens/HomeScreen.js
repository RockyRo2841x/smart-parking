import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BACKEND } from "../config";

export default function HomeScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch(`${BACKEND}/biglot`);
        if (!response.ok) throw new Error("Parking data unavailable");
        const result = await response.json();
        if (active) { setData(result); setError(""); }
      } catch {
        if (active) setError("Cannot reach parking service. Please try again shortly.");
      }
    };
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const slots = Object.values(data?.slots || {});
  const free = slots.filter((state) => state === "free").length;
  const cameraUnavailable = data?.mode === "camera" && data?.detector_status !== "running";

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Parking availability</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!data && !error ? <Text>Loading parking availability…</Text> : null}
      {data ? (
        <View style={styles.card}>
          <Text style={styles.lotName}>Parking B</Text>
          <Text style={styles.meta}>
            {data.mode === "manual-demo" ? "Interactive demo" : "Camera-monitored lot"}
          </Text>
          {cameraUnavailable ? (
            <Text style={styles.error}>Camera unavailable. Availability is unverified.</Text>
          ) : <Text style={styles.count}>{free} free / {slots.length} spaces</Text>}
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("BigLot")}>
            <Text style={styles.buttonText}>View spaces</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  card: { padding: 20, borderRadius: 16, backgroundColor: "#f1f5f9" },
  lotName: { fontSize: 22, fontWeight: "bold", marginBottom: 6 },
  meta: { color: "#475569", marginBottom: 12 },
  count: { fontSize: 20, marginBottom: 16 },
  error: { color: "#b91c1c", marginBottom: 16 },
  button: { backgroundColor: "#2563eb", padding: 14, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "bold" },
});
