"""Mock-bank parsers: L1 reuse + L2/L3 counts, type/difficulty rules."""

from __future__ import annotations

import unittest
from pathlib import Path

from parse_l1_docx import DISC_MAP, DOC_PATH, parse_level1_docx
from parse_mock_docx import (
    L2_DOC_PATH,
    L3_DOC_PATH,
    _split_options,
    parse_level2_docx,
    parse_level3_docx,
    to_mock_rows,
)

DIFFICULTY_LABELS = {
    "simple",
    "medium",
    "higher-medium",
    "medium-difficult",
    "higher",
    "slightly tricky",
    "difficult",
    "tricky",
}


class ParseMockL1ReuseTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.questions = to_mock_rows(parse_level1_docx(DOC_PATH), level=1)

    def test_two_hundred_forty_mock_ids(self) -> None:
        self.assertEqual(len(self.questions), 240)
        ids = [q["id"] for q in self.questions]
        self.assertEqual(len(set(ids)), 240)
        self.assertTrue(all(i.startswith("mock-l1-s") for i in ids))
        self.assertIn("mock-l1-s01-phy-01", ids)

    def test_one_question_per_discipline_per_set(self) -> None:
        by_set: dict[int, list[dict]] = {}
        for q in self.questions:
            by_set.setdefault(q["set_number"], []).append(q)
        self.assertEqual(sorted(by_set), list(range(1, 21)))
        expected = set(DISC_MAP.values())
        for set_no, rows in by_set.items():
            subjects = [q["discipline_id"] for q in rows]
            self.assertEqual(len(rows), 12, f"set {set_no}")
            self.assertEqual(set(subjects), expected, f"set {set_no}")
            self.assertTrue(all(q["sort_order"] == 1 for q in rows), f"set {set_no}")
            self.assertTrue(all(q["level"] == 1 for q in rows))

    def test_type_null_and_difficulty_not_type(self) -> None:
        for q in self.questions:
            self.assertIsNone(q["type"], q["id"])
            if q["difficulty_rating"] is not None:
                self.assertIsInstance(q["difficulty_rating"], int, q["id"])


class ParseMockL2DocxTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.questions = parse_level2_docx(L2_DOC_PATH)

    def test_four_hundred_eighty_unique_mcqs(self) -> None:
        self.assertEqual(len(self.questions), 480)
        ids = [q["id"] for q in self.questions]
        self.assertEqual(len(set(ids)), 480)
        self.assertTrue(all(i.startswith("mock-l2-s") for i in ids))

    def test_twenty_sets_two_per_subject(self) -> None:
        by_set: dict[int, list[dict]] = {}
        for q in self.questions:
            by_set.setdefault(q["set_number"], []).append(q)
        self.assertEqual(sorted(by_set), list(range(1, 21)))
        expected = set(DISC_MAP.values())
        for set_no, rows in by_set.items():
            self.assertEqual(len(rows), 24, f"set {set_no}")
            subjects = [q["discipline_id"] for q in rows]
            self.assertEqual(set(subjects), expected, f"set {set_no}")
            for disc in expected:
                slots = [q["sort_order"] for q in rows if q["discipline_id"] == disc]
                self.assertEqual(sorted(slots), [1, 2], f"set {set_no} {disc}")

    def test_options_answers_and_type_null(self) -> None:
        for q in self.questions:
            self.assertEqual(len(q["options"]), 4, q["id"])
            self.assertTrue(all(str(opt).strip() for opt in q["options"]), q["id"])
            self.assertIn(q["correct_index"], (0, 1, 2, 3), q["id"])
            self.assertTrue(q["stem"].strip(), q["id"])
            self.assertIsNone(q["type"], q["id"])
            self.assertNotIn(str(q["type"] or "").strip().lower(), DIFFICULTY_LABELS)

    def test_difficulty_labels_go_on_rating_not_type(self) -> None:
        set1 = [q for q in self.questions if q["set_number"] == 1]
        ratings = [q["difficulty_rating"] for q in set1]
        self.assertTrue(any(r == 4 for r in ratings), "Higher-Medium/Higher → rating")
        self.assertTrue(any(r == 5 for r in ratings), "Slightly Tricky → rating")
        self.assertTrue(all(q["type"] is None for q in set1))
        phy1 = next(q for q in set1 if q["id"] == "mock-l2-s01-phy-01")
        self.assertEqual(phy1["difficulty_rating"], 4)
        self.assertIn("kinetic energy", phy1["stem"].lower())


