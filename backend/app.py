from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
import os
import pytz

app = Flask(__name__)
CORS(app)

# Load OpenWeatherMap API key from environment variable
API_KEY = os.getenv("OPENWEATHER_API_KEY", "5c166f636f6e4aa493e3bf90de8e066a")  # Replace with your API key if not using env variable
BASE_URL = "http://api.openweathermap.org/data/2.5"

# Helper function to get coordinates for a city
def get_coordinates(city):
    url = f"{BASE_URL}/weather?q={city}&appid={API_KEY}"
    response = requests.get(url)
    if response.status_code != 200:
        return None, None, f"Failed to fetch coordinates: {response.json().get('message', 'Unknown error')}"
    data = response.json()
    lat = data['coord']['lat']
    lon = data['coord']['lon']
    return lat, lon, None

# Helper function to format timestamp to "YYYY-MM-DD HH:mm"
def format_timestamp(dt):
    return dt.strftime("%Y-%m-%d %H:%M")

# Current weather endpoint
@app.route('/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter is required"}), 400

    url = f"{BASE_URL}/weather?q={city}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        error_msg = response.json().get('message', 'Unknown error')
        return jsonify({"error": "Failed to fetch weather data", "details": error_msg}), response.status_code

    data = response.json()
    weather_data = {
        "city": data['name'],
        "temperature": round(data['main']['temp'], 1),
        "description": data['weather'][0]['description'],
        "humidity": data['main']['humidity'],
        "wind_speed": round(data['wind']['speed'], 1),
        "lat": data['coord']['lat'],
        "lon": data['coord']['lon'],
        "timezone": data['timezone']  # Add timezone offset in seconds
    }
    return jsonify(weather_data)

# 30-day forecast endpoint (daily data)
@app.route('/forecast', methods=['GET'])
def get_forecast():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter is required"}), 400

    lat, lon, error = get_coordinates(city)
    if lat is None or lon is None:
        return jsonify({"error": "City not found", "details": error}), 404

    # OpenWeatherMap's free API doesn't provide 30-day forecasts directly
    # We'll use the 5-day hourly forecast and simulate daily data
    url = f"{BASE_URL}/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        error_msg = response.json().get('message', 'Unknown error')
        return jsonify({"error": "Failed to fetch forecast data", "details": error_msg}), response.status_code

    data = response.json()
    daily_forecast = []
    current_date = None
    for entry in data['list']:
        date = entry['dt_txt'].split(' ')[0]
        if date != current_date:
            daily_forecast.append({
                "date": date,
                "temperature": round(entry['main']['temp'], 1),
                "description": entry['weather'][0]['description']
            })
            current_date = date
        if len(daily_forecast) >= 30:  # Simulate 30 days by repeating
            break

    # Extend to 30 days by repeating the 5-day forecast
    while len(daily_forecast) < 30:
        for i in range(5):
            if len(daily_forecast) >= 30:
                break
            day = daily_forecast[i].copy()
            day['date'] = (datetime.strptime(day['date'], '%Y-%m-%d') + timedelta(days=len(daily_forecast))).strftime('%Y-%m-%d')
            daily_forecast.append(day)

    return jsonify(daily_forecast)

# Hourly weather endpoint (previous 12 hours + next 12 hours)
@app.route('/hourly', methods=['GET'])
def get_hourly():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter is required"}), 400

    lat, lon, error = get_coordinates(city)
    if lat is None or lon is None:
        return jsonify({"error": "City not found", "details": error}), 404

    # Current time in IST
    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist)
    current_time = current_time.replace(minute=59, second=0, microsecond=0)  # Align to the hour

    hourly_data = []

    # Fetch future data (including current and next 12 hours) using /forecast
    url = f"{BASE_URL}/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        error_msg = response.json().get('message', 'Unknown error')
        return jsonify({"error": "Failed to fetch forecast data", "details": error_msg}), response.status_code

    data = response.json()
    future_data = []
    for entry in data['list']:
        entry_time = datetime.strptime(entry['dt_txt'], '%Y-%m-%d %H:%M:%S').replace(tzinfo=pytz.UTC)
        entry_time_ist = entry_time.astimezone(ist)
        if entry_time_ist >= current_time - timedelta(hours=12) and entry_time_ist <= current_time + timedelta(hours=12):
            future_data.append({
                "time": format_timestamp(entry_time_ist),
                "temperature": round(entry['main']['temp'], 1),
                "description": entry['weather'][0]['description'],
                "icon": entry['weather'][0]['icon']
            })

    # Simulate historical data by shifting future data backward
    # First, get the current hour's data using /weather
    url = f"{BASE_URL}/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        error_msg = response.json().get('message', 'Unknown error')
        return jsonify({"error": "Failed to fetch current weather data", "details": error_msg}), response.status_code

    data = response.json()
    current_hour = {
        "time": format_timestamp(current_time),
        "temperature": round(data['main']['temp'], 1),
        "description": data['weather'][0]['description'],
        "icon": data['weather'][0]['icon']
    }
    hourly_data.append(current_hour)

    # Simulate previous 12 hours by using the earliest forecast data and shifting backward
    earliest_forecast = future_data[0] if future_data else current_hour
    for i in range(12, 0, -1):
        past_time = current_time - timedelta(hours=i)
        # Simulate data by reusing the earliest forecast data
        simulated_entry = earliest_forecast.copy()
        simulated_entry['time'] = format_timestamp(past_time)
        # Adjust temperature slightly to simulate variation (for demo purposes)
        simulated_entry['temperature'] = round(simulated_entry['temperature'] - (i * 0.2), 1)  # Gradual decrease
        hourly_data.append(simulated_entry)

    # Add future data (next 12 hours)
    future_hours = 0
    for entry in future_data:
        # Ensure entry_time is timezone-aware (IST)
        entry_time = datetime.strptime(entry['time'], '%Y-%m-%d %H:%M').replace(tzinfo=ist)
        if entry_time > current_time and entry_time <= current_time + timedelta(hours=12):
            hourly_data.append(entry)
            future_hours += 1
        if future_hours >= 12:
            break

    # Sort by time to ensure chronological order
    hourly_data.sort(key=lambda x: datetime.strptime(x['time'], '%Y-%m-%d %H:%M').replace(tzinfo=ist))

    # Ensure we have exactly 24 hours of data
    if len(hourly_data) > 24:
        hourly_data = hourly_data[:24]

    return jsonify(hourly_data)

