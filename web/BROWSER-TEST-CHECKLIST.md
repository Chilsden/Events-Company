# Manual browser test checklist (Check-in Studio: guest management and configurable inputs)

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

## Configurable inputs and signature collection (new)

Use a second event for this part ("Signature Test Event"), plus the first one to check nothing changed there.

25. On the new event press **Choose inputs**. Expect: the guest list and attendance ticked, signature capture not ticked, and a list headed "Planned, not available yet" with drawing, photograph, video, text messages and consent shown as plain text with **no** tick boxes.
26. Press **Signatures only**. Expect a confirmation and only "Signature capture" ticked. Open **Check-in Studio** for the event: it should say the guest list is switched off and show no add-guest form, no import button and no attendance totals.
27. Go back to the first event's inputs: it must still have the guest list and attendance ticked (one event's setting must not change another's), and its guest list, check-in and undo must still work.
28. On the signatures-only event press **Open collection screen**. Expect a box to draw in, instructions, buttons Undo last stroke / Clear / Preview signature (the first two greyed out until you draw), and **no** name, email, phone, guest or RSVP fields anywhere.
29. **Mouse:** draw a signature with the mouse. Check it follows the pointer smoothly, a stroke ends when you let go, and drawing outside the box edge does not break anything.
30. **Touchscreen** (a laptop or tablet with touch, if you have one; otherwise note "not tested"): draw with a finger. The page must not scroll or zoom while drawing in the box. Try two fingers; nothing should break. Rotate a tablet if possible.
31. Press **Undo last stroke**: only the last stroke disappears. Press **Clear**: everything disappears. Draw a tiny dot and press **Preview signature**: you should be told it is too small.
32. Draw a proper signature and press **Preview signature**. Expect the picture, the display-permission wording ("Demonstration only ... not real consent"), two choices with **neither selected**, and Back to drawing / Submit signature. Press **Back to drawing**: your drawing is still there.
33. Press **Preview signature** then **Submit signature** *without* choosing: expect a clear message that you must choose, and your signature still on screen. Choose **Yes** and submit: expect a confirmation and a fresh empty box. Submit a second one choosing **No**. You were never asked for a name.
33a. (Optional, needs the guest list and signatures both on in the first event's inputs.) In the first event's Check-in Studio press **Take a signature** on one guest. The collection screen should say "This signature will be linked to <that guest>" and show no other guest names and no drop-down. Submit one, then check Collected signatures says "Linked to a guest: Yes" without showing the name.
34. Open **Collected signatures**. Expect two pictures, times, "No (anonymous)", one "Display permission given" and one "Display permission not given", and "Eligible for display by other products ... 1 of 2".
35. Press **Withdraw display permission** on the first. Expect a confirmation, the picture still shown, status "withdrawn", and "... 0 of 2". There should be no way to delete or edit a signature.
36. Open **View audit history** for the event: it should list the inputs being switched, the two submissions and the withdrawal, with no names.
37. On **Choose inputs** untick signature capture and save. The collected signatures should still be listed. Open the collection screen: it should say nothing is switched on. Switch it back on.
38. Restart the server (Ctrl+C, `npm run dev`). The input settings, both signatures and the withdrawal should all be there.

### Keyboard and assistive technology (signature screen)
39. Tab to the drawing area (a labelled "Signature drawing area"): it should show a clear focus outline. Press **Space** (message "Pen down"), press arrow keys to draw (Shift for bigger steps), press **Space** again ("Pen up"). Preview and submit using only the keyboard. Check the radio buttons and every button can be reached and used.
40. With a screen reader (NVDA with Chrome or Edge is free): is the drawing area announced with its instructions? Are "Pen down", "Pen up", "Last stroke removed" and "Signature cleared" announced? Is the "choose one" requirement on the permission group announced? Note honestly what works and what does not; the drawing box is expected to be hard to use with a screen reader alone, and there is no other way to sign in this prototype.
41. Narrow widths (360, 768, 1024 px in the browser's device toolbar): the drawing box should fill the width at roughly the same shape, buttons stay large enough to tap, the three quick-choice buttons stack, and the collected-signatures cards fit without sideways scrolling.
42. Dark mode: the box, the pen, the strokes and the permission box must be readable.

## Record
Note for each numbered step: pass or what happened, with the browser and version. Report anything that failed to the Lead Orchestrator. Passing this checklist does not make the prototype secure; there is still no sign-in.
