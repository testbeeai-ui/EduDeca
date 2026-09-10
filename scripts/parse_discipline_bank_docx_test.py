"""Parser seam: one discipline × one level Word bank from DIsiplines."""

from __future__ import annotations

import unittest

from parse_discipline_bank_docx import (
    BANK_DIR,
    chapter_heading_label,
    classify_bank_filename,
    collect_discipline_banks,
    parse_discipline_bank_docx,
    split_glued_options,
    type_heading_label,
)

DIFFICULTY_LABELS = {
    "simple",
    "medium",
    "higher-medium",
    "medium-difficult",
    "medium-tricky",
    "higher",
    "slightly tricky",
    "difficult",
    "tricky",
}


class ClassifyBankFilenameTest(unittest.TestCase):
    def test_aptitude_and_cbse_names(self) -> None:
        self.assertEqual(
            classify_bank_filename("eduDeca Verbal Ability Level-1.docx"),
            ("eng", 1, None),
        )
        self.assertEqual(
            classify_bank_filename("eduDeca Quantitaive Ability Level-2.docx"),
            ("eco", 2, None),
        )
        self.assertEqual(
            classify_bank_filename("eduDeca Entrepreneur Level-3.docx"),
            ("ent", 3, None),
        )
        self.assertEqual(
            classify_bank_filename("EduDeca CBSE Class XI Physics 2026 - Level 1.docx"),
            ("phy", 1, 11),
        )
        self.assertEqual(
            classify_bank_filename("EduDeca CBSE Class XII Physics 2026 - Level 1.docx"),
            ("phy", 1, 12),
        )
        self.assertEqual(
            classify_bank_filename("EduDeca CBSE Class XII Chemistry 2026 - Level 2.docx"),
            ("che", 2, 12),
        )
        self.assertEqual(
            classify_bank_filename(
                "EduDeca CBSE Class XI Applied Mathematics 2026 - Level 1.docx"
            ),
            ("amat", 1, 11),
        )
        self.assertEqual(
            classify_bank_filename("EduDeca CBSE Class XI Mathematics 2026 - Level 1.docx"),
            ("mat", 1, 11),
        )
        self.assertEqual(
            classify_bank_filename(
                "EduDeca CBSE Class XII Biotechnology 2026 - Level 3.docx"
            ),
            ("biotech", 3, 12),
        )
        self.assertEqual(
            classify_bank_filename("EduDeca CBSE Class XII Biology 2026 - Level 3.docx"),
            ("bio", 3, 12),
        )


class NumberedChapterHeadingTest(unittest.TestCase):
    def test_numbered_title_is_chapter_not_type(self) -> None:
        self.assertEqual(
            chapter_heading_label("1. BIOLOGICAL CLASSIFICATION"),
            "1. BIOLOGICAL CLASSIFICATION",
        )
        self.assertIsNone(type_heading_label("1. BIOLOGICAL CLASSIFICATION"))
        self.assertEqual(chapter_heading_label("7. Enzymes"), "7. Enzymes")
        self.assertEqual(
            chapter_heading_label("1. Numbers & Numerical Applications"),
            "1. Numbers & Numerical Applications",
        )
        self.assertIsNone(chapter_heading_label("Biological Classification"))
        self.assertEqual(
            chapter_heading_label("CHAPTER 1 — UNITS AND MEASUREMENTS"),
            "CHAPTER 1 — UNITS AND MEASUREMENTS",
        )


class SplitGluedOptionsTest(unittest.TestCase):
    def test_paren_and_dot_forms(self) -> None:
        self.assertEqual(
            split_glued_options("A) EagerB) UnwillingC) CertainD) Cheerful"),
            ["Eager", "Unwilling", "Certain", "Cheerful"],
        )
        self.assertEqual(
            split_glued_options("A. CarelessB. Extremely carefulC. Very quickD. Highly imaginative"),
            ["Careless", "Extremely careful", "Very quick", "Highly imaginative"],
        )