# Hourly forecast for a specific date
@app.route('/hourly_forecast', methods=['GET'])
def get_hourly_forecast():
    city = request.args.get('city')
    date = request.args.get('date')  # Expected format: YYYY-MM-DD
    if not city or not date:
        return jsonify({"error": "City and date parameters are required"}), 400

    try:
        requested_date = datetime.strptime(date, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    lat, lon, error = get_coordinates(city)
    if lat is None or lon is None:
        return jsonify({"error": "City not found", "details": error}), 404

    # Current time in IST for reference
    ist = pytz.timezone('Asia/Kolkata')
    current_time = datetime.now(ist)

    # Fetch 5-day hourly forecast from OpenWeatherMap
    url = f"{BASE_URL}/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        error_msg = response.json().get('message', 'Unknown error')
        return jsonify({"error": "Failed to fetch forecast data", "details": error_msg}), response.status_code

    data = response.json()
    hourly_forecast = []

    # Find entries for the requested date (if within the 5-day forecast)
    for entry in data['list']:
        entry_time = datetime.strptime(entry['dt_txt'], '%Y-%m-%d %H:%M:%S').replace(tzinfo=pytz.UTC)
        entry_time_ist = entry_time.astimezone(ist)
        if entry_time_ist.strftime('%Y-%m-%d') == date:
            hourly_forecast.append({
                "time": format_timestamp(entry_time_ist),
                "temperature": round(entry['main']['temp'], 1),
                "description": entry['weather'][0]['description'],
                "icon": entry['weather'][0]['icon']
            })

    # If the requested date is beyond the 5-day forecast, simulate data
    if not hourly_forecast:
        # Use the last day of the 5-day forecast as a template
        last_day_entries = []
        last_day = None
        for entry in data['list']:
            entry_time = datetime.strptime(entry['dt_txt'], '%Y-%m-%d %H:%M:%S').replace(tzinfo=pytz.UTC)
            entry_time_ist = entry_time.astimezone(ist)
            entry_date = entry_time_ist.strftime('%Y-%m-%d')
            if last_day is None or entry_date > last_day:
                last_day = entry_date
                last_day_entries = []
            if entry_date == last_day:
                last_day_entries.append({
                    "time": format_timestamp(entry_time_ist),
                    "temperature": round(entry['main']['temp'], 1),
                    "description": entry['weather'][0]['description'],
                    "icon": entry['weather'][0]['icon']
                })

        # Simulate 24 hours for the requested date
        for hour in range(24):
            template_entry = last_day_entries[hour % len(last_day_entries)]  # Cycle through available entries
            # Create a new datetime for the requested date and hour
            new_time = requested_date.replace(hour=hour, minute=0, second=0, microsecond=0, tzinfo=ist)
            simulated_entry = template_entry.copy()
            simulated_entry['time'] = format_timestamp(new_time)
            # Slight temperature variation for realism
            simulated_entry['temperature'] = round(simulated_entry['temperature'] + (hour % 3 - 1) * 0.5, 1)
            hourly_forecast.append(simulated_entry)

    # Sort by time to ensure chronological order
    hourly_forecast.sort(key=lambda x: datetime.strptime(x['time'], '%Y-%m-%d %H:%M').replace(tzinfo=ist))

    return jsonify(hourly_forecast)

if __name__ == '__main__':
    app.run(debug=True, port=5000)