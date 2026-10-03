#!/usr/bin/env python3
from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

_ALLOWED = {"/api/integrations/podium/catalog/v1/vehicles"}
_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


class Handler(BaseHTTPRequestHandler):
    upstream: str

    def log_message(self, fmt: str, *args: object) -> None:
        print("public-staging-proxy:", fmt % args, flush=True)

    def do_GET(self) -> None:
        if self.path == "/healthz":
            body = b"ok\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_error(404)

    def do_POST(self) -> None:
        if self.path not in _ALLOWED:
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length)
        headers = {}
        for name in ("Accept", "Authorization", "Content-Type"):
            value = self.headers.get(name)
            if value:
                headers[name] = value
        request = Request(
            self.upstream + self.path,
            data=body,
            method="POST",
            headers=headers,
        )
        try:
            with urlopen(request, timeout=20) as response:
                payload = response.read()
                self.send_response(response.status)
                for name, value in response.headers.items():
                    if name.casefold() not in _HOP_BY_HOP and name.casefold() != "content-length":
                        self.send_header(name, value)
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except HTTPError as exc:
            payload = exc.read()
            self.send_response(exc.code)
            self.send_header("Content-Type", exc.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except URLError as exc:
            self.send_error(502, explain=str(exc.reason))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--listen", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=5111)
    parser.add_argument("--upstream", default="http://127.0.0.1:5110")
    args = parser.parse_args()

    Handler.upstream = args.upstream.rstrip("/")
    server = ThreadingHTTPServer((args.listen, args.port), Handler)
    server.serve_forever()


if __name__ == "__main__":
    main()
