#  RemoteBuddy — Control Your PC from Your Phone

RemoteBuddy is a React Native + Flask system that lets you securely control your Windows computer 
from your iPhone over Wi-Fi or the internet using Ngrok.
 
#  Features

 -  Touchpad-style mouse control with drag + click
-  Live screen of your desktop
 -  Remote text input and key pressing
 -  Volume control (up/down/mute)
 -  File browsing, uploading, and downloading
 -  Secure access via bearer token
 -  Multi-page mobile UI with clean navigation
 
 ---
 
#  Setup Instructions
 
  Backend (Flask - Python)
 
 1. Install dependencies:
    pip install flask pyautogui psutil pillow
 
 2. Run the backend server:
    python backend.py

 3. (Optional) Expose it publicly via Ngrok:
    ngrok http 5000
 4. Copy your HTTPS Ngrok URL (e.g., https://abc123.ngrok-free.app)
 
 ---
 
#  Mobile App (React Native via Expo)
 
 1. Install Expo CLI if not installed:
    npm install -g expo-cli
 
 2. Run the app:
    expo start
 
 3. Open the Expo Go app on your iPhone to scan the QR code.
 
 4. On first screen, enter your Ngrok domain and auth token (secret123 by default).
 
 ---

 
# Security
 
 All requests are authenticated using a simple Bearer token (secret123 by default).  
 Set a strong token and keep it secret if you're exposing your Ngrok tunnel publicly.
 

 ---

#  License

 This project is licensed under the MIT License.
 


