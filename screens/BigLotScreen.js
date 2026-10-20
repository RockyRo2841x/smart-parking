import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const BACKEND = "http://10.2.216.64:8000";

const ENTRY_POS = { x: 160, y: 40 };
const EXIT_POS = { x: 160, y: 40 };

export default function BigLotScreen() {
  const [slots, setSlots] = useState({});
  const [animating, setAnimating] = useState(false);

  const carPos = useRef(new Animated.ValueXY(ENTRY_POS)).current;

  /* ---------------- FETCH ---------------- */
  const fetchSlots = async () => {
    const res = await fetch(`${BACKEND}/biglot`);
    const json = await res.json();
    setSlots(json.slots);
  };

  useEffect(() => {
    fetchSlots();
    const i = setInterval(fetchSlots, 2000);
    return () => clearInterval(i);
  }, []);

  /* ---------------- DERIVED DATA ---------------- */
  const slotIds = Object.keys(slots);
  const total = slotIds.length;
  const occupied = slotIds.filter((s) => slots[s] === "occupied").length;
  const free = total - occupied;

  const nearestFree = slotIds.find((s) => slots[s] === "free") || null;

  /* ---------------- SLOT GRID POSITION ---------------- */
  const getSlotPosition = (index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    return {
      x: 20 + col * 120,
      y: 220 + row * 80,
    };
  };

  /* ---------------- ENTRY ANIMATION ---------------- */
  const carEntered = async () => {
    if (!nearestFree || animating) return;
    setAnimating(true);

    const idx = slotIds.indexOf(nearestFree);
    const target = getSlotPosition(idx);

    carPos.setValue(ENTRY_POS);

    Animated.timing(carPos, {
      toValue: target,
      duration: 900,
      useNativeDriver: false,
    }).start(async () => {
      await fetch(`${BACKEND}/slot/${nearestFree}/occupied`, {
        method: "POST",
      });
      fetchSlots();
      setAnimating(false);
    });
  };

  /* ---------------- EXIT ANIMATION ---------------- */
  const carExited = async () => {
    if (occupied === 0 || animating) return;
    setAnimating(true);

    const occupiedSlot = slotIds.find((s) => slots[s] === "occupied");
    const idx = slotIds.indexOf(occupiedSlot);
    const start = getSlotPosition(idx);

    carPos.setValue(start);

    Animated.timing(carPos, {
      toValue: EXIT_POS,
      duration: 900,
      useNativeDriver: false,
    }).start(async () => {
      await fetch(`${BACKEND}/slot/${occupiedSlot}/free`, {
        method: "POST",
      });
      fetchSlots();
      setAnimating(false);
    });
  };

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      {/* ENTRY */}
      <View style={styles.entry}>
        <Text style={styles.entryText}>⬇ Entry</Text>
      </View>

      {/* CAR */}
      {animating && (
        <Animated.Text style={[styles.car, { left: carPos.x, top: carPos.y }]}>
          🚗
        </Animated.Text>
      )}

      {/* HEADER */}
      <Text style={styles.title}>Big Parking Lot (B)</Text>
      <Text style={styles.subtitle}>
        Total: {total} | Occupied: {occupied} | Free: {free}
      </Text>
      <Text style={styles.subtitle}>
        Nearest Free Slot: {nearestFree || "None"}
      </Text>

      {/* CONTROLS */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.enterBtn} onPress={carEntered}>
          <Text style={styles.btnText}>🚗 Car Entered</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.exitBtn} onPress={carExited}>
          <Text style={styles.btnText}>🚙 Car Exited</Text>
        </TouchableOpacity>
      </View>

      {/* GRID */}
      <ScrollView contentContainerStyle={styles.grid}>
        {slotIds.map((id, i) => {
          const status = slots[id];
          const isNearest = id === nearestFree;

          return (
            <View
              key={id}
              style={[
                styles.slot,
                status === "free" ? styles.free : styles.occupied,
                isNearest && styles.nearest,
              ]}
            >
              <Text style={styles.slotText}>{id}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },

  entry: {
    alignItems: "center",
    marginVertical: 10,
  },

  entryText: {
    fontSize: 16,
    color: "#555",
  },

  car: {
    position: "absolute",
    fontSize: 28,
    zIndex: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: 6,
  },

  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },

  enterBtn: {
    backgroundColor: "#0f172a",
    padding: 12,
    borderRadius: 12,
    width: "45%",
  },

  exitBtn: {
    backgroundColor: "#7c2d12",
    padding: 12,
    borderRadius: 12,
    width: "45%",
  },

  btnText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },

  slot: {
    width: "30%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  free: {
    backgroundColor: "#16a34a",
  },

  occupied: {
    backgroundColor: "#ef4444",
  },

  nearest: {
    borderWidth: 3,
    borderColor: "#2563eb",
  },

  slotText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
