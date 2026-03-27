# SWAN AI Assistant 
> Built by **Aryan Sharma**

A Chrome extension made to reduce the hectic task of going through hundreds of reviews manually by generating concise summaries inside a **Chrome side panel**.
---

## Features

- Chrome extension built with **Manifest V3**
- Opens a **side panel** directly from the toolbar
- Scrapes product reviews and relevant product data
- Generates readable summaries from scraped content
- Clean popup → background → side panel architecture

---

## How It Works

1. User clicks the extension icon
2. A side panel opens
3. Clicking the action button inside the side panel:
   - Scrapes reviews from the current Amazon product page
   - Processes and filters relevant information
   - Displays a concise summary in the side panel

> The current version focuses on review extraction and summarization.  
> Automatic product detection is part of the roadmap.

---

## Tech Stack

- **Chrome Extensions (Manifest V3)**
- **JavaScript**
- **HTML / CSS**
- **DOM-based Web Scraping**

---

## Environment Variables

AI integration is configurable.

Create a `.env` file in the root directory:

GEMINI_KEY=your_api_key_here

>⚠️ Do not commit .env files — they are ignored via .gitignore.

---

## Installation (Development)
Clone the repository

- git clone https://github.com/AryanSharma48/swan-ai-assistant.git

- Open Chrome and navigate to:

- chrome://extensions

- Enable Developer mode (top right)

- Click Load unpacked

- Select the project directory

- Open an Amazon product page and launch the extension

### Roadmap

 - Automatic Amazon product page detection

 - Advanced review scraping and preprocessing

 - Custom ML model trained on domain-specific e-commerce data

---
### Notes
>This project is under active development

>Scraping logic may change as Amazon updates its DOM structure

>AI components are modular and can be swapped or upgraded

---

### Contributing
Contributions, ideas, and feedback are welcome.
Feel free to open an issue or submit a pull request.
