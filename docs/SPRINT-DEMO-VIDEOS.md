# Sprint Demo Videos - Recording Guide

This guide explains how to obtain the Sprint 1 and Sprint 2 demo videos for Team 13. The repository does not store large video files. Record each sprint from the matching commit, then upload the videos to the team's shared drive (or YouTube as unlisted) and add the links to the submission.

| Sprint | Commit | What the snapshot shows |
|---|---|---|
| Sprint 1 | `9162f6a` | Samples, Compare, side-by-side diff, Load file |
| Sprint 2 | `e59b03e` | Conflict list, counter, Accept A/B/Both, Merged Result, Undo/Redo |
| Sprint 3 | `main` | Everything, including markers, Apply Merge, Download/Copy and the restored features |

## 1. Prepare the sprint snapshots

Create a separate Git worktree for each sprint so your normal `main` checkout stays untouched.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-sprint-worktrees.ps1
```

The script creates `Team-13-sprint1`, `Team-13-sprint2` and `Team-13-sprint3` next to this repository. Alternatively, create them by hand:

```powershell
git worktree add --detach ..\Team-13-sprint1 9162f6a
git worktree add --detach ..\Team-13-sprint2 e59b03e
git worktree add --detach ..\Team-13-sprint3 origin/main
```

For each worktree, run:

```powershell
npm install
npm start
```

Sprint 1 uses `npx serve` and normally opens `http://localhost:3000`. Sprint 2 and Sprint 3 use `http-server` on `http://localhost:8080`.

## 2. Recording setup

- Use a 1440x900 or 1920x1080 browser window at 100% zoom.
- Close notifications, personal tabs and the bookmarks bar.
- Record with Xbox Game Bar (`Win+G`), OBS Studio, or any screen recorder. Enable the microphone if you are narrating.
- Keep each video to 2-3 minutes. One continuous take per sprint is fine.
- Suggested file names: `Team13-Sprint1-Demo.mp4`, `Team13-Sprint2-Demo.mp4`, `Team13-Sprint3-Demo.mp4`.

## 3. Sprint 1 script (`9162f6a`) - about 2 minutes

Goal: show the first working comparison flow.

1. Start the Sprint 1 worktree and open the local URL.
2. Point out the Version A and Version B panes and their line counters.
3. Choose the `separate-edits` sample and click **Load sample**.
4. Click **Compare**.
5. Show the side-by-side diff, the `+`, `-` and `~` change markers, and the summary text.
6. Scroll the diff and point out that the two versions are shown next to each other.
7. Use **Load file** on one pane to show that a local text file can be loaded.
8. Close with: "Sprint 1 delivered the input panes, samples, comparison, side-by-side diff and file loading."

## 4. Sprint 2 script (`e59b03e`) - about 2-3 minutes

Goal: show conflict tracking and resolution.

1. Start the Sprint 2 worktree and load the `separate-edits` sample.
2. Click **Compare**.
3. Point out the conflict list and the counter (`total`, `resolved`, `remaining`).
4. Resolve Conflict 1 with **Accept A** and Conflict 2 with **Accept B**.
5. Show the status badges and that the remaining count reaches zero.
6. Show the editable **Merged Result** pane.
7. Use **Undo** and **Redo** and point out that the counters and statuses update.
8. Load the `same-line-conflict` sample, resolve it with **Accept Both**, and show the merged output.
9. Close with: "Sprint 2 added conflict grouping, the live counter, per-conflict resolution, the merged result editor and undo/redo."

## 5. Sprint 3 script (`main`) - about 3 minutes

Goal: show the complete final build.

1. Start the Sprint 3 worktree and load the `same-line-conflict` sample.
2. Show the Git-style `<<<<<<<`, `=======` and `>>>>>>>` markers while the conflict is open.
3. Use **Previous** / **Next** or the `[` and `]` keys to move between conflicts.
4. Resolve a conflict, show the **Manual** status after editing the merged pane, then use **Undo**.
5. Show that **Apply Merge** is disabled while a conflict remains open and enabled once all are resolved.
6. Click **Apply Merge**, then **Download** the merged file and **Copy** it.
7. Close with: "Sprint 3 completed the merge workflow with markers, guarded Apply Merge, manual edits, export and the full automated test suite."

## 6. Publish and link the videos

Do not commit large `.mp4` files to Git. Upload each video to the team drive or YouTube (unlisted) and add the links here after recording:

| Sprint | Video link | Recorded by | Date |
|---|---|---|---|
| Sprint 1 | _add link_ | _name_ | _date_ |
| Sprint 2 | _add link_ | _name_ | _date_ |
| Sprint 3 | _add link_ | _name_ | _date_ |

## 7. Final checklist

- [ ] Sprint 1 video shows samples, Compare, side-by-side diff and Load file.
- [ ] Sprint 2 video shows the conflict list, counter, Accept A/B/Both, Merged Result and Undo/Redo.
- [ ] Sprint 3 video shows markers, Apply Merge guard, Download/Copy and final features.
- [ ] Each video is 2-3 minutes and has clear narration or captions.
- [ ] All three videos are uploaded and the links are added to the table above.
