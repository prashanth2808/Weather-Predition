Weather Prediction Web Application
A dynamic full-stack web application that provides real-time weather updates, hourly forecasts, and a 30-day forecast for any city, with an immersive UI that adapts to local time and weather conditions.

Features
Displays current weather (temperature, humidity, wind speed, description) for any city using the OpenWeatherMap API.
Provides hourly weather forecasts (past 12 hours + next 12 hours) and a simulated 30-day forecast.
Interactive 30-day forecast with clickable days to view detailed hourly data.
Integrates a Leaflet.js map to show the city's location based on coordinates.
Dynamic background effects (e.g., rain, snow, sunny, fog, thunder) based on the city's local time and weather conditions.
Smooth animations for weather effects like falling rain, twinkling stars, and a glowing sun.
Responsive design optimized for all devices using Tailwind CSS.
Technologies Used
Frontend: React.js, Tailwind CSS, Axios, Leaflet.js
Backend: Flask (Python)
API: OpenWeatherMap API
Other: CSS animations, Git for version control
Installation
Prerequisites
Node.js and npm installed
Python 3.x installed
An OpenWeatherMap API key (sign up at https://openweathermap.org/)
Steps
$ git clone https://github.com/your-username/weather-prediction-web-app.git
$ cd weather-prediction-web-app

Backend Setup
$ cd backend
$ pip install -r requirements.txt
$ set OPENWEATHER_API_KEY=your-api-key  # On Windows
$ export OPENWEATHER_API_KEY=your-api-key  # On Linux/Mac
$ python app.py

Frontend Setup
$ cd ../frontend
$ npm install
$ npm start

Access the App
Open your browser and go to http://localhost:3000.
The backend should be running on http://localhost:5000.
Usage
Enter a city name in the search bar and click "Get Weather" to fetch data.
Click on any day in the 30-day forecast to view its hourly breakdown.
The background and weather effects update dynamically based on the city's local time and conditions.
Project Structure
$ tree weather-prediction-web-app/
weather-prediction-web-app/
├── backend/          # Flask backend with API routes
│   ├── app.py        # Main backend file
│   └── requirements.txt
├── frontend/         # React frontend
│   ├── src/
│   │   ├── App.js    # Main React component
│   │   └── ...       # Other React files
│   ├── package.json
│   └── ...
├── README.md         # This file

Contributing
Feel free to fork this repository, submit issues, or create pull requests to improve the project. Contributions are welcome!

License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments
Weather data provided by OpenWeatherMap.
Map integration using Leaflet.js.
Inspiration from modern weather app designs and animations.
