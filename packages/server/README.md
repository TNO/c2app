# C2 App server

The server starts a simple node application, that:

- Serves the GUI
- Listens to Kafka, e.g. to receive GeoJSON files that are published to the `standard_geojson` topic.

## Develop

```bash
npm i
npm start
```

## Resetting the DB

After sending a `standard_geojson` message, whose `layerId` equals `CLEAR_ALL_COLLECTIONS`, the DB is reset.

## Options to add (from felt.com)

- When selecting an image icon, also show what it looks like
- Have default icons, e.g. circles, each with a different color, pins, or symbols (circle, square, diamond, triangle, cross, plus, start, heart)
- Popups have three areas:
    - Title and description and close. Also allows to upload an image or create/join a group?
    - A tab for the style, e.g. for an icon, it is the symbol and a switch whether or not to show the label (title)
    - A tab for details: Allows the user to add their own key-value pairs in a details tab
    - The title area also has an actions menu (...)
        - Zoom to fit (shortcut key F)
        - Cut, Ctrl-X
        - Copy, Ctrl-C
        - Duplicate, Ctrl-D
        - Delete, Del
        - Lock (Ctrl+shift+L)
        - Group (None or leave, Group names (to join, shows existing groups, and the one you are in), Create group `Ctrl+G`, ungroup/remove from group `Ctrl+Shift+G`)
        - Arrange (Bring to front of group `]`, Send to back of group `[`, Bring forward in group `Ctrl+]`, Send backward in group `Ctrl+[`, )
        - Export (e.g. to GeoJSON or GeoPackage)
        - Actions
    - Drag and drop a GeoJSON file and add is as a `Data layer`, great for geo data, or as `Elements`, i.e. foreground objects you can edit. After dropping, it is added to the legend as a new layer. Took quite long. Other supported types: shp, tif, gpkg, zip, kml, csv, xslx
    - In the legend, there is the title of the layer, a visibility button, and a menu
        - Zoom to fit (F)
        - Show only this
        - View data: shows table with data at the bottom of the screen and a menu
        - Transform...
        - Copy/duplicate/delete
        - Arrange > 
        - Actions > Reset styles to defaults, convert to elements, merge with..., publish..., view source
    - Viewing a layer in popup:
        - Fit, show/hide data table, transform (see below), delete, legend actions
        - Tab with Style, legend, data, info
        - Style tab: simple, categories, or heatmap
        - Simple style: Points size, fill, stroke, opacity and labels (label by selecting a property, set size, color, halo, and style)
        - Things like fill, stroke can either be set, or use zoom based styles
    - Navbar with logo, Pin (pin P, line L, route R, polygon O, circle I). I can move/edit my icons until I lock them in the actions menu.

- Add a layer with emoji icons