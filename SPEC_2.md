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
### Phase 2:
#### High-level:
- Set up dexie cloud sync. I have already provisioned a database on dexie cloud. See the files dexie-cloud.json and dexie-cloud.key. Also add these two files to the gitignore. Set up login via email for the app, where authentication will be done by Dexie cloud. 
- Also make it ready for deployment on Vercel as a web app. So create the service worker if already not created, and optimise it for running on iOS as a PWA.
- in Phase 3, more media types will be added

#### Design Specifications:
##### Login Page: 
- Login page should be simple - Just the text field to enter the email
- The OTP screen should also be simple. However, ensure that the OTP input field takes both numerical and text input.

##### Device-Specific Tweaks:
- This PWA will be deployed on an iOS device with a viewport size of 390px × 844px 
- ensure there is no vertical nor horizontal scroll after the set up the PWA on this device.
