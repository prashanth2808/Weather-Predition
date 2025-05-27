import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom marker icon for the map
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/148/148839.png', // Red pin
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function App() {
  const [city, setCity] = useState('Bangalore'); // Default city set to Bangalore
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [selectedDayHourly, setSelectedDayHourly] = useState([]); // State for hourly forecast of selected day
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localHour, setLocalHour] = useState(null); // Store the local hour of the city

  // Fetch weather data on component mount (page load)
  useEffect(() => {
    if (city) {
      fetchWeather();
    }
  }, []); // Empty dependency array means this runs once on mount

  const fetchWeather = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }
    setLoading(true);
    setError(null);
    setWeather(null);
    setForecast([]);
    setHourly([]);
    setSelectedDayHourly([]); // Reset hourly forecast for selected day
    setLocalHour(null); // Reset local hour
    try {
      const weatherRes = await axios.get(`http://localhost:5000/weather?city=${city}`);
      const forecastRes = await axios.get(`http://localhost:5000/forecast?city=${city}`);
      const hourlyRes = await axios.get(`http://localhost:5000/hourly?city=${city}`);
      console.log('Weather Data:', weatherRes.data);
      console.log('Forecast Data:', forecastRes.data);
      console.log('Hourly Data:', hourlyRes.data);

      // Calculate local time using the timezone offset
      const timezoneOffsetSeconds = weatherRes.data.timezone; // OpenWeatherMap provides offset in seconds
      const utcTime = new Date();
      const localTime = new Date(utcTime.getTime() + timezoneOffsetSeconds * 1000);
      const localHour = localTime.getUTCHours(); // Get the hour in the city's local time
      setLocalHour(localHour);

      setWeather(weatherRes.data);
      setForecast(forecastRes.data);
      setHourly(hourlyRes.data.slice(0, 24)); // Ensure 24 hours
    } catch (err) {
      if (err.response) {
        const errorMsg = err.response.data.error || 'Unknown error occurred';
        const details = err.response.data.details || '';
        setError(`Error: ${errorMsg}${details ? ' - ' + details : ''}`);
      } else if (err.request) {
        setError('Failed to connect to the backend server. Please ensure the backend is running at http://localhost:5000.');
      } else {
        setError('An unexpected error occurred: ' + err.message);
      }
      console.error('Error fetching weather data:', err.message);
      console.error('Error details:', err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hourly forecast for a specific day
  const fetchHourlyForecastForDay = async (date) => {
    setLoading(true);
    setError(null);
    setSelectedDayHourly([]); // Reset before fetching new data
    try {
      const response = await axios.get(`http://localhost:5000/hourly_forecast?city=${city}&date=${date}`);
      console.log('Hourly Forecast Data:', response.data);
      setSelectedDayHourly(response.data);
    } catch (err) {
      if (err.response) {
        const errorMsg = err.response.data.error || 'Unknown error occurred';
        const details = err.response.data.details || '';
        setError(`Error fetching hourly forecast: ${errorMsg}${details ? ' - ' + details : ''}`);
      } else if (err.request) {
        setError('Failed to connect to the backend server for hourly forecast.');
      } else {
        setError('An unexpected error occurred: ' + err.message);
      }
      console.error('Error fetching hourly forecast:', err.message);
      console.error('Error details:', err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  // Function to get weather icon URL based on description
  const getWeatherIcon = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear')) return 'https://openweathermap.org/img/wn/01d@2x.png';
    if (desc.includes('cloud')) return 'https://openweathermap.org/img/wn/03d@2x.png';
    if (desc.includes('rain')) return 'https://openweathermap.org/img/wn/10d@2x.png';
    if (desc.includes('snow')) return 'https://openweathermap.org/img/wn/13d@2x.png';
    if (desc.includes('thunder')) return 'https://openweathermap.org/img/wn/11d@2x.png';
    if (desc.includes('mist') || desc.includes('fog')) return 'https://openweathermap.org/img/wn/50d@2x.png';
    return 'https://openweathermap.org/img/wn/02d@2x.png';
  };

  // Determine background and weather effects based on local time and weather
  const getWeatherEffects = () => {
    // Default to system time if localHour is not yet set (before weather data is fetched)
    const hour = localHour !== null ? localHour : new Date().getHours();
    const isDayTime = hour >= 6 && hour < 18; // Day: 6 AM to 6 PM in local time
    const desc = weather ? weather.description.toLowerCase() : '';

    let bgClass;
    const isRaining = desc.includes('rain');
    const isHeavyRain = desc.includes('heavy rain');
    const isSnowing = desc.includes('snow');
    const isSunny = desc.includes('clear') && isDayTime;
    const isThunder = desc.includes('thunder');
    const isFoggy = desc.includes('mist') || desc.includes('fog');

    // Set background based on weather and local time
    if (isRaining || isThunder) {
      bgClass = isHeavyRain
        ? 'bg-gradient-to-br from-gray-800 to-gray-900' // Darker for heavy rain
        : 'bg-gradient-to-br from-gray-600 to-gray-800'; // Rainy background
    } else if (isSnowing) {
      bgClass = 'bg-gradient-to-br from-gray-300 to-gray-500'; // Snowy background
    } else if (isFoggy) {
      bgClass = 'bg-gradient-to-br from-gray-400 to-gray-600'; // Foggy background
    } else if (isSunny) {
      bgClass = 'bg-gradient-to-br from-yellow-200 to-orange-400'; // Sunny background
    } else {
      bgClass = isDayTime
        ? 'bg-gradient-to-br from-sky-300 to-sky-500' // Default day sky
        : 'bg-gradient-to-br from-indigo-950 to-black'; // Default night sky
    }

    const effects = {
      background: bgClass,
      showRain: isRaining || isThunder,
      showHeavyRain: isHeavyRain,
      showSnow: isSnowing,
      showSun: isSunny,
      showClouds: !isRaining && !isSnowing && !isFoggy && (desc.includes('cloud') || desc.includes('clear')),
      showThunder: isThunder,
      showFog: isFoggy,
      overlay: isRaining
        ? 'bg-blue-500 bg-opacity-20'
        : isSnowing
        ? 'bg-white bg-opacity-10'
        : isFoggy
        ? 'bg-gray-300 bg-opacity-30'
        : 'bg-transparent',
    };
    return effects;
  };

  const effects = getWeatherEffects();

  return (
    <div className={`min-h-screen ${effects.background} ${effects.overlay} relative overflow-hidden transition-all duration-1000 backdrop-blur-sm`}>
      {/* Stars for Night */}
      {effects.background.includes('indigo') && (
        <div className="absolute inset-0">
          {[...Array(150)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: Math.random() * 0.5 + 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* Enhanced Clouds with Density Variation */}
      {effects.showClouds && (
        <>
          {/* Dense Cloud Layer */}
          <div className="absolute top-10 left-0 animate-drift">
            <div className="relative w-48 h-24">
              <div className="absolute w-32 h-20 bg-white opacity-85 rounded-full left-0 top-0 shadow-lg" />
              <div className="absolute w-24 h-16 bg-white opacity-90 rounded-full left-20 top-2 shadow-lg" />
              <div className="absolute w-20 h-12 bg-white opacity-80 rounded-full left-8 top-4 shadow-lg" />
            </div>
          </div>
          {/* Light Cloud Layer */}
          <div className="absolute top-20 right-0 animate-drift-slow">
            <div className="relative w-56 h-28">
              <div className="absolute w-36 h-20 bg-white opacity-70 rounded-full left-0 top-0 shadow-md" />
              <div className="absolute w-28 h-16 bg-white opacity-75 rounded-full left-24 top-2 shadow-md" />
              <div className="absolute w-24 h-14 bg-white opacity-65 rounded-full left-12 top-4 shadow-md" />
            </div>
          </div>
        </>
      )}

      {/* Enhanced Rain with Layers */}
      {effects.showRain && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Background Rain (smaller, lighter) */}
          {[...Array(effects.showHeavyRain ? 150 : 100)].map((_, i) => (
            <div
              key={`bg-rain-${i}`}
              className="absolute w-1 h-4 bg-blue-200 opacity-50 animate-rain"
              style={{
                left: `${Math.random() * 100}%`,
                transform: 'rotate(20deg)',
                height: `${Math.random() * 5 + 3}px`,
                animationDuration: `${Math.random() * 1 + (effects.showHeavyRain ? 1 : 1.5)}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              <div className="absolute bottom-0 w-2 h-2 bg-blue-100 rounded-full opacity-0 animate-splash" />
            </div>
          ))}
          {/* Foreground Rain (larger, brighter) */}
          {[...Array(effects.showHeavyRain ? 75 : 50)].map((_, i) => (
            <div
              key={`fg-rain-${i}`}
              className="absolute w-1 h-6 bg-blue-400 opacity-80 animate-rain shadow-sm shadow-blue-300"
              style={{
                left: `${Math.random() * 100}%`,
                transform: 'rotate(20deg)',
                height: `${Math.random() * 8 + 5}px`,
                animationDuration: `${Math.random() * 0.8 + (effects.showHeavyRain ? 0.8 : 1)}s`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              <div className="absolute bottom-0 w-3 h-3 bg-blue-200 rounded-full opacity-0 animate-splash" />
            </div>
          ))}
        </div>
      )}

      {/* Thunder Effect */}
      {effects.showThunder && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={`thunder-${i}`}
              className="absolute w-2 h-16 bg-yellow-300 opacity-0 animate-lightning"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 20}%`,
                animationDuration: '0.1s',
                animationDelay: `${Math.random() * 5}s`,
                transform: 'rotate(30deg)',
              }}
            />
          ))}
        </div>
      )}

      {/* Snow Effect */}
      {effects.showSnow && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(200)].map((_, i) => (
            <div
              key={`snow-${i}`}
              className="absolute w-2 h-2 bg-white opacity-70 rounded-full animate-snow"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                animationDuration: `${Math.random() * 5 + 5}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Fog Effect */}
      {effects.showFog && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-full h-full bg-gray-200 opacity-40 animate-fog" />
          <div className="absolute w-full h-full bg-gray-300 opacity-30 animate-fog-slow" />
        </div>
      )}

      {/* Realistic Sun with Enhanced Flare */}
      {effects.showSun && (
        <div className="absolute top-10 right-10 w-24 h-24 animate-pulse">
          <div className="relative w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg shadow-orange-300">
            {/* Lens Flare */}
            <div className="absolute w-40 h-40 bg-yellow-200 opacity-20 rounded-full -top-8 -left-8 animate-flare" />
            <div className="absolute w-16 h-16 bg-yellow-100 opacity-30 rounded-full top-4 left-4 animate-flare-slow" />
            {/* Additional Glow */}
            <div className="absolute w-32 h-32 bg-yellow-100 opacity-15 rounded-full -top-4 -left-4 animate-glow" />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-opacity-90 bg-gray-800 text-white p-6 shadow-lg z-20 relative backdrop-blur-md">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-wide">Weather Prediction</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-6xl mx-auto relative z-10">
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
            className="border-2 border-gray-300 p-3 rounded-l-lg w-72 bg-opacity-80 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
          />
          <button
            onClick={fetchWeather}
            className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400 transition duration-300"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              'Get Weather'
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 shadow-md text-center backdrop-blur-sm bg-opacity-80 animate-fade-in">
            {error}
          </div>
        )}

        {weather ? (
          <div className="bg-white bg-opacity-20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl mb-6 transform transition-all duration-500 animate-fade-in">
            <div className="flex flex-col items-center space-y-4">
              <h2 className="text-4xl font-extrabold text-white drop-shadow-lg">{weather.city}</h2>
              <div className="flex items-center space-x-4">
                <img
                  src={getWeatherIcon(weather.description)}
                  alt="Weather icon"
                  className="w-24 h-24 drop-shadow-lg"
                />
                <p className="text-6xl font-bold text-white drop-shadow-lg">{weather.temperature}°C</p>
              </div>
              <p className="text-xl text-white capitalize drop-shadow-lg">{weather.description}</p>
              <div className="grid grid-cols-2 gap-4 text-white drop-shadow-lg">
                <p>Humidity: {weather.humidity}%</p>
                <p>Wind Speed: {weather.wind_speed} m/s</p>
                <p>Latitude: {weather.lat}</p>
                <p>Longitude: {weather.lon}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-white text-center text-lg drop-shadow-lg">Loading weather data...</p>
        )}

        {hourly.length > 0 ? (
          <div className="bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-2xl shadow-2xl mb-6 animate-fade-in">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center drop-shadow-lg">Hourly Weather (Past 12 Hours + Next 12 Hours)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {hourly.map((hour, index) => (
                <div
                  key={index}
                  className="bg-opacity-30 bg-white backdrop-blur-sm p-4 rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col items-center animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <p className="font-medium text-white drop-shadow-lg">{hour.time.split(' ')[1]}</p>
                  <p className="text-sm text-white drop-shadow-lg">{hour.time.split(' ')[0]}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${hour.icon}@2x.png`}
                    alt="Weather icon"
                    className="w-12 h-12 mb-2 drop-shadow-lg"
                  />
                  <p className="text-white drop-shadow-lg">{hour.temperature}°C</p>
                  <p className="text-white capitalize text-center drop-shadow-lg">{hour.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-white text-center text-lg drop-shadow-lg">Loading hourly weather...</p>
        )}

        {forecast.length > 0 ? (
          <div className="bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-2xl shadow-2xl mb-6 animate-fade-in">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center drop-shadow-lg">30-Day Forecast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {forecast.map((day, index) => (
                <div
                  key={index}
                  onClick={() => fetchHourlyForecastForDay(day.date)}
                  className="bg-opacity-30 bg-white backdrop-blur-sm p-4 rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col items-center animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img
                    src={getWeatherIcon(day.description)}
                    alt="Weather icon"
                    className="w-12 h-12 mb-2 drop-shadow-lg"
                  />
                  <p className="font-medium text-white drop-shadow-lg">{day.date}</p>
                  <p className="text-white drop-shadow-lg">{day.temperature}°C</p>
                  <p className="text-white capitalize text-center drop-shadow-lg">{day.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-white text-center text-lg drop-shadow-lg">Loading forecast...</p>
        )}

        {selectedDayHourly.length > 0 ? (
          <div className="bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-2xl shadow-2xl mb-6 animate-fade-in">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center drop-shadow-lg">
              Hourly Forecast for {selectedDayHourly[0].time.split(' ')[0]}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {selectedDayHourly.map((hour, index) => (
                <div
                  key={index}
                  className="bg-opacity-30 bg-white backdrop-blur-sm p-4 rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col items-center animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <p className="font-medium text-white drop-shadow-lg">{hour.time.split(' ')[1]}</p>
                  <img
                    src={`https://openweathermap.org/img/wn/${hour.icon}@2x.png`}
                    alt="Weather icon"
                    className="w-12 h-12 mb-2 drop-shadow-lg"
                  />
                  <p className="text-white drop-shadow-lg">{hour.temperature}°C</p>
                  <p className="text-white capitalize text-center drop-shadow-lg">{hour.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {weather && weather.lat && weather.lon ? (
          <div className="bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-2xl shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-semibold text-white mb-4 text-center drop-shadow-lg">Map Location</h2>
            <MapContainer
              center={[weather.lat, weather.lon]}
              zoom={10}
              style={{ height: '400px', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[weather.lat, weather.lon]} icon={customIcon} />
            </MapContainer>
          </div>
        ) : (
          <p className="text-white text-center text-lg drop-shadow-lg">Loading map...</p>
        )}
      </main>

      {/* Custom CSS for Animations */}
      <style>
        {`
          @keyframes drift {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100vw); }
          }
          @keyframes drift-slow {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100vw); }
          }
          @keyframes rain {
            0% { transform: translateY(-10vh) translateX(0); opacity: 1; }
            100% { transform: translateY(100vh) translateX(10vw); opacity: 0; }
          }
          @keyframes splash {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes snow {
            0% { transform: translateY(-10vh); opacity: 1; }
            100% { transform: translateY(100vh) translateX(${Math.random() * 20 - 10}vw); opacity: 0; }
          }
          @keyframes lightning {
            0% { opacity: 0; }
            10% { opacity: 1; }
            20% { opacity: 0; }
            100% { opacity: 0; }
          }
          @keyframes fog {
            0% { transform: translateX(-10%); opacity: 0.4; }
            50% { transform: translateX(10%); opacity: 0.6; }
            100% { transform: translateX(-10%); opacity: 0.4; }
          }
          @keyframes fog-slow {
            0% { transform: translateX(10%); opacity: 0.3; }
            50% { transform: translateX(-10%); opacity: 0.5; }
            100% { transform: translateX(10%); opacity: 0.3; }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes flare {
            0% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.2); opacity: 0.4; }
            100% { transform: scale(1); opacity: 0.2; }
          }
          @keyframes flare-slow {
            0% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.3); opacity: 0.5; }
            100% { transform: scale(1); opacity: 0.3; }
          }
          @keyframes glow {
            0% { transform: scale(1); opacity: 0.15; }
            50% { transform: scale(1.1); opacity: 0.25; }
            100% { transform: scale(1); opacity: 0.15; }
          }
          @keyframes twinkle {
            0% { opacity: 0.2; }
            50% { opacity: 1; }
            100% { opacity: 0.2; }
          }
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-drift {
            animation: drift 15s linear infinite;
          }
          .animate-drift-slow {
            animation: drift-slow 25s linear infinite;
          }
          .animate-rain {
            animation: rain 1.5s linear infinite;
          }
          .animate-splash {
            animation: splash 0.5s ease-out infinite;
            animation-delay: 1.5s;
          }
          .animate-snow {
            animation: snow 10s linear infinite;
          }
          .animate-lightning {
            animation: lightning 5s ease-in-out infinite;
          }
          .animate-fog {
            animation: fog 20s ease-in-out infinite;
          }
          .animate-fog-slow {
            animation: fog-slow 30s ease-in-out infinite;
          }
          .animate-pulse {
            animation: pulse 3s ease-in-out infinite;
          }
          .animate-flare {
            animation: flare 4s ease-in-out infinite;
          }
          .animate-flare-slow {
            animation: flare-slow 5s ease-in-out infinite;
          }
          .animate-glow {
            animation: glow 6s ease-in-out infinite;
          }
          .animate-twinkle {
            animation: twinkle 2s ease-in-out infinite;
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}

export default App;