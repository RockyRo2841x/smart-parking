"""API integration and frame-publication checks; no camera/model is used."""

import os
os.environ["PARKING_DETECTION_ENABLED"] = "0"

import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend import server


class ParkingAPITests(unittest.TestCase):
    def setUp(self):
        with server.state_lock:
            server.BIG_LOT_SLOTS.update({key: "free" for key in server.SLOTS})
        self.client = TestClient(server.app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def test_startup_without_vision_dependencies_or_camera(self):
        info = self.client.get("/").json()
        self.assertEqual(info["mode"], "manual-demo")
        self.assertEqual(info["detector_status"], "disabled")

    def test_complete_slot_inventory(self):
        data = self.client.get("/biglot").json()
        self.assertEqual(list(data["slots"]), [f"B{i}" for i in range(1, 59)])
        self.assertEqual(set(data["slots"].values()), {"free"})

    def test_entry_and_exit_persist_across_polls(self):
        self.assertEqual(self.client.post("/slot/B3/occupied").status_code, 200)
        self.assertEqual(self.client.get("/biglot").json()["slots"]["B3"], "occupied")
        self.assertEqual(self.client.get("/biglot").json()["slots"]["B3"], "occupied")
        self.assertEqual(self.client.post("/slot/B3/free").status_code, 200)
        self.assertEqual(self.client.get("/biglot").json()["slots"]["B3"], "free")

    def test_invalid_updates_do_not_mutate_state(self):
        before = self.client.get("/biglot").json()["slots"]
        self.assertEqual(self.client.post("/slot/B59/occupied").status_code, 404)
        self.assertEqual(self.client.post("/slot/B1/reserved").status_code, 400)
        self.assertEqual(self.client.get("/biglot").json()["slots"], before)

    def test_manual_updates_rejected_in_camera_mode(self):
        with patch.object(server, "DETECTION_ENABLED", True):
            self.assertEqual(self.client.post("/slot/B1/occupied").status_code, 409)
        self.assertEqual(self.client.get("/biglot").json()["slots"]["B1"], "free")

    def test_frame_can_mark_multiple_overlapping_slots(self):
        snapshot = server.detection_snapshot([(125, 110, 155, 150)])
        self.assertEqual(len(snapshot), 58)
        self.assertEqual([k for k, v in snapshot.items() if v == "occupied"], ["B1", "B2"])

    def test_empty_frame_clears_previous_occupancy(self):
        server.BIG_LOT_SLOTS["B1"] = "occupied"
        snapshot = server.detection_snapshot([])
        self.assertEqual(set(snapshot.values()), {"free"})
        # Snapshot construction does not expose a partially reset state to readers.
        self.assertEqual(server.BIG_LOT_SLOTS["B1"], "occupied")


if __name__ == "__main__":
    unittest.main()
