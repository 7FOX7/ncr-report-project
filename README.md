# This is README file. It contains important info 

## Make sure that our web application meets all of the following requirements to get a good grade

# Flow
+ [ ] **clean** and **consistent** layout (in other words - Vishal, make sure you don't put too much into a single page)
+ [ ] navigate entirely via keyboard (no mouse required)
+ [ ] clearly see what’s focused when tabbing
+ [ ] use at least two ways to locate pages (e.g., a navigation menu and a search bar or breadcrumbs)
+ [ ] never lose their place — avoid sudden layout or focus shifts


# Design
+ [ ] provide guidance, labels, and instructions on every input or interactive area
+ [ ] include “Are you sure?” confirmations, undo actions, and success/failure messages
+ [ ] be consistent: button labels, colors, icons, and help placement should match across all pages


# Perceivability 
+ [ ] add ```alt``` for each image and ```transcript``` for each video
+ [ ] color is not the only way to convey information (e.g., use icons or labels too)
+ [ ] contrast ratio ```≥ 4.5 : 1``` for text vs. background
+ [ ] layout works in portrait or landscape (no locked orientation)
+ [ ] text should reflow properly when zoomed up to 400%
+ [ ] avoid flashing content


# Operability
+ [ ] every interactive element can be reached with ```Tab```, activated with ```Enter``` or ```Space```
+ [ ] breadcrumbs show location within the site


# Understandability
+ [ ] navigation and help consistent across pages
+ [ ] labels and instructions always visible and descriptive (e.g., “Email address” **not** “Enter here”)
+ [ ] even children (_not too young though_) can understand what is written
+ [ ] language tag in HTML (```<html lang="en">```)


# Input Assistance
+ [ ] when a user enters data:
    + [ ] errors are detected and described in text near the field
    + [ ] suggestions are provided when possible (e.g., “Did you mean...?”)
    + [ ] before submitting critical info (legal, payment, etc.), user can:
        + [ ] review & confirm, or Undo submission
+ [ ] autofill should be available.
+ [ ] **NO CAPTCHA, LOL**


# Robustness
+ [ ] use valid HTML (closing tags, semantics etc.)
+ [ ] use ARIA ```roles``` and ```labels``` when needed: 
    + [ ] ```role="status"``` for dynamic updates (e.g., “5 results found” after search)
    + [ ] ```aria-label``` for custom buttons and icons
+ [ ] test with a screen reader (like NVDA or VoiceOver)