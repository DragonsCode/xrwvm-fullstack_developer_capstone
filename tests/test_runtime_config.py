import os
from pathlib import Path
import runpy
import unittest
from unittest.mock import patch

SETTINGS = (Path(__file__).resolve().parents[1]
            / "server/djangoproj/settings.py")


class RuntimeConfigTests(unittest.TestCase):
    def test_secret_is_required(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "DJANGO_SECRET_KEY"):
                runpy.run_path(str(SETTINGS))

    def test_defaults_are_local_and_do_not_trust_external_origins(self):
        with patch.dict(os.environ, {"DJANGO_SECRET_KEY": "synthetic-only"},
                        clear=True):
            config = runpy.run_path(str(SETTINGS))
        self.assertEqual(config["SECRET_KEY"], "synthetic-only")
        self.assertFalse(config["DEBUG"])
        self.assertEqual(config["ALLOWED_HOSTS"], ["localhost", "127.0.0.1"])
        self.assertEqual(config["CSRF_TRUSTED_ORIGINS"], [])

    def test_explicit_runtime_overrides(self):
        env = {"DJANGO_SECRET_KEY": "synthetic-only", "DJANGO_DEBUG": "TRUE",
               "DJANGO_ALLOWED_HOSTS": " example.invalid, ,localhost ",
               "DJANGO_CSRF_TRUSTED_ORIGINS": " https://example.invalid, "}
        with patch.dict(os.environ, env, clear=True):
            config = runpy.run_path(str(SETTINGS))
        self.assertTrue(config["DEBUG"])
        self.assertEqual(config["ALLOWED_HOSTS"], [
                         "example.invalid", "localhost"])
        self.assertEqual(config["CSRF_TRUSTED_ORIGINS"],
                         ["https://example.invalid"])
