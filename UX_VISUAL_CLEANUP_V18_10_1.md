# v18.10.1 Visual Cleanup

Final UI cleanup rule set:
- no browser-style underlined links in application UI
- list containers do not draw separators
- rows own exactly one separator between siblings
- last row in a group has no extra bottom separator
- focus remains visible via outline instead of underline
- legacy CSS remains compatible but the final cleanup layer is loaded last
