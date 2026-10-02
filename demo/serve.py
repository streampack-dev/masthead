"""The demo's server (`just demo`): the repository as it is, on port 8642, never cached.

Plain `python3 -m http.server` sends no Cache-Control, so a browser keeps the animations it
imported earlier, and a reload can show yesterday's code. Here every answer says no-store.
"""
import http.server
import sys


class NoStore(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8642
    print(f"The demo: http://localhost:{port}/")
    http.server.ThreadingHTTPServer(("", port), NoStore).serve_forever()
