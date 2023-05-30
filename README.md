# REScala Inspector

This project implements an interactive inspector for [REScala](https://www.rescala-lang.com/) applications, realized
as a Chromium DevTools extension. Features of the inspector include:

- Complete visualization of the entire graph
- Going back and forth in time
- Showing only sections of the entire graph
- Smooth animation of changes

This project can not be used to change the state of the REScala application, but it can be used to inspect and debug it.

## Implementation
The inspector is implemented using a force-directed graph layout rendered in an HTML canvas. The UI elements are
implemented in Svelte. The core code can be found in `extension/panel`.

## Setup & Installation
Within the cloned repo, run `npm install` to install all of the required dependencies. Then, to bundle the code into
useable JavaScript, run `npm run watch`. The resulting `dist` folder can be directly loaded as an unpacked extension
by the Chromium DevTools with developer mode on.