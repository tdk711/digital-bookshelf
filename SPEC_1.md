# Digital Bookshelf

## Overview:
A simple PWA app to catalog book, games, movies, tv shows and music. It features cards in a grid with three distinct sections for currently listening/playing/watching, upcoming and watched/played/listened

## Tech Stack:
- Progressive Web App
- Svelte5 + Vite
- Tailwind CSS
- IndexedDB + Dexie Cloud for sync
- Vercel for deployment

## Requirements:
### Phase 1:
#### High-level:
- Create a simple web app according to the design specifications
- Do not setup dexie cloud for sync, this will be tackled in phase 2
- node is already installed in this machine, you will have to download the required libraries and packages

#### Data Model:
- For now, this app will only catalog music and video games.
- There will be two different table for music and video games.
- All data in the data model will be entered manually, no need to pull from any online database.
- The status fields will have the following colors: finished: green, current: red, abandoned: grey and upcoming: yellow

##### Video Games:
- A video game record will include the following data fields: name, link to image, genre, rating (out of 10, with 0.5 step), Date started, date finished, status (currently playing, finished, abandoned, upcoming), platform (mobile, ps4, pc), review (which will be a descriptive text field), date added (i.e. date the record was added, but set this automatically, do not expose to the user)

##### Music:
- A music record will be at the album level and will contain the following data fields: name of album, link to cover art, genre, rating (out of 10, with a 0.5 step), date listened, name of artist, status (currently listening, finished, abandoned, upcoming), date added (i.e. date the record was added, but set this automatically, do not expose to the user), review (which will be a descriptive text field)
- An album should also allow the user to add multiple songs within it, each with its own name, rating, date listened, status, date added, review

#### Design Specifications:
##### Landing Page: (First page that a user lands on after opening/logging in)
- Landing page should contain a grid with each media type, with a simple icon representing each. Right now, there are only two media types: video games and music
- Clicking on a media type should take you to that specific page
- On the left, a sidebar menu should also be present. The sidebar should again contain a list of all the media types with icon and a dark mode toggle at the bottom.

##### Media-specific Page:
- This is the primary page for each media type. 
- At the top right of this page, there should be a plus button to add new records
- Each record should be displayed as a vertical card in a grid layout. Grid layout should be responsive, with the minimum being 2x2
- The first row should contain currently listening/playing records, with the name of the status at the top.
- Next row will be the records for upcoming
- Finally, show the finished and abandoned records.
- current records and finished/abandoned records should be sorted by date started or date listened, with the newest first
- Upcoming should be sorted by date added, with oldest first

##### Record Card:
- A card should show the image, the name at the bottom and the status. The status field should ideally be in a box with the above mentioned color scheme for both background and textt color. Rating should also be shown if present
- clicking on a card should open it, with all the parameters being editable. The image should be at the top left, the review field as a rectangle at the bottom and all other fields in the top right quadrant (typical layout)
- The link to image field should automatically fetch the image from the URL
- There should be two options as well: Save and close, discard changes and close at the bottom of the card

#### Font and Color Scheme:
- Primary accent color: #366D99
- Serif Font: Lora
- Sans Serif Font: Inter

