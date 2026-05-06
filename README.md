# Dr Mostafa Saad CP Roadmap

A structured, interactive roadmap for learning Competitive Programming based on Dr. Mostafa Saad's plan.

Live Demo: https://cp-roadmap.netlify.app/

## Overview

This project turns a traditional CP training sheet into a clean web experience:

- Phase-based learning path.
- Topic pages with curated practice problems.
- Problem progress tracking in the browser.
- Daily streak and completion celebration effects.

## Key Features

- Clear roadmap divided into 4 phases.
- Dedicated page for each topic.
- Direct links to playlists and problem statements.
- Difficulty categories: Easy, Medium, Hard.
- Problem metadata: level, judge, and tags.
- Solved problems saved in localStorage.
- Per-topic progress and global progress summary.
- Global daily streak tracking.
- Confetti and sound feedback when solving a new problem.
- Difficulty filters on topic pages.
- Mobile-friendly layout.

## Live Website

Production URL:
https://cp-roadmap.netlify.app/

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Python scripts for data and page generation
- Google Sheets as source data
- localStorage for persistence
- Canvas Confetti
- Web Audio API
- Google Fonts

## Project Structure

```text
MSCP/
|-- index.html
|-- sheet.csv
|-- netlify.toml
|-- assets/
|   |-- home.css
|   |-- home.js
|   |-- topic-page.css
|   |-- topic-page.js
|   `-- topics-data.js
|-- images/
|-- pages/
|   |-- contest-strategies.html
|   |-- cpp-4-competitions.html
|   |-- data-structures.html
|   |-- dynamic-programming.html
|   |-- graph-theory.html
|   |-- greedy-algorithms.html
|   |-- math.html
|   |-- measuring-algorithms-performance.html
|   |-- newcomers.html
|   |-- practice-div2-a.html
|   |-- practice-div2-b.html
|   |-- search-techniques.html
|   |-- string-processing.html
|   |-- thinking-techniques.html
|   `-- training-roadmaps.html
`-- scripts/
	|-- build_topics_from_sheet.py
	`-- gen_topic_pages.py
```

## Learning Phases

1. Foundations
2. Core Topics
3. Advanced Topics
4. Practice and Contests

## Data and Page Generation

When the Google Sheet changes, regenerate content using:

- scripts/build_topics_from_sheet.py
- scripts/gen_topic_pages.py

## Deployment

This project is deployed on Netlify as a static site.
Netlify configuration is in netlify.toml.

## Notes

- Progress is browser-local and may differ between devices.
- This site is an organization and tracking layer for the roadmap, not a replacement for the original educational content.

## License

Personal educational project inspired by Dr Mostafa Saad's CP roadmap.
