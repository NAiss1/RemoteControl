from flask import Flask, request, jsonify, send_from_directory
import pyautogui
import os
import psutil



app = Flask(__name__)

# Configuration
SHARED_FOLDER = os.path.expanduser("C:/Users/nurma/Downloads")  # <- CHANGE THIS
AUTH_TOKEN = "secret123"  # Simple Bearer token

# Authenticate requests
from flask import g

@app.before_request
def authenticate():
    if request.endpoint in ['download_any']:
        return  # Skip auth for public routes

    token = request.headers.get("Authorization")
    if token != f"Bearer {AUTH_TOKEN}":
        return jsonify({"error": "Unauthorized"}), 401

@app.route('/')
def index():
    return 'RemoteBuddy server is running!'

@app.route('/move_mouse', methods=['POST'])
def move_mouse():
    x = request.json.get('x')
    y = request.json.get('y')
    pyautogui.moveTo(x, y)
    return jsonify({'status': 'mouse moved'})

@app.route('/click', methods=['POST'])
def click():
    pyautogui.click()
    return jsonify({'status': 'clicked'})

@app.route('/type', methods=['POST'])
def type_text():
    text = request.json.get('text')
    pyautogui.write(text)
    return jsonify({'status': 'typed', 'text': text})

@app.route('/press', methods=['POST'])
def press_key():
    key = request.json.get('key')  # e.g. "enter", "tab", "ctrl"
    pyautogui.press(key)
    return jsonify({'status': 'pressed', 'key': key})

@app.route('/volume', methods=['POST'])
def volume():
    direction = request.json.get('direction')
    if direction == 'up':
        pyautogui.press('volumeup')
    elif direction == 'down':
        pyautogui.press('volumedown')
    elif direction == 'mute':
        pyautogui.press('volumemute')
    return jsonify({'status': 'volume changed'})

@app.route('/status', methods=['GET'])
def status():
    battery = psutil.sensors_battery()
    return jsonify({
        'battery_percent': battery.percent,
        'plugged_in': battery.power_plugged
    })

@app.route('/shutdown', methods=['POST'])
def shutdown():
    os.system("shutdown /s /t 1")
    return jsonify({'status': 'shutting down'})

@app.route('/files', methods=['GET'])
def list_files():
    files = os.listdir(SHARED_FOLDER)
    return jsonify(files)
@app.route('/download/<path:filename>', methods=['GET'])
def download_file(filename):
    safe_path = os.path.abspath(os.path.join(SHARED_FOLDER, filename))
    if not safe_path.startswith(SHARED_FOLDER):
        return abort(403)
    return send_from_directory(SHARED_FOLDER, filename, as_attachment=True)

@app.route('/move_mouse_relative', methods=['POST'])
def move_mouse_relative():
    dx = request.json.get('dx', 0)
    dy = request.json.get('dy', 0)
    pyautogui.moveRel(dx, dy)
    return jsonify({'status': 'moved', 'dx': dx, 'dy': dy})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    file.save(os.path.join(SHARED_FOLDER, file.filename))
    return jsonify({'status': 'uploaded', 'filename': file.filename})
from flask import send_file
from PIL import ImageGrab
import io

import base64

@app.route('/screenshot', methods=['GET'])
def screenshot():
    screenshot = ImageGrab.grab()
    buf = io.BytesIO()
    screenshot.save(buf, format='JPEG')
    buf.seek(0)
    encoded_image = base64.b64encode(buf.read()).decode('utf-8')
    return jsonify({"image": encoded_image})
import os
from flask import jsonify

@app.route('/file_tree', methods=['GET'])
def file_tree():
    def walk_directory(directory):
        file_list = []
        for root, _, files in os.walk(directory):
            for file in files:
                rel_path = os.path.relpath(os.path.join(root, file), SHARED_FOLDER)
                file_list.append(rel_path.replace("\\", "/"))
        return file_list

    return jsonify(walk_directory(SHARED_FOLDER))
@app.route('/browse', methods=['GET'])
def browse():
    sub_path = request.args.get('path', '')
    abs_path = os.path.abspath(os.path.join(SHARED_FOLDER, sub_path))

    # Normalize and validate
    if not os.path.commonpath([SHARED_FOLDER, abs_path]).startswith(os.path.commonpath([SHARED_FOLDER])):
        return jsonify({"error": "Access denied"}), 403

    if not os.path.isdir(abs_path):
        return jsonify({"error": "Not a directory"}), 400

    items = []
    for name in os.listdir(abs_path):
        full_path = os.path.join(abs_path, name)
        items.append({
            "name": name,
            "is_dir": os.path.isdir(full_path)
        })

    return jsonify({
        "current_path": os.path.relpath(abs_path, SHARED_FOLDER).replace("\\", "/"),
        "items": items
    })

@app.route('/download_any', methods=['GET'])
def download_any():
    rel_path = request.args.get('path', '')
    abs_path = os.path.abspath(os.path.join(SHARED_FOLDER, rel_path))
    if not os.path.commonpath([SHARED_FOLDER, abs_path]).startswith(os.path.commonpath([SHARED_FOLDER])):

        return jsonify({"error": "Access denied"}), 403
    if not os.path.isfile(abs_path):
        return jsonify({"error": "Not a file"}), 400
    return send_file(abs_path, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
