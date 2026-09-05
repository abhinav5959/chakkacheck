# Transform ChakkaCheck Homepage to Proverb Concept

This plan outlines the steps to rebuild the homepage content and structure to focus on the Malayalam proverb "ചക്ക വീണു മുയൽ ചത്തു?" (Chakka veenu muyal chathu?), transforming it into a polished, Kerala-storybook-inspired AI experiment showcase.

## Proposed Changes

### 1. Fonts & Global Layout (`index.html`, `index.css`)
- **[MODIFY] `index.html`**: Add Google Fonts import for `Noto Serif Malayalam` or `Anek Malayalam` to ensure the Malayalam proverb text renders beautifully.
- **[MODIFY] `index.css`**: Add smooth scroll behavior (`scroll-behavior: smooth;`) to the `html` element to enable graceful navigation from the navbar.

### 2. Main Hero & Upload Interface (`App.jsx`, `App.css`)
- **[MODIFY] `App.jsx`**: 
  - Update the main heading to "ചക്ക വീണു<br>മുയൽ ചത്തു?" with the supporting English text.
  - Revamp the Upload Card: Change title to "Check the Scene", update dropzone text, add "Choose an Image" button.
  - Remove fake AI analysis results. Structure the post-upload state to just show the preview, filename, remove button, and "Analyze with ChakkaCheck" primary button, ready for real backend integration.
  - Add decorative storybook elements (e.g., "THUD!" label near the hero, wooden signs like "SOME THINGS JUST HAPPEN BY LUCK!").
- **[MODIFY] `App.css`**: Style the new hero content, Malayalam typography, and the revamped upload card layout.

### 3. New Content Sections (`App.jsx`, `App.css`)
- **[MODIFY] `App.jsx`**: Add the following sections sequentially below the hero:
  - **How ChakkaCheck Works**: A 4-card grid explaining the literal AI interpretation.
  - **The Proverb Explanation**: A clean section titled "What does it mean?".
  - **Why ChakkaCheck? (About)**: A section explaining the playful nature of the project with a technology stack line.
  - **Fun Facts**: An 8-card grid detailing jackfruit facts and the joke behind the AI model.
  - **Proverb Quote**: A tasteful, subtle quote block near the footer.
- **[MODIFY] `App.css`**: Create styles for the new sections, ensuring they follow the "Kerala illustrated storybook" visual direction (warm creams, natural greens, rounded cards, soft shadows). Ensure full responsiveness (1-2 columns on mobile, 3-4 on desktop).

### 4. Navigation Links (`Navbar.jsx`)
- **[MODIFY] `Navbar.jsx`**: Ensure the existing `href` attributes (`#home`, `#analyze`, `#about`, `#fun-facts`) map correctly to the `id`s of the newly created sections so the navbar functions seamlessly.

## Verification Plan
1. **Visual Check**: Verify the Malayalam font loads and renders the main heading correctly.
2. **Functionality Check**: Test the upload card flow (drag & drop/click, preview, reset) to ensure no fake results appear.
3. **Navigation Check**: Click all navbar links (Desktop & Mobile) to ensure smooth scrolling to the correct sections.
4. **Responsive Check**: Verify that the 8-card Fun Facts grid and the 4-card How It Works grid stack correctly on smaller screens.
5. **Theme Check**: Ensure all new sections maintain readability and aesthetic appeal when switching between the Morning (Light) and Evening (Dark) themes.
