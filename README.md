##### Will be using this as the base template for integrating  Neo4j, Gatsby and GraphQL - 
- based on video [Getting started with Neo4j, Gatsby, and GraphQL | Building A Travel Guide With Gatsby](https://www.youtube.com/watch?v=siPmZRTRki8&ab_channel=Neo4j)


- Go over [Using Third-party GraphQL APIs](https://www.gatsbyjs.com/docs/third-party-graphql/)
- Using [Neo4j SandBox](https://sandbox.neo4j.com/) for OSM Data
- https://docs.mapbox.com/mapbox-gl-js
---

Finds a route between two points of interest - see [Neo4j Shortest Path](https://neo4j.com/docs/graph-data-science/current/alpha-algorithms/shortest-path/)
```
match (p1:PointOfInterest {name: "Central Park Tennis Center"})
match (p2:PointOfInterest {name: "The Pond"})
match sp=shortestPath((p1)-[:ROUTE*..200]-(p2))
unwind nodes(sp) as node
return {latitude: node.location.latitude, longitude: node.location.longitude}
```
Note that above query might not be the actual shortest distance between two points.
It brings back shortest numbers of relationships.
You might want use other Graph Data Science alogs for shortest weighted path.
---

#### To run
- need to get access to neo4j sandbox for OSM data.
- Add your neo4j sandbox bolt url and credentials to `neo4j-graphql` directory's `.env` file
- run npm i in both the root `gatsby-project` and `neo4j-grpahql` directories
- cd to `neo4j-grpahql`start neo4j backed graphql server (Apollo) and run `npm start`
- `cd ..` and run `gatsby develop`
- Example graphql query:
```
{
  PointOfInterest(first: 1) {
    name
    node_osm_id
    location {
      latitude
      longitude
    }
    routeToPOI(poi: "246164695") {
      latitude
      longitude
    }
    node_osm_id
    location {
      longitude
      latitude
    }
  }
}
```
