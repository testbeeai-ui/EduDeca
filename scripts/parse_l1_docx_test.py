"""Parser seam: 20 independent Level-1 sets × 12 subjects, skip QC page."""

from __future__ import annotations

import unittest
from pathlib import Path

from parse_l1_docx import (
    BANK_SUBJECTS,
    DISC_MAP,
    DOC_PATH,
    parse_level1_docx,
)

class ParseLevel1DocxTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.questions = parse_level1_docx(DOC_PATH)

    def test_two_hundred_forty_unique_mcqs(self) -> None:
        self.assertEqual(len(self.questions), 240)
        ids = [q["id"] for q in self.questions]
        stems = [q["stem"].strip().lower() for q in self.questions]
        self.assertEqual(len(set(ids)), 240)
        self.assertEqual(len(set(stems)), 240)

    def test_twenty_sets_one_of_each_subject(self) -> None:
        by_set: dict[int, list[dict]] = {}
        for q in self.questions:
            by_set.setdefault(q["set_number"], []).append(q)
        self.assertEqual(sorted(by_set), list(range(1, 21)))
        expected = set(DISC_MAP.values())
        self.assertEqual(expected, set(BANK_SUBJECTS))
        for set_no, rows in by_set.items():
            subjects = [q["subject_id"] for q in rows]
            self.assertEqual(len(rows), 12, f"set {set_no}")
            self.assertEqual(set(subjects), expected, f"set {set_no}")
            self.assertEqual(len(subjects), 12)

    def test_options_and_answers(self) -> None:
        for q in self.questions:
            self.assertEqual(len(q["options"]), 4, q["id"])
            self.assertTrue(all(opt.strip() for opt in q["options"]), q["id"])
            self.assertIn(q["correct_index"], (0, 1, 2, 3), q["id"])
            self.assertTrue(q["stem"].strip(), q["id"])
            self.assertNotIn("Quality-Control", q["stem"])

    def test_square_roots_survive_omml(self) -> None:
        mat9 = next(
            q
            for q in self.questions
            if q["subject_id"] == "mat" and q["sort_order"] == 9
        )
        self.assertIn(r"\sqrt{144}", mat9["stem"])
        self.assertIn(r"\sqrt{81}", mat9["stem"])
        self.assertNotIn("$144+81$", mat9["stem"])

    def test_difficulty_split_per_set(self) -> None:
        by_set: dict[int, list[int]] = {}
        for q in self.questions:
            by_set.setdefault(q["set_number"], []).append(q["difficulty_rating"])
        for set_no, ratings in by_set.items():
            self.assertEqual(ratings.count(3), 5, f"set {set_no} medium")
            self.assertEqual(ratings.count(4), 5, f"set {set_no} medium-higher")
            self.assertEqual(ratings.count(5), 2, f"set {set_no} slightly tricky")


if __name__ == "__main__":
    unittest.main()
