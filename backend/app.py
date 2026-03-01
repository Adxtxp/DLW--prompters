from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows your frontend to talk to this backend

@app.route('/')
def home():
    return jsonify({"message": "Backend is running successfully!", "status": "online"})

if __name__ == '__main__':
    # Running on port 5000 is standard for Flask
    app.run(debug=True, port=5000)
