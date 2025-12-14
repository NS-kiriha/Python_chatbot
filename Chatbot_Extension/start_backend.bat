@echo off
echo Installing Python dependencies...
pip install -r requirements.txt

echo Downloading NLTK data...
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords'); nltk.download('wordnet')"

echo Starting Flask backend on port 5201...
cd backend
python app.py
