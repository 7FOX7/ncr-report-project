# This is README file. It contains important info

## Make sure that our web application meets all of the following requirements to get a good grade

# Flow

+ [X] **clean** and **consistent** layout (in other words - Vishal, make sure you don't put too much into a single page)
+ [X] navigate entirely via keyboard (no mouse required)
+ [X] clearly see what’s focused when tabbing
+ [X] use at least two ways to locate pages (e.g., a navigation menu and a search bar or breadcrumbs)
+ [X] never lose their place — avoid sudden layout or focus shifts

# Design

+ [X] provide guidance, labels, and instructions on every input or interactive area
+ [X] include “Are you sure?” confirmations, undo actions, and success/failure messages
+ [X] be consistent: button labels, colors, icons, and help placement should match across all pages

# Perceivability

+ [X] add ``alt`` for each image and ``transcript`` for each video
+ [X] color is not the only way to convey information (e.g., use icons or labels too)
+ [X] contrast ratio ``≥ 4.5 : 1`` for text vs. background
+ [X] layout works in portrait or landscape (no locked orientation)
+ [X] text should reflow properly when zoomed up to 400%
+ [X] avoid flashing content

# Operability

+ [X] every interactive element can be reached with ``Tab``, activated with ``Enter`` or ``Space``
+ [X] breadcrumbs show location within the site

# Understandability

+ [X] navigation and help consistent across pages
+ [X] labels and instructions always visible and descriptive (e.g., “Email address” **not** “Enter here”)
+ [X] even children (_not too young though_) can understand what is written
+ [X] language tag in HTML (``<html lang="en">``)

# Input Assistance

+ [X] when a user enters data:
  + [X] errors are detected and described in text near the field
  + [X] suggestions are provided when possible (e.g., “Did you mean...?”)
  + [X] before submitting critical info (legal, payment, etc.), user can:
    + [X] review & confirm, or Undo submission
+ [X] autofill should be available.
+ [X] **NO CAPTCHA, LOL**

# Robustness

+ [X] use valid HTML (closing tags, semantics etc.)
+ [X] use ARIA ``roles`` and ``labels`` when needed:
  + [X] ``role="status"`` for dynamic updates (e.g., “5 results found” after search)
  + [X] ``aria-label`` for custom buttons and icons
+ [X] test with a screen reader (like NVDA or VoiceOver)
