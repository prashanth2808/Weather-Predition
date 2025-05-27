from flask import Flask, request, jsonify
import requests
from datetime import datetime, timedelta
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

API_KEY = "5c166f636f6e4aa493e3bf90de8e066a"

@app.route('/')
def home():
    return jsonify({"message": "Weather API is running! Use /weather or /forecast endpoints."})

@app.route('/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter is required"}), 400

    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({"error": "City not found"}), 404

    data = response.json()
    weather_data = {
        "city": data["name"],
        "temperature": data["main"]["temp"],
        "description": data["weather"][0]["description"],
        "humidity": data["main"]["humidity"],
        "wind_speed": data["wind"]["speed"],
        "lat": data["coord"]["lat"],
        "lon": data["coord"]["lon"]
    }
    return jsonify(weather_data)

@app.route('/forecast', methods=['GET'])
def get_forecast():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter is required"}), 400

    url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({"error": "City not found"}), 404

    data = response.json()
    forecast_list = []
    for i in range(5):
        day_data = data["list"][i * 8]
        forecast_list.append({
            "date": day_data["dt_txt"].split()[0],
            "temperature": day_data["main"]["temp"],
            "description": day_data["weather"][0]["description"]
        })

    # Repeat the 5 days to simulate 30 days
    extended_forecast = []
    for i in range(30):
        extended_forecast.append(forecast_list[i % 5])
        extended_forecast[-1]["date"] = (datetime.strptime(extended_forecast[-1]["date"], "%Y-%m-%d") + timedelta(days=i // 5)).strftime("%Y-%m-%d")

    return jsonify(extended_forecast)

if __name__ == '__main__':
    app.run(debug=True)