class ParseMockL3DocxTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.questions = parse_level3_docx(L3_DOC_PATH)

    def test_seven_hundred_twenty_unique_mcqs(self) -> None:
        self.assertEqual(len(self.questions), 720)
        ids = [q["id"] for q in self.questions]
        self.assertEqual(len(set(ids)), 720)
        self.assertTrue(all(i.startswith("mock-l3-s") for i in ids))

    def test_twenty_sets_three_per_subject(self) -> None:
        by_set: dict[int, list[dict]] = {}
        for q in self.questions:
            by_set.setdefault(q["set_number"], []).append(q)
        self.assertEqual(sorted(by_set), list(range(1, 21)))
        expected = set(DISC_MAP.values())
        for set_no, rows in by_set.items():
            self.assertEqual(len(rows), 36, f"set {set_no}")
            subjects = [q["discipline_id"] for q in rows]
            self.assertEqual(set(subjects), expected, f"set {set_no}")
            counts = {disc: subjects.count(disc) for disc in expected}
            if set_no == 15:
                # Source file labels Q36 as Entrepreneurship, so amat has 2 and ent has 4.
                self.assertEqual(counts["amat"], 2)
                self.assertEqual(counts["ent"], 4)
                for disc in expected - {"amat", "ent"}:
                    self.assertEqual(counts[disc], 3, f"set {set_no} {disc}")
                continue
            for disc in expected:
                self.assertEqual(counts[disc], 3, f"set {set_no} {disc}")

    def test_options_answers_and_type_null(self) -> None:
        for q in self.questions:
            self.assertEqual(len(q["options"]), 4, q["id"])
            self.assertTrue(all(str(opt).strip() for opt in q["options"]), q["id"])
            self.assertIn(q["correct_index"], (0, 1, 2, 3), q["id"])
            self.assertTrue(q["stem"].strip(), q["id"])
            self.assertIsNone(q["type"], q["id"])

    def test_binds_misnumbered_answer_keys_to_set_order(self) -> None:
        set6 = [q for q in self.questions if q["set_number"] == 6]
        self.assertEqual(len(set6), 36)
        phy = next(q for q in set6 if q["id"] == "mock-l3-s06-phy-01")
        self.assertIn("metal wire", phy["stem"].lower())
        self.assertEqual(phy["correct_index"], 1)
        self.assertIsNone(phy["type"])
        self.assertEqual(phy["difficulty_rating"], 4)

    def test_l3_set1_answer_and_tricky_is_difficulty(self) -> None:
        phy = next(q for q in self.questions if q["id"] == "mock-l3-s01-phy-01")
        self.assertIn("circular path", phy["stem"].lower())
        self.assertEqual(phy["correct_index"], 2)
        amat = next(q for q in self.questions if q["id"] == "mock-l3-s01-amat-01")
        self.assertEqual(amat["difficulty_rating"], 5)
        self.assertIsNone(amat["type"])


class SplitMockOptionsTest(unittest.TestCase):
    def test_keeps_washington_dc_as_one_option(self) -> None:
        blob = "A. GenevaB. Washington, D.C.C. New YorkD. London"
        self.assertEqual(
            _split_options(blob),
            ["Geneva", "Washington, D.C.", "New York", "London"],
        )

    def test_glued_sentence_period_before_option_c(self) -> None:
        blob = (
            "A. Neither the manager nor the employees was informed."
            "B. Neither the manager nor the employees were informed."
            "C. Neither manager nor employees was informed."
            "D. Neither manager nor employees has informed."
        )
        self.assertEqual(len(_split_options(blob)), 4)


class ParseMockDocxFailClosedTest(unittest.TestCase):
    def test_missing_file_raises(self) -> None:
        missing = Path("C:/definitely-not-a-mock-bank.docx")
        with self.assertRaises(FileNotFoundError):
            parse_level2_docx(missing)
        with self.assertRaises(FileNotFoundError):
            parse_level3_docx(missing)


if __name__ == "__main__":
    unittest.main()
