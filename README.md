# Habit Tracker

A small, dependency-free habit tracker. Add habits, tick them off each day, and watch your streaks grow.

## Features

- Add and delete habits
- One-tap check-off for today
- 7-day strip per habit; tap any day to fix a missed entry
- Current and best streak
- Daily progress summary
- Light and dark mode
- Export your data as JSON

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Data

Everything is saved in your browser's `localStorage` under the key `habit-tracker:v1`. Nothing is sent anywhere. Clearing site data removes your habits, so use **Export** to keep a backup.
