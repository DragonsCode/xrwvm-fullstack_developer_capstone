"""Execute source functions with doubles: no Django, DB or network startup."""
import ast
import json
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import Mock

ROOT = Path(__file__).resolve().parents[1] / 'server/djangoapp'


def load_function(filename, name, namespace):
    tree = ast.parse((ROOT / filename).read_text())
    function = next(node for node in tree.body
                    if isinstance(node, ast.FunctionDef) and node.name == name)
    function.decorator_list = []
    module = ast.Module(body=[function], type_ignores=[])
    exec(compile(module, str(ROOT / filename), 'exec'), namespace)
    return namespace[name]


class ErrorBoundaryTests(unittest.TestCase):
    def test_request_failure_returns_none_but_interrupt_propagates(self):
        class RequestError(Exception):
            pass

        requests = SimpleNamespace(get=Mock(), RequestException=RequestError)
        function = load_function('restapis.py', 'get_request', {
            'requests': requests, 'backend_url': 'http://example.invalid',
            'print': Mock(),
        })
        requests.get.side_effect = RequestError('synthetic failure')
        self.assertIsNone(function('/example'))
        requests.get.side_effect = KeyboardInterrupt
        with self.assertRaises(KeyboardInterrupt):
            function('/example')

    def test_registration_only_treats_missing_user_as_new(self):
        class MissingUser(Exception):
            pass

        objects = Mock()
        user = SimpleNamespace(objects=objects, DoesNotExist=MissingUser)
        function = load_function('views.py', 'registration', {
            'User': user, 'json': json, 'logger': Mock(), 'login': Mock(),
            'JsonResponse': lambda value: value,
        })
        request = SimpleNamespace(body=json.dumps({
            'userName': 'synthetic', 'password': 'synthetic-only',
            'firstName': 'Test', 'lastName': 'User',
            'email': 'example@example.invalid',
        }))
        objects.get.side_effect = RuntimeError('synthetic database failure')
        with self.assertRaises(RuntimeError):
            function(request)
        objects.create_user.assert_not_called()
        objects.get.side_effect = MissingUser
        self.assertEqual(function(request)['status'], 'Authenticated')
        objects.create_user.assert_called_once()

    def test_add_review_preserves_contract_but_not_process_interrupts(self):
        post = Mock()
        function = load_function('views.py', 'add_review', {
            'json': json, 'post_review': post,
            'JsonResponse': lambda value: value,
        })
        request = SimpleNamespace(user=SimpleNamespace(is_anonymous=False),
                                  body='{}')
        self.assertEqual(function(request), {'status': 200})
        post.side_effect = RuntimeError('synthetic provider failure')
        self.assertEqual(function(request)['status'], 401)
        post.side_effect = KeyboardInterrupt
        with self.assertRaises(KeyboardInterrupt):
            function(request)
        request.user.is_anonymous = True
        self.assertEqual(function(request)['status'], 403)
