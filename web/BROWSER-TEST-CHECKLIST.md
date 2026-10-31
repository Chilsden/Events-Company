# Manual browser test checklist (Check-in Studio guest management)

No browser automation was run for this slice. The automated tests and the smoke script check the server, the HTML and the database; they do **not** show how the pages look or behave in a real browser, with a keyboard, on a phone, or with a screen reader. Please do this once and note anything odd. Use synthetic names only.

Setup: `cd web`, `npm install`, `npm run reset-data` (optional, for a clean start), `npm run dev`, open <http://127.0.0.1:3000>. Test in Chrome or Edge first; repeat the keyboard and phone-size parts in a second browser if you can.

## Create the event and import ten guests
1. **Events > New event**: create "Browser Test Party" (any future date, any location). You should land on its details page showing attendance 0 / 0 / 0.
2. Press **Open Check-in Studio**. Page shows the yellow "Local demonstration only" bar, an empty-state message, and 0 / 0 / 0.
3. Press **Import guests from CSV**. Read the rules. Press the **synthetic example file** link: a file `example-guests.csv` downloads (ten names).
4. Choose that file and press **Check file and preview**. Expect: "10 guests will be imported", ten names listed, a button "Import 10 guests", and "Nothing has been saved yet". Focus should move to the Preview heading.
5. Press the import button **once**, then try double-clicking it on a second attempt later (use a second file with different names; the button should disable while working). Expect: back on Check-in Studio with "10 guests imported from the file." and totals 10 / 0 / 10.
6. Try bad files and read the messages (each should be plain, with no technical wording): a `.txt` file renamed to `.csv` with random text, a CSV whose header is `email`, a CSV with two columns, an empty file. Nothing should be imported.

## Edit, check in, undo, check in again
7. On one guest press **Edit name**. Change the spelling and **Save name**. Expect: back on the list, the page scrolled to that guest, a message "The guest's name is now ...". Try saving an empty name and a name like `=1+1`: you should get an error beside the field and the cursor should remain usable.
8. Press **Check in** on that guest. Expect: green-bordered message "... is now checked in.", the row shows "Checked in at HH:MM" with a tick, and totals 10 / 1 / 9. The message should stay visible at the top while you scroll.
9. Press **Undo check-in** on the same guest. Expect: "check-in was undone", the row says "Not yet checked in", totals 10 / 0 / 10.
10. Check them in again. Totals 10 / 1 / 9.
11. Open **View audit history**. Expect newest-first rows: Checked in again, Check-in undone, Checked in, Guest name changed, Guests imported from CSV (10). Each says "Local demonstration operator". There should be no edit or delete buttons anywhere.
12. Search for part of a name on the Check-in Studio page. Expect only matching guests. **Clear search** returns the full list.

## Forged links
13. Copy the Check-in Studio address, then type `?notice=checked-in` after it and press Enter. Expect **no** green message. Also try `?r=abc`. Expect no message.

## Restart
14. Stop the server (Ctrl+C), run `npm run dev` again, reload. Guests, the new name, the check-in state, totals and the audit history should all still be there.

## Keyboard only (no mouse)
15. Starting at the top of Check-in Studio, press Tab repeatedly. Check: the "Skip to main content" link appears first; the order is sensible; every button and link shows a clear focus outline; you can reach **Check in**, **Undo check-in** and **Edit name** for each guest and press them with Enter or Space.
16. After a check-in or undo, focus should land on that guest's row (outline visible). Press Tab: the next stop should be that row's buttons, so you can carry on without starting from the top.
17. Make the add-guest form fail (leave it empty and press Add guest). Expect the error to be shown beside the field and read out by a screen reader if you have one running; Tab should reach the field.
18. On the import page use only the keyboard to choose a file, preview, and import.

## Screen reader (if you have one: NVDA with Chrome or Edge on Windows is free)
19. After pressing **Check in**, listen: it should announce the confirmation (for example "Alex Example is now checked in") soon after the page loads, once, not twice. Same for **Undo check-in** and for errors (errors should be announced more urgently).
20. Buttons should be read with the guest's name ("Check in Alex Example"), not just "Check in".
21. The audit table should be read as a table with column headings.

## Phone and tablet sizes
22. The server only listens on this computer, so a real phone cannot reach it. Use the browser's device toolbar instead (F12, then the phone icon) and try widths 360, 768 and 1024 pixels.
23. At 360 px: no sideways scrolling on the main pages (the audit table may scroll sideways inside its own box, which is expected); the three attendance numbers stack; buttons are at least as tall as your thumb; text is readable without zooming; the pinned message does not hide the guest you just used.
24. Turn on dark mode in your operating system. Text, buttons and the date picker should remain readable.

## Record
Note for each numbered step: pass or what happened, with the browser and version. Report anything that failed to the Lead Orchestrator. Passing this checklist does not make the prototype secure; there is still no sign-in.