class ParseVerbalLevel1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.path = BANK_DIR / "eduDeca Verbal Ability Level-1.docx"
        cls.questions = parse_discipline_bank_docx(cls.path)

    def test_twenty_mcqs_with_types(self) -> None:
        self.assertEqual(len(self.questions), 20)
        q1 = self.questions[0]
        self.assertIn("reluctant", q1["stem"].lower())
        self.assertEqual(q1["options"], ["Eager", "Unwilling", "Certain", "Cheerful"])
        self.assertEqual(q1["correct_index"], 1)
        self.assertEqual(q1["type"], "TYPE 1 — VOCABULARY & WORD USAGE")
        self.assertIsNone(q1["chapter"])
        self.assertIsNone(q1["class_level"])
        self.assertNotIn(str(q1["type"]).strip().lower(), DIFFICULTY_LABELS)
        self.assertEqual(self.questions[4]["type"], "TYPE 2 — GRAMMAR & SENTENCE CORRECTION")

    def test_four_options_and_keys(self) -> None:
        for q in self.questions:
            self.assertEqual(len(q["options"]), 4, q["stem"][:60])
            self.assertIn(q["correct_index"], (0, 1, 2, 3), q["stem"][:60])
            self.assertTrue(q["stem"].strip())


class ParsePhysicsXiLevel1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.path = BANK_DIR / "EduDeca CBSE Class XI Physics 2026 - Level 1.docx"
        cls.questions = parse_discipline_bank_docx(cls.path)

    def test_twenty_mcqs_store_chapter_not_type(self) -> None:
        self.assertEqual(len(self.questions), 20)
        q1 = self.questions[0]
        self.assertIn("si base", q1["stem"].lower())
        self.assertEqual(q1["correct_index"], 2)
        self.assertIsNone(q1["type"])
        self.assertEqual(q1["chapter"], "CHAPTER 1 — UNITS AND MEASUREMENTS")
        self.assertEqual(q1["class_level"], "XI")
        self.assertEqual(q1["options"][2], "Length")
        self.assertEqual(
            self.questions[2]["chapter"],
            "CHAPTER 2 — MOTION IN A STRAIGHT LINE",
        )
        self.assertTrue(
            all(q["chapter"] and q["chapter"].startswith("CHAPTER ") for q in self.questions)
        )
        self.assertTrue(all(q["type"] is None for q in self.questions))
        self.assertTrue(all(q["class_level"] == "XI" for q in self.questions))


class ParsePhysicsXiiLevel1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.path = BANK_DIR / "EduDeca CBSE Class XII Physics 2026 - Level 1.docx"
        cls.questions = parse_discipline_bank_docx(cls.path)

    def test_twenty_mcqs_class_xii_chapter_not_type(self) -> None:
        self.assertEqual(len(self.questions), 20)
        q1 = self.questions[0]
        self.assertIsNone(q1["type"])
        self.assertEqual(q1["class_level"], "XII")
        self.assertEqual(q1["chapter"], "CHAPTER 1 — ELECTRIC CHARGES AND FIELDS")
        self.assertTrue(q1["stem"].lower().startswith("two point charges"))
        self.assertTrue(all(q["class_level"] == "XII" for q in self.questions))
        self.assertTrue(all(q["type"] is None for q in self.questions))
        self.assertTrue(all(q["chapter"] for q in self.questions))


class ParseChemistryXiLevel1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.path = BANK_DIR / "EduDeca CBSE Class XI Chemistry 2026 - Level 1.docx"
        cls.questions = parse_discipline_bank_docx(cls.path)

    def test_chapter_and_random_mixed_not_type(self) -> None:
        self.assertEqual(len(self.questions), 20)
        self.assertIsNone(self.questions[0]["type"])
        self.assertEqual(
            self.questions[0]["chapter"],
            "CHAPTER 1 — SOME BASIC CONCEPTS OF CHEMISTRY",
        )
        self.assertEqual(self.questions[0]["class_level"], "XI")
        self.assertTrue(
            str(self.questions[18]["chapter"]).upper().startswith("RANDOM MIXED"),
        )
        self.assertIsNone(self.questions[18]["type"])


class ParseQuantLevel1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.path = BANK_DIR / "eduDeca Quantitaive Ability Level-1.docx"
        cls.questions = parse_discipline_bank_docx(cls.path)

    def test_difficulty_on_question_not_type(self) -> None:
        self.assertEqual(len(self.questions), 20)
        q1 = self.questions[0]
        self.assertEqual(q1["type"], "TYPE 1 — ARITHMETIC & NUMBER SENSE")
        self.assertEqual(q1["difficulty_rating"], 2)
        self.assertNotIn("simple", (q1["type"] or "").lower())


