# Django runtime configuration

Set `DJANGO_SECRET_KEY` to a locally generated secret before starting Django.
There is no source-code fallback. Do not commit the value or put it in logs.

- `DJANGO_DEBUG`: defaults to `false`; `true` is for local debugging only.
- `DJANGO_ALLOWED_HOSTS`: comma-separated hosts; defaults to `localhost,127.0.0.1`.
- `DJANGO_CSRF_TRUSTED_ORIGINS`: comma-separated scheme-qualified origins;
  defaults to an empty list. The former individual lab URL is no longer trusted.

The previously committed Django key must be rotated wherever it was reused.
Removing its literal from current source does not erase Git history. The owner
should assess history exposure and existing sessions. No deployed credentials,
sessions, database or provider were accessed or changed by this repair.

This does not complete an authentication/CSRF deployment review: the existing
middleware, exempt endpoints, broad CORS policy and review authorization still
need review before public use.

Offline configuration checks require only Python, with no Django/DB startup:

```sh
python -m unittest discover -s tests -v
```
