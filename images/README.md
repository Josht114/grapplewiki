# Your own photos

Put your own photos here (.jpg, .jpeg, .png, .gif, .webp or .avif) and add them to a page's `## Images` section, or the **Images** box in the page editor:

```markdown
![1. Grip the far collar (my photo)](images/paper-cutter-choke/1-grip.jpg)
```

- Move pages show a dashed **Photo needed** box for each key step without a photo, written as `![2. Trap their foot](needed)`. When you have the photo, save it in the page's folder and replace `needed` with its path.
- Every wiki page has its own folder here, named after the page's id (its file name in `pages/`), e.g. `images/paper-cutter-choke/` for `pages/techniques/paper-cutter-choke.md`. Put a page's photos in its folder. (The `.gitkeep` file in each folder just keeps the empty folder in Git.)
- Use letters, digits, `-`, `_` and `.` in file and folder names. Avoid spaces; if a name has one, write it as `%20` (`my%20photo.jpg`).
- The photos are committed and pushed with your pages when you run `finish.bat`. Large photos make the repository big, so shrink them to about 1200 px wide first.
