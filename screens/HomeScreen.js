import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// 🔴 CHANGE IP IF NEEDED
const BACKEND = "http://10.2.216.64:8000";

const LOTS = [
  {
    id: "A",
    name: "Parking A",
    endpoint: `${BACKEND}/smalllot`,
    distance: "300 m",
    time: "3 min",
  },
  {
    id: "B",
    name: "Parking B",
    endpoint: `${BACKEND}/biglot`,
    distance: "0.5 km",
    time: "5 min",
  },
  {
    id: "C",
    name: "Parking C",
    endpoint: `${BACKEND}/dummy`,
    distance: "1.2 km",
    time: "10 min",
  },
];

export default function HomeScreen({ navigation }) {
  const [lots, setLots] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      const result = {};

      for (const lot of LOTS) {
        try {
          const res = await fetch(lot.endpoint);
          const data = await res.json();
          const slots = data.slots || {};

          const total = Object.keys(slots).length;
          const occupied = Object.values(slots).filter(
            (s) => s === "occupied",
          ).length;

          result[lot.id] = {
            ...lot,
            total,
            occupied,
          };
        } catch (e) {
          console.log("Failed fetching", lot.id, e);
        }
      }

      setLots(result);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Near you</Text>

      {Object.values(lots).map((lot) => {
        const available = lot.total - lot.occupied;

        return (
          <View key={lot.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.lotName}>{lot.name}</Text>
              <Text style={styles.meta}>{lot.distance}</Text>
              <Text style={styles.meta}>⏱ {lot.time}</Text>
            </View>

            <View style={styles.cardRight}>
              <View
                style={[
                  styles.countBadge,
                  available > 5
                    ? styles.green
                    : available > 0
                      ? styles.orange
                      : styles.red,
                ]}
              >
                <Text style={styles.countText}>
                  {lot.occupied}/{lot.total}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.navBtn}
                onPress={() => {
                  if (lot.id === "B") navigation.navigate("BigLot");
                  if (lot.id === "A") navigation.navigate("SmallLot");
                }}
              >
                <Text style={styles.navText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    marginBottom: 16,
  },

  cardLeft: {
    flex: 1,
  },

  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  lotName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  meta: {
    color: "#555",
    fontSize: 14,
  },

  countBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 10,
  },

  green: {
    backgroundColor: "#22c55e",
  },

  orange: {
    backgroundColor: "#fb923c",
  },

  red: {
    backgroundColor: "#ef4444",
  },

  countText: {
    color: "white",
    fontWeight: "bold",
  },

  navBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 14,
  },

  navText: {
    color: "white",
    fontWeight: "bold",
  },
});
