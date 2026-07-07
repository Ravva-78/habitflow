# HabitFlow 🚀

HabitFlow is a gamified productivity and habit-tracking mobile application designed specifically for students. It transforms mundane daily routines into engaging "quests," encouraging consistency through an XP and leveling system, while also tracking deep work focus sessions and weekly reflections.

## ✨ Features

- **Gamified Daily Quests:** Complete daily habits to earn XP, level up, and maintain streaks. Bonus multipliers are awarded for 3-day and 7-day consistency!
- **Productivity Radar:** A dynamic pentagon radar chart that visualizes your balance across Mind, Body, Study, Rest, and Focus categories.
- **Face-Down Focus Timer:** A Pomodoro-style focus timer that uses the device accelerometer to detect when the phone is face down, enforcing distraction-free study sessions. Lifting the phone triggers a 10-second warning!
- **Study & Exam Tracker:** Keep a log of study hours grouped by subjects, and track upcoming exam dates with urgency badges.
- **Weekly Reviews & Journaling:** Reflect on your wins and challenges with guided journaling prompts, and review your weekly consistency grids.
- **Interactive UI:** Smooth, native "glass" layout animations and spring-based progress bars powered by React Native Reanimated.

## 🛠️ Tech Stack

- **Framework:** React Native / Expo
- **State Management:** Zustand (with asynchronous persistence)
- **Animations:** React Native Reanimated
- **Storage:** Local AsyncStorage (via Zustand `persist` middleware)
- **Date Utilities:** `date-fns`

## 🚀 Running Locally

1. **Install Dependencies**
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```

2. **Start the Application**
   ```bash
   npx expo start
   ```

3. **View the App**
   - **Mobile:** Download the **Expo Go** app on your iOS or Android device and scan the QR code in the terminal.
   - **Web:** Press `w` in the terminal to view the application directly in your computer's web browser.

## 📸 Screenshots & Showcase
*(Add screenshots or GIFs of your app here!)*

## 📄 License
This project is for educational and portfolio purposes.
