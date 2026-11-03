# Reproduce lint checks

Python 3.12 and Node 22 match the workflow. The lint tools are pinned separately
from application dependencies; installing them does not start Django, MongoDB
or any external provider.

```sh
python -m pip install -r .github/lint/requirements.txt
npm ci --prefix .github/lint --ignore-scripts --no-audit --no-fund
git ls-files -z -- '*.py' | xargs -0 python -m flake8
git ls-files -z -- 'server/database/*.js' 'server/database/*.cjs' | xargs -0 .github/lint/node_modules/.bin/jshint --config server/database/.jshintrc
python -m unittest discover -s tests -v
npm test --prefix server/database
```

Every tracked Python file and database JavaScript source/test is checked.
JSHint targets the ES2020 syntax used by the Node service and rejects undefined
variables. No lint rules or files are ignored to make CI pass. Python formatting
preserves the AST, except for reviewed removal of unused imports/locals and
explicit error boundaries: missing users may be registered, other database
failures propagate, and process interrupts are not swallowed.

The offline regressions use source functions and module doubles. They verify
error handling, request isolation, configuration and safe database startup; they
do not establish full Django/React integration or production readiness.
