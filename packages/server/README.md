# C2 App server

The server starts a simple node application, that:

- Serves the GUI

## Develop

```bash
npm i
npm start
```

## Resetting the DB

After sending a `standard_geojson` message, whose `layerId` equals `CLEAR_ALL_COLLECTIONS`, the DB is reset.