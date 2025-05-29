import os
import mimetypes
from flask import Flask, send_file, abort, make_response
from flask_caching import Cache
from io import BytesIO

app = Flask(
    __name__,
    static_folder="../static/",
    static_url_path=''      
)

# configure a simple in-memory cache
cache = Cache(app, config={
    "CACHE_TYPE": "SimpleCache",   # for production use RedisCache or MemcachedCache
    "CACHE_DEFAULT_TIMEOUT": 3600  # one hour
})

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'assets')


@cache.memoize()
def load_image(filename):
    """
    Read the file once and stash its bytes in cache.
    Subsequent calls with the same filename return the in-memory copy.
    """
    path = os.path.join(ASSETS_DIR, filename)
    if not os.path.isfile(path):
        return None, None
    mime_type, _ = mimetypes.guess_type(path)
    with open(path, 'rb') as f:
        data = f.read()
    return data, mime_type or 'application/octet-stream'


@app.route('/assets/<path:filename>')
def assets(filename):
    """
    Serves anything under /assets/ by looking it up in static/assets.
    First request → load_image reads from disk + caches.
    Later requests → served from cache.
    """
    data, mime_type = load_image(filename)
    if data is None:
        return abort(404)
    # wrap bytes in a BytesIO so send_file works
    buf = BytesIO(data)
    resp = make_response(send_file(buf, mimetype=mime_type))
    # you can still add Cache-Control for browsers if you like:
    resp.headers['Cache-Control'] = 'public, max-age=3600'
    return resp


# your existing API & HTML routes…
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return app.send_static_file(filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