class ParseVerbalLevel3MultiKeySixtyTest(unittest.TestCase):
    def setUp(self) -> None:
        path = BANK_DIR / "eduDeca Verbal Ability Level-3.docx"
        self.questions = parse_discipline_bank_docx(path)

    def test_keeps_sixty_items_across_both_answer_keys(self) -> None:
        self.assertEqual(len(self.questions), 60)
        self.assertTrue(all(q["type"] for q in self.questions))
        self.assertIn("reluctant", self.questions[0]["stem"].lower())
        # Second block is the pasted Level-2 replacement set (still required for a full L3 bank).
        self.assertIn("meticulous", self.questions[20]["stem"].lower())
        self.assertEqual([q["q_num"] for q in self.questions[:20]], list(range(1, 21)))
        self.assertEqual([q["q_num"] for q in self.questions[20:]], list(range(1, 41)))


class ParseBiologyXiLevel1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.path = BANK_DIR / "EduDeca CBSE Class XI Biology 2026 - Level 1.docx"
        cls.questions = parse_discipline_bank_docx(cls.path)

    def test_twenty_mcqs_numbered_chapter_class_xi(self) -> None:
        self.assertEqual(len(self.questions), 20)
        q1 = self.questions[0]
        self.assertEqual(q1["discipline_id"], "bio")
        self.assertIsNone(q1["type"])
        self.assertEqual(q1["chapter"], "1. BIOLOGICAL CLASSIFICATION")
        self.assertEqual(q1["class_level"], "XI")
        self.assertIn("prokaryotic", q1["stem"].lower())
        self.assertEqual(q1["correct_index"], 1)
        self.assertEqual(self.questions[2]["chapter"], "2. PLANT KINGDOM")
        self.assertTrue(all(q["type"] is None for q in self.questions))
        self.assertTrue(all(q["chapter"] for q in self.questions))
        self.assertTrue(all(q["class_level"] == "XI" for q in self.questions))


class ParseAppliedMathXiLevel1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.path = BANK_DIR / "EduDeca CBSE Class XI Applied Mathematics 2026 - Level 1.docx"
        cls.questions = parse_discipline_bank_docx(cls.path)

    def test_applied_math_not_mathematics(self) -> None:
        self.assertEqual(len(self.questions), 20)
        q1 = self.questions[0]
        self.assertEqual(q1["discipline_id"], "amat")
        self.assertIsNone(q1["type"])
        self.assertEqual(q1["class_level"], "XI")
        self.assertEqual(q1["chapter"], "1. Numbers & Numerical Applications")
        self.assertTrue(all(q["discipline_id"] == "amat" for q in self.questions))


class ParseBiotechXiLevel1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.path = BANK_DIR / "EduDeca CBSE Class XI Biotechnology 2026 - Level 1.docx"
        cls.questions = parse_discipline_bank_docx(cls.path)

    def test_biotech_not_biology(self) -> None:
        self.assertEqual(len(self.questions), 20)
        q1 = self.questions[0]
        self.assertEqual(q1["discipline_id"], "biotech")
        self.assertIsNone(q1["type"])
        self.assertEqual(q1["class_level"], "XI")
        self.assertIn("CONCEPTS", q1["chapter"] or "")
        self.assertTrue(all(q["discipline_id"] == "biotech" for q in self.questions))
        self.assertTrue(all(q["chapter"] for q in self.questions))


class ParseBiologyXiLevel2SkipsMissingKeysTest(unittest.TestCase):
    def test_skips_questions_absent_from_answer_table(self) -> None:
        path = BANK_DIR / "EduDeca CBSE Class XI Biology 2026 - Level 2.docx"
        questions = parse_discipline_bank_docx(path)
        nums = [q["q_num"] for q in questions]
        self.assertEqual(len(questions), 38)
        self.assertNotIn(14, nums)
        self.assertNotIn(28, nums)
        self.assertTrue(all(q["class_level"] == "XI" for q in questions))
        self.assertTrue(all(q["type"] is None for q in questions))


class ParseBiologyXiiLevel3SkipsMissingKeysTest(unittest.TestCase):
    def test_skips_questions_absent_from_garbled_key(self) -> None:
        path = BANK_DIR / "EduDeca CBSE Class XII Biology 2026 - Level 3.docx"
        questions = parse_discipline_bank_docx(path)
        nums = [q["q_num"] for q in questions]
        self.assertEqual(len(questions), 58)
        self.assertNotIn(49, nums)
        self.assertNotIn(53, nums)
        self.assertTrue(all(q["class_level"] == "XII" for q in questions))


class CollectFolderTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.rows = collect_discipline_banks(BANK_DIR)

    def test_combines_class_xi_then_xii_and_skips_missing(self) -> None:
        l1_che = [r for r in self.rows if r["level"] == 1 and r["discipline_id"] == "che"]
        l1_phy = [r for r in self.rows if r["level"] == 1 and r["discipline_id"] == "phy"]
        l2_phy = [r for r in self.rows if r["level"] == 2 and r["discipline_id"] == "phy"]
        l3_phy = [r for r in self.rows if r["level"] == 3 and r["discipline_id"] == "phy"]
        self.assertEqual(len(l1_che), 40)
        self.assertEqual(len(l1_phy), 40)
        self.assertEqual(len(l2_phy), 80)
        self.assertEqual(len(l3_phy), 120)
        self.assertEqual(l1_che[0]["id"], "l1-che-01")
        self.assertEqual(l1_che[-1]["id"], "l1-che-40")
        self.assertEqual(l1_phy[0]["id"], "l1-phy-01")
        self.assertEqual(l1_phy[-1]["id"], "l1-phy-40")
        self.assertEqual(l1_phy[0]["chapter"], "CHAPTER 1 — UNITS AND MEASUREMENTS")
        self.assertIsNone(l1_phy[0]["type"])
        self.assertEqual(l1_phy[0]["class_level"], "XI")
        self.assertTrue(all(r["class_level"] == "XI" for r in l1_phy[:20]))
        self.assertTrue(all(r["class_level"] == "XII" for r in l1_phy[20:]))
        self.assertEqual(l1_phy[20]["chapter"], "CHAPTER 1 — ELECTRIC CHARGES AND FIELDS")
        self.assertIsNone(l1_phy[20]["type"])
        self.assertTrue(all(r["class_level"] == "XI" for r in l1_che[:20]))
        self.assertTrue(all(r["class_level"] == "XII" for r in l1_che[20:]))
        self.assertTrue(all(r["chapter"] for r in l1_phy))
        self.assertTrue(all(r["chapter"] for r in l1_che))
        self.assertTrue(all(r["id"].startswith("l") for r in self.rows))
        self.assertFalse(any(r["id"].startswith("mock-") for r in self.rows))
        discs = {r["discipline_id"] for r in self.rows}
        self.assertIn("bio", discs)
        self.assertIn("amat", discs)
        self.assertIn("biotech", discs)
        l1_bio = [r for r in self.rows if r["level"] == 1 and r["discipline_id"] == "bio"]
        l2_bio = [r for r in self.rows if r["level"] == 2 and r["discipline_id"] == "bio"]
        l3_bio = [r for r in self.rows if r["level"] == 3 and r["discipline_id"] == "bio"]
        l1_amat = [r for r in self.rows if r["level"] == 1 and r["discipline_id"] == "amat"]
        l1_biotech = [r for r in self.rows if r["level"] == 1 and r["discipline_id"] == "biotech"]
        self.assertEqual(len(l1_bio), 40)
        self.assertEqual(len(l2_bio), 78)
        self.assertEqual(len(l3_bio), 118)
        self.assertEqual(len(l1_amat), 40)
        self.assertEqual(len(l1_biotech), 40)
        self.assertEqual(l1_bio[0]["id"], "l1-bio-01")
        self.assertEqual(l1_bio[-1]["id"], "l1-bio-40")
        self.assertEqual(l1_bio[0]["class_level"], "XI")
        self.assertEqual(l1_bio[20]["class_level"], "XII")
        self.assertEqual(l1_amat[0]["class_level"], "XI")
        self.assertEqual(l1_amat[20]["class_level"], "XII")
        self.assertEqual(l1_biotech[0]["class_level"], "XI")
        self.assertEqual(l1_biotech[20]["class_level"], "XII")
        self.assertTrue(all(r["type"] is None for r in l1_bio))
        self.assertTrue(all(r["type"] is None for r in l1_amat))
        self.assertTrue(all(r["type"] is None for r in l1_biotech))
        self.assertTrue(all(r["chapter"] for r in l1_bio))
        self.assertTrue(all(r["chapter"] for r in l1_amat))
        self.assertTrue(all(r["chapter"] for r in l1_biotech))
        self.assertEqual(l1_bio[0]["chapter"], "1. BIOLOGICAL CLASSIFICATION")
        self.assertNotEqual(l1_amat[0]["discipline_id"], "mat")
        self.assertNotEqual(l1_biotech[0]["discipline_id"], "bio")
        for row in self.rows:
            self.assertEqual(len(row["options"]), 4, row["id"])
            self.assertIn(row["correct_index"], (0, 1, 2, 3), row["id"])
            self.assertNotIn(str(row["type"] or "").strip().lower(), DIFFICULTY_LABELS, row["id"])


if __name__ == "__main__":
    unittest.main()
