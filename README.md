# MSCP

MSCP is a simple, organized web app for a competitive programming study plan based on Dr. Mostafa Saad's roadmap. The goal is to provide a more practical and clearer alternative to traditional Excel sheets, combining structure, progress tracking, and an interactive experience in one place.

The site connects the learning roadmap, topic ordering, and problem lists organized by phase and difficulty, with automatic saving of solved problems, progress tracking, a daily streak counter, and celebratory effects when you complete a problem.

## Idea

The main idea is to turn the CP roadmap into a smooth and focused learning experience:

- The home page presents the entire plan in clear phases.
- Each phase contains topics arranged in the right learning order.
- Every topic page contains problems linked to the original source, with difficulty and progress information.
- Users can mark solved problems, and the site keeps that state locally in the browser.

## Features

- A phase-based roadmap instead of an unstructured list.
- Separate pages for each topic in the roadmap.
- Direct links to the corresponding YouTube playlists.
- Direct links to the original problem sources.
- Problem difficulty classification: Easy / Medium / Hard.
- Display of each problem's level and tags.
- Solved problems are stored in `localStorage`.
- A progress bar for each topic and an overall progress summary on the home page.
- A global daily streak counter.
- A celebration effect with confetti and a simple sound when a new problem is solved.
- Problem filtering by difficulty on each topic page.
- Good support for mobile and smaller screens.

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Python for generating pages and data from the sheet
- Google Sheets as the main data source
- `localStorage` for saving progress and solved problems
- Canvas Confetti for completion effects
- Web Audio API for a simple victory sound
- Google Fonts for improved typography

## How It Works

The project is completely static and has no backend. The workflow is based on a Google Sheet, then:

1. Problem data is extracted from the sheet.
2. The final data file is generated in `assets/topics-data.js`.
3. Topic pages are generated inside the `pages/` folder.
4. The home page and topic files read from `topics-data.js`.
5. Progress and solved state are stored locally in the browser.

## Project Structure

- `index.html` the home page for the roadmap.
- `assets/home.css` styling for the home page.
- `assets/home.js` logic for counters and progress bars on the home page.
- `assets/topic-page.css` styling for topic pages.
- `assets/topic-page.js` logic for topic pages, filtering, and local storage.
- `assets/topics-data.js` generated data from the sheet.
- `pages/` topic pages.
- `scripts/build_topics_from_sheet.py` fetches sheet data and builds the data file.
- `scripts/gen_topic_pages.py` generates topic pages automatically.

## Roadmap Phases

1. Foundations
2. Core topics
3. Advanced topics
4. Practice & contests

## Running the Project

The project uses static files, so you can open `index.html` directly or run it with Live Server or any simple local server.

Example:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Updating Data and Pages

If the Google Sheet changes or you want to regenerate the content, run the scripts in the `scripts/` folder:

- `build_topics_from_sheet.py` to update the data file.
- `gen_topic_pages.py` to regenerate the topic pages.

## Notes

- Progress is stored in the browser itself, so it may differ across devices or after clearing site data.
- The site is meant to be a learning and organization tool for the CP roadmap, not a replacement for the educational content itself.

## License

This is a personal project designed to organize the competitive programming learning journey according to Dr. Mostafa Saad's roadmap.
