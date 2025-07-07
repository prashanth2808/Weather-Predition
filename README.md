# Weather‑Predition

A Python‑based weather prediction application that trains a regression model on historical weather data and provides easy-to-use interfaces (CLI and web) for forecasting future temperature and conditions.

---

## 🔍 Table of Contents

1. [Features](#-features)  
2. [Tech Stack](#-tech-stack)  
3. [Getting Started](#-getting-started)  
   - [Prerequisites](#prerequisites)  
   - [Installation](#installation)  
4. [Usage](#-usage)  
   - [Training the Model](#training-the-model)  
   - [Making Predictions](#making-predictions)  
   - [Running the Web App](#running-the-web-app)  
5. [Project Structure](#-project-structure)  
6. [Future Improvements](#-future-improvements)  
7. [License](#-license)  
8. [Contact](#-contact)  

---

## ⭐ Features

- **Data Ingestion & Preprocessing**  
  Load historical weather datasets, clean missing values, engineer relevant features (e.g., humidity, wind speed).

- **Model Training**  
  Train and compare regression models (Linear Regression, Random Forest, etc.) to optimize forecast accuracy.

- **Evaluation Metrics**  
  Calculate MAE, RMSE and \(R^2\) to assess model performance.

- **Prediction Interfaces**  
  - **CLI**: Quickly get forecasts from the terminal.  
  - **Web**: Interactive dashboard built with Streamlit (or Flask) for visual forecasts.

---

## 🛠️ Tech Stack

- **Python** 3.8+  
- **pandas**, **numpy** — data handling  
- **scikit-learn** — model training & evaluation  
- **matplotlib**, **seaborn** — exploratory plots  
- **Streamlit** (or **Flask**) — web application  
- **Git** & **GitHub** — version control & hosting  

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher  
- Git  

### Installation

```bash
# 1. Clone this repo
git clone https://github.com/prashanth2808/Weather-Predition.git
cd Weather-Predition

# 2. Create a virtual environment & activate it
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
