# Included roadmap scope

Source: `ROADMAP.md`, Sprint 3 section.

- S3-04 (#24): Git-style conflict markers. As a user, I want unresolved conflicts shown with Git-style markers so I recognise them. Done when open conflicts show the standard conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).

Roadmap note: show unresolved conflicts in the merged text as

```
<<<<<<< A
(A lines)
=======
(B lines)
>>>>>>> B
```

and remove the markers as each conflict is resolved. Take care that S3-07 treats leftover markers as unresolved.

Depends on S2-04 (Accept A, B and Both) and S2-05 (editable Merged Result pane), whose code is included here so the tests have something to run against.
