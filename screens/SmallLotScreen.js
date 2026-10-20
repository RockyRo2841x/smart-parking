import { StyleSheet, Text, View } from "react-native";

export default function SmallLotScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Small Parking Lot</Text>
      <Text>Entrance Camera Active</Text>
      <Text>Showing filled & empty slots</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
