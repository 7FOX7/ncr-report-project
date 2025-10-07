# This is README file. It contains important info 

## Make sure that our web application meets all of the following requirements to get a good grade

# Flow
+ [x] **clean** and **consistent** layout (in other words - Vishal, make sure you don't put too much into a single page)
+ [x] navigate entirely via keyboard (no mouse required)
+ [x] clearly see what’s focused when tabbing
+ [x] use at least two ways to locate pages (e.g., a navigation menu and a search bar or breadcrumbs)
+ [x] never lose their place — avoid sudden layout or focus shifts


# Design
+ [x] provide guidance, labels, and instructions on every input or interactive area
+ [ ] include “Are you sure?” confirmations, undo actions, and success/failure messages
+ [x] be consistent: button labels, colors, icons, and help placement should match across all pages


# Perceivability 
+ [x] add ```alt``` for each image and ```transcript``` for each video
+ [x] color is not the only way to convey information (e.g., use icons or labels too)
+ [x] contrast ratio ```≥ 4.5 : 1``` for text vs. background
+ [x] layout works in portrait or landscape (no locked orientation)
+ [x] text should reflow properly when zoomed up to 400%
+ [x] avoid flashing content


# Operability
+ [x] every interactive element can be reached with ```Tab```, activated with ```Enter``` or ```Space```
+ [x] breadcrumbs show location within the site


# Understandability
+ [x] navigation and help consistent across pages
+ [x] labels and instructions always visible and descriptive (e.g., “Email address” **not** “Enter here”)
+ [x] even children (_not too young though_) can understand what is written
+ [x] language tag in HTML (```<html lang="en">```)


# Input Assistance
+ [ ] when a user enters data:
    + [ ] errors are detected and described in text near the field
    + [ ] suggestions are provided when possible (e.g., “Did you mean...?”)
    + [x] before submitting critical info (legal, payment, etc.), user can:
        + [x] review & confirm, or Undo submission
+ [ ] autofill should be available.
+ [x] **NO CAPTCHA, LOL**


# Robustness
+ [x] use valid HTML (closing tags, semantics etc.)
+ [ ] use ARIA ```roles``` and ```labels``` when needed: 
    + [ ] ```role="status"``` for dynamic updates (e.g., “5 results found” after search)
    + [x] ```aria-label``` for custom buttons and icons
+ [ ] test with a screen reader (like NVDA or VoiceOver)