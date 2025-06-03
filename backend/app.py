import os
import mimetypes
from flask import Flask, request, redirect, abort, make_response, url_for
from flask_caching import Cache
from io import BytesIO
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

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

@app.route('/contact', methods=['POST'])
def handle_contact():
    # Read form fields
    name    = request.form.get('name', '').strip()
    email   = request.form.get('email', '').strip()
    message = request.form.get('message', '').strip()

    # Basic sanity check
    if not name or not email or not message:
        return abort(400, description="All fields are required.")

    # Construct the email
    msg = EmailMessage()
    msg['Subject'] = f"New Contact Form Submission from {name}"
    msg['From']    = os.environ.get('SMTP_USER')
    msg['To']      = os.environ.get('RECIPIENT_EMAIL')
    msg.set_content(
        f"You have a new contact form submission:\n\n"
        f"Name: {name}\n"
        f"Email: {email}\n\n"
        f"Message:\n{message}\n"
    )

    # Send via SMTP
    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_user = os.getenv('SMTP_USER')
    smtp_pass = os.getenv('SMTP_PASS')

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
    except Exception as e:
        # In production, log this exception
        return abort(500, description=f"Failed to send email: {e}")

    # Redirect back to a “thank you” location or simply back to /contact
    return redirect(url_for('static_files', filename='contact.html') + "?sent=1")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